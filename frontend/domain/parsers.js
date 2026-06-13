/**
 * 中文自然语言解析器
 * 用于从装维/客户经理的自然语言输入中抽取结构化字段
 */

/**
 * 中文数字 → 阿拉伯数字
 * 支持：一～十、两、十一～九十九
 */
export function chineseToNumber(text) {
  if (!text) return null
  const map = {
    '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  }
  // 纯数字直接返回
  const numMatch = text.match(/\d+/)
  if (numMatch) return parseInt(numMatch[0], 10)

  const trimmed = text.trim()
  if (map[trimmed] !== undefined) return map[trimmed]

  // "十一" → 11, "二十三" → 23
  const compound = trimmed.match(/^([一二两三四五六七八九])?十([一二两三四五六七八九])?$/)
  if (compound) {
    const tens = compound[1] ? map[compound[1]] : 1
    const ones = compound[2] ? map[compound[2]] : 0
    return tens * 10 + ones
  }
  return null
}

/**
 * 地址抽取：匹配常见中文地址模式
 */
export function extractAddress(text) {
  if (!text) return ''

  // 完整地址模式（优先级从高到低）
  const patterns = [
    // XX省XX市XX区XX路XX号/XX弄XX号/XX街道
    /(?:[一-龥]{2,}市)?[一-龥]{2,}[区县][一-龥]{2,}[路街][一-龥\d，、]*?(?:\d+号)?/g,
    // XX区XX路XX号
    /[一-龥]{2,}[区县][一-龥\d，、]*?(?:[路街弄道][一-龥\d，、]*?(?:\d+号)?)?/g,
    // XX路XX号（无区名前缀）
    /[一-龥]{2,}[路街弄道][一-龥\d，、]*?\d+号/g,
    // XX街道XX村/XX镇
    /[一-龥]{2,}(?:街道|镇|乡|村|社区|小区|园区|大厦|广场|大楼|中心|花园|公寓|苑|庭|湾|城|府|院|馆)/g,
  ]

  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches) {
      // 返回最长匹配作为完整地址
      return matches.reduce((longest, current) =>
        current.length > longest.length ? current : longest, '')
    }
  }

  // 兜底：提取"去XX"或"在XX"后面的地点片段
  const locationPrefix = text.match(/(?:去|在|到|前往)\s*([一-龥]{2,}(?:区|县|镇|村|路|街|道|弄))/)
  if (locationPrefix) return locationPrefix[1]

  // 提取单个区/县名
  const district = text.match(/([一-龥]{2,}(?:区|县))/)
  if (district) return district[1]

  return ''
}

/**
 * 物料抽取：匹配"数量+物料名"模式
 * 返回 [{name, quantity, unit}]
 */
