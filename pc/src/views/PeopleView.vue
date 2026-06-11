<template>
  <div class="page">
    <div class="page-header">
      <div><p class="page-kicker">资源配置</p><h1>人员与技能</h1><p>维护执行人员、技能标签和可接单状态，为智能派单提供可靠数据。</p></div>
      <div class="page-actions"><el-button v-if="canWrite" type="primary" :icon="Plus" @click="ElMessage.info('1.0 版本人员主数据由统一账号服务同步')">新增人员</el-button></div>
    </div>

    <section class="stats-grid people-stats">
      <StatCard label="在册人员" :value="state.people.length" unit="人" trend="5 名执行人员" note="含管理与客户经理" color="#2563eb" :icon="User" />
      <StatCard label="当前可接单" :value="availableCount" unit="人" trend="1 人已停用" note="负载未达上限" color="#10b981" :icon="CircleCheck" />
      <StatCard label="平均负载率" :value="averageLoad" unit="%" trend="总体负载健康" note="未完成任务 / 并发上限" color="#f59e0b" :icon="Odometer" />
      <StatCard label="技能标签" :value="allSkills.length" unit="个" trend="3 个高专业标签" note="已启用标签" color="#8b5cf6" :icon="PriceTag" />
    </section>

    <section class="panel table-panel">
      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="姓名 / 工号 / 手机号" :prefix-icon="Search" clearable class="filter-keyword" />
        <el-select v-model="filters.role" placeholder="人员类型" clearable><el-option v-for="role in roles" :key="role" :label="role" :value="role" /></el-select>
        <el-select v-model="filters.dept" placeholder="所属部门" clearable><el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" /></el-select>
        <el-select v-model="filters.skill" placeholder="技能标签" clearable filterable><el-option v-for="skill in allSkills" :key="skill" :label="skill" :value="skill" /></el-select>
        <el-select v-model="filters.status" placeholder="账号状态" clearable><el-option label="启用" value="ENABLED" /><el-option label="停用" value="DISABLED" /></el-select>
        <el-button :icon="RefreshLeft" text @click="resetFilters">清空</el-button>
      </div>

      <el-table :data="filteredPeople" row-key="id" height="calc(100vh - 405px)" class="data-table" @row-click="openDetail">
        <el-table-column label="人员" min-width="176" fixed>
          <template #default="{ row }"><div class="person-cell large"><span>{{ row.name.slice(0, 1) }}</span><div><strong>{{ row.name }}</strong><small>{{ row.employeeNo }}</small></div></div></template>
        </el-table-column>
        <el-table-column prop="role" label="人员类型" width="116" />
        <el-table-column prop="dept" label="所属部门" min-width="160" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="132" />
        <el-table-column label="技能标签" min-width="250">
          <template #default="{ row }"><div class="tag-list"><el-tag v-for="skill in row.skills.slice(0, 3)" :key="skill" size="small" effect="plain">{{ skill }}</el-tag><span v-if="row.skills.length > 3">+{{ row.skills.length - 3 }}</span></div></template>
        </el-table-column>
        <el-table-column label="当前负载" width="150">
          <template #default="{ row }">
            <template v-if="row.maxConcurrent"><div class="load-cell"><span>{{ row.currentTasks }} / {{ row.maxConcurrent }}</span><el-progress :percentage="Math.round(row.currentTasks / row.maxConcurrent * 100)" :show-text="false" :stroke-width="6" :color="loadColor(row)" /></div></template>
            <span v-else class="muted">不参与派单</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="96"><template #default="{ row }"><StatusTag :value="row.status" dot /></template></el-table-column>
        <el-table-column label="操作" width="126" fixed="right">
          <template #default="{ row }"><el-button link type="primary" @click.stop="openDetail(row)">详情</el-button><el-button v-if="canWrite" link @click.stop="openEdit(row)">编辑</el-button></template>
        </el-table-column>
      </el-table>
      <div class="table-footer"><span>共 {{ filteredPeople.length }} 人</span><el-pagination layout="prev, pager, next, sizes" :total="filteredPeople.length" :page-sizes="[20, 50]" :default-page-size="20" /></div>
    </section>

    <el-drawer v-model="detailVisible" size="590px" class="detail-drawer" :with-header="false">
      <template v-if="current">
        <div class="drawer-header profile-header">
          <div class="profile-avatar">{{ current.name.slice(0, 1) }}</div>
          <div><p>{{ current.role }}</p><h2>{{ current.name }}</h2><span>{{ current.employeeNo }} · {{ current.dept }}</span></div>
          <el-button circle text @click="detailVisible = false"><Close /></el-button>
        </div>
        <div class="entity-summary">
          <div><span>账号状态</span><StatusTag :value="current.status" dot /></div>
          <div><span>当前负载</span><strong>{{ current.maxConcurrent ? `${current.currentTasks} / ${current.maxConcurrent}` : '-' }}</strong><small>未完成任务 / 并发上限</small></div>
          <div><span>综合表现</span><strong>{{ current.score }} 分</strong><small>近 30 天同类任务</small></div>
        </div>
        <div class="drawer-section"><div class="section-heading"><h3>技能标签</h3><el-button v-if="canWrite" text type="primary" @click="openEdit(current)">编辑</el-button></div><div class="skill-cloud"><el-tag v-for="skill in current.skills" :key="skill" effect="plain">{{ skill }}</el-tag></div></div>
        <div class="drawer-section"><h3>基础信息</h3><el-descriptions :column="2" border><el-descriptions-item label="手机号">{{ current.phone }}</el-descriptions-item><el-descriptions-item label="可接单">{{ current.available ? '是' : '否' }}</el-descriptions-item><el-descriptions-item label="所属部门" :span="2">{{ current.dept }}</el-descriptions-item></el-descriptions></div>
        <div class="drawer-section">
          <h3>当前任务</h3>
          <div class="mini-list">
            <div v-for="task in personTasks" :key="task.id"><span class="status-line" /><div><strong>{{ task.title }}</strong><small>{{ task.taskNo }} · {{ task.expectedFinishTime }}</small></div><StatusTag :value="task.status" /></div>
            <el-empty v-if="!personTasks.length" description="当前没有进行中任务" :image-size="70" />
          </div>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="editVisible" title="编辑人员配置" width="540px">
      <el-form v-if="editForm" label-position="top">
        <div class="form-grid"><el-form-item label="姓名"><el-input :model-value="editForm.name" disabled /></el-form-item><el-form-item label="工号"><el-input :model-value="editForm.employeeNo" disabled /></el-form-item></div>
        <el-form-item label="技能标签"><el-select v-model="editForm.skills" multiple filterable allow-create default-first-option style="width: 100%"><el-option v-for="skill in allSkills" :key="skill" :label="skill" :value="skill" /></el-select></el-form-item>
        <div class="form-grid"><el-form-item label="最大并发任务数"><el-input-number v-model="editForm.maxConcurrent" :min="1" :max="20" :disabled="!editForm.maxConcurrent" /></el-form-item><el-form-item label="账号状态"><el-radio-group v-model="editForm.status"><el-radio-button value="ENABLED">启用</el-radio-button><el-radio-button value="DISABLED">停用</el-radio-button></el-radio-group></el-form-item></div>
        <el-alert v-if="editForm.status === 'DISABLED' && editForm.currentTasks > 0" type="warning" :closable="false" show-icon title="该人员仍有进行中任务，请先在派单中心完成改派。" />
      </el-form>
      <template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" @click="saveEdit">保存配置</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { CircleCheck, Close, Odometer, Plus, PriceTag, RefreshLeft, Search, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import StatCard from '../components/StatCard.vue'
