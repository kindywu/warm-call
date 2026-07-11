// cloudfunctions/seedAllDemo/index.js — 全量演示数据灌入（运行时自动清空再灌入）
// 种子集合：elderly / volunteers / call_records / training_materials / communication_tips / feedbacks
// 所有演示数据的 _id 均为固定值，确保关联统计稳定
// 通话记录：2026年2月~7月，每位志愿者每月5~20条，均匀分布不集中
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// ===== 演示老人（12 人，固定 _id，6 高优先级 + 6 普通）=====
const ELDERLY_DATA = [
  {
    _id: 'test_elderly_001',
    name: '陈秀英',
    age: 72,
    gender: '女',
    phone: '13800001001',
    address: '朝阳区建国路88号3单元202',
    district: '朝阳区',
    birthday: '1954-03-15',
    healthNote: '高血压，需每日服药；膝盖偶尔疼痛',
    hobbies: ['广场舞', '听戏', '养花'],
    familyStatus: '独居，一子在外地工作',
    priorityLevel: 1,
    emergencyContact: { name: '陈建国', relation: '弟弟', phone: '13900001111' },
    lastCallAt: null,
  },
  {
    _id: 'test_elderly_002',
    name: '李文彬',
    age: 68,
    gender: '男',
    phone: '13800001002',
    address: '海淀区中关村南大街15号院4号楼1205',
    district: '海淀区',
    birthday: '1958-07-22',
    healthNote: '糖尿病，饮食需控制；视力有所下降',
    hobbies: ['下象棋', '看新闻', '太极拳'],
    familyStatus: '与老伴同住，无子女',
    priorityLevel: 1,
    emergencyContact: { name: '李芳', relation: '妹妹', phone: '13900002222' },
    lastCallAt: null,
  },
  {
    _id: 'test_elderly_003',
    name: '张桂兰',
    age: 75,
    gender: '女',
    phone: '13800001003',
    address: '东城区东直门内大街5号',
    district: '东城区',
    birthday: '1951-11-08',
    healthNote: '心脏不太好，做过支架手术；睡眠质量差',
    hobbies: ['织毛衣', '听广播', '逛公园'],
    familyStatus: '丧偶独居，女儿已故',
    priorityLevel: 1,
    emergencyContact: { name: '王建国', relation: '邻居', phone: '13900003333' },
    lastCallAt: null,
  },
  {
    _id: 'test_elderly_004',
    name: '王德胜',
    age: 70,
    gender: '男',
    phone: '13800001004',
    address: '丰台区方庄芳群园二区12号楼303',
    district: '丰台区',
    birthday: '1956-01-30',
    healthNote: '腰椎间盘突出，行动不便；轻度高血压',
    hobbies: ['养鸟', '书法', '看电视'],
    familyStatus: '独居，独子已故，老伴去世',
    priorityLevel: 1,
    emergencyContact: { name: '王丽', relation: '侄女', phone: '13900004444' },
    lastCallAt: null,
  },
  {
    _id: 'test_elderly_005',
    name: '赵玉兰',
    age: 79,
    gender: '女',
    phone: '13800001005',
    address: '西城区新街口外大街甲8号',
    district: '西城区',
    birthday: '1947-05-12',
    healthNote: '整体健康，但听力下降明显；记忆力有所减退',
    hobbies: ['唱歌', '做面食', '种菜'],
    familyStatus: '独居，一儿早逝',
    priorityLevel: 1,
    emergencyContact: { name: '刘阿姨', relation: '社区工作者', phone: '13900005555' },
    lastCallAt: null,
  },
  {
    _id: 'test_elderly_006',
    name: '孙志强',
    age: 67,
    gender: '男',
    phone: '13800001006',
    address: '通州区梨园镇云景里小区7号楼102',
    district: '通州区',
    birthday: '1959-09-03',
    healthNote: '痛风病史；近期情绪低落',
    hobbies: ['钓鱼', '看球赛', '骑自行车'],
    familyStatus: '独居，子女在外省',
    priorityLevel: 1,
    emergencyContact: { name: '孙明', relation: '弟弟', phone: '13900006666' },
    lastCallAt: null,
  },
  {
    _id: 'test_elderly_007',
    name: '周秀琴',
    age: 65,
    gender: '女',
    phone: '13800001007',
    address: '石景山区苹果园南路23号院',
    district: '石景山区',
    birthday: '1961-06-18',
    healthNote: '身体健康，偶尔腰酸',
    hobbies: ['跳广场舞', '养猫', '做手工'],
    familyStatus: '与老伴同住',
    priorityLevel: 0,
    emergencyContact: { name: '周伟', relation: '侄子', phone: '13900007777' },
    lastCallAt: null,
  },
  {
    _id: 'test_elderly_008',
    name: '刘德福',
    age: 73,
    gender: '男',
    phone: '13800001008',
    address: '大兴区黄村镇兴华大街32号',
    district: '大兴区',
    birthday: '1953-12-25',
    healthNote: '轻度关节炎；整体健康状况良好',
    hobbies: ['打麻将', '听评书', '散步'],
    familyStatus: '独居，妻子已故',
    priorityLevel: 0,
    emergencyContact: { name: '刘小红', relation: '女儿', phone: '13900008888' },
    lastCallAt: null,
  },
  {
    _id: 'test_elderly_009',
    name: '吴桂花',
    age: 71,
    gender: '女',
    phone: '13800001009',
    address: '昌平区回龙观东大街龙腾苑6号楼',
    district: '昌平区',
    birthday: '1955-04-05',
    healthNote: '血压偏低，偶有头晕；需注意防摔倒',
    hobbies: ['养花', '看综艺节目', '逛街'],
    familyStatus: '独居，儿子在国外',
    priorityLevel: 0,
    emergencyContact: { name: '吴刚', relation: '哥哥', phone: '13900009999' },
    lastCallAt: null,
  },
  {
    _id: 'test_elderly_010',
    name: '郑国栋',
    age: 69,
    gender: '男',
    phone: '13800001010',
    address: '顺义区光明街道幸福小区3号楼',
    district: '顺义区',
    birthday: '1957-08-16',
    healthNote: '曾中风，恢复良好；需定期复查',
    hobbies: ['写毛笔字', '养金鱼', '看新闻联播'],
    familyStatus: '与老伴同住，独子已故',
    priorityLevel: 0,
    emergencyContact: { name: '郑芳', relation: '妹妹', phone: '13900010000' },
    lastCallAt: null,
  },
  {
    _id: 'test_elderly_011',
    name: '黄美珍',
    age: 74,
    gender: '女',
    phone: '13800001011',
    address: '房山区良乡西路园8号院2单元101',
    district: '房山区',
    birthday: '1952-02-28',
    healthNote: '糖尿病多年，血糖控制尚可',
    hobbies: ['做针线活', '聊天', '看戏曲频道'],
    familyStatus: '独居，子女均在外地',
    priorityLevel: 0,
    emergencyContact: { name: '黄强', relation: '弟弟', phone: '13900011111' },
    lastCallAt: null,
  },
  {
    _id: 'test_elderly_012',
    name: '马建国',
    age: 76,
    gender: '男',
    phone: '13800001012',
    address: '门头沟区大峪街道新桥南大街16号',
    district: '门头沟区',
    birthday: '1950-10-01',
    healthNote: '心脏有支架；血压偏高，需坚持服药',
    hobbies: ['拉二胡', '下棋', '遛鸟'],
    familyStatus: '独居，独女已故，老伴去世',
    priorityLevel: 0,
    emergencyContact: { name: '马亮', relation: '侄子', phone: '13900012222' },
    lastCallAt: null,
  },
];

