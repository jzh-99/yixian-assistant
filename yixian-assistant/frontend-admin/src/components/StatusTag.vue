<template>
  <el-tag :type="meta.type" :effect="soft ? 'light' : 'plain'" round>
    <span v-if="dot" class="status-dot" :style="{ background: meta.color }" />
    {{ meta.label }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: String, default: '' },
  dot: { type: Boolean, default: false },
  soft: { type: Boolean, default: true },
})

const map = {
  PENDING: { label: '待审批', type: 'warning', color: '#f59e0b' },
  APPROVED: { label: '已通过', type: 'success', color: '#10b981' },
  REJECTED: { label: '已驳回', type: 'danger', color: '#ef4444' },
  UNASSIGNED: { label: '待派单', type: 'warning', color: '#f59e0b' },
  PENDING_ACCEPTANCE: { label: '待接单', type: 'primary', color: '#3b82f6' },
  ACCEPTED: { label: '已接单', type: 'primary', color: '#3b82f6' },
  IN_PROGRESS: { label: '进行中', type: 'primary', color: '#0ea5e9' },
  COMPLETED: { label: '已完成', type: 'success', color: '#10b981' },
  CANCELLED: { label: '已取消', type: 'info', color: '#94a3b8' },
  ENABLED: { label: '启用', type: 'success', color: '#10b981' },
  DISABLED: { label: '停用', type: 'info', color: '#94a3b8' },
  RED: { label: '已超时', type: 'danger', color: '#ef4444' },
  YELLOW: { label: '临近到期', type: 'warning', color: '#f59e0b' },
  GREEN: { label: '正常', type: 'success', color: '#10b981' },
  GRAY: { label: '时间缺失', type: 'info', color: '#94a3b8' },
  SUCCESS: { label: '成功', type: 'success', color: '#10b981' },
}

const meta = computed(() => map[props.value] || { label: props.value || '-', type: 'info', color: '#94a3b8' })
</script>
