<script setup lang="ts">
/**
 * Settings View — Configure serial port, database log interval,
 * and data retention policies.
 * Theme: Futuristic Glassmorphism
 */
import { ref, onMounted, watch } from 'vue'
import { useSerial } from '../composables/useSerial'
import { useTheme } from '../composables/useTheme'

const { isDarkMode } = useTheme()

// Serial setup
const {
  isConnected,
  availablePorts,
  isScanning,
  isConnecting,
  lastError,
  scanPorts,
  connect,
  disconnect
} = useSerial()

const selectedPort = ref('')
const selectedBaudRate = ref(115200)
const baudRates = [9600, 19200, 38400, 57600, 115200, 230400]

// Auto-scan ports on mount
scanPorts()

// Watch for available ports to auto-select and auto-connect
watch(availablePorts, async (ports) => {
  if (ports.length > 0 && !selectedPort.value && !isConnected.value && !isConnecting.value) {
    selectedPort.value = ports[0].path
    // Auto connect using the selected default baud rate
    await connect(selectedPort.value, selectedBaudRate.value)
  }
})

async function handleConnect(): Promise<void> {
  if (isConnected.value) {
    await disconnect()
  } else if (selectedPort.value) {
    await connect(selectedPort.value, selectedBaudRate.value)
  }
}

async function handleScan(): Promise<void> {
  await scanPorts()
}

const logInterval = ref(1)
const retentionDays = ref(30)
const isSaving = ref(false)
const saveMessage = ref('')
const logCount = ref(0)
const isDeleting = ref(false)
const deleteMessage = ref('')

async function loadSettings(): Promise<void> {
  try {
    const result = await window.api.settings.getLogInterval()
    logInterval.value = result.interval
    logCount.value = await window.api.database.getLogCount()
  } catch (err) {
    console.error('Failed to load settings:', err)
  }
}

async function saveLogInterval(): Promise<void> {
  isSaving.value = true
  saveMessage.value = ''
  try {
    const result = await window.api.settings.setLogInterval(logInterval.value)
    if (result.success) {
      saveMessage.value = `✓ Interval disimpan: setiap ${result.interval} menit`
    }
  } catch (err) {
    saveMessage.value = '✗ Gagal menyimpan pengaturan'
  } finally {
    isSaving.value = false
    setTimeout(() => {
      saveMessage.value = ''
    }, 3000)
  }
}

