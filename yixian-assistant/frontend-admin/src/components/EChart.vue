<template>
  <div ref="chartEl" class="echart-canvas" />
</template>

<script setup>
import { BarChart, FunnelChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, GraphicComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

echarts.use([
  BarChart,
  FunnelChart,
  LineChart,
  PieChart,
  GridComponent,
  GraphicComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
])

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '300px' },
})

const chartEl = ref()
let chart
let observer

function render() {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value)
  chart.setOption(props.option, true)
}

onMounted(async () => {
  chartEl.value.style.height = props.height
  await nextTick()
  render()
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(chartEl.value)
})

watch(() => props.option, render, { deep: true })

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
})
</script>
