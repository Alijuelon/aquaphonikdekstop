<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme'

const { isDarkMode } = useTheme()

// Hardcode Endpoint URL karena sudah berjalan di mesin yang sama (Lokal)
const apiUrl = 'http://127.0.0.1:5001/predict'

const temp = ref<number>(0)
const ph = ref<number>(0)
const tds = ref<number>(0)
const turbidity = ref<number>(0)
const doReal = ref<number>(0)

const isLoading = ref(false)
const result = ref<any>(null)
const errorMsg = ref('')

let removeListener: (() => void) | null = null
let lastCallTime = 0

async function testPrediction() {
  const now = Date.now()
  if (now - lastCallTime < 1000) return 
  if (temp.value === 0 && ph.value === 0) return 

  lastCallTime = now
  isLoading.value = true
  errorMsg.value = ''
  
  try {
    // @ts-ignore
    const res = await window.api.ai.predict(apiUrl, {
      temp_water: temp.value,
      ph: ph.value,
      tds: tds.value,
      turbidity: turbidity.value
    })
    
    if (!res.success) {
      throw new Error(res.error)
    }
    
    result.value = res.data
  } catch (err: any) {
    console.error("FULL FETCH ERROR:", err);
    errorMsg.value = err.message || 'Koneksi ke AI Terputus'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // @ts-ignore
  if (window.api && window.api.serial) {
    // @ts-ignore
    removeListener = window.api.serial.onData((data: any) => {
      if (data.temp_water !== undefined) temp.value = data.temp_water
      if (data.ph !== undefined) ph.value = data.ph
      if (data.tds !== undefined) tds.value = data.tds
      if (data.turbidity !== undefined) turbidity.value = data.turbidity
      if (data.do_value !== undefined) doReal.value = data.do_value
      testPrediction()
    })
  }
})

onUnmounted(() => {
  if (removeListener) removeListener()
})
</script>

