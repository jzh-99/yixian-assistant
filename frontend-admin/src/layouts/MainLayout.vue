<template>
  <a-layout style="min-height: 100vh">
    <!-- 左侧菜单 -->
    <a-layout-sider v-model:collapsed="collapsed" collapsible width="220">
      <div class="logo">{{ collapsed ? '翼线' : '翼线助手后台' }}</div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="onMenuClick"
      >
        <a-menu-item key="/dashboard">
          <dashboard-outlined />
          <span>首页</span>
        </a-menu-item>

        <a-menu-item key="/approval">
          <audit-outlined />
          <span>审批中心</span>
        </a-menu-item>

        <a-menu-item key="/dispatch">
          <deployment-unit-outlined />
          <span>派单中心</span>
        </a-menu-item>

        <a-menu-item key="/users">
          <team-outlined />
          <span>人员管理</span>
        </a-menu-item>

        <a-menu-item key="/monitor">
          <fund-outlined />
          <span>三色看板</span>
        </a-menu-item>

        <a-sub-menu key="stats">
          <template #title>
            <bar-chart-outlined />
            <span>统计看板</span>
          </template>
          <a-menu-item key="/stats/maintenance">装维统计</a-menu-item>
          <a-menu-item key="/stats/visit">拜访商机</a-menu-item>
        </a-sub-menu>

        <a-sub-menu key="system">
          <template #title>
            <setting-outlined />
            <span>系统设置</span>
          </template>
          <a-menu-item key="/system/dict">字典管理</a-menu-item>
          <a-menu-item key="/system/skill">技能标签</a-menu-item>
          <a-menu-item key="/system/log">操作日志</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <!-- 顶部栏 -->
      <a-layout-header style="background:#fff; padding:0 24px; display:flex; align-items:center; justify-content:space-between;">
        <span style="font-size:16px; font-weight:500;">翼线助手后台管理系统</span>
        <a-dropdown>
          <a-space>
            <a-avatar style="background:#1677ff">{{ userInitial }}</a-avatar>
            <span>{{ auth.userInfo?.realName }}</span>
          </a-space>
          <template #overlay>
            <a-menu>
              <a-menu-item key="logout" @click="auth.logout(); $router.push('/login')">
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content style="margin:24px; background:#fff; padding:24px; min-height:280px;">
        <router-view />
      </a-layout-content>
    </a-layout>

    <!-- AI④ 悬浮按钮（6号实现） -->
    <div class="ai-fab" @click="aiBrainVisible = true">
      <robot-outlined style="font-size:22px; color:#fff" />
    </div>
    <AiBrainDrawer v-model:open="aiBrainVisible" />
  </a-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AiBrainDrawer from '@/components/AiBrainDrawer.vue'
import {
  DashboardOutlined, AuditOutlined, DeploymentUnitOutlined,
  TeamOutlined, FundOutlined, BarChartOutlined,
  SettingOutlined, RobotOutlined
} from '@ant-design/icons-vue'

const auth       = useAuthStore()
const route      = useRoute()
const router     = useRouter()
const collapsed  = ref(false)
const aiBrainVisible = ref(false)

const selectedKeys = ref([route.path])
watch(() => route.path, p => { selectedKeys.value = [p] })

const userInitial = computed(() => auth.userInfo?.realName?.[0] || '?')

function onMenuClick({ key }) {
  router.push(key)
}
</script>

<style scoped>
.logo {
  height: 56px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  margin: 4px;
  border-radius: 6px;
}
.ai-fab {
  position: fixed;
  right: 32px;
  bottom: 48px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #1677ff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(22,119,255,0.4);
  z-index: 999;
  transition: transform .2s;
}
.ai-fab:hover { transform: scale(1.1); }
</style>
