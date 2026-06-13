import { useCallback, useState } from 'react'
import { loginMaintainer } from './frontend/services/maintainerApi'
import { initialTasks } from './frontend/data/maintainerMockData'
import { createTaskActionHandler } from './frontend/core/taskActions'
import { api } from './frontend/services/maintainerApi'
import { OpsHomeScreen } from './frontend/screens/OpsHomeScreen'
import { TaskDetailScreen } from './frontend/screens/TaskDetailScreen'
import { TaskFeedbackScreen } from './frontend/screens/TaskFeedbackScreen'
import { SmartFormScreen } from './frontend/screens/SmartFormScreen'
import { MaterialPreviewScreen } from './frontend/screens/MaterialPreviewScreen'
import { OpportunitySmartScreen } from './frontend/screens/OpportunitySmartScreen'
import { OpportunityPreviewScreen } from './frontend/screens/OpportunityPreviewScreen'
import { OpportunityListScreen } from './frontend/screens/OpportunityListScreen'
import { BottomNav, TopBar } from './frontend/components/ui'
import { ArrowLeft, LogOut, UserRound } from 'lucide-react'

const INITIAL_ROUTE = { screen: 'home', params: {} }

/** Tab 屏幕集合 — 这些屏幕显示底部导航栏 */
const TAB_SCREENS = new Set(['home', 'opportunities', 'me'])

