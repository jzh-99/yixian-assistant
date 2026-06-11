<template>
  <div class="page">
    <div class="page-header">
      <div><p class="page-kicker">核心业务</p><h1>审批中心</h1><p>集中处理来自翼线助手 APP 的领料、拜访和支撑申请。</p></div>
      <div class="page-actions"><el-button :icon="Refresh" @click="resetFilters">重置筛选</el-button></div>
    </div>

    <div class="attention-banner">
      <WarningFilled />
      <div><strong>{{ overdueCount }} 件申请已超过 4 小时未处理</strong><span>超时申请已置顶，请优先完成审批。</span></div>
      <el-button text type="danger" @click="filters.overdue = true">仅看超时</el-button>
    </div>

    <section class="panel table-panel">
      <el-tabs v-model="tab" class="page-tabs">
        <el-tab-pane name="pending"><template #label>待审批 <span class="tab-count">{{ pendingApplications.length }}</span></template></el-tab-pane>
        <el-tab-pane label="已审批" name="processed" />
      </el-tabs>

      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="申请单号 / 申请人 / 摘要" :prefix-icon="Search" clearable class="filter-keyword" />
        <el-select v-model="filters.type" placeholder="申请类型" clearable><el-option label="领料申请" value="MATERIAL" /><el-option label="外出拜访" value="VISIT" /><el-option label="支撑申请" value="SUPPORT" /></el-select>
        <el-select v-model="filters.dept" placeholder="所属部门" clearable><el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" /></el-select>
        <el-date-picker v-model="filters.date" type="daterange" range-separator="至" start-placeholder="提交开始" end-placeholder="提交结束" />
        <el-checkbox v-model="filters.overdue" border>仅看超时</el-checkbox>
        <el-button :icon="RefreshLeft" text @click="resetFilters">清空</el-button>
      </div>

      <el-table :data="filteredRows" row-key="id" height="calc(100vh - 365px)" class="data-table" @row-click="openDetail">
        <el-table-column prop="appNo" label="申请单号" min-width="174" fixed>
          <template #default="{ row }"><span class="primary-id">{{ row.appNo }}</span><el-tag v-if="row.source === 'APP'" size="small" effect="plain" class="source-tag">APP</el-tag></template>
        </el-table-column>
        <el-table-column prop="typeName" label="申请类型" width="112" />
        <el-table-column label="申请人" width="128"><template #default="{ row }"><div class="person-cell"><span>{{ row.applicant.slice(0, 1) }}</span><div>{{ row.applicant }}<small>{{ row.dept }}</small></div></div></template></el-table-column>
        <el-table-column prop="summary" label="申请摘要" min-width="250" show-overflow-tooltip />
        <el-table-column prop="createTime" label="提交时间" width="168" sortable />
        <el-table-column v-if="tab === 'pending'" label="等待时长" width="130" sortable>
          <template #default="{ row }"><span :class="{ 'danger-text': row.overdueHours > 0 }">{{ row.overdueHours > 0 ? `已超时 ${row.overdueHours} 小时` : '未超时' }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="104"><template #default="{ row }"><StatusTag :value="row.status" dot /></template></el-table-column>
        <el-table-column label="操作" width="154" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING' && canWrite">
              <el-button link type="primary" @click.stop="openApprove(row)">通过</el-button>
              <el-button link type="danger" @click.stop="openReject(row)">驳回</el-button>
            </template>
            <el-button link @click.stop="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="未找到符合条件的申请"><el-button @click="resetFilters">清空筛选</el-button></el-empty></template>
      </el-table>
      <div class="table-footer"><span>共 {{ filteredRows.length }} 条记录</span><el-pagination layout="prev, pager, next, sizes" :total="filteredRows.length" :page-sizes="[20, 50]" :default-page-size="20" /></div>
    </section>

    <el-drawer v-model="detailVisible" size="640px" class="detail-drawer" :with-header="false">
      <template v-if="current">
        <div class="drawer-header">
          <div><p>{{ current.typeName }}</p><h2>{{ current.title }}</h2><span>{{ current.appNo }}</span></div>
          <el-button circle text @click="detailVisible = false"><Close /></el-button>
        </div>
        <div class="entity-summary">
          <div><span>当前状态</span><StatusTag :value="current.status" dot /></div>
          <div><span>申请人</span><strong>{{ current.applicant }}</strong><small>{{ current.dept }}</small></div>
          <div><span>提交来源</span><strong>翼线助手 APP</strong><small>已通过接口校验</small></div>
        </div>
        <div class="drawer-section">
          <h3>申请信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="申请类型">{{ current.typeName }}</el-descriptions-item>
            <el-descriptions-item label="紧急程度">{{ current.urgency || '普通' }}</el-descriptions-item>
            <el-descriptions-item label="期望时间">{{ current.expectedTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="服务地址">{{ current.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="申请说明" :span="2">{{ current.summary }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-if="current.rejectReason" class="reject-callout"><WarningFilled /><div><strong>驳回原因</strong><span>{{ current.rejectReason }}</span></div></div>
        <div class="drawer-section">
          <h3>审批轨迹</h3>
          <el-timeline>
            <el-timeline-item v-for="record in current.records" :key="record.time" :timestamp="record.time" :type="record.action === 'REJECT' ? 'danger' : record.action === 'APPROVE' ? 'success' : 'primary'">
              <strong>{{ actionName(record.action) }} · {{ record.operator }}</strong><p>{{ record.comment }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>
        <div v-if="current.status === 'PENDING' && canWrite" class="drawer-footer">
          <el-button type="danger" plain @click="openReject(current)">驳回申请</el-button>
          <el-button type="primary" @click="openApprove(current)">审批通过</el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="approveVisible" title="确认审批通过" width="500px">
      <div class="dialog-intro success"><CircleCheck /><div><strong>通过后将推进业务流程</strong><span>{{ current?.type === 'VISIT' ? '该拜访申请将直接生效，不生成派单任务。' : '系统将自动创建待派任务，并计算推荐候选人。' }}</span></div></div>
      <el-form label-position="top"><el-form-item label="审批意见（选填）"><el-input v-model="approveComment" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请输入审批意见" /></el-form-item></el-form>
      <template #footer><el-button @click="approveVisible = false">取消</el-button><el-button type="primary" @click="confirmApprove">确认通过</el-button></template>
    </el-dialog>

    <el-dialog v-model="rejectVisible" title="驳回申请" width="500px">
      <div class="dialog-intro danger"><WarningFilled /><div><strong>驳回原因将同步到申请人 APP</strong><span>请清楚说明需要修改或补充的内容。</span></div></div>
      <el-form label-position="top"><el-form-item label="驳回原因" required :error="rejectError"><el-input v-model="rejectReason" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="请输入 5-500 字驳回原因" /></el-form-item></el-form>
      <template #footer><el-button @click="rejectVisible = false">取消</el-button><el-button type="danger" @click="confirmReject">确认驳回</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { CircleCheck, Close, Refresh, RefreshLeft, Search, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import StatusTag from '../components/StatusTag.vue'
import { approveApplication, pendingApplications, rejectApplication, state } from '../services/mockStore'
import { canWrite } from '../services/session'

const tab = ref('pending')
const detailVisible = ref(false)
const approveVisible = ref(false)
const rejectVisible = ref(false)
const current = ref(null)
const approveComment = ref('')
const rejectReason = ref('')
const rejectError = ref('')
const filters = reactive({ keyword: '', type: '', dept: '', date: [], overdue: false })
const departments = [...new Set(state.applications.map((item) => item.dept))]
const overdueCount = computed(() => pendingApplications.value.filter((item) => item.overdueHours > 0).length)
const filteredRows = computed(() => state.applications
  .filter((item) => tab.value === 'pending' ? item.status === 'PENDING' : item.status !== 'PENDING')
  .filter((item) => !filters.keyword || `${item.appNo}${item.applicant}${item.summary}`.toLowerCase().includes(filters.keyword.toLowerCase()))
  .filter((item) => !filters.type || item.type === filters.type)
  .filter((item) => !filters.dept || item.dept === filters.dept)
  .filter((item) => !filters.overdue || item.overdueHours > 0)
  .sort((a, b) => (b.overdueHours || 0) - (a.overdueHours || 0)))

function resetFilters() {
  Object.assign(filters, { keyword: '', type: '', dept: '', date: [], overdue: false })
}
function openDetail(row) {
  current.value = row
  detailVisible.value = true
}
function openApprove(row) {
  current.value = row
  approveComment.value = ''
  approveVisible.value = true
}
function openReject(row) {
  current.value = row
  rejectReason.value = ''
  rejectError.value = ''
  rejectVisible.value = true
}
function confirmApprove() {
  try {
    const task = approveApplication(current.value, approveComment.value)
    approveVisible.value = false
    detailVisible.value = false
    ElMessage.success(task ? `审批通过，已创建待派任务 ${task.taskNo}` : '审批通过，结果将同步到申请人 APP')
  } catch (error) {
    ElMessage.error(error.message)
  }
}
function confirmReject() {
  if (rejectReason.value.trim().length < 5) {
    rejectError.value = '驳回原因至少 5 个字'
    return
  }
  try {
    rejectApplication(current.value, rejectReason.value.trim())
    rejectVisible.value = false
    detailVisible.value = false
    ElMessage.success('已驳回，原因将同步到申请人 APP')
  } catch (error) {
    ElMessage.error(error.message)
  }
}
function actionName(action) {
  return { SUBMIT: '提交申请', APPROVE: '审批通过', REJECT: '审批驳回' }[action] || action
}
</script>
