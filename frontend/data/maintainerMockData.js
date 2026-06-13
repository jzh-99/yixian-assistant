/**
 * 装维人员相关 Mock 数据
 * 来源：翼线助手APP-v1.0/src/data/mockData.js
 */

export const demoMaintainerUser = {
  userId: 101,
  username: 'ZW10086',
  realName: '李明',
  shortName: '李师傅',
  employeeNo: 'ZW10086',
  roleCode: 'MAINTAINER',
  roleName: '装维人员',
  deptId: 10,
  deptName: '南京鼓楼分局',
  skills: ['宽带安装', '故障维修', '企业组网'],
}

export const initialTasks = [
  {
    id: 'TASK-001',
    code: 'GD202606100023',
    type: '宽带故障维修',
    customer: '张先生',
    phone: '138****2038',
    address: '南京市鼓楼区中央路 168 号',
    expectedAt: '今天 14:30',
    createdAt: '2026-06-10 08:25',
    materials: ['光猫 ×1', '光纤 ×2'],
    status: 'PENDING_ACCEPTANCE',
    overdue: true,
    overdueText: '已超时 35 分钟',
    version: 1,
  },
  {
    id: 'TASK-002',
    code: 'GD202606100027',
    type: '企业专线开通',
    customer: '南京远景科技有限公司',
    phone: '025-8****210',
    address: '南京市雨花台区软件大道 168 号',
    expectedAt: '今天 16:00',
    createdAt: '2026-06-10 09:10',
    materials: ['企业网关 ×1', '网线 ×3'],
    status: 'PENDING_ACCEPTANCE',
    overdue: false,
    version: 1,
  },
  {
    id: 'TASK-003',
    code: 'GD202606090088',
    type: '宽带新装',
    customer: '陈女士',
    phone: '139****7781',
    address: '南京市鼓楼区中山北路 99 号',
    expectedAt: '今天 11:30',
    createdAt: '2026-06-09 17:30',
    materials: ['光猫 ×1'],
    status: 'ACCEPTED',
    overdue: false,
    version: 2,
  },
  {
    id: 'TASK-004',
    code: 'GD202606090076',
    type: '园区网络巡检',
    customer: '金陵智造产业园',
    phone: '025-8****908',
    address: '南京市江宁区秣周东路 12 号',
    expectedAt: '今天 17:30',
    createdAt: '2026-06-09 15:05',
    materials: ['标签纸 ×1'],
    status: 'IN_PROGRESS',
    overdue: false,
    version: 3,
  },
  {
    id: 'TASK-005',
    code: 'GD202606080051',
    type: '宽带故障维修',
    customer: '刘先生',
    phone: '137****3305',
    address: '南京市鼓楼区云南北路 28 号',
    expectedAt: '昨天 16:30',
    createdAt: '2026-06-08 10:05',
    materials: ['光纤 ×1'],
    status: 'COMPLETED',
    overdue: false,
    completedAt: '2026-06-09 15:48',
    feedback: {
      material: '更换光纤 1 根',
      note: '线路恢复正常，测速达到签约带宽。',
      images: [],
      signature: '',
    },
    version: 4,
  },
]

export const materialApplications = [
  {
    id: 'APP-001',
    code: 'SQ202606100018',
    type: 'MATERIAL',
    typeName: '领料申请',
    title: '鼓楼区宽带维修领料',
    submittedAt: '今天 09:36',
    status: 'PENDING',
    statusName: '待审批',
    applicantRoleCode: 'MAINTAINER',
    fields: [
      ['事由', '鼓楼区宽带故障维修'],
      ['地址', '南京市鼓楼区中央路 168 号'],
      ['期望时间', '2026-06-11 09:00'],
      ['紧急程度', '普通'],
      ['物料清单', '光猫 ×1、光纤 ×1'],
    ],
    timeline: [
      { title: '申请已提交', time: '2026-06-10 09:36', note: '等待主管审批', state: 'current' },
    ],
  },
]

export const assistantSuggestions = [
  '如何申请领料？',
  '装维工单如何接单？',
  '完工反馈需要上传什么？',
  '图片上传失败怎么办？',
]

