<template>
  <div>
    <a-row :gutter="16" style="margin-bottom:24px">
      <a-col :span="6" v-for="card in cards" :key="card.label">
        <a-card>
          <a-statistic :title="card.label" :value="card.value" :value-style="{color: card.color}" />
        </a-card>
      </a-col>
    </a-row>
    <a-alert
      message="欢迎使用翼线助手后台管理系统"
      description="请从左侧菜单进入各功能模块。点击右下角机器人图标可使用 AI④ 管理智脑。"
      type="info"
      show-icon
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '@/utils/http'

const cards = ref([
  { label: '待审批', value: '-', color: '#1677ff' },
  { label: '待派单', value: '-', color: '#faad14' },
  { label: '进行中任务', value: '-', color: '#52c41a' },
  { label: '今日完成', value: '-', color: '#722ed1' },
])

onMounted(async () => {
  try {
    const data = await http.get('/monitor/summary')
    cards.value[0].value = data.pending   ?? '-'
    cards.value[1].value = data.unassigned ?? '-'
    cards.value[2].value = data.inProgress ?? '-'
    cards.value[3].value = data.completedToday ?? '-'
  } catch {
    // 接口未就绪时保持 '-'
  }
})
</script>
