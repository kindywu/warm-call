// utils/cloud.js — 暖心通话 · 云开发调用封装（统一错误处理）
const CLOUD_ENV = 'kindy-d8g3eork53923db61';

/**
 * 错误提示开关（开发期调试用）。
 * 优先级：app.globalData.DEBUG > 本文件 CLOUD_DEBUG 常量。
 * - 开发期（true）：所有错误都弹 toast，便于及时发现问题。
 * - 生产期（false）：错误静默（仅 console），除非调用方显式开启 showError。
 * 上线前把 app.js 的 globalData.DEBUG 置为 false 即可。
 */
const CLOUD_DEBUG = true;

function isDebug() {
  try {
    const app = getApp();
    if (app && typeof app.globalData && typeof app.globalData.DEBUG === 'boolean') {
      return app.globalData.DEBUG;
    }
  } catch (e) {
    // getApp 不可用时回退到常量
  }
  return CLOUD_DEBUG;
}

/**
 * 统一的错误提示（toast）
 * @param {string} message 提示文案
 * @param {object} [opts] { silent, force } silent: 强制不弹；force: 强制弹（开发期默认）
 */
function showErrorTip(message, opts = {}) {
  // 显式 silent 永远不弹
  if (opts.silent) return;
  // 开发期（调试开关开）默认弹；生产期只有 force 才弹
  const doShow = isDebug() || opts.force;
  if (!doShow) return;
  wx.showToast({
    title: message || '操作失败，请重试',
    icon: 'none',
    duration: 2000,
  });
}

/**
 * 统一云函数调用封装
 * @param {string} name - 云函数名称
 * @param {object} data - 传入数据
 * @param {object} [opts] - { silent, errorMessage }
 *   silent: true 时不弹 toast（调用方自行处理）
 *   errorMessage: 覆盖默认提示文案
 * @returns {Promise<{success: boolean, data: any, error: string|null}>}
 */
async function callFunction(name, data = {}, opts = {}) {
  try {
    const res = await wx.cloud.callFunction({ name, data });
    const result = res.result || {};
    if (result.success === false) {
      const msg = opts.errorMessage || result.error || '请求失败，请稍后重试';
      // 业务失败：开发期自动弹，生产期需 force/errorMessage 才弹
      showErrorTip(msg, { ...opts, force: opts.force || isDebug() });
      return { success: false, data: null, error: result.error || '未知错误' };
    }
    return { success: true, data: result.data || result, error: null };
  } catch (err) {
    const msg = opts.errorMessage || '网络繁忙，请重试';
    showErrorTip(msg, { ...opts, force: true });
    return { success: false, data: null, error: err.errMsg || err.message };
  }
}

/**
 * 查询云数据库集合
 * @param {string} collection - 集合名
 * @param {object} options - { where, orderBy, limit, skip, field }
 * @param {object} [opts] - { showError, errorMessage } 默认不弹（避免与页面 toast 双弹）
 */
async function queryCollection(collection, options = {}, opts = {}) {
  const db = wx.cloud.database();
  const { where, orderBy, limit, skip, field } = options;
  let query = db.collection(collection);

  if (where) query = query.where(where);
  if (orderBy) query = query.orderBy(orderBy.field, orderBy.direction || 'desc');
  if (limit) query = query.limit(limit);
  if (skip) query = query.skip(skip);
  if (field) query = query.field(field);

  try {
    const res = await query.get();
    return { success: true, data: res.data, error: null };
  } catch (err) {
    console.error(`[db] 查询 ${collection} 失败:`, err);
    showErrorTip(opts.errorMessage || '加载失败，请重试', opts);
    return { success: false, data: [], error: err.errMsg };
  }
}

/** 获取单条文档 */
async function getDocument(collection, docId, opts = {}) {
  const db = wx.cloud.database();
  try {
    const res = await db.collection(collection).doc(docId).get();
    return { success: true, data: res.data, error: null };
  } catch (err) {
    console.error(`[db] 获取文档 ${collection}/${docId} 失败:`, err);
    showErrorTip(opts.errorMessage || '加载失败，请重试', opts);
    return { success: false, data: null, error: err.errMsg };
  }
}

/** 新增文档 */
async function addDocument(collection, data, opts = {}) {
  const db = wx.cloud.database();
  try {
    const res = await db.collection(collection).add({ data });
    return { success: true, data: { _id: res._id }, error: null };
  } catch (err) {
    console.error(`[db] 新增文档 ${collection} 失败:`, err);
    showErrorTip(opts.errorMessage || '保存失败，请重试', opts);
    return { success: false, data: null, error: err.errMsg };
  }
}

/** 更新文档 */
async function updateDocument(collection, docId, data, opts = {}) {
  const db = wx.cloud.database();
  try {
    const res = await db.collection(collection).doc(docId).update({ data });
    if (res.stats && res.stats.updated === 0) {
      console.warn(`[db] 更新文档 ${collection}/${docId} 未命中（文档不存在或无变化）`);
      return { success: false, data: null, error: '文档未找到或无变化' };
    }
    return { success: true, data: { _id: docId }, error: null };
  } catch (err) {
    console.error(`[db] 更新文档 ${collection}/${docId} 失败:`, err);
    showErrorTip(opts.errorMessage || '更新失败，请重试', opts);
    return { success: false, data: null, error: err.errMsg };
  }
}

/** 删除文档 */
async function removeDocument(collection, docId, opts = {}) {
  const db = wx.cloud.database();
  try {
    await db.collection(collection).doc(docId).remove();
    return { success: true, data: { _id: docId }, error: null };
  } catch (err) {
    console.error(`[db] 删除文档 ${collection}/${docId} 失败:`, err);
    showErrorTip(opts.errorMessage || '删除失败，请重试', opts);
    return { success: false, data: null, error: err.errMsg };
  }
}

module.exports = {
  CLOUD_ENV,
  callFunction,
  queryCollection,
  getDocument,
  addDocument,
  updateDocument,
  removeDocument,
};
