// pages/login/login.js — 登录页面
const { callFunction } = require('../../utils/cloud');
const { isLoggedIn, setVolunteer } = require('../../utils/auth');

Page({
  data: {
    /** 状态栏高度 */
    statusBarHeight: 20,

    /** 是否已同意协议 */
    agreed: false,
    /** 是否正在登录 */
    logging: false,
    /** 登录错误信息 */
    loginError: '',
  },

  onLoad() {
    const app = getApp();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });

    // 已登录直接跳转
    if (isLoggedIn()) {
      this.goToHome();
    }
  },

  onShow() {
    // 每次显示检查登录态
    if (isLoggedIn()) {
      this.goToHome();
    }
  },

  /** ===== 静默登录（wx.login → openid） ===== */
  async onSilentLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议', icon: 'none' });
      return;
    }

    if (this.data.logging) return;
    this.setData({ logging: true, loginError: '' });

    try {
      // 1. wx.login 获取 code
      const loginRes = await wx.login();
      if (!loginRes.code) {
        throw new Error('获取登录凭证失败');
      }

      // 2. 调用云函数 loginByPhone
      const res = await callFunction('loginByPhone', {
        code: loginRes.code,
      });

      if (!res.success || !res.data || !res.data.volunteer) {
        throw new Error(res.error || '登录失败');
      }

      // 3. 保存登录态
      setVolunteer(res.data.volunteer);

      // 4. 跳转首页
      wx.showToast({ title: '登录成功', icon: 'success', duration: 1000 });
      setTimeout(() => {
        this.goToHome();
      }, 800);
    } catch (err) {
      console.error('登录失败:', err);
      this.setData({
        loginError: err.message || '登录失败，请重试',
        logging: false,
      });
    }
  },

  /** ===== 协议勾选 ===== */
  onAgreeChange() {
    this.setData({ agreed: !this.data.agreed });
  },

  /** ===== 跳转首页 ===== */
  goToHome() {
    wx.reLaunch({ url: '/pages/contacts/contacts' });
  },

  /** ===== 协议链接 ===== */
  onOpenUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '暖心通话用户协议内容。本小程序用于志愿者关怀失独老人，请妥善使用。',
      showCancel: false,
      confirmText: '知道了',
    });
  },

  onOpenPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '暖心通话仅收集志愿者基本信息用于登录和通话记录管理。所有数据存储在微信云开发环境中，不会与第三方共享。',
      showCancel: false,
      confirmText: '知道了',
    });
  },
});
