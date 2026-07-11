// pages/stats/stats.js — 服务统计页（Tab2）
const { queryCollection } = require('../../utils/cloud');
const { getVolunteer, requireAuth } = require('../../utils/auth');
const { COLLECTIONS } = require('../../utils/constants');

Page({
  data: {
    /** 状态栏高度 */
    statusBarHeight: 20,

    /** 视角：team | personal */
    scope: 'personal',

    /** 累计统计 */
    totalCalls: 0,
    totalDuration: '0',
    totalElderly: 0,

    /** 本周统计 */
    weekCalls: 0,
    weekDuration: '0',
    weekElderly: 0,

    /** 今日统计 */
    todayCalls: 0,
    todayDuration: '0m',
    todayElderly: 0,
    continuousDays: 0,

    /** 近六月趋势 */
    trends: [],

    /** 加载状态 */
    loading: true,
    refreshing: false,
  },

  onShow() {
    if (!requireAuth()) return;

    const app = getApp();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });

    // 更新 tabBar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }

    this.loadStats();
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadStats().then(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  /** ===== 加载统计数据（直接查 DB，参照培训资料模式） ===== */
  async loadStats() {
    const volunteer = getVolunteer();
    const { scope } = this.data;

    // 查通话记录（同培训资料模式：直接 queryCollection）
    const res = await queryCollection(COLLECTIONS.CALL_RECORDS, {
      orderBy: { field: 'startTime', direction: 'desc' },
    });

    console.log('[stats] call_records 查询结果:', JSON.stringify({
      success: res.success,
      count: res.data ? res.data.length : 0,
      error: res.error,
    }));

    if (!res.success || !res.data) {
      console.log('[stats] 查询失败或无数据，停止加载');
      this.setData({ loading: false });
      return;
    }

    let records = res.data;
    console.log('[stats] 全部记录数:', records.length);
    console.log('[stats] scope:', scope, 'volunteer._id:', volunteer?._id);

    // 个人视角：仅筛选当前志愿者的记录
    if (scope === 'personal' && volunteer?._id) {
      records = records.filter(r => r.volunteerId === volunteer._id);
      console.log('[stats] 个人视角筛选后记录数:', records.length);
    }

    // 查老人姓名映射
    const elderlyRes = await queryCollection(COLLECTIONS.ELDERLY, {});
    const elderlyMap = {};
    if (elderlyRes.success && elderlyRes.data) {
      elderlyRes.data.forEach(e => { elderlyMap[e._id] = e.name || '未知'; });
    }

    // 时间计算
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // ---- 累计统计 ----
    const totalCalls = records.length;
    const totalDurationMin = records.reduce((s, r) => s + (r.durationMin || 0), 0);
    const totalDuration = parseFloat((totalDurationMin / 60).toFixed(1));
    const totalElderlySet = new Set(records.map(r => r.elderlyId));
    const totalElderly = totalElderlySet.size;

    // ---- 本周统计 ----
    const weekRecords = records.filter(r => new Date(r.startTime) >= startOfWeek);
    const weekCalls = weekRecords.length;
    const weekDurationMin = weekRecords.reduce((s, r) => s + (r.durationMin || 0), 0);
    const weekDuration = parseFloat((weekDurationMin / 60).toFixed(1));
    const weekElderlySet = new Set(weekRecords.map(r => r.elderlyId));
    const weekElderly = weekElderlySet.size;

    // ---- 今日统计 ----
    const todayRecords = records.filter(r => new Date(r.startTime) >= startOfToday);
    const todayCalls = todayRecords.length;
    const todayDurationMin = todayRecords.reduce((s, r) => s + (r.durationMin || 0), 0);
    const todayDuration = formatDurationMin(todayDurationMin);
    const todayElderlySet = new Set(todayRecords.map(r => r.elderlyId));
    const todayElderly = todayElderlySet.size;

    // ---- 连续服务天数 ----
    const activityDates = new Set();
    records.forEach(r => {
      if (r.startTime) {
        const d = new Date(r.startTime);
        d.setHours(0, 0, 0, 0);
        activityDates.add(d.getTime());
      }
    });
    let continuousDays = 0;
    const check = new Date(startOfToday);
    while (activityDates.has(check.getTime())) {
      continuousDays++;
      check.setDate(check.getDate() - 1);
    }

    // ---- 近六月趋势 ----
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getMonth() + 1}月`;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthLabels.push({ key, label });
    }
    const trendsData = monthLabels.map(ml => {
      const count = records.filter(r => {
        const rd = new Date(r.startTime);
        return rd >= sixMonthsAgo && `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}` === ml.key;
      }).length;
      return { weekLabel: ml.label, count };
    });
    const maxCount = Math.max(...trendsData.map(t => t.count), 1);
    const barMaxH = 120;
    const barMinH = 4;
    const trends = trendsData.map(t => ({
      ...t,
      barHeight: t.count > 0 ? Math.max(barMinH, (t.count / maxCount) * barMaxH) : barMinH,
    }));

    console.log('[stats] 计算结果:', JSON.stringify({
      totalCalls, totalDuration, totalElderly,
      weekCalls, weekDuration, weekElderly,
      todayCalls, todayDuration, todayElderly,
      continuousDays,
      trendsCount: trends.length,
    }));

    this.setData({
      totalCalls,
      totalDuration: String(totalDuration),
      totalElderly,
      weekCalls,
      weekDuration: String(weekDuration),
      weekElderly,
      todayCalls,
      todayDuration,
      todayElderly,
      continuousDays,
      trends,
      loading: false,
    });
  },

  /** ===== 切换视角 ===== */
  onToggleScope(e) {
    const { scope } = e.currentTarget.dataset;
    if (scope === this.data.scope) return;
    this.setData({ scope, loading: true });
    this.loadStats();
  },

  /** ===== 刷新 ===== */
  async onRefresh() {
    this.setData({ refreshing: true });
    await this.loadStats();
    this.setData({ refreshing: false });
    wx.showToast({ title: '已刷新', icon: 'success', duration: 1000 });
  },
});

/** 格式化时长为紧凑字符串 */
function formatDurationMin(minutes) {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}
