<template>
  <div class="page">
    <div class="page-header">
      <div><p class="page-kicker">AI② 智能匹配</p><h1>任务派单</h1><p>审批通过的执行任务在这里计算候选人，支持推荐确认、手动派单和改派。</p></div>
      <div class="page-actions"><el-button :icon="Setting" @click="ElMessage.info('1.0 默认采用 AI 推荐 + 人工确认')">派单策略</el-button></div>
    </div>

    <section class="stats-grid">
      <StatCard label="待派单" :value="unassignedTasks.length" unit="单" trend="候选计算正常" note="等待人工确认" color="#f59e0b" :icon="Promotion" />
      <StatCard label="今日已派" :value="state.dispatchRecords.length" unit="单" trend="AI 推荐占 67%" note="含自动与手动" color="#2563eb" :icon="CircleCheck" />
      <StatCard label="平均匹配分" :value="averageScore" unit="分" trend="高于自动阈值 80" note="候选综合评分" color="#10b981" :icon="DataLine" />
      <StatCard label="无候选任务" value="0" unit="单" trend="降级机制可用" note="异常进入人工队列" color="#8b5cf6" :icon="Warning" />
    </section>

    <section class="panel table-panel">
      <el-tabs v-model="tab" class="page-tabs">
        <el-tab-pane name="unassigned"><template #label>待派单 <span class="tab-count amber">{{ unassignedTasks.length }}</span></template></el-tab-pane>
        <el-tab-pane label="派单记录" name="records" />
      </el-tabs>

      <template v-if="tab === 'unassigned'">
        <div class="filter-bar"><el-input v-model="keyword" placeholder="任务号 / 标题 / 客户" :prefix-icon="Search" clearable class="filter-keyword" /><el-select v-model="type" placeholder="任务类型" clearable><el-option v-for="item in taskTypes" :key="item" :label="item" :value="item" /></el-select><el-button :icon="Refresh" @click="ElMessage.success('候选数据已刷新')">刷新候选</el-button></div>
        <el-table :data="taskRows" height="calc(100vh - 405px)" class="data-table" @row-click="openDispatch">
          <el-table-column prop="taskNo" label="任务号" min-width="180" fixed><template #default="{ row }"><span class="primary-id">{{ row.taskNo }}</span></template></el-table-column>
          <el-table-column prop="type" label="任务类型" width="110" />
          <el-table-column prop="title" label="任务标题" min-width="220" show-overflow-tooltip />
          <el-table-column prop="dept" label="任务部门" min-width="150" />
          <el-table-column label="必需技能" min-width="190"><template #default="{ row }"><div class="tag-list"><el-tag v-for="skill in row.requiredSkills" :key="skill" size="small" effect="plain">{{ skill }}</el-tag></div></template></el-table-column>
          <el-table-column prop="expectedFinishTime" label="期望完成" width="170" />
          <el-table-column label="推荐候选" width="148"><template #default="{ row }"><span v-if="bestCandidate(row)" class="candidate-preview"><i>{{ bestCandidate(row).name.slice(0, 1) }}</i>{{ bestCandidate(row).name }} <strong>{{ bestCandidate(row).aiScore }}</strong></span><span v-else class="danger-text">暂无候选</span></template></el-table-column>
          <el-table-column label="操作" width="110" fixed="right"><template #default="{ row }"><el-button v-if="canWrite" link type="primary" @click.stop="openDispatch(row)">确认派单</el-button><span v-else class="muted">只读</span></template></el-table-column>
        </el-table>
      </template>

      <template v-else>
        <div class="filter-bar"><el-input v-model="recordKeyword" placeholder="任务号 / 执行人 / 操作人" :prefix-icon="Search" clearable class="filter-keyword" /></div>
        <el-table :data="recordRows" height="calc(100vh - 405px)" class="data-table">
          <el-table-column prop="taskNo" label="任务号" min-width="180" fixed />
          <el-table-column prop="type" label="派单方式" width="145"><template #default="{ row }"><el-tag :type="row.type === 'AUTO' ? 'success' : row.type === 'AI_RECOMMEND' ? 'primary' : 'info'" effect="plain">{{ dispatchTypeName(row.type) }}</el-tag></template></el-table-column>
          <el-table-column prop="previousAssignee" label="原执行人" width="110" />
          <el-table-column prop="assignee" label="新执行人" width="110" />
          <el-table-column prop="score" label="匹配分" width="100"><template #default="{ row }"><strong>{{ row.score }}</strong></template></el-table-column>
          <el-table-column prop="reason" label="派单说明" min-width="250" show-overflow-tooltip />
          <el-table-column prop="operator" label="操作人" width="110" />
          <el-table-column prop="time" label="操作时间" width="170" />
        </el-table>
      </template>
      <div class="table-footer"><span>共 {{ tab === 'unassigned' ? taskRows.length : recordRows.length }} 条记录</span><el-pagination layout="prev, pager, next" :total="tab === 'unassigned' ? taskRows.length : recordRows.length" :default-page-size="20" /></div>
    </section>

    <el-drawer v-model="drawerVisible" size="760px" class="dispatch-drawer" :with-header="false">
      <template v-if="current">
        <div class="drawer-header"><div><p>待派任务 · {{ current.type }}</p><h2>{{ current.title }}</h2><span>{{ current.taskNo }} · 来源 {{ current.applicationNo }}</span></div><el-button circle text @click="drawerVisible = false"><Close /></el-button></div>
        <div class="task-brief">
          <div><span>任务部门</span><strong>{{ current.dept }}</strong></div>
          <div><span>期望完成</span><strong>{{ current.expectedFinishTime }}</strong></div>
          <div><span>服务地址</span><strong>{{ current.address }}</strong></div>
          <div><span>必需技能</span><div class="tag-list"><el-tag v-for="skill in current.requiredSkills" :key="skill" size="small">{{ skill }}</el-tag></div></div>
        </div>
        <div class="ai-explain"><MagicStick /><div><strong>AI② 候选计算完成</strong><span>已按人员状态、角色、组织范围、并发上限和必需技能完成硬约束过滤，再根据技能匹配与当前负载评分。</span></div></div>
        <div class="drawer-section">
          <div class="section-heading"><div><h3>推荐候选</h3><p>选择一名执行人员，推荐分仅作为调度决策参考。</p></div><el-button :icon="Refresh" text @click="ElMessage.success('候选评分已重新计算')">重新计算</el-button></div>
          <div class="candidate-list">
            <button v-for="(person, index) in candidates" :key="person.id" :class="{ selected: selectedId === person.id }" @click="selectedId = person.id">
              <span class="rank" :class="{ top: index === 0 }">{{ index + 1 }}</span>
              <span class="candidate-avatar">{{ person.name.slice(0, 1) }}</span>
              <span class="candidate-info"><strong>{{ person.name }} <small>{{ person.role }}</small></strong><span>{{ person.dept }}</span><span class="tag-list"><el-tag v-for="skill in person.skills.slice(0, 3)" :key="skill" size="small" effect="plain">{{ skill }}</el-tag></span></span>
              <span class="candidate-load"><small>当前负载</small><strong>{{ person.currentTasks }} / {{ person.maxConcurrent }}</strong><el-progress :percentage="person.currentTasks / person.maxConcurrent * 100" :show-text="false" :stroke-width="5" /></span>
              <span class="candidate-score"><strong>{{ person.aiScore }}</strong><small>综合分</small></span>
              <CircleCheck v-if="selectedId === person.id" class="selected-icon" />
            </button>
            <el-empty v-if="!candidates.length" description="没有符合硬约束的可接单人员" />
          </div>
        </div>
        <div class="drawer-section"><h3>派单备注</h3><el-input v-model="remark" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="选填，记录人工调整或特殊情况" /></div>
        <div class="drawer-footer"><span><Lock /> 手动选择仍会校验人员状态、组织范围与并发上限</span><el-button @click="drawerVisible = false">取消</el-button><el-button type="primary" :disabled="!selectedId || !canWrite" @click="confirmDispatch">确认派单</el-button></div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { CircleCheck, Close, DataLine, Lock, MagicStick, Promotion, Refresh, Search, Setting, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import StatCard from '../components/StatCard.vue'
import { candidatesFor, dispatchTask, state, unassignedTasks } from '../services/mockStore'
import { canWrite } from '../services/session'

const tab = ref('unassigned')
const keyword = ref('')
const type = ref('')
const recordKeyword = ref('')
const drawerVisible = ref(false)
const current = ref(null)
const selectedId = ref(null)
const remark = ref('')
const taskTypes = [...new Set(state.tasks.map((item) => item.type))]
const averageScore = computed(() => state.dispatchRecords.length ? Math.round(state.dispatchRecords.reduce((sum, item) => sum + item.score, 0) / state.dispatchRecords.length) : 0)
const taskRows = computed(() => unassignedTasks.value.filter((item) => !keyword.value || `${item.taskNo}${item.title}${item.customer}`.includes(keyword.value)).filter((item) => !type.value || item.type === type.value))
const recordRows = computed(() => state.dispatchRecords.filter((item) => !recordKeyword.value || `${item.taskNo}${item.assignee}${item.operator}`.includes(recordKeyword.value)))
const candidates = computed(() => current.value ? candidatesFor(current.value).slice(0, 5) : [])
function bestCandidate(task) { return candidatesFor(task)[0] }
function openDispatch(task) {
  if (!canWrite.value) return
  current.value = task
  const first = candidatesFor(task)[0]
  selectedId.value = first?.id || null
  remark.value = ''
  drawerVisible.value = true
}
function confirmDispatch() {
  const person = state.people.find((item) => item.id === selectedId.value)
  try {
    dispatchTask(current.value, person, remark.value, 'AI_RECOMMEND')
    drawerVisible.value = false
    ElMessage.success(`任务已派给 ${person.name}，APP 任务列表将同步更新`)
  } catch (error) {
    ElMessage.error(error.message)
  }
}
function dispatchTypeName(value) { return { AUTO: 'AI 自动派单', AI_RECOMMEND: 'AI 推荐确认', MANUAL: '手动派单' }[value] || value }
</script>