// ===== 演示志愿者（3 人，固定 _id）=====
const VOLUNTEER_DATA = [
  {
    _id: 'test_volunteer_001',
    name: '张小明',
    phone: '13912345678',
    role: '志愿者',
    code: 'VM0001',
    avatarUrl: '',
  },
  {
    _id: 'test_volunteer_002',
    name: '李思雨',
    phone: '13912345679',
    role: '志愿者（组长）',
    code: 'VM0002',
    avatarUrl: '',
  },
  {
    _id: 'test_volunteer_003',
    name: '王大伟',
    phone: '13912345680',
    role: '志愿者',
    code: 'VM0003',
    avatarUrl: '',
  },
];

// ===== 演示培训资料（10 篇）=====
const TRAINING_DATA = [
  {
    title: '新志愿者入门指南',
    content: '欢迎加入暖心通话志愿团队！\n\n一、项目背景\n暖心通话旨在为失独老人提供定期电话关怀服务，帮助缓解他们的孤独感，建立情感连接。\n\n二、志愿者职责\n1. 每月至少完成 2 次电话关怀\n2. 每次通话后填写反馈记录\n3. 发现老人情绪异常及时上报\n\n三、通话礼仪\n- 用亲切的称呼："陈奶奶好"、"李爷爷好"\n- 耐心倾听，不打断\n- 保持积极乐观的语气\n\n四、注意事项\n- 不要承诺无法做到的事情\n- 尊重老人的隐私\n- 遇到紧急情况拨打 120',
  },
  {
    title: '老年人沟通技巧培训',
    content: '与老年人通话是一门艺术，需要我们用心学习。\n\n一、语速与音量\n- 语速稍慢，吐字清晰\n- 音量适中偏大，但不要吼\n- 给老人足够的时间回应\n\n二、话题选择\n- 从老人的兴趣爱好入手\n- 聊天气、节日、日常生活\n- 避免提及敏感话题\n\n三、倾听技巧\n- 适时发出"嗯""是的"等回应\n- 重复关键信息表示在认真听\n- 不要急于转换话题\n\n四、情绪疏导\n- 当老人情绪低落时，先接纳情绪\n- 可以分享一些有趣的小故事\n- 引导老人回忆美好的往事',
  },
  {
    title: '失独老人心理特点与关怀策略',
    content: '了解失独老人的心理特点，才能更好地服务他们。\n\n一、常见心理状态\n1. 孤独感：长期的孤独可能导致社交障碍\n2. 失落感：失去子女的巨大创伤需要时间愈合\n3. 自卑感：可能觉得自己"和别人不一样"\n4. 焦虑感：对未来的养老和健康问题担忧\n\n二、关怀策略\n1. 建立稳定的关系：固定志愿者对接，避免频繁更换\n2. 创造仪式感：节日、生日时送上特别的问候\n3. 鼓励社交：邀请参加社区活动\n4. 肯定价值：让老人感到自己仍然被需要\n\n三、需要警惕的信号\n- 长时间情绪低落\n- 表达"活着没意思"等想法\n- 拒绝所有社交\n以上情况需立即上报。',
  },
  {
    title: '健康话题沟通指南',
    content: '与老人聊健康话题需要既关心又不过度焦虑。\n\n一、询问方式\n- "最近身体感觉怎么样？"\n- "药按时吃了吗？"\n- "睡眠好不好呀？"\n\n二、常见健康问题的应对\n1. 高血压：提醒按时服药，少吃咸\n2. 糖尿病：注意饮食，适当运动\n3. 关节炎：天气变化时多保暖\n4. 听力下降：放慢语速，多用短句\n\n三、紧急情况处理\n- 老人说头晕/胸闷：建议立即就医\n- 老人摔倒：帮忙联系紧急联系人\n- 老人意识不清：立即拨打 120\n\n四、不可以做的事\n- 不要给医疗建议（不是医生）\n- 不要推荐具体药品\n- 不要轻描淡写老人的症状',
  },
  {
    title: '通话记录填写规范',
    content: '规范的记录有助于团队协作和持续关怀。\n\n一、必填字段\n- 通话时长（分钟）\n- 老人心情（良好/一般/低落）\n- 通话标签（可选多个）\n\n二、摘要写作要点\n- 2-3 句话概括通话内容\n- 突出老人的精神状态\n- 记录老人的需求或问题\n- 示例："奶奶精神状态很好，聊了最近公园的花开了。她提到膝盖有点疼，已建议热敷。"\n\n三、下次建议话题\n- 根据本次通话内容延续\n- 结合老人的兴趣爱好\n- 关注老人提到的近期事件\n\n四、标签使用\n- 聊家常：日常闲聊\n- 心理疏导：老人情绪低落时的安慰\n- 健康关怀：关注身体健康\n- 节日问候：节假日特别通话\n- 紧急：需要立即关注的异常情况',
  },
  {
    title: '志愿者自我关怀与压力管理',
    content: '关怀他人的同时，也要照顾好自己。\n\n一、认识替代性创伤\n长期接触他人的痛苦经历可能导致情绪疲惫，这是正常的。注意觉察自己的情绪变化。\n\n二、压力信号自检\n- 对通话产生抵触情绪\n- 挂断电话后长时间低落\n- 失眠或食欲变化\n- 对原本感兴趣的事失去热情\n\n三、自我调节方法\n1. 每次通话后做几次深呼吸\n2. 和组员分享感受（不透露老人隐私）\n3. 保持自己的社交生活和兴趣爱好\n4. 适当休息，不要连续安排过多通话\n\n四、寻求帮助\n感到压力过大时，请联系组长或项目负责人，这绝不是软弱的表现。',
  },
  {
    title: '季节变化与老人健康防护',
    content: '不同季节需要关注不同的健康问题。\n\n一、春季（3-5月）\n- 注意过敏性鼻炎和哮喘\n- 提醒适当春捂，不要过早减衣\n- 鼓励天气好时出门晒太阳\n\n二、夏季（6-8月）\n- 高温天提醒防暑降温\n- 注意食物卫生，防止腹泻\n- 空调温度不宜过低，26-28℃为宜\n\n三、秋季（9-11月）\n- 早晚温差大，提醒添衣\n- 流感高发季，建议接种疫苗\n- 关节不好的老人注意保暖\n\n四、冬季（12-2月）\n- 防滑防摔，雨雪天减少外出\n- 注意室内通风和加湿\n- 心脑血管疾病高发，多关注',
  },
  {
    title: '如何应对老人反复讲述同一件事',
    content: '老人反复讲同一件事是常见现象，背后可能有多种原因。\n\n一、原因分析\n1. 短期记忆减退：老人可能忘记已经讲过\n2. 情感需求：这件事对老人意义重大，想获得关注\n3. 缺乏新话题：日常生活单调，没有新鲜事可讲\n\n二、应对策略\n1. 耐心倾听：不要打断说"这个您讲过了"\n2. 顺势引导：从老话题中发掘新角度——"您上次说到那里，后来呢？"\n3. 引入新话题：分享自己最近的见闻，引导老人聊新的内容\n4. 肯定感受：老人的情绪需求是真实的，先回应情绪再引导话题\n\n三、特别提醒\n如果老人短时间内出现明显的重复讲述增多，可能是认知功能下降的信号，建议在记录中标注并告知组长。',
  },
  {
    title: '电话预约与时间管理技巧',
    content: '高效的时间管理能让志愿服务更持久。\n\n一、预约通话\n- 提前和老人约定固定的通话时间，形成规律\n- 避开老人午休（12:30-14:00）和晚餐（17:30-19:00）时段\n- 每次通话控制在 15-30 分钟，不要太短或太长\n\n二、通话前准备\n- 回顾上次通话记录，了解上次聊了什么\n- 准备 2-3 个话题，避免冷场\n- 确认手机信号和电量\n\n三、每周规划\n- 建议每周 3-5 次通话，分散安排\n- 高优先级老人可增加到每周 2 次\n- 把通话排入日程表，像约医生一样认真对待\n\n四、批量操作\n- 利用碎片时间填写通话记录\n- 遇到问题及时在反馈中提交，积累经验',
  },
  {
    title: '社区资源整合与利用指南',
    content: '了解社区资源可以帮助老人解决实际问题。\n\n一、常见社区资源\n1. 社区卫生服务中心：基础医疗、慢病管理\n2. 社区老年食堂：解决独居老人吃饭问题\n3. 社区活动中心：棋牌、健身、文艺活动\n4. 居家养老服务：家政、陪护、康复\n\n二、如何帮助老人对接\n- 了解老人所在社区的具体资源\n- 帮老人查询服务电话和申请条件\n- 协助填写简单的申请表格\n- 跟进资源对接的进展\n\n三、资源信息整理\n建议每个志愿者建立"社区资源卡"：\n- 社区名称和地址\n- 服务项目和电话\n- 开放时间和费用\n- 备注（如是否需要预约）\n\n四、注意事项\n- 不要代老人签署任何文件\n- 涉及费用时让老人和家属自己决定\n- 推荐资源不等于担保服务质量',
  },
];

