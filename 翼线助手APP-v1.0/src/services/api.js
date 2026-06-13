import { runtimeConfig } from '../config/runtime'
import {
  APPLICATION_STATUS,
  APPLICATION_TYPE,
  CUSTOMER_TYPE,
  OPPORTUNITY_STATUS,
  ROLE_CODE,
  TASK_STATUS,
  normalizeCurrentUser,
} from '../domain/contracts'
import { assistantAnswers, demoUsers, initialApplications, initialOpportunities } from '../data/mockData'
import { authStore } from './authStore'
import { createIdempotencyKey, request, withIdempotency } from './httpClient'

const wait = (ms = 350) => new Promise((resolve) => window.setTimeout(resolve, ms))
const demoUsersByRole = {
  [ROLE_CODE.MAINTAINER]: demoUsers.ops,
  [ROLE_CODE.ACCOUNT_MANAGER]: demoUsers.manager,
}

function pageQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function normalizePage(items, params = {}) {
  const pageNo = Number(params.pageNo || 1)
  const pageSize = Number(params.pageSize || 20)
  const start = (pageNo - 1) * pageSize
  return {
    list: items.slice(start, start + pageSize).map((item) => ({ ...item })),
    total: items.length,
    pageNo,
    pageSize,
  }
}

function initialApplicationToApi(item) {
  const applicant = demoUsersByRole[item.applicantRoleCode] || demoUsers.ops
  const firstApprovalStep = item.timeline?.find((step) => step.title.includes('审批')) || null
  const approverName = firstApprovalStep?.note?.startsWith('审批人：')
    ? firstApprovalStep.note.replace('审批人：', '')
    : ''
  return {
    id: item.id,
    appNo: item.code,
    type: item.type,
    title: item.title,
    content: item.fields?.find(([label]) => ['事由', '拜访目的', '需求描述'].includes(label))?.[1] || item.title,
    applicantId: applicant.userId,
    applicantName: applicant.realName,
    deptId: applicant.deptId,
    status: item.status,
    rejectReason: item.rejectReason || '',
    approverId: approverName ? 9001 : null,
    approverName,
    approvedAt: item.status === APPLICATION_STATUS.PENDING ? null : firstApprovalStep?.time,
    extraJson: JSON.stringify(Object.fromEntries(item.fields || [])),
    createTime: item.submittedAt,
    updateTime: item.status === APPLICATION_STATUS.PENDING ? item.submittedAt : firstApprovalStep?.time || item.submittedAt,
  }
}

function initialOpportunityToApi(item) {
  return {
    id: item.id,
    opportunityNo: item.code,
    customerName: item.customer,
    customerType: item.customerType || CUSTOMER_TYPE.PUBLIC,
    title: item.name,
    status: item.status || OPPORTUNITY_STATUS.NEW,
    intentLevel: item.level === 'A' ? 'HIGH' : item.level === 'C' ? 'LOW' : 'MEDIUM',
    estimatedAmount: Math.round(Number(item.amount || 0) * 100),
    needMaintainer: Boolean(item.needMaintainer),
    nextContactTime: item.nextContact,
    managerId: item.ownerId,
    managerName: item.owner,
    ownerJobNo: item.ownerJobNo,
    ownerRoleCode: item.ownerRoleCode,
    description: item.description || '',
    follows: item.follows || [],
    createTime: item.createdAt,
    updateTime: item.lastFollowAt || item.createdAt,
    lastFollowTime: item.lastFollowAt,
  }
}

const mockApplications = initialApplications.map(initialApplicationToApi)
const mockOpportunities = initialOpportunities.map(initialOpportunityToApi)

function currentMockUser() {
  return authStore.getSession() || normalizeCurrentUser(demoUsers.ops)
}

function findMockApplication(id) {
  const application = mockApplications.find((item) => String(item.id) === String(id))
  if (!application) throw new Error('申请不存在')
  return application
}

function filterMockApplications(params = {}, onlyCurrentUser = false) {
  const user = currentMockUser()
  return mockApplications
    .filter((item) => !onlyCurrentUser || String(item.applicantId) === String(user.id))
    .filter((item) => !params.type || item.type === params.type)
    .filter((item) => !params.status || item.status === params.status)
    .sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
}

function filterMockOpportunities(params = {}) {
  const user = currentMockUser()
  return mockOpportunities
    .filter((item) => String(item.managerId) === String(user.id))
    .filter((item) => !params.status || item.status === params.status)
    .sort((a, b) => String(b.updateTime || b.createTime || '').localeCompare(String(a.updateTime || a.createTime || '')))
}

