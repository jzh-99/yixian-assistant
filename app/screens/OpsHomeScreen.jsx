/**
 * 装维工作台
 * 来源：翼线助手APP-v1.0/src/App.jsx OpsHomeScreen (第 468-542 行)
 *
 * 功能：
 * - 待接单 / 已接单 / 进行中 / 已完成 四态筛选
 * - 超时任务高亮
 * - 快速领料入口
 * - 任务卡片列表与操作按钮
 */
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Package,
} from 'lucide-react'
import { TASK_STATUS } from '../domain/contracts'
import { EmptyState, SectionTitle, StatusBadge } from '../components/ui'
import { taskActionMeta } from '../core/taskActions'
import { TaskCard } from './TaskCard'

export function OpsHomeScreen({ user, tasks, navigate, performTaskAction }) {
  const [filter, setFilter] = useState(TASK_STATUS.PENDING_ACCEPTANCE)
  const counts = useMemo(() => ({
    [TASK_STATUS.PENDING_ACCEPTANCE]: tasks.filter((item) => item.status === TASK_STATUS.PENDING_ACCEPTANCE).length,
    [TASK_STATUS.ACCEPTED]: tasks.filter((item) => item.status === TASK_STATUS.ACCEPTED).length,
    [TASK_STATUS.IN_PROGRESS]: tasks.filter((item) => item.status === TASK_STATUS.IN_PROGRESS).length,
    [TASK_STATUS.COMPLETED]: tasks.filter((item) => item.status === TASK_STATUS.COMPLETED).length,
  }), [tasks])
  const filtered = tasks
    .filter((item) => item.status === filter)
    .sort((a, b) => Number(b.overdue) - Number(a.overdue))

  const stats = [
    [TASK_STATUS.PENDING_ACCEPTANCE, '待接单'],
    [TASK_STATUS.ACCEPTED, '已接单'],
    [TASK_STATUS.IN_PROGRESS, '进行中'],
    [TASK_STATUS.COMPLETED, '已完成'],
  ]

  return (
    <div className="page">
      <section className="home-hero">
        <div className="home-hero__top">
          <div>
            <span className="eyebrow">6月10日 · 星期三</span>
            <h1>早上好，{user.shortName}</h1>
            <p>{user.roleName} · {user.department}</p>
          </div>
          <button className="notification-button" aria-label="通知">
            <Bell size={20} />
            <span />
          </button>
        </div>
        <div className="stats-grid">
          {stats.map(([id, label]) => (
            <button key={id} className={filter === id ? 'is-active' : ''} onClick={() => setFilter(id)}>
              <strong>{counts[id]}</strong>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="page-body page-body--raised">
        <button className="quick-action-card" onClick={() => navigate('smart-form')}>
          <span className="quick-action-card__icon"><Package size={23} /></span>
          <span className="quick-action-card__text">
            <strong>快速领料</strong>
            <small>说一句话，智能生成领料申请</small>
          </span>
          <span className="quick-action-card__badge">AI</span>
          <ChevronRight size={19} />
        </button>

        <SectionTitle title={filter === TASK_STATUS.COMPLETED ? '历史任务' : '今日任务'} action="查看全部" />
        <div className="card-list">
          {filtered.length ? filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={() => navigate('task-detail', { taskId: task.id })}
              onAction={() => performTaskAction(task)}
            />
          )) : (
            <EmptyState
              icon={CheckCircle2}
              title="当前没有待处理任务"
              description="新任务到达后会显示在这里"
            />
          )}
        </div>
      </section>
    </div>
  )
}

export { taskActionMeta }
