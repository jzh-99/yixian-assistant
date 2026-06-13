/**
 * 领料申请确认页（AI 解析结果预览与提交）
 * 来源：翼线助手APP-v1.0/src/App.jsx MaterialPreviewScreen (第 792-909 行)
 */
import { useState } from 'react'
import { AlertTriangle, Plus, Sparkles, Trash2 } from 'lucide-react'
import { api } from '../services/maintainerApi'
import {
  APPLICATION_STATUS,
  APPLICATION_TYPE,
  ROLE_CODE,
  TASK_STATUS,
  toContractDateTime,
} from '../domain/contracts'
import { LoadingButton, StatusBadge, TopBar } from '../components/ui'
import { AiResultCard } from './AiResultCard'
import { FormSection, TextAreaField, TextField } from './FormFields'

export function MaterialPreviewScreen({ route, goBack, addApplication, navigate, notify }) {
  const parsed = route.params.parsed
  const [reason, setReason] = useState(parsed?.reason || '')
  const [address, setAddress] = useState(parsed?.address || '')
  const [expectedAt, setExpectedAt] = useState(parsed?.expectedAt || '')
  const [urgency, setUrgency] = useState(parsed?.urgency || '普通')
  const [note, setNote] = useState('')
  const [materials, setMaterials] = useState(parsed?.materials || [{ id: crypto.randomUUID(), name: '', quantity: 1, unit: '台', confidence: 'low' }])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const updateMaterial = (id, patch) => setMaterials((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item))

  const submit = async () => {
    const nextErrors = {}
    if (!reason.trim()) nextErrors.reason = '请填写申请事由'
    if (!address.trim()) nextErrors.address = '请填写使用地址'
    if (!expectedAt.trim()) nextErrors.expectedAt = '请选择期望时间'
    if (!materials.length || materials.some((item) => !item.name.trim() || Number(item.quantity) <= 0)) nextErrors.materials = '请完善物料名称和数量'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      notify('请完善必填信息', 'error')
      return
    }
    setLoading(true)
    try {
      const result = await api.applications.create({
        type: APPLICATION_TYPE.MATERIAL,
        title: reason,
        content: note || reason,
        extra: {
          location: address,
          expectedTime: toContractDateTime(expectedAt),
          urgency: urgency === '紧急' ? 'URGENT' : 'NORMAL',
          materials: materials.map(({ name, quantity, unit }) => ({ name, quantity: Number(quantity), unit })),
        },
      })
      const id = String(result.id || `APP-${Date.now()}`)
      const application = {
        id,
        code: result.appNo || `SQ${Date.now().toString().slice(-12)}`,
        type: APPLICATION_TYPE.MATERIAL,
        typeName: '领料申请',
        title: reason,
        submittedAt: '刚刚',
        status: APPLICATION_STATUS.PENDING,
        statusName: '待审批',
        applicantRoleCode: ROLE_CODE.MAINTAINER,
        fields: [
          ['事由', reason],
          ['地址', address],
          ['期望时间', expectedAt],
          ['紧急程度', urgency],
          ['物料清单', materials.map((item) => `${item.name} ×${item.quantity}${item.unit}`).join('、')],
          ...(note ? [['备注', note]] : []),
        ],
        timeline: [{ title: '申请已提交', time: '刚刚', note: '等待主管审批', state: 'current' }],
      }
      addApplication(application)
      notify('领料申请提交成功')
      navigate('application-detail', { applicationId: id })
    } catch (error) {
      notify(error.message || '领料申请提交失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page--plain page--with-actions">
      <TopBar title="确认领料申请" onBack={goBack} />
      <section className="page-body form-page">
        <AiResultCard sourceText={route.params.sourceText} warning={parsed && materials.some((item) => item.confidence === 'medium') ? '物料规格需要确认' : ''} />
        <FormSection title="申请信息">
          <TextField label="事由" required value={reason} onChange={setReason} error={errors.reason} placeholder="请输入申请事由" />
          <TextField label="使用地址" required value={address} onChange={setAddress} error={errors.address} placeholder="请输入使用地址" warning={!address && parsed ? 'AI 未识别，请补充' : ''} />
          <TextField label="期望时间" required value={expectedAt} onChange={setExpectedAt} error={errors.expectedAt} placeholder="请选择日期和时间" type="datetime-local" />
          <div className="field">
            <span className="field__label">紧急程度 <i>*</i></span>
            <div className="segmented-control">
              {['普通', '紧急'].map((item) => <button key={item} className={urgency === item ? 'is-active' : ''} onClick={() => setUrgency(item)}>{item}</button>)}
            </div>
          </div>
        </FormSection>

        <FormSection title="物料清单" action={<button className="text-button" onClick={() => setMaterials((items) => [...items, { id: crypto.randomUUID(), name: '', quantity: 1, unit: '个', confidence: 'low' }])}><Plus size={15} />添加物料</button>}>
          <div className="material-editor">
            {materials.map((item, index) => (
              <div className={`material-row ${item.confidence === 'medium' ? 'material-row--warning' : ''}`} key={item.id}>
                <span className="material-row__index">{index + 1}</span>
                <div className="material-row__fields">
                  <input value={item.name} onChange={(event) => updateMaterial(item.id, { name: event.target.value, confidence: 'high' })} placeholder="物料名称" />
                  <div>
                    <input type="number" min="1" value={item.quantity} onChange={(event) => updateMaterial(item.id, { quantity: event.target.value })} />
                    <select value={item.unit} onChange={(event) => updateMaterial(item.id, { unit: event.target.value })}>
                      {['台', '根', '个', '卷', '箱'].map((unit) => <option key={unit}>{unit}</option>)}
                    </select>
                  </div>
                  {item.confidence === 'medium' ? <small className="warning-text"><AlertTriangle size={13} />请确认物料规格</small> : null}
                </div>
                <button className="icon-button icon-button--danger" onClick={() => setMaterials((items) => items.filter((material) => material.id !== item.id))}><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
          {errors.materials ? <span className="field-error">{errors.materials}</span> : null}
        </FormSection>

        <FormSection title="补充说明">
          <TextAreaField label="备注" value={note} onChange={setNote} placeholder="选填，可补充领料说明" />
        </FormSection>
      </section>
      <div className="sticky-actions">
        <button className="button button--secondary" onClick={goBack}>重新解析</button>
        <LoadingButton className="button button--primary" loading={loading} loadingText="提交中…" onClick={submit}>确认并提交</LoadingButton>
      </div>
    </div>
  )
}
