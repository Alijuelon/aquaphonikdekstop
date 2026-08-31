<script setup lang="ts">
/**
 * Header — Top bar component
 * Glassmorphism header with serial connection controls and theme toggle.
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useSerial } from '../composables/useSerial'
import { useSensorData } from '../composables/useSensorData'
import { useTheme } from '../composables/useTheme'

const { isConnected, currentPort } = useSerial()
const { lastUpdateFormatted, dataReceived } = useSensorData()
const { isDarkMode, toggleTheme } = useTheme()
const isPoweringOff = ref(false)

/**
 * Matikan tampilan aplikasi. Konfirmasi ditampilkan oleh main process
 * (native dialog) supaya tidak sengaja tertekan di layar sentuh.
 * Proses background (serial, database, server mobile) tetap berjalan;
 * nyalakan kembali lewat saklar fisik, ikon tray, atau Ctrl+Alt+P.
 */
async function handlePowerOff(): Promise<void> {
  if (isPoweringOff.value) return
  isPoweringOff.value = true
  try {
    await window.api.power.turnOff()
  } finally {
    isPoweringOff.value = false
  }
}

const networkIP = ref<string | null>(null)
const networkIface = ref<string | null>(null)
let ipRefreshTimer: ReturnType<typeof setInterval> | null = null

// Fetch WiFi IP on mount and refresh every 30 seconds
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

// Window Controls
async function handleMinimize(): Promise<void> {
  await window.api.windowControls.minimize()
}

async function handleClose(): Promise<void> {
  await window.api.windowControls.close()
}
</script>

