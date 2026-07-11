// cloudfunctions/aggregateStats/index.js — 统计聚合云函数
// 支持团队统计和个人统计两种口径
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  const { scope = 'team', volunteerId = '' } = event;

  console.log(`[aggregateStats] scope=${scope}, volunteerId=${volunteerId}`);

  try {
    // 构建 match 条件
    let matchCondition = {};
    if (scope === 'personal' && volunteerId) {
      matchCondition.volunteerId = volunteerId;
    }

    let result = await runAggregation(matchCondition);

    // 兜底：个人统计无数据时自动回退团队统计
    if (scope === 'personal' && result.totalCalls === 0) {
      console.log('[aggregateStats] 个人统计无数据，回退团队统计');
      result = await runAggregation({});
      result.fallback = true;
    }

    return {
      success: true,
      data: {
        scope: (result.fallback ? 'team' : scope),
        fallback: result.fallback || false,
        // 累计
        totalCalls: result.totalCalls || 0,
        totalDuration: result.totalDuration || 0,
        totalDurationMin: result.totalDurationMin || 0,
        totalElderly: result.totalElderly || 0,
        // 本周
        weekCalls: result.weekCalls || 0,
        weekDuration: result.weekDuration || 0,
        weekElderly: result.weekElderly || 0,
        // 今日
        todayCalls: result.todayCalls || 0,
        todayDuration: result.todayDuration || '0m',
        todayElderly: result.todayElderly || 0,
        // 趋势
        trends: result.trends || [],
        // 动态
        activities: result.activities || [],
        // 连续服务
        continuousDays: result.continuousDays || 0,
      },
    };
  } catch (err) {
    console.error('[aggregateStats] 错误:', err);
    return {
      success: false,
      error: err.message || '聚合统计失败',
    };
  }
};

/** 执行聚合查询 */
async function runAggregation(matchCondition) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  // 6 周前
  const sixWeeksAgo = new Date(startOfToday);
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

  const pipeline = [
    { $match: matchCondition },
    {
      $facet: {
        // 累计统计
        totalStats: [
          {
            $group: {
              _id: null,
              totalCalls: { $sum: 1 },
              totalDuration: { $sum: '$durationMin' },
              elderlySet: { $addToSet: '$elderlyId' },
            },
          },
        ],

        // 本周统计
        weekStats: [
          { $match: { startTime: { $gte: startOfWeek } } },
          {
            $group: {
              _id: null,
              weekCalls: { $sum: 1 },
              weekDuration: { $sum: '$durationMin' },
              elderlySet: { $addToSet: '$elderlyId' },
            },
          },
        ],

        // 今日统计
        todayStats: [
          { $match: { startTime: { $gte: startOfToday } } },
          {
            $group: {
              _id: null,
              todayCalls: { $sum: 1 },
              todayDuration: { $sum: '$durationMin' },
              elderlySet: { $addToSet: '$elderlyId' },
            },
          },
        ],

        // 近 6 周趋势（按周分组）
        weeklyTrend: [
          { $match: { startTime: { $gte: sixWeeksAgo } } },
          {
            $group: {
              _id: {
                year: { $year: '$startTime' },
                week: { $isoWeek: '$startTime' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.week': 1 } },
        ],

        // 近期动态（最近 20 条）
        recentActivities: [
          { $sort: { startTime: -1 } },
          { $limit: 20 },
          {
            $lookup: {
              from: 'elderly',
              localField: 'elderlyId',
              foreignField: '_id',
              as: 'elderlyInfo',
            },
          },
          {
            $project: {
              startTime: 1,
              durationMin: 1,
              summary: 1,
              mood: 1,
              elderlyName: { $arrayElemAt: ['$elderlyInfo.name', 0] },
            },
          },
        ],
      },
    },
  ];

  const aggResult = await db.collection('call_records').aggregate(pipeline).end();
  const facet = (aggResult.list && aggResult.list[0]) || {};

  // 解析各 facet
  const totalStats = facet.totalStats && facet.totalStats[0] ? facet.totalStats[0] : {};
  const weekStats = facet.weekStats && facet.weekStats[0] ? facet.weekStats[0] : {};
  const todayStats = facet.todayStats && facet.todayStats[0] ? facet.todayStats[0] : {};
  const trends = facet.weeklyTrend || [];
  const activities = facet.recentActivities || [];

  // 计算连续服务天数
  const continuousDays = calculateContinuousDays(activities);

  return {
    totalCalls: totalStats.totalCalls || 0,
    totalDuration: formatHours(totalStats.totalDuration || 0),
    totalDurationMin: totalStats.totalDuration || 0,
    totalElderly: totalStats.elderlySet ? totalStats.elderlySet.length : 0,
    weekCalls: weekStats.weekCalls || 0,
    weekDuration: formatHours(weekStats.weekDuration || 0),
    weekElderly: weekStats.elderlySet ? weekStats.elderlySet.length : 0,
    todayCalls: todayStats.todayCalls || 0,
    todayDuration: formatDurationMin(todayStats.todayDuration || 0),
    todayElderly: todayStats.elderlySet ? todayStats.elderlySet.length : 0,
    trends: formatTrends(trends),
    activities: activities.map(a => ({
      startTime: a.startTime,
      durationMin: a.durationMin,
      summary: a.summary || '',
      mood: a.mood || '',
      elderlyName: a.elderlyName || '未知',
    })),
    continuousDays,
  };
}

/** 格式化时长（小时，保留 1 位小数） */
function formatHours(minutes) {
  return parseFloat((minutes / 60).toFixed(1));
}

/** 格式化时长为紧凑字符串 */
function formatDurationMin(minutes) {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

/** 格式化趋势数据，补足 6 周 */
function formatTrends(trends) {
  const result = [];
  const weekLabels = [];
  const now = new Date();

  // 生成最近 6 周的标签
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() - i * 7);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    weekLabels.push({
      year: d.getFullYear(),
      week: getISOWeek(d),
      label,
    });
  }

  // 匹配数据
  for (const wl of weekLabels) {
    const found = trends.find(t =>
      t._id && t._id.year === wl.year && t._id.week === wl.week
    );
    result.push({
      weekLabel: wl.label,
      count: found ? found.count : 0,
    });
  }

  return result;
}

/** 获取 ISO 周数 */
function getISOWeek(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/** 计算连续服务天数 */
function calculateContinuousDays(activities) {
  if (!activities || activities.length === 0) return 0;

  const dates = new Set();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const a of activities) {
    if (a.startTime) {
      const d = new Date(a.startTime);
      d.setHours(0, 0, 0, 0);
      dates.add(d.getTime());
    }
  }

  let count = 0;
  const check = new Date(now);
  while (dates.has(check.getTime())) {
    count++;
    check.setDate(check.getDate() - 1);
  }

  return count;
}
