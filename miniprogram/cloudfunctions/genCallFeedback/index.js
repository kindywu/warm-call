// cloudfunctions/genCallFeedback/index.js — AI 预反馈生成云函数
// 调用 DeepSeek API 生成通话反馈草稿（可选功能，失败降级为空白表单）
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/** DeepSeek API 配置 */
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
// TODO: 在云函数环境变量中配置 DEEPSEEK_API_KEY
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

exports.main = async (event, context) => {
  const { elderlyId, startTime } = event;

  console.log('[genCallFeedback] 收到请求, elderlyId:', elderlyId);

  try {
    // 1. 获取老人信息
    const elderlyRes = await db.collection('elderly').doc(elderlyId).get();
    if (!elderlyRes.data) {
      return { success: false, error: '未找到老人信息' };
    }
    const elderly = elderlyRes.data;

    // 2. 获取最近 3 条通话记录
    const recordsRes = await db.collection('call_records')
      .where({ elderlyId })
      .orderBy('startTime', 'desc')
      .limit(3)
      .get();
    const records = recordsRes.data || [];

    // 3. 默认返回值（无 AI 或 AI 失败时使用）
    const defaultResult = {
      aiStatus: 'none',
      summary: '',
      mood: '',
      tags: ['聊家常'],
      suggestions: ['了解近期生活状况', '询问身体健康', '关心家庭近况'],
      elderlyName: elderly.name,
    };

    // 4. 如果没有配置 DeepSeek Key，直接返回默认值
    if (!DEEPSEEK_API_KEY) {
      console.log('[genCallFeedback] 未配置 DeepSeek Key，返回空白表单');
      return { success: true, data: defaultResult };
    }

    // 5. 调用 DeepSeek API
    try {
      const prompt = buildPrompt(elderly, records);
      const aiResponse = await callDeepSeek(prompt);

      return {
        success: true,
        data: {
          aiStatus: 'done',
          summary: aiResponse.summary || '',
          mood: aiResponse.mood || '',
          tags: aiResponse.tags || ['聊家常'],
          suggestions: aiResponse.suggestions || ['了解近期生活状况'],
          elderlyName: elderly.name,
        },
      };
    } catch (aiErr) {
      console.error('[genCallFeedback] DeepSeek 调用失败:', aiErr.message);
      defaultResult.aiStatus = 'failed';
      return { success: true, data: defaultResult };
    }
  } catch (err) {
    console.error('[genCallFeedback] 错误:', err);
    return {
      success: true,
      data: {
        aiStatus: 'failed',
        summary: '',
        mood: '',
        tags: ['聊家常'],
        suggestions: ['了解近期生活状况'],
      },
    };
  }
};

/** 构建 AI 提示词 */
function buildPrompt(elderly, records) {
  const historyText = records.map(r => {
    const date = r.startTime ? new Date(r.startTime).toLocaleDateString('zh-CN') : '未知';
    return `[${date}] 时长${r.durationMin || '?'}分钟，摘要：${r.summary || '无'}，心情：${r.mood || '未知'}`;
  }).join('\n');

  return `你是一个关怀志愿者的辅助工具。请根据以下失独老人的档案和最近通话记录，为本次通话生成一份反馈草稿。

老人信息：
- 姓名：${elderly.name}
- 年龄：${elderly.age}岁
- 性别：${elderly.gender}
- 健康状况：${elderly.healthNote || '未知'}
- 兴趣爱好：${(elderly.hobbies || []).join('、') || '未知'}
- 家庭状况：${elderly.familyStatus || '未知'}

最近通话记录：
${historyText || '无私录'}

请输出纯 JSON 格式（不要 markdown 标记），包含以下字段：
{
  "summary": "2-3句话的通话要点总结草稿（志愿者可修改）",
  "mood": "从[良好, 一般, 低落]中选择最可能的老人心情",
  "tags": ["从[聊家常, 心理疏导, 健康关怀, 节日问候, 紧急, 其他]中选择2-3个标签"],
  "suggestions": ["下次建议聊天话题1", "下次建议聊天话题2", "下次建议聊天话题3"]
}`;
}

/** 调用 DeepSeek API */
async function callDeepSeek(prompt) {
  const https = require('https');
  const http = require('http');

  return new Promise((resolve, reject) => {
    const url = new URL(DEEPSEEK_API_URL);
    const payload = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个关怀辅助工具，只输出 JSON，不输出任何其他内容。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const content = json.choices && json.choices[0] && json.choices[0].message
            ? json.choices[0].message.content
            : '';

          // 尝试解析 AI 返回的 JSON
          const cleaned = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

          const parsed = JSON.parse(cleaned);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse DeepSeek response: ' + body.slice(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(payload);
    req.end();
  });
}
