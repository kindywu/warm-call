// cloudfunctions/loginByPhone/index.js — 登录云函数
// 使用 wx.login 的 code 换取 openid，创建/匹配志愿者
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  console.log('[loginByPhone] 收到登录请求, openid:', openid);

  try {
    // 1. 查询是否已有志愿者记录
    const volunteerRes = await db.collection('volunteers')
      .where({ openid })
      .get();

    let volunteer = null;

    if (volunteerRes.data && volunteerRes.data.length > 0) {
      // 2a. 已有记录，更新最后登录时间
      volunteer = volunteerRes.data[0];
      await db.collection('volunteers').doc(volunteer._id).update({
        data: {
          lastLoginAt: db.serverDate(),
        },
      });
      console.log('[loginByPhone] 已有志愿者:', volunteer.name || '新用户');
    } else {
      // 2b. 新志愿者 — 优先尝试关联演示志愿者
      const DEMO_VOLUNTEER_IDS = ['test_volunteer_001', 'test_volunteer_002', 'test_volunteer_003'];
      let adopted = false;

      for (const demoId of DEMO_VOLUNTEER_IDS) {
        try {
          const demoRes = await db.collection('volunteers').doc(demoId).get();
          if (demoRes.data) {
            const demoVol = demoRes.data;
            // 仅当 openid 以 demo_ 开头时说明未被真实用户关联
            if (demoVol.openid && demoVol.openid.startsWith('demo_')) {
              await db.collection('volunteers').doc(demoId).update({
                data: {
                  openid,
                  lastLoginAt: db.serverDate(),
                },
              });
              const updated = await db.collection('volunteers').doc(demoId).get();
              volunteer = updated.data;
              adopted = true;
              console.log('[loginByPhone] 新用户关联演示志愿者:', demoId, demoVol.name);
              break;
            }
          }
        } catch (e) {
          // 该演示 ID 不存在，跳过
        }
      }

      if (!adopted) {
        // 2c. 无可用演示志愿者，创建新记录
        const createRes = await db.collection('volunteers').add({
          data: {
            openid,
            phone: '',
            name: '志愿者',
            role: '志愿者',
            code: generateCode(),
            joinedAt: db.serverDate(),
            lastLoginAt: db.serverDate(),
            avatarUrl: '',
          },
        });

        const newVolunteer = await db.collection('volunteers').doc(createRes._id).get();
        volunteer = newVolunteer.data;
        console.log('[loginByPhone] 新志愿者创建:', createRes._id);
      }
    }

    return {
      success: true,
      data: {
        volunteer,
      },
    };
  } catch (err) {
    console.error('[loginByPhone] 错误:', err);
    return {
      success: false,
      error: err.message || '服务器错误',
    };
  }
};

/** 生成志愿者编号 */
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
