import { computed, reactive } from 'vue'
import { normalizeOpportunity } from './opportunityNormalizer'
import { session } from './session'

const STORAGE_KEY = 'yixian-admin-demo-v1'

const seed = {
  applications: [
    {
      id: 101,
      appNo: 'APP202606110018',
      type: 'MATERIAL',
      typeName: '领料申请',
      title: '鼓楼区宽带故障维修领料',
      applicant: '李明',
      applicantId: 101,
      dept: '南京鼓楼分局',
      deptId: 10,
      summary: '光猫 1 台、光纤 2 根，用于中央路客户故障维修',
      status: 'PENDING',
      source: 'APP',
      createTime: '2026-06-11 07:38:00',
      expectedTime: '2026-06-11 14:30:00',
      address: '南京市鼓楼区中央路 168 号',
      urgency: '紧急',
      overdueHours: 2.6,
      records: [{ action: 'SUBMIT', operator: '李明', comment: '通过翼线助手 APP 提交', time: '2026-06-11 07:38:00' }],
    },
    {
      id: 102,
      appNo: 'APP202606110021',
      type: 'VISIT',
      typeName: '外出拜访',
      title: '远景科技专线方案沟通',
      applicant: '王敏',
      applicantId: 201,
      dept: '政企客户部',
      deptId: 20,
      summary: '拜访客户并沟通双线路由与企业专线升级方案',
      status: 'PENDING',
      source: 'APP',
      createTime: '2026-06-11 09:15:00',
      expectedTime: '2026-06-12 10:00:00',
      address: '南京市雨花台区软件大道 168 号',
      urgency: '普通',
      overdueHours: 0.8,
      records: [{ action: 'SUBMIT', operator: '王敏', comment: '通过翼线助手 APP 提交', time: '2026-06-11 09:15:00' }],
    },
    {
      id: 103,
      appNo: 'APP202606110026',
      type: 'SUPPORT',
      typeName: '支撑申请',
      title: '金陵智造园区 5G 专网勘察支撑',
      applicant: '陈晓',
      applicantId: 202,
      dept: '江宁分局',
      deptId: 30,
      summary: '需要政企方案专家协助完成二期厂区现场勘察',
      status: 'PENDING',
      source: 'APP',
      createTime: '2026-06-11 10:06:00',
      expectedTime: '2026-06-12 15:00:00',
      address: '南京市江宁区秣周东路 12 号',
      urgency: '普通',
      overdueHours: 0,
      records: [{ action: 'SUBMIT', operator: '陈晓', comment: '通过翼线助手 APP 提交', time: '2026-06-11 10:06:00' }],
    },
    {
      id: 104,
      appNo: 'APP202606100066',
      type: 'MATERIAL',
      typeName: '领料申请',
      title: '企业专线开通领料',
      applicant: '孙强',
      applicantId: 102,
      dept: '南京鼓楼分局',
      deptId: 10,
      summary: '企业网关 1 台、网线 3 箱',
      status: 'APPROVED',
      source: 'APP',
      createTime: '2026-06-10 15:20:00',
      approveTime: '2026-06-10 16:05:00',
      expectedTime: '2026-06-11 16:00:00',
      address: '南京市雨花台区软件大道 168 号',
      urgency: '普通',
      records: [
        { action: 'APPROVE', operator: '赵主任', comment: '同意，请按客户预约时间处理', time: '2026-06-10 16:05:00' },
        { action: 'SUBMIT', operator: '孙强', comment: '通过翼线助手 APP 提交', time: '2026-06-10 15:20:00' },
      ],
    },
    {
      id: 105,
      appNo: 'APP202606100041',
      type: 'MATERIAL',
      typeName: '领料申请',
      title: '光纤备件补充',
      applicant: '李明',
      applicantId: 101,
      dept: '南京鼓楼分局',
      deptId: 10,
      summary: '申请补充光纤 10 根',
      status: 'REJECTED',
      source: 'APP',
      createTime: '2026-06-10 10:15:00',
      approveTime: '2026-06-10 13:40:00',
      rejectReason: '物料数量与当前工单需求不一致，请核对后重新提交。',
      records: [
        { action: 'REJECT', operator: '赵主任', comment: '物料数量与当前工单需求不一致，请核对后重新提交。', time: '2026-06-10 13:40:00' },
        { action: 'SUBMIT', operator: '李明', comment: '通过翼线助手 APP 提交', time: '2026-06-10 10:15:00' },
      ],
    },
    {
      id: 106,
      appNo: 'APP202606100092',
      type: 'VISIT',
      typeName: '外出拜访',
      title: '金陵智造园区业务交流',
      applicant: '王敏',
      applicantId: 201,
      dept: '政企客户部',
      deptId: 20,
      summary: '园区云网升级需求交流',
      status: 'APPROVED',
      source: 'APP',
      createTime: '2026-06-10 16:45:00',
      approveTime: '2026-06-11 08:30:00',
      expectedTime: '2026-06-11 15:00:00',
      address: '南京市江宁区秣周东路 12 号',
      records: [
        { action: 'APPROVE', operator: '林总监', comment: '同意外出拜访', time: '2026-06-11 08:30:00' },
        { action: 'SUBMIT', operator: '王敏', comment: '通过翼线助手 APP 提交', time: '2026-06-10 16:45:00' },
      ],
    },
  ],
  people: [
    { id: 101, employeeNo: 'ZW10086', name: '李明', role: '装维人员', dept: '南京鼓楼分局', phone: '138****2038', skills: ['宽带', '光猫', '线路抢修'], currentTasks: 2, maxConcurrent: 5, status: 'ENABLED', available: true, score: 92 },
    { id: 102, employeeNo: 'ZW10092', name: '孙强', role: '装维人员', dept: '南京鼓楼分局', phone: '139****7781', skills: ['宽带', '家庭组网'], currentTasks: 1, maxConcurrent: 4, status: 'ENABLED', available: true, score: 88 },
    { id: 103, employeeNo: 'ZW10107', name: '刘洋', role: '装维人员', dept: '南京玄武分局', phone: '137****3305', skills: ['光缆', '线路抢修', '巡检'], currentTasks: 3, maxConcurrent: 5, status: 'ENABLED', available: true, score: 84 },
    { id: 104, employeeNo: 'ZW10118', name: '周杰', role: '装维人员', dept: '南京江宁分局', phone: '136****9260', skills: ['5G 专网', '政企', '方案设计'], currentTasks: 1, maxConcurrent: 3, status: 'ENABLED', available: true, score: 90 },
    { id: 105, employeeNo: 'EX10008', name: '顾伟', role: '方案专家', dept: '省公司政企部', phone: '133****6102', skills: ['政企', '方案设计', '5G 专网'], currentTasks: 2, maxConcurrent: 4, status: 'ENABLED', available: true, score: 95 },
    { id: 201, employeeNo: 'AM10028', name: '王敏', role: '客户经理', dept: '政企客户部', phone: '135****0906', skills: ['制造业', '云网融合'], currentTasks: 0, maxConcurrent: 0, status: 'ENABLED', available: true, score: 86 },
    { id: 202, employeeNo: 'AM10031', name: '陈晓', role: '客户经理', dept: '江宁分局', phone: '132****6842', skills: ['园区客户', '5G'], currentTasks: 0, maxConcurrent: 0, status: 'ENABLED', available: true, score: 82 },
    { id: 108, employeeNo: 'ZW10045', name: '郑凯', role: '装维人员', dept: '南京鼓楼分局', phone: '134****1519', skills: ['宽带'], currentTasks: 0, maxConcurrent: 3, status: 'DISABLED', available: false, score: 78 },
  ],
  tasks: [
    { id: 301, taskNo: 'TASK202606110023', applicationId: 104, applicationNo: 'APP202606100066', type: '装机', title: '远景科技企业专线开通', assigneeId: 101, assignee: '李明', dept: '南京鼓楼分局', status: 'IN_PROGRESS', customer: '南京远景科技有限公司', address: '软件大道 168 号', expectedFinishTime: '2026-06-11 10:30:00', createTime: '2026-06-10 16:06:00', requiredSkills: ['宽带', '光猫'], source: 'APP申请', version: 3, timeline: [{ title: '开始工作', time: '2026-06-11 09:10:00' }, { title: '执行人接单', time: '2026-06-11 08:45:00' }, { title: 'AI 推荐并确认派单', time: '2026-06-10 16:12:00' }] },
    { id: 302, taskNo: 'TASK202606110027', applicationId: 110, applicationNo: 'APP202606100071', type: '维修', title: '中央路宽带故障维修', assigneeId: 102, assignee: '孙强', dept: '南京鼓楼分局', status: 'ACCEPTED', customer: '张先生', address: '中央路 168 号', expectedFinishTime: '2026-06-11 13:00:00', createTime: '2026-06-11 08:10:00', requiredSkills: ['宽带', '线路抢修'], source: 'APP申请', version: 2, timeline: [{ title: '执行人接单', time: '2026-06-11 09:02:00' }, { title: '调度员派单', time: '2026-06-11 08:18:00' }] },
    { id: 303, taskNo: 'TASK202606110031', applicationId: 111, applicationNo: 'APP202606100076', type: '巡检', title: '金陵智造园区网络巡检', assigneeId: 104, assignee: '周杰', dept: '南京江宁分局', status: 'PENDING_ACCEPTANCE', customer: '金陵智造产业园', address: '秣周东路 12 号', expectedFinishTime: '2026-06-11 16:00:00', createTime: '2026-06-11 09:30:00', requiredSkills: ['5G 专网'], source: 'APP申请', version: 1, timeline: [{ title: 'AI 自动派单', time: '2026-06-11 09:32:00' }] },
    { id: 304, taskNo: 'TASK202606110036', applicationId: 112, applicationNo: 'APP202606110009', type: '技术支撑', title: '政企云网方案评审', assigneeId: 105, assignee: '顾伟', dept: '省公司政企部', status: 'IN_PROGRESS', customer: '江苏云创信息技术有限公司', address: '新模范马路 66 号', expectedFinishTime: '2026-06-12 09:30:00', createTime: '2026-06-11 09:42:00', requiredSkills: ['政企', '方案设计'], source: 'APP申请', version: 3, timeline: [{ title: '开始工作', time: '2026-06-11 10:20:00' }, { title: '执行人接单', time: '2026-06-11 10:05:00' }] },
    { id: 305, taskNo: 'TASK202606110039', applicationId: 113, applicationNo: 'APP202606110012', type: '维修', title: '中山北路光猫离线处理', assigneeId: 103, assignee: '刘洋', dept: '南京玄武分局', status: 'PENDING_ACCEPTANCE', customer: '陈女士', address: '中山北路 99 号', expectedFinishTime: '2026-06-11 18:30:00', createTime: '2026-06-11 10:03:00', requiredSkills: ['光缆'], source: 'APP申请', version: 1, timeline: [{ title: '调度员派单', time: '2026-06-11 10:10:00' }] },
    { id: 306, taskNo: 'TASK202606110043', applicationId: 114, applicationNo: 'APP202606110014', type: '装机', title: '鼓楼新装宽带上门施工', assigneeId: null, assignee: '', dept: '南京鼓楼分局', status: 'UNASSIGNED', customer: '赵先生', address: '云南北路 28 号', expectedFinishTime: '2026-06-12 12:00:00', createTime: '2026-06-11 10:16:00', requiredSkills: ['宽带', '光猫'], source: 'APP申请', version: 0, timeline: [{ title: '审批通过并生成任务', time: '2026-06-11 10:16:00' }] },
    { id: 307, taskNo: 'TASK202606110046', applicationId: 115, applicationNo: 'APP202606110016', type: '技术支撑', title: '江宁园区组网方案支撑', assigneeId: null, assignee: '', dept: '南京江宁分局', status: 'UNASSIGNED', customer: '华东智造有限公司', address: '胜太路 88 号', expectedFinishTime: '2026-06-12 16:00:00', createTime: '2026-06-11 10:28:00', requiredSkills: ['政企', '方案设计'], source: 'APP申请', version: 0, timeline: [{ title: '审批通过并生成任务', time: '2026-06-11 10:28:00' }] },
    { id: 308, taskNo: 'TASK202606100088', applicationId: 109, applicationNo: 'APP202606090052', type: '维修', title: '宽带线路维修', assigneeId: 101, assignee: '李明', dept: '南京鼓楼分局', status: 'COMPLETED', customer: '刘先生', address: '湖南路 55 号', expectedFinishTime: '2026-06-10 16:30:00', actualFinishTime: '2026-06-10 15:48:00', startTime: '2026-06-10 14:20:00', createTime: '2026-06-10 09:05:00', requiredSkills: ['宽带'], source: 'APP申请', version: 4, timeline: [{ title: 'APP 完工反馈', time: '2026-06-10 15:48:00' }, { title: '开始工作', time: '2026-06-10 14:20:00' }] },
    { id: 309, taskNo: 'TASK202606090076', applicationId: 108, applicationNo: 'APP202606090031', type: '巡检', title: '园区网络例行巡检', assigneeId: 103, assignee: '刘洋', dept: '南京玄武分局', status: 'COMPLETED', customer: '南京科创园', address: '珠江路 88 号', expectedFinishTime: '2026-06-10 12:00:00', actualFinishTime: '2026-06-10 12:35:00', startTime: '2026-06-10 10:10:00', createTime: '2026-06-09 15:05:00', requiredSkills: ['巡检'], source: 'APP申请', version: 4, timeline: [{ title: 'APP 完工反馈', time: '2026-06-10 12:35:00' }] },
  ],
  dispatchRecords: [
    { id: 1, taskNo: 'TASK202606110023', assignee: '李明', previousAssignee: '-', type: 'AI_RECOMMEND', score: 92, operator: '赵主任', time: '2026-06-10 16:12:00', reason: '技能完全匹配，当前负载 1/5，同部门优先' },
    { id: 2, taskNo: 'TASK202606110031', assignee: '周杰', previousAssignee: '-', type: 'AUTO', score: 94, operator: '系统', time: '2026-06-11 09:32:00', reason: '5G 专网技能匹配，江宁区域可服务' },
  ],
  visits: [
    { id: 1, date: '2026-06-09', manager: '王敏', dept: '政企客户部', customer: '南京远景科技有限公司', industry: '软件信息', status: 'COMPLETED' },
    { id: 2, date: '2026-06-10', manager: '王敏', dept: '政企客户部', customer: '金陵智造产业园', industry: '智能制造', status: 'COMPLETED' },
    { id: 3, date: '2026-06-10', manager: '陈晓', dept: '江宁分局', customer: '华东智造有限公司', industry: '智能制造', status: 'COMPLETED' },
    { id: 4, date: '2026-06-11', manager: '王敏', dept: '政企客户部', customer: '江苏云创信息技术有限公司', industry: '软件信息', status: 'PLANNED' },
    { id: 5, date: '2026-06-11', manager: '陈晓', dept: '江宁分局', customer: '金陵智造产业园', industry: '智能制造', status: 'COMPLETED' },
  ],
  opportunities: [
    {
      id: 1,
      code: 'SJ20260608012',
      customer: '南京远景科技有限公司',
      title: '园区云网升级项目',
      industry: '软件信息',
      customerType: 'ENTERPRISE',
      level: '高',
      amount: 1200000,
      status: 'FOLLOWING',
      statusName: '跟进中',
      needMaintainer: true,
      nextContactTime: '2026-06-13 16:00:00',
      ownerId: 201,
      owner: '王敏',
      ownerJobNo: 'AM10028',
      ownerRoleCode: 'ACCOUNT_MANAGER',
      creatorId: 201,
      creatorName: '王敏',
      creatorRole: '客户经理',
      creatorJobNo: 'AM10028',
      creatorDept: '政企客户部',
      createTime: '2026-06-08 09:20:00',
      lastFollowTime: '2026-06-11 09:20:00',
      description: '客户计划升级园区网络并增加双线路由能力。',
      follows: [
        { id: 'FOLLOW-001', time: '2026-06-10 09:20:00', content: '客户确认需要双线路由方案，计划本周五安排技术交流。', owner: '王敏' },
        { id: 'FOLLOW-002', time: '2026-06-09 14:10:00', content: '完成首次需求访谈，客户关注网络稳定性和故障切换时长。', owner: '王敏' },
      ],
      source: 'APP',
    },
    {
      id: 2,
      code: 'SJ20260606008',
      customer: '金陵智造产业园',
      title: '5G 专网扩容',
      industry: '智能制造',
      customerType: 'ENTERPRISE',
      level: '高',
      amount: 2800000,
      status: 'HIGH_INTENT',
      statusName: '高意向',
      needMaintainer: true,
      nextContactTime: '2026-06-14 10:00:00',
      ownerId: 201,
      owner: '王敏',
      ownerJobNo: 'AM10028',
      ownerRoleCode: 'ACCOUNT_MANAGER',
      creatorId: 201,
      creatorName: '王敏',
      creatorRole: '客户经理',
      creatorJobNo: 'AM10028',
      creatorDept: '政企客户部',
      createTime: '2026-06-06 11:30:00',
      lastFollowTime: '2026-06-10 16:30:00',
      description: '二期厂区新增 5G 专网覆盖。',
      follows: [
        { id: 'FOLLOW-003', time: '2026-06-09 16:30:00', content: '已提交初版覆盖方案，等待客户确认现场勘察时间。', owner: '王敏' },
      ],
      source: 'APP',
    },
    {
      id: 3,
      code: 'SJ20260603003',
      customer: '江苏云创信息技术有限公司',
      title: '云桌面接入项目',
      industry: '软件信息',
      customerType: 'ENTERPRISE',
      level: '中',
      amount: 560000,
      status: 'NEW',
      statusName: '新建',
      needMaintainer: false,
      nextContactTime: '2026-06-13 14:00:00',
      ownerId: 201,
      owner: '王敏',
      ownerJobNo: 'AM10028',
      ownerRoleCode: 'ACCOUNT_MANAGER',
      creatorId: 201,
      creatorName: '王敏',
      creatorRole: '客户经理',
      creatorJobNo: 'AM10028',
      creatorDept: '政企客户部',
      createTime: '2026-06-03 10:05:00',
      lastFollowTime: '2026-06-08 11:20:00',
      description: '客户初步咨询 80 席云桌面接入。',
      follows: [],
      source: 'APP',
    },
    {
      id: 4,
      code: 'SJ20260528019',
      customer: '华东智造有限公司',
      title: '智能工厂组网升级',
      industry: '智能制造',
      customerType: 'ENTERPRISE',
      level: '高',
      amount: 1900000,
      status: 'SIGNED',
      statusName: '已签约',
      needMaintainer: true,
      nextContactTime: '2026-06-12 09:30:00',
      ownerId: 202,
      owner: '陈晓',
      ownerJobNo: 'AM10031',
      ownerRoleCode: 'ACCOUNT_MANAGER',
      creatorId: 202,
      creatorName: '陈晓',
      creatorRole: '客户经理',
      creatorJobNo: 'AM10031',
      creatorDept: '江宁分局',
      createTime: '2026-05-28 14:18:00',
      lastFollowTime: '2026-06-09 15:10:00',
      description: '已完成合同确认，因客户需要现场实施，后续进入装维派单流程。',
      follows: [
        { id: 'FOLLOW-004', time: '2026-06-09 15:10:00', content: '合同已签回，等待项目实施排期。', owner: '陈晓' },
      ],
      source: 'APP',
    },
    {
      id: 5,
      code: 'SJ20260522011',
      customer: '南京科创园',
      title: '园区云办公咨询',
      industry: '园区',
      customerType: 'ENTERPRISE',
      level: '中',
      amount: 860000,
      status: 'CLOSED',
      statusName: '已关闭',
      needMaintainer: false,
      ownerId: 202,
      owner: '陈晓',
      ownerJobNo: 'AM10031',
      ownerRoleCode: 'ACCOUNT_MANAGER',
      creatorId: 202,
      creatorName: '陈晓',
      creatorRole: '客户经理',
      creatorJobNo: 'AM10031',
      creatorDept: '江宁分局',
      createTime: '2026-05-22 09:05:00',
      lastFollowTime: '2026-06-07 10:05:00',
      description: '客户本期预算延后，商机关闭并保留后续回访线索。',
      follows: [
        { id: 'FOLLOW-005', time: '2026-06-07 10:05:00', content: '客户确认本期暂不推进，保留明年预算窗口。', owner: '陈晓' },
      ],
      source: 'APP',
    },
    {
      id: 6,
      code: 'SJ20260612009',
      customer: '张先生',
      title: '家庭宽带升级融合套餐',
      industry: '公众客户',
      customerType: 'PUBLIC',
      level: '中',
      amount: 3600,
      status: 'FOLLOWING',
      statusName: '跟进中',
      needMaintainer: true,
      nextContactTime: '2026-06-14 15:00:00',
      ownerId: 101,
      owner: '李明',
      ownerJobNo: 'ZW10086',
      ownerRoleCode: 'MAINTAINER',
      creatorId: 101,
      creatorName: '李明',
      creatorRole: '装维人员',
      creatorJobNo: 'ZW10086',
      creatorDept: '南京鼓楼分局',
      createTime: '2026-06-12 10:30:00',
      lastFollowTime: '2026-06-12 10:30:00',
      description: '装维上门时客户咨询带宽升级和全屋 Wi-Fi 覆盖。',
      follows: [
        { id: 'FOLLOW-006', time: '2026-06-12 10:30:00', content: '已记录客户升级意向，约定明天下午回访确认套餐。', owner: '李明' },
      ],
      source: 'APP',
    },
  ],
  dictionaries: [
    { id: 1, group: '申请类型', code: 'MATERIAL', label: '领料申请', color: '#3b82f6', status: 'ENABLED', sort: 10 },
    { id: 2, group: '申请类型', code: 'VISIT', label: '外出拜访', color: '#8b5cf6', status: 'ENABLED', sort: 20 },
    { id: 3, group: '申请类型', code: 'SUPPORT', label: '支撑申请', color: '#0ea5e9', status: 'ENABLED', sort: 30 },
    { id: 4, group: '意向等级', code: 'HIGH', label: '高', color: '#f97316', status: 'ENABLED', sort: 10 },
    { id: 5, group: '任务类型', code: 'REPAIR', label: '维修', color: '#ef4444', status: 'ENABLED', sort: 10 },
    { id: 6, group: '系统阈值', code: 'APPROVAL_TIMEOUT', label: '审批超时 4 小时', color: '#64748b', status: 'ENABLED', sort: 10 },
  ],
  logs: [
    { id: 1, operator: '赵主任', role: '部门管理员', module: '审批中心', action: '审批通过', objectNo: 'APP202606100066', result: '成功', ip: '10.22.18.6', time: '2026-06-10 16:05:00', summary: '申请状态 PENDING → APPROVED' },
    { id: 2, operator: '系统', role: '系统任务', module: '任务派单', action: 'AI 自动派单', objectNo: 'TASK202606110031', result: '成功', ip: '127.0.0.1', time: '2026-06-11 09:32:00', summary: '推荐周杰，综合分 94' },
    { id: 3, operator: '王敏', role: '客户经理', module: 'APP 数据接入', action: '提交拜访申请', objectNo: 'APP202606110021', result: '成功', ip: '10.22.31.18', time: '2026-06-11 09:15:00', summary: 'APP 幂等键 app-9d3f****' },
  ],
}