<template>
  <header class="w-full h-auto lg:h-14 py-2 lg:py-0 backdrop-blur-xl border-b-2 px-3 lg:px-4 flex flex-col lg:flex-row items-center justify-between gap-2 transition-all duration-300 z-50"
          :class="isDarkMode ? 'bg-slate-950/80 border-white/20' : 'bg-white/90 border-slate-200'">
    <!-- Left: Page title & Logo -->
    <div class="flex items-center gap-2 lg:gap-3 w-full lg:w-auto">
      <!-- App Logo -->
      <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-green/50 p-[1.5px]"
           :class="isDarkMode ? 'shadow-[0_0_15px_rgba(51,238,255,0.3)]' : 'shadow-md'">
        <div class="w-full h-full rounded-md flex items-center justify-center"
             :class="isDarkMode ? 'bg-black/90' : 'bg-slate-800'">
          <svg class="w-5 h-5 text-neon-cyan drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <h2 class="text-lg lg:text-xl xl:text-2xl font-black tracking-tighter drop-shadow-sm uppercase"
          :class="isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500'">
        AQUA<span class="drop-shadow-[0_0_8px_rgba(51,238,255,0.8)]" :class="isDarkMode ? 'text-neon-cyan' : 'text-teal-500'">PHONIK</span>
      </h2>
      <!-- Live indicator & Time -->
      <div class="ml-1 lg:ml-2 flex items-center gap-2 px-2 py-1 lg:px-4 lg:py-1.5 rounded-full shadow-inner"
           :class="isDarkMode ? 'bg-black/40 border border-white/10' : 'bg-slate-100 border border-slate-200'">
        <span
          class="w-2 h-2 rounded-full transition-all"
          :class="dataReceived
            ? (isDarkMode ? 'bg-neon-green animate-pulse' : 'bg-emerald-500 animate-pulse')
            : (isDarkMode ? 'bg-slate-400' : 'bg-slate-300')"
          :style="dataReceived ? (isDarkMode ? 'box-shadow: 0 0 10px rgba(57,255,20,0.8)' : 'box-shadow: 0 0 8px rgba(16,185,129,0.6)') : ''"
        ></span>
        <span class="text-[10px] md:text-xs font-mono font-bold tracking-widest"
              :class="isDarkMode ? 'text-white' : 'text-slate-600'">
          {{ isConnected ? lastUpdateFormatted : 'OFFLINE' }}
        </span>
      </div>

      <!-- WiFi IP Address -->
      <div class="ml-1 lg:ml-2 flex items-center gap-2 px-2 py-1 lg:px-3 lg:py-1.5 rounded-full border shadow-inner transition-all duration-300"
        :class="networkIP
          ? (isDarkMode ? 'bg-neon-cyan/5 border-neon-cyan/20' : 'bg-teal-50 border-teal-200')
          : (isDarkMode ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200')"
      >
        <!-- WiFi Icon -->
        <svg class="w-3.5 h-3.5 transition-colors"
             :class="networkIP ? (isDarkMode ? 'text-neon-cyan' : 'text-teal-500') : (isDarkMode ? 'text-slate-500' : 'text-slate-400')"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        <span v-if="networkIP" class="text-[10px] md:text-xs font-mono font-bold tracking-wide"
              :class="isDarkMode ? 'text-neon-cyan' : 'text-teal-600'"
              :style="isDarkMode ? 'text-shadow: 0 0 8px rgba(51,238,255,0.4)' : ''">
          {{ networkIP }}
        </span>
        <span v-else class="text-[10px] md:text-xs font-mono font-bold tracking-wide"
              :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'">
          No Network
        </span>
      </div>
    </div>

    <!-- Right: Theme Toggle, Power ON/OFF, Connection Status & Window controls -->
    <div class="flex flex-wrap items-center justify-center lg:justify-end gap-1.5 lg:gap-2 w-full lg:w-auto">

      <!-- Theme Toggle Button -->
      <button
        @click="toggleTheme"
        class="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300"
        :class="isDarkMode
          ? 'bg-black/40 border-white/10 text-amber-400 hover:bg-amber-400/20 hover:border-amber-400/40 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]'
          : 'bg-white/80 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300 shadow-sm'"
        :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <!-- Sun icon (show in dark mode = switch to light) -->
        <svg v-if="isDarkMode" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <!-- Moon icon (show in light mode = switch to dark) -->
        <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>

      <!-- Power ON/OFF (matikan tampilan aplikasi, proses background tetap berjalan) -->
      <button
        @click="handlePowerOff"
        :disabled="isPoweringOff"
        class="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        :class="isDarkMode
          ? 'bg-black/40 border-white/10 text-neon-green/70 hover:text-white hover:bg-neon-green/20 hover:border-neon-green/40 hover:shadow-[0_0_15px_rgba(57,255,20,0.4)]'
          : 'bg-white/80 border-slate-200 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm'"
        title="Matikan Tampilan Aplikasi (proses background tetap berjalan)"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
          <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
      </button>

      <!-- Status dot -->
      <div class="flex items-center gap-2 ml-1">
        <span :class="isConnected ? 'status-dot-connected' : 'status-dot-disconnected'"></span>
        <div class="flex flex-col">
          <span class="text-[10px] font-medium"
                :class="isConnected
                  ? (isDarkMode ? 'text-neon-green/80' : 'text-emerald-600')
                  : (isDarkMode ? 'text-white/30' : 'text-slate-400')">
            {{ isConnected ? 'Connected' : 'Disconnected' }}
          </span>
          <span v-if="isConnected" class="text-[9px] font-mono"
                :class="isDarkMode ? 'text-white/30' : 'text-slate-400'">{{ currentPort }}</span>
        </div>
      </div>

      <!-- Window Controls -->
      <div class="flex items-center gap-1.5 ml-2 pl-3 border-l-2"
           :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
        <button
          @click="handleMinimize"
          class="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200"
          :class="isDarkMode
            ? 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            : 'bg-white/80 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 shadow-sm'"
          title="Minimize"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          @click="handleClose"
          class="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200"
          :class="isDarkMode
            ? 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-neon-red/80 hover:border-neon-red/50 hover:shadow-[0_0_15px_rgba(255,23,68,0.5)]'
            : 'bg-white/80 border-slate-200 text-slate-400 hover:text-white hover:bg-red-500 hover:border-red-400 shadow-sm'"
          title="Exit"
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