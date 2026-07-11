// utils/auth.js — 暖心通话 · 登录态管理

const STORAGE_KEYS = require('./constants').STORAGE_KEYS;

/**
 * 获取当前志愿者信息
 * @returns {object|null}
 */
function getVolunteer() {
  const app = getApp();
  if (app && app.globalData && app.globalData.volunteer) {
    return app.globalData.volunteer;
  }
  const stored = wx.getStorageSync(STORAGE_KEYS.VOLUNTEER);
  if (stored) {
    if (app && app.globalData) {
      app.globalData.volunteer = stored;
      app.globalData.isLoggedIn = true;
    }
  }
  return stored || null;
}

/**
 * 设置志愿者登录态
 * @param {object} volunteer - 志愿者文档
 */
function setVolunteer(volunteer) {
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.volunteer = volunteer;
    app.globalData.isLoggedIn = true;
  }
  wx.setStorageSync(STORAGE_KEYS.VOLUNTEER, volunteer);
}

/**
 * 清除登录态
 */
function clearVolunteer() {
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.volunteer = null;
    app.globalData.isLoggedIn = false;
  }
  wx.removeStorageSync(STORAGE_KEYS.VOLUNTEER);
  wx.removeStorageSync(STORAGE_KEYS.PENDING_DIAL);
  wx.removeStorageSync(STORAGE_KEYS.LOGIN_TOKEN);
}

/**
 * 判断是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  const app = getApp();
  if (app && app.globalData && app.globalData.isLoggedIn) {
    return true;
  }
  return !!wx.getStorageSync(STORAGE_KEYS.VOLUNTEER);
}

/**
 * 要求登录，未登录则跳转登录页
 * @returns {boolean} 是否已登录
 */
function requireAuth() {
  if (!isLoggedIn()) {
    wx.reLaunch({ url: '/pages/login/login' });
    return false;
  }
  return true;
}

module.exports = {
  getVolunteer,
  setVolunteer,
  clearVolunteer,
  isLoggedIn,
  requireAuth,
};
