<template>
  <div class="page">
    <div class="page-header">
      <div>
        <p class="page-kicker">2026年6月11日 · 星期四</p>
        <h1>早上好，{{ session.user?.realName }}</h1>
        <p>这里是当前运营态势，优先处理超时审批和红色任务。</p>
      </div>
      <div class="page-actions">
        <el-button :icon="Refresh" @click="refresh">刷新数据</el-button>
        <el-button type="primary" :icon="MagicStick" @click="router.push('/approvals')">处理待办</el-button>
      </div>
    </div>

    <div class="scope-strip">
      <div><OfficeBuilding /> 数据范围：<strong>{{ session.user?.dataScope }}</strong></div>
      <span>最近更新：{{ refreshedAt }}</span>
    </div>

    <section class="stats-grid">
      <StatCard label="待审批申请" :value="pendingApplications.length" unit="件" trend="其中 1 件已超时" note="需优先处理" color="#ef4444" :icon="DocumentChecked" clickable @click="router.push('/approvals')" />
      <StatCard label="待派单任务" :value="unassignedTasks.length" unit="单" trend="AI 候选已就绪" note="等待调度确认" color="#f59e0b" :icon="Promotion" clickable @click="router.push('/dispatch')" />
      <StatCard label="进行中任务" :value="activeTasks.length" unit="单" trend="2 单临近或超时" note="当前执行中" color="#2563eb" :icon="Timer" clickable @click="router.push('/monitor')" />
      <StatCard label="本周完成率" :value="completionRate" unit="%" trend="+4.6%" note="较上周同期" color="#10b981" :icon="CircleCheck" trend-class="positive" />
    </section>

    <div class="dashboard-grid">
      <section class="panel span-8">
        <div class="panel-header">
          <div><h2>本周任务趋势</h2><p>新增、完成与超时任务变化</p></div>
          <el-segmented v-model="trendType" :options="['任务量', '完成率']" size="small" />
        </div>
        <EChart :option="trendOption" height="306px" />
      </section>

      <section class="panel span-4">
        <div class="panel-header">
          <div><h2>团队负载</h2><p>当前未完成任务分布</p></div>
          <el-button text type="primary" @click="router.push('/people')">查看人员</el-button>
        </div>
        <EChart :option="loadOption" height="225px" />
        <div class="load-legend">
          <span><i class="red" />高负载 1 人</span>
          <span><i class="yellow" />中负载 2 人</span>
          <span><i class="green" />正常 2 人</span>
        </div>
      </section>

      <section class="panel span-7">
        <div class="panel-header">
          <div><h2>待审批申请</h2><p>来自一线 APP 的最新申请</p></div>
          <el-button text type="primary" @click="router.push('/approvals')">查看全部 <ArrowRight /></el-button>
        </div>
        <el-table :data="pendingApplications.slice(0, 4)" class="compact-table">
          <el-table-column prop="appNo" label="申请单号" min-width="165">
            <template #default="{ row }"><span class="primary-id">{{ row.appNo }}</span></template>
          </el-table-column>
          <el-table-column prop="typeName" label="类型" width="100" />
          <el-table-column prop="applicant" label="申请人" width="90" />
          <el-table-column prop="title" label="申请摘要" min-width="190" show-overflow-tooltip />
          <el-table-column prop="createTime" label="提交时间" width="160" />
          <el-table-column label="状态" width="100"><template #default><StatusTag value="PENDING" /></template></el-table-column>
          <el-table-column label="操作" width="82" fixed="right"><template #default><el-button link type="primary" @click="router.push('/approvals')">处理</el-button></template></el-table-column>
        </el-table>
      </section>

      <section class="panel span-5">
        <div class="panel-header">
          <div><h2>异常任务</h2><p>按风险等级优先展示</p></div>
          <el-button text type="primary" @click="router.push('/monitor')">进入看板</el-button>
        </div>
        <div class="risk-list">
          <button v-for="task in riskTasks" :key="task.id" @click="router.push('/monitor')">
            <span class="risk-marker" :class="warningLevel(task).toLowerCase()" />
            <span class="risk-main"><strong>{{ task.title }}</strong><small>{{ task.taskNo }} · {{ task.assignee || '待派单' }}</small></span>
            <span class="risk-time">{{ warningText(task) }}</span>
            <ArrowRight />
          </button>
          <div v-if="!riskTasks.length" class="simple-empty"><CircleCheck /> 当前没有异常任务</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import {
  ArrowRight, CircleCheck, DocumentChecked, MagicStick, OfficeBuilding, Promotion, Refresh, Timer,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import EChart from '../components/EChart.vue'
import StatCard from '../components/StatCard.vue'
import StatusTag from '../components/StatusTag.vue'
import {
  activeTasks, metricSnapshot, pendingApplications, unassignedTasks, warningLevel, warningText,
} from '../services/mockStore'
import { session } from '../services/session'

const router = useRouter()
const trendType = ref('任务量')
const refreshedAt = ref('10:35')
const completionRate = computed(() => metricSnapshot.weeklyCompletionRate)
const riskTasks = computed(() => activeTasks.value.filter((task) => ['RED', 'YELLOW'].includes(warningLevel(task))).sort((a, b) => warningLevel(a) === 'RED' ? -1 : 1).slice(0, 4))

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: trendType.value === '任务量' ? ['新增任务', '完成任务', '超时任务'] : ['完成率'], top: 4, right: 8, textStyle: { color: '#64748b' } },
  grid: { left: 16, right: 18, top: 52, bottom: 12, containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#64748b' } },
  yAxis: { type: 'value', max: trendType.value === '任务量' ? undefined : 100, axisLabel: { color: '#94a3b8', formatter: trendType.value === '任务量' ? '{value}' : '{value}%' }, splitLine: { lineStyle: { color: '#eef2f7' } } },
  series: trendType.value === '任务量' ? [
    { name: '新增任务', type: 'line', smooth: true, data: [18, 22, 19, 26, 23, 16, 12], symbolSize: 7, lineStyle: { width: 3, color: '#2563eb' }, itemStyle: { color: '#2563eb' }, areaStyle: { color: 'rgba(37,99,235,.08)' } },
    { name: '完成任务', type: 'line', smooth: true, data: [15, 18, 17, 21, 20, 14, 11], symbolSize: 7, lineStyle: { width: 3, color: '#10b981' }, itemStyle: { color: '#10b981' } },
    { name: '超时任务', type: 'bar', barWidth: 10, data: [2, 1, 3, 2, 1, 0, 1], itemStyle: { color: '#fda4af', borderRadius: [5, 5, 0, 0] } },
  ] : [{ name: '完成率', type: 'line', smooth: true, data: [83, 86, 82, 88, 90, 91, 92], lineStyle: { width: 3, color: '#10b981' }, itemStyle: { color: '#10b981' }, areaStyle: { color: 'rgba(16,185,129,.08)' } }],
}))

const loadOption = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie',
    radius: ['58%', '78%'],
    center: ['50%', '48%'],
    label: { show: false },
    data: [
      { value: 1, name: '高负载', itemStyle: { color: '#ef4444' } },
      { value: 2, name: '中负载', itemStyle: { color: '#f59e0b' } },
      { value: 2, name: '正常', itemStyle: { color: '#10b981' } },
    ],
  }],
  graphic: [{ type: 'text', left: 'center', top: '38%', style: { text: '5', fontSize: 32, fontWeight: 700, fill: '#0f172a', textAlign: 'center' } }, { type: 'text', left: 'center', top: '55%', style: { text: '可接单人员', fontSize: 12, fill: '#94a3b8', textAlign: 'center' } }],
}))

function refresh() {
  refreshedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  ElMessage.success('数据已更新')
}
</script>
