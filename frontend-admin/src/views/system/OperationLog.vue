<template>
  <div>
    <a-typography-title :level="4">操作日志</a-typography-title>
    <a-form layout="inline" style="margin-bottom:16px" @finish="loadLogs">
      <a-form-item><a-input v-model:value="filter.operatorName" placeholder="操作人" allow-clear style="width:120px"/></a-form-item>
      <a-form-item><a-input v-model:value="filter.module" placeholder="模块" allow-clear style="width:120px"/></a-form-item>
      <a-form-item><a-input v-model:value="filter.action" placeholder="动作" allow-clear style="width:120px"/></a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">查询</a-button>
        <a-button style="margin-left:8px" @click="resetFilter">重置</a-button>
      </a-form-item>
    </a-form>

    <a-table
      :columns="columns"
      :data-source="logs"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      size="middle"
      @change="onTableChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import http from '@/utils/http'

const logs    = ref([])
const loading = ref(false)
const filter  = reactive({ operatorName: '', module: '', action: '' })
const pagination = reactive({ current: 1, pageSize: 20, total: 0, showTotal: t => `共 ${t} 条` })

const columns = [
  { title: '时间',   dataIndex: 'createTime', width: 160 },
  { title: '操作人', dataIndex: 'operatorName', width: 90 },
  { title: '模块',   dataIndex: 'module', width: 100 },
  { title: '动作',   dataIndex: 'action', width: 100 },
  { title: '对象ID', dataIndex: 'targetId', width: 100 },
  { title: 'IP',     dataIndex: 'ip', width: 120 },
  { title: '变更内容', dataIndex: 'afterValue', ellipsis: true },
]

onMounted(loadLogs)

async function loadLogs() {
  loading.value = true
  try {
    const data = await http.get('/logs', {
      params: {
        pageNo: pagination.current,
        pageSize: pagination.pageSize,
        ...filter
      }
    })
    logs.value          = data.list
    pagination.total    = data.total
  } finally {
    loading.value = false
  }
}

function onTableChange(page) {
  pagination.current  = page.current
  pagination.pageSize = page.pageSize
  loadLogs()
}

function resetFilter() {
  Object.assign(filter, { operatorName: '', module: '', action: '' })
  pagination.current = 1
  loadLogs()
}
</script>
