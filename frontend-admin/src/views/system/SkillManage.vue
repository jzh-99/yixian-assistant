<template>
  <div>
    <a-typography-title :level="4">技能标签管理</a-typography-title>
    <a-space style="margin-bottom:16px">
      <a-input v-model:value="search" placeholder="搜索技能名称" allow-clear style="width:200px" />
      <a-button type="primary" @click="showAdd = true">新增技能</a-button>
    </a-space>

    <a-table :columns="columns" :data-source="filtered" :loading="loading" row-key="id" size="middle">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'action'">
          <a-popconfirm title="确认删除该技能标签？" @confirm="deleteSkill(record.id)">
            <a style="color:red">删除</a>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="showAdd" title="新增技能标签" @ok="submitSkill">
      <a-form :model="form" layout="vertical">
        <a-form-item label="技能编码（英文大写，如 CABLE_FUSION）">
          <a-input v-model:value="form.code" />
        </a-form-item>
        <a-form-item label="技能名称">
          <a-input v-model:value="form.name" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import http from '@/utils/http'

const skills  = ref([])
const loading = ref(false)
const search  = ref('')
const showAdd = ref(false)
const form    = ref({ code: '', name: '' })

const columns = [
  { title: '技能编码', dataIndex: 'code' },
  { title: '技能名称', dataIndex: 'name' },
  { title: '操作',     dataIndex: 'action' },
]

const filtered = computed(() =>
  search.value
    ? skills.value.filter(s => s.name.includes(search.value) || s.code.includes(search.value))
    : skills.value
)

onMounted(loadSkills)

async function loadSkills() {
  loading.value = true
  try { skills.value = await http.get('/skills') } finally { loading.value = false }
}

async function submitSkill() {
  if (!form.value.code || !form.value.name) { message.warning('请填写完整'); return }
  await http.post('/skills', form.value)
  message.success('新增成功')
  showAdd.value = false
  form.value = { code: '', name: '' }
  loadSkills()
}

async function deleteSkill(id) {
  await http.delete(`/skills/${id}`)
  message.success('删除成功')
  loadSkills()
}
</script>
