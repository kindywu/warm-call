// pages/feedback/feedback.js — 通话反馈表单页
const { callFunction, addDocument, updateDocument } = require('../../utils/cloud');
const { getVolunteer } = require('../../utils/auth');
const { COLLECTIONS, MOOD_OPTIONS, TAG_OPTIONS } = require('../../utils/constants');

/** 生成通话时长选项（1～120 分钟） */
function buildDurationOptions() {
  const options = [];
  for (let i = 1; i <= 120; i++) {
    options.push(i);
  }
  return options;
}

/** 将 TAG_OPTIONS 转为带 checked 状态的列表 */
function buildTagList(selectedTags) {
  return TAG_OPTIONS.map(name => ({
    name,
    checked: selectedTags ? selectedTags.indexOf(name) >= 0 : false,
  }));
}

Page({
  data: {
    /** 状态栏高度 */
    statusBarHeight: 20,

    /** 老人 ID */
    elderlyId: '',
    /** 老人姓名 */
    elderlyName: '',
    /** 拨号开始时间 */
    startTime: 0,

    /** 表单字段 */
    durationMin: '',
    durationIndex: 0,
    durationOptions: buildDurationOptions(),
    summary: '',
    mood: '',
    tags: [],
    tagList: buildTagList([]),
    suggestions: ['', '', ''],

    /** AI 预填状态 */
    aiStatus: 'none', // none | loading | done | failed
    aiLoading: false,

    /** 是否正在提交 */
    submitting: false,

    /** 是否已提交过 */
    submitted: false,
  },

  onLoad(options) {
    const app = getApp();
    const { elderlyId, elderlyName, startTime } = options;

    if (!elderlyId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    this.setData({
      elderlyId,
      elderlyName: decodeURIComponent(elderlyName || ''),
      startTime: parseInt(startTime) || Date.now(),
      statusBarHeight: app.globalData.statusBarHeight,
    });

    // 尝试 AI 预填
    this.requestAIPrefill(elderlyId);
  },

  /** ===== AI 预填 ===== */
  async requestAIPrefill(elderlyId) {
    this.setData({ aiLoading: true, aiStatus: 'loading' });

    const res = await callFunction('genCallFeedback', {
      elderlyId,
      startTime: this.data.startTime,
    });

    if (res.success && res.data) {
      const d = res.data;

      if (d.aiStatus === 'done') {
        // AI 预填成功，填充表单
        const aiTags = d.tags || ['聊家常'];
        this.setData({
          aiStatus: 'done',
          aiLoading: false,
          summary: d.summary || '',
          mood: d.mood || '',
          tags: aiTags,
          tagList: buildTagList(aiTags),
          suggestions: d.suggestions && d.suggestions.length >= 3
            ? d.suggestions.slice(0, 3)
            : [d.suggestions[0] || '', '', ''],
        });
        wx.showToast({ title: 'AI 已预填草稿', icon: 'success', duration: 1500 });
      } else {
        // AI 不可用，空白表单
        this.setData({ aiStatus: d.aiStatus || 'none', aiLoading: false });
      }
    } else {
      this.setData({ aiStatus: 'failed', aiLoading: false });
    }
  },

  /** ===== 表单输入 ===== */
  /** 通话时长选择器 */
  onDurationChange(e) {
    const index = parseInt(e.detail.value);
    const durationMin = this.data.durationOptions[index];
    this.setData({
      durationIndex: index,
      durationMin: durationMin,
    });
  },

  onSummaryInput(e) {
    this.setData({ summary: e.detail.value });
  },

  /** 选择心情 */
  onMoodTap(e) {
    const { mood } = e.currentTarget.dataset;
    this.setData({ mood: this.data.mood === mood ? '' : mood });
  },

  /** 切换标签（使用 tagList + checked 模式，避免 WXML indexOf 兼容问题） */
  onTagTap(e) {
    const { index } = e.currentTarget.dataset;
    const tagList = [...this.data.tagList];
    const item = tagList[index];
    if (!item) return;
    item.checked = !item.checked;

    // 同步更新 tags 数组（用于提交）
    const tags = tagList.filter(t => t.checked).map(t => t.name);

    this.setData({ tagList, tags });
  },

  /** 建议话题输入 */
  onSuggestionInput(e) {
    const { index } = e.currentTarget.dataset;
    const suggestions = [...this.data.suggestions];
    suggestions[index] = e.detail.value;
    this.setData({ suggestions });
  },

  /** ===== 提交 ===== */
  async onSubmit() {
    if (this.data.submitting) return;

    // 验证
    const durationMin = parseInt(this.data.durationMin);
    if (!durationMin || durationMin < 1) {
      wx.showToast({ title: '请填写通话时长', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    const volunteer = getVolunteer();
    const { elderlyId, startTime, summary, mood, tags, suggestions } = this.data;

    try {
      // 1. 新增通话记录
      const recordRes = await addDocument(COLLECTIONS.CALL_RECORDS, {
        elderlyId,
        volunteerId: volunteer?._id || '',
        startTime: new Date(startTime),
        durationMin,
        summary: summary || '',
        tags: tags.filter(t => t),
        suggestions: suggestions.filter(s => s),
        mood: mood || '',
        createdAt: new Date(),
      });

      if (!recordRes.success) {
        throw new Error('保存通话记录失败');
      }

      // 2. 更新老人的 lastCallAt（使用时间戳数字，避免 WX SDK update() 对 Date 的序列化问题）
      const updateRes = await updateDocument(COLLECTIONS.ELDERLY, elderlyId, {
        lastCallAt: startTime,
        lastCallStatus: 'done',
      });
      if (!updateRes.success) {
        console.error('[feedback] 更新 lastCallAt 失败:', updateRes.error);
      } else {
        console.log('[feedback] 已更新 lastCallAt:', new Date(startTime).toISOString());
      }

      // 3. 清除 pendingDial
      const app = getApp();
      app.globalData.pendingDial = null;
      wx.removeStorageSync('pendingDial');

      this.setData({ submitted: true });

      wx.showToast({ title: '记录已保存', icon: 'success', duration: 1500 });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack({
          fail: () => {
            wx.switchTab({ url: '/pages/contacts/contacts' });
          },
        });
      }, 1200);
    } catch (err) {
      console.error('提交反馈失败:', err);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      this.setData({ submitting: false });
    }
  },

  /** ===== 放弃 ===== */
  onCancel() {
    wx.showModal({
      title: '放弃记录',
      content: '确定不记录本次通话吗？',
      confirmText: '确定放弃',
      cancelText: '继续填写',
      success: (res) => {
        if (res.confirm) {
          // 清除 pendingDial
          const app = getApp();
          app.globalData.pendingDial = null;
          wx.removeStorageSync('pendingDial');

          wx.navigateBack({
            fail: () => {
              wx.switchTab({ url: '/pages/contacts/contacts' });
            },
          });
        }
      },
    });
  },
});
