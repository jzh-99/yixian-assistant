/**
 * 商机确认页（AI 解析结果预览与提交）
 */
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { api } from '../services/maintainerApi'
import { APPLICATION_TYPE, OPPORTUNITY_STATUS, ROLE_CODE } from '../domain/contracts'
import { LoadingButton, TopBar, StatusBadge } from '../components/ui'
import { AiResultCard } from './AiResultCard'
import { FormSection, TextAreaField, TextField } from './FormFields'

export function OpportunityPreviewScreen({ route, goBack, navigate, notify }) {
  const parsed = route.params.parsed
  const [customer, setCustomer] = useState(parsed?.customer || '')
  const [name, setName] = useState(parsed?.name || '')
  const [level, setLevel] = useState(parsed?.level || 'B')
  const [amount, setAmount] = useState(parsed?.amount || '')
  const [nextContact, setNextContact] = useState(parsed?.nextContact || '')
  const [description, setDescription] = useState(parsed?.description || '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const submit = async () => {
    const nextErrors = {}
    if (!customer.trim()) nextErrors.customer = '请填写客户名称'
    if (!name.trim()) nextErrors.name = '请填写商机名称'
    if (!amount || Number(amount) <= 0) nextErrors.amount = '请填写预计金额'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      notify('请完善必填信息', 'error')
      return
    }
    setLoading(true)
    try {
      const payload = {
        customerName: customer,
        title: name,
        intentLevel: level === 'A' ? 'HIGH' : level === 'C' ? 'LOW' : 'MEDIUM',
        estimatedAmount: Math.round(Number(amount) * 10000), // 万元 → 分
        nextContactTime: nextContact ? nextContact.replace('T', ' ') + ':00' : null,
        description,
        status: OPPORTUNITY_STATUS.NEW,
      }
      const result = await api.opportunities.create(payload)
      const id = String(result.id || `OPP-${Date.now()}`)
      const opportunity = {
        id,
        code: result.opportunityNo || `SJ${Date.now().toString().slice(-12)}`,
        customer,
        name,
        level,
        amount: Number(amount),
        status: OPPORTUNITY_STATUS.NEW,
        statusName: '新商机',
        nextContact: nextContact || '待设置',
        description,
        createdAt: '刚刚',
        owner: '当前用户',
      }
      notify('商机创建成功')
      navigate('opportunity-detail', { opportunityId: id, opportunity })
    } catch (error) {
      notify(error.message || '商机创建失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const warning = parsed?.warnings?.length
    ? parsed.warnings.map((w) => w.message).join('；')
    : parsed?.missing?.length
      ? `未识别字段：${parsed.missing.join('、')}`
      : ''

  return (
    <div className="page page--plain page--with-actions">
      <TopBar title="确认商机信息" onBack={goBack} />
      <section className="page-body form-page">
        <AiResultCard
          sourceText={route.params.sourceText}
          warning={warning || undefined}
        />

        <FormSection title="客户信息">
          <TextField
            label="客户名称"
            required
            value={customer}
            onChange={setCustomer}
            error={errors.customer}
            placeholder="请输入客户名称（公司或个人）"
            warning={!customer && parsed ? 'AI 未识别，请补充' : ''}
          />
        </FormSection>

        <FormSection title="商机详情">
          <TextField
            label="商机名称"
            required
            value={name}
            onChange={setName}
            error={errors.name}
            placeholder="例如：园区网络升级项目"
          />
          <div className="field">
            <span className="field__label">意向等级 <i>*</i></span>
            <div className="segmented-control">
              {[
                { key: 'A', label: 'A类 · 高意向' },
                { key: 'B', label: 'B类 · 中等' },
                { key: 'C', label: 'C类 · 低意向' },
              ].map((item) => (
                <button
                  key={item.key}
                  className={level === item.key ? 'is-active' : ''}
                  onClick={() => setLevel(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <TextField
            label="预计金额（万元）"
            required
            value={amount}
            onChange={setAmount}
            error={errors.amount}
            placeholder="例如：12"
            type="number"
          />
          <TextField
            label="下次联系时间"
            value={nextContact}
            onChange={setNextContact}
            placeholder="请选择日期和时间"
            type="datetime-local"
          />
        </FormSection>

        <FormSection title="补充说明">
          <TextAreaField
            label="商机描述"
            value={description}
            onChange={setDescription}
            placeholder="选填，描述客户需求、背景和跟进计划"
          />
        </FormSection>
      </section>

      <div className="sticky-actions">
        <button className="button button--secondary" onClick={goBack}>
          重新解析
        </button>
        <LoadingButton
          className="button button--primary"
          loading={loading}
          loadingText="创建中…"
          onClick={submit}
        >
          确认并创建商机
        </LoadingButton>
      </div>
    </div>
  )
}