export function extractMaterials(text) {
  if (!text) return []

  const materials = []

  // 常见物料名称列表（用于匹配）
  const knownMaterials = [
    '企业网关', '光猫', '光纤', '网线', '路由器', '摄像头',
    '智屏', '中屏', '机顶盒', 'FTTR', 'ONU', '交换机',
    '标签纸', '水晶头', '模块', '面板', '配线架', '电源', '电池',
    'ONU设备', '分光器', '尾纤', '跳线', '法兰盘', '热缩管',
    '工具箱', '电钻', '梯子', '安全帽', '万用表', '熔接机',
  ]

  // 数量模式：数字 + 单位 + 物料名
  // 匹配：一台光猫、两根光纤、3个水晶头、1台企业网关等
  const quantityUnits = '(?:台|个|根|卷|箱|套|件|包|把|条|支|块|张|只|副|组)'

  // 模式1: 中文数字/阿拉伯数字 + 单位 + 物料名
  const pattern1 = new RegExp(
    `([一二两三四五六七八九十]\\d*|\\d+)\\s*(${quantityUnits})\\s*([\\u4e00-龥a-zA-Z0-9\\-+]+)`,
    'g',
  )
  let match
  while ((match = pattern1.exec(text)) !== null) {
    const quantity = chineseToNumber(match[1]) || parseInt(match[1], 10) || 1
    const unit = match[2]
    const name = match[3].trim()
    // 避免重复添加
    if (!materials.some((item) => item.name === name)) {
      materials.push({ name, quantity, unit })
    }
  }

  // 模式2: "领/拿/带 + 数量 + 物料名"（无中间单位）
  const pattern2 = /(?:领|拿|带|需要|申请)\s*([一二两三四五六七八九十\d]+)\s*([一-龥a-zA-Z0-9]{2,6})/g
  while ((match = pattern2.exec(text)) !== null) {
    const quantity = chineseToNumber(match[1]) || parseInt(match[1], 10) || 1
    const name = match[2].trim()
    if (!materials.some((item) => item.name === name)) {
      // 判断常见物料或包含已知物料关键字
      const isKnown = knownMaterials.some((known) => name.includes(known) || known.includes(name))
      // 自动推断单位
      const unit = name.includes('纤') || name.includes('线') || name.includes('缆')
        ? '根' : name.includes('纸') || name.includes('标签') ? '卷' : '台'
      if (isKnown || name.length >= 2) {
        materials.push({ name, quantity, unit })
      }
    }
  }

  // 模式3: 已知物料名（单独出现，默认数量1）
  if (materials.length === 0) {
    for (const known of knownMaterials) {
      if (text.includes(known)) {
        const unit = known.includes('纤') || known.includes('线') || known.includes('缆')
          ? '根' : known.includes('纸') || known.includes('标签') ? '卷' : '台'
        materials.push({ name: known, quantity: 1, unit })
      }
    }
  }

  return materials
}

/**
 * 相对时间解析：返回 yyyy-MM-dd 格式
 */
export function extractExpectedTime(text) {
  if (!text) return ''
  const now = new Date()

  const relativePatterns = [
    { pattern: /今天/, offset: 0 },
    { pattern: /明天/, offset: 1 },
    { pattern: /后天/, offset: 2 },
    { pattern: /大后天/, offset: 3 },
    { pattern: /下周一/, offset: (8 - now.getDay()) % 7 + 7 },
    { pattern: /下周二/, offset: (9 - now.getDay()) % 7 + 7 },
    { pattern: /下周三/, offset: (10 - now.getDay()) % 7 + 7 },
    { pattern: /下周四/, offset: (11 - now.getDay()) % 7 + 7 },
    { pattern: /下周五/, offset: (12 - now.getDay()) % 7 + 7 },
    { pattern: /下周六/, offset: (13 - now.getDay()) % 7 + 7 },
    { pattern: /下周日|下星期天/, offset: (14 - now.getDay()) % 7 + 7 },
    { pattern: /周一/, offset: (8 - now.getDay()) % 7 || 7 },
    { pattern: /周二/, offset: (9 - now.getDay()) % 7 || 7 },
    { pattern: /周三/, offset: (10 - now.getDay()) % 7 || 7 },
    { pattern: /周四/, offset: (11 - now.getDay()) % 7 || 7 },
    { pattern: /周五/, offset: (12 - now.getDay()) % 7 || 7 },
    { pattern: /周六/, offset: (13 - now.getDay()) % 7 || 7 },
    { pattern: /周日|星期天/, offset: (14 - now.getDay()) % 7 || 7 },
  ]

  for (const { pattern, offset } of relativePatterns) {
    if (pattern.test(text)) {
      const date = new Date(now)
      date.setDate(date.getDate() + offset)
      return formatDate(date)
    }
  }

  // 匹配具体日期：6月15日、6.15、6-15
  const dateMatch = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]/)
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10)
    const day = parseInt(dateMatch[2], 10)
    const year = now.getFullYear()
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return ''
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 紧急程度抽取
 */
export function extractUrgency(text) {
  if (!text) return '普通'
  if (/紧急|加急|尽快|马上|立刻|立即|快点|抓紧/.test(text)) {
    return '紧急'
  }
  return '普通'
}

/**
 * 客户名称抽取（公司名 + 人名模式）
 */
