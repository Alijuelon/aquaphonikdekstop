<script setup lang="ts">
/**
 * SensorChart — Real-time line chart for sensor data trends
 * Uses Chart.js with vue-chartjs for rendering.
 * Supports Light/Dark theme.
 */
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useTheme } from '../composables/useTheme'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const { isDarkMode } = useTheme()

const props = defineProps<{
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color: string
  }>
  title?: string
}>()

const activeDatasets = ref<Set<number>>(new Set(props.datasets.map((_, i) => i)))

function toggleDataset(index: number): void {
  if (activeDatasets.value.has(index)) {
    if (activeDatasets.value.size > 1) {
      activeDatasets.value.delete(index)
    }
  } else {
    activeDatasets.value.add(index)
  }
}

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets
    .filter((_, i) => activeDatasets.value.has(i))
    .map((ds) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color,
      backgroundColor: ds.color.replace('1)', '0.3)').replace('rgb(', 'rgba('),
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: ds.color,
      pointHoverBorderColor: isDarkMode.value ? '#fff' : '#1e293b',
      pointHoverBorderWidth: 3,
      tension: 0.4,
      fill: true
    }))
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: isDarkMode.value ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      titleColor: isDarkMode.value ? '#f8fafc' : '#1e293b',
      bodyColor: isDarkMode.value ? '#cbd5e1' : '#475569',
      borderColor: isDarkMode.value ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 16,
      titleFont: {
        family: 'Inter',
        size: 16,
        weight: '700' as const
      },
      bodyFont: {
        family: 'Inter',
        size: 14,
        weight: '500' as const
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: isDarkMode.value ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)',
        drawBorder: false
      },
      ticks: {
        color: isDarkMode.value ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
        font: {
          family: 'Inter',
          size: 13,
          weight: '500' as const
        },
        maxTicksLimit: 8
      }
    },
    y: {
      grid: {
        color: isDarkMode.value ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)',
        drawBorder: false
      },
      ticks: {
        color: isDarkMode.value ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
        font: {
          family: 'Inter',
          size: 13,
          weight: '500' as const
        }
      }
    }
  },
  animation: {
    duration: 300
  }
}))
</script>

<template>
  <div class="chart-container flex flex-col h-full">
    <!-- Chart title & legend -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-base font-bold uppercase tracking-widest transition-colors"
          :class="isDarkMode ? 'text-white' : 'text-slate-700'">
        {{ title || 'Sensor Trends' }}
      </h3>
      <div class="flex flex-wrap items-center gap-2 md:gap-3">
        <button v-for="(ds, index) in datasets" :key="ds.label"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 border"
          :class="activeDatasets.has(index)
            ? (isDarkMode ? 'bg-white/20 text-white shadow-md border-white/10' : 'bg-slate-100 text-slate-700 shadow-sm border-slate-200')
            : (isDarkMode ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border-white/10' : 'bg-white/60 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-slate-200')"
          @click="toggleDataset(index)">
          <span class="w-3 h-3 rounded-full shadow-inner"
            :style="{ backgroundColor: ds.color, opacity: activeDatasets.has(index) ? 1 : 0.3 }"></span>
          {{ ds.label }}
        </button>
      </div>
    </div>

    <!-- Chart -->
    <div class="flex-1 min-h-[240px]">
      <Line :data="chartData as any" :options="chartOptions as any" />
    </div>
  </div>
</template>
