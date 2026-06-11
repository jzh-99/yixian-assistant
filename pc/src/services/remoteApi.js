import { approveApplication, rejectApplication, state } from './mockStore'

export const isRemoteMode = import.meta.env.VITE_API_MODE === 'remote'
const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'

function authToken() {
  return localStorage.getItem('yixian-admin-token') || import.meta.env.VITE_API_TOKEN || ''
}

async function request(path, options = {}) {
  const token = authToken()
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (!response.ok) throw new Error(`接口请求失败：HTTP ${response.status}`)
  const payload = await response.json()
  if (typeof payload?.code === 'number') {
    if (payload.code !== 0) throw new Error(payload.message || `业务错误 ${payload.code}`)
    return payload.data
  }
  return payload
}

function parseExtra(extraJson) {
  if (!extraJson) return {}
  try {
    return typeof extraJson === 'string' ? JSON.parse(extraJson) : extraJson
  } catch {
    return {}
  }
}

function pageQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

function createIdempotencyKey(prefix) {
  return `${prefix}-${crypto.randomUUID()}`
}

function mergeById(localRows, remoteRows) {
  const map = new Map(localRows.map((item) => [String(item.id), item]))
  remoteRows.forEach((item) => map.set(String(item.id), { ...(map.get(String(item.id)) || {}), ...item }))
  return [...map.values()]
}

function normalizeTime(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 19)
}

function parseTime(value) {
  const text = normalizeTime(value)
  if (!text) return null
  const time = new Date(text.replace(' ', 'T')).getTime()
  return Number.isNaN(time) ? null : time
}

function overdueHours(row) {
  if (row.status !== 'PENDING') return 0
  const createdAt = parseTime(row.createTime || row.createdAt)
  if (!createdAt) return 0
  const hours = (Date.now() - createdAt) / 3600000
  return hours > 4 ? Number((hours - 4).toFixed(1)) : 0
}

function materialSummary(materials) {
  if (!Array.isArray(materials)) return ''
  return materials
    .map((item) => typeof item === 'string' ? item : `${item.name || ''} ×${item.quantity || 1}${item.unit || ''}`)
    .filter(Boolean)
    .join('、')
}

function applicationTypeName(type) {
  return { MATERIAL: '领料申请', VISIT: '外出拜访', SUPPORT: '支撑申请' }[type] || type || '-'
}

function normalizeRecords(row, applicantName) {
  const records = []
  if (Array.isArray(row.records) && row.records.length) {
    records.push(...row.records.map((item) => ({
      ...item,
      operator: item.operator || item.operatorName || item.operatorId || '审批人',
      comment: item.comment || item.rejectReason || '',
      time: normalizeTime(item.time || item.createTime || item.createdAt),
    })))
  } else if (row.status === 'APPROVED') {
    records.push({
      action: 'APPROVE',
      operator: row.approverName || '审批人',
      comment: row.approvalComment || '审批通过',
      time: normalizeTime(row.approvedAt || row.approveTime || row.updateTime),
    })
  }
  if (row.status === 'REJECTED') {
    records.push({
      action: 'REJECT',
      operator: row.approverName || '审批人',
      comment: row.rejectReason || '审批驳回',
      time: normalizeTime(row.approvedAt || row.approveTime || row.updateTime),
    })
  }
  if (row.status === 'CANCELLED') {
    records.push({
      action: 'CANCEL',
      operator: applicantName || '申请人',
      comment: '申请人撤回申请',
      time: normalizeTime(row.updateTime || row.updatedAt),
    })
  }
  if (!records.some((item) => item.action === 'SUBMIT')) {
    records.push({
      action: 'SUBMIT',
      operator: applicantName || 'APP 用户',
      comment: '通过翼线助手 APP 提交',
      time: normalizeTime(row.createTime || row.createdAt),
    })
  }
  return records.filter((item) => item.time || item.action === 'SUBMIT')
}

