<script setup lang="ts">
/**
 * Header — Top bar component (Light mode only)
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useSerial } from '../composables/useSerial'
import { useSensorData } from '../composables/useSensorData'

const { isConnected, currentPort } = useSerial()
const { lastUpdateFormatted, dataReceived } = useSensorData()

const networkIP = ref<string | null>(null)
const networkIface = ref<string | null>(null)
let ipRefreshTimer: ReturnType<typeof setInterval> | null = null

async function fetchNetworkIP(): Promise<void> {
  try {
    const result = await window.api.system.getNetworkIP()
    networkIP.value = result.ip
    networkIface.value = result.iface
  } catch {
    networkIP.value = null
    networkIface.value = null
  }
}

onMounted(() => {
  fetchNetworkIP()
  ipRefreshTimer = setInterval(fetchNetworkIP, 30000)
})

onUnmounted(() => {
  if (ipRefreshTimer) {
    clearInterval(ipRefreshTimer)
    ipRefreshTimer = null
  }
})

async function handleClose(): Promise<void> {
  await window.api.windowControls.close()
}
</script>

<template>
  <header class="w-full h-auto lg:h-14 py-2 lg:py-0 backdrop-blur-xl border-b-2 px-3 lg:px-4 flex flex-col lg:flex-row items-center justify-between gap-2 transition-all duration-300 z-50 bg-white/90 border-slate-200">
    <!-- Left: Page title & Logo -->
    <div class="flex items-center gap-2 lg:gap-3 w-full lg:w-auto">
      <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 p-[1.5px] shadow-md">
        <div class="w-full h-full rounded-md flex items-center justify-center bg-slate-800">
          <svg class="w-5 h-5 text-teal-400 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <h2 class="text-lg lg:text-xl xl:text-2xl font-black tracking-tighter drop-shadow-sm uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500">
        AQUA<span class="text-teal-500">PHONIK</span>
      </h2>
      <!-- Live indicator & Time -->
      <div class="ml-1 lg:ml-2 flex items-center gap-2 px-2 py-1 lg:px-4 lg:py-1.5 rounded-full shadow-inner bg-slate-100 border border-slate-200">
        <span
          class="w-2 h-2 rounded-full transition-all"
          :class="dataReceived ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'"
          :style="dataReceived ? 'box-shadow: 0 0 8px rgba(16,185,129,0.6)' : ''"
        ></span>
        <span class="text-[10px] md:text-xs font-mono font-bold tracking-widest text-slate-600">
          {{ isConnected ? lastUpdateFormatted : 'OFFLINE' }}
        </span>
      </div>

      <!-- WiFi IP Address -->
      <div class="ml-1 lg:ml-2 flex items-center gap-2 px-2 py-1 lg:px-3 lg:py-1.5 rounded-full border shadow-inner transition-all duration-300"
        :class="networkIP ? 'bg-teal-50 border-teal-200' : 'bg-slate-100 border-slate-200'">
        <svg class="w-3.5 h-3.5 transition-colors"
             :class="networkIP ? 'text-teal-500' : 'text-slate-400'"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        <span v-if="networkIP" class="text-[10px] md:text-xs font-mono font-bold tracking-wide text-teal-600">
          {{ networkIP }}
        </span>
        <span v-else class="text-[10px] md:text-xs font-mono font-bold tracking-wide text-slate-400">
          No Network
        </span>
      </div>
    </div>

    <!-- Right: Connection Status & Window controls -->
    <div class="flex flex-wrap items-center justify-center lg:justify-end gap-1.5 lg:gap-2 w-full lg:w-auto">
      <!-- Status dot -->
      <div class="flex items-center gap-2 ml-1">
        <span :class="isConnected ? 'status-dot-connected' : 'status-dot-disconnected'"></span>
        <div class="flex flex-col">
          <span class="text-[10px] font-medium" :class="isConnected ? 'text-emerald-600' : 'text-slate-400'">
            {{ isConnected ? 'Connected' : 'Disconnected' }}
          </span>
          <span v-if="isConnected" class="text-[9px] font-mono text-slate-400">{{ currentPort }}</span>
        </div>
      </div>

      <!-- Window Controls -->
      <div class="flex items-center gap-1.5 ml-2 pl-3 border-l-2 border-slate-200">
        <button
          @click="handleClose"
          class="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 bg-white/80 border-slate-200 text-slate-400 hover:text-white hover:bg-red-500 hover:border-red-400 shadow-sm"
          title="Tutup & Sembunyikan (Background Tetap Jalan)"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>