// ===== 演示沟通技巧（10 条）=====
const TIPS_DATA = [
  {
    title: '开场白：用天气打开话匣子',
    content: '"今天天气真好呀，奶奶有没有出去走走？"天气是最自然、最安全的话题。从天气可以自然过渡到老人的日常活动、身体状况等。\n\n实践建议：\n- 通话前看一下老人所在区域的天气\n- 天冷时提醒加衣服\n- 下雨时关心是否买菜方便',
  },
  {
    title: '善用回忆法：让老人讲自己的故事',
    content: '大多数老人都喜欢回忆往事。可以这样引导：\n- "您年轻的时候做过什么工作呀？"\n- "您和老伴是怎么认识的？"\n- "小时候过年是什么样的？"\n\n注意事项：\n- 避免提及子女相关的话题\n- 如果老人主动提到，安静倾听即可\n- 不要追问细节，尊重老人的节奏',
  },
  {
    title: '应对沉默：给老人思考和回应的空间',
    content: '通话中出现的沉默不一定是坏事，老人可能需要时间组织语言。\n\n应对方法：\n1. 等 3-5 秒再开口\n2. 可以轻声说"您慢慢说，不着急"\n3. 如果老人确实不想说，换个轻松的话题\n4. 避免连续提问，给老人喘息的空间\n\n记住：陪伴比说话更重要。',
  },
  {
    title: '节日关怀技巧',
    content: '节日对失独老人来说可能格外敏感。\n\n关怀策略：\n- 提前 1-2 天打电话问候\n- 聊聊节日的传统习俗\n- 可以分享自己做节日美食的经历\n- 避免说"您孩子一定会..."之类的话\n\n特别提醒：\n- 春节、中秋是老人情绪波动较大的时期\n- 这些节日前后可以适当增加通话频率\n- 注意观察老人的情绪变化',
  },
  {
    title: '结束通话的技巧',
    content: '好的结束让老人期待下一次通话。\n\n结束方式：\n1. 自然总结："今天跟您聊得很开心呀"\n2. 约定下次："我过两天再给您打电话"\n3. 关心嘱托："您记得按时吃饭、按时吃药"\n4. 温暖告别："您保重身体，再见奶奶/爷爷"\n\n注意事项：\n- 不要突然挂断\n- 给老人说完最后一句话的机会\n- 如果老人还想聊，适当延长 2-3 分钟',
  },
  {
    title: '如何打开老人的"话匣子"',
    content: '有些老人性格内向，需要一些技巧来引导他们开口。\n\n一、从感官话题切入\n- 味觉："今天吃了什么好吃的呀？"\n- 视觉："窗外的花开了吗？什么颜色的？"\n- 听觉："有没有听到鸟叫呀？"\n\n二、开放性问题\n- 避免能用一个字回答的问题（"好吗？"→"嗯"）\n- 用"什么样的""怎么""为什么"开头\n- "您最近看了什么好看的电视剧？"\n\n三、分享自己\n适当分享自己的生活能建立信任："我今天路过菜市场，看到好新鲜的黄瓜，就想起您之前说喜欢做凉拌黄瓜。"\n\n四、耐心等待\n有些老人需要 5-10 次通话才会真正敞开心扉，前期的"尬聊"是必经之路。',
  },
  {
    title: '处理老人负面情绪的技巧',
    content: '老人有时会在通话中表达孤独、悲伤或愤怒，这是正常的。\n\n一、先接纳，不否定\n- 不要说"别想那么多"、"会好起来的"\n- 可以说"听起来你最近不好过"、"我理解那种感觉"\n\n二、陪伴式倾听\n- 不需要马上给出解决方案\n- 让老人把情绪说出来本身就是一种疗愈\n- 偶尔说"嗯，我在听"就够了\n\n三、适度转移\n当老人情绪持续时间过长（超过 10 分钟），可以温和引导：\n- "我给您讲个好笑的事情吧？"\n- "对了，您上次说的那个事情后来怎么样了？"\n\n四、通话后的自我调整\n倾听负面情绪后自己可能会累，做完记录后做些让自己放松的事。',
  },
  {
    title: '记住老人关键信息的方法',
    content: '记住老人的个人信息能让对方感受到被重视。\n\n一、建立"个人信息卡"\n记录每位老人的：生日、兴趣爱好、重要经历、家人名字、宠物名字\n\n二、通话前快速回顾\n每次拨号前花 1 分钟看上次通话记录和个人信息卡\n\n三、在对话中自然引用\n- "上次您说膝盖疼，现在好点了吗？"\n- "您孙子小明最近考试考得怎么样？"\n- "您家那只花猫又闯祸了没有？"\n\n四、善用系统\n- 通话后立即记录关键信息\n- 利用"下次建议话题"字段为下次通话做准备\n- 定期浏览老人的兴趣标签，发现新话题',
  },
  {
    title: '跨代沟通：与年龄差距大的老人聊天',
    content: '志愿者可能比老人年轻 40-50 岁，跨代沟通需要特别用心。\n\n一、找到共同点\n- 食物和天气是跨越年龄的通用话题\n- 老歌和新歌可以聊（"您年轻时候流行什么歌？我给您放一首"）\n- 电视剧和综艺是跨越年代的话题\n\n二、尊重差异\n- 不要纠正老人的说法或观念\n- 老人可能对新技术不了解，不要表现出优越感\n- 如果老人说了不合时宜的话，温和带过而不是教育\n\n三、学习的心态\n- 向老人讨教他们擅长的领域（做饭、手工、种花）\n- 让老人有"被需要"的感觉——"您教我的那个菜，我做了很好吃！"\n\n四、语言调整\n- 少用网络流行语和新词汇\n- 多用老人熟悉的表达方式\n- 适当用方言拉近距离（如果你会说）',
  },
  {
    title: '电话关怀之外：小惊喜的力量',
    content: '一通电话之外的用心，能让关怀更深入。\n\n一、节日小惊喜\n- 春节前寄一张手写贺卡\n- 老人生日当天唱一首生日歌\n- 中秋节分享自己吃月饼的照片\n\n二、延续话题的关心\n- "上次您说要去修收音机，修好了吗？"\n- "您说想看的那本书，我帮您查了，图书馆有。"\n\n三、建立"专属约定"\n- "下周这个时候我再给您打，您把身体养好"\n- "等您学会了那个广场舞，描述给我听听"\n\n四、记录和分享\n- 把老人讲的有趣故事记录在反馈里\n- 在团队内部交流中分享（去隐私化后）\n- 这些故事可能成为其他志愿者的沟通素材',
  },
];

