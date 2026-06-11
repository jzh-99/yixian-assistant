<template>
  <div>
    <a-typography-title :level="4">派单中心</a-typography-title>
    <a-alert message="4号（戈世奇）负责实现此模块" type="info" show-icon style="margin-bottom:16px"/>
    <a-table :columns="columns" :data-source="[]" />
  </div>
</template>
<script setup>
const columns = [
  { title: '任务编号', dataIndex: 'taskNo' },
  { title: '任务类型', dataIndex: 'type' },
  { title: '当前状态', dataIndex: 'status' },
  { title: 'AI推荐人', dataIndex: 'aiCandidate' },
  { title: 'AI推荐理由', dataIndex: 'aiReason' },
  { title: '操作',     dataIndex: 'action' },
]
</script>
