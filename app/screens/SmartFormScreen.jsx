/**
 * AI 领料智能填单（装维人员）
 * 来源：翼线助手APP-v1.0/src/App.jsx SmartFormScreen (第 680-777 行，装维分支)
 */
import { useState } from 'react'
import { ChevronRight, Lightbulb, Mic, Sparkles } from 'lucide-react'
import { api } from '../services/maintainerApi'
import { APPLICATION_TYPE, toSmartFormModel } from '../domain/contracts'
import { LoadingButton, TopBar } from '../components/ui'

const EXAMPLE = '明天去鼓楼区修宽带，领一台光猫和一根光纤。'

export function SmartFormScreen({ user, navigate, notify }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)

  const parse = async () => {
    if (!text.trim()) {
      notify('请先描述你的需求', 'error')
      return
    }
    setLoading(true)
    try {
      const result = await api.ai.extract({ input: text, applicationType: APPLICATION_TYPE.MATERIAL })
      const parsed = toSmartFormModel(result, APPLICATION_TYPE.MATERIAL)
      navigate('material-preview', { parsed, sourceText: text })
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
      <TopBar title="智能填单" />
      <section className="page-body smart-form-page">
        <div className="ai-intro-card">
          <span className="ai-intro-card__icon"><Sparkles size={25} /></span>
          <div>
            <span className="ai-label">AI 智能填单</span>
            <h2>说出你的需求，我来帮你填表</h2>
            <p>AI 生成内容需要你确认后才会提交</p>
          </div>
        </div>

        <div className="form-type-card">
          <span>当前申请类型</span>
          <strong>领料申请</strong>
          <span className="role-chip">{user.roleName}</span>
        </div>

        <label className="field">
          <span className="field__label">描述你的需求 <i>*</i></span>
          <span className={`textarea-shell ${listening ? 'is-listening' : ''}`}>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="例如：明天去鼓楼区修宽带，需要领一台光猫…"
              rows={6}
            />
            <span className="textarea-shell__count">{text.length}/300</span>
          </span>
        </label>

        <button className={`voice-button ${listening ? 'is-listening' : ''}`} onClick={simulateVoice}>
          <span><Mic size={22} /></span>
          <strong>{listening ? '正在识别，点击结束' : '语音输入'}</strong>
          <small>{listening ? '请说出你的业务需求…' : '识别结果会先进入文本框供你确认'}</small>
        </button>

        <button className="example-card" onClick={() => setText(EXAMPLE)}>
          <Lightbulb size={17} />
          <span><strong>试试这样说</strong><small>“{EXAMPLE}”</small></span>
          <ChevronRight size={17} />
        </button>

        <LoadingButton className="button button--primary button--block button--large" loading={loading} loadingText="正在智能解析…" onClick={parse}>
          <Sparkles size={18} />开始智能解析
        </LoadingButton>
        <button
          className="button button--ghost button--block"
          onClick={() => navigate('material-preview', { parsed: null, sourceText: '' })}
        >
          直接手工填写
        </button>
      </section>
    </div>
  )
}
