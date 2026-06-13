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
  X,
} from 'lucide-react'
import { TASK_STATUS } from '../domain/contracts'
import { EmptyState, SectionTitle, StatusBadge } from '../components/ui'
import { taskActionMeta } from '../core/taskActions'
import { TaskCard } from './TaskCard'

/** 获取当前北京时间格式化 */
function getBeijingTime() {
  const now = new Date()
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekDay = weekDays[now.getDay()]
  const hour = now.getHours()
  const greeting = hour < 9 ? '早上好' : hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'
  return { dateStr: `${month}月${day}日 · ${weekDay}`, greeting }
}

export function OpsHomeScreen({ user, tasks, navigate, performTaskAction }) {
  const [filter, setFilter] = useState(TASK_STATUS.PENDING_ACCEPTANCE)
  const [showNotifications, setShowNotifications] = useState(false)
  const { dateStr, greeting } = getBeijingTime()
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
            <span className="eyebrow">{dateStr}</span>
            <h1>{greeting}，{user.shortName || user.name || '同事'}</h1>
            <p>{user.roleName} · {user.department}</p>
          </div>
          <button className="notification-button" aria-label="通知" onClick={() => setShowNotifications((prev) => !prev)}>
            <Bell size={20} />
            <span />
          </button>
        </div>
        {showNotifications ? (
          <div className="notifications-panel">
            <div className="notifications-panel__head">
              <strong>消息通知</strong>
              <button className="icon-button icon-button--small" onClick={() => setShowNotifications(false)}><X size={16} /></button>
            </div>
            <div className="notifications-panel__body">
              <div className="notification-item">
                <span className="notification-item__dot" />
                <div>
                  <strong>新任务到达</strong>
                  <small>张先生 · 宽带故障维修 · 鼓楼区中央路168号</small>
                  <span className="notification-item__time">今天 08:25</span>
                </div>
              </div>
              <div className="notification-item">
                <span className="notification-item__dot" />
                <div>
                  <strong>任务即将超时</strong>
                  <small>GD202606100023 · 期望14:30完成</small>
                  <span className="notification-item__time">今天 10:00</span>
                </div>
              </div>
              <div className="notification-item notification-item--read">
                <span className="notification-item__dot" />
                <div>
                  <strong>领料申请已通过</strong>
                  <small>SQ202606100018 · 主管已审批</small>
                  <span className="notification-item__time">昨天 16:42</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
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