// ===== 演示反馈（6 条，关联到固定测试志愿者）=====
const FEEDBACK_DATA = [
  {
    content: '建议增加一个生日提醒功能，这样我们可以提前给老人准备生日祝福。有些老人特别看重生日。',
    contact: '13912345678',
    status: 'pending',
    volunteerId: 'test_volunteer_001',
  },
  {
    content: '老人们在通话中经常提到看病难的问题，能不能在系统中加一个医疗资源的整理板块？比如附近哪些医院可以挂老年科。',
    contact: '',
    status: 'pending',
    volunteerId: 'test_volunteer_002',
  },
  {
    content: 'APP 整体很好用，通话提醒功能帮了大忙。提一个小建议：能否支持语音转文字，这样通话记录写起来更方便。',
    contact: '13912345680',
    status: 'resolved',
    volunteerId: 'test_volunteer_003',
  },
  {
    content: '希望增加一个老人兴趣爱好的标签筛选功能，比如我想找所有喜欢下象棋的老人，目前只能一个一个翻。',
    contact: '13912345678',
    status: 'pending',
    volunteerId: 'test_volunteer_001',
  },
  {
    content: '反馈处理速度很快，上次提的语音转文字建议已经看到更新了，感谢团队的用心！',
    contact: '',
    status: 'resolved',
    volunteerId: 'test_volunteer_003',
  },
  {
    content: '能否在统计页面增加一个"本周最需要关怀的老人"排行榜？优先级的老人太多，有时候不知道先给谁打。',
    contact: '13912345679',
    status: 'pending',
    volunteerId: 'test_volunteer_002',
  },
];

