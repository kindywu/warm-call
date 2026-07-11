// pages/contacts/contacts.js — 老人列表（首页 · Tab1）
const { queryCollection } = require('../../utils/cloud');
const { getVolunteer, requireAuth } = require('../../utils/auth');
const { FILTER_TYPES, CALL_STATUS, OVERDUE_DAYS } = require('../../utils/constants');
const { formatDate, formatRelative, getOverdueDays } = require('../../utils/format');

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

    const res = await queryCollection('elderly', {
      orderBy: { field: 'priorityLevel', direction: 'desc' },
    });

    if (res.success) {
      const list = res.data.map(item => {
        const overdueDays = getOverdueDays(item.lastCallAt);
        const isToday = overdueDays === 0;
        let callStatus = CALL_STATUS.NONE;
        let callStatusLabel = '';

        if (isToday) {
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