<template>
  <div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
    <div class="w-full h-full max-w-7xl mx-auto flex flex-col">
      
      <!-- Dua Kolom Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full flex-1">
        
        <!-- KOLOM KIRI: Sensor Masuk -->
        <div class="p-8 rounded-[2rem] backdrop-blur-xl border transition-all duration-300 shadow-2xl flex flex-col justify-between"
             :class="isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/70 border-slate-200'">
          <h2 class="text-2xl font-bold mb-8 flex items-center gap-3" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
            <div class="p-2 rounded-xl" :class="isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-600'">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20"></path>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            Monitoring Sensor Real-time
          </h2>
          
          <div class="grid grid-cols-2 gap-6 flex-1 items-center">
            
            <!-- Box Temp -->
            <div class="h-full p-6 rounded-3xl flex flex-col justify-center items-center text-center border shadow-sm transition-transform hover:scale-[1.02]"
                 :class="isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'">
              <svg class="w-10 h-10 mb-3 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
              </svg>
              <p class="text-sm font-semibold tracking-wide uppercase" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Suhu Air</p>
              <p class="text-5xl font-extrabold mt-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
                {{ temp === 0 ? '-' : temp }} <span class="text-lg font-normal text-slate-500">°C</span>
              </p>
            </div>
            
            <!-- Box pH -->
            <div class="h-full p-6 rounded-3xl flex flex-col justify-center items-center text-center border shadow-sm transition-transform hover:scale-[1.02]"
                 :class="isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'">
              <svg class="w-10 h-10 mb-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
              </svg>
              <p class="text-sm font-semibold tracking-wide uppercase" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Kadar pH</p>
              <p class="text-5xl font-extrabold mt-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
                {{ ph === 0 ? '-' : ph }}
              </p>
            </div>
            
            <!-- Box TDS -->
            <div class="h-full p-6 rounded-3xl flex flex-col justify-center items-center text-center border shadow-sm transition-transform hover:scale-[1.02]"
                 :class="isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'">
              <svg class="w-10 h-10 mb-3 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M22 12h.01"></path>
                <path d="M4 22c1.333-2 2.667-2 4 0s2.667 2 4 0 2.667-2 4 0 2.667 2 4 0"></path>
                <path d="M4 17c1.333-2 2.667-2 4 0s2.667 2 4 0 2.667-2 4 0 2.667 2 4 0"></path>
              </svg>
              <p class="text-sm font-semibold tracking-wide uppercase" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Zat Padat (TDS)</p>
              <p class="text-5xl font-extrabold mt-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
                {{ tds === 0 ? '-' : tds }} <span class="text-lg font-normal text-slate-500">ppm</span>
              </p>
            </div>
            
            <!-- Box Turbidity -->
            <div class="h-full p-6 rounded-3xl flex flex-col justify-center items-center text-center border shadow-sm transition-transform hover:scale-[1.02]"
                 :class="isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'">
              <svg class="w-10 h-10 mb-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.07 4.93a10 10 0 0 0-14.14 0M22 12c-2.4 4 -6.2 6 -10 6s-7.6-2 -10-6c2.4-4 6.2-6 10-6s7.6 2 10 6z"></path>
              </svg>
              <p class="text-sm font-semibold tracking-wide uppercase" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Kekeruhan</p>
              <p class="text-5xl font-extrabold mt-2" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
                {{ turbidity === 0 ? '-' : turbidity }} <span class="text-lg font-normal text-slate-500">NTU</span>
              </p>
            </div>
            
          </div>
        </div>

        <!-- KOLOM KANAN: Hasil Prediksi -->
        <div class="p-8 rounded-[2rem] backdrop-blur-xl border shadow-2xl flex flex-col relative"
             :class="isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-gradient-to-br from-white/70 to-slate-50/70 border-slate-200'">
          
          <!-- Indikator Loading di Pojok Kanan Atas -->
          <div class="absolute top-8 right-8" v-if="isLoading">
            <span class="flex h-5 w-5 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-5 w-5 bg-indigo-500"></span>
            </span>
          </div>

          <h2 class="text-2xl font-bold mb-8 flex items-center gap-3" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
            <div class="p-2 rounded-xl" :class="isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
            AI Engine (DO Prediction)
          </h2>
          
          <!-- State Error -->
          <div v-if="errorMsg" class="flex-1 flex items-center justify-center">
            <div class="p-6 w-full rounded-3xl bg-red-500/10 border-2 border-red-500/30 text-red-500 text-center flex flex-col items-center gap-4">
              <svg class="w-16 h-16 flex-shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <p class="font-bold text-lg mb-1">Gagal Terhubung ke AI</p>
                <p class="text-sm opacity-80">{{ errorMsg }}</p>
              </div>
            </div>
          </div>
          
          <!-- State Success -->
          <div v-else-if="result && result.status === 'success'" class="flex-1 flex flex-col h-full gap-4">
            
            <div class="grid grid-cols-2 gap-4 flex-1">
              <!-- AI PREDICTION CARD -->
              <div class="flex flex-col items-center justify-center p-6 rounded-3xl shadow-inner text-center transition-all duration-500 relative overflow-hidden"
                   :class="result.data.is_critical ? 'bg-gradient-to-b from-red-500/10 to-red-500/5 border-2 border-red-500/50' : (isDarkMode ? 'bg-gradient-to-b from-neon-green/10 to-neon-green/5 border-2 border-neon-green/30' : 'bg-gradient-to-b from-green-100 to-green-50 border-2 border-green-400')">
                
                <div class="absolute top-4 left-4">
                  <span class="px-3 py-1 text-xs font-bold rounded-full bg-black/10 backdrop-blur-md" :class="isDarkMode ? 'text-white' : 'text-slate-800'">AI MODEL</span>
                </div>
                
                <div class="flex flex-col items-center gap-2 mt-6">
                  <p class="text-sm font-bold uppercase tracking-widest" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Prediksi DO</p>
                  
                  <div class="flex items-baseline justify-center gap-1">
                    <p class="text-[5rem] leading-none font-black drop-shadow-lg" :class="result.data.is_critical ? 'text-red-500' : (isDarkMode ? 'text-neon-green' : 'text-green-600')">
                      {{ result.data.do_prediction }}
                    </p>
                    <span class="text-xl font-bold" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">mg/L</span>
                  </div>
                </div>
              </div>

              <!-- REAL SENSOR CARD -->
              <div class="flex flex-col items-center justify-center p-6 rounded-3xl shadow-inner text-center transition-all duration-500 relative overflow-hidden"
                   :class="isDarkMode ? 'bg-slate-800/80 border-2 border-slate-600' : 'bg-slate-100 border-2 border-slate-300'">
                
                <div class="absolute top-4 left-4">
                  <span class="px-3 py-1 text-xs font-bold rounded-full bg-black/10 backdrop-blur-md" :class="isDarkMode ? 'text-white' : 'text-slate-800'">SENSOR ASLI</span>
                </div>
                
                <div class="flex flex-col items-center gap-2 mt-6">
                  <p class="text-sm font-bold uppercase tracking-widest" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Pembacaan DO</p>
                  
                  <div class="flex items-baseline justify-center gap-1">
                    <p class="text-[5rem] leading-none font-black drop-shadow-lg" :class="isDarkMode ? 'text-sky-400' : 'text-sky-600'">
                      {{ doReal === 0 ? '-' : doReal }}
                    </p>
                    <span class="text-xl font-bold" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">mg/L</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- STATUS BOX DI BAWAH -->
            <div class="w-full flex flex-col items-center justify-center p-4 rounded-2xl" :class="isDarkMode ? 'bg-slate-800/40' : 'bg-slate-100'">
              <p class="text-xs font-semibold uppercase tracking-wider mb-2" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Status Kelayakan Air (Berdasarkan AI)</p>
              <div class="flex items-center justify-center gap-3 px-6 py-2 rounded-full" :class="result.data.is_critical ? 'bg-red-500/20' : (isDarkMode ? 'bg-neon-green/20' : 'bg-green-200/50')">
                <span class="relative flex h-4 w-4">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        :class="result.data.is_critical ? 'bg-red-400' : 'bg-green-400'"></span>
                  <span class="relative inline-flex rounded-full h-4 w-4"
                        :class="result.data.is_critical ? 'bg-red-500' : 'bg-green-500'"></span>
                </span>
                <p class="text-xl font-extrabold uppercase tracking-wide" :class="result.data.is_critical ? 'text-red-500' : (isDarkMode ? 'text-neon-green' : 'text-green-700')">
                  {{ result.data.status_message }}
                </p>
              </div>
            </div>

          </div>

          <!-- State Idle (Menunggu) -->
          <div v-else class="flex-1 flex flex-col items-center justify-center text-center opacity-40">
             <div class="p-6 rounded-full border-2 border-dashed mb-6" :class="isDarkMode ? 'border-slate-600' : 'border-slate-300'">
               <svg class="w-20 h-20 animate-pulse" :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                 <path d="M12 2v20"></path>
                 <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
               </svg>
             </div>
             <p class="text-lg font-medium tracking-wide" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">AI Stanby. Menunggu aliran data...</p>
          </div>
          
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
