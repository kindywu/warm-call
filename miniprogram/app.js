// app.js — 暖心通话 · 微信小程序入口
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'kindy-d8g3eork53923db61',
      traceUser: true,
    });

    // 获取系统信息（状态栏高度等）
    const sysInfo = wx.getSystemInfoSync();
    this.globalData.statusBarHeight = sysInfo.statusBarHeight || 20;
    this.globalData.screenWidth = sysInfo.screenWidth || 375;

    // 检查登录态
    this.checkLoginStatus();

    // 检查是否有待处理的拨号（从小程序被杀后恢复的场景）
    const pendingDial = wx.getStorageSync('pendingDial');
    if (pendingDial && pendingDial.elderlyId) {
      this.globalData.pendingDial = pendingDial;
    }
  },

  onShow(options) {
    // 从小程序后台切回前台时检测 pendingDial
    if (this.globalData.pendingDial && this.globalData.pendingDial.elderlyId) {
      // 延迟一下确保页面栈稳定
      setTimeout(() => {
        const pending = this.globalData.pendingDial;
        if (pending && pending.elderlyId) {
          wx.navigateTo({
            url: `/pages/feedback/feedback?elderlyId=${pending.elderlyId}&elderlyName=${encodeURIComponent(pending.elderlyName || '')}&startTime=${pending.startTime || ''}`,
            fail: (err) => {
              console.error('跳转反馈页失败:', err);
            },
          });
        }
      }, 500);
    }
  },

  /** 检查本地是否有登录态 */
  checkLoginStatus() {
    const volunteer = wx.getStorageSync('volunteer');
    if (volunteer && volunteer._id) {
      this.globalData.volunteer = volunteer;
      this.globalData.isLoggedIn = true;
    }
  },

  /** 设置登录态 */
  setLoginStatus(volunteer) {
    this.globalData.volunteer = volunteer;
    this.globalData.isLoggedIn = true;
    wx.setStorageSync('volunteer', volunteer);
  },

  /** 清除登录态 */
  clearLoginStatus() {
    this.globalData.volunteer = null;
    this.globalData.isLoggedIn = false;
    wx.removeStorageSync('volunteer');
  },

  globalData: {
    isLoggedIn: false,
    volunteer: null,
    // 拨号挂起标记：拨号成功后置为 true，回到小程序时用于弹出反馈表单
    pendingDial: null,
    // 状态栏高度（用于自定义导航栏页面顶部偏移）
    statusBarHeight: 20,
    // 屏幕宽度
    screenWidth: 375,
  },
});
