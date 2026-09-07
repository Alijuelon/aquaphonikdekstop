<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme'

const { isDarkMode } = useTheme()

const apiUrl = ref('http://127.0.0.1:5001/predict')
const temp = ref<number>(25.0)
const ph = ref<number>(7.0)
const tds = ref<number>(300)
const turbidity = ref<number>(5.0)

const isLoading = ref(false)
const result = ref<any>(null)
const errorMsg = ref('')

let removeListener: (() => void) | null = null

onMounted(() => {
  // @ts-ignore
  if (window.api && window.api.serial) {
    // @ts-ignore
    removeListener = window.api.serial.onData((data: any) => {
      if (data.temp_water !== undefined) temp.value = data.temp_water
      if (data.ph !== undefined) ph.value = data.ph
      if (data.tds !== undefined) tds.value = data.tds
      if (data.turbidity !== undefined) turbidity.value = data.turbidity
    })
  }
})

onUnmounted(() => {
  if (removeListener) removeListener()
})

async function testPrediction() {
  isLoading.value = true
  errorMsg.value = ''
  result.value = null
  
  try {
    const response = await fetch(apiUrl.value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        temp_water: temp.value,
        ph: ph.value,
        tds: tds.value,
        turbidity: turbidity.value
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    result.value = data
  } catch (err: any) {
    errorMsg.value = err.message || 'Gagal terhubung ke API. Pastikan IP dan Port sudah benar.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
    <div class="max-w-3xl w-full mx-auto space-y-6">
      
      <!-- API Config -->
      <div class="p-6 rounded-3xl backdrop-blur-md border transition-all duration-300 shadow-lg"
           :class="isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/70 border-slate-200'">
        <h2 class="text-xl font-bold mb-4 flex items-center gap-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
          <svg class="w-6 h-6 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
          API Configuration
        </h2>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">Endpoint URL</label>
          <input v-model="apiUrl" type="text" 
                 class="px-4 py-2 rounded-xl outline-none transition-colors border"
                 :class="isDarkMode ? 'bg-slate-800/50 border-white/10 text-white focus:border-neon-cyan' : 'bg-white border-slate-300 text-slate-800 focus:border-teal-500'" />
          <p class="text-xs mt-1" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
            Ganti dengan IP Raspberry Pi jika API berjalan di sana (contoh: http://192.168.0.175:5001/predict).
          </p>
        </div>
      </div>

      <!-- Sensor Inputs -->
      <div class="p-6 rounded-3xl backdrop-blur-md border transition-all duration-300 shadow-lg"
           :class="isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/70 border-slate-200'">
        <h2 class="text-xl font-bold mb-4 flex items-center gap-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
          <svg class="w-6 h-6 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20"></path>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          Simulasi Sensor Inputs
        </h2>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">Temperature (°C)</label>
            <input v-model.number="temp" type="number" step="0.1"
                   class="px-4 py-2 rounded-xl outline-none transition-colors border"
                   :class="isDarkMode ? 'bg-slate-800/50 border-white/10 text-white focus:border-neon-cyan' : 'bg-white border-slate-300 text-slate-800 focus:border-teal-500'" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">pH</label>
            <input v-model.number="ph" type="number" step="0.1"
                   class="px-4 py-2 rounded-xl outline-none transition-colors border"
                   :class="isDarkMode ? 'bg-slate-800/50 border-white/10 text-white focus:border-neon-cyan' : 'bg-white border-slate-300 text-slate-800 focus:border-teal-500'" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">TDS (ppm)</label>
            <input v-model.number="tds" type="number"
                   class="px-4 py-2 rounded-xl outline-none transition-colors border"
                   :class="isDarkMode ? 'bg-slate-800/50 border-white/10 text-white focus:border-neon-cyan' : 'bg-white border-slate-300 text-slate-800 focus:border-teal-500'" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">Turbidity (NTU)</label>
            <input v-model.number="turbidity" type="number" step="0.1"
                   class="px-4 py-2 rounded-xl outline-none transition-colors border"
                   :class="isDarkMode ? 'bg-slate-800/50 border-white/10 text-white focus:border-neon-cyan' : 'bg-white border-slate-300 text-slate-800 focus:border-teal-500'" />
          </div>
        </div>

        <button @click="testPrediction" :disabled="isLoading"
                class="mt-6 w-full py-3 rounded-xl font-bold transition-all shadow-lg text-white flex items-center justify-center gap-2"
                :class="[
                  isDarkMode ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500' : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400',
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                ]">
          <svg v-if="isLoading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          {{ isLoading ? 'Menganalisa dengan AI...' : 'Jalankan Prediksi' }}
        </button>
      </div>

      <!-- Result -->
      <transition name="fade">
        <div v-if="result || errorMsg" class="p-6 rounded-3xl backdrop-blur-md border shadow-lg mb-8"
             :class="isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/70 border-slate-200'">
          <h2 class="text-xl font-bold mb-4" :class="isDarkMode ? 'text-white' : 'text-slate-800'">Hasil Prediksi</h2>
          
          <div v-if="errorMsg" class="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-500 flex items-center gap-3">
            <svg class="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMsg }}</span>
          </div>
          
          <div v-if="result && result.status === 'success'" class="space-y-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl shadow-inner"
                 :class="result.data.is_critical ? 'bg-red-500/10 border-2 border-red-500/50' : (isDarkMode ? 'bg-neon-green/5 border-2 border-neon-green/30' : 'bg-green-50 border-2 border-green-300')">
              <div>
                <p class="text-sm font-semibold uppercase tracking-wider mb-1" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Dissolved Oxygen (DO)</p>
                <div class="flex items-baseline gap-1">
                  <p class="text-4xl font-extrabold" :class="result.data.is_critical ? 'text-red-500' : (isDarkMode ? 'text-neon-green' : 'text-green-600')">
                    {{ result.data.do_prediction }}
                  </p>
                  <span class="text-xl font-medium" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">mg/L</span>
                </div>
              </div>
              <div class="text-left sm:text-right mt-4 sm:mt-0">
                <p class="text-sm font-semibold uppercase tracking-wider mb-1" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Status</p>
                <div class="flex items-center gap-2 justify-start sm:justify-end">
                  <span class="relative flex h-3 w-3">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          :class="result.data.is_critical ? 'bg-red-400' : 'bg-green-400'"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3"
                          :class="result.data.is_critical ? 'bg-red-500' : 'bg-green-500'"></span>
                  </span>
                  <p class="text-xl font-bold" :class="result.data.is_critical ? 'text-red-500' : (isDarkMode ? 'text-neon-green' : 'text-green-600')">
                    {{ result.data.status_message }}
                  </p>
                </div>
              </div>
            </div>
            
            <div class="mt-4 p-4 rounded-xl border" :class="isDarkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'">
              <p class="text-sm font-bold mb-2 flex justify-between items-center" :class="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                <span>Raw Response JSON:</span>
                <span class="text-[10px] uppercase bg-slate-500/20 px-2 py-1 rounded">Debug Info</span>
              </p>
              <pre class="text-xs overflow-x-auto p-3 rounded bg-black/80 text-green-400 shadow-inner custom-scrollbar">{{ JSON.stringify(result, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}
</style>