// ===== 通话记录 摘要 / 标签 / 建议 模板 =====

// 良好的摘要模板池
const goodSummaries = [
  (n, e) => {
    const suffix = e.gender === '男' ? '爷爷' : '奶奶';
    return `${n}${suffix}今天精神状态很好，聊了最近天气和日常活动。${suffix === '奶奶' ? '她' : '他'}说最近在公园认识了几位新朋友，挺开心的。`;
  },
  (n) => `${n}心情不错，分享了最近的趣事。饮食起居都正常，身体也没有不适。`,
  (n, e) => {
    const suffix = e.gender === '男' ? '爷爷' : '奶奶';
    return `通话很愉快，${n}${suffix}今天话挺多的，聊了很多日常生活的小事，笑声不断。`;
  },
  (n) => `${n}说最近参加了社区活动，和邻居们一起包了饺子，感觉很充实。`,
  (n, e) => {
    const suffix = e.gender === '男' ? '爷爷' : '奶奶';
    return `${n}${suffix}精神饱满，主动聊起了最近的电视剧，还推荐给志愿者看。`;
  },
  (n, e) => {
    const suffix = e.gender === '男' ? '爷爷' : '奶奶';
    return `今天${n}${suffix}心情特别好，说最近社区搞活动，非常热闹。`;
  },
  (n) => `${n}说最近开始学习用智能手机，虽然有点难但很有意思。`,
  (n, e) => {
    const suffix = e.gender === '男' ? '爷爷' : '奶奶';
    return `${n}${suffix}聊起年轻时候的经历，讲了很多有趣的故事，通话超时了还意犹未尽。`;
  },
];

