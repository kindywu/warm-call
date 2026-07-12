// utils/cloud.js — 暖心通话 · 云开发调用封装

const CLOUD_ENV = 'kindy-d8g3eork53923db61';

/**
 * 统一云函数调用封装
 * @param {string} name - 云函数名称
 * @param {object} data - 传入数据
 * @returns {Promise<{success: boolean, data: any, error: string|null}>}
 */
async function callFunction(name, data = {}) {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data,
    });
    const result = res.result || {};
    if (result.success === false) {
      console.error(`[cloud] ${name} 返回错误:`, result.error);
      return { success: false, data: null, error: result.error || '未知错误' };
    }
    return { success: true, data: result.data || result, error: null };
  } catch (err) {
    console.error(`[cloud] ${name} 调用失败:`, err);
    wx.showToast({ title: '网络繁忙，请重试', icon: 'none', duration: 2000 });
    return { success: false, data: null, error: err.errMsg || err.message };
  }
}

/**
 * 查询云数据库集合
 * @param {string} collection - 集合名
 * @param {object} options - { where, orderBy, limit, skip, field }
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
async function queryCollection(collection, options = {}) {
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
    return { success: false, data: [], error: err.errMsg };
  }
}

/**
 * 获取单条文档
 * @param {string} collection - 集合名
 * @param {string} docId - 文档 ID
 */
async function getDocument(collection, docId) {
  const db = wx.cloud.database();
  try {
    const res = await db.collection(collection).doc(docId).get();
    return { success: true, data: res.data, error: null };
  } catch (err) {
    console.error(`[db] 获取文档 ${collection}/${docId} 失败:`, err);
    return { success: false, data: null, error: err.errMsg };
  }
}

/**
 * 新增文档
 */
async function addDocument(collection, data) {
  const db = wx.cloud.database();
  try {
    const res = await db.collection(collection).add({ data });
    return { success: true, data: { _id: res._id }, error: null };
  } catch (err) {
    console.error(`[db] 新增文档 ${collection} 失败:`, err);
    return { success: false, data: null, error: err.errMsg };
  }
}

/**
 * 更新文档
 */
async function updateDocument(collection, docId, data) {
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
    return { success: false, data: null, error: err.errMsg };
  }
}

/**
 * 删除文档
 */
async function removeDocument(collection, docId) {
  const db = wx.cloud.database();
  try {
    await db.collection(collection).doc(docId).remove();
    return { success: true, data: { _id: docId }, error: null };
  } catch (err) {
    console.error(`[db] 删除文档 ${collection}/${docId} 失败:`, err);
    return { success: false, data: null, error: err.errMsg };
  }
}

module.exports = {
  callFunction,
  queryCollection,
  getDocument,
  addDocument,
  updateDocument,
  removeDocument,
};
