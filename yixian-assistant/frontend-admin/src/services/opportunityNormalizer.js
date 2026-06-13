export const opportunityStatusOptions = [
  { value: 'NEW', label: '新建', type: 'info', color: '#64748b', order: 10 },
  { value: 'FOLLOWING', label: '跟进中', type: 'primary', color: '#2563eb', order: 20 },
  { value: 'HIGH_INTENT', label: '高意向', type: 'warning', color: '#f59e0b', order: 30 },
  { value: 'SIGNED', label: '已签约', type: 'success', color: '#10b981', order: 40 },
  { value: 'CLOSED', label: '已关闭', type: 'info', color: '#94a3b8', order: 50 },
]

export const customerTypeOptions = [
  { value: 'PUBLIC', label: '公众' },
  { value: 'ENTERPRISE', label: '政企' },
]

const statusMap = new Map(opportunityStatusOptions.map((item) => [item.value, item]))
const customerTypeMap = new Map(customerTypeOptions.map((item) => [item.value, item.label]))

const roleCodeMap = {
  ACCOUNT_MANAGER: '客户经理',
  CUSTOMER_MANAGER: '客户经理',
  MANAGER: '客户经理',
  MAINTAINER: '装维人员',
  INSTALLER: '装维人员',
  INSTALL_MAINTAINER: '装维人员',
}

const levelMap = {
  A: '高',
  B: '中',
  C: '低',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
  HIGH_INTENT: '高',
  高: '高',
  中: '中',
  低: '低',
}

function normalizeTime(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 19)
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    return !['false', '0', 'no', '否', '无需', ''].includes(value.trim().toLowerCase())
  }
  return Boolean(value)
}

function normalizeAmount(row) {
  const estimatedAmount = row.estimatedAmount ?? row.estimated_amount
  const rawAmount = row.amount ?? estimatedAmount ?? 0
  const amount = Number(rawAmount)
  if (!Number.isFinite(amount)) return 0
  return row.amount === undefined && estimatedAmount !== undefined ? Math.round(amount / 100) : amount
}

function findCreator(row, people) {
  const creatorId = row.creatorId ?? row.ownerId ?? row.managerId ?? row.applicantId
  const creatorJobNo = row.creatorJobNo || row.ownerJobNo || row.managerEmployeeNo || row.employeeNo || ''
  return people.find((item) => String(item.id) === String(creatorId) || item.employeeNo === creatorJobNo)
}

export function opportunityStatusMeta(value) {
  return statusMap.get(value) || { label: value || '-', type: 'info', color: '#94a3b8', order: 99 }
}

export function customerTypeName(value) {
  return customerTypeMap.get(value) || customerTypeMap.get('PUBLIC')
}

export function normalizeOpportunity(row = {}, people = []) {
  const creator = findCreator(row, people)
  const creatorId = row.creatorId ?? row.ownerId ?? row.managerId ?? creator?.id ?? ''
  const creatorJobNo = row.creatorJobNo || row.ownerJobNo || row.managerEmployeeNo || creator?.employeeNo || ''
  const creatorRole = row.creatorRole || roleCodeMap[row.creatorRoleCode || row.ownerRoleCode] || creator?.role || ''
  const creatorName = row.creatorName || row.owner || row.managerName || row.applicantName || creator?.name || 'APP 用户'
  const customerType = row.customerType || row.customer_type || 'PUBLIC'
  const status = row.status || 'NEW'
  const statusMeta = opportunityStatusMeta(status)
  const level = levelMap[row.level] || levelMap[row.intentLevel] || row.level || row.intentLevel || '中'
  const createTime = normalizeTime(row.createTime || row.createdAt || row.created_at)
  const lastFollowTime = normalizeTime(row.lastFollowTime || row.lastFollowAt || row.updateTime || row.updatedAt)
  const title = row.title || row.name || row.opportunityName || row.customerName || row.customer || '未命名商机'

  return {
    ...row,
    id: String(row.id ?? row.opportunityId ?? row.opportunityNo ?? row.code),
    code: row.code || row.opportunityNo || row.opportunity_no || `SJ${row.id || ''}`,
    customer: row.customer || row.customerName || row.customer_name || `客户 #${row.customerId || '-'}`,
    customerType,
    customerTypeName: customerTypeName(customerType),
    name: title,
    title,
    industry: row.industry || row.customerIndustry || (customerType === 'ENTERPRISE' ? '政企客户' : '公众客户'),
    level,
    levelName: level,
    amount: normalizeAmount(row),
    status,
    statusName: statusMeta.label,
    statusOrder: statusMeta.order,
    needMaintainer: toBoolean(row.needMaintainer ?? row.need_maintainer),
    nextContactTime: normalizeTime(row.nextContactTime || row.nextContact),
    creatorId: String(creatorId || ''),
    creatorName,
    creatorRole,
    creatorJobNo,
    creatorDept: row.creatorDept || row.dept || row.deptName || creator?.dept || '',
    ownerId: String(row.ownerId ?? row.managerId ?? creatorId ?? ''),
    owner: row.owner || row.managerName || creatorName,
    ownerJobNo: row.ownerJobNo || row.managerEmployeeNo || creatorJobNo,
    ownerRoleCode: row.ownerRoleCode || row.creatorRoleCode || '',
    createTime,
    createdAt: createTime,
    lastFollowTime,
    lastFollowAt: lastFollowTime,
    description: row.description || row.summary || '',
    source: row.source || 'APP',
    follows: Array.isArray(row.follows) ? row.follows : [],
  }
}