function findMockOpportunity(id) {
  const user = currentMockUser()
  const opportunity = mockOpportunities.find((item) => String(item.id) === String(id))
  if (!opportunity || String(opportunity.managerId) !== String(user.id)) throw new Error('商机不存在')
  return opportunity
}

function createMockApprovalResult(id, patch) {
  const application = findMockApplication(id)
  if (application.status !== APPLICATION_STATUS.PENDING) throw new Error('当前状态不可审批')
  if (String(application.applicantId) === String(currentMockUser().id)) throw new Error('不能审批自己提交的申请')
  const approver = currentMockUser()
  Object.assign(application, {
    ...patch,
    approverId: approver.id,
    approverName: approver.name,
    approvedAt: nowText(),
    updateTime: nowText(),
  })
  return { ...application }
}

const remoteApi = {
  auth: {
    async login({ username, password }) {
      const loginResult = await request('/auth/login', {
        method: 'POST',
        auth: false,
        body: { username, password },
      })
      authStore.setToken(loginResult.token)
      const user = normalizeCurrentUser(await request('/auth/me'))
      authStore.setSession(user)
      return { token: loginResult.token, user }
    },
    me: async () => normalizeCurrentUser(await request('/auth/me')),
    async logout() {
      try {
        await request('/auth/logout', { method: 'POST', body: withIdempotency({}, 'logout') })
      } finally {
        authStore.clear()
      }
    },
  },
  applications: {
    list: (params) => request(`/applications/my${pageQuery(params)}`),
    my: (params) => request(`/applications/my${pageQuery(params)}`),
    get: (id) => request(`/applications/${id}`),
    create: (payload) => request('/applications', {
      method: 'POST',
      body: withIdempotency(payload, 'application'),
    }),
    cancel: (id) => request(`/applications/${id}/cancel`, {
      method: 'POST',
      body: withIdempotency({}, 'cancel-application'),
    }),
    approvalRecords: (id) => request(`/approvals/${id}/records`),
  },
  adminApplications: {
    list: (params) => request(`/admin/applications${pageQuery(params)}`),
    get: (id) => request(`/admin/applications/${id}`),
    approve: (id, payload = {}) => request(`/admin/applications/${id}/approve`, {
      method: 'PATCH',
      body: withIdempotency(payload, 'approve-application'),
    }),
    reject: (id, payload) => request(`/admin/applications/${id}/reject`, {
      method: 'PATCH',
      body: withIdempotency(payload, 'reject-application'),
    }),
  },
  tasks: {
    list: (params) => request(`/tasks${pageQuery(params)}`),
    get: (id) => request(`/tasks/${id}`),
    accept: (id, version) => request(`/tasks/${id}/accept`, {
      method: 'POST',
      body: withIdempotency({ version }, 'accept-task'),
    }),
    start: (id, version) => request(`/tasks/${id}/start`, {
      method: 'POST',
      body: withIdempotency({ version }, 'start-task'),
    }),
    complete: (id, payload) => request(`/tasks/${id}/complete`, {
      method: 'POST',
      body: withIdempotency(payload, 'complete-task'),
    }),
  },
  visits: {
    list: (params) => request(`/visits${pageQuery(params)}`),
    checkin: (id, payload = {}) => request(`/visits/${id}/checkin`, {
      method: 'POST',
      body: withIdempotency(payload, 'visit-checkin'),
    }),
  },
  opportunities: {
    list: (params) => request(`/opportunities${pageQuery(params)}`),
    create: (payload) => request('/opportunities', {
      method: 'POST',
      body: withIdempotency(payload, 'opportunity'),
    }),
    update: (id, payload) => request(`/opportunities/${id}`, {
      method: 'PUT',
      body: withIdempotency(payload, 'update-opportunity'),
    }),
  },
  ai: {
    extract: (payload) => request('/ai/extract', { method: 'POST', body: payload }),
    chat: (payload) => request('/ai/chat', { method: 'POST', body: payload }),
  },
  files: {
    upload(file, metadata = {}) {
      const form = new FormData()
      form.append('file', file)
      Object.entries(metadata).forEach(([key, value]) => form.append(key, value))
      form.append('idempotencyKey', createIdempotencyKey('file'))
      return request('/files/upload', { method: 'POST', body: form })
    },
  },
}