function normalizeApplication(row) {
  const extra = parseExtra(row.extraJson ?? row.extra)
  const applicant = state.people.find((item) => item.id === row.applicantId)
  const applicantName = row.applicantName || row.applicant || applicant?.name || `用户 ${row.applicantId || '-'}`
  const dept = row.dept || row.deptName || applicant?.dept || `部门 ${row.deptId || '-'}`
  const approvalRecord = Array.isArray(row.records)
    ? row.records.find((item) => item.action === 'APPROVE' || item.action === 'REJECT')
    : null
  const approverName = row.approverName || row.approver || row.approvedByName || approvalRecord?.operator || approvalRecord?.operatorName || ''
  const summary = row.summary
    || row.content
    || row.title
    || materialSummary(extra.materials)
    || extra.purpose
    || extra.supportContent
    || '-'
  const expectedTime = normalizeTime(extra.expectedTime || extra.expectedAt || row.expectedTime)
  const approveTime = normalizeTime(row.approvedAt || row.approveTime || (row.status === 'APPROVED' || row.status === 'REJECTED' ? row.updatedAt || row.updateTime : ''))
  return {
    ...row,
    id: String(row.id),
    appNo: row.appNo || row.applicationNo || `APP-${row.id}`,
    typeName: applicationTypeName(row.type),
    applicant: applicantName,
    applicantName,
    dept,
    summary,
    source: 'APP',
    createTime: normalizeTime(row.createTime || row.createdAt),
    createdAt: normalizeTime(row.createTime || row.createdAt),
    updateTime: normalizeTime(row.updateTime || row.updatedAt),
    updatedAt: normalizeTime(row.updateTime || row.updatedAt),
    expectedTime,
    address: extra.address || extra.location || row.address || '',
    urgency: extra.urgency === 'URGENT' ? '紧急' : '普通',
    content: row.content || '',
    attachments: row.attachments || extra.attachments || [],
    rejectReason: row.rejectReason || '',
    approverId: row.approverId || null,
    approverName,
    approvedAt: approveTime,
    approveTime,
    overdueHours: row.overdueHours ?? overdueHours(row),
    records: normalizeRecords({ ...row, approverName, approvedAt: approveTime }, applicantName),
  }
}

function normalizeTask(row) {
  const assignee = state.people.find((item) => item.id === row.assigneeId)
  return {
    ...row,
    applicationNo: row.applicationNo || `APP-ID-${row.applicationId}`,
    assignee: assignee?.name || '',
    dept: assignee?.dept || `部门 ${row.deptId || '-'}`,
    customer: row.customerName || '',
    expectedFinishTime: row.expectedFinishTime,
    actualFinishTime: row.actualFinishTime,
    requiredSkills: row.requiredSkills || [],
    source: 'APP申请',
    timeline: row.timeline || [{ title: '任务数据由 APP 后端同步', time: row.updateTime || row.createTime }],
  }
}

export async function syncFromAppBackend() {
  if (!isRemoteMode) return { mode: 'mock', synced: false }
  const [applicationsResult, tasksResult, visitsResult, opportunitiesResult] = await Promise.allSettled([
    adminApplicationsApi.list({ pageNo: 1, pageSize: 100 }),
    request('/tasks?pageNo=1&pageSize=100'),
    request('/visits'),
    request('/opportunities'),
  ])

  if (applicationsResult.status === 'fulfilled') {
    state.applications.splice(0, state.applications.length, ...mergeById(state.applications, applicationsResult.value.list))
  }
  if (tasksResult.status === 'fulfilled') {
    state.tasks.splice(0, state.tasks.length, ...mergeById(state.tasks, tasksResult.value.list.map(normalizeTask)))
  }
  if (visitsResult.status === 'fulfilled' && visitsResult.value.length) {
    state.visits.splice(0, state.visits.length, ...mergeById(state.visits, visitsResult.value))
  }
  if (opportunitiesResult.status === 'fulfilled' && opportunitiesResult.value.length) {
    state.opportunities.splice(0, state.opportunities.length, ...mergeById(state.opportunities, opportunitiesResult.value))
  }

  return {
    mode: 'remote',
    synced: [applicationsResult, tasksResult, visitsResult, opportunitiesResult].some((item) => item.status === 'fulfilled'),
  }
}

