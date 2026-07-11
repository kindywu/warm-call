// cloudfunctions/saveContent/index.js — 内容管理云函数
// 云函数代理写入培训资料/沟通技巧（全局共享 + 志愿者可贡献）
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/** 允许操作的集合 */
const ALLOWED_COLLECTIONS = ['training_materials', 'communication_tips'];

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { collection, action, data, docId } = event;

  console.log(`[saveContent] collection=${collection}, action=${action}, openid=${openid}`);

  // 校验集合名
  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return { success: false, error: '无效的集合名称' };
  }

  try {
    switch (action) {
      case 'create': {
        const addRes = await db.collection(collection).add({
          data: {
            ...data,
            createdBy: openid,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate(),
          },
        });
        return { success: true, data: { _id: addRes._id } };
      }

      case 'update': {
        if (!docId) {
          return { success: false, error: '缺少 docId' };
        }
        await db.collection(collection).doc(docId).update({
          data: {
            ...data,
            updatedAt: db.serverDate(),
          },
        });
        return { success: true, data: { _id: docId } };
      }

      case 'delete': {
        if (!docId) {
          return { success: false, error: '缺少 docId' };
        }
        await db.collection(collection).doc(docId).remove();
        return { success: true, data: { _id: docId } };
      }

      case 'list': {
        const queryRes = await db.collection(collection)
          .orderBy('createdAt', 'desc')
          .get();
        return { success: true, data: queryRes.data };
      }

      default:
        return { success: false, error: `未知操作: ${action}` };
    }
  } catch (err) {
    console.error(`[saveContent] 错误:`, err);
    return { success: false, error: err.message || '操作失败' };
  }
};