const normalSummaries = [
  (n) => `${n}今天话不多，说最近睡眠不太好。简单聊了几句家常，提醒了按时作息。`,
  (n) => `通话正常进行，${n}提到最近天气变化有点不舒服，但总体没有大问题。`,
  (n) => `${n}说最近胃口一般，吃得不多。建议多喝点营养汤，老人表示会试试。`,
  (n) => `${n}提到膝盖最近有点疼，已经去社区卫生中心看过。叮嘱了热敷和保暖。`,
  (n) => `今天${n}有些疲惫，说昨晚没休息好。聊的时间比平时短了一些。`,
];

const lowSummaries = [
  (n) => `${n}今天情绪不太好，说话声音很小。没有说具体原因，只是说"有点闷"。已进行心理疏导，建议增加通话频率。`,
  (n) => `老人今天比较沉默，偶尔叹气。尝试聊了一些轻松的话题，反应不大。建议下次缩短间隔再打。`,
  (n) => `${n}说最近总想起过去的事，心情低落。耐心倾听了很久，老人的情绪稍微缓和了一些。`,
  (n) => `${n}提到身体不舒服已经有一段时间了，但不愿意去医院。已反复劝说并建议联系家属陪同就医。`,
  (n, e) => {
    const suffix = e.gender === '男' ? '爷爷' : '奶奶';
    return `今天通话中${n}${suffix}多次提到"活着没意思"，已进行深入心理疏导并标记为紧急关注。已上报组长。`;
  },
];

// 标签组合场景
const tagSets = [
  ['聊家常'],
  ['聊家常', '健康关怀'],
  ['聊家常', '心理疏导'],
  ['健康关怀'],
  ['健康关怀', '聊家常'],
  ['心理疏导', '聊家常'],
  ['节日问候', '聊家常'],
  ['聊家常', '健康关怀', '心理疏导'],
  ['其他', '聊家常'],
  ['心理疏导'],
  ['节日问候'],
];

const allSuggestions = [
  '了解近期生活状况', '询问身体健康', '关心家庭近况',
  '分享社区活动信息', '聊聊天气和日常生活', '介绍养生小知识',
  '了解睡眠情况', '询问用药情况', '聊聊兴趣爱好',
  '分享健康饮食建议', '推荐适合的锻炼方式', '讨论最近的新闻趣事',
  '了解邻里关系', '询问是否需要生活帮助',
];

