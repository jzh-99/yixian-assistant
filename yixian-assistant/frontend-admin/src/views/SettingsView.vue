<template>
  <div class="page">
    <div class="page-header">
      <div><p class="page-kicker">系统治理</p><h1>系统设置</h1><p>维护业务字典、技能标签并审计关键操作记录。</p></div>
      <div class="page-actions">
        <el-button :icon="RefreshLeft" @click="restoreDemo">复位演示数据</el-button>
        <el-button :icon="Refresh" @click="reload">刷新</el-button>
        <el-button v-if="tab === 'dictionary'" type="primary" :icon="Plus" @click="addDictVisible = true">新增字典类型</el-button>
        <el-button v-if="tab === 'skills'" type="primary" :icon="Plus" @click="addSkillVisible = true">新增技能</el-button>
      </div>
    </div>

    <section class="panel settings-panel">
      <el-tabs v-model="tab" class="page-tabs" @tab-change="reload">
        <el-tab-pane label="字典管理" name="dictionary" />
        <el-tab-pane label="技能标签" name="skills" />
        <el-tab-pane label="操作日志" name="logs" />
      </el-tabs>

      <!-- 字典管理 -->
      <template v-if="tab === 'dictionary'">
        <el-row :gutter="16" style="height:calc(100vh - 300px)">
          <el-col :span="8" style="height:100%;overflow-y:auto">
            <el-card shadow="never">
              <div class="filter-bar" style="margin-bottom:12px">
                <el-input v-model="dictKeyword" placeholder="搜索字典" :prefix-icon="Search" clearable />
              </div>
              <el-menu :default-active="selectedDictCode" @select="selectDict">
                <el-menu-item v-for="d in filteredDicts" :key="d.dictCode" :index="d.dictCode">
                  <span>{{ d.dictName }}</span>
                  <el-button v-if="isSuperAdmin" link type="danger" size="small" style="margin-left:auto" @click.stop="deleteDict(d)">删除</el-button>
                </el-menu-item>
              </el-menu>
            </el-card>
          </el-col>
          <el-col :span="16">
            <el-table :data="dictItems" v-loading="itemLoading" height="calc(100vh - 310px)" class="data-table">
              <el-table-column prop="itemValue" label="值" min-width="140" />
              <el-table-column prop="itemLabel" label="标签" min-width="160" />
              <el-table-column prop="sort" label="排序" width="80" />
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button v-if="isSuperAdmin" link type="danger" @click="deleteDictItem(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="table-footer" v-if="selectedDictCode">
              <el-button v-if="isSuperAdmin" type="primary" size="small" :icon="Plus" @click="addItemVisible = true">新增条目</el-button>
            </div>
          </el-col>
        </el-row>
      </template>

      <!-- 技能标签 -->
      <template v-else-if="tab === 'skills'">
        <div class="filter-bar">
          <el-input v-model="skillKeyword" placeholder="搜索技能名称或编码" :prefix-icon="Search" clearable class="filter-keyword" />
        </div>
        <el-table :data="filteredSkills" v-loading="skillLoading" height="calc(100vh - 320px)" class="data-table">
          <el-table-column prop="code" label="技能编码" min-width="180"><template #default="{ row }"><code>{{ row.code }}</code></template></el-table-column>
          <el-table-column prop="name" label="技能名称" min-width="160" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button v-if="isSuperAdmin" link type="danger" @click="deleteSkill(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="table-footer"><span>共 {{ filteredSkills.length }} 条</span></div>
      </template>

      <!-- 操作日志 -->
      <template v-else>
        <div class="filter-bar">
          <el-input v-model="logKeyword" placeholder="操作者 / 模块 / 动作" :prefix-icon="Search" clearable class="filter-keyword" />
          <el-select v-model="logModule" placeholder="业务模块" clearable>
            <el-option v-for="m in logModules" :key="m" :label="m" :value="m" />
          </el-select>
          <div class="filter-spacer" />
          <span class="audit-lock"><Lock /> 日志不可修改或删除</span>
        </div>
        <el-table :data="filteredLogs" v-loading="logLoading" height="calc(100vh - 320px)" class="data-table">
          <el-table-column prop="createTime" label="操作时间" width="172" fixed />
          <el-table-column prop="operatorName" label="操作者" width="100" />
          <el-table-column prop="module" label="模块" width="120" />
          <el-table-column prop="action" label="动作" width="120" />
          <el-table-column prop="targetId" label="对象ID" width="120" />
          <el-table-column prop="afterValue" label="变更内容" min-width="240" show-overflow-tooltip />
          <el-table-column prop="ip" label="来源IP" width="130" />
        </el-table>
        <div class="table-footer">
          <span>共 {{ logTotal }} 条</span>
          <el-pagination layout="prev, pager, next" :total="logTotal" :page-size="logPageSize" v-model:current-page="logPage" @current-change="loadLogs" />
        </div>
      </template>
    </section>

    <!-- 新增字典类型 -->
    <el-dialog v-model="addDictVisible" title="新增字典类型" width="400px">
      <el-form :model="dictForm" label-position="top">
        <el-form-item label="字典编码（英文大写）"><el-input v-model="dictForm.dictCode" /></el-form-item>
        <el-form-item label="字典名称"><el-input v-model="dictForm.dictName" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDictVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDict">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增字典条目 -->
    <el-dialog v-model="addItemVisible" title="新增字典条目" width="400px">
      <el-form :model="itemForm" label-position="top">
        <el-form-item label="值"><el-input v-model="itemForm.itemValue" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="itemForm.itemLabel" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="itemForm.sort" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addItemVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDictItem">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增技能 -->
    <el-dialog v-model="addSkillVisible" title="新增技能标签" width="400px">
      <el-form :model="skillForm" label-position="top">
        <el-form-item label="技能编码（英文大写，如 CABLE_FUSION）"><el-input v-model="skillForm.code" /></el-form-item>
        <el-form-item label="技能名称"><el-input v-model="skillForm.name" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addSkillVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSkill">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Lock, Plus, Refresh, RefreshLeft, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref, onMounted, watch } from 'vue'