export function extractCustomerName(text) {
  if (!text) return ''

  // 公司/机构名模式
  const companyPatterns = [
    /([一-龥]{2,}(?:科技|网络|信息|通信|软件|数据|云|智能|电子|电力|能源|建筑|房产|物业|物流|医药|教育|文化|传媒|金融|投资|贸易|实业|制造|工程|设计|咨询|服务|集团|控股|股份|有限){1,2}(?:公司|集团|有限公司|股份有限公司)?)/g,
    /([一-龥]{2,}(?:产业园|科技园|工业园|创业园|开发区|园区|工厂|医院|学校|学院|大学|中心|局|处|所|站|店|行|馆|院|会|社))/g,
  ]

  for (const pattern of companyPatterns) {
    const matches = text.match(pattern)
    if (matches) return matches[0]
  }

  // 人名模式：X先生、X女士、X总、X经理、X老板、X工
  const personMatch = text.match(/([一-龥]{1,4})(?:先生|女士|总|经理|老板|工|师傅|小姐|老师)/)
  if (personMatch) return personMatch[0]

  // "拜访/联系/去 XX" 后面的简短名称
  const visitMatch = text.match(/(?:拜访|联系|去|找|见)\s*([一-龥]{2,6}(?:公司|集团|科技|网络)?)/)
  if (visitMatch) return visitMatch[1]

  return ''
}

/**
 * 拜访目的/事由抽取
 */
export function extractPurpose(text) {
  if (!text) return ''

  const purposeKeywords = [
    '谈', '沟通', '商讨', '讨论', '拜访', '交流', '介绍', '推广',
    '签约', '维护', '勘察', '评估', '调研', '回访', '巡检', '检查',
    '安装', '调试', '升级', '改造', '扩容', '新建', '开通', '迁移',
    '故障维修', '故障处理', '售后', '培训', '演示', '测试',
  ]

  for (const keyword of purposeKeywords) {
    if (text.includes(keyword)) {
      // 提取关键词周围的上下文
      const index = text.indexOf(keyword)
      const start = Math.max(0, index - 2)
      const end = Math.min(text.length, index + keyword.length + 10)
      const context = text.slice(start, end).trim()
      return context.length > 2 ? context : keyword
    }
  }

  // 默认返回文本前30字作为摘要
  return text.slice(0, 30).trim()
}

/**
 * 是否需要支撑
 */
export function extractNeedSupport(text) {
  if (!text) return false
  return /支撑|技术支持|需要技术|带技术|带人|方案支持|远程支持|专家/.test(text)
}

/**
 * 商机相关解析
 */

/** 商机名称提取 */
export function extractOpportunityName(text) {
  if (!text) return ''
  const keywords = ['升级', '扩容', '新建', '接入', '部署', '改造', '项目', '方案', '系统', '平台', '专线', '组网', '云']
  for (const kw of keywords) {
    const idx = text.indexOf(kw)
    if (idx >= 0) {
      const start = Math.max(0, idx - 6)
      const end = Math.min(text.length, idx + 12)
      return text.slice(start, end).trim()
    }
  }
  return text.slice(0, 40).trim()
}

/** 意向等级提取 HIGH/MEDIUM/LOW */
export function extractIntentLevel(text) {
  if (!text) return 'MEDIUM'
  if (/A类|高意向|强烈|非常|很感兴趣|决定|一定要|HIGH/i.test(text)) return 'HIGH'
  if (/C类|低意向|观望|随便看看|不太|LOW/i.test(text)) return 'LOW'
  return 'MEDIUM'
}

/** 金额提取（返回数字，单位：元） */
export function extractAmount(text) {
  if (!text) return null

  // ¥12万、12万元、12万、¥5000、5000元
  const patterns = [
    /[¥￥]\s*(\d+(?:\.\d+)?)\s*万/,
    /(\d+(?:\.\d+)?)\s*万元/,
    /(\d+(?:\.\d+)?)\s*万(?!元)/,
    /[¥￥]\s*(\d+(?:\.\d+)?)/,
    /(\d+(?:\.\d+)?)\s*元/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseFloat(match[0].replace(/[¥￥]/g, '').replace(/[万元]/g, (ch) => ch === '万' ? '0000' : ''))
      // 如果原文本有"万"，乘以10000
      if (/万/.test(match[0])) {
        return Math.round(value * 10000)
      }
      return Math.round(value)
    }
  }

  return null
}