const clone = (value) => JSON.parse(JSON.stringify(value))

function hydrateOpportunities(data) {
  const people = Array.isArray(data.people) ? data.people : seed.people
  const seedById = new Map(seed.opportunities.map((item) => [String(item.id), item]))
  const seedByCode = new Map(seed.opportunities.map((item) => [item.code, item]))
  const rows = Array.isArray(data.opportunities) ? data.opportunities : []
  const normalizedRows = rows.map((row) => {
    const seedRow = seedById.get(String(row.id)) || seedByCode.get(row.code)
    return normalizeOpportunity(seedRow ? { ...seedRow, ...row } : row, people)
  })
  const ids = new Set(normalizedRows.map((item) => String(item.id)))
  const codes = new Set(normalizedRows.map((item) => item.code))
  seed.opportunities.forEach((item) => {
    if (!ids.has(String(item.id)) && !codes.has(item.code)) {
      normalizedRows.push(normalizeOpportunity(item, people))
    }
  })
  data.opportunities = normalizedRows
  return data
}

function restore() {
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return hydrateOpportunities(cached && cached.applications ? cached : clone(seed))
  } catch {
    return hydrateOpportunities(clone(seed))
  }
}

export const state = reactive(restore())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function nowText() {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date()).replaceAll('/', '-')
}