import StatusTag from '../components/StatusTag.vue'
import { resetDemo, state, updateDictionary } from '../services/mockStore'
import { isRemoteMode, adminWriteApi } from '../services/remoteApi'
import { isSuperAdmin } from '../services/session'

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'
function token() { return localStorage.getItem('yixian-admin-token') || '' }
async function api(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(options.headers || {}) },
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(data.message || '请求失败')
  return data.data
}

const tab = ref('dictionary')

// ── 字典 ──
const dicts = ref([])
const dictKeyword = ref('')
const selectedDictCode = ref('')
const dictItems = ref([])
const itemLoading = ref(false)
const addDictVisible = ref(false)
const addItemVisible = ref(false)
const dictForm = ref({ dictCode: '', dictName: '' })
const itemForm = ref({ itemValue: '', itemLabel: '', sort: 0 })

const filteredDicts = computed(() =>
  dictKeyword.value ? dicts.value.filter(d => `${d.dictCode}${d.dictName}`.includes(dictKeyword.value)) : dicts.value
)

async function loadDicts() {
  if (isRemoteMode) {
    dicts.value = await api('/dicts')
  } else {
    const codes = [...new Set(state.dictionaries.map(d => d.group))]
    dicts.value = codes.map(c => ({ dictCode: c, dictName: c }))
  }
}

async function selectDict(code) {
  selectedDictCode.value = code
  itemLoading.value = true
  try {
    if (isRemoteMode) {
      dictItems.value = await api(`/dicts/${code}/items`)
    } else {
      dictItems.value = state.dictionaries.filter(d => d.group === code).map(d => ({ id: d.code, itemValue: d.code, itemLabel: d.label, sort: d.sort }))
    }
  } finally { itemLoading.value = false }
}

async function submitDict() {
  if (!dictForm.value.dictCode || !dictForm.value.dictName) { ElMessage.warning('请填写完整'); return }
  if (isRemoteMode) { await api('/dicts', { method: 'POST', body: JSON.stringify(dictForm.value) }) }
  else { ElMessage.info('Mock 模式不支持新增') }
  addDictVisible.value = false
  dictForm.value = { dictCode: '', dictName: '' }
  ElMessage.success('新增成功')
  await loadDicts()
}