import StatusTag from '../components/StatusTag.vue'
import { state, updatePerson } from '../services/mockStore'
import { canWrite } from '../services/session'

const filters = reactive({ keyword: '', role: '', dept: '', skill: '', status: '' })
const detailVisible = ref(false)
const editVisible = ref(false)
const current = ref(null)
const editForm = ref(null)
const allSkills = computed(() => [...new Set(state.people.flatMap((item) => item.skills))])
const roles = [...new Set(state.people.map((item) => item.role))]
const departments = [...new Set(state.people.map((item) => item.dept))]
const availableCount = computed(() => state.people.filter((item) => item.maxConcurrent && item.status === 'ENABLED' && item.currentTasks < item.maxConcurrent).length)
const averageLoad = computed(() => {
  const workers = state.people.filter((item) => item.maxConcurrent)
  return Math.round(workers.reduce((sum, item) => sum + item.currentTasks / item.maxConcurrent, 0) / workers.length * 100)
})
const filteredPeople = computed(() => state.people
  .filter((item) => !filters.keyword || `${item.name}${item.employeeNo}${item.phone}`.includes(filters.keyword))
  .filter((item) => !filters.role || item.role === filters.role)
  .filter((item) => !filters.dept || item.dept === filters.dept)
  .filter((item) => !filters.skill || item.skills.includes(filters.skill))
  .filter((item) => !filters.status || item.status === filters.status))
const personTasks = computed(() => current.value ? state.tasks.filter((item) => item.assigneeId === current.value.id && !['COMPLETED', 'CANCELLED'].includes(item.status)) : [])

function resetFilters() { Object.assign(filters, { keyword: '', role: '', dept: '', skill: '', status: '' }) }
function openDetail(person) { current.value = person; detailVisible.value = true }
function openEdit(person) { current.value = person; editForm.value = JSON.parse(JSON.stringify(person)); editVisible.value = true }
function loadColor(row) { const ratio = row.currentTasks / row.maxConcurrent; return ratio >= .8 ? '#ef4444' : ratio >= .5 ? '#f59e0b' : '#10b981' }
function saveEdit() {
  if (editForm.value.status === 'DISABLED' && editForm.value.currentTasks > 0) {
    ElMessage.warning('该人员有进行中任务，停用前必须先完成改派')
    return
  }
  updatePerson(current.value, { skills: editForm.value.skills, maxConcurrent: editForm.value.maxConcurrent, status: editForm.value.status })
  editVisible.value = false
  ElMessage.success('人员配置已保存，并写入操作日志')
}
</script>
