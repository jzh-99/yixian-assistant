<template>
  <div class="admin-shell" :class="{ 'nav-collapsed': collapsed }">
    <aside class="side-nav">
      <div class="brand">
        <div class="brand-mark">翼</div>
        <div v-show="!collapsed" class="brand-copy">
          <strong>翼线助手</strong>
          <span>运营管理与决策智脑</span>
        </div>
      </div>

      <el-scrollbar class="nav-scroll">
        <el-menu :default-active="route.path" router :collapse="collapsed" :collapse-transition="false">
          <el-menu-item index="/workbench"><el-icon><DataAnalysis /></el-icon><template #title>运营工作台</template></el-menu-item>
          <el-menu-item index="/approvals">
            <el-icon><DocumentChecked /></el-icon><template #title>审批中心</template>
            <span v-if="pendingApplications.length && !collapsed" class="nav-badge">{{ pendingApplications.length }}</span>
          </el-menu-item>
          <el-menu-item index="/people"><el-icon><User /></el-icon><template #title>人员与技能</template></el-menu-item>
          <el-menu-item index="/dispatch">
            <el-icon><Promotion /></el-icon><template #title>任务派单</template>
            <span v-if="unassignedTasks.length && !collapsed" class="nav-badge amber">{{ unassignedTasks.length }}</span>
          </el-menu-item>
          <el-menu-item index="/monitor"><el-icon><Warning /></el-icon><template #title>任务监控</template></el-menu-item>
          <div v-show="!collapsed" class="nav-section">统计分析</div>
          <el-menu-item index="/efficiency"><el-icon><TrendCharts /></el-icon><template #title>装维效率</template></el-menu-item>
          <el-menu-item index="/business"><el-icon><PieChart /></el-icon><template #title>拜访与商机</template></el-menu-item>
          <template v-if="isSuperAdmin">
            <div v-show="!collapsed" class="nav-section">系统治理</div>
            <el-menu-item index="/settings"><el-icon><Setting /></el-icon><template #title>系统设置</template></el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>

      <div class="nav-footer">
        <button @click="collapsed = !collapsed"><el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon><span v-show="!collapsed">收起导航</span></button>
      </div>
    </aside>

    <section class="main-shell">
      <header class="topbar">
        <div class="scope-switch"><OfficeBuilding /><span>{{ session.user?.deptName }}</span><ArrowDown /></div>
        <div class="topbar-actions">
          <el-tooltip content="数据每 5 分钟自动刷新" placement="bottom"><span class="sync-state"><CircleCheck /> 数据已同步</span></el-tooltip>
          <el-button circle text title="帮助"><QuestionFilled /></el-button>
          <el-badge :value="pendingApplications.length" :hidden="!pendingApplications.length">
            <el-button circle text title="通知"><Bell /></el-button>
          </el-badge>
          <el-dropdown trigger="click" @command="handleCommand">
            <button class="user-menu">
              <span class="avatar">{{ session.user?.realName?.slice(0, 1) }}</span>
              <span class="user-copy"><strong>{{ session.user?.realName }}</strong><small>{{ session.user?.roleName }}</small></span>
              <ArrowDown />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>{{ session.user?.dataScope }}</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </section>
    <SmartBrain />
  </div>
</template>

<script setup>
import {
  ArrowDown, Bell, CircleCheck, DataAnalysis, DocumentChecked, Expand, Fold, OfficeBuilding,
  PieChart, Promotion, QuestionFilled, Setting, TrendCharts, User, Warning,
} from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SmartBrain from '../components/SmartBrain.vue'
import { pendingApplications, unassignedTasks } from '../services/mockStore'
import { syncFromAppBackend } from '../services/remoteApi'
import { isSuperAdmin, logout, session } from '../services/session'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)

function handleCommand(command) {
  if (command === 'logout') {
    logout()
    router.push('/login')
  }
}

onMounted(() => {
  syncFromAppBackend().catch((error) => {
    console.warn('APP 数据同步失败，已保留本地演示数据：', error.message)
  })
})
</script>