const mockApi = {
  auth: {
    async login({ username, password }) {
      await wait(450)
      if (!username || !password) throw new Error('请输入工号和密码')
      if (password !== '123456') throw new Error('工号或密码错误')
      const template = username.toUpperCase().startsWith('AM') ? demoUsers.manager : demoUsers.ops
      const user = normalizeCurrentUser(template)
      const token = `demo-token-${Date.now()}`
      authStore.setToken(token)
      authStore.setSession(user)
      return { token, user }
    },
    async me() {
      await wait()
      return authStore.getSession()
    },
    async logout() {
      await wait(150)
      authStore.clear()
    },
  },
  applications: {
    async list(params = {}) {
      await wait()
      return normalizePage(filterMockApplications(params, true), params)
    },
    async my(params = {}) {
      await wait()
      return normalizePage(filterMockApplications(params, true), params)
    },
    async get(id) {
      await wait()
      const application = findMockApplication(id)
      const user = currentMockUser()
      if (String(application.applicantId) !== String(user.id)) throw new Error('申请不存在')
      return { ...application }
    },
    async create(payload) {
      await wait(550)
      const user = currentMockUser()
      const application = {
        id: `APP-${Date.now()}`,
        appNo: `SQ${Date.now().toString().slice(-12)}`,
        type: payload.type,
        title: payload.title,
        content: payload.content,
        applicantId: user.id,
        applicantName: user.name,
        deptId: user.deptId,
        status: APPLICATION_STATUS.PENDING,
        rejectReason: '',
        approverId: null,
        approverName: '',
        approvedAt: null,
        extraJson: JSON.stringify(payload.extra || {}),
        createTime: nowText(),
        updateTime: nowText(),
      }
      mockApplications.unshift(application)
      return { ...application }
    },
    async cancel(id) {
      await wait()
      const application = findMockApplication(id)
      if (String(application.applicantId) !== String(currentMockUser().id)) throw new Error('申请不存在')
      if (application.status !== APPLICATION_STATUS.PENDING) throw new Error('当前状态不可撤回')
      application.status = APPLICATION_STATUS.CANCELLED
      application.updateTime = nowText()
      return { ...application }
    },
    async approvalRecords(id) {
      await wait()
      const application = findMockApplication(id)
      if (!application.approverName) return []
      return [{
        id: `${id}-approval`,
        applicationId: id,
        operatorId: application.approverId,
        action: application.status === APPLICATION_STATUS.REJECTED ? 'REJECT' : 'APPROVE',
        comment: application.rejectReason || '审批通过',
        beforeStatus: APPLICATION_STATUS.PENDING,
        afterStatus: application.status,
        createTime: application.approvedAt,
      }]
    },
  },
  adminApplications: {
    async list(params = {}) {
      await wait()
      return normalizePage(filterMockApplications(params, false), params)
    },
    async get(id) {
      await wait()
      return { ...findMockApplication(id) }
    },
    async approve(id, payload = {}) {
      await wait()
      return createMockApprovalResult(id, {
        status: APPLICATION_STATUS.APPROVED,
        rejectReason: '',
        approvalComment: payload.comment || '审批通过',
      })
    },
    async reject(id, payload = {}) {
      await wait()
      if (!payload.rejectReason?.trim()) throw new Error('请填写驳回原因')
      return createMockApprovalResult(id, {
        status: APPLICATION_STATUS.REJECTED,
        rejectReason: payload.rejectReason.trim(),
      })
    },
  },
  tasks: {
    async list() {
      await wait()
      return { list: [], total: 0, pageNo: 1, pageSize: 20 }
    },
    async get(id) {
      await wait()
      return { id }
    },
    async accept(id, version) {
      await wait()
      return { id, version: version + 1, status: TASK_STATUS.ACCEPTED }
    },
    async start(id, version) {
      await wait()
      return { id, version: version + 1, status: TASK_STATUS.IN_PROGRESS }
    },
    async complete(id, payload) {
      await wait(550)
      return { id, version: payload.version + 1, status: TASK_STATUS.COMPLETED }
    },
  },
  visits: {
    async list() {
      await wait()
      return []
    },
    async checkin(id) {
      await wait()
      return { id, checkinTime: '刚刚' }
    },
  },
  opportunities: {
    async list(params = {}) {
      await wait()
      return filterMockOpportunities(params)
    },
    async create(payload) {
      await wait()
      const user = currentMockUser()
      const opportunity = {
        id: `OPP-${Date.now()}`,
        opportunityNo: `SJ${Date.now().toString().slice(-11)}`,
        customerName: payload.customerName,
        customerType: payload.customerType || CUSTOMER_TYPE.PUBLIC,
        title: payload.title,
        status: payload.status || OPPORTUNITY_STATUS.NEW,
        intentLevel: payload.intentLevel,
        estimatedAmount: payload.estimatedAmount,
        needMaintainer: Boolean(payload.needMaintainer),
        nextContactTime: payload.nextContactTime,
        managerId: user.id,
        managerName: user.name,
        ownerJobNo: user.jobNo,
        ownerRoleCode: user.roleCode,
        description: payload.description || '',
        follows: [],
        createTime: nowText(),
        updateTime: nowText(),
        lastFollowTime: '',
      }
      mockOpportunities.unshift(opportunity)
      return { ...opportunity }
    },
    async update(id, payload) {
      await wait()
      const opportunity = findMockOpportunity(id)
      Object.assign(opportunity, {
        customerName: payload.customerName ?? opportunity.customerName,
        customerType: payload.customerType ?? opportunity.customerType,
        title: payload.title ?? opportunity.title,
        status: payload.status ?? opportunity.status,
        intentLevel: payload.intentLevel ?? opportunity.intentLevel,
        estimatedAmount: payload.estimatedAmount ?? opportunity.estimatedAmount,
        needMaintainer: payload.needMaintainer ?? opportunity.needMaintainer,
        nextContactTime: payload.nextContactTime ?? opportunity.nextContactTime,
        description: payload.description ?? opportunity.description,
        updateTime: nowText(),
      })
      if (payload.followUp?.content) {
        const follow = {
          id: `FOLLOW-${Date.now()}`,
          time: nowText(),
          content: payload.followUp.content,
          owner: currentMockUser().name,
        }
        opportunity.follows = [follow, ...(opportunity.follows || [])]
        opportunity.lastFollowTime = follow.time
      }
      return { ...opportunity }
    },
  },
  ai: {
    async extract({ input, applicationType }) {
      await wait(800)
      if (!input.trim()) throw new Error('请先描述你的需求')
      if (applicationType === APPLICATION_TYPE.MATERIAL) {
        return {
          fields: {
            title: input.includes('修') ? '宽带故障维修' : '现场装维领料',
            content: input,
            expectedTime: '2026-06-11 09:00:00',
            location: input.includes('鼓楼') ? '南京市鼓楼区' : '',
            urgency: input.includes('紧急') ? 'URGENT' : 'NORMAL',
            materials: [
              { name: '光猫', quantity: 1, unit: '台' },
              { name: '光纤', quantity: 1, unit: '根' },
            ],
          },
          missingFields: [],
          warnings: [{ field: 'materials', message: '请确认物料规格' }],
          confidence: 0.88,
        }
      }
      return {
        fields: {
          customerName: input.includes('远景') ? '南京远景科技有限公司' : '',
          purpose: input.includes('专线') ? '沟通企业专线方案' : '客户业务拜访',
          expectedTime: '2026-06-11 10:00:00',
          contactName: '',
          location: '',
          needSupport: input.includes('支撑'),
          supportContent: input.includes('支撑') ? '需要技术人员协助评估带宽和组网方案' : '',
        },
        missingFields: input.includes('远景') ? [] : ['customerName'],
        warnings: [],
        confidence: 0.9,
      }
    },
    async chat({ message }) {
      await wait(650)
      const matched = assistantAnswers.find((item) => item.keywords.some((keyword) => message.includes(keyword)))
      if (!matched) {
        return {
          answer: '暂未找到足够可靠的答案，建议换个问法，或联系业务管理员确认相关制度。',
          source: '未命中可靠知识',
          confidence: 0.35,
          suggestedAction: null,
        }
      }
      return {
        answer: matched.answer,
        source: matched.source,
        confidence: 0.95,
        suggestedAction: matched.action
          ? { label: matched.action.label, route: matched.action.target }
          : null,
      }
    },
  },
  files: {
    async upload(file) {
      await wait()
      return { fileUrl: URL.createObjectURL(file), originalName: file.name }
    },
  },
}

export const api = runtimeConfig.useMock ? mockApi : remoteApi
export const apiRuntime = runtimeConfig
export { ROLE_CODE }