// ===== 生成演示通话记录 =====
// 覆盖 2026 年 2~7 月（共 6 个月），每位志愿者每月 5~20 条，均匀分布在月份内不集中到一周
function generateCallRecords(elderlyList, volunteerIds) {
  if (!elderlyList || elderlyList.length === 0) return [];

  const records = [];
  const volIds = volunteerIds && volunteerIds.length > 0 ? volunteerIds : [''];

  // 2026 年 2 月 ~ 7 月（JS month: Feb=1, Mar=2, Apr=3, May=4, Jun=5, Jul=6）
  const months = [
    { year: 2026, month: 1, days: 28 },  // Feb 2026（2026 不是闰年）
    { year: 2026, month: 2, days: 31 },  // Mar
    { year: 2026, month: 3, days: 30 },  // Apr
    { year: 2026, month: 4, days: 31 },  // May
    { year: 2026, month: 5, days: 30 },  // Jun
    { year: 2026, month: 6, days: 31 },  // Jul
  ];

  // 为每个志愿者维护一个 elderly 轮询索引，确保每位 volunteer 对 elderly 的覆盖尽量均衡
  const volElderlyIndex = {};
  volIds.forEach((vid) => { volElderlyIndex[vid] = 0; });

  months.forEach(({ year, month, days: daysInMonth }) => {
    volIds.forEach((volunteerId) => {
      // 每位志愿者每月 5~20 条
      const numRecords = 5 + Math.floor(Math.random() * 16);

      // 均匀分布在月份内：interval = 天数 / 记录数
      const intervalDays = daysInMonth / numRecords;

      // 为本月本志愿者随机洗牌 elderly 顺序
      const shuffledElderly = [...elderlyList].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numRecords; i++) {
        // 基准日 + 小幅随机偏移（± interval/4 以内），确保不集中
        const baseDay = i * intervalDays + (Math.random() - 0.5) * (intervalDays / 2);
        const day = Math.max(1, Math.min(daysInMonth, Math.round(baseDay + 1)));

        // 通话时段：上午 9-11 或下午 14-17
        const hourRand = Math.random();
        const hour = hourRand < 0.45
          ? 9 + Math.floor(Math.random() * 3)   // 9:00-11:xx
          : (hourRand < 0.90
            ? 14 + Math.floor(Math.random() * 4)  // 14:00-17:xx
            : 18 + Math.floor(Math.random() * 2)); // 偶尔 18:00-19:xx

        const startTime = new Date(year, month, day, hour, Math.floor(Math.random() * 60), 0, 0);

        // 时长：10-35 分钟
        const durationMin = 10 + Math.floor(Math.random() * 26);

        // 心情：加权随机（良好 50%，一般 30%，低落 20%）
        const moodRand = Math.random();
        let mood;
        if (moodRand < 0.50) mood = '良好';
        else if (moodRand < 0.80) mood = '一般';
        else mood = '低落';

        // 标签
        const tags = [...tagSets[Math.floor(Math.random() * tagSets.length)]];

        // 下次建议话题（1~3 条）
        const sugCount = 1 + Math.floor(Math.random() * 3);
        const sugIndices = [];
        while (sugIndices.length < sugCount) {
          const idx = Math.floor(Math.random() * allSuggestions.length);
          if (!sugIndices.includes(idx)) sugIndices.push(idx);
        }
        const suggestions = sugIndices.map((idx) => allSuggestions[idx]);

        // 志愿者轮询分配 elderly
        const elderly = shuffledElderly[i % shuffledElderly.length];

        // 生成摘要
        let summary;
        const name = elderly.name;
        if (mood === '良好') {
          const fn = goodSummaries[Math.floor(Math.random() * goodSummaries.length)];
          summary = fn(name, elderly);
        } else if (mood === '一般') {
          summary = normalSummaries[Math.floor(Math.random() * normalSummaries.length)](name);
        } else {
          const fn = lowSummaries[Math.floor(Math.random() * lowSummaries.length)];
          summary = fn(name, elderly);
        }

        records.push({
          elderlyId: elderly._id,
          volunteerId,
          startTime,
          durationMin,
          summary,
          tags,
          suggestions,
          mood,
          createdAt: new Date(startTime.getTime() + durationMin * 60000),
        });
      }
    });
  });

  // 按时间倒序排列
  records.sort((a, b) => b.startTime - a.startTime);
  return records;
}

