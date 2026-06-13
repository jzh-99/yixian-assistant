/**
 * 装维功能相关 API（任务、领料申请、AI 解析、文件上传）
 * 来源：翼线助手APP-v1.0/src/services/api.js
 */
import { runtimeConfig } from '../config/runtime'
import {
  APPLICATION_TYPE,
  TASK_STATUS,
  normalizeCurrentUser,
} from '../domain/contracts'
import { demoMaintainerUser, assistantAnswers, packageKnowledgeBase } from '../data/maintainerMockData'
import { authStore } from './authStore'
import { createIdempotencyKey, request, withIdempotency } from './httpClient'
import {
  extractAddress,
  extractMaterials,
  extractExpectedTime,
  extractUrgency,
  extractCustomerName,
  extractPurpose,
  extractNeedSupport,
  extractOpportunityName,
  extractIntentLevel,
  extractAmount,
} from '../domain/parsers'

const wait = (ms = 350) => new Promise((resolve) => window.setTimeout(resolve, ms))

const remoteApi = {
  tasks: {
    list: (params) => request(`/tasks${params ? '?' + new URLSearchParams(params) : ''}`),
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
  applications: {
    create: (payload) => request('/applications', {
      method: 'POST',
      body: withIdempotency(payload, 'application'),
    }),
  },
  ai: {
    extract: (payload) => request('/ai/extract', { method: 'POST', body: payload }),
  },
  opportunities: {
    create: (payload) => request('/opportunities', {
      method: 'POST',
      body: withIdempotency(payload, 'opportunity'),
    }),
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
  tasks: {
    async list() {
      await wait()
      return { list: [], total: 0, pageNo: 1, pageSize: 20 }
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
  applications: {
    async create(payload) {
      await wait(550)
      return {
        id: `APP-${Date.now()}`,
        appNo: `SQ${Date.now().toString().slice(-12)}`,
        ...payload,
      }
    },
  },
  opportunities: {
    async create(payload) {
      await wait(550)
      return {
        id: `OPP-${Date.now()}`,
        opportunityNo: `SJ${Date.now().toString().slice(-12)}`,
        ...payload,
      }
    },
  },
  ai: {
    async extract({ input, applicationType }) {
      await wait(800)
      if (!input.trim()) throw new Error('请先描述你的需求')

      if (applicationType === APPLICATION_TYPE.MATERIAL) {
        const materials = extractMaterials(input)
        const address = extractAddress(input)
        const expectedTime = extractExpectedTime(input)
        const urgency = extractUrgency(input)
        const missingFields = []
        const warnings = []

        if (!address) missingFields.push('location')
        if (!materials.length) {
          missingFields.push('materials')
          warnings.push({ field: 'materials', message: '未能识别物料信息，请手工补充' })
        }
        if (!expectedTime) missingFields.push('expectedTime')

        return {
          fields: {
            title: input.includes('修') || input.includes('故障') ? '宽带故障维修' : '现场装维领料',
            content: input,
            expectedTime: expectedTime ? `${expectedTime} 09:00:00` : null,
            location: address,
            urgency: urgency === '紧急' ? 'URGENT' : 'NORMAL',
            materials,
          },
          missingFields,
          warnings,
          confidence: materials.length && address ? 0.85 : 0.55,
        }
      }

      if (applicationType === APPLICATION_TYPE.VISIT || applicationType === APPLICATION_TYPE.SUPPORT) {
        const customerName = extractCustomerName(input)
        const purpose = extractPurpose(input)
        const expectedTime = extractExpectedTime(input)
        const address = extractAddress(input)
        const needSupport = extractNeedSupport(input)
        const missingFields = []
        const warnings = []

        if (!customerName) missingFields.push('customerName')
        if (!purpose) missingFields.push('purpose')
        if (!expectedTime) missingFields.push('expectedTime')
        if (!address) warnings.push({ field: 'location', message: '未识别地址信息，请补充' })

        return {
          fields: {
            customerName,
            purpose,
            content: input,
            expectedTime: expectedTime ? `${expectedTime} 09:00:00` : null,
            location: address,
            contactName: '',
            needSupport,
            supportContent: needSupport ? '需要技术支撑' : '',
          },
          missingFields,
          warnings,
          confidence: customerName && purpose ? 0.82 : 0.50,
        }
      }

      if (applicationType === APPLICATION_TYPE.OPPORTUNITY) {
        const customerName = extractCustomerName(input)
        const title = extractOpportunityName(input)
        const intentLevel = extractIntentLevel(input)
        const estimatedAmount = extractAmount(input)
        const expectedTime = extractExpectedTime(input)
        const missingFields = []
        const warnings = []

        if (!customerName) missingFields.push('customerName')
        if (!title) missingFields.push('title')
        if (!estimatedAmount) warnings.push({ field: 'estimatedAmount', message: '未能识别金额，请手工填写' })

        return {
          fields: {
            customerName,
            title,
            content: input,
            intentLevel,
            estimatedAmount,
            nextContactTime: expectedTime ? `${expectedTime} 09:00:00` : null,
            description: input,
          },
          missingFields,
          warnings,
          confidence: customerName && title ? 0.85 : 0.55,
        }
      }

      throw new Error('不支持的申请类型')
    },

    async chat(message, history) {
      await wait(500)
      const input = message.toLowerCase()

      // 套餐知识库匹配（优先级最高）
      const pkgKeywords = ['套餐', '推荐', '资费', '暑促', '夺旗', '云享', '智选云', '智惠选', '迁改', '预算', '流量', '宽带', '话费', '月租']
      const isPkgQuery = pkgKeywords.some((kw) => message.includes(kw))

      if (isPkgQuery) {
        // 预算推荐
        if (message.includes('预算') || message.includes('多少钱') || message.includes('价格') || message.includes('便宜') || message.includes('贵')) {
          const budgetMatch = message.match(/(\d+)\s*(?:元|块|万)/)
          const budget = budgetMatch ? parseInt(budgetMatch[1], 10) : null
          let answer = ''
          if (budget && budget < 100) {
            answer = `预算${budget}元以内，推荐：\n\n**89元夺旗套餐**（全新用户）：60G流量 + 500分钟 + 500M宽带 + 中屏/天翼看家\n**89元常规套餐**：50G流量 + 500分钟 + 500M宽带\n**69元套餐**：30G流量 + 400分钟 + 200M宽带\n\n89夺旗性价比最高，但仅限全新用户。需要了解更多细节吗？`
          } else if (budget && budget <= 150) {
            answer = `预算${budget}元以内，推荐：\n\n**★149夺旗套餐**（全新用户）：120G流量 + 1000分钟 + 1000M宽带 + FTTR+中屏\n**139元套餐**：70G流量 + 500分钟 + 1000M宽带\n**109元套餐**：50G流量 + 500分钟 + 500M宽带\n\n149夺旗性价比极高！如果是老用户迁改可考虑云享139/149档。`
          } else if (budget && budget <= 200) {
            answer = `预算${budget}元以内，推荐：\n\n**★179元套餐**：140G流量 + 800分钟 + 2000M宽带 + FTTR+智屏\n**199元夺旗套餐**（全新用户）：200G流量 + 1500分钟 + 2000M宽带 + FTTR+智屏+天翼看家\n**199元常规套餐**：160G流量 + 1000分钟 + 2000M宽带 + FTTR+智屏\n\n179元是暑促重点推荐，性价比最高！`
          } else {
            answer = `预算${budget}元以上，推荐：\n\n**239元套餐**：180G流量 + 1000分钟 + 2000M宽带 + FTTR+智屏+天翼看家\n**智选云299元5G-A**：200G流量 + 1500分钟 + 2000M宽带\n**智选云399元5G-A**：250G流量 + 2000分钟 + 2000M宽带\n\n需要了解云享套餐迁改方案吗？`
          }
          return { answer, source: '电信套餐政策知识库（预算速查）', confidence: 0.9, suggestedAction: null }
        }

        // 暑促/夺旗
        if (message.includes('暑促') || message.includes('夺旗')) {
          return {
            answer: '二季度暑促夺旗套餐（6.4上架，仅限全新用户）：\n\n• **199夺旗**：200G/1500分钟/2000M，含FTTR+智屏+天翼看家\n• **★149夺旗**：120G/1000分钟/1000M，FTTR1主1从+中屏\n• **139夺旗**：120G/1000分钟/1000M，FTTR+天翼看家\n• **★89夺旗**：60G/500分钟/500M，中屏+天翼看家或尊享PLUS\n\n非夺旗重点推荐：★179元（140G/800分钟/2000M+FTTR+智屏）。需要针对客户情况推荐吗？',
            source: '电信套餐政策知识库（暑促政策）',
            confidence: 0.92,
            suggestedAction: null,
          }
        }

        // 云享
        if (message.includes('云享') || message.includes('迁改') || message.includes('老用户')) {
          return {
            answer: '云享套餐（存量用户迁改/降档专用）：\n\n迁改提值>0即可改云享套餐。\n\n热门档位：119元(50G/150分钟/500M)、139元(60G/200分钟/500M)、169元(80G/300分钟/1000M)、199元(100G/1000分钟/1000M)、229元(100G/1000分钟/2000M)。\n\n迁改赠品：提值≥10送路由器/摄像头，≥20送智屏，≥30送FTTR。\n\n客户当前月消费多少？我可以帮你算迁改方案。',
            source: '电信套餐政策知识库（云享套餐）',
            confidence: 0.9,
            suggestedAction: null,
          }
        }

        // 智选云/新装
        if (message.includes('智选云') || message.includes('新装') || message.includes('5G-A')) {
          return {
            answer: '智选云套餐（迁改提值>20可更换）：\n\n• 89元：40G/500分钟/500M\n• 139元：50G/500分钟/1000M\n• 169元：80G/800分钟/1000M（支持同城宽带20元纳入满减）\n• 199元5G-A：100G/1000分钟/2000M\n• 239元5G-A：120G/1000分钟/2000M\n• 299元5G-A：200G/1500分钟/2000M\n\n169+档支持同城宽带20元纳入满减。非必要作维系套餐需审批单至市场部。',
            source: '电信套餐政策知识库（智选云套餐）',
            confidence: 0.9,
            suggestedAction: null,
          }
        }

        // 通用套餐推荐
        return {
          answer: '根据二季度暑促政策，为您推荐：\n\n**热门推荐**：★179元（140G+800分钟+2000M，FTTR+智屏）\n**新用户首选**：★149夺旗（120G+1000分钟+1000M）\n**入门级**：89夺旗（60G+500分钟+500M）\n\n如需更精准推荐，请告诉我：客户预算、新老用户、是否需要FTTR/智屏等智家业务。',
          source: '电信套餐政策知识库（二季度暑促）',
          confidence: 0.88,
          suggestedAction: null,
        }
      }

      // 通用关键词匹配（非套餐）
      for (const entry of assistantAnswers) {
        if (entry.keywords.some((kw) => message.includes(kw))) {
          return {
            answer: entry.answer,
            source: entry.source,
            confidence: 0.85,
            suggestedAction: entry.action || null,
          }
        }
      }

      // 默认回复
      return {
        answer: '你好！我是翼线助手，可以帮你：\n\n• **领料申请**：描述需要什么物料，我帮你智能填单\n• **套餐推荐**：介绍客户情况，我推荐合适套餐\n• **任务处理**：接单、开始工作、完工反馈\n• **商机创建**：描述客户意向，自动创建商机\n\n请问有什么可以帮你？',
        source: '翼线助手',
        confidence: 0.7,
        suggestedAction: null,
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

/** 装维演示登录 */
export async function loginMaintainer() {
  const user = normalizeCurrentUser(demoMaintainerUser)
  authStore.setToken(`demo-token-${Date.now()}`)
  authStore.setSession(user)
  return user
}

export { assistantAnswers }
