<template>
  <div class="stat-card" :class="{ clickable }" @click="$emit('click')">
    <div class="stat-card__top">
      <span>{{ label }}</span>
      <span class="stat-icon" :style="{ color, background: `${color}14` }">
        <component :is="icon" />
      </span>
    </div>
    <div class="stat-card__value">{{ value }}<small v-if="unit">{{ unit }}</small></div>
    <div class="stat-card__footer">
      <span :class="trendClass">{{ trend }}</span>
      <span>{{ note }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  unit: String,
  trend: String,
  note: String,
  color: { type: String, default: '#2563eb' },
  icon: [Object, Function],
  clickable: Boolean,
  trendClass: { type: String, default: '' },
})
defineEmits(['click'])
</script>