export const assistantAnswers = [
  {
    keywords: ['领料'],
    answer: '你可以进入"智能填单"，描述需要的物料、数量和使用场景。系统会生成领料申请，确认信息后提交审批。',
    source: '装维领料流程规范',
    action: { label: '去申请领料', target: 'smart-form' },
  },
  {
    keywords: ['接单', '工单'],
    answer: '在工作台选择"待接单"分类，打开任务详情后点击"接单"。接单成功后任务会进入"已接单"状态。',
    source: '装维任务操作手册',
    action: { label: '打开工作台', target: 'home' },
  },
  {
    keywords: ['完工', '上传'],
    answer: '完工反馈需要填写实际用料和完工备注，并上传最多 3 张现场图片及客户手写签名。',
    source: '装维完工验收规范',
  },
  {
    keywords: ['套餐', '推荐', '资费'],
    answer: '根据二季度暑促政策，热门推荐：★179元套餐（140G流量+800分钟+2000M宽带，含FTTR+智屏）；★149夺旗套餐（120G+1000分钟+1000M宽带，仅全新用户）；预算有限可看89元夺旗（60G+500分钟+500M宽带）。云享套餐适合迁改用户（119元起，500M宽带）。请问客户预算和新老用户情况？',
    source: '电信套餐政策知识库（二季度暑促）',
    action: { label: '查看套餐详情', target: 'smart-form' },
  },
  {
    keywords: ['暑促', '夺旗'],
    answer: '二季度暑促夺旗套餐（6.4上架，仅限全新用户）：199夺旗（200G/1500分钟/2000M，含FTTR+智屏+天翼看家）；★149夺旗（120G/1000分钟/1000M，FTTR1主1从+中屏）；139夺旗（120G/1000分钟/1000M，FTTR+天翼看家）；★89夺旗（60G/500分钟/500M，中屏+天翼看家或尊享PLUS会员）。非夺旗套餐★179（140G/800分钟/2000M）、239（180G/1000分钟/2000M）均为重点推荐。',
    source: '电信套餐政策知识库（暑促政策）',
  },
  {
    keywords: ['云享', '迁改'],
    answer: '云享套餐适用于存量用户迁改、降档场景。迁改提值>0可改云享套餐。档位：119元（50G/150分钟/500M）、139元（60G/200分钟/500M）、169元（80G/300分钟/1000M）、199元（100G/1000分钟/1000M）、229元（100G/1000分钟/2000M）、269元（140G/1000分钟/2000M）、299元（150G/1500分钟/2000M）、359元（180G/1500分钟/2000M）。迁改提值≥10送路由器/摄像头，≥20送智屏，≥30送FTTR。',
    source: '电信套餐政策知识库（云享套餐）',
  },
  {
    keywords: ['智选云', '新装'],
    answer: '智选云套餐适用于迁改提值>20的用户。档位：89元（40G/500分钟/500M）、139元（50G/500分钟/1000M）、169元（80G/800分钟/1000M，支持同城宽带20元纳入满减）、199元5G-A（100G/1000分钟/2000M）、239元5G-A（120G/1000分钟/2000M）、299元5G-A（200G/1500分钟/2000M）、399元5G-A（250G/2000分钟/2000M）、599元5G-A（400G/3000分钟/2000M）。非必要情况作维系套餐需审批单至市场部。',
    source: '电信套餐政策知识库（智选云套餐）',
  },
  {
    keywords: ['预算'],
    answer: '按预算推荐：100元以下→89元/89夺旗（50-60G，500M）；100-150元→109/139/★149夺旗（50-120G，500-1000M）；150-200元→★179/199夺旗（140-200G，2000M）；200元以上→239/269/299/359/399/599（180-400G，2000M）。具体还需根据新老用户、是否需要FTTR/智屏等智家业务确定。',
    source: '电信套餐政策知识库（预算速查）',
  },
]

/**
 * 套餐知识库 — 结构化数据，供 AI chat 匹配使用
 */
