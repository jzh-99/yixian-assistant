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
]

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
