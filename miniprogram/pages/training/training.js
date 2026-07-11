// pages/training/training.js — 培训资料页（只读·Q&A折叠）
const { callFunction } = require('../../utils/cloud');
const { requireAuth } = require('../../utils/auth');
const { COLLECTIONS } = require('../../utils/constants');

Page({
  data: {
    statusBarHeight: 20,
    list: [],
    filtered: [],
    search: '',
  },

  onLoad() {
    if (!requireAuth()) return;
    const app = getApp();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
    this.loadList();
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  },

  /* ===== 加载列表 ===== */
  async loadList() {
    const res = await callFunction('saveContent', {
      collection: COLLECTIONS.TRAINING_MATERIALS,
      action: 'list',
    });
    if (res.success) {
      const list = (res.data || []).map(item => ({
        ...item,
        _expanded: false,
      }));
      this.setData({ list });
      this.applyFilter();
    }
  },

  /* ===== 搜索 ===== */
  onSearch(e) {
    this.setData({ search: e.detail.value.trim() });
    this.applyFilter();
  },

  onClearSearch() {
    this.setData({ search: '' });
    this.applyFilter();
  },

  applyFilter() {
    const { list, search } = this.data;
    if (!search) {
      this.setData({ filtered: list });
      return;
    }
    const q = search.toLowerCase();
    this.setData({
      filtered: list.filter(m =>
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.content && m.content.toLowerCase().includes(q))
      ),
    });
  },

  /* ===== 折叠/展开 ===== */
  onToggle(e) {
    const { id } = e.currentTarget.dataset;
    const toggle = (arr) => arr.map(item =>
      item._id === id ? { ...item, _expanded: !item._expanded } : item
    );
    this.setData({
      list: toggle(this.data.list),
      filtered: toggle(this.data.filtered),
    });
  },
});