function addLog(module, action, objectNo, summary, result = '成功') {
  state.logs.unshift({
    id: Date.now(),
    operator: session.user?.realName || '演示用户',
    role: session.user?.roleName || '-',
    module,
    action,
    objectNo,
    result,
    ip: '10.22.18.8',
    time: nowText(),
    summary,
  })
}

export function approveApplication(application, comment = '') {
  if (application.status !== 'PENDING') throw new Error('当前记录状态已变化，请刷新后重试')
  application.status = 'APPROVED'
  application.approveTime = nowText()
  application.approvedAt = application.approveTime
  application.approverId = session.user.userId
  application.approverName = session.user.realName
  application.records.unshift({ action: 'APPROVE', operator: session.user.realName, comment: comment || '同意申请', time: application.approveTime })
  let task = null
  if (application.type !== 'VISIT') {
    task = {
      id: Date.now(),
      taskNo: `TASK${Date.now().toString().slice(-12)}`,
      applicationId: application.id,
      applicationNo: application.appNo,
      type: application.type === 'SUPPORT' ? '技术支撑' : '维修',
      title: application.title,
      assigneeId: null,
      assignee: '',
      dept: application.dept,
      status: 'UNASSIGNED',
      customer: application.type === 'SUPPORT' ? '申请关联客户' : application.applicant,
      address: application.address,
      expectedFinishTime: application.expectedTime,
      createTime: application.approveTime,
      requiredSkills: application.type === 'SUPPORT' ? ['政企', '方案设计'] : ['宽带', '光猫'],
      source: 'APP申请',
      version: 0,
      timeline: [{ title: '审批通过并生成任务', time: application.approveTime }],
    }
    state.tasks.unshift(task)
  }
  addLog('审批中心', '审批通过', application.appNo, task ? `已创建待派任务 ${task.taskNo}` : '拜访申请已通过，无需派单')
  persist()
  return task
}

