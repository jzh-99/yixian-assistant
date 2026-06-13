/**
 * 共享表单组件
 * 来源：翼线助手APP-v1.0/src/App.jsx (第 779-1038 行)
 */
import { AlertTriangle, Sparkles } from 'lucide-react'
import { APPLICATION_STATUS, TASK_STATUS } from '../domain/contracts'
import { StatusBadge } from '../components/ui'

export function AiResultCard({ sourceText, warning }) {
  return (
    <div className={`ai-result-card ${warning ? 'ai-result-card--warning' : ''}`}>
      <div className="ai-result-card__head">
        <span><Sparkles size={18} /></span>
        <div><strong>{warning ? '有信息需要你确认' : '已完成智能解析'}</strong><small>{warning ? warning : '请检查以下预填内容'}</small></div>
        <StatusBadge status={warning ? TASK_STATUS.IN_PROGRESS : APPLICATION_STATUS.APPROVED} label={warning ? '待确认' : '解析成功'} />
      </div>
      {sourceText ? <details><summary>查看原始输入</summary><p>{sourceText}</p></details> : null}
    </div>
  )
}

export function FormSection({ title, action, children }) {
  return (
    <section className="form-section">
      <div className="form-section__head"><h2>{title}</h2>{action}</div>
      <div className="form-section__body">{children}</div>
    </section>
  )
}

export function TextField({ label, required, value, onChange, placeholder, error, warning, type = 'text' }) {
  return (
    <label className={`field ${error ? 'field--error' : ''} ${warning ? 'field--warning' : ''}`}>
      <span className="field__label">{label} {required ? <i>*</i> : null}</span>
      <input className="form-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {warning ? <span className="field-warning"><AlertTriangle size={13} />{warning}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}

export function TextAreaField({ label, required, value, onChange, placeholder, error }) {
  return (
    <label className={`field ${error ? 'field--error' : ''}`}>
      <span className="field__label">{label} {required ? <i>*</i> : null}</span>
      <textarea className="form-input form-textarea" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}
