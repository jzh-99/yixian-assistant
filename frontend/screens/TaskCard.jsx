/**
 * 任务卡片组件
 * 来源：翼线助手APP-v1.0/src/App.jsx TaskCard (第 544-572 行)
 */
import { AlertTriangle, Clock3, MapPin } from 'lucide-react'
import { TASK_STATUS } from '../domain/contracts'
import { StatusBadge } from '../components/ui'
import { taskActionMeta } from '../core/taskActions'

export function TaskCard({ task, onOpen, onAction }) {
  const action = taskActionMeta[task.status]
  return (
    <article className={`business-card task-card ${task.overdue ? 'task-card--overdue' : ''}`} onClick={onOpen}>
      <div className="business-card__top">
        <div>
          <span className="card-kicker">{task.code}</span>
          <h3>{task.type}</h3>
        </div>
        <StatusBadge status={task.status} />
      </div>
      {task.overdue ? <div className="overdue-banner"><AlertTriangle size={14} />{task.overdueText}</div> : null}
      <div className="detail-line"><MapPin size={15} /><span>{task.address}</span></div>
      <div className="detail-line"><Clock3 size={15} /><span>期望完成：{task.expectedAt}</span></div>
      <div className="material-chips">
        {task.materials.map((item) => <span key={item}>{item}</span>)}
      </div>
      <div className="business-card__footer">
        <span>{task.customer}</span>
        <button className={`button ${task.status === TASK_STATUS.COMPLETED ? 'button--secondary' : 'button--primary'} button--small`} onClick={(event) => {
          event.stopPropagation()
          onAction()
        }}>
          {action.label}
        </button>
      </div>
    </article>
  )
}