export function rejectApplication(application, reason) {
  if (application.status !== 'PENDING') throw new Error('当前记录状态已变化，请刷新后重试')
  application.status = 'REJECTED'
  application.rejectReason = reason
  application.approveTime = nowText()
  application.approvedAt = application.approveTime
  application.approverId = session.user.userId
  application.approverName = session.user.realName
  application.records.unshift({ action: 'REJECT', operator: session.user.realName, comment: reason, time: application.approveTime })
  addLog('审批中心', '审批驳回', application.appNo, reason)
  persist()
}

export function dispatchTask(task, person, remark = '', dispatchType = 'MANUAL') {
  if (!person || person.status !== 'ENABLED' || !person.available) throw new Error('所选人员当前不可接单')
  if (person.currentTasks >= person.maxConcurrent) throw new Error('所选人员已达到最大并发任务数')
  const previousAssignee = task.assignee || '-'
  const previous = state.people.find((item) => item.id === task.assigneeId)
  if (previous && previous.currentTasks > 0) previous.currentTasks -= 1
  task.assigneeId = person.id
  task.assignee = person.name
  task.status = 'PENDING_ACCEPTANCE'
  task.version += 1
  task.aiReason = `技能匹配：${task.requiredSkills.filter((skill) => person.skills.includes(skill)).join('、') || '基础能力'}；当前负载 ${person.currentTasks}/${person.maxConcurrent}`
  task.timeline.unshift({ title: previousAssignee === '-' ? '任务已派单' : '管理员改派', time: nowText() })
  person.currentTasks += 1
  state.dispatchRecords.unshift({
    id: Date.now(),
    taskNo: task.taskNo,
    assignee: person.name,
    previousAssignee,
    type: dispatchType,
    score: candidateScore(task, person),
    operator: session.user.realName,
    time: nowText(),
    reason: remark || task.aiReason,
  })
  addLog('任务派单', previousAssignee === '-' ? '确认派单' : '任务改派', task.taskNo, `${previousAssignee} → ${person.name}；${remark || '按推荐结果派发'}`)
  persist()
}

