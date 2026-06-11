<template>
  <div>
    <a-typography-title :level="4">三色晾晒看板</a-typography-title>
    <a-alert message="5号（王默涵）负责实现此模块" type="info" show-icon style="margin-bottom:16px"/>
    <a-row :gutter="16" style="margin-bottom:16px">
      <a-col :span="6"><a-card><a-statistic title="🔴 超时任务" :value="0" value-style="{color:'#f5222d'}"/></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="🟡 临期任务" :value="0" value-style="{color:'#faad14'}"/></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="🟢 正常任务" :value="0" value-style="{color:'#52c41a'}"/></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="⚪ 待派单" :value="0" /></a-card></a-col>
    </a-row>
    <a-table :columns="columns" :data-source="[]" />
  </div>
</template>
<script setup>
const columns = [
  { title: '任务编号', dataIndex: 'taskNo' },
  { title: '类型',     dataIndex: 'type' },
  { title: '执行人',   dataIndex: 'assigneeName' },
  { title: '期望完成', dataIndex: 'expectedFinishTime' },
  { title: '剩余时长', dataIndex: 'remainTime' },
  { title: '状态',     dataIndex: 'colorStatus' },
]
</script>