async function cleanupOldData(): Promise<void> {
  isDeleting.value = true
  deleteMessage.value = ''
  try {
    const deleted = await window.api.database.deleteOldLogs(retentionDays.value)
    deleteMessage.value = `✓ ${deleted} record dihapus`
    logCount.value = await window.api.database.getLogCount()
  } catch (err) {
    deleteMessage.value = '✗ Gagal menghapus data'
  } finally {
    isDeleting.value = false
    setTimeout(() => {
      deleteMessage.value = ''
    }, 3000)
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto h-full max-w-4xl mx-auto">
    <!-- Header removed, handled by Top Nav -->

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 h-full pb-4">
      <!-- Left Column: Database Settings -->
      <div class="glass-card p-4 md:p-5 space-y-4 border shadow-2xl backdrop-blur-md rounded-3xl flex flex-col justify-between"
           :class="isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/80 border-slate-200'">
      <div class="flex items-center gap-3 p-3 rounded-xl w-fit border"
           :class="isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'">
        <div class="w-10 h-10 rounded-xl bg-neon-green/20 flex items-center justify-center border border-neon-green/30">
          <svg class="w-5 h-5 text-neon-green drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </div>
        <h2 class="text-lg font-extrabold text-white uppercase tracking-widest">Database</h2>
      </div>

      <!-- Stats -->
      <div class="flex gap-4">
        <div class="flex-1 p-3 md:p-4 rounded-2xl border shadow-inner"
             :class="isDarkMode ? 'bg-black/40 border-white/20' : 'bg-slate-50 border-slate-200'">
          <p class="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1"
             :class="isDarkMode ? 'text-white' : 'text-slate-500'">Total Records</p>
          <p class="text-2xl md:text-3xl font-extrabold text-gradient drop-shadow-lg">{{ logCount.toLocaleString() }}</p>
        </div>
      </div>

      <!-- Log Interval -->
      <div class="space-y-2">
        <label class="text-xs md:text-sm font-bold uppercase tracking-wider"
               :class="isDarkMode ? 'text-white' : 'text-slate-700'">Interval Penyimpanan Data</label>
        <p class="text-xs font-medium leading-relaxed max-w-2xl"
           :class="isDarkMode ? 'text-slate-300' : 'text-slate-500'">
          Disimpan ke database setiap interval ini.
        </p>
        <div class="flex items-center gap-3">
          <select
            v-model="logInterval"
            class="flex-1 px-3 py-2 rounded-xl border text-sm md:text-base font-bold shadow-inner outline-none focus:ring-2 transition-all appearance-none cursor-pointer"
            :class="isDarkMode ? 'bg-black/40 border-white/30 text-white focus:border-neon-cyan focus:ring-neon-cyan/30' : 'bg-white border-slate-300 text-slate-800 focus:border-teal-500 focus:ring-teal-500/30'"
          >
            <option :value="1" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Setiap 1 menit</option>
            <option :value="2" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Setiap 2 menit</option>
            <option :value="5" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Setiap 5 menit</option>
            <option :value="10" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Setiap 10 menit</option>
            <option :value="15" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Setiap 15 menit</option>
            <option :value="30" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Setiap 30 menit</option>
            <option :value="60" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Setiap 1 jam</option>
          </select>
          <button @click="saveLogInterval" :disabled="isSaving" class="px-4 py-2 rounded-xl text-sm md:text-base font-bold text-white bg-gradient-to-r from-neon-green to-emerald-500 border border-white/20 shadow-[0_0_15px_rgba(57,255,20,0.4)] hover:shadow-[0_0_25px_rgba(57,255,20,0.6)] transition-all whitespace-nowrap">
            {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
        <p v-if="saveMessage" class="text-sm font-bold" :class="saveMessage.startsWith('✓') ? 'text-neon-green drop-shadow-md' : 'text-neon-red drop-shadow-md'">
          {{ saveMessage }}
        </p>
      </div>

      <!-- Data Retention / Cleanup -->
      <div class="space-y-2 pt-4 border-t" :class="isDarkMode ? 'border-white/20' : 'border-slate-200'">
        <label class="text-xs md:text-sm font-bold uppercase tracking-wider"
               :class="isDarkMode ? 'text-white' : 'text-slate-700'">Pembersihan Data Lama</label>
        <p class="text-xs font-medium leading-relaxed max-w-2xl"
           :class="isDarkMode ? 'text-slate-300' : 'text-slate-500'">
          Hapus data yang lebih lama untuk menghemat ruang.
        </p>
        <div class="flex items-center gap-3">
          <select
            v-model="retentionDays"
            class="flex-1 px-3 py-2 rounded-xl border text-sm md:text-base font-bold shadow-inner outline-none focus:ring-2 transition-all appearance-none cursor-pointer"
            :class="isDarkMode ? 'bg-black/40 border-white/30 text-white focus:border-neon-cyan focus:ring-neon-cyan/30' : 'bg-white border-slate-300 text-slate-800 focus:border-red-500 focus:ring-red-500/30'"
          >
            <option :value="7" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Lebih dari 7 hari</option>
            <option :value="14" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Lebih dari 14 hari</option>
            <option :value="30" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Lebih dari 30 hari</option>
            <option :value="60" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Lebih dari 60 hari</option>
            <option :value="90" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Lebih dari 90 hari</option>
          </select>
          <button
            @click="cleanupOldData"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-xl text-sm md:text-base font-bold text-white bg-gradient-to-r from-neon-red to-red-600 border border-white/20 shadow-[0_0_15px_rgba(255,77,121,0.4)] hover:shadow-[0_0_25px_rgba(255,77,121,0.6)] transition-all whitespace-nowrap"
          >
            {{ isDeleting ? 'Menghapus...' : 'Hapus Data' }}
          </button>
        </div>
        <p v-if="deleteMessage" class="text-sm font-bold" :class="deleteMessage.startsWith('✓') ? 'text-neon-green drop-shadow-md' : 'text-neon-red drop-shadow-md'">
          {{ deleteMessage }}
        </p>
      </div>
      </div>

      <!-- Right Column: Serial & About -->
      <div class="flex flex-col gap-4 md:gap-6 h-full">
        <!-- Serial Port Info -->
        <div class="glass-card p-4 md:p-5 space-y-4 border shadow-2xl backdrop-blur-md rounded-3xl flex-1"
             :class="isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/80 border-slate-200'">
      <div class="flex items-center gap-3 p-3 rounded-xl w-fit border"
           :class="isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'">
        <div class="w-10 h-10 rounded-xl bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/30">
          <svg class="w-5 h-5 text-neon-cyan drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" />
            <circle cx="6" cy="6" r="1.5" fill="currentColor" />
            <circle cx="6" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <h2 class="text-lg font-extrabold uppercase tracking-widest"
            :class="isDarkMode ? 'text-white' : 'text-slate-800'">Serial Port</h2>
      </div>

      <!-- Serial Controls inside Settings -->
      <div v-if="lastError" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-red/10 border border-neon-red/20 mb-2">
        <svg class="w-4 h-4 text-neon-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" stroke-linecap="round" />
        </svg>
        <span class="text-xs font-medium text-neon-red/90">{{ lastError }}</span>
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <label class="text-xs font-bold uppercase tracking-wider w-20"
                 :class="isDarkMode ? 'text-white' : 'text-slate-700'">Port</label>
          <div class="flex flex-1 gap-2">
            <select
              v-model="selectedPort"
              class="flex-1 px-3 py-2 rounded-xl border text-sm font-bold outline-none transition-all appearance-none cursor-pointer shadow-inner"
              :class="isDarkMode ? 'bg-black/40 border-white/20 text-white focus:border-neon-cyan/50' : 'bg-white border-slate-300 text-slate-800 focus:border-teal-500'"
              :disabled="isConnected"
            >
              <option value="" disabled :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">Pilih Port</option>
              <option
                v-for="port in availablePorts"
                :key="port.path"
                :value="port.path"
                :class="isDarkMode ? 'bg-slate-900' : 'bg-white'"
              >
                {{ port.path }} {{ port.manufacturer ? `(${port.manufacturer})` : '' }}
              </option>
            </select>
            <button
              class="px-3 py-2 rounded-xl border transition-all duration-200"
              :class="[
                { 'animate-spin': isScanning },
                isDarkMode ? 'bg-white/[0.06] border-white/[0.1] text-white/80 hover:text-white hover:bg-white/[0.1]' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-200'
              ]"
              :disabled="isScanning"
              title="Scan Ports"
              @click="handleScan"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <label class="text-xs font-bold uppercase tracking-wider w-20"
                 :class="isDarkMode ? 'text-white' : 'text-slate-700'">Baud Rate</label>
          <select
            v-model="selectedBaudRate"
            class="flex-1 px-3 py-2 rounded-xl border text-sm font-bold outline-none transition-all appearance-none cursor-pointer shadow-inner"
            :class="isDarkMode ? 'bg-black/40 border-white/20 text-white focus:border-neon-cyan/50' : 'bg-white border-slate-300 text-slate-800 focus:border-teal-500'"
            :disabled="isConnected"
          >
            <option v-for="baud in baudRates" :key="baud" :value="baud" :class="isDarkMode ? 'bg-slate-900' : 'bg-white'">
              {{ baud }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            class="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 border"
            :class="
              isConnected
                ? 'bg-neon-red/10 text-neon-red border-neon-red/30 hover:bg-neon-red/20 shadow-[0_0_15px_rgba(255,23,68,0.2)]'
                : 'bg-gradient-to-r from-neon-green to-emerald-500 text-white border-white/20 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)]'
            "
            :disabled="isConnecting || (!selectedPort && !isConnected)"
            @click="handleConnect"
          >
            <span v-if="isConnecting" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            <template v-else>
              {{ isConnected ? 'Putuskan Koneksi' : 'Hubungkan' }}
            </template>
          </button>
        </div>
      </div>
        </div>

        <!-- About -->
        <div class="glass-card p-4 md:p-5 border shadow-2xl backdrop-blur-md rounded-3xl"
             :class="isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/80 border-slate-200'">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 mb-2 md:mb-3">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green/80 to-neon-cyan/80 flex items-center justify-center border"
             :class="isDarkMode ? 'border-white/30' : 'border-white/50'"
             style="box-shadow: 0 0 20px rgba(57, 255, 20, 0.4);">
          <svg class="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0.4" fill="currentColor"/>
            <circle cx="12" cy="14" r="2.5" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-extrabold tracking-wide" :class="isDarkMode ? 'text-white' : 'text-slate-800'">AquaPhonik Desktop</h3>
          <p class="text-sm font-bold mt-1 uppercase tracking-widest" :class="isDarkMode ? 'text-slate-200' : 'text-slate-500'">v1.0.0 • Aquaponics Monitoring & Control</p>
        </div>
      </div>
        <p class="text-xs md:text-sm font-medium mt-2" :class="isDarkMode ? 'text-slate-300' : 'text-slate-500'">
          Built with Electron + Vue 3 + Vite • Tailwind CSS • ECharts • SerialPort • PostgreSQL
        </p>
      </div>
    </div>
    </div>
  </div>
</template>