export function updatePerson(person, patch) {
  const before = `${person.status}/${person.skills.join('、')}`
  Object.assign(person, patch)
  if (patch.status) person.available = patch.status === 'ENABLED'
  addLog('人员与技能', '人员信息变更', person.employeeNo, `${before} → ${person.status}/${person.skills.join('、')}`)
  persist()
}

export function updateDictionary(item, patch) {
  Object.assign(item, patch)
  addLog('系统设置', '字典变更', item.code, `${item.group}：${item.label}`)
  persist()
}

export function candidateScore(task, person) {
  const required = task.requiredSkills || []
  const matched = required.filter((skill) => person.skills.includes(skill)).length
  const skillScore = required.length ? (matched / required.length) * 60 : 45
  const loadScore = person.maxConcurrent ? Math.max(0, 30 * (1 - person.currentTasks / person.maxConcurrent)) : 0
  const deptScore = person.dept === task.dept ? 10 : 4
  return Math.round(skillScore + loadScore + deptScore)
}

export function candidatesFor(task) {
  const requiredSkills = task.requiredSkills || []
  return state.people
    .filter((person) => ['装维人员', '方案专家'].includes(person.role)
      && person.status === 'ENABLED'
      && person.available
      && person.currentTasks < person.maxConcurrent
      && requiredSkills.every((skill) => person.skills.includes(skill)))
    .map((person) => ({ ...person, aiScore: candidateScore(task, person) }))
    .sort((a, b) => b.aiScore - a.aiScore)
}