async function deleteDict(d) {
  await ElMessageBox.confirm(`确认删除字典「${d.dictName}」及其所有条目？`, '删除', { type: 'warning' })
  if (isRemoteMode) { await api(`/dicts/${d.dictCode}`, { method: 'DELETE' }) }
  if (selectedDictCode.value === d.dictCode) { selectedDictCode.value = ''; dictItems.value = [] }
  ElMessage.success('删除成功')
  await loadDicts()
}

async function submitDictItem() {
  if (!itemForm.value.itemValue || !itemForm.value.itemLabel) { ElMessage.warning('请填写完整'); return }
  if (isRemoteMode) { await api(`/dicts/${selectedDictCode.value}/items`, { method: 'POST', body: JSON.stringify(itemForm.value) }) }
  addItemVisible.value = false
  itemForm.value = { itemValue: '', itemLabel: '', sort: 0 }
  ElMessage.success('新增成功')
  await selectDict(selectedDictCode.value)
}

async function deleteDictItem(row) {
  await ElMessageBox.confirm('确认删除该条目？', '删除', { type: 'warning' })
  if (isRemoteMode) { await api(`/dicts/${selectedDictCode.value}/items/${row.id}`, { method: 'DELETE' }) }
  ElMessage.success('删除成功')
  await selectDict(selectedDictCode.value)
}

// ── 技能 ──
const skills = ref([])
const skillLoading = ref(false)
const skillKeyword = ref('')
const addSkillVisible = ref(false)
const skillForm = ref({ code: '', name: '' })

const filteredSkills = computed(() =>
  skillKeyword.value ? skills.value.filter(s => s.name.includes(skillKeyword.value) || s.code.includes(skillKeyword.value)) : skills.value
)

async function loadSkills() {
  skillLoading.value = true
  try {
    if (isRemoteMode) { skills.value = await api('/skills') }
    else { skills.value = state.people.flatMap(p => p.skills || []).filter((s, i, a) => a.findIndex(x => x.code === s.code) === i) }
  } finally { skillLoading.value = false }
}

async function submitSkill() {
  if (!skillForm.value.code || !skillForm.value.name) { ElMessage.warning('请填写完整'); return }
  if (isRemoteMode) { await api('/skills', { method: 'POST', body: JSON.stringify(skillForm.value) }) }
  addSkillVisible.value = false
  skillForm.value = { code: '', name: '' }
  ElMessage.success('新增成功')
  await loadSkills()
}

async function deleteSkill(row) {
  await ElMessageBox.confirm(`确认删除技能「${row.name}」？`, '删除', { type: 'warning' })
  if (isRemoteMode) { await api(`/skills/${row.id}`, { method: 'DELETE' }) }
  ElMessage.success('删除成功')
  await loadSkills()
}

// ── 操作日志 ──
const logs = ref([])
const logLoading = ref(false)
const logKeyword = ref('')
const logModule = ref('')
const logPage = ref(1)
const logPageSize = 20
const logTotal = ref(0)

const logModules = computed(() => [...new Set(logs.value.map(l => l.module).filter(Boolean))])
const filteredLogs = computed(() =>
  logs.value
    .filter(l => !logKeyword.value || `${l.operatorName}${l.module}${l.action}`.includes(logKeyword.value))
    .filter(l => !logModule.value || l.module === logModule.value)
)

async function loadLogs() {
  logLoading.value = true
  try {
    if (isRemoteMode) {
      const data = await api(`/logs?pageNo=${logPage.value}&pageSize=${logPageSize}`)
      logs.value = data.list
      logTotal.value = data.total
    } else {
      logs.value = state.logs.map(l => ({ createTime: l.time, operatorName: l.operator, module: l.module, action: l.action, targetId: l.objectNo, afterValue: l.summary, ip: l.ip }))
      logTotal.value = logs.value.length
    }
  } finally { logLoading.value = false }
}

function reload() {
  if (tab.value === 'dictionary') loadDicts()
  else if (tab.value === 'skills') loadSkills()
  else loadLogs()
}

async function restoreDemo() {
  await ElMessageBox.confirm('将恢复初始演示数据。', '复位演示数据', { confirmButtonText: '确认复位', cancelButtonText: '取消', type: 'warning' })
  resetDemo()
  ElMessage.success('演示数据已恢复')
  reload()
}

onMounted(async () => {
  await loadDicts()
  await loadSkills()
  await loadLogs()
})
</script>
