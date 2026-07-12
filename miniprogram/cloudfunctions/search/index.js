// cloudfunctions/search/index.js — 支持AI在本地测试数据库的云函数
// 按关键字在指定集合中做模糊匹配（默认搜索 elderly 老人集合的 name 字段）
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 各集合的搜索字段配置
const SEARCH_FIELDS = {
  elderly: ['name', 'familyStatus', 'healthNote'],
  call_records: ['summary', 'mood'],
  training_materials: ['title', 'content'],
  communication_tips: ['title', 'content'],
};

const DEFAULT_COLLECTION = 'elderly';
const MAX_LIMIT = 20;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { keyword, collection = DEFAULT_COLLECTION, limit = 10 } = event;

  console.log(`[search] collection=${collection}, keyword=${keyword}, openid=${wxContext.OPENID}`);

  // 参数校验
  if (!keyword || !keyword.trim()) {
    return { success: false, error: '缺少 keyword 参数' };
  }
  if (!SEARCH_FIELDS[collection]) {
    return { success: false, error: `不支持的集合: ${collection}` };
  }

  const trimmed = keyword.trim();
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), MAX_LIMIT);

  try {
    const fields = SEARCH_FIELDS[collection];
    // 构建多个字段的或查询（正则模糊匹配）
    const orConditions = fields.map((field) => ({
      [field]: db.RegExp({
        regexp: trimmed,
        options: 'i', // 忽略大小写
      }),
    }));

    const res = await db.collection(collection)
      .where(db.command.or(orConditions))
      .limit(safeLimit)
      .get();

    return {
      success: true,
      keyword: trimmed,
      collection,
      count: res.data.length,
      data: res.data,
    };
  } catch (err) {
    console.error('[search] 错误:', err);
    return { success: false, error: err.message || '搜索失败' };
  }
};
