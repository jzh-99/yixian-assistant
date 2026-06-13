import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Bot,
  Check,
  Home,
  ImagePlus,
  Sparkles,
  Target,
  UserRound,
  X,
} from 'lucide-react'
import { statusMeta } from '../data/maintainerMockData'

export function TopBar({ title, onBack, action, transparent = false }) {
  return (
    <header className={`top-bar ${transparent ? 'top-bar--transparent' : ''}`}>
      <div className="top-bar__side">
        {onBack ? (
          <button className="icon-button" onClick={onBack} aria-label="返回">
            <ArrowLeft size={21} />
          </button>
        ) : null}
      </div>
      <h1>{title}</h1>
      <div className="top-bar__side top-bar__side--right">{action}</div>
    </header>
  )
}

const tabs = [
  { id: 'home', label: '工作台', Icon: Home },
  { id: 'opportunities', label: '商机', Icon: Target },
  { id: 'me', label: '我的', Icon: UserRound },
]

export function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`bottom-nav__item ${active === id ? 'is-active' : ''}`}
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
        >
          <Icon size={21} strokeWidth={active === id ? 2.4 : 1.9} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

export function StatusBadge({ status, label }) {
  const meta = statusMeta[status] || { label: label || status, tone: 'muted' }
  return <span className={`status-badge status-badge--${meta.tone}`}>{label || meta.label}</span>
}

export function SectionTitle({ title, action, onAction }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action ? (
        <button className="text-button" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  )
}

export function EmptyState({ icon: Icon = FileText, title, description, action, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icon size={30} />
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
      {action ? (
        <button className="button button--secondary button--small" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  )
}

export function FloatingAssistant({ onOpen, bottom = 88 }) {
  const [position, setPosition] = useState(null)
  const buttonRef = useRef(null)
  const dragRef = useRef(null)

  const onPointerDown = (event) => {
    const button = buttonRef.current
    const container = button?.offsetParent
    if (!button || !container) return
    const rect = button.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      containerRect,
      moved: false,
    }
    button.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = Math.abs(event.clientX - drag.startX)
    const dy = Math.abs(event.clientY - drag.startY)
    if (dx + dy > 5) drag.moved = true
    const size = 54
    const x = Math.min(
      Math.max(event.clientX - drag.containerRect.left - drag.offsetX, 10),
      drag.containerRect.width - size - 10,
    )
    const y = Math.min(
      Math.max(event.clientY - drag.containerRect.top - drag.offsetY, 72),
      drag.containerRect.height - size - 74,
    )
    setPosition({ x, y })
  }

  const onPointerUp = (event) => {
    const drag = dragRef.current
    if (!drag) return
    const button = buttonRef.current
    if (button?.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId)
    if (drag.moved && position) {
      const snapLeft = position.x + 27 < drag.containerRect.width / 2
      setPosition({
        x: snapLeft ? 12 : drag.containerRect.width - 66,
        y: position.y,
      })
    } else {
      onOpen()
    }
    dragRef.current = null
  }

  const style = position
    ? { left: position.x, top: position.y }
    : { right: 14, bottom }

  return (
    <button
      ref={buttonRef}
      className="assistant-fab"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      aria-label="打开智能助手"
    >
      <Bot size={25} />
      <span className="assistant-fab__spark">
        <Sparkles size={10} />
      </span>
    </button>
  )
}

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(onClose, 2300)
    return () => window.clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null
  return (
    <div className={`toast toast--${toast.type || 'success'}`} role="status">
      <span className="toast__icon">
        {toast.type === 'error' ? <X size={15} /> : <Check size={15} />}
      </span>
      <span>{toast.message}</span>
    </div>
  )
}

export function Modal({ title, description, confirmText = '确认', cancelText = '取消', danger, onConfirm, onCancel, children }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-card__header">
          <h3>{title}</h3>
          <button className="icon-button icon-button--small" onClick={onCancel} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        {description ? <p className="modal-card__description">{description}</p> : null}
        {children}
        <div className="modal-card__actions">
          <button className="button button--ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`button ${danger ? 'button--danger' : 'button--primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  )
}

export function LoadingButton({ loading, children, loadingText = '处理中…', ...props }) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? <span className="spinner" /> : null}
      {loading ? loadingText : children}
    </button>
  )
}

export function ImageUploader({ images, onChange, max = 3 }) {
  const inputRef = useRef(null)

  const pickImages = (event) => {
    const files = Array.from(event.target.files || []).slice(0, max - images.length)
    const next = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    }))
    onChange([...images, ...next])
    event.target.value = ''
  }

  return (
    <div className="image-uploader">
      <div className="image-grid">
        {images.map((image) => (
          <div className="image-thumb" key={image.id}>
            <img src={image.url} alt={image.name} />
            <button
              type="button"
              className="image-thumb__remove"
              onClick={() => onChange(images.filter((item) => item.id !== image.id))}
              aria-label={`删除${image.name}`}
            >
              <X size={13} />
            </button>
          </div>
        ))}
        {images.length < max ? (
          <button type="button" className="image-add" onClick={() => inputRef.current?.click()}>
            <ImagePlus size={24} />
            <span>添加图片</span>
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/*"
        multiple
        onChange={pickImages}
      />
      <span className="field-help">支持拍照或相册选择，最多 {max} 张（{images.length}/{max}）</span>
    </div>
  )
}

export function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const context = canvas.getContext('2d')
    context.scale(ratio, ratio)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 2.4
    context.strokeStyle = '#172033'
    if (value) {
      const image = new Image()
      image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height)
      image.src = value
    }
  }, [])

  const point = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const start = (event) => {
    drawingRef.current = true
    const context = canvasRef.current.getContext('2d')
    const p = point(event)
    context.beginPath()
    context.moveTo(p.x, p.y)
    canvasRef.current.setPointerCapture(event.pointerId)
  }

  const move = (event) => {
    if (!drawingRef.current) return
    const context = canvasRef.current.getContext('2d')
    const p = point(event)
    context.lineTo(p.x, p.y)
    context.stroke()
  }

  const finish = (event) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (canvasRef.current.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId)
    }
    onChange(canvasRef.current.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
    onChange('')
  }

  return (
    <div className="signature-pad">
      <div className="signature-pad__head">
        <span>请客户在框内签名</span>
        <button type="button" className="text-button" onClick={clear}>清空重签</button>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
      {!value ? <span className="signature-pad__hint">签名区域</span> : null}
    </div>
  )
}
