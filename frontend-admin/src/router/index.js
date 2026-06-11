import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      // 首页
      { path: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '首页' } },

      // 2号：审批中心
      { path: 'approval', component: () => import('@/views/approval/ApprovalList.vue'), meta: { title: '审批中心' } },
      { path: 'approval/:id', component: () => import('@/views/approval/ApprovalDetail.vue'), meta: { title: '审批详情' } },

      // 4号：派单中心 / 人员技能
      { path: 'dispatch', component: () => import('@/views/dispatch/DispatchList.vue'), meta: { title: '派单中心' } },
      { path: 'users',    component: () => import('@/views/users/UserList.vue'),        meta: { title: '人员管理' } },

      // 5号：任务监控 / 统计看板
      { path: 'monitor',  component: () => import('@/views/monitor/ThreeColorBoard.vue'), meta: { title: '三色看板' } },
      { path: 'stats/maintenance', component: () => import('@/views/stats/MaintenanceStats.vue'), meta: { title: '装维统计' } },
      { path: 'stats/visit',       component: () => import('@/views/stats/VisitStats.vue'),       meta: { title: '拜访商机统计' } },

      // 6号：系统设置 / AI智脑
      { path: 'system/dict',  component: () => import('@/views/system/DictManage.vue'),  meta: { title: '字典管理' } },
      { path: 'system/skill', component: () => import('@/views/system/SkillManage.vue'), meta: { title: '技能标签' } },
      { path: 'system/log',   component: () => import('@/views/system/OperationLog.vue'),meta: { title: '操作日志' } },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局导航守卫
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn()) {
    return '/login'
  }
  if (to.path === '/login' && auth.isLoggedIn()) {
    return '/'
  }
})

export default router
