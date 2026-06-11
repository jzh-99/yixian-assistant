<template>
  <div class="page">
    <div class="page-header">
      <div><p class="page-kicker">统计分析</p><h1>装维效率看板</h1><p>统一查看工单完成率、处理时长、超时风险与人员负载。</p></div>
      <div class="page-actions"><el-button :icon="Download" @click="ElMessage.info('导出能力将在后续版本开放')">导出报表</el-button></div>
    </div>

    <div class="analytics-filters">
      <el-segmented v-model="period" :options="['今日', '本周']" />
      <el-select v-model="dept" placeholder="组织范围" style="width: 190px"><el-option label="全部授权组织" value="all" /><el-option v-for="item in departments" :key="item" :label="item" :value="item" /></el-select>
      <el-select v-model="taskType" placeholder="任务类型" clearable style="width: 150px"><el-option v-for="item in taskTypes" :key="item" :label="item" :value="item" /></el-select>
      <span class="analytics-update"><CircleCheck /> 数据更新于 10:35</span>
      <el-popover placement="bottom-end" title="指标口径" width="360" trigger="click">
        <p class="metric-note">完成率按“期望完成时间落在统计期内”的任务计算，排除已取消任务；平均处理时长排除时间缺失和异常负值。</p>
        <template #reference><el-button text :icon="InfoFilled">口径说明</el-button></template>
      </el-popover>
    </div>

    <section class="stats-grid analytics-stats">
      <StatCard label="工单完成率" value="88.6" unit="%" trend="+4.6%" note="较上周同期" color="#10b981" :icon="CircleCheck" trend-class="positive" />
      <StatCard label="平均处理时长" value="2.4" unit="小时" trend="-0.3 小时" note="较上周更快" color="#2563eb" :icon="Timer" trend-class="positive" />
      <StatCard label="超时工单率" value="7.1" unit="%" trend="-1.8%" note="较上周下降" color="#ef4444" :icon="WarningFilled" trend-class="positive" />
      <StatCard label="本周已完成" :value="metricSnapshot.weeklyCompleted" unit="单" trend="+12 单" note="较上周同期" color="#8b5cf6" :icon="Finished" />
    </section>

    <div class="dashboard-grid analytics-grid">
      <section class="panel span-8">
        <div class="panel-header"><div><h2>工单完成趋势</h2><p>本周新增、应完成与实际完成任务</p></div><el-tag effect="plain">单位：单</el-tag></div>
        <EChart :option="completionOption" height="320px" />
      </section>
      <section class="panel span-4">
        <div class="panel-header"><div><h2>任务状态分布</h2><p>当前组织范围</p></div></div>
        <EChart :option="statusOption" height="250px" />
        <div class="donut-total"><strong>{{ state.tasks.length }}</strong><span>明细样本</span></div>
      </section>
      <section class="panel span-6">
        <div class="panel-header"><div><h2>个人完成排行</h2><p>按完成任务数降序</p></div><el-segmented v-model="rankMode" :options="['前5名', '后5名']" size="small" /></div>
        <EChart :option="rankOption" height="310px" />
      </section>
      <section class="panel span-6">
        <div class="panel-header"><div><h2>技能标签负载</h2><p>当前未完成任务按主要技能聚合</p></div></div>
        <EChart :option="skillOption" height="310px" />
      </section>
      <section class="panel span-12">
        <div class="panel-header"><div><h2>人员效率明细</h2><p>核心指标与任务穿透保持同一统计口径</p></div><el-button text type="primary" @click="detailVisible = true">查看任务明细</el-button></div>
        <el-table :data="personStats" class="compact-table">
          <el-table-column type="index" label="排名" width="70" />
          <el-table-column prop="name" label="人员" min-width="130"><template #default="{ row }"><div class="person-cell mini"><span>{{ row.name.slice(0, 1) }}</span><div><strong>{{ row.name }}</strong><small>{{ row.dept }}</small></div></div></template></el-table-column>
          <el-table-column prop="completed" label="完成工单" width="110" sortable />
          <el-table-column prop="rate" label="完成率" width="140"><template #default="{ row }"><div class="rate-cell"><el-progress :percentage="row.rate" :stroke-width="7" /><strong>{{ row.rate }}%</strong></div></template></el-table-column>
          <el-table-column prop="duration" label="平均处理时长" width="145"><template #default="{ row }">{{ row.duration }} 小时</template></el-table-column>
          <el-table-column prop="overdue" label="超时工单" width="110"><template #default="{ row }"><span :class="{ 'danger-text': row.overdue > 1 }">{{ row.overdue }}</span></template></el-table-column>
          <el-table-column prop="current" label="当前负载" width="110" />
          <el-table-column label="趋势" width="100"><template #default="{ row }"><span :class="row.delta >= 0 ? 'positive' : 'danger-text'">{{ row.delta >= 0 ? '↑' : '↓' }} {{ Math.abs(row.delta) }}%</span></template></el-table-column>
        </el-table>
      </section>
    </div>

    <el-drawer v-model="detailVisible" title="效率指标任务明细" size="720px">
      <el-alert title="当前明细继承“本周 / 全部授权组织 / 全部任务类型”筛选条件" type="info" show-icon :closable="false" />
      <el-table :data="state.tasks" style="margin-top: 16px"><el-table-column prop="taskNo" label="任务号" min-width="178" /><el-table-column prop="assignee" label="人员" width="100" /><el-table-column prop="type" label="类型" width="100" /><el-table-column prop="expectedFinishTime" label="期望完成" width="170" /><el-table-column label="状态" width="110"><template #default="{ row }"><StatusTag :value="row.status" /></template></el-table-column></el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { CircleCheck, Download, Finished, InfoFilled, Timer, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import EChart from '../components/EChart.vue'