export const packageKnowledgeBase = {
  updated: '2026-06',
  summerPromotion: [
    { tier: 239, traffic: '180G', voice: '1000分钟', broadband: '2000M', itv: 1, freeSim: 2, paidSim: '2张(20G/张)', smartHome: 100, combo: 'FTTR(1+1)+智屏+天翼看家', tags: [] },
    { tier: 199, traffic: '160G', voice: '1000分钟', broadband: '2000M', itv: 1, freeSim: 2, paidSim: '2张(20G/张)', smartHome: 80, combo: 'FTTR(1+1)+智屏', tags: [] },
    { tier: 199, traffic: '200G', voice: '1500分钟', broadband: '2000M', itv: 1, freeSim: 0, paidSim: '2张(20G/张)', smartHome: 100, combo: 'FTTR(1+1)+智屏+天翼看家', tags: ['夺旗', '全新用户'] },
    { tier: 179, traffic: '140G', voice: '800分钟', broadband: '2000M', itv: 1, freeSim: 2, paidSim: '2张(20G/张)', smartHome: 80, combo: 'FTTR(1+1)+智屏', tags: ['★推荐'] },
    { tier: 149, traffic: '120G', voice: '1000分钟', broadband: '1000M', itv: 1, freeSim: 2, paidSim: '2张(20G/张)', smartHome: 80, combo: 'FTTR1主1从+中屏', tags: ['夺旗', '★推荐', '全新用户'] },
    { tier: 139, traffic: '120G', voice: '1000分钟', broadband: '1000M', itv: 1, freeSim: 2, paidSim: '2张(20G/张)', smartHome: 70, combo: 'FTTR1主1从+天翼看家', tags: ['夺旗', '全新用户'] },
    { tier: 139, traffic: '70G', voice: '500分钟', broadband: '1000M', itv: 1, freeSim: 2, paidSim: '2张(10G/张)', smartHome: 50, combo: 'FTTR1主1从 / 中屏+天翼看家 / 中屏+尊享PLUS', tags: [] },
    { tier: 109, traffic: '50G', voice: '500分钟', broadband: '500M', itv: 1, freeSim: 1, paidSim: '3张(10G/张)', smartHome: 40, combo: '中屏+通信服务包 / 天翼看家+wifi / 天翼看家+尊享PLUS', tags: [] },
    { tier: 89, traffic: '60G', voice: '500分钟', broadband: '500M', itv: 1, freeSim: 2, paidSim: '', smartHome: 50, combo: '中屏+天翼看家 / 中屏+尊享PLUS', tags: ['夺旗', '★推荐', '全新用户'] },
    { tier: 89, traffic: '50G', voice: '500分钟', broadband: '500M', itv: 1, freeSim: 1, paidSim: '3张(10G/张)', smartHome: 20, combo: '天翼看家 / 尊享PLUS / 中屏(+10元)', tags: [] },
    { tier: 69, traffic: '30G', voice: '400分钟', broadband: '200M', itv: 1, freeSim: 1, paidSim: '2张(10G/张)', smartHome: 30, combo: '天翼看家+通信服务包 / 尊享PLUS+通信服务包', tags: [] },
  ],
  upgradeGifts: [
    { threshold: 10, gift: '路由器/摄像头' },
    { threshold: 20, gift: '智屏' },
    { threshold: 30, gift: 'FTTR' },
  ],
  rules: [
    '夺旗套餐仅限全新用户（6.4上架）',
    '迁改提值>0可改云享套餐，提值>20可改新装智选云套餐',
    '迁改提值≥10送路由器/摄像头，≥20送智屏，≥30送FTTR',
    '云享169及以下加装副卡不可扩容流量，199及以上收费副卡可扩容',
    '10元/档逐档维系，云享/智慧选需沛县销售部审批',
    '智选云非必要情况作维系套餐需审批单至市场部',
    '智选云169+档支持同城宽带20元纳入满减',
  ],
}

export const statusMeta = {
  PENDING: { label: '待审批', tone: 'neutral' },
  APPROVED: { label: '已通过', tone: 'success' },
  REJECTED: { label: '已驳回', tone: 'danger' },
  CANCELLED: { label: '已取消', tone: 'muted' },
  PENDING_ACCEPTANCE: { label: '待接单', tone: 'neutral' },
  ACCEPTED: { label: '已接单', tone: 'primary' },
  IN_PROGRESS: { label: '进行中', tone: 'warning' },
  COMPLETED: { label: '已完成', tone: 'success' },
}
