import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Edit3,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Filter,
  Headphones,
  Inbox,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MapPin,
  MessageCircleMore,
  Mic,
  Navigation,
  Package,
  PenLine,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import {
  assistantSuggestions,
  initialApplications,
  initialOpportunities,
  initialTasks,
  initialVisits,
  statusMeta,
} from './data/mockData'
import { api, apiRuntime } from './services/api'
import { authStore } from './services/authStore'
import {
  applicationFromApi,
  opportunityFromApi,
  taskFromApi,
  visitFromApi,
} from './domain/apiAdapters'
import {
  APPLICATION_STATUS,
  APPLICATION_TYPE,
  CUSTOMER_TYPE,
  OPPORTUNITY_STATUS,
  ROLE_CODE,
  TASK_STATUS,
  isMaintainer,
  normalizeCurrentUser,
  toContractDateTime,
  toSmartFormModel,
} from './domain/contracts'
import {
  BottomNav,
  EmptyState,
  FloatingAssistant,
  ImageUploader,
  LoadingButton,
  Modal,
  SectionTitle,
  SignaturePad,
  StatusBadge,
  Toast,
  TopBar,
} from './components/ui'

const storedUser = authStore.getSession()
const bootUser = storedUser ? normalizeCurrentUser(storedUser) : null

const mainRoutes = {
  home: 'home',
  'smart-form': 'smart-form',
  opportunities: 'opportunities',
  me: 'me',
}

const taskActionMeta = {
  [TASK_STATUS.PENDING_ACCEPTANCE]: { label: '接单', next: TASK_STATUS.ACCEPTED, title: '确认接收该任务？', success: '接单成功' },
  [TASK_STATUS.ACCEPTED]: { label: '开始工作', next: TASK_STATUS.IN_PROGRESS, title: '确认现在开始执行该任务？', success: '任务已进入进行中' },
  [TASK_STATUS.IN_PROGRESS]: { label: '反馈完工', next: TASK_STATUS.COMPLETED },
  [TASK_STATUS.COMPLETED]: { label: '查看详情', next: null },
}

const customerTypeText = {
  [CUSTOMER_TYPE.PUBLIC]: '公众',
  [CUSTOMER_TYPE.ENTERPRISE]: '政企',
}

function opportunityCustomerTypeLabel(type) {
  return customerTypeText[type] || '公众'
}

function opportunityMaintainerLabel(needMaintainer) {
  return needMaintainer ? '需要装维' : '无需装维'
}

function isSignedMaintainerOpportunity(opportunity) {
  return opportunity?.status === OPPORTUNITY_STATUS.SIGNED && Boolean(opportunity.needMaintainer)
}

function belongsToCurrentUser(opportunity, user) {
  if (!user) return false
  const ownerIds = [opportunity.ownerId, opportunity.creatorId, opportunity.managerId]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .map(String)
  if (ownerIds.length) return ownerIds.includes(String(user.id))

  const ownerJobs = [opportunity.ownerJobNo, opportunity.creatorJobNo]
    .filter(Boolean)
    .map(String)
  if (ownerJobs.length) return ownerJobs.includes(String(user.jobNo || user.username))

  return opportunity.owner === user.name
}

