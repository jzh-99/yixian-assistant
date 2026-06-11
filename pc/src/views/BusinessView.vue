<template>
  <div class="page">
    <div class="page-header">
      <div><p class="page-kicker">统计分析</p><h1>拜访与商机看板</h1><p>追踪客户经理拜访、商机转化和高意向客户推进情况。</p></div>
      <div class="page-actions"><el-button :icon="Download" @click="ElMessage.info('导出能力将在后续版本开放')">导出报表</el-button></div>
    </div>

    <div class="analytics-filters">
      <el-segmented v-model="period" :options="['今日', '本周']" />
      <el-select v-model="manager" placeholder="客户经理" clearable style="width: 150px"><el-option v-for="item in managers" :key="item" :label="item" :value="item" /></el-select>
      <el-select v-model="industry" placeholder="客户行业" clearable style="width: 150px"><el-option v-for="item in industries" :key="item" :label="item" :value="item" /></el-select>
      <span class="analytics-update"><CircleCheck /> 数据更新于 10:35</span>
    </div>

    <section class="stats-grid analytics-stats">
      <StatCard label="今日拜访次数" :value="todayVisits" unit="次" trend="+1 次" note="较昨日同期" color="#2563eb" :icon="Location" />
      <StatCard label="有效商机数" :value="state.opportunities.length" unit="个" trend="+2 个" note="本周新建" color="#8b5cf6" :icon="Briefcase" />
      <StatCard label="商机转化率" :value="conversionRate" unit="%" trend="+3.2%" note="较上周同期" color="#10b981" :icon="TrendCharts" trend-class="positive" />
      <StatCard label="预计金额合计" :value="totalAmount" unit="万" trend="高意向占 64%" note="金额单位：元" color="#f59e0b" :icon="Money" />
    </section>

    <div class="dashboard-grid analytics-grid">
      <section class="panel span-7"><div class="panel-header"><div><h2>拜访趋势</h2><p>本周有效拜访次数</p></div><el-tag effect="plain">缺失日期补 0</el-tag></div><EChart :option="visitOption" height="320px" /></section>
      <section class="panel span-5"><div class="panel-header"><div><h2>商机转化漏斗</h2><p>固定状态顺序</p></div></div><EChart :option="funnelOption" height="320px" /></section>
      <section class="panel span-5"><div class="panel-header"><div><h2>客户经理拜访排行</h2><p>按有效拜访数降序</p></div></div><EChart :option="managerOption" height="310px" /></section>
      <section class="panel span-7">
        <div class="panel-header"><div><h2>高意向客户 TOP5</h2><p>按意向等级、预计金额和最近跟进排序</p></div></div>
        <el-table :data="topOpportunities" class="compact-table">
          <el-table-column prop="customer" label="客户名称" min-width="190" />
          <el-table-column prop="industry" label="行业" width="110" />
          <el-table-column prop="level" label="意向" width="90"><template #default="{ row }"><el-tag :type="row.level === '高' ? 'danger' : 'warning'" effect="light">{{ row.level }}意向</el-tag></template></el-table-column>
          <el-table-column prop="amount" label="预计金额" width="125" align="right"><template #default="{ row }">¥{{ (row.amount / 10000).toFixed(0) }}万</template></el-table-column>
          <el-table-column prop="statusName" label="状态" width="100" />
          <el-table-column prop="owner" label="负责人" width="90" />
          <el-table-column prop="lastFollowTime" label="最近跟进" width="165" />
        </el-table>
      </section>
      <section class="panel span-12">
        <div class="panel-header"><div><h2>近期拜访记录</h2><p>数据由客户经理 APP 提交并通过申请状态校验</p></div><span class="live-indicator"><i /> APP 数据已接入</span></div>
        <el-table :data="filteredVisits" class="compact-table">
          <el-table-column prop="date" label="拜访日期" width="120" />
          <el-table-column prop="manager" label="客户经理" width="110" />
          <el-table-column prop="dept" label="所属部门" min-width="145" />
          <el-table-column prop="customer" label="客户名称" min-width="220" />
          <el-table-column prop="industry" label="行业" width="120" />
          <el-table-column label="执行状态" width="120"><template #default="{ row }"><el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'" effect="light">{{ row.status === 'COMPLETED' ? '已完成' : '待拜访' }}</el-tag></template></el-table-column>
          <el-table-column label="数据来源" width="110"><template #default><el-tag effect="plain">翼线 APP</el-tag></template></el-table-column>
        </el-table>
      </section>
    </div>
  </div>
