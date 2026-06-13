import {
  APPLICATION_STATUS,
  APPLICATION_TYPE,
  OPPORTUNITY_STATUS,
  TASK_STATUS,
} from './contracts'

function parseJson(value, fallback) {
  if (!value) return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function displayTime(value) {
  return value ? value.replace('T', ' ').slice(0, 16) : '待设置'
}

function statusName(status) {
  return {
    [APPLICATION_STATUS.DRAFT]: '草稿',
    [APPLICATION_STATUS.PENDING]: '待审批',
    [APPLICATION_STATUS.APPROVED]: '已通过',
    [APPLICATION_STATUS.REJECTED]: '已驳回',
    [APPLICATION_STATUS.CANCELLED]: '已撤回',
  }[status] || status
}

function approvalTimeline(item) {
  const submitted = {
    title: '申请已提交',
    time: displayTime(item.createTime),
    note: item.applicantName ? `申请人：${item.applicantName}` : '等待审批',
    state: item.status === APPLICATION_STATUS.PENDING ? 'current' : 'done',
  }
  if (item.status === APPLICATION_STATUS.PENDING) return [submitted]

  const processed = displayTime(item.approvedAt || item.updateTime)
  if (item.status === APPLICATION_STATUS.APPROVED) {
    return [{
      title: '审批通过',
      time: processed,
      note: item.approverName ? `审批人：${item.approverName}` : '审批通过',
      state: 'done',
    }, submitted]
  }
  if (item.status === APPLICATION_STATUS.REJECTED) {
    return [{
      title: '审批驳回',
      time: processed,
      note: item.approverName ? `审批人：${item.approverName}` : '审批驳回',
      state: 'error',
    }, submitted]
  }
  if (item.status === APPLICATION_STATUS.CANCELLED) {
    return [{
      title: '申请已撤回',
      time: displayTime(item.updateTime),
      note: '申请人撤回申请',
      state: 'error',
    }, submitted]
  }
  return [{
    title: '状态已更新',
    time: displayTime(item.updateTime || item.createTime),
    note: '请查看当前状态',
    state: 'current',
  }]
}

export function taskFromApi(item) {
  const materials = parseJson(item.materialsJson, [])
  return {
    id: String(item.id),
    code: item.taskNo,
    type: item.title || item.type || '现场任务',
    customer: item.customerName || '客户信息待补充',
    phone: item.contactPhone || '',
    address: item.address || '地址待补充',
    expectedAt: displayTime(item.expectedFinishTime),
    createdAt: displayTime(item.createTime),
    materials: materials.map((material) =>
      typeof material === 'string'
        ? material
        : `${material.name} ×${material.quantity}${material.unit || ''}`,
    ),
    status: item.status || TASK_STATUS.UNASSIGNED,
    overdue: Boolean(item.expectedFinishTime && new Date(item.expectedFinishTime) < new Date() && item.status !== TASK_STATUS.COMPLETED),
    overdueText: '已超过期望完成时间',
    completedAt: displayTime(item.actualFinishTime),
    version: item.version || 0,
  }
}

export function applicationFromApi(item, roleCode) {
  const extra = parseJson(item.extraJson ?? item.extra, {})
  const typeName = {
    [APPLICATION_TYPE.MATERIAL]: '领料申请',
    [APPLICATION_TYPE.VISIT]: '外出拜访',
    [APPLICATION_TYPE.SUPPORT]: '支撑申请',
  }[item.type] || item.type
  const fields = Object.entries(extra).map(([key, value]) => [
    {
      location: '地址',
      expectedTime: '期望时间',
      urgency: '紧急程度',
      materials: '物料清单',
      customerName: '客户名称',
      supportType: '支撑类型',
    }[key] || key,
    Array.isArray(value)
      ? value.map((entry) => typeof entry === 'string' ? entry : `${entry.name} ×${entry.quantity}${entry.unit || ''}`).join('、')
      : typeof value === 'boolean' ? (value ? '是' : '否') : String(value ?? ''),
  ])
  return {
    id: String(item.id),
    code: item.appNo,
    applicantId: item.applicantId ? String(item.applicantId) : '',
    applicantName: item.applicantName || '',
    type: item.type,
    typeName,
    title: item.title,
    content: item.content || '',
    submittedAt: displayTime(item.createTime),
    status: item.status || APPLICATION_STATUS.DRAFT,
    statusName: statusName(item.status),
    applicantRoleCode: roleCode,
    rejectReason: item.rejectReason,
    approverId: item.approverId ? String(item.approverId) : '',
    approverName: item.approverName || '',
    approvedAt: item.approvedAt ? displayTime(item.approvedAt) : '',
    fields,
    timeline: approvalTimeline(item),
  }
}

export function visitFromApi(item) {
  return {
    id: String(item.id),
    time: item.visitTime ? item.visitTime.slice(11, 16) : '--:--',
    customer: item.customerName || `客户 #${item.customerId || '-'}`,
    purpose: item.summary || '客户拜访',
    address: item.location || '地点待补充',
    checkedIn: Boolean(item.checkinTime),
    checkedAt: item.checkinTime ? item.checkinTime.slice(11, 16) : '',
  }
}

export function opportunityFromApi(item) {
  const level = item.intentLevel === 'HIGH' ? 'A' : item.intentLevel === 'LOW' ? 'C' : 'B'
  return {
    id: String(item.id),
    code: item.opportunityNo || `SJ${item.id}`,
    customer: item.customerName || `客户 #${item.customerId || '-'}`,
    name: item.title,
    level,
    amount: Math.round(Number(item.estimatedAmount || 0) / 100),
    status: item.status || OPPORTUNITY_STATUS.NEW,
    statusName: item.status,
    nextContact: displayTime(item.nextContactTime),
    owner: item.managerName || '当前客户经理',
    createdAt: displayTime(item.createTime),
    lastFollowAt: displayTime(item.lastFollowTime),
    description: item.description || '',
    follows: item.follows || [],
  }
}