function App() {
  const [user, setUser] = useState(bootUser)
  const [route, setRoute] = useState({ name: bootUser ? 'home' : 'login', params: {} })
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('home')
  const [tasks, setTasks] = useState(initialTasks)
  const [applications, setApplications] = useState(initialApplications)
  const [visits, setVisits] = useState(initialVisits)
  const [opportunities, setOpportunities] = useState(initialOpportunities)
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  const navigate = useCallback((name, params = {}, options = {}) => {
    if (!options.replace) setHistory((items) => [...items, route])
    setRoute({ name, params })
  }, [route])

  const goBack = useCallback(() => {
    const previous = history.at(-1)
    if (previous) {
      setRoute(previous)
      setHistory(history.slice(0, -1))
      return
    }
    setRoute({ name: mainRoutes[activeTab], params: {} })
    setHistory([])
  }, [activeTab, history])

  const switchTab = useCallback((tab) => {
    setActiveTab(tab)
    setHistory([])
    setRoute({ name: mainRoutes[tab], params: {} })
  }, [])

  const login = useCallback((nextUser) => {
    authStore.setSession(nextUser)
    setUser(nextUser)
    setActiveTab('home')
    setHistory([])
    setRoute({ name: 'home', params: {} })
    notify(`欢迎回来，${nextUser.name}`)
  }, [notify])

  const clearSession = useCallback(() => {
    authStore.clear()
    setUser(null)
    setHistory([])
    setRoute({ name: 'login', params: {} })
    setModal(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    window.addEventListener('yixian:auth-expired', clearSession)
    return () => window.removeEventListener('yixian:auth-expired', clearSession)
  }, [clearSession])

  useEffect(() => {
    if (!user || apiRuntime.useMock) return undefined
    let active = true
    Promise.all([
      api.tasks.list({ pageNo: 1, pageSize: 100 }),
      api.applications.list({ pageNo: 1, pageSize: 100 }),
      isMaintainer(user) ? Promise.resolve([]) : api.visits.list(),
      api.opportunities.list({ pageNo: 1, pageSize: 100 }),
    ]).then(([taskPage, applicationPage, visitList, opportunityList]) => {
      if (!active) return
      setTasks((taskPage.list || []).map(taskFromApi))
      setApplications((applicationPage.list || []).map((item) => applicationFromApi(item, user.roleCode)))
      if (!isMaintainer(user)) {
        setVisits((visitList || []).map(visitFromApi))
      }
      setOpportunities((opportunityList || []).map(opportunityFromApi))
    }).catch((error) => {
      if (active) notify(error.message || '业务数据加载失败', 'error')
    })
    return () => {
      active = false
    }
  }, [notify, user])

  const confirm = useCallback((options) => setModal(options), [])

  const updateTask = useCallback((taskId, patch) => {
    setTasks((items) =>
      items.map((task) =>
        task.id === taskId
          ? { ...task, ...patch, version: patch.version ?? (task.version || 0) + 1 }
          : task,
      ),
    )
  }, [])

  const performTaskAction = useCallback((task) => {
    if (task.status === TASK_STATUS.IN_PROGRESS) {
      navigate('task-feedback', { taskId: task.id })
      return
    }
    if (task.status === TASK_STATUS.COMPLETED) {
      navigate('task-detail', { taskId: task.id })
      return
    }
    const meta = taskActionMeta[task.status]
    confirm({
      title: meta.title,
      description: `${task.code} · ${task.type}`,
      confirmText: meta.label,
      onConfirm: async () => {
        try {
          const updated = task.status === TASK_STATUS.PENDING_ACCEPTANCE
            ? await api.tasks.accept(task.id, task.version)
            : await api.tasks.start(task.id, task.version)
          updateTask(task.id, { status: updated.status || meta.next, version: updated.version })
          notify(meta.success)
        } catch (error) {
          notify(error.message || '任务状态更新失败', 'error')
        }
      },
    })
  }, [confirm, navigate, notify, updateTask])

  const addApplication = useCallback((application) => {
    setApplications((items) => [application, ...items])
  }, [])

  const addOpportunity = useCallback((opportunity) => {
    setOpportunities((items) => {
      const exists = items.some((item) => item.id === opportunity.id)
      if (exists) return items.map((item) => (item.id === opportunity.id ? opportunity : item))
      return [opportunity, ...items]
    })
  }, [])

  const currentOpportunities = useMemo(
    () => opportunities.filter((opportunity) => belongsToCurrentUser(opportunity, user)),
    [opportunities, user],
  )

  const contentProps = {
    user,
    login,
    route,
    navigate,
    goBack,
    switchTab,
    tasks,
    updateTask,
    performTaskAction,
    applications,
    setApplications,
    addApplication,
    visits,
    setVisits,
    opportunities: currentOpportunities,
    setOpportunities,
    addOpportunity,
    notify,
    confirm,
    logout,
  }

  const Screen = resolveScreen(route.name)
  const isMainPage = ['home', 'smart-form', 'opportunities', 'me'].includes(route.name)
  const showAssistant = Boolean(user) && !['login', 'assistant', 'task-feedback'].includes(route.name) && !modal

  return (
    <div className="app-stage">
      <div className={`phone-shell ${route.name === 'login' ? 'phone-shell--login' : ''}`}>
        <main className={`app-content ${isMainPage ? 'app-content--with-nav' : ''}`}>
          <Screen {...contentProps} />
        </main>

        {user && isMainPage ? <BottomNav active={activeTab} onChange={switchTab} /> : null}
        {showAssistant ? (
          <FloatingAssistant
            bottom={getAssistantBottom(route.name, user?.roleCode)}
            onOpen={() =>
              navigate('assistant', {
                context: getAssistantContext(route, tasks, currentOpportunities),
                sourceRoute: route,
              })
            }
          />
        ) : null}

        <Toast toast={toast} onClose={() => setToast(null)} />
        {modal ? (
          <Modal
            {...modal}
            onCancel={() => setModal(null)}
            onConfirm={async () => {
              const action = modal.onConfirm
              setModal(null)
              await action?.()
            }}
          >
            {modal.children}
          </Modal>
        ) : null}
      </div>
    </div>
  )
}

function getAssistantBottom(routeName, roleCode) {
  if (routeName === 'home') return roleCode === ROLE_CODE.ACCOUNT_MANAGER ? 198 : 138
  if (routeName === 'smart-form') return 148
  if (routeName === 'opportunities' || routeName === 'me') return 112
  if (routeName === 'opportunity-form') return 158
  if (['task-feedback', 'material-preview', 'visit-preview', 'support-form', 'opportunity-detail'].includes(routeName)) return 86
  return 24
}

function resolveScreen(name) {
  const screens = {
    login: LoginScreen,
    home: HomeScreen,
    'smart-form': SmartFormScreen,
    'material-preview': MaterialPreviewScreen,
    'visit-preview': VisitPreviewScreen,
    assistant: AssistantScreen,
    me: MeScreen,
    applications: ApplicationsScreen,
    'application-detail': ApplicationDetailScreen,
    'task-detail': TaskDetailScreen,
    'task-feedback': TaskFeedbackScreen,
    opportunities: OpportunitiesScreen,
    'opportunity-detail': OpportunityDetailScreen,
    'opportunity-form': OpportunityFormScreen,
    'support-form': SupportFormScreen,
    profile: ProfileScreen,
  }
  return screens[name] || HomeScreen
}

function getAssistantContext(route, tasks, opportunities) {
  if (route.name === 'task-detail') {
    const task = tasks.find((item) => item.id === route.params.taskId)
    return task ? `任务 ${task.code}` : ''
  }
  if (route.name === 'application-detail') return '申请详情'
  if (route.name === 'opportunity-detail') {
    const opportunity = opportunities.find((item) => item.id === route.params.opportunityId)
    return opportunity ? `商机 ${opportunity.name}` : ''
  }
  const labels = {
    home: '工作台',
    'smart-form': '智能填单',
    applications: '我的申请',
    opportunities: '商机管理',
    'support-form': '快速支撑',
  }
  return labels[route.name] || ''
}

function LoginScreen({ login }) {
  const [jobNo, setJobNo] = useState('ZW10086')
  const [password, setPassword] = useState('123456')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.auth.login({ username: jobNo, password })
      login(result.user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const selectDemo = (demoType) => {
    setJobNo(demoType === 'ops' ? 'ZW10086' : 'AM10028')
    setPassword('123456')
    setError('')
  }

  return (
    <div className="login-page">
      <div className="login-page__orbs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="login-brand">
        <div className="brand-mark">
          <span className="brand-mark__line brand-mark__line--one" />
          <span className="brand-mark__line brand-mark__line--two" />
          <span className="brand-mark__dot" />
        </div>
        <h1>翼线助手</h1>
        <p>让一线工作更简单</p>
      </div>

      <form className="login-card" onSubmit={submit}>
        <div className="login-card__heading">
          <h2>欢迎登录</h2>
          <span>使用企业工号进入工作台</span>
        </div>
        <label className="field">
          <span className="field__label">工号</span>
          <span className="input-shell">
            <UserRound size={18} />
            <input value={jobNo} onChange={(event) => setJobNo(event.target.value)} placeholder="请输入工号" />
          </span>
        </label>
        <label className="field">
          <span className="field__label">密码</span>
          <span className="input-shell">
            <LockKeyhole size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
            />
            <button type="button" className="input-shell__action" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        {error ? <div className="inline-error"><AlertTriangle size={15} />{error}</div> : null}
        <LoadingButton className="button button--primary button--block" loading={loading} loadingText="登录中…">
          登录
        </LoadingButton>

        <div className="demo-divider"><span>演示账号</span></div>
        <div className="demo-accounts">
          <button type="button" className={jobNo.startsWith('ZW') ? 'is-selected' : ''} onClick={() => selectDemo('ops')}>
            <Wrench size={18} />
            <span><strong>装维人员</strong><small>ZW10086</small></span>
            {jobNo.startsWith('ZW') ? <Check size={16} /> : null}
          </button>
          <button type="button" className={jobNo.startsWith('AM') ? 'is-selected' : ''} onClick={() => selectDemo('manager')}>
            <BriefcaseBusiness size={18} />
            <span><strong>客户经理</strong><small>AM10028</small></span>
            {jobNo.startsWith('AM') ? <Check size={16} /> : null}
          </button>
        </div>
      </form>

      <footer className="login-footer">
        <ShieldCheck size={14} />
        <span>企业信息安全保护 · MVP V1.0 演示环境</span>
      </footer>
    </div>
  )
}

function HomeScreen(props) {
  return isMaintainer(props.user) ? <OpsHomeScreen {...props} /> : <ManagerHomeScreen {...props} />
}

function OpsHomeScreen({ user, tasks, navigate, performTaskAction }) {
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

function TaskCard({ task, onOpen, onAction }) {
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

function ManagerHomeScreen({ user, visits, setVisits, opportunities, navigate, notify }) {
  const checkIn = async (visitId) => {
    try {
      const result = await api.visits.checkin(visitId)
      setVisits((items) => items.map((item) =>
        item.id === visitId ? { ...item, checkedIn: true, checkedAt: result.checkinTime || '刚刚' } : item,
      ))
      notify('签到成功')
    } catch (error) {
      notify(error.message || '签到失败', 'error')
    }
  }

  return (
    <div className="page">
      <section className="manager-hero">
        <div className="home-hero__top">
          <div>
            <span className="eyebrow">6月10日 · 星期三</span>
            <h1>上午好，{user.shortName}</h1>
            <p>{user.roleName} · {user.department}</p>
          </div>
          <button className="notification-button notification-button--light" aria-label="通知">
            <Bell size={20} />
            <span />
          </button>
        </div>
        <div className="manager-summary">
          <div><span>今日拜访</span><strong>{visits.length}</strong><small>个计划</small></div>
          <span className="manager-summary__divider" />
          <div><span>待跟进商机</span><strong>{opportunities.filter((item) => ![OPPORTUNITY_STATUS.SIGNED, OPPORTUNITY_STATUS.CLOSED].includes(item.status)).length}</strong><small>个商机</small></div>
        </div>
      </section>

      <section className="page-body page-body--raised">
        <div className="quick-grid">
          <button onClick={() => navigate('smart-form')}>
            <span className="quick-grid__icon quick-grid__icon--blue"><Sparkles size={22} /></span>
            <strong>智能拜访申请</strong>
            <small>AI 帮你快速填单</small>
          </button>
          <button onClick={() => navigate('support-form')}>
            <span className="quick-grid__icon quick-grid__icon--teal"><Headphones size={22} /></span>
            <strong>快速支撑</strong>
            <small>技术与方案支撑</small>
          </button>
        </div>

        <SectionTitle title="今日拜访" />
        <div className="visit-timeline">
          {visits.map((visit) => (
            <article className="visit-item" key={visit.id}>
              <div className="visit-item__time"><strong>{visit.time}</strong><span /></div>
              <div className="business-card visit-item__card">
                <div className="business-card__top">
                  <div><h3>{visit.customer}</h3><span className="card-kicker">{visit.purpose}</span></div>
                  <StatusBadge status={visit.checkedIn ? APPLICATION_STATUS.APPROVED : APPLICATION_STATUS.PENDING} label={visit.checkedIn ? `已签到 ${visit.checkedAt}` : '待签到'} />
                </div>
                <div className="detail-line"><MapPin size={15} /><span>{visit.address}</span></div>
                {!visit.checkedIn ? (
                  <button className="button button--secondary button--small button--block" onClick={() => checkIn(visit.id)}>
                    <Navigation size={15} />签到
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <SectionTitle title="待跟进商机" action="查看全部" onAction={() => navigate('opportunities')} />
        <div className="card-list">
          {opportunities.slice(0, 2).map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onOpen={() => navigate('opportunity-detail', { opportunityId: opportunity.id })}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function OpportunityCard({ opportunity, onOpen }) {
  const signedNeedsMaintainer = isSignedMaintainerOpportunity(opportunity)

  return (
    <article className="business-card opportunity-card" onClick={onOpen}>
      <div className="business-card__top">
        <div>
          <span className="card-kicker">{opportunityCustomerTypeLabel(opportunity.customerType)}客户 · {opportunity.customer}</span>
          <h3>{opportunity.name}</h3>
        </div>
        <StatusBadge status={opportunity.status} />
      </div>
      <div className="opportunity-tags">
        <span>{opportunityMaintainerLabel(opportunity.needMaintainer)}</span>
        {signedNeedsMaintainer ? <span className="opportunity-tags__warning">待派单</span> : null}
      </div>
      <div className="opportunity-metrics">
        <span><small>意向等级</small><strong className={`level level--${opportunity.level.toLowerCase()}`}>{opportunity.level}</strong></span>
        <span><small>预计金额</small><strong>¥ {opportunity.amount.toLocaleString()}</strong></span>
      </div>
      <div className="business-card__footer">
        <span className="next-contact"><Clock3 size={14} />下次联系：{opportunity.nextContact}</span>
        <ChevronRight size={18} />
      </div>
    </article>
  )
}

function SmartFormScreen({ user, navigate, notify }) {
  const maintainer = isMaintainer(user)
  const applicationType = maintainer ? APPLICATION_TYPE.MATERIAL : APPLICATION_TYPE.VISIT
  const example = maintainer
    ? '明天去鼓楼区修宽带，领一台光猫和一根光纤。'
    : '明天上午去拜访南京远景科技，谈专线业务，需要技术支撑。'
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
      const result = await api.ai.extract({ input: text, applicationType })
      const parsed = toSmartFormModel(result, applicationType)
      navigate(maintainer ? 'material-preview' : 'visit-preview', { parsed, sourceText: text })
    } catch (error) {
      notify(error.message || '智能解析失败，你仍可手工填写', 'error')
    } finally {
      setLoading(false)
    }
  }

  const simulateVoice = () => {
    if (listening) {
      setListening(false)
      setText(example)
      notify('语音已转为文字，请确认')
    } else {
      setListening(true)
      window.setTimeout(() => {
        setListening(false)
        setText(example)
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
          <strong>{maintainer ? '领料申请' : '外出拜访申请'}</strong>
          <span className="role-chip">{user.roleName}</span>
        </div>

        <label className="field">
          <span className="field__label">描述你的需求 <i>*</i></span>
          <span className={`textarea-shell ${listening ? 'is-listening' : ''}`}>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={maintainer ? '例如：明天去鼓楼区修宽带，需要领一台光猫…' : '例如：明天上午拜访某客户，沟通专线业务…'}
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

        <button className="example-card" onClick={() => setText(example)}>
          <Lightbulb size={17} />
          <span><strong>试试这样说</strong><small>“{example}”</small></span>
          <ChevronRight size={17} />
        </button>

        <LoadingButton className="button button--primary button--block button--large" loading={loading} loadingText="正在智能解析…" onClick={parse}>
          <Sparkles size={18} />开始智能解析
        </LoadingButton>
        <button
          className="button button--ghost button--block"
          onClick={() => navigate(maintainer ? 'material-preview' : 'visit-preview', { parsed: null, sourceText: '' })}
        >
          直接手工填写
        </button>
      </section>
    </div>
  )
}

function AiResultCard({ sourceText, warning }) {
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

function MaterialPreviewScreen({ user, route, goBack, addApplication, navigate, notify }) {
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
        applicantRoleCode: user.roleCode,
        applicantName: user.name,
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

function VisitPreviewScreen({ user, route, goBack, addApplication, navigate, notify }) {
  const parsed = route.params.parsed
  const [customer, setCustomer] = useState(parsed?.customer || '')
  const [purpose, setPurpose] = useState(parsed?.purpose || '')
  const [expectedAt, setExpectedAt] = useState(parsed?.expectedAt || '')
  const [contact, setContact] = useState(parsed?.contact || '')
  const [address, setAddress] = useState(parsed?.address || '')
  const [needSupport, setNeedSupport] = useState(parsed?.needSupport || false)
  const [supportContent, setSupportContent] = useState(parsed?.supportContent || '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const submit = async () => {
    const nextErrors = {}
    if (!customer.trim()) nextErrors.customer = '请选择或输入客户名称'
    if (!purpose.trim()) nextErrors.purpose = '请填写拜访目的'
    if (!expectedAt.trim()) nextErrors.expectedAt = '请选择期望时间'
    if (needSupport && !supportContent.trim()) nextErrors.supportContent = '请说明所需支撑内容'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      notify('请完善必填信息', 'error')
      return
    }
    setLoading(true)
    try {
      const result = await api.applications.create({
        type: APPLICATION_TYPE.VISIT,
        title: `${customer} ${purpose}`,
        content: purpose,
        extra: {
          customerName: customer,
          expectedTime: toContractDateTime(expectedAt),
          contactName: contact,
          location: address,
          needSupport,
          supportContent,
        },
      })
      const id = String(result.id || `APP-${Date.now()}`)
      const application = {
        id,
        code: result.appNo || `SQ${Date.now().toString().slice(-12)}`,
        type: APPLICATION_TYPE.VISIT,
        typeName: '外出拜访',
        title: `${customer} ${purpose}`,
        submittedAt: '刚刚',
        status: APPLICATION_STATUS.PENDING,
        statusName: '待审批',
        applicantRoleCode: user.roleCode,
        applicantName: user.name,
        fields: [
          ['客户名称', customer],
          ['拜访目的', purpose],
          ['期望时间', expectedAt],
          ...(contact ? [['联系人', contact]] : []),
          ...(address ? [['拜访地点', address]] : []),
          ['需要支撑', needSupport ? '是' : '否'],
          ...(needSupport ? [['支撑内容', supportContent]] : []),
        ],
        timeline: [{ title: '申请已提交', time: '刚刚', note: '等待主管审批', state: 'current' }],
      }
      addApplication(application)
      notify('拜访申请提交成功')
      navigate('application-detail', { applicationId: id })
    } catch (error) {
      notify(error.message || '拜访申请提交失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page--plain page--with-actions">
      <TopBar title="确认拜访申请" onBack={goBack} />
      <section className="page-body form-page">
        <AiResultCard sourceText={route.params.sourceText} warning={!customer && parsed ? '客户名称未明确，请选择' : '“明天上午”已暂定为 10:00，请确认'} />
        <FormSection title="拜访信息">
          <TextField label="客户名称" required value={customer} onChange={setCustomer} error={errors.customer} placeholder="搜索或输入客户名称" warning={!customer && parsed ? '匹配到多个客户，请选择' : ''} />
          <TextAreaField label="拜访目的" required value={purpose} onChange={setPurpose} error={errors.purpose} placeholder="请说明本次拜访目的" />
          <TextField label="期望时间" required value={expectedAt} onChange={setExpectedAt} error={errors.expectedAt} placeholder="请选择日期和时间" type="datetime-local" />
          <TextField label="联系人" value={contact} onChange={setContact} placeholder="选填" />
          <TextField label="拜访地点" value={address} onChange={setAddress} placeholder="选填" />
        </FormSection>
        <FormSection title="支撑需求">
          <label className="toggle-row">
            <span><strong>需要支撑</strong><small>开启后请填写技术或方案支撑内容</small></span>
            <input type="checkbox" checked={needSupport} onChange={(event) => setNeedSupport(event.target.checked)} />
            <i />
          </label>
          {needSupport ? <TextAreaField label="所需支撑内容" required value={supportContent} onChange={setSupportContent} error={errors.supportContent} placeholder="请描述需要的支撑内容" /> : null}
        </FormSection>
      </section>
      <div className="sticky-actions">
        <button className="button button--secondary" onClick={goBack}>重新解析</button>
        <LoadingButton className="button button--primary" loading={loading} loadingText="提交中…" onClick={submit}>确认并提交</LoadingButton>
      </div>
    </div>
  )
}

function FormSection({ title, action, children }) {
  return (
    <section className="form-section">
      <div className="form-section__head"><h2>{title}</h2>{action}</div>
      <div className="form-section__body">{children}</div>
    </section>
  )
}

function TextField({ label, required, value, onChange, placeholder, error, warning, type = 'text' }) {
  return (
    <label className={`field ${error ? 'field--error' : ''} ${warning ? 'field--warning' : ''}`}>
      <span className="field__label">{label} {required ? <i>*</i> : null}</span>
      <input className="form-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {warning ? <span className="field-warning"><AlertTriangle size={13} />{warning}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}

function TextAreaField({ label, required, value, onChange, placeholder, error }) {
  return (
    <label className={`field ${error ? 'field--error' : ''}`}>
      <span className="field__label">{label} {required ? <i>*</i> : null}</span>
      <textarea className="form-input form-textarea" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}

function AssistantScreen({ user, route, goBack, switchTab, navigate, notify }) {
  const [sessionId] = useState(() => crypto.randomUUID())
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'assistant',
      content: '你好，我可以帮你查询流程、制度、物料标准和业务操作。',
      source: '翼线助手知识库',
      time: '刚刚',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const ask = async (question = input) => {
    if (!question.trim() || loading) return
    const userMessage = { id: crypto.randomUUID(), type: 'user', content: question.trim() }
    setMessages((items) => [...items, userMessage])
    setInput('')
    setLoading(true)
    try {
      const response = await api.ai.chat({
        message: question.trim(),
        sessionId,
        history: messages.slice(-10).map((message) => ({
          role: message.type === 'assistant' ? 'assistant' : 'user',
          content: message.content,
        })),
      })
      const routeMap = {
        '/apply/material': 'smart-form',
        '/apply/visit': 'smart-form',
        '/applications': 'applications',
        '/opportunities': 'opportunities',
      }
      setMessages((items) => [...items, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: response.answer,
        source: response.source,
        action: response.suggestedAction ? {
          label: response.suggestedAction.label,
          target: routeMap[response.suggestedAction.route] || response.suggestedAction.route,
        } : null,
        lowConfidence: Number(response.confidence) < 0.5,
        time: '刚刚',
      }])
    } catch (error) {
      notify(error.message || '智能助手暂时不可用', 'error')
    } finally {
      setLoading(false)
    }
  }

  const followAction = (action) => {
    if (['home', 'smart-form', 'opportunities', 'me'].includes(action.target)) switchTab(action.target)
    else navigate(action.target)
  }

  return (
    <div className="assistant-page">
      <TopBar
        title="智能助手"
        onBack={goBack}
        action={<button className="text-button" onClick={() => setMessages((items) => items.slice(0, 1))}>新会话</button>}
      />
      {route.params.context ? (
        <div className="assistant-context">
          <FileText size={15} />
          <span>正在咨询：{route.params.context}</span>
        </div>
      ) : null}
      <div className="assistant-messages">
        <div className="assistant-welcome">
          <span><Bot size={24} /></span>
          <div><strong>翼线智能助手</strong><small>流程、制度和业务问题随时问我</small></div>
        </div>

        {messages.map((message) => (
          <div key={message.id} className={`message-row message-row--${message.type}`}>
            {message.type === 'assistant' ? <span className="message-avatar"><Bot size={17} /></span> : null}
            <div className={`message-bubble ${message.lowConfidence ? 'message-bubble--warning' : ''}`}>
              {message.lowConfidence ? <div className="message-warning"><AlertTriangle size={14} />低置信度回答</div> : null}
              <p>{message.content}</p>
              {message.type === 'assistant' ? (
                <div className="message-meta">
                  <span>来源：{message.source}</span>
                  <span>更新：2026-06-01</span>
                </div>
              ) : null}
              {message.action ? (
                <button className="message-action" onClick={() => followAction(message.action)}>
                  {message.action.label}<ChevronRight size={15} />
                </button>
              ) : null}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="message-row message-row--assistant">
            <span className="message-avatar"><Bot size={17} /></span>
            <div className="message-bubble typing"><span /><span /><span /></div>
          </div>
        ) : null}

        {messages.length === 1 ? (
          <div className="suggestion-panel">
            <span>你可以这样问</span>
            <div>
              {(assistantSuggestions[user.roleCode] || []).map((suggestion) => (
                <button key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="assistant-composer">
        <button className="icon-button"><Mic size={20} /></button>
        <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
          if (event.key === 'Enter') ask()
        }} placeholder="输入你想咨询的问题" />
        <button className="send-button" onClick={() => ask()} disabled={!input.trim() || loading}><Send size={18} /></button>
      </div>
    </div>
  )
}

function MeScreen({ user, applications, navigate, confirm, logout }) {
  const pendingCount = applications.filter((item) =>
    item.applicantRoleCode === user.roleCode && item.status === APPLICATION_STATUS.PENDING,
  ).length
  return (
    <div className="page page--plain">
      <TopBar title="我的" />
      <section className="page-body me-page">
        <div className="profile-card">
          <div className="avatar">{user.name.slice(-1)}</div>
          <div><h2>{user.name}</h2><p>{user.jobNo}</p></div>
          <StatusBadge status={APPLICATION_STATUS.APPROVED} label={user.roleName} />
        </div>
        <div className="profile-meta">
          <span><Building2 size={16} />{user.department}</span>
          <span><ShieldCheck size={16} />企业认证账号</span>
        </div>

        <div className="menu-card">
          <button onClick={() => navigate('applications')}>
            <span className="menu-icon menu-icon--blue"><FileCheck2 size={20} /></span>
            <span><strong>我的申请</strong><small>查看审批进度与关联任务</small></span>
            {pendingCount ? <em>{pendingCount}</em> : null}
            <ChevronRight size={18} />
          </button>
          <button onClick={() => navigate('profile')}>
            <span className="menu-icon menu-icon--teal"><UserRound size={20} /></span>
            <span><strong>个人资料</strong><small>查看基础信息与角色能力</small></span>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="role-detail-card">
          <div className="form-section__head"><h2>{isMaintainer(user) ? '技能标签' : '负责客户'}</h2><span className="demo-tag">演示数据</span></div>
          {isMaintainer(user) ? (
            <div className="skill-tags">{user.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
          ) : (
            <div className="customer-summary"><strong>{user.customers.length}</strong><span>家重点客户</span><div>{user.customers.slice(0, 2).join('、')}</div></div>
          )}
        </div>

        <button className="logout-button" onClick={() => confirm({
          title: '确认退出当前账号？',
          description: '退出后将清除当前登录状态，并返回登录页。',
          confirmText: '退出登录',
          danger: true,
          onConfirm: logout,
        })}><LogOut size={18} />退出登录</button>
        <span className="version-text">翼线助手 MVP V1.0</span>
      </section>
    </div>
  )
}

function ApplicationsScreen({ user, applications, setApplications, navigate, goBack, notify }) {
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const types = isMaintainer(user)
    ? [['all', '全部'], [APPLICATION_TYPE.MATERIAL, '领料申请']]
    : [['all', '全部'], [APPLICATION_TYPE.VISIT, '外出拜访'], [APPLICATION_TYPE.SUPPORT, '支撑申请']]
  const filtered = applications.filter((item) =>
    item.applicantRoleCode === user.roleCode &&
    (type === 'all' || item.type === type) &&
    (status === 'all' || item.status === status),
  )

  useEffect(() => {
    let active = true
    api.applications.list({ pageNo: 1, pageSize: 100 })
      .then((page) => {
        if (!active) return
        const refreshed = (page.list || []).map((item) => applicationFromApi(item, user.roleCode))
        setApplications((items) => [
          ...refreshed,
          ...items.filter((item) => item.applicantRoleCode !== user.roleCode),
        ])
      })
      .catch((error) => {
        if (active) notify?.(error.message || '申请列表刷新失败', 'error')
      })
    return () => {
      active = false
    }
  }, [notify, setApplications, user.roleCode])

  return (
    <div className="page page--plain">
      <TopBar title="我的申请" onBack={goBack} />
      <div className="filter-tabs">
        {types.map(([id, label]) => <button key={id} className={type === id ? 'is-active' : ''} onClick={() => setType(id)}>{label}</button>)}
      </div>
      <section className="page-body applications-page">
        <label className="filter-select">
          <Filter size={16} />
          <span>申请状态</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">全部状态</option>
            <option value={APPLICATION_STATUS.PENDING}>待审批</option>
            <option value={APPLICATION_STATUS.APPROVED}>已通过</option>
            <option value={APPLICATION_STATUS.REJECTED}>已驳回</option>
            <option value={APPLICATION_STATUS.CANCELLED}>已撤回</option>
          </select>
          <ChevronDown size={16} />
        </label>
        <div className="card-list">
          {filtered.length ? filtered.map((application) => (
            <article className="business-card application-card" key={application.id} onClick={() => navigate('application-detail', { applicationId: application.id })}>
              <div className="business-card__top">
                <span className={`application-type application-type--${application.type.toLowerCase()}`}>
                  {application.type === APPLICATION_TYPE.MATERIAL ? <Package size={18} /> : application.type === APPLICATION_TYPE.VISIT ? <CalendarDays size={18} /> : <Headphones size={18} />}
                </span>
                <div className="application-card__title"><span>{application.typeName}</span><h3>{application.title}</h3></div>
                <StatusBadge status={application.status} />
              </div>
              <div className="application-card__meta"><span>{application.code}</span><span>{application.submittedAt}</span></div>
              {application.relatedTaskId ? <div className="related-task">关联任务：<StatusBadge status={TASK_STATUS.IN_PROGRESS} /></div> : null}
              <ChevronRight className="application-card__arrow" size={18} />
            </article>
          )) : (
            <EmptyState icon={Inbox} title="还没有申请记录" description="提交的业务申请会显示在这里" action="去智能填单" onAction={() => navigate('smart-form')} />
          )}
        </div>
      </section>
    </div>
  )
}

function ApplicationDetailScreen({ user, route, applications, setApplications, tasks, navigate, goBack, notify, confirm }) {
  const application = applications.find((item) => item.id === route.params.applicationId)
  if (!application) return <NotFound onBack={goBack} />

  const withdraw = () => confirm({
    title: '确认撤回该申请？',
    description: '撤回后可从原申请重新发起。',
    confirmText: '确认撤回',
    danger: true,
    onConfirm: async () => {
      try {
        const updated = await api.applications.cancel(application.id)
        const normalized = applicationFromApi(updated, user.roleCode)
        setApplications((items) => items.map((item) =>
          item.id === application.id
            ? { ...item, ...normalized }
            : item,
        ))
        notify('申请已撤回')
      } catch (error) {
        notify(error.message || '申请撤回失败', 'error')
      }
    },
  })

  const relatedTask = tasks.find((item) => item.id === application.relatedTaskId)
  return (
    <div className={`page page--plain ${[APPLICATION_STATUS.PENDING, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.CANCELLED].includes(application.status) ? 'page--with-actions' : ''}`}>
      <TopBar title="申请详情" onBack={goBack} />
      <section className="page-body detail-page">
        <div className={`detail-status-card detail-status-card--${statusMeta[application.status]?.tone || 'muted'}`}>
          <span className="detail-status-card__icon"><FileCheck2 size={24} /></span>
          <div><span>{application.typeName}</span><h2>{application.statusName}</h2><small>{application.code}</small></div>
          <StatusBadge status={application.status} />
        </div>
        {application.rejectReason ? <div className="reject-card"><AlertTriangle size={19} /><div><strong>驳回原因</strong><p>{application.rejectReason}</p></div></div> : null}

        <FormSection title="申请内容">
          <dl className="readonly-list">
            {application.fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            {application.applicantName ? <div><dt>申请人</dt><dd>{application.applicantName}</dd></div> : null}
            <div><dt>提交时间</dt><dd>{application.submittedAt}</dd></div>
            {application.approverName ? <div><dt>审批人</dt><dd>{application.approverName}</dd></div> : null}
            {application.approvedAt ? <div><dt>审批时间</dt><dd>{application.approvedAt}</dd></div> : null}
          </dl>
        </FormSection>

        <FormSection title="审批进度">
          <div className="status-timeline">
            {application.timeline.map((item, index) => (
              <div className={`status-timeline__item status-timeline__item--${item.state}`} key={`${item.title}-${index}`}>
                <span className="status-timeline__dot">{item.state === 'done' ? <Check size={12} /> : null}</span>
                <div><strong>{item.title}</strong><p>{item.note}</p><small>{item.time}</small></div>
              </div>
            ))}
          </div>
        </FormSection>

        {relatedTask ? (
          <FormSection title="关联任务">
            <button className="related-task-card" onClick={() => navigate('task-detail', { taskId: relatedTask.id })}>
              <span><Wrench size={20} /></span>
              <div><strong>{relatedTask.type}</strong><small>{relatedTask.code}</small></div>
              <StatusBadge status={relatedTask.status} />
              <ChevronRight size={18} />
            </button>
          </FormSection>
        ) : null}
      </section>
      {[APPLICATION_STATUS.PENDING, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.CANCELLED].includes(application.status) ? (
        <div className="sticky-actions sticky-actions--single">
          {application.status === APPLICATION_STATUS.PENDING ? <button className="button button--danger-outline button--block" onClick={withdraw}>撤回申请</button> : (
            <button className="button button--primary button--block" onClick={() => navigate('smart-form')}>重新发起</button>
          )}
        </div>
      ) : null}
    </div>
  )
}

function TaskDetailScreen({ route, tasks, navigate, goBack, performTaskAction }) {
  const task = tasks.find((item) => item.id === route.params.taskId)
  if (!task) return <NotFound onBack={goBack} />
  const steps = [
    TASK_STATUS.PENDING_ACCEPTANCE,
    TASK_STATUS.ACCEPTED,
    TASK_STATUS.IN_PROGRESS,
    TASK_STATUS.COMPLETED,
  ]
  const currentIndex = steps.indexOf(task.status)
  return (
    <div className={`page page--plain ${task.status !== TASK_STATUS.COMPLETED ? 'page--with-actions' : ''}`}>
      <TopBar title="任务详情" onBack={goBack} />
      <section className="page-body detail-page task-detail-page">
        <div className="task-stepper">
          {steps.map((step, index) => (
            <div className={`${index <= currentIndex ? 'is-done' : ''} ${index === currentIndex ? 'is-current' : ''}`} key={step}>
              <span>{index < currentIndex ? <Check size={13} /> : index + 1}</span>
              <small>{statusMeta[step].label}</small>
            </div>
          ))}
        </div>
        {task.overdue ? <div className="overdue-alert"><AlertTriangle size={18} /><span>任务{task.overdueText}，请尽快处理</span></div> : null}

        <FormSection title="任务信息">
          <dl className="readonly-list">
            <div><dt>工单编号</dt><dd>{task.code}</dd></div>
            <div><dt>任务类型</dt><dd>{task.type}</dd></div>
            <div><dt>客户名称</dt><dd>{task.customer}</dd></div>
            <div><dt>联系电话</dt><dd className="link-text"><Phone size={14} />{task.phone}</dd></div>
            <div><dt>客户地址</dt><dd>{task.address}</dd></div>
            <div><dt>期望完成</dt><dd>{task.expectedAt}</dd></div>
            <div><dt>创建时间</dt><dd>{task.createdAt}</dd></div>
          </dl>
        </FormSection>

        <FormSection title="物料需求">
          <div className="material-summary">{task.materials.map((item) => <span key={item}><Package size={16} />{item}</span>)}</div>
        </FormSection>

        {task.status === TASK_STATUS.COMPLETED && task.feedback ? (
          <FormSection title="完工反馈">
            <dl className="readonly-list">
              <div><dt>实际用料</dt><dd>{task.feedback.material}</dd></div>
              <div><dt>完工备注</dt><dd>{task.feedback.note}</dd></div>
              <div><dt>完成时间</dt><dd>{task.completedAt}</dd></div>
            </dl>
            {task.feedback.signature ? <img className="signature-preview" src={task.feedback.signature} alt="客户签名" /> : null}
          </FormSection>
        ) : null}
      </section>
      {task.status !== TASK_STATUS.COMPLETED ? (
        <div className="sticky-actions sticky-actions--single">
          <button className="button button--primary button--block" onClick={() => performTaskAction(task)}>
            {task.status === TASK_STATUS.PENDING_ACCEPTANCE ? <CheckCircle2 size={18} /> : task.status === TASK_STATUS.ACCEPTED ? <Play size={18} /> : <FileCheck2 size={18} />}
            {taskActionMeta[task.status].label}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function TaskFeedbackScreen({ route, tasks, updateTask, navigate, goBack, notify }) {
  const task = tasks.find((item) => item.id === route.params.taskId)
  const [material, setMaterial] = useState('')
  const [note, setNote] = useState('')
  const [images, setImages] = useState([])
  const [signature, setSignature] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  if (!task) return <NotFound onBack={goBack} />

  const submit = async () => {
    const nextErrors = {}
    if (!material.trim()) nextErrors.material = '请填写实际用料'
    if (!note.trim()) nextErrors.note = '请填写完工备注'
    if (!signature) nextErrors.signature = '请客户完成签名'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      notify('请完善完工反馈', 'error')
      return
    }
    setLoading(true)
    try {
      const imageUrls = await Promise.all(images.map(async (image) => {
        if (!image.file) return image.url
        const uploaded = await api.files.upload(image.file, { bizType: 'TASK_FEEDBACK', bizId: task.id })
        return uploaded.fileUrl
      }))
      const signatureBlob = await fetch(signature).then((response) => response.blob())
      const signatureFile = new File([signatureBlob], `signature-${task.id}.png`, { type: 'image/png' })
      const signatureResult = await api.files.upload(signatureFile, { bizType: 'TASK_SIGNATURE', bizId: task.id })
      const result = await api.tasks.complete(task.id, {
        version: task.version,
        actualMaterials: [{ description: material }],
        resultDesc: note,
        imageUrls,
        signatureUrl: signatureResult.fileUrl,
      })
      updateTask(task.id, {
        status: result.status || TASK_STATUS.COMPLETED,
        version: result.version,
        completedAt: '刚刚',
        feedback: { material, note, images: imageUrls, signature: signatureResult.fileUrl },
      })
      notify('完工反馈提交成功')
      navigate('task-detail', { taskId: task.id }, { replace: true })
    } catch (error) {
      notify(error.message || '完工反馈提交失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page--plain page--with-actions">
      <TopBar title="反馈完工" onBack={goBack} />
      <section className="page-body form-page">
        <div className="task-mini-card">
          <span><Wrench size={19} /></span>
          <div><strong>{task.type}</strong><small>{task.code} · {task.address}</small></div>
          <StatusBadge status={TASK_STATUS.IN_PROGRESS} />
        </div>
        <FormSection title="完工信息">
          <TextAreaField label="实际用料" required value={material} onChange={setMaterial} error={errors.material} placeholder="例如：更换光纤 1 根、光猫 1 台" />
          <TextAreaField label="完工备注" required value={note} onChange={setNote} error={errors.note} placeholder="请说明处理结果和现场情况" />
        </FormSection>
        <FormSection title="现场图片">
          <ImageUploader images={images} onChange={setImages} max={3} />
        </FormSection>
        <FormSection title="客户签名">
          <SignaturePad value={signature} onChange={setSignature} />
          {errors.signature ? <span className="field-error">{errors.signature}</span> : null}
        </FormSection>
      </section>
      <div className="sticky-actions sticky-actions--single">
        <LoadingButton className="button button--primary button--block" loading={loading} loadingText="正在提交…" onClick={submit}>提交完工反馈</LoadingButton>
      </div>
    </div>
  )
}

function OpportunitiesScreen({ opportunities, navigate }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const filters = [
    ['all', '全部'],
    [OPPORTUNITY_STATUS.NEW, '新建'],
    [OPPORTUNITY_STATUS.FOLLOWING, '跟进中'],
    [OPPORTUNITY_STATUS.HIGH_INTENT, '高意向'],
    [OPPORTUNITY_STATUS.SIGNED, '已签约'],
    [OPPORTUNITY_STATUS.CLOSED, '已关闭'],
  ]
  const filtered = opportunities.filter((item) =>
    (status === 'all' || item.status === status) &&
    [item.name, item.customer, item.code, opportunityCustomerTypeLabel(item.customerType)]
      .some((value) => String(value || '').includes(query)),
  )
  return (
    <div className="page page--plain">
      <TopBar title="商机管理" action={<button className="text-button" onClick={() => navigate('opportunity-form')}>新建</button>} />
      <div className="search-wrap"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索客户、商机名称或编号" /></div>
      <div className="filter-tabs filter-tabs--scroll">
        {filters.map(([id, label]) => <button key={id} className={status === id ? 'is-active' : ''} onClick={() => setStatus(id)}>{label}</button>)}
      </div>
      <section className="page-body opportunities-page">
        <div className="result-count">共 {filtered.length} 个商机</div>
        <div className="card-list">
          {filtered.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} onOpen={() => navigate('opportunity-detail', { opportunityId: opportunity.id })} />)}
          {!filtered.length ? <EmptyState icon={BriefcaseBusiness} title="还没有商机" description="当前账号创建的商机会显示在这里" action="新建商机" onAction={() => navigate('opportunity-form')} /> : null}
        </div>
      </section>
    </div>
  )
}

function OpportunityDetailScreen({ user, route, opportunities, setOpportunities, navigate, goBack, notify }) {
  const opportunity = opportunities.find((item) => item.id === route.params.opportunityId)
  const [adding, setAdding] = useState(false)
  const [content, setContent] = useState('')
  const [nextContact, setNextContact] = useState('')
  if (!opportunity) return <NotFound onBack={goBack} />
  const signedNeedsMaintainer = isSignedMaintainerOpportunity(opportunity)

  const addFollow = async () => {
    if (!content.trim()) {
      notify('请填写跟进内容', 'error')
      return
    }
    try {
      await api.opportunities.update(opportunity.id, {
        status: opportunity.status,
        nextContactTime: toContractDateTime(nextContact),
        followUp: { content },
      })
      const follow = { id: crypto.randomUUID(), time: '刚刚', content, owner: user.name }
      setOpportunities((items) => items.map((item) =>
        item.id === opportunity.id
          ? { ...item, follows: [follow, ...item.follows], lastFollowAt: '刚刚', nextContact: nextContact || item.nextContact }
          : item,
      ))
      setContent('')
      setNextContact('')
      setAdding(false)
      notify('跟进记录已保存')
    } catch (error) {
      notify(error.message || '跟进记录保存失败', 'error')
    }
  }

  return (
    <div className="page page--plain page--with-actions">
      <TopBar title="商机详情" onBack={goBack} action={<button className="text-button" onClick={() => navigate('opportunity-form', { opportunityId: opportunity.id })}>编辑</button>} />
      <section className="page-body detail-page opportunity-detail-page">
        <div className="opportunity-hero-card">
          <div><span>{opportunity.customer}</span><h2>{opportunity.name}</h2><small>{opportunity.code}</small></div>
          <StatusBadge status={opportunity.status} />
          <div className="opportunity-hero-card__metrics">
            <span><small>意向等级</small><strong className={`level level--${opportunity.level.toLowerCase()}`}>{opportunity.level}</strong></span>
            <span><small>预计金额</small><strong>¥ {opportunity.amount.toLocaleString()}</strong></span>
            <span><small>客户类型</small><strong>{opportunityCustomerTypeLabel(opportunity.customerType)}</strong></span>
            <span><small>装维需求</small><strong>{opportunity.needMaintainer ? '需要' : '无需'}</strong></span>
          </div>
        </div>
        {signedNeedsMaintainer ? (
          <div className="opportunity-dispatch-note">
            <Wrench size={16} />
            <span>已签约且需要装维，后续需进入派单流程。</span>
          </div>
        ) : null}
        <FormSection title="基本信息">
          <dl className="readonly-list">
            <div><dt>负责人</dt><dd>{opportunity.owner}</dd></div>
            <div><dt>客户类型</dt><dd>{opportunityCustomerTypeLabel(opportunity.customerType)}</dd></div>
            <div><dt>装维需求</dt><dd>{opportunityMaintainerLabel(opportunity.needMaintainer)}</dd></div>
            <div><dt>下次联系</dt><dd>{opportunity.nextContact}</dd></div>
            <div><dt>最近跟进</dt><dd>{opportunity.lastFollowAt}</dd></div>
            <div><dt>创建时间</dt><dd>{opportunity.createdAt}</dd></div>
            {signedNeedsMaintainer ? <div><dt>派单状态</dt><dd>待派单</dd></div> : null}
            <div className="readonly-list__wide"><dt>商机描述</dt><dd>{opportunity.description}</dd></div>
          </dl>
        </FormSection>
        <FormSection title="跟进记录" action={<button className="text-button" onClick={() => setAdding((value) => !value)}><Plus size={15} />添加跟进</button>}>
          {adding ? (
            <div className="inline-follow-form">
              <TextAreaField label="跟进内容" required value={content} onChange={setContent} placeholder="记录本次沟通情况" />
              <TextField label="下次联系时间" value={nextContact} onChange={setNextContact} type="datetime-local" />
              <div><button className="button button--ghost button--small" onClick={() => setAdding(false)}>取消</button><button className="button button--primary button--small" onClick={addFollow}>保存跟进</button></div>
            </div>
          ) : null}
          {opportunity.follows.length ? (
            <div className="follow-timeline">
              {opportunity.follows.map((follow) => (
                <div key={follow.id}><span /><article><strong>{follow.time}</strong><p>{follow.content}</p><small>{follow.owner}</small></article></div>
              ))}
            </div>
          ) : <EmptyState icon={MessageCircleMore} title="暂无跟进记录" description="添加第一次客户跟进" />}
        </FormSection>
      </section>
      <div className="sticky-actions sticky-actions--single">
        <button className="button button--primary button--block" onClick={() => setAdding(true)}><PenLine size={17} />添加跟进</button>
      </div>
    </div>
  )
}

function OpportunityFormScreen({ user, route, opportunities, addOpportunity, navigate, goBack, notify }) {
  const existing = opportunities.find((item) => item.id === route.params.opportunityId)
  const [customer, setCustomer] = useState(existing?.customer || '')
  const [customerType, setCustomerType] = useState(existing?.customerType || CUSTOMER_TYPE.PUBLIC)
  const [name, setName] = useState(existing?.name || '')
  const [level, setLevel] = useState(existing?.level || 'B')
  const [amount, setAmount] = useState(existing?.amount || '')
  const [status, setStatus] = useState(existing?.status || OPPORTUNITY_STATUS.NEW)
  const [needMaintainer, setNeedMaintainer] = useState(Boolean(existing?.needMaintainer))
  const [nextContact, setNextContact] = useState('')
  const [description, setDescription] = useState(existing?.description || '')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    if (!customer.trim() || !name.trim() || amount === '' || Number(amount) < 0) {
      notify('请完善客户、商机名称和预计金额', 'error')
      return
    }
    setLoading(true)
    try {
      const payload = {
        customerName: customer,
        customerType,
        title: name,
        intentLevel: level === 'A' ? 'HIGH' : level === 'B' ? 'MEDIUM' : 'LOW',
        estimatedAmount: Math.round(Number(amount) * 100),
        status,
        needMaintainer,
        nextContactTime: toContractDateTime(nextContact),
        description,
      }
      const result = existing
        ? await api.opportunities.update(existing.id, payload)
        : await api.opportunities.create(payload)
      const statusName = statusMeta[status]?.label || status
      const opportunity = {
        id: String(result.id || existing?.id || `OPP-${Date.now()}`),
        code: result.opportunityNo || existing?.code || `SJ${Date.now().toString().slice(-11)}`,
        customer,
        customerType,
        name,
        level,
        amount: Number(amount),
        status,
        statusName,
        needMaintainer,
        nextContact: nextContact || existing?.nextContact || '待设置',
        ownerId: existing?.ownerId || user.id,
        ownerJobNo: existing?.ownerJobNo || user.jobNo,
        ownerRoleCode: existing?.ownerRoleCode || user.roleCode,
        owner: existing?.owner || user.name,
        createdAt: existing?.createdAt || '刚刚',
        lastFollowAt: existing?.lastFollowAt || '暂无',
        description,
        follows: existing?.follows || [],
      }
      addOpportunity(opportunity)
      notify(existing ? '商机已更新' : '商机创建成功')
      navigate('opportunity-detail', { opportunityId: opportunity.id }, { replace: true })
    } catch (error) {
      notify(error.message || '商机保存失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page--plain page--with-actions">
      <TopBar title={existing ? '编辑商机' : '新建商机'} onBack={goBack} />
      <section className="page-body form-page">
        <FormSection title="基本信息">
          <div className="field">
            <span className="field__label">客户类型 <i>*</i></span>
            <div className="segmented-control">
              {[
                [CUSTOMER_TYPE.PUBLIC, '公众'],
                [CUSTOMER_TYPE.ENTERPRISE, '政企'],
              ].map(([value, label]) => <button key={value} className={customerType === value ? 'is-active' : ''} onClick={() => setCustomerType(value)}>{label}</button>)}
            </div>
          </div>
          <TextField label="客户名称" required value={customer} onChange={setCustomer} placeholder="搜索或输入客户名称" />
          <TextField label="商机名称" required value={name} onChange={setName} placeholder="请输入商机名称" />
          <div className="field">
            <span className="field__label">意向等级 <i>*</i></span>
            <div className="segmented-control">
              {['A', 'B', 'C'].map((item) => <button key={item} className={level === item ? 'is-active' : ''} onClick={() => setLevel(item)}>{item}</button>)}
            </div>
          </div>
          <TextField label="预计金额（元）" required value={amount} onChange={setAmount} placeholder="请输入金额" type="number" />
          <label className="field"><span className="field__label">商机状态 <i>*</i></span><select className="form-input" value={status} onChange={(event) => setStatus(event.target.value)}><option value={OPPORTUNITY_STATUS.NEW}>新建</option><option value={OPPORTUNITY_STATUS.FOLLOWING}>跟进中</option><option value={OPPORTUNITY_STATUS.HIGH_INTENT}>高意向</option><option value={OPPORTUNITY_STATUS.SIGNED}>已签约</option><option value={OPPORTUNITY_STATUS.CLOSED}>已关闭</option></select></label>
        </FormSection>
        <FormSection title="装维需求">
          <label className="toggle-row">
            <span><strong>是否需要装维</strong><small>已签约且需要装维的商机会进入后续派单准备</small></span>
            <input type="checkbox" checked={needMaintainer} onChange={(event) => setNeedMaintainer(event.target.checked)} />
            <i />
          </label>
          {status === OPPORTUNITY_STATUS.SIGNED && needMaintainer ? <span className="field-help">保存后请在后台派单流程中继续安排装维执行人。</span> : null}
        </FormSection>
        <FormSection title="跟进计划">
          <TextField label="下次联系时间" value={nextContact} onChange={setNextContact} type="datetime-local" />
          <TextAreaField label="商机描述" value={description} onChange={setDescription} placeholder="补充客户需求和商机背景" />
        </FormSection>
      </section>
      <div className="sticky-actions sticky-actions--single">
        <LoadingButton className="button button--primary button--block" loading={loading} loadingText="保存中…" onClick={save}>保存商机</LoadingButton>
      </div>
    </div>
  )
}

function SupportFormScreen({ user, addApplication, navigate, goBack, notify }) {
  const [customer, setCustomer] = useState('')
  const [type, setType] = useState('技术支撑')
  const [description, setDescription] = useState('')
  const [expectedAt, setExpectedAt] = useState('')
  const [urgency, setUrgency] = useState('普通')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!customer.trim() || !description.trim()) {
      notify('请填写关联客户和需求描述', 'error')
      return
    }
    setLoading(true)
    try {
      const result = await api.applications.create({
        type: APPLICATION_TYPE.SUPPORT,
        title: `${customer} ${type}`,
        content: description,
        extra: {
          customerName: customer,
          supportType: type === '技术支撑' ? 'TECHNICAL' : 'SOLUTION',
          expectedTime: toContractDateTime(expectedAt),
          urgency: urgency === '紧急' ? 'URGENT' : 'NORMAL',
        },
      })
      const id = String(result.id || `APP-${Date.now()}`)
      addApplication({
        id,
        code: result.appNo || `SQ${Date.now().toString().slice(-12)}`,
        type: APPLICATION_TYPE.SUPPORT,
        typeName: '支撑申请',
        title: `${customer} ${type}`,
        submittedAt: '刚刚',
        status: APPLICATION_STATUS.PENDING,
        statusName: '待审批',
        applicantRoleCode: user.roleCode,
        applicantName: user.name,
        fields: [['关联客户', customer], ['支撑类型', type], ['需求描述', description], ['期望时间', expectedAt || '待协调'], ['紧急程度', urgency]],
        timeline: [{ title: '申请已提交', time: '刚刚', note: '等待后台分派', state: 'current' }],
      })
      notify('支撑申请提交成功')
      navigate('application-detail', { applicationId: id })
    } catch (error) {
      notify(error.message || '支撑申请提交失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page--plain page--with-actions">
      <TopBar title="快速支撑" onBack={goBack} />
      <section className="page-body form-page">
        <div className="info-callout"><Headphones size={19} /><p>提交后由后台分派相关人员，你可以在“我的申请”中查看进度。</p></div>
        <FormSection title="支撑需求">
          <TextField label="关联客户" required value={customer} onChange={setCustomer} placeholder="搜索或输入客户名称" />
          <div className="field"><span className="field__label">支撑类型 <i>*</i></span><div className="segmented-control">{['技术支撑', '方案支撑'].map((item) => <button key={item} className={type === item ? 'is-active' : ''} onClick={() => setType(item)}>{item}</button>)}</div></div>
          <TextAreaField label="需求描述" required value={description} onChange={setDescription} placeholder="请详细描述客户需求和需要解决的问题" />
          <TextField label="期望时间" value={expectedAt} onChange={setExpectedAt} type="datetime-local" />
          <div className="field"><span className="field__label">紧急程度</span><div className="segmented-control">{['普通', '紧急'].map((item) => <button key={item} className={urgency === item ? 'is-active' : ''} onClick={() => setUrgency(item)}>{item}</button>)}</div></div>
        </FormSection>
      </section>
      <div className="sticky-actions sticky-actions--single">
        <LoadingButton className="button button--primary button--block" loading={loading} loadingText="提交中…" onClick={submit}>提交支撑申请</LoadingButton>
      </div>
    </div>
  )
}

function ProfileScreen({ user, goBack }) {
  return (
    <div className="page page--plain">
      <TopBar title="个人资料" onBack={goBack} />
      <section className="page-body profile-page">
        <div className="profile-page__hero">
          <div className="avatar avatar--large">{user.name.slice(-1)}</div>
          <h2>{user.name}</h2>
          <StatusBadge status={APPLICATION_STATUS.APPROVED} label={user.roleName} />
        </div>
        <FormSection title="基础信息">
          <dl className="readonly-list">
            <div><dt>姓名</dt><dd>{user.name}</dd></div>
            <div><dt>工号</dt><dd>{user.jobNo}</dd></div>
            <div><dt>角色</dt><dd>{user.roleName}</dd></div>
            <div><dt>所属部门</dt><dd>{user.department}</dd></div>
          </dl>
        </FormSection>
        <FormSection title={isMaintainer(user) ? '技能标签' : '负责客户'} action={<span className="demo-tag">演示数据</span>}>
          {isMaintainer(user) ? <div className="skill-tags">{user.skills.map((item) => <span key={item}>{item}</span>)}</div> : <div className="customer-list">{user.customers.map((item) => <div key={item}><Building2 size={17} /><span>{item}</span></div>)}</div>}
        </FormSection>
        <div className="info-callout info-callout--neutral"><ShieldCheck size={18} /><p>个人资料由企业统一维护，当前版本暂不支持编辑。</p></div>
      </section>
    </div>
  )
}

function NotFound({ onBack }) {
  return (
    <div className="page page--plain">
      <TopBar title="内容不可用" onBack={onBack} />
      <section className="page-body centered-state">
        <EmptyState icon={AlertTriangle} title="内容已删除或不可用" description="请返回上一页刷新后重试" action="返回" onAction={onBack} />
      </section>
    </div>
  )
}

export default App
