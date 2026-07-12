// cloudfunctions/localDebug/index.js — 本地调试 / 诊断用云函数
// 用途：在微信开发者工具「本地调试」模式下连真云，排查数据问题。
// 支持的 action：
//   search         按关键字模糊搜索（兼容原功能）
//   diag           诊断某老人：call_records 是否写入、与 elderly.lastCallAt 是否一致
//   list-records   列出最近通话记录（可指定 elderlyId）
//   today-summary  今日已联系人数 + 明细（与前端 contacts 统计口径一致）
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

const SEARCH_FIELDS = {
  elderly: ['name', 'familyStatus', 'healthNote'],
  call_records: ['summary', 'mood'],
  training_materials: ['title', 'content'],
  communication_tips: ['title', 'content'],
};

// 本地自然日零点（与小程序端 startOfToday 口径一致）
function startOfTodayLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action = 'search' } = event;

  console.log(`[localDebug] action=${action}, openid=${wxContext.OPENID}`);

  try {
    if (action === 'search') return await doSearch(event);
    if (action === 'diag') return await doDiag(event);
    if (action === 'list-records') return await doListRecords(event);
    if (action === 'today-summary') return await doTodaySummary(event);
    return { success: false, error: `不支持的 action: ${action}` };
  } catch (err) {
    console.error('[localDebug] 错误:', err);
    return { success: false, error: err.message || '执行失败' };
  }
};

async function doSearch(event) {
  const { keyword, collection = 'elderly', limit = 10 } = event;
  if (!keyword || !keyword.trim()) return { success: false, error: '缺少 keyword 参数' };
  if (!SEARCH_FIELDS[collection]) return { success: false, error: `不支持的集合: ${collection}` };
  const trimmed = keyword.trim();
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
  const orConditions = SEARCH_FIELDS[collection].map(f => ({
    [f]: db.RegExp({ regexp: trimmed, options: 'i' }),
  }));
  const res = await db.collection(collection).where(_.or(orConditions)).limit(safeLimit).get();
  return { success: true, keyword: trimmed, collection, count: res.data.length, data: res.data };
}

// 诊断某老人：写入是否成功、读取基准 lastCallAt 是否同步
async function doDiag(event) {
  const { elderlyId } = event;
  if (!elderlyId) return { success: false, error: '缺少 elderlyId 参数' };

  // 1. 老人文档
  const elderRes = await db.collection('elderly').doc(elderlyId).get().catch(() => null);
  const elder = elderRes && elderRes.data ? elderRes.data : null;

  // 2. 该老人的通话记录（按 startTime 倒序）
  const recRes = await db.collection('call_records')
    .where({ elderlyId })
    .orderBy('startTime', 'desc')
    .limit(10)
    .get();
  const records = recRes.data || [];

  const today0 = startOfTodayLocal();
  const todayCount = records.filter(r => {
    const t = r.startTime ? new Date(r.startTime).getTime() : 0;
    return t >= today0;
  }).length;

  const latest = records[0];
  let lastCallAtMatch = 'N/A（无记录或无 elderly.lastCallAt）';
  if (elder && elder.lastCallAt != null && latest) {
    const a = new Date(elder.lastCallAt).getTime();
    const b = new Date(latest.startTime).getTime();
    lastCallAtMatch = Math.abs(a - b) < 1000
      ? '一致 ✅'
      : `不一致 ❌ (elderly=${elder.lastCallAt}, record=${latest.startTime})`;
  }

  return {
    success: true,
    elderlyId,
    elderly: elder ? {
      name: elder.name,
      lastCallAt: elder.lastCallAt || null,
      lastCallStatus: elder.lastCallStatus || null,
    } : null,
    callRecordsCount: records.length,
    todayCallCount: todayCount,
    latestRecord: latest ? {
      _id: latest._id,
      startTime: latest.startTime,
      durationMin: latest.durationMin,
      summary: latest.summary,
      mood: latest.mood,
    } : null,
    lastCallAtMatch,
    diagnosis: {
      writeSuccess: records.length > 0 ? 'call_records 已写入 ✅' : 'call_records 无记录 ❌（写入可能未成功）',
      readBase: elder ? `elderly.lastCallAt=${elder.lastCallAt}` : 'elderly 文档不存在 ❌',
    },
  };
}

// 列出最近通话记录（可指定 elderlyId）
async function doListRecords(event) {
  const { elderlyId, limit = 20 } = event;
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  let query = db.collection('call_records');
  if (elderlyId) query = query.where({ elderlyId });
  const res = await query.orderBy('startTime', 'desc').limit(safeLimit).get();
  return {
    success: true,
    count: res.data.length,
    data: res.data.map(r => ({
      _id: r._id,
      elderlyId: r.elderlyId,
      startTime: r.startTime,
      durationMin: r.durationMin,
      summary: r.summary,
      mood: r.mood,
    })),
  };
}

// 今日已联系人数 + 明细（与前端 contacts.getCallRecordsDigest 口径一致：
// 按 startTime 倒序取最近 100 条，筛选 startTime >= 今日零点）
async function doTodaySummary(event) {
  const limit = Math.min(Math.max(Number(event.limit) || 100, 1), 100);
  const today0 = startOfTodayLocal();

  const res = await db.collection('call_records')
    .orderBy('startTime', 'desc')
    .limit(limit)
    .get();
  const records = res.data || [];

  // 今日集合（按老人去重）
  const todayMap = new Map(); // elderlyId -> 最近一条今日记录
  records.forEach(r => {
    if (!r.elderlyId) return;
    const t = r.startTime ? new Date(r.startTime).getTime() : 0;
    if (t < today0) return; // 非今日，跳过
    if (!todayMap.has(r.elderlyId)) {
      todayMap.set(r.elderlyId, r);
    }
  });

  const elderlyIds = [...todayMap.keys()];

  // 拉取老人姓名，便于核对（不存在也不影响计数）
  const nameMap = new Map();
  if (elderlyIds.length) {
    const elderRes = await db.collection('elderly')
      .where({ _id: _.in(elderlyIds) })
      .limit(100)
      .get();
    (elderRes.data || []).forEach(e => nameMap.set(e._id, e.name || ''));
  }

  const details = elderlyIds.map(id => {
    const r = todayMap.get(id);
    return {
      elderlyId: id,
      name: nameMap.get(id) || '(未知/已删除)',
      startTime: r.startTime,
      durationMin: r.durationMin,
      summary: r.summary || '',
      mood: r.mood || '',
    };
  });

  return {
    success: true,
    scope: `最近 ${limit} 条通话记录中`,
    today0: new Date(today0).toISOString(),
    totalRecordsScanned: records.length,
    todayContactedCount: elderlyIds.length,
    details,
  };
}
