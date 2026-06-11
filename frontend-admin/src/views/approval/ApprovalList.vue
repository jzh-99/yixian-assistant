<template>
  <div>
    <a-typography-title :level="4">审批中心</a-typography-title>
    <a-alert message="2号（程言欣）负责实现此模块" type="info" show-icon style="margin-bottom:16px"/>
    <a-table :columns="columns" :data-source="[]" />
  </div>
</template>
<script setup>
const columns = [
  { title: '申请单号', dataIndex: 'appNo' },
  { title: '类型',     dataIndex: 'type' },
  { title: '申请人',   dataIndex: 'applicantName' },
  { title: '提交时间', dataIndex: 'createTime' },
  { title: '状态',     dataIndex: 'status' },
  { title: '操作',     dataIndex: 'action' },
]
</script>
