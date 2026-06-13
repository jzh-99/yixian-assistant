/**
 * AI 智能创建商机（装维人员 / 客户经理）
 * 通过自然语言描述客户意向，AI 解析后生成结构化商机记录
 */
import { useState } from 'react'
import { ChevronRight, Lightbulb, Mic, Sparkles, Target } from 'lucide-react'
import { api } from '../services/maintainerApi'
import { APPLICATION_TYPE, toOpportunitySmartModel } from '../domain/contracts'
import { LoadingButton, TopBar } from '../components/ui'

const EXAMPLE = '远景科技想升级园区网络，预计12万，A类意向，下周三前联系'

export function OpportunitySmartScreen({ user, navigate, notify, goBack }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)

  const parse = async () => {
    if (!text.trim()) {
      notify('请先描述商机信息', 'error')
      return
    }
    setLoading(true)
    try {
      const result = await api.ai.extract({ input: text, applicationType: APPLICATION_TYPE.OPPORTUNITY })
      const parsed = toOpportunitySmartModel(result)
      navigate('opportunity-preview', { parsed, sourceText: text })
    } catch (error) {
      notify(error.message || '智能解析失败，你仍可手工填写', 'error')
    } finally {
      setLoading(false)
    }
  }

  const simulateVoice = () => {
    if (listening) {
      setListening(false)
      setText(EXAMPLE)
      notify('语音已转为文字，请确认')
    } else {
      setListening(true)
      window.setTimeout(() => {
        setListening(false)
        setText(EXAMPLE)
      }, 1200)
    }
  }

  return (
    <div className="page page--plain">
      <TopBar title="智能创建商机" onBack={goBack} />
      <section className="page-body smart-form-page">
        <div className="ai-intro-card">
          <span className="ai-intro-card__icon"><Target size={25} /></span>
          <div>
            <span className="ai-label">AI 智能创建商机</span>
            <h2>描述客户意向，自动生成商机</h2>
            <p>AI 生成内容需要你确认后才会提交</p>
          </div>
        </div>

        <div className="form-type-card">
          <span>当前操作类型</span>
          <strong>创建商机</strong>
          <span className="role-chip">{user.roleName}</span>
        </div>

        <label className="field">
          <span className="field__label">描述客户意向 <i>*</i></span>
          <span className={`textarea-shell ${listening ? 'is-listening' : ''}`}>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="例如：远景科技想升级园区网络，预计12万，A类意向…"
              rows={6}
            />
            <span className="textarea-shell__count">{text.length}/300</span>
          </span>
        </label>

        <button className={`voice-button ${listening ? 'is-listening' : ''}`} onClick={simulateVoice}>
          <span><Mic size={22} /></span>
          <strong>{listening ? '正在识别，点击结束' : '语音输入'}</strong>
          <small>{listening ? '请说出客户意向信息…' : '识别结果会先进入文本框供你确认'}</small>
        </button>

        <button className="example-card" onClick={() => setText(EXAMPLE)}>
          <Lightbulb size={17} />
          <span><strong>试试这样说</strong><small>"{EXAMPLE}"</small></span>
          <ChevronRight size={17} />
        </button>

        <LoadingButton className="button button--primary button--block button--large" loading={loading} loadingText="正在智能解析…" onClick={parse}>
          <Sparkles size={18} />开始智能解析
        </LoadingButton>
        <button
          className="button button--ghost button--block"
          onClick={() => navigate('opportunity-preview', { parsed: null, sourceText: '' })}
        >
          直接手工填写
        </button>
      </section>
    </div>
  )
}
