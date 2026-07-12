// pages/contacts/contacts.js — 老人列表（首页 · Tab1）
const { queryCollection } = require('../../utils/cloud');
const { getVolunteer, requireAuth } = require('../../utils/auth');
const { FILTER_TYPES, CALL_STATUS, OVERDUE_DAYS, COLLECTIONS } = require('../../utils/constants');
const { formatDate, formatRelative, getOverdueDays, isToday } = require('../../utils/format');

Page({
  data: {
    /** 状态栏高度 */
    statusBarHeight: 20,

    /** 当前志愿者 */
    volunteer: null,

    /** 筛选状态 */
    activeFilter: FILTER_TYPES.ALL,

    /** 搜索关键词 */
    searchQuery: '',

    /** 是否显示搜索栏 */
    showSearch: false,

    /** 快捷统计 */
    quickStats: {
      total: 0,
      todayCalled: 0,
      priority: 0,
    },

    /** 老人列表（原始） */
    elderlyList: [],

    /** 老人列表（筛选后） */
    filteredList: [],

    /** 展开的卡片 ID */
    expandedId: '',

    /** 是否正在加载 */
    loading: true,

    /** 拨号覆盖层数据 */
    showDialOverlay: false,
    dialName: '',
    dialGender: '男',
    dialSurname: '',
  },

  onShow() {
    if (!requireAuth()) return;

    const app = getApp();
    const volunteer = getVolunteer();
    this.setData({ volunteer, statusBarHeight: app.globalData.statusBarHeight });
    this.loadElderlyList();

    // 更新 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onPullDownRefresh() {
    this.loadElderlyList().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /** ===== 加载老人列表 ===== */
  async loadElderlyList() {
    this.setData({ loading: true });

    const res = await queryCollection(COLLECTIONS.ELDERLY, {
      orderBy: { field: 'priorityLevel', direction: 'desc' },
    });

    if (res.success) {
      // 「今日已联系」以权威的通话记录 call_records 为准，
      // 不再依赖 elderly.lastCallAt（该字段更新失败也不会影响今日计数）
      // 同时取每位老人最近一条通话摘要，供展开面板显示
      const { todaySet, latestByElderly } = await this.getCallRecordsDigest();

      const list = res.data.map(item => {
        const overdueDays = getOverdueDays(item.lastCallAt);
        const contactedToday = todaySet.has(item._id);
        const latest = latestByElderly.get(item._id);
        let callStatus = CALL_STATUS.NONE;
        let callStatusLabel = '';

        if (contactedToday) {
          callStatus = CALL_STATUS.TODAY;
          callStatusLabel = '今天联系过';
        } else if (overdueDays > OVERDUE_DAYS || item.priorityLevel >= 1) {
          callStatus = CALL_STATUS.OVERDUE;
          callStatusLabel = item.lastCallAt
            ? `超期${overdueDays}天`
            : '未联系过';
        } else if (item.lastCallAt) {
          callStatus = CALL_STATUS.DONE;
          callStatusLabel = `${overdueDays}天前联系`;
        }

        return {
          ...item,
          callStatus,
          callStatusLabel,
          overdueDays,
          contactedToday,
          lastSummary: latest && latest.summary ? latest.summary : '',
          surname: item.name ? item.name[0] : '?',
        };
      });

      const total = list.length;
      const todayCalled = list.filter(e => e.callStatus === CALL_STATUS.TODAY).length;
      const priority = list.filter(e => e.priorityLevel >= 1 || e.overdueDays > OVERDUE_DAYS).length;

      this.setData({
        elderlyList: list,
        quickStats: { total, todayCalled, priority },
        loading: false,
      });

      this.applyFilters();
    } else {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  /**
   * 从 call_records 汇总（权威来源，一次查询）：
   *  - todaySet：今天已联系的老人 ID 集合
   *  - latestByElderly：每位老人「最近一条」通话记录（含 summary）
   */
  async getCallRecordsDigest() {
    const todaySet = new Set();
    const latestByElderly = new Map();
    try {
      // 按 startTime 倒序取最近 100 条：
      // 微信云开发 .get() 默认仅返回前 20 条且无排序，
      // 若不排序，最新的今日通话可能排在第 20 条之后而漏统计。
      const res = await queryCollection(COLLECTIONS.CALL_RECORDS, {
        orderBy: { field: 'startTime', direction: 'desc' },
        limit: 100,
      });
      if (res.success && res.data) {
        res.data.forEach(r => {
          if (!r.elderlyId) return;

          // 今日集合
          if (isToday(r.startTime)) {
            todaySet.add(r.elderlyId);
          }

          // 最近一条（按 startTime 取最大）
          const t = r.startTime ? new Date(r.startTime).getTime() : 0;
          const prev = latestByElderly.get(r.elderlyId);
          if (!prev || t > prev.time) {
            latestByElderly.set(r.elderlyId, { time: t, summary: r.summary || '' });
          }
        });
      }
    } catch (e) {
      console.error('[contacts] 加载通话记录失败:', e);
    }
    return { todaySet, latestByElderly };
  },

  /** ===== 搜索 ===== */
  onToggleSearch() {
    const show = !this.data.showSearch;
    this.setData({
      showSearch: show,
      searchQuery: show ? this.data.searchQuery : '',
    });
    if (!show) this.applyFilters();
  },

  onSearchInput(e) {
    const query = e.detail.value.trim();
    this.setData({ searchQuery: query });
    this.applyFilters();
  },

  onClearSearch() {
    this.setData({ searchQuery: '' });
    this.applyFilters();
  },

  /** ===== 筛选 ===== */
  onFilterTap(e) {
    const { filter } = e.currentTarget.dataset;
    this.setData({ activeFilter: filter });
    this.applyFilters();
  },

  /** 综合筛选 + 搜索 */
  applyFilters() {
    let list = [...this.data.elderlyList];
    const { activeFilter, searchQuery } = this.data;

    // 按筛选类型
    if (activeFilter === FILTER_TYPES.TODAY) {
      list = list.filter(e => e.callStatus === CALL_STATUS.TODAY);
    } else if (activeFilter === FILTER_TYPES.PRIORITY) {
      list = list.filter(e => e.priorityLevel >= 1 || e.overdueDays > OVERDUE_DAYS);
    }

    // 按搜索关键词
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        (e.name && e.name.includes(q)) ||
        (e.address && e.address.includes(q)) ||
        (e.hobbies && e.hobbies.some(h => h.toLowerCase().includes(q))) ||
        (e.district && e.district.includes(q))
      );
    }

    this.setData({ filteredList: list });
  },

  /** ===== 卡片展开/收起 ===== */
  onToggleExpand(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      expandedId: this.data.expandedId === id ? '' : id,
    });
  },

  /** ===== 查看详情 ===== */
  onViewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/contact-detail/contact-detail?elderlyId=${id}`,
    });
  },

  /** ===== 退出登录 ===== */
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.clearLoginStatus();
          wx.reLaunch({ url: '/pages/login/login' });
        }
      },
    });
  },
});
