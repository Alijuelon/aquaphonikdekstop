<script setup lang="ts">
/**
 * GaugeChart — Futuristic ECharts Gauge component
 * Renders a half-circle/donut gauge with neon glow effects.
 * Supports Light/Dark theme.
 */
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { GaugeChart as EGaugeChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
use([EGaugeChart, CanvasRenderer])

const props = defineProps<{
  title: string
  value: number
  unit: string
  min: number
  max: number
  color?: string
  size?: number
}>()

/**
 * Get color based on color prop name and theme
 */
function getColor(c?: string): string {
  switch (c) {
    case 'green': return '#10b981'
    case 'cyan': return '#06b6d4'
    case 'amber': return '#f59e0b'
    case 'rose': return '#f43f5e'
    case 'blue': return '#3b82f6'
    case 'violet': return '#8b5cf6'
    default: return '#10b981'
  }
}

const gaugeOption = computed(() => {
  const activeColor = getColor(props.color)
  const pct = Math.min(1, Math.max(0, (props.value - props.min) / (props.max - props.min)))

  // Scale font sizes proportionally to the component size
  const sz = props.size || 160
  const detailFontSize = Math.max(16, Math.round(sz * 0.2))
  const titleFontSize = Math.max(9, Math.round(sz * 0.088))
  const lineWidth = Math.max(10, Math.round(sz * 0.125))

  const trackColor = 'rgba(0, 0, 0, 0.08)'
  const titleColor = '#334155'

  return {
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        radius: '90%',
        center: ['50%', '55%'],
        min: props.min,
        max: props.max,
        splitNumber: 4,
        axisLine: {
          lineStyle: {
            width: lineWidth,
            color: [
              [pct, activeColor],
              [1, trackColor]
            ]
          },
          roundCap: true
        },
        progress: {
          show: true,
          width: lineWidth,
          roundCap: true,
          itemStyle: {
            color: activeColor,
            shadowColor: activeColor,
            shadowBlur: Math.round(sz * 0.06)
          }
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: {
          show: true,
          offsetCenter: [0, '80%'],
          fontSize: titleFontSize,
          fontFamily: 'Inter',
          fontWeight: 800,
          color: titleColor
        },
        detail: {
          valueAnimation: true,
          fontSize: detailFontSize,
          fontFamily: 'Inter',
          fontWeight: 800,
          color: activeColor,
          offsetCenter: [0, '25%'],
          formatter: function (value: number) {
            return value.toFixed(1)
          }
        },
        data: [
          {
            value: props.value,
            name: `${props.title} (${props.unit})`
          }
        ]
      }
    ]
  }
})
</script>

<template>
  <div class="relative flex flex-col items-center">
    <div class="echarts-gauge-container" :style="{ width: `${size || 160}px`, height: `${size || 160}px` }">
      <VChart :option="gaugeOption" autoresize :style="{ width: '100%', height: '100%' }" />
    </div>
  </div>
</template>
