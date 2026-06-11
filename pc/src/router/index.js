import { createRouter, createWebHistory } from 'vue-router'
import { session } from '../services/session'
import AdminLayout from '../layouts/AdminLayout.vue'

const LoginView = () => import('../views/LoginView.vue')
const WorkbenchView = () => import('../views/WorkbenchView.vue')
const ApprovalsView = () => import('../views/ApprovalsView.vue')
const PeopleView = () => import('../views/PeopleView.vue')
const DispatchView = () => import('../views/DispatchView.vue')
const MonitorView = () => import('../views/MonitorView.vue')
const EfficiencyView = () => import('../views/EfficiencyView.vue')
const BusinessView = () => import('../views/BusinessView.vue')
const SettingsView = () => import('../views/SettingsView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    {
      path: '/',
      component: AdminLayout,
      redirect: '/workbench',
      children: [
        { path: 'workbench', name: 'workbench', component: WorkbenchView, meta: { title: '运营工作台' } },
        { path: 'approvals', name: 'approvals', component: ApprovalsView, meta: { title: '审批中心' } },
        { path: 'people', name: 'people', component: PeopleView, meta: { title: '人员与技能' } },
        { path: 'dispatch', name: 'dispatch', component: DispatchView, meta: { title: '任务派单' } },
        { path: 'monitor', name: 'monitor', component: MonitorView, meta: { title: '任务监控' } },
        { path: 'efficiency', name: 'efficiency', component: EfficiencyView, meta: { title: '装维效率' } },
        { path: 'business', name: 'business', component: BusinessView, meta: { title: '拜访与商机' } },
        { path: 'settings', name: 'settings', component: SettingsView, meta: { title: '系统设置', superOnly: true } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.public && !session.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && session.user) return { name: 'workbench' }
  if (to.meta.superOnly && session.user?.roleCode !== 'SUPER_ADMIN') return { name: 'workbench' }
  return true
})

export default router
