<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme'

const { isDarkMode } = useTheme()

// Gunakan localhost secara default untuk test dari laptop yang sama
const apiUrl = ref('http://127.0.0.1:5001/predict')
const temp = ref<number>(0)
const ph = ref<number>(0)
const tds = ref<number>(0)
const turbidity = ref<number>(0)

const isLoading = ref(false)
const result = ref<any>(null)
const errorMsg = ref('')

let removeListener: (() => void) | null = null

// Variabel throttle agar tidak membombardir AI API jika data datang terlalu cepat
let lastCallTime = 0

async function testPrediction() {
  const now = Date.now()
  // Batasi panggilan ke AI maksimal 1 detik sekali
  if (now - lastCallTime < 1000) return 
  // Jika nilai sensor masih 0 (belum ada data asli), jangan panggil
  if (temp.value === 0 && ph.value === 0) return 

  lastCallTime = now
  isLoading.value = true
  errorMsg.value = ''
  
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

onMounted(() => {
  // @ts-ignore
  if (window.api && window.api.serial) {
    // @ts-ignore
    removeListener = window.api.serial.onData((data: any) => {
      // Update nilai tampilan UI (Kolom Kiri)
      if (data.temp_water !== undefined) temp.value = data.temp_water
      if (data.ph !== undefined) ph.value = data.ph
      if (data.tds !== undefined) tds.value = data.tds
      if (data.turbidity !== undefined) turbidity.value = data.turbidity
      
      // Secara otomatis panggil API setiap ada data baru masuk
      testPrediction()
    })
  }
})

onUnmounted(() => {
  if (removeListener) removeListener()
})
</script>

<template>
  <div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
    <div class="w-full mx-auto space-y-6">
      
      <!-- API Config Bar -->
      <div class="p-4 rounded-3xl backdrop-blur-md border transition-all duration-300 shadow-lg flex items-center justify-between"
           :class="isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/70 border-slate-200'">
        <div class="flex items-center gap-3">
           <svg class="w-6 h-6 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
          <h2 class="text-lg font-bold" :class="isDarkMode ? 'text-white' : 'text-slate-800'">API AI Endpoint</h2>
        </div>
        <input v-model="apiUrl" type="text" 
               class="px-4 py-2 w-72 text-sm rounded-xl outline-none transition-colors border text-center"
               :class="isDarkMode ? 'bg-slate-800/50 border-white/10 text-white focus:border-neon-cyan' : 'bg-white border-slate-300 text-slate-800 focus:border-teal-500'" />
      </div>

      <!-- Dua Kolom Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[400px]">
        
        <!-- KOLOM KIRI: Sensor Masuk -->
        <div class="p-6 rounded-3xl backdrop-blur-md border transition-all duration-300 shadow-lg flex flex-col"
             :class="isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/70 border-slate-200'">
          <h2 class="text-xl font-bold mb-6 flex items-center gap-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
            <svg class="w-6 h-6 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20"></path>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Data Sensor Real-time
          </h2>
          
          <div class="grid grid-cols-2 gap-4 flex-1">
            <!-- Box Temp -->
            <div class="p-4 rounded-2xl flex flex-col justify-center items-center text-center border shadow-sm"
                 :class="isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'">
              <p class="text-sm font-medium" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Suhu Air</p>
              <p class="text-4xl font-extrabold mt-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
                {{ temp === 0 ? '-' : temp }} <span class="text-sm font-normal">°C</span>
              </p>
            </div>
            <!-- Box pH -->
            <div class="p-4 rounded-2xl flex flex-col justify-center items-center text-center border shadow-sm"
                 :class="isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'">
              <p class="text-sm font-medium" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">pH Air</p>
              <p class="text-4xl font-extrabold mt-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
                {{ ph === 0 ? '-' : ph }}
              </p>
            </div>
            <!-- Box TDS -->
            <div class="p-4 rounded-2xl flex flex-col justify-center items-center text-center border shadow-sm"
                 :class="isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'">
              <p class="text-sm font-medium" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">TDS</p>
              <p class="text-4xl font-extrabold mt-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
                {{ tds === 0 ? '-' : tds }} <span class="text-sm font-normal">ppm</span>
              </p>
            </div>
            <!-- Box Turbidity -->
            <div class="p-4 rounded-2xl flex flex-col justify-center items-center text-center border shadow-sm"
                 :class="isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'">
              <p class="text-sm font-medium" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Kekeruhan (Turbidity)</p>
              <p class="text-4xl font-extrabold mt-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
                {{ turbidity === 0 ? '-' : turbidity }} <span class="text-sm font-normal">NTU</span>
              </p>
            </div>
          </div>
        </div>

        <!-- KOLOM KANAN: Hasil Prediksi -->
        <div class="p-6 rounded-3xl backdrop-blur-md border shadow-lg flex flex-col relative"
             :class="isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/70 border-slate-200'">
          
          <!-- Indikator Loading di Pojok Kanan Atas -->
          <div class="absolute top-6 right-6" v-if="isLoading">
            <span class="flex h-4 w-4 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
            </span>
          </div>

          <h2 class="text-xl font-bold mb-6 flex items-center gap-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
            <svg class="w-6 h-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Prediksi AI Real-time
          </h2>
          
          <!-- State Error -->
          <div v-if="errorMsg" class="flex-1 flex items-center justify-center">
            <div class="p-4 w-full rounded-xl bg-red-500/20 border border-red-500/50 text-red-500 text-center flex flex-col items-center gap-3">
              <svg class="w-10 h-10 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMsg }}</span>
            </div>
          </div>
          
          <!-- State Success -->
          <div v-else-if="result && result.status === 'success'" class="flex-1 flex flex-col space-y-4">
            <div class="flex-1 flex flex-col items-center justify-center p-5 rounded-2xl shadow-inner text-center transition-all duration-500"
                 :class="result.data.is_critical ? 'bg-red-500/10 border-2 border-red-500/50' : (isDarkMode ? 'bg-neon-green/5 border-2 border-neon-green/30' : 'bg-green-50 border-2 border-green-300')">
              <p class="text-sm font-bold uppercase tracking-widest mb-4" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Dissolved Oxygen (DO)</p>
              
              <div class="flex items-baseline justify-center gap-2 mb-6">
                <p class="text-7xl font-black drop-shadow-md" :class="result.data.is_critical ? 'text-red-500' : (isDarkMode ? 'text-neon-green' : 'text-green-600')">
                  {{ result.data.do_prediction }}
                </p>
                <span class="text-2xl font-bold" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">mg/L</span>
              </div>
              
              <div class="w-2/3 h-px my-2" :class="isDarkMode ? 'bg-white/10' : 'bg-black/10'"></div>
              
              <p class="text-xs font-semibold uppercase tracking-wider mt-4 mb-2" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Status Kondisi</p>
              <div class="flex items-center justify-center gap-3">
                <span class="relative flex h-5 w-5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        :class="result.data.is_critical ? 'bg-red-400' : 'bg-green-400'"></span>
                  <span class="relative inline-flex rounded-full h-5 w-5"
                        :class="result.data.is_critical ? 'bg-red-500' : 'bg-green-500'"></span>
                </span>
                <p class="text-3xl font-extrabold uppercase" :class="result.data.is_critical ? 'text-red-500' : (isDarkMode ? 'text-neon-green' : 'text-green-600')">
                  {{ result.data.status_message }}
                </p>
              </div>
            </div>
          </div>

          <!-- State Idle (Menunggu) -->
          <div v-else class="flex-1 flex flex-col items-center justify-center text-center opacity-50">
             <svg class="w-16 h-16 mb-4 animate-pulse" :class="isDarkMode ? 'text-slate-600' : 'text-slate-300'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path d="M12 2v20"></path>
               <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
             </svg>
             <p class="font-medium" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Menunggu data sensor masuk...</p>
          </div>
          
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
