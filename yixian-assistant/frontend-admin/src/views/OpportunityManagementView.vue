<template>
  <div class="page">
    <div class="page-header">
      <div>
        <p class="page-kicker">业务运营</p>
        <h1>商机管理</h1>
        <p>查看 APP 端客户经理和装维人员创建的商机状态、创建人和创建时间。</p>
      </div>
      <div class="page-actions">
        <el-button :icon="Refresh" @click="refreshView">刷新视图</el-button>
        <el-button :icon="RefreshLeft" @click="resetFilters">重置筛选</el-button>
      </div>
    </div>

    <section class="stats-grid">
      <StatCard label="全部商机" :value="rows.length" unit="个" :trend="`${appSourceCount} 个来自 APP`" note="含客户经理与装维" color="#2563eb" :icon="Briefcase" />
      <StatCard label="高意向" :value="highIntentCount" unit="个" trend="重点推进" note="状态为高意向" color="#f59e0b" :icon="Warning" />
      <StatCard label="已签约" :value="signedCount" unit="个" trend="进入履约" note="签约商机总数" color="#10b981" :icon="CircleCheck" />
      <StatCard label="待派单" :value="dispatchRequiredCount" unit="个" trend="需要装维" note="已签约且需装维" color="#8b5cf6" :icon="Promotion" />
    </section>

    <section class="panel table-panel">
      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="商机编号 / 客户 / 标题 / 创建人" :prefix-icon="Search" clearable class="filter-keyword" />
        <el-select v-model="filters.status" placeholder="商机状态" clearable>
          <el-option v-for="item in opportunityStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="filters.creatorRole" placeholder="创建人角色" clearable>
          <el-option v-for="item in creatorRoleOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="filters.customerType" placeholder="客户类型" clearable>
          <el-option v-for="item in customerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="filters.needMaintainer" placeholder="装维需求" clearable>
          <el-option label="需要装维" :value="true" />
          <el-option label="无需装维" :value="false" />
        </el-select>
        <el-button :icon="RefreshLeft" text @click="resetFilters">清空</el-button>
      </div>

      <el-table :data="pagedRows" row-key="id" height="calc(100vh - 370px)" class="data-table" @row-click="openDetail">
        <el-table-column label="商机信息" min-width="235" fixed>
          <template #default="{ row }">
            <div class="opportunity-cell">
              <span><strong class="primary-id">{{ row.code }}</strong><el-tag size="small" effect="plain" class="source-tag">{{ row.source }}</el-tag></span>
              <b>{{ row.customer }}</b>
              <small>{{ row.title }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="客户类型" width="92">
          <template #default="{ row }"><el-tag effect="light" :type="row.customerType === 'ENTERPRISE' ? 'primary' : 'info'">{{ row.customerTypeName }}</el-tag></template>
        </el-table-column>
        <el-table-column label="状态" width="106">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type" effect="light">
              <span class="status-dot" :style="{ background: statusMeta(row.status).color }" />
              {{ row.statusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="意向" width="82">
          <template #default="{ row }"><el-tag :type="levelType(row.levelName)" effect="light">{{ row.levelName }}意向</el-tag></template>
        </el-table-column>
        <el-table-column label="预计金额" width="110" align="right">
          <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="装维需求" width="122">
          <template #default="{ row }">
            <div class="tag-list">
              <el-tag :type="row.needMaintainer ? 'warning' : 'info'" effect="light">{{ row.needMaintainer ? '需要' : '无需' }}</el-tag>
              <el-tag v-if="requiresDispatch(row)" type="danger" effect="plain">待派单</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="150">
          <template #default="{ row }">
            <div class="person-cell">
              <span>{{ row.creatorName.slice(0, 1) }}</span>
              <div>{{ row.creatorName }}<small>{{ row.creatorRole || '-' }} · {{ row.creatorJobNo || '-' }}</small></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="164" sortable />
        <el-table-column label="操作" width="84" fixed="right">
          <template #default="{ row }"><el-button link type="primary" @click.stop="openDetail(row)">详情</el-button></template>
        </el-table-column>
        <template #empty>
          <el-empty description="未找到符合条件的商机"><el-button @click="resetFilters">清空筛选</el-button></el-empty>
        </template>
      </el-table>

      <div class="table-footer">
        <span>共 {{ filteredRows.length }} 条记录</span>
        <span>当前筛选：{{ filterSummary }}</span>
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" layout="prev, pager, next, sizes" :page-sizes="[10, 20, 50]" :total="filteredRows.length" />
      </div>
    </section>

    <el-drawer v-model="detailVisible" size="680px" class="detail-drawer" :with-header="false">
      <template v-if="current">
        <div class="drawer-header">
          <div>
            <p>{{ current.customerTypeName }}客户 · {{ current.customer }}</p>
            <h2>{{ current.title }}</h2>
            <span>{{ current.code }}</span>
          </div>
          <el-tag :type="statusMeta(current.status).type" effect="light">{{ current.statusName }}</el-tag>
          <el-button circle text @click="detailVisible = false"><Close /></el-button>
        </div>
        <div class="entity-summary">
          <div><span>创建人</span><strong>{{ current.creatorName }}</strong><small>{{ current.creatorRole || '-' }} · {{ current.creatorJobNo || '-' }}</small></div>
          <div><span>创建时间</span><strong>{{ current.createTime || '-' }}</strong><small>{{ current.source }} 同步</small></div>
          <div><span>当前状态</span><strong>{{ current.statusName }}</strong><small>{{ requiresDispatch(current) ? '签约后待装维派单' : '按商机流程推进' }}</small></div>
        </div>
        <div class="drawer-section">
          <h3>商机信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="商机编号">{{ current.code }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ current.customer }}</el-descriptions-item>
            <el-descriptions-item label="客户类型">{{ current.customerTypeName }}</el-descriptions-item>
            <el-descriptions-item label="意向等级">{{ current.levelName }}意向</el-descriptions-item>
            <el-descriptions-item label="预计金额">{{ formatAmount(current.amount) }}</el-descriptions-item>
            <el-descriptions-item label="下次联系">{{ current.nextContactTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最近跟进">{{ current.lastFollowTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="所属部门">{{ current.creatorDept || '-' }}</el-descriptions-item>
            <el-descriptions-item label="商机描述" :span="2">{{ current.description || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="drawer-section">
          <div class="section-heading">
            <div><h3>装维与派单</h3><p>已签约且需要装维的商机将进入后续派单流程。</p></div>
            <el-tag :type="current.needMaintainer ? 'warning' : 'info'" effect="light">{{ current.needMaintainer ? '需要装维' : '无需装维' }}</el-tag>
          </div>
          <div class="opportunity-dispatch-state" :class="{ attention: requiresDispatch(current) }">
            <Promotion />
            <div>
              <strong>{{ requiresDispatch(current) ? '待进入派单处理' : '暂无派单动作' }}</strong>
              <span>{{ requiresDispatch(current) ? '该商机已签约且标记需要装维，后续可衔接任务派单。' : '当前状态未触发装维派单条件。' }}</span>
            </div>
          </div>
        </div>
        <div class="drawer-section">
          <h3>跟进记录</h3>
          <el-timeline v-if="current.follows.length">
            <el-timeline-item v-for="record in current.follows" :key="record.id || record.time" :timestamp="record.time" type="primary">
              <strong>{{ record.owner || current.creatorName }}</strong>
              <p>{{ record.content || record.summary || '-' }}</p>
            </el-timeline-item>
          </el-timeline>
          <div v-else class="simple-empty"><User />暂无跟进记录</div>
        </div>
        <div class="drawer-footer">
          <span><CircleCheck /> 数据来源：翼线助手 APP 商机记录</span>
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { Briefcase, CircleCheck, Close, Promotion, Refresh, RefreshLeft, Search, User, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import StatCard from '../components/StatCard.vue'
import { state } from '../services/mockStore'
import { customerTypeOptions, normalizeOpportunity, opportunityStatusMeta, opportunityStatusOptions } from '../services/opportunityNormalizer'

const filters = reactive({ keyword: '', status: '', creatorRole: '', customerType: '', needMaintainer: '' })
const currentPage = ref(1)
const pageSize = ref(20)
const detailVisible = ref(false)
const current = ref(null)

const rows = computed(() => state.opportunities
  .map((item) => normalizeOpportunity(item, state.people))
  .sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)) || a.statusOrder - b.statusOrder))

const creatorRoleOptions = computed(() => [...new Set(rows.value.map((item) => item.creatorRole).filter(Boolean))])
const appSourceCount = computed(() => rows.value.filter((item) => item.source === 'APP').length)
const highIntentCount = computed(() => rows.value.filter((item) => item.status === 'HIGH_INTENT').length)
const signedCount = computed(() => rows.value.filter((item) => item.status === 'SIGNED').length)
const dispatchRequiredCount = computed(() => rows.value.filter(requiresDispatch).length)

const filteredRows = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  return rows.value
    .filter((item) => !keyword || `${item.code}${item.customer}${item.title}${item.creatorName}${item.creatorJobNo}`.toLowerCase().includes(keyword))
    .filter((item) => !filters.status || item.status === filters.status)
    .filter((item) => !filters.creatorRole || item.creatorRole === filters.creatorRole)
    .filter((item) => !filters.customerType || item.customerType === filters.customerType)
    .filter((item) => filters.needMaintainer === '' || filters.needMaintainer === undefined || item.needMaintainer === filters.needMaintainer)
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const filterSummary = computed(() => {
  const parts = [
    filters.status ? statusMeta(filters.status).label : '',
    filters.creatorRole,
    filters.customerType ? customerTypeOptions.find((item) => item.value === filters.customerType)?.label : '',
    filters.needMaintainer === '' ? '' : filters.needMaintainer ? '需要装维' : '无需装维',
  ].filter(Boolean)
  return parts.length ? parts.join(' / ') : '全部商机'
})

watch(filters, () => {
  currentPage.value = 1
}, { deep: true })

function statusMeta(value) {
  return opportunityStatusMeta(value)
}

function requiresDispatch(row) {
  return row.status === 'SIGNED' && row.needMaintainer
}

function levelType(value) {
  if (value === '高') return 'danger'
  if (value === '中') return 'warning'
  return 'info'
}

function formatAmount(value) {
  const amount = Number(value || 0)
  if (amount >= 10000) {
    const wan = amount / 10000
    return `¥${wan >= 100 ? wan.toFixed(0) : wan.toFixed(1)}万`
  }
  return `¥${amount.toLocaleString('zh-CN')}`
}

function resetFilters() {
  Object.assign(filters, { keyword: '', status: '', creatorRole: '', customerType: '', needMaintainer: '' })
}

function refreshView() {
  ElMessage.success('商机视图已刷新')
}

function openDetail(row) {
  current.value = row
  detailVisible.value = true
}
</script>