</template>

<script setup>
import { Briefcase, CircleCheck, Download, Location, Money, TrendCharts } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import EChart from '../components/EChart.vue'
import StatCard from '../components/StatCard.vue'
import { state } from '../services/mockStore'

const period = ref('本周')
const manager = ref('')
const industry = ref('')
const managers = [...new Set(state.visits.map((item) => item.manager))]
const industries = [...new Set(state.visits.map((item) => item.industry))]
const todayVisits = computed(() => state.visits.filter((item) => item.date === '2026-06-11').length)
const conversionRate = computed(() => Math.round(state.opportunities.filter((item) => item.status === 'SIGNED').length / state.opportunities.length * 100))
const totalAmount = computed(() => (state.opportunities.reduce((sum, item) => sum + item.amount, 0) / 10000).toFixed(0))
const filteredVisits = computed(() => state.visits.filter((item) => !manager.value || item.manager === manager.value).filter((item) => !industry.value || item.industry === industry.value))
const topOpportunities = computed(() => [...state.opportunities].sort((a, b) => (b.level === '高') - (a.level === '高') || b.amount - a.amount).slice(0, 5))
const visitOption = computed(() => ({
  tooltip: { trigger: 'axis' }, grid: { left: 16, right: 20, top: 28, bottom: 12, containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: ['周一 6/8', '周二 6/9', '周三 6/10', '周四 6/11', '周五 6/12', '周六 6/13', '周日 6/14'], axisLine: { lineStyle: { color: '#e2e8f0' } } },
  yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#eef2f7' } } },
  series: [{ type: 'line', smooth: true, data: [3, 5, 7, 6, 8, 4, 2], symbolSize: 8, lineStyle: { width: 3, color: '#8b5cf6' }, itemStyle: { color: '#8b5cf6' }, areaStyle: { color: 'rgba(139,92,246,.10)' } }],
}))
const funnelOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}：{c}' },
  series: [{ type: 'funnel', left: '12%', top: 18, bottom: 12, width: '76%', min: 0, max: 18, minSize: '28%', maxSize: '100%', sort: 'descending', gap: 3, label: { show: true, position: 'inside', formatter: '{b}  {c}', color: '#fff', fontWeight: 600 }, itemStyle: { borderColor: '#fff', borderWidth: 2 }, data: [
    { value: 18, name: '新建', itemStyle: { color: '#93c5fd' } }, { value: 13, name: '跟进中', itemStyle: { color: '#60a5fa' } }, { value: 8, name: '高意向', itemStyle: { color: '#8b5cf6' } }, { value: 4, name: '已签约', itemStyle: { color: '#10b981' } },
  ] }],
}))
const managerOption = computed(() => ({
  grid: { left: 12, right: 28, top: 16, bottom: 8, containLabel: true },
  xAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef2f7' } } },
  yAxis: { type: 'category', inverse: true, data: ['王敏', '陈晓', '赵宁', '徐蕾', '何伟'], axisLine: { show: false }, axisTick: { show: false } },
  series: [{ type: 'bar', data: [12, 10, 8, 7, 5], barWidth: 20, label: { show: true, position: 'right', formatter: '{c} 次' }, itemStyle: { color: '#8b5cf6', borderRadius: [0, 8, 8, 0] } }],
}))
</script>