export function resetDemo() {
  Object.keys(state).forEach((key) => {
    state[key].splice(0, state[key].length, ...clone(seed[key]))
  })
  persist()
}

export const pendingApplications = computed(() => state.applications.filter((item) => item.status === 'PENDING'))
export const unassignedTasks = computed(() => state.tasks.filter((item) => item.status === 'UNASSIGNED'))
export const activeTasks = computed(() => state.tasks.filter((item) => ['PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS'].includes(item.status)))
export const metricSnapshot = Object.freeze({
  weeklyCompletionRate: 88.6,
  weeklyCompleted: 74,
  weeklyExpected: 84,
  averageDuration: 2.4,
  overdueRate: 7.1,
})

export function warningLevel(task) {
  if (!task.expectedFinishTime) return 'GRAY'
  const diff = new Date(task.expectedFinishTime.replace(' ', 'T')).getTime() - Date.now()
  if (diff < 0) return 'RED'
  if (diff <= 4 * 60 * 60 * 1000) return 'YELLOW'
  return 'GREEN'
}

export function warningText(task) {
  const level = warningLevel(task)
  if (level === 'GRAY') return '时间缺失'
  const diffHours = Math.abs(new Date(task.expectedFinishTime.replace(' ', 'T')).getTime() - Date.now()) / 3600000
  if (level === 'RED') return `已超时 ${diffHours < 1 ? Math.ceil(diffHours * 60) + ' 分钟' : diffHours.toFixed(1) + ' 小时'}`
  if (level === 'YELLOW') return `剩余 ${diffHours.toFixed(1)} 小时`
  return `剩余 ${diffHours < 24 ? diffHours.toFixed(1) + ' 小时' : Math.ceil(diffHours / 24) + ' 天'}`
}
