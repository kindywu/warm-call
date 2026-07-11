// pages/contact-detail/contact-detail.js — 老人详情页
const { getDocument, queryCollection, updateDocument } = require('../../utils/cloud');
const { getVolunteer } = require('../../utils/auth');
const { CALL_STATUS, COLLECTIONS } = require('../../utils/constants');
const { formatDate, formatFullDate, formatRelative, getOverdueDays } = require('../../utils/format');

Page({
  data: {
    /** 状态栏高度 */
    statusBarHeight: 20,

    /** 老人 ID */
    elderlyId: '',
    /** 老人数据 */
    elderly: null,
    /** 最近 3 条通话 */
    recentCalls: [],
    /** 建议话题 */
    suggestTopics: [],
    /** 状态徽标 */
    statusBadge: null,
    /** 是否需优先关怀 */
    isPriority: false,
    /** 是否正在加载 */
    loading: true,
    /** 基本信息行 */
    infoRows: [],
  },

  onLoad(options) {
    const { elderlyId } = options;
    if (!elderlyId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.setData({ elderlyId });
  },

  onShow() {
    const app = getApp();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });

    if (this.data.elderlyId) {
      this.loadDetail();
    }
  },

  /** ===== 加载详情 ===== */
  async loadDetail() {
    this.setData({ loading: true });

    const elderlyRes = await getDocument(COLLECTIONS.ELDERLY, this.data.elderlyId);
    if (!elderlyRes.success || !elderlyRes.data) {
      wx.showToast({ title: '未找到该老人', icon: 'none' });
      this.setData({ loading: false });
      return;
    }

    const elderly = elderlyRes.data;
    const overdueDays = getOverdueDays(elderly.lastCallAt);
    const isPriority = elderly.priorityLevel >= 1 || overdueDays > 7;

    // 状态徽标
    let statusBadge = null;
    if (overdueDays === 0) {
      statusBadge = { label: '今天联系过', class: 'success' };
    } else if (overdueDays > 0 && overdueDays <= 7) {
      statusBadge = { label: `${overdueDays}天前联系`, class: 'done' };
    } else if (elderly.lastCallAt) {
      statusBadge = { label: `超期${overdueDays}天`, class: 'danger' };
    } else {
      statusBadge = { label: '未联系过', class: 'danger' };
    }

    // 基本信息行
    const infoRows = [
      { label: '出生日期', value: formatFullDate(elderly.birthday) || '未知' },
      { label: '家庭成员', value: elderly.familyStatus || '未知' },
      { label: '居住地址', value: elderly.address || '未知' },
      {
        label: '紧急联系人',
        value: elderly.emergencyContact
          ? `${elderly.emergencyContact.name}（${elderly.emergencyContact.relation}）${elderly.emergencyContact.phone}`
          : '无',
      },
      { label: '健康状况', value: elderly.healthNote || '未知' },
    ];

    // 建议话题
    const suggestTopics = [
      `聊聊${elderly.name}最近的生活状况和心情`,
      `关心健康：${elderly.healthNote ? elderly.healthNote.slice(0, 30) + '...' : '询问身体状况'}`,
      elderly.hobbies && elderly.hobbies.length
        ? `聊聊兴趣爱好："${elderly.hobbies[0]}"`
        : '了解日常活动和生活习惯',
    ];

    this.setData({
      elderly,
      statusBadge,
      isPriority,
      infoRows,
      suggestTopics,
      loading: false,
    });

    // 加载最近通话
    this.loadRecentCalls();
  },

  /** ===== 加载最近 3 条通话 ===== */
  async loadRecentCalls() {
    const res = await queryCollection(COLLECTIONS.CALL_RECORDS, {
      where: { elderlyId: this.data.elderlyId },
      orderBy: { field: 'startTime', direction: 'desc' },
      limit: 3,
    });

    if (res.success) {
      this.setData({ recentCalls: res.data });
    }
  },

  /** ===== 爱好变更 ===== */
  async onHobbiesChange(e) {
    const { hobbies } = e.detail;
    const elderlyId = this.data.elderlyId;

    const res = await updateDocument(COLLECTIONS.ELDERLY, elderlyId, { hobbies });
    if (res.success) {
      this.setData({ 'elderly.hobbies': hobbies });
      wx.showToast({ title: '已更新', icon: 'success', duration: 1000 });
    } else {
      wx.showToast({ title: '更新失败', icon: 'none' });
    }
  },

  /** ===== 返回 ===== */
  onBack() {
    wx.navigateBack();
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
