<template>
  <div>
    <a-typography-title :level="4">字典管理</a-typography-title>

    <a-row :gutter="16">
      <!-- 左：字典类型列表 -->
      <a-col :span="8">
        <a-card title="字典类型" :extra="canEdit ? '新增' : null" size="small">
          <template #extra>
            <a-button v-if="canEdit" type="link" size="small" @click="showAddDict = true">新增</a-button>
          </template>
          <a-list :data-source="dicts" :loading="loading">
            <template #renderItem="{ item }">
              <a-list-item
                :class="{ active: selected?.dictCode === item.dictCode }"
                style="cursor:pointer; padding:8px 12px"
                @click="selectDict(item)"
              >
                <span>{{ item.dictName }}</span>
                <template #actions>
                  <a v-if="canEdit" @click.stop="deleteDict(item)">删除</a>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>

      <!-- 右：字典条目 -->
      <a-col :span="16">
        <a-card :title="selected ? `${selected.dictName} 的条目` : '请选择字典类型'" size="small">
          <template #extra>
            <a-button v-if="canEdit && selected" type="primary" size="small" @click="showAddItem = true">
              新增条目
            </a-button>
          </template>
          <a-table
            :columns="itemColumns"
            :data-source="items"
            :loading="itemLoading"
            size="small"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'action'">
                <a-popconfirm title="确认删除？" @confirm="deleteItem(record)">
                  <a v-if="canEdit" style="color:red">删除</a>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- 新增字典弹窗 -->
    <a-modal v-model:open="showAddDict" title="新增字典类型" @ok="submitDict">
      <a-form :model="dictForm" layout="vertical">
        <a-form-item label="字典编码"><a-input v-model:value="dictForm.dictCode" /></a-form-item>
        <a-form-item label="字典名称"><a-input v-model:value="dictForm.dictName" /></a-form-item>
      </a-form>
    </a-modal>

    <!-- 新增条目弹窗 -->
    <a-modal v-model:open="showAddItem" title="新增字典条目" @ok="submitItem">
      <a-form :model="itemForm" layout="vertical">
        <a-form-item label="值"><a-input v-model:value="itemForm.itemValue" /></a-form-item>
        <a-form-item label="标签"><a-input v-model:value="itemForm.itemLabel" /></a-form-item>
        <a-form-item label="排序"><a-input-number v-model:value="itemForm.sort" :min="0" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import http from '@/utils/http'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const canEdit = computed(() => auth.isAdmin())

const dicts       = ref([])
const loading     = ref(false)
const selected    = ref(null)
const items       = ref([])
const itemLoading = ref(false)
const showAddDict = ref(false)
const showAddItem = ref(false)
const dictForm    = ref({ dictCode: '', dictName: '' })
const itemForm    = ref({ itemValue: '', itemLabel: '', sort: 0 })

const itemColumns = [
  { title: '值',   dataIndex: 'itemValue' },
  { title: '标签', dataIndex: 'itemLabel' },
  { title: '排序', dataIndex: 'sort' },
  { title: '操作', dataIndex: 'action' },
]

onMounted(loadDicts)

async function loadDicts() {
  loading.value = true
  try { dicts.value = await http.get('/dicts') } finally { loading.value = false }
}

async function selectDict(item) {
  selected.value   = item
  itemLoading.value = true
  try { items.value = await http.get(`/dicts/${item.dictCode}/items`) } finally { itemLoading.value = false }
}

async function submitDict() {
  await http.post('/dicts', dictForm.value)
  message.success('新增成功')
  showAddDict.value = false
  dictForm.value = { dictCode: '', dictName: '' }
  loadDicts()
}

async function deleteDict(item) {
  await http.delete(`/dicts/${item.dictCode}`)
  message.success('删除成功')
  if (selected.value?.dictCode === item.dictCode) { selected.value = null; items.value = [] }
  loadDicts()
}

async function submitItem() {
  await http.post(`/dicts/${selected.value.dictCode}/items`, itemForm.value)
  message.success('新增成功')
  showAddItem.value = false
  itemForm.value = { itemValue: '', itemLabel: '', sort: 0 }
  selectDict(selected.value)
}

async function deleteItem(record) {
  await http.delete(`/dicts/${selected.value.dictCode}/items/${record.id}`)
  message.success('删除成功')
  selectDict(selected.value)
}
</script>

<style scoped>
.active { background: #e6f4ff; border-radius: 4px; }
</style>
