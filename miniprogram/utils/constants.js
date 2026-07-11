// utils/constants.js — 暖心通话 · 常量与配置

/** 云开发环境 ID */
const CLOUD_ENV = 'kindy-d8g3eork53923db61';

/** 云数据库集合名 */
const COLLECTIONS = {
  VOLUNTEERS: 'volunteers',
  ELDERLY: 'elderly',
  CALL_RECORDS: 'call_records',
  TRAINING_MATERIALS: 'training_materials',
  COMMUNICATION_TIPS: 'communication_tips',
  FEEDBACKS: 'feedbacks',
};

/** 联系人列表筛选类型 */
const FILTER_TYPES = {
  ALL: 'all',
  TODAY: 'today',
  PRIORITY: 'priority',
};

/** 心情选项 */
const MOOD_OPTIONS = ['良好', '一般', '低落'];

/** 通话标签选项 */
const TAG_OPTIONS = ['聊家常', '心理疏导', '健康关怀', '节日问候', '紧急', '其他'];

/** 通话状态 */
const CALL_STATUS = {
  TODAY: 'today',
  OVERDUE: 'overdue',
  DONE: 'done',
  NONE: 'none',
};

/** 超期天数阈值（超过此天数标记为"需优先关怀"） */
const OVERDUE_DAYS = 7;

/** 固定测试志愿者 ID（写死，用于测试统计数据稳定关联） */
const TEST_VOLUNTEER_IDS = {
  /** 测试志愿者 1 - 张小明 */
  V001: 'test_volunteer_001',
  /** 测试志愿者 2 - 李思雨（组长） */
  V002: 'test_volunteer_002',
  /** 测试志愿者 3 - 王大伟 */
  V003: 'test_volunteer_003',
};

/** 固定测试老人 ID（写死，与 seedAllDemo 中 ELDERLY_DATA 的 _id 一一对应） */
const TEST_ELDERLY_IDS = {
  E001: 'test_elderly_001',   // 陈秀英（高优先）
  E002: 'test_elderly_002',   // 李文彬（高优先）
  E003: 'test_elderly_003',   // 张桂兰（高优先）
  E004: 'test_elderly_004',   // 王德胜（高优先）
  E005: 'test_elderly_005',   // 赵玉兰（高优先）
  E006: 'test_elderly_006',   // 孙志强（高优先）
  E007: 'test_elderly_007',   // 周秀琴
  E008: 'test_elderly_008',   // 刘德福
  E009: 'test_elderly_009',   // 吴桂花
  E010: 'test_elderly_010',   // 郑国栋
  E011: 'test_elderly_011',   // 黄美珍
  E012: 'test_elderly_012',   // 马建国
};

/** 存储键 */
const STORAGE_KEYS = {
  VOLUNTEER: 'volunteer',
  PENDING_DIAL: 'pendingDial',
  LOGIN_TOKEN: 'loginToken',
};

module.exports = {
  CLOUD_ENV,
  COLLECTIONS,
  FILTER_TYPES,
  MOOD_OPTIONS,
  TAG_OPTIONS,
  CALL_STATUS,
  OVERDUE_DAYS,
  STORAGE_KEYS,
  TEST_VOLUNTEER_IDS,
  TEST_ELDERLY_IDS,
};
