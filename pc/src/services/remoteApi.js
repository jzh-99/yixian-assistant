import { state } from './mockStore'

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
  if (payload.code !== 0) throw new Error(payload.message || `业务错误 ${payload.code}`)
  return payload.data
}

function parseExtra(extraJson) {
  if (!extraJson) return {}
  try {
    return typeof extraJson === 'string' ? JSON.parse(extraJson) : extraJson
  } catch {
    return {}
  }
}

function mergeById(localRows, remoteRows) {
  const map = new Map(localRows.map((item) => [String(item.id), item]))
  remoteRows.forEach((item) => map.set(String(item.id), { ...(map.get(String(item.id)) || {}), ...item }))
  return [...map.values()]
}

function normalizeApplication(row) {
  const extra = parseExtra(row.extraJson)
  const applicant = state.people.find((item) => item.id === row.applicantId)
  return {
    ...row,
    typeName: { MATERIAL: '领料申请', VISIT: '外出拜访', SUPPORT: '支撑申请' }[row.type] || row.type,
    applicant: applicant?.name || `用户 ${row.applicantId}`,
    dept: applicant?.dept || `部门 ${row.deptId || '-'}`,
    summary: row.content || row.title,
    source: 'APP',
    createTime: row.createTime,
    expectedTime: extra.expectedTime || extra.expectedAt || null,
    address: extra.address || extra.location || '',
    urgency: extra.urgency === 'URGENT' ? '紧急' : '普通',
    overdueHours: 0,
    records: [{ action: 'SUBMIT', operator: applicant?.name || 'APP 用户', comment: '通过翼线助手 APP 提交', time: row.createTime }],
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
    request('/applications?pageNo=1&pageSize=100'),
    request('/tasks?pageNo=1&pageSize=100'),
    request('/visits'),
    request('/opportunities'),
  ])

  if (applicationsResult.status === 'fulfilled') {
    state.applications.splice(0, state.applications.length, ...mergeById(state.applications, applicationsResult.value.list.map(normalizeApplication)))
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

export const adminWriteApi = {
  approve: (id, comment, idempotencyKey) => request(`/admin/applications/${id}/approve`, { method: 'POST', body: JSON.stringify({ comment, idempotencyKey }) }),
  reject: (id, reason, idempotencyKey) => request(`/admin/applications/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason, idempotencyKey }) }),
  dispatch: (taskId, assigneeId, remark, idempotencyKey) => request(`/admin/tasks/${taskId}/dispatch`, { method: 'POST', body: JSON.stringify({ assigneeId, remark, idempotencyKey }) }),
  reassign: (taskId, assigneeId, reason, version, idempotencyKey) => request(`/admin/tasks/${taskId}/reassign`, { method: 'POST', body: JSON.stringify({ assigneeId, reason, version, idempotencyKey }) }),
}
