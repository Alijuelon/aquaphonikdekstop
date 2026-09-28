<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme'

const { isDarkMode } = useTheme()

const portStatus = ref({ connected: false, port: '' })
const rawData = ref<any[]>([])
const errorLogs = ref<string[]>([])
const maxLogs = 50

onMounted(async () => {
  // Get initial status
  // @ts-ignore
  const status = await window.electron.ipcRenderer.invoke('serial:get-status')
  portStatus.value = status

  // Listeners
  // @ts-ignore
  window.electron.ipcRenderer.on('serial:status', (_, status) => {
    portStatus.value = status
  })

  // @ts-ignore
  window.electron.ipcRenderer.on('serial:data', (_, data) => {
    rawData.value.unshift(data)
    if (rawData.value.length > maxLogs) {
      rawData.value.pop()
    }
  })

  // @ts-ignore
  window.electron.ipcRenderer.on('serial:error', (_, error) => {
    errorLogs.value.unshift(`[${new Date().toLocaleTimeString()}] ${error.message}`)
    if (errorLogs.value.length > maxLogs) {
      errorLogs.value.pop()
    }
  })
})

onUnmounted(() => {
  // @ts-ignore
  window.electron.ipcRenderer.removeAllListeners('serial:status')
  // @ts-ignore
  window.electron.ipcRenderer.removeAllListeners('serial:data')
  // @ts-ignore
  window.electron.ipcRenderer.removeAllListeners('serial:error')
})

function clearLogs() {
  rawData.value = []
  errorLogs.value = []
}
</script>

<template>
  <div class="h-full w-full overflow-y-auto p-4 md:p-8" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
    <div class="max-w-6xl mx-auto space-y-6">
      
      <!-- Status Card -->
      <div class="rounded-3xl p-6 backdrop-blur-xl border transition-all duration-300"
           :class="isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">Serial Port Debugger</h2>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :class="portStatus.connected ? 'bg-green-500' : 'bg-red-500'"></span>
            <span class="font-mono text-sm">{{ portStatus.connected ? 'Connected: ' + portStatus.port : 'Disconnected' }}</span>
          </div>
        </div>
      </div>

      <!-- Logs Area -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Data Stream -->
        <div class="rounded-3xl p-6 flex flex-col h-[500px] backdrop-blur-xl border transition-all duration-300"
             :class="isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <span>Incoming Data (JSON)</span>
            </h3>
            <button @click="clearLogs" class="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors">Clear</button>
          </div>
          <div class="flex-1 overflow-y-auto font-mono text-xs p-4 rounded-xl border"
               :class="isDarkMode ? 'bg-black/50 border-white/5' : 'bg-slate-100 border-slate-300'">
            <div v-for="(log, i) in rawData" :key="i" class="mb-2 pb-2 border-b" :class="isDarkMode ? 'border-white/10' : 'border-slate-300'">
              <pre>{{ JSON.stringify(log, null, 2) }}</pre>
            </div>
            <div v-if="rawData.length === 0" class="text-center opacity-50 py-4">Menunggu data masuk (max 1x per 2 detik)...</div>
          </div>
        </div>

        <!-- Error Logs -->
        <div class="rounded-3xl p-6 flex flex-col h-[500px] backdrop-blur-xl border transition-all duration-300"
             :class="isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'">
          <h3 class="text-lg font-bold mb-4 text-red-500">Error Logs</h3>
          <div class="flex-1 overflow-y-auto font-mono text-xs p-4 rounded-xl border"
               :class="isDarkMode ? 'bg-black/50 border-white/5' : 'bg-slate-100 border-slate-300'">
            <div v-for="(err, i) in errorLogs" :key="i" class="mb-1 text-red-500 font-bold">
              {{ err }}
            </div>
            <div v-if="errorLogs.length === 0" class="text-center opacity-50 py-4">Tidak ada error</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