export const adminApplicationsApi = {
  async list(params = {}) {
    const { status, ...rest } = params
    if (Array.isArray(status)) {
      const results = await Promise.allSettled(status.map((item) => adminApplicationsApi.list({ ...rest, status: item })))
      const pages = results.filter((item) => item.status === 'fulfilled').map((item) => item.value)
      if (!pages.length) throw results.find((item) => item.status === 'rejected')?.reason || new Error('审批列表加载失败')
      return {
        list: pages.flatMap((page) => page.list),
        total: pages.reduce((sum, page) => sum + Number(page.total || page.list.length), 0),
        pageNo: Number(rest.pageNo || 1),
        pageSize: Number(rest.pageSize || 100),
      }
    }
    const data = await request(`/admin/applications${pageQuery({ pageNo: 1, pageSize: 100, ...rest, status })}`)
    const list = Array.isArray(data) ? data : data?.list || []
    return {
      list: list.map(normalizeApplication),
      total: data?.total ?? list.length,
      pageNo: data?.pageNo ?? Number(rest.pageNo || 1),
      pageSize: data?.pageSize ?? Number(rest.pageSize || 100),
    }
  },
  async detail(id) {
    return normalizeApplication(await request(`/admin/applications/${id}`))
  },
  async approve(id, payload = {}) {
    return normalizeApplication(await request(`/admin/applications/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({
        comment: payload.comment || '',
        idempotencyKey: payload.idempotencyKey || createIdempotencyKey('approve-application'),
      }),
    }))
  },
  async reject(id, payload = {}) {
    return normalizeApplication(await request(`/admin/applications/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({
        rejectReason: payload.rejectReason || payload.reason || '',
        idempotencyKey: payload.idempotencyKey || createIdempotencyKey('reject-application'),
      }),
    }))
  },
}

export const approvalCenterApi = {
  async list(params = {}) {
    if (isRemoteMode) return adminApplicationsApi.list(params)
    const statuses = Array.isArray(params.status) ? params.status : params.status ? [params.status] : null
    const list = state.applications
      .filter((item) => !statuses || statuses.includes(item.status))
      .filter((item) => !params.type || item.type === params.type)
      .map(normalizeApplication)
    return { list, total: list.length, pageNo: 1, pageSize: list.length || 100 }
  },
  async detail(id) {
    if (isRemoteMode) return adminApplicationsApi.detail(id)
    const application = state.applications.find((item) => String(item.id) === String(id))
    if (!application) throw new Error('申请不存在')
    return normalizeApplication(application)
  },
  async approve(id, payload = {}) {
    if (isRemoteMode) return { application: await adminApplicationsApi.approve(id, payload), task: null }
    const application = state.applications.find((item) => String(item.id) === String(id))
    if (!application) throw new Error('申请不存在')
    const task = approveApplication(application, payload.comment)
    return { application: normalizeApplication(application), task }
  },
  async reject(id, payload = {}) {
    if (isRemoteMode) return { application: await adminApplicationsApi.reject(id, payload), task: null }
    const application = state.applications.find((item) => String(item.id) === String(id))
    if (!application) throw new Error('申请不存在')
    rejectApplication(application, payload.rejectReason || payload.reason)
    return { application: normalizeApplication(application), task: null }
  },
}

export const adminWriteApi = {
  approve: (id, comment, idempotencyKey) => adminApplicationsApi.approve(id, { comment, idempotencyKey }),
  reject: (id, rejectReason, idempotencyKey) => adminApplicationsApi.reject(id, { rejectReason, idempotencyKey }),
  dispatch: (taskId, assigneeId, remark, idempotencyKey) => request(`/admin/tasks/${taskId}/dispatch`, { method: 'POST', body: JSON.stringify({ assigneeId, remark, idempotencyKey }) }),
  reassign: (taskId, assigneeId, reason, version, idempotencyKey) => request(`/admin/tasks/${taskId}/reassign`, { method: 'POST', body: JSON.stringify({ assigneeId, reason, version, idempotencyKey }) }),
}
