// pages/volunteer/volunteer.js — 我的 · 志愿者中心（Tab3）
const { getVolunteer, clearVolunteer, requireAuth } = require('../../utils/auth');
const { COLLECTIONS } = require('../../utils/constants');

Page({
  data: {
    /** 状态栏高度 */
    statusBarHeight: 20,

    /** 志愿者信息 */
    volunteer: null,

    /** 帮助反馈 */
    showFeedback: false,
    feedbackContent: '',
    feedbackContact: '',
  },

  onShow() {
    if (!requireAuth()) return;

    const app = getApp();
    const volunteer = getVolunteer();
    this.setData({ volunteer, statusBarHeight: app.globalData.statusBarHeight });

    // 更新 tabBar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  /** ===== 培训资料 → 独立页面 ===== */
  onOpenTraining() {
    wx.navigateTo({ url: '/pages/training/training' });
  },

  /** ===== 沟通技巧 → 独立页面 ===== */
  onOpenTips() {
    wx.navigateTo({ url: '/pages/tips/tips' });
  },

  /** ===== 帮助反馈 ===== */
  onOpenFeedback() {
    this.setData({ showFeedback: true });
  },

  onCloseFeedback() {
    this.setData({ showFeedback: false, feedbackContent: '', feedbackContact: '' });
  },

  onFeedbackContentInput(e) {
    this.setData({ feedbackContent: e.detail.value });
  },

  onFeedbackContactInput(e) {
    this.setData({ feedbackContact: e.detail.value });
  },

  async onSubmitFeedback() {
    if (!this.data.feedbackContent.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }

    const db = wx.cloud.database();
    try {
      await db.collection(COLLECTIONS.FEEDBACKS).add({
        data: {
          content: this.data.feedbackContent.trim(),
          contact: this.data.feedbackContact.trim(),
          volunteerId: this.data.volunteer?._id || '',
          createdAt: new Date(),
          status: 'pending',
        },
      });
      wx.showToast({ title: '感谢反馈！', icon: 'success' });
      this.onCloseFeedback();
    } catch (err) {
      wx.showToast({ title: '提交失败', icon: 'none' });
    }
  },

  /** ===== 退出登录 ===== */
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          clearVolunteer();
          wx.reLaunch({ url: '/pages/login/login' });
        }
      },
    });
  },
});
