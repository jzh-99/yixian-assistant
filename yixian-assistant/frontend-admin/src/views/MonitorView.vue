<template>
  <div class="page">
    <div class="page-header">
      <div><p class="page-kicker">三色晾晒</p><h1>任务监控</h1><p>集中查看已派单未完成任务，快速定位超时、临期和数据异常。</p></div>
      <div class="page-actions"><el-button :icon="Refresh" @click="ElMessage.success('任务状态已与 APP 回传数据同步')">同步状态</el-button></div>
    </div>

    <div class="warning-cards">
      <button :class="{ active: colorFilter === 'RED' }" @click="toggleColor('RED')"><span class="warning-icon red"><WarningFilled /></span><div><small>红色 · 已超时</small><strong>{{ colorCount('RED') }}</strong><span>需要立即干预</span></div><ArrowRight /></button>
      <button :class="{ active: colorFilter === 'YELLOW' }" @click="toggleColor('YELLOW')"><span class="warning-icon yellow"><Timer /></span><div><small>黄色 · 临近到期</small><strong>{{ colorCount('YELLOW') }}</strong><span>4 小时内到期</span></div><ArrowRight /></button>
      <button :class="{ active: colorFilter === 'GREEN' }" @click="toggleColor('GREEN')"><span class="warning-icon green"><CircleCheck /></span><div><small>绿色 · 正常</small><strong>{{ colorCount('GREEN') }}</strong><span>按计划执行</span></div><ArrowRight /></button>
      <button class="unassigned-card" @click="router.push('/dispatch')"><span class="warning-icon blue"><Promotion /></span><div><small>待派单任务</small><strong>{{ unassignedTasks.length }}</strong><span>前往派单中心</span></div><ArrowRight /></button>
    </div>

    <section class="panel table-panel">
      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="任务号 / 标题 / 负责人" :prefix-icon="Search" clearable class="filter-keyword" />
        <el-select v-model="filters.dept" placeholder="所属部门" clearable><el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" /></el-select>
        <el-select v-model="filters.status" placeholder="执行状态" clearable><el-option label="待接单" value="PENDING_ACCEPTANCE" /><el-option label="已接单" value="ACCEPTED" /><el-option label="进行中" value="IN_PROGRESS" /></el-select>
        <el-select v-model="colorFilter" placeholder="预警状态" clearable><el-option label="已超时" value="RED" /><el-option label="临近到期" value="YELLOW" /><el-option label="正常" value="GREEN" /><el-option label="时间缺失" value="GRAY" /></el-select>
        <el-button :icon="RefreshLeft" text @click="clearFilters">清空</el-button>
        <div class="filter-spacer" /><span class="live-indicator"><i /> 准实时数据</span>
      </div>
      <el-table :data="filteredTasks" height="calc(100vh - 450px)" class="data-table monitor-table" row-key="id" @row-click="openDetail">
        <el-table-column label="预警" width="120" fixed><template #default="{ row }"><StatusTag :value="warningLevel(row)" dot /></template></el-table-column>
        <el-table-column prop="taskNo" label="任务号" min-width="182" fixed><template #default="{ row }"><span class="primary-id">{{ row.taskNo }}</span></template></el-table-column>
        <el-table-column prop="type" label="任务类型" width="110" />
        <el-table-column prop="title" label="任务标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="assignee" label="负责人" width="118"><template #default="{ row }"><div class="person-cell mini"><span>{{ row.assignee.slice(0, 1) }}</span><div>{{ row.assignee }}<small>{{ row.dept.replace('南京', '') }}</small></div></div></template></el-table-column>
        <el-table-column prop="expectedFinishTime" label="期望完成" width="170" />
        <el-table-column label="剩余 / 超时" width="150"><template #default="{ row }"><strong :class="`warning-text ${warningLevel(row).toLowerCase()}`">{{ warningText(row) }}</strong></template></el-table-column>
        <el-table-column label="执行状态" width="110"><template #default="{ row }"><StatusTag :value="row.status" /></template></el-table-column>
        <el-table-column label="操作" width="90" fixed="right"><template #default="{ row }"><el-button link type="primary" @click.stop="openDetail(row)">详情</el-button></template></el-table-column>
      </el-table>
      <div class="table-footer"><span>共 {{ filteredTasks.length }} 条监控任务</span><span class="muted">已完成、已取消和待派单任务不进入三色统计</span><el-pagination layout="prev, pager, next" :total="filteredTasks.length" :default-page-size="20" /></div>
    </section>

    <el-drawer v-model="drawerVisible" size="660px" class="detail-drawer" :with-header="false">
      <template v-if="current">
        <div class="drawer-header"><div><p>{{ current.type }} · {{ current.customer }}</p><h2>{{ current.title }}</h2><span>{{ current.taskNo }}</span></div><el-button circle text @click="drawerVisible = false"><Close /></el-button></div>
        <div class="monitor-hero" :class="warningLevel(current).toLowerCase()">
          <div><StatusTag :value="warningLevel(current)" dot /><strong>{{ warningText(current) }}</strong><span>期望完成：{{ current.expectedFinishTime }}</span></div>
          <div><span>当前执行状态</span><StatusTag :value="current.status" /></div>
        </div>
        <div class="entity-summary">
          <div><span>负责人</span><strong>{{ current.assignee }}</strong><small>{{ current.dept }}</small></div>
          <div><span>来源申请</span><strong>{{ current.applicationNo }}</strong><small>{{ current.source }}</small></div>
          <div><span>任务版本</span><strong>V{{ current.version }}</strong><small>乐观锁版本</small></div>
        </div>
        <div class="drawer-section"><h3>服务信息</h3><el-descriptions :column="2" border><el-descriptions-item label="客户">{{ current.customer }}</el-descriptions-item><el-descriptions-item label="任务类型">{{ current.type }}</el-descriptions-item><el-descriptions-item label="服务地址" :span="2">{{ current.address }}</el-descriptions-item><el-descriptions-item label="必需技能" :span="2">{{ current.requiredSkills.join('、') }}</el-descriptions-item></el-descriptions></div>
        <div class="drawer-section"><h3>执行时间线</h3><el-timeline><el-timeline-item v-for="item in current.timeline" :key="item.time" :timestamp="item.time" type="primary"><strong>{{ item.title }}</strong></el-timeline-item><el-timeline-item timestamp="等待 APP 回传下一状态" hollow><span class="muted">接单、开始工作和完工反馈均由执行人 APP 提交</span></el-timeline-item></el-timeline></div>
        <div v-if="canWrite && current.status !== 'COMPLETED'" class="drawer-footer"><span>异常改派必须填写原因并保留审计记录</span><el-button type="primary" plain @click="router.push('/dispatch')">前往改派</el-button></div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ArrowRight, CircleCheck, Close, Promotion, Refresh, RefreshLeft, Search, Timer, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatusTag from '../components/StatusTag.vue'