import StatCard from '../components/StatCard.vue'
import StatusTag from '../components/StatusTag.vue'
import { metricSnapshot, state } from '../services/mockStore'

const period = ref('本周')
const dept = ref('all')
const taskType = ref('')
const rankMode = ref('前5名')
const detailVisible = ref(false)
const departments = [...new Set(state.tasks.map((item) => item.dept))]
const taskTypes = [...new Set(state.tasks.map((item) => item.type))]
const personStats = [
  { name: '李明', dept: '鼓楼分局', completed: 18, rate: 95, duration: 1.9, overdue: 0, current: '2 / 5', delta: 8 },
  { name: '周杰', dept: '江宁分局', completed: 16, rate: 92, duration: 2.1, overdue: 1, current: '1 / 3', delta: 5 },
  { name: '孙强', dept: '鼓楼分局', completed: 14, rate: 88, duration: 2.4, overdue: 1, current: '1 / 4', delta: 2 },
  { name: '刘洋', dept: '玄武分局', completed: 12, rate: 82, duration: 3.2, overdue: 3, current: '3 / 5', delta: -4 },
  { name: '顾伟', dept: '省政企部', completed: 10, rate: 91, duration: 2.8, overdue: 1, current: '2 / 4', delta: 3 },
]
const completionOption = computed(() => ({
  tooltip: { trigger: 'axis' }, legend: { data: ['新增任务', '应完成', '实际完成'], top: 0, right: 6 },
  grid: { left: 18, right: 20, top: 50, bottom: 10, containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], axisLine: { lineStyle: { color: '#e2e8f0' } } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef2f7' } } },
  series: [
    { name: '新增任务', type: 'bar', data: [18, 22, 19, 26, 23, 16, 12], barMaxWidth: 18, itemStyle: { color: '#bfdbfe', borderRadius: [4, 4, 0, 0] } },
    { name: '应完成', type: 'line', smooth: true, data: [16, 20, 18, 23, 21, 15, 12], lineStyle: { width: 2, color: '#f59e0b' }, itemStyle: { color: '#f59e0b' } },
    { name: '实际完成', type: 'line', smooth: true, data: [15, 18, 17, 21, 20, 14, 11], lineStyle: { width: 3, color: '#10b981' }, itemStyle: { color: '#10b981' } },
  ],
}))
const statusOption = computed(() => ({
  tooltip: { trigger: 'item' }, legend: { bottom: 0, icon: 'circle' },
  series: [{ type: 'pie', radius: ['48%', '72%'], center: ['50%', '44%'], label: { show: false }, data: [
    { value: state.tasks.filter((item) => item.status === 'COMPLETED').length, name: '已完成', itemStyle: { color: '#10b981' } },
    { value: state.tasks.filter((item) => item.status === 'IN_PROGRESS').length, name: '进行中', itemStyle: { color: '#2563eb' } },
    { value: state.tasks.filter((item) => item.status === 'PENDING_ACCEPTANCE' || item.status === 'ACCEPTED').length, name: '待执行', itemStyle: { color: '#f59e0b' } },
    { value: state.tasks.filter((item) => item.status === 'UNASSIGNED').length, name: '待派单', itemStyle: { color: '#94a3b8' } },
  ] }],
}))
const rankOption = computed(() => ({
  grid: { left: 10, right: 28, top: 10, bottom: 10, containLabel: true },
  xAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef2f7' } } },
  yAxis: { type: 'category', inverse: true, data: (rankMode.value === '前5名' ? personStats : [...personStats].reverse()).map((item) => item.name), axisLine: { show: false }, axisTick: { show: false } },
  series: [{ type: 'bar', data: (rankMode.value === '前5名' ? personStats : [...personStats].reverse()).map((item) => item.completed), barWidth: 18, label: { show: true, position: 'right', formatter: '{c} 单', color: '#475569' }, itemStyle: { color: '#3b82f6', borderRadius: [0, 8, 8, 0] } }],
}))
const skillOption = computed(() => ({
  tooltip: { trigger: 'axis' }, legend: { data: ['待接单', '进行中'], top: 0, right: 8 },
  grid: { left: 10, right: 22, top: 42, bottom: 8, containLabel: true },
  xAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef2f7' } } },
  yAxis: { type: 'category', data: ['宽带', '光猫', '线路抢修', '政企', '5G 专网'], axisLine: { show: false }, axisTick: { show: false } },
  series: [
    { name: '待接单', type: 'bar', stack: 'total', data: [4, 3, 2, 2, 1], itemStyle: { color: '#93c5fd' }, barWidth: 18 },
    { name: '进行中', type: 'bar', stack: 'total', data: [3, 2, 3, 2, 2], itemStyle: { color: '#2563eb', borderRadius: [0, 7, 7, 0] } },
  ],
}))
</script>
