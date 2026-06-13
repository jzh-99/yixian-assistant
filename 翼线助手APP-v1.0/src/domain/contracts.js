export const ROLE_CODE = Object.freeze({
  MAINTAINER: 'MAINTAINER',
  ACCOUNT_MANAGER: 'ACCOUNT_MANAGER',
})

export const APPLICATION_TYPE = Object.freeze({
  MATERIAL: 'MATERIAL',
  VISIT: 'VISIT',
  SUPPORT: 'SUPPORT',
})

export const APPLICATION_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
})

export const TASK_STATUS = Object.freeze({
  UNASSIGNED: 'UNASSIGNED',
  PENDING_ACCEPTANCE: 'PENDING_ACCEPTANCE',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
})

export const OPPORTUNITY_STATUS = Object.freeze({
  NEW: 'NEW',
  FOLLOWING: 'FOLLOWING',
  HIGH_INTENT: 'HIGH_INTENT',
  SIGNED: 'SIGNED',
  CLOSED: 'CLOSED',
})

export const CUSTOMER_TYPE = Object.freeze({
  PUBLIC: 'PUBLIC',
  ENTERPRISE: 'ENTERPRISE',
})

const roleMeta = {
  [ROLE_CODE.MAINTAINER]: { roleName: '装维人员', fallbackName: '装维人员' },
  [ROLE_CODE.ACCOUNT_MANAGER]: { roleName: '客户经理', fallbackName: '客户经理' },
}

export function isMaintainer(user) {
  return user?.roleCode === ROLE_CODE.MAINTAINER
}

export function normalizeCurrentUser(rawUser = {}) {
  const roleCode = rawUser.roleCode || (rawUser.role === 'manager' ? ROLE_CODE.ACCOUNT_MANAGER : ROLE_CODE.MAINTAINER)
  const meta = roleMeta[roleCode] || roleMeta[ROLE_CODE.MAINTAINER]
  const name = rawUser.realName || rawUser.name || meta.fallbackName

  return {
    id: String(rawUser.userId ?? rawUser.id ?? ''),
    username: rawUser.username || rawUser.employeeNo || rawUser.jobNo || '',
    name,
    shortName: rawUser.shortName || (roleCode === ROLE_CODE.MAINTAINER ? `${name.slice(0, 1)}师傅` : `${name.slice(0, 1)}经理`),
    jobNo: rawUser.employeeNo || rawUser.jobNo || rawUser.username || '',
    roleCode,
    roleName: rawUser.roleName || meta.roleName,
    deptId: rawUser.deptId ?? null,
    department: rawUser.deptName || rawUser.department || '',
    skills: rawUser.skills || [],
    customers: rawUser.customers || [],
  }
}

export function toContractDateTime(value) {
  if (!value) return null
  return value.replace('T', ' ').padEnd(19, ':00').slice(0, 19)
}

export function fromContractDateTime(value) {
  if (!value) return ''
  return value.replace(' ', 'T').slice(0, 16)
}

export function toSmartFormModel(result, applicationType) {
  const fields = result?.fields || {}
  const warnings = result?.warnings || []
  const confidence = Number(result?.confidence ?? 1)

  if (applicationType === APPLICATION_TYPE.MATERIAL) {
    return {
      reason: fields.title || fields.content || '',
      address: fields.location || '',
      expectedAt: fromContractDateTime(fields.expectedTime),
      urgency: fields.urgency === 'URGENT' ? '紧急' : '普通',
      materials: (fields.materials || []).map((item) => ({
        id: crypto.randomUUID(),
        name: item.name || '',
        quantity: item.quantity || 1,
        unit: item.unit || '个',
        confidence: confidence < 0.6 ? 'low' : warnings.some((warning) => warning.field === 'materials') ? 'medium' : 'high',
      })),
      missing: result?.missingFields || [],
      warnings,
      confidence,
    }
  }

  return {
    customer: fields.customerName || '',
    purpose: fields.purpose || fields.content || fields.title || '',
    expectedAt: fromContractDateTime(fields.expectedTime),
    contact: fields.contactName || '',
    address: fields.location || '',
    needSupport: Boolean(fields.needSupport),
    supportContent: fields.supportContent || '',
    missing: result?.missingFields || [],
    warnings,
    confidence,
  }
}