// ===== 主函数：清空所有数据 → 灌入所有演示数据 =====
exports.main = async (event, context) => {
  console.log('[seedAllDemo] 开始全量演示数据初始化（清空 → 灌入）');
  console.log('[seedAllDemo] 通话记录范围：2026年2月~7月，每位志愿者每月5~20条');

  const results = {
    elderly: { count: 0, ids: [] },
    volunteers: { count: 0, ids: [] },
    call_records: { count: 0, ids: [] },
    training_materials: { count: 0, ids: [] },
    communication_tips: { count: 0, ids: [] },
    feedbacks: { count: 0, ids: [] },
  };

  // 工具函数：分批并发执行数据库操作
  const BATCH_SIZE = 20;
  async function batchAsync(items, fn) {
    const res = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const batchRes = await Promise.all(batch.map(fn));
      res.push(...batchRes);
    }
    return res;
  }

  try {
    // ========== 第一步：清空所有集合（6 个集合并行，每批 20 条并发删除）==========
    const collections = ['elderly', 'volunteers', 'call_records', 'training_materials', 'communication_tips', 'feedbacks'];
    await Promise.all(collections.map(async (col) => {
      try {
        const existing = await db.collection(col).get();
        if (existing.data.length > 0) {
          await batchAsync(existing.data, (doc) =>
            db.collection(col).doc(doc._id).remove()
          );
        }
        console.log(`[seedAllDemo] 已清空 ${col}: ${existing.data.length} 条`);
      } catch (e) {
        console.log(`[seedAllDemo] 清空 ${col} 跳过: ${e.message}`);
      }
    }));

    // ========== 第二步：灌入 elderly（12 条并发）==========
    await Promise.all(ELDERLY_DATA.map(async (elder) => {
      const { _id, ...elderData } = elder;
      await db.collection('elderly').doc(_id).set({
        data: {
          ...elderData,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
        },
      });
      results.elderly.ids.push(_id);
    }));
    results.elderly.count = results.elderly.ids.length;
    console.log(`[seedAllDemo] 老人: ${results.elderly.count} 条`);

    // ========== 第三步：灌入 volunteers（3 条并发）==========
    await Promise.all(VOLUNTEER_DATA.map(async (vol) => {
      const { _id, ...volData } = vol;
      await db.collection('volunteers').doc(_id).set({
        data: {
          openid: `demo_${vol.code}`,
          ...volData,
          joinedAt: db.serverDate(),
          lastLoginAt: db.serverDate(),
        },
      });
      results.volunteers.ids.push(_id);
    }));
    results.volunteers.count = results.volunteers.ids.length;
    console.log(`[seedAllDemo] 志愿者: ${results.volunteers.count} 条`);

    // ========== 第四步：灌入 call_records（2026年2~7月均匀分布）==========
    const elderlyList = ELDERLY_DATA;
    const volunteerIds = results.volunteers.ids;

    if (elderlyList.length > 0) {
      const records = generateCallRecords(elderlyList, volunteerIds);
      console.log(`[seedAllDemo] 生成通话记录: ${records.length} 条`);

      // 打印每月分布情况
      const monthCounts = {};
      records.forEach((r) => {
        const key = `${r.startTime.getFullYear()}-${String(r.startTime.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      });
      console.log('[seedAllDemo] 每月分布:', JSON.stringify(monthCounts));

      // 打印每位志愿者每月分布
      volunteerIds.forEach((vid) => {
        const vm = {};
        records.filter((r) => r.volunteerId === vid).forEach((r) => {
          const key = `${r.startTime.getFullYear()}-${String(r.startTime.getMonth() + 1).padStart(2, '0')}`;
          vm[key] = (vm[key] || 0) + 1;
        });
        console.log(`[seedAllDemo] ${vid} 每月:`, JSON.stringify(vm));
      });

      const addResults = await Promise.all(records.map(async (record) => {
        const res = await db.collection('call_records').add({ data: record });
        return res._id;
      }));
      results.call_records.ids = addResults;
      results.call_records.count = results.call_records.ids.length;
      console.log(`[seedAllDemo] 通话记录: ${results.call_records.count} 条`);
    } else {
      console.log('[seedAllDemo] 无老人数据，跳过通话记录生成');
    }

    // ========== 第五步：灌入 training_materials（10 条并发）==========
    await Promise.all(TRAINING_DATA.map(async (item) => {
      const res = await db.collection('training_materials').add({
        data: {
          ...item,
          createdBy: 'system',
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
        },
      });
      results.training_materials.ids.push(res._id);
    }));
    results.training_materials.count = results.training_materials.ids.length;
    console.log(`[seedAllDemo] 培训资料: ${results.training_materials.count} 条`);

    // ========== 第六步：灌入 communication_tips（10 条并发）==========
    await Promise.all(TIPS_DATA.map(async (item) => {
      const res = await db.collection('communication_tips').add({
        data: {
          ...item,
          createdBy: 'system',
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
        },
      });
      results.communication_tips.ids.push(res._id);
    }));
    results.communication_tips.count = results.communication_tips.ids.length;
    console.log(`[seedAllDemo] 沟通技巧: ${results.communication_tips.count} 条`);

    // ========== 第七步：灌入 feedbacks（6 条并发）==========
    await Promise.all(FEEDBACK_DATA.map(async (item) => {
      const { volunteerId, ...itemData } = item;
      const res = await db.collection('feedbacks').add({
        data: {
          ...itemData,
          volunteerId,
          createdAt: db.serverDate(),
        },
      });
      results.feedbacks.ids.push(res._id);
    }));
    results.feedbacks.count = results.feedbacks.ids.length;
    console.log(`[seedAllDemo] 反馈: ${results.feedbacks.count} 条`);

    const total = Object.values(results).reduce((sum, r) => sum + r.count, 0);
    return {
      success: true,
      data: {
        message: `成功灌入 ${total} 条演示数据`,
        results,
      },
    };
  } catch (err) {
    console.error('[seedAllDemo] 错误:', err);
    return {
      success: false,
      error: err.message || '服务器错误',
      results,
    };
  }
};