import { activeTasks, unassignedTasks, warningLevel, warningText } from '../services/mockStore'
import { canWrite } from '../services/session'

const router = useRouter()
const filters = reactive({ keyword: '', dept: '', status: '' })
const colorFilter = ref('')
const drawerVisible = ref(false)
const current = ref(null)
const departments = computed(() => [...new Set(activeTasks.value.map((item) => item.dept))])
const filteredTasks = computed(() => activeTasks.value
  .filter((item) => !filters.keyword || `${item.taskNo}${item.title}${item.assignee}`.includes(filters.keyword))
  .filter((item) => !filters.dept || item.dept === filters.dept)
  .filter((item) => !filters.status || item.status === filters.status)
  .filter((item) => !colorFilter.value || warningLevel(item) === colorFilter.value)
  .sort((a, b) => ['RED', 'YELLOW', 'GREEN', 'GRAY'].indexOf(warningLevel(a)) - ['RED', 'YELLOW', 'GREEN', 'GRAY'].indexOf(warningLevel(b))))
function colorCount(color) { return activeTasks.value.filter((item) => warningLevel(item) === color).length }
function toggleColor(color) { colorFilter.value = colorFilter.value === color ? '' : color }
function clearFilters() { Object.assign(filters, { keyword: '', dept: '', status: '' }); colorFilter.value = '' }
function openDetail(task) { current.value = task; drawerVisible.value = true }
</script>