export default function App() {
  const [user, setUser] = useState(() => loginMaintainer())
  const [tasks, setTasks] = useState(initialTasks)
  const [stack, setStack] = useState([INITIAL_ROUTE])
  const [notifications, setNotifications] = useState([])

  const route = stack[stack.length - 1]
  const isTabScreen = TAB_SCREENS.has(route.screen)

  const activeTab = isTabScreen ? route.screen : 'home'

  const navigate = useCallback((screen, params = {}) => {
    setStack((prev) => [...prev, { screen, params }])
  }, [])

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  /** 切换底部 Tab — 重置导航栈到该 Tab */
  const switchTab = useCallback((tabId) => {
    setStack([{ screen: tabId, params: {} }])
  }, [])

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }, [])

  const updateTask = useCallback((taskId, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)))
  }, [])

  const addApplication = useCallback((app) => {
    notify('领料申请已提交')
    setStack([INITIAL_ROUTE])
  }, [notify])

  const confirm = useCallback(({ title, description, confirmText, onConfirm }) => {
    if (window.confirm(`${title}\n\n${description || ''}`)) {
      onConfirm()
    }
  }, [])

  const performTaskAction = useCallback(
    createTaskActionHandler({ api, updateTask, navigate, confirm, notify }),
    [api, updateTask, navigate, confirm, notify],
  )

  const renderScreen = () => {
    switch (route.screen) {
      case 'home':
        return (
          <OpsHomeScreen
            user={user}
            tasks={tasks}
            navigate={navigate}
            performTaskAction={performTaskAction}
          />
        )
      case 'task-detail':
        return (
          <TaskDetailScreen
            route={route}
            tasks={tasks}
            navigate={navigate}
            goBack={goBack}
            performTaskAction={performTaskAction}
          />
        )
      case 'task-feedback':
        return (
          <TaskFeedbackScreen
            route={route}
            tasks={tasks}
            updateTask={updateTask}
            navigate={navigate}
            goBack={goBack}
            notify={notify}
          />
        )
      case 'smart-form':
        return (
          <SmartFormScreen
            user={user}
            navigate={navigate}
            notify={notify}
            goBack={goBack}
          />
        )
      case 'material-preview':
        return (
          <MaterialPreviewScreen
            route={route}
            goBack={goBack}
            addApplication={addApplication}
            navigate={navigate}
            notify={notify}
          />
        )
      case 'opportunity-smart':
        return (
          <OpportunitySmartScreen
            user={user}
            navigate={navigate}
            notify={notify}
            goBack={goBack}
          />
        )
      case 'opportunity-preview':
        return (
          <OpportunityPreviewScreen
            route={route}
            goBack={goBack}
            navigate={navigate}
            notify={notify}
          />
        )
      case 'opportunities':
        return (
          <OpportunityListScreen
            navigate={navigate}
            notify={notify}
          />
        )
      case 'opportunity-detail':
        return (
          <OpportunityDetailScreen
            route={route}
            goBack={goBack}
            navigate={navigate}
            notify={notify}
          />
        )
      case 'me':
        return (
          <MeScreen
            user={user}
            navigate={navigate}
            notify={notify}
          />
        )
      default:
        return <OpsHomeScreen user={user} tasks={tasks} navigate={navigate} performTaskAction={performTaskAction} />
    }
  }

  return (
    <div className="app-shell">
      {renderScreen()}
      {/* 仅在 Tab 页显示底部导航 */}
      {isTabScreen && (
        <BottomNav active={activeTab} onChange={switchTab} />
      )}
      {/* Toast notifications */}
      {notifications.length > 0 && (
        <div className="toast-container">
          {notifications.map((n) => (
            <div key={n.id} className={`toast toast--${n.type}`}>
              {n.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** 我的页面 */
function MeScreen({ user, navigate, notify }) {
  return (
    <div className="page">
      <section className="home-hero">
        <div className="home-hero__top">
          <div>
            <h1>我的</h1>
            <p>{user.roleName} · {user.department}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0 4px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1769e0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, flexShrink: 0 }}>
            {user.name ? user.name.slice(0, 1) : '李'}
          </div>
          <div>
            <strong style={{ fontSize: 18, display: 'block' }}>{user.name}</strong>
            <small style={{ color: '#687386' }}>工号：{user.jobNo}</small>
          </div>
        </div>
      </section>
      <section className="page-body page-body--raised">
        <div className="card-list">
          <article className="business-card" onClick={() => notify('功能开发中')}>
            <div className="business-card__top"><h3>个人资料</h3></div>
            <div className="detail-line"><span>查看和编辑个人信息</span></div>
          </article>
          <article className="business-card" onClick={() => notify('功能开发中')}>
            <div className="business-card__top"><h3>我的申请</h3></div>
            <div className="detail-line"><span>领料、拜访、商机申请记录</span></div>
          </article>
          <article className="business-card" onClick={() => notify('功能开发中')}>
            <div className="business-card__top"><h3>设置</h3></div>
            <div className="detail-line"><span>通知、隐私、关于</span></div>
          </article>
        </div>
      </section>
    </div>
  )
}

/** 商机详情页 */
function OpportunityDetailScreen({ route, goBack, navigate, notify }) {
  const opp = route.params.opportunity
  if (!opp) {
    return (
      <div className="page page--plain">
        <TopBar title="商机详情" onBack={goBack} />
        <section className="page-body"><p style={{ padding: 24, color: 'var(--text-muted)' }}>商机信息不可用</p></section>
      </div>
    )
  }

  const statusLabel = {
    NEW: '新商机', FOLLOWING: '跟进中', HIGH_INTENT: '高意向', SIGNED: '已签约', CLOSED: '已关闭',
  }

  return (
    <div className="page page--plain">
      <TopBar title="商机详情" onBack={goBack} />
      <section className="page-body detail-page">
        <div style={{ padding: '0 0 16px' }}>
          <span className="card-kicker">{opp.code}</span>
          <h2 style={{ margin: '4px 0' }}>{opp.name}</h2>
        </div>
        <dl className="readonly-list">
          <div><dt>客户名称</dt><dd>{opp.customer}</dd></div>
          <div><dt>意向等级</dt><dd>{opp.level === 'A' ? 'A类 · 高意向' : opp.level === 'B' ? 'B类 · 中等' : 'C类 · 低意向'}</dd></div>
          <div><dt>预计金额</dt><dd>{opp.amount} 万元</dd></div>
          <div><dt>状态</dt><dd>{statusLabel[opp.status] || opp.status}</dd></div>
          <div><dt>下次联系</dt><dd>{opp.nextContact || '待设置'}</dd></div>
          <div><dt>创建时间</dt><dd>{opp.createdAt}</dd></div>
          {opp.description ? <div><dt>描述</dt><dd>{opp.description}</dd></div> : null}
        </dl>
      </section>
    </div>
  )
}
