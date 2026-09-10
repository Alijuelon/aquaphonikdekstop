<script setup lang="ts">
import { watch, ref } from 'vue'
import { useTheme } from '../composables/useTheme'
import { useSensorData } from '../composables/useSensorData'
import { usePredictionHistory } from '../composables/usePredictionHistory'

const { isDarkMode } = useTheme()
const { sensorData, lastUpdated } = useSensorData()
const { filteredHistory, filterLimit, addPrediction } = usePredictionHistory()

// Hardcode Endpoint URL karena sudah berjalan di mesin yang sama (Lokal)
const apiUrl = 'http://127.0.0.1:5001/predict'

const isLoading = ref(false)
const result = ref<any>(null)
const errorMsg = ref('')

let lastCallTime = 0

async function testPrediction() {
  const now = Date.now()
  // Kurangi throttle menjadi 500ms agar tidak miss data dari serial (biasanya 1 detik)
  if (now - lastCallTime < 500) return 
  // Abaikan jika sensor belum ada data yang valid
  if (sensorData.value.temp_water === 0 && sensorData.value.ph === 0) return 

  lastCallTime = now
  isLoading.value = true
  errorMsg.value = ''
  
  try {
    // @ts-ignore
    const res = await window.api.ai.predict(apiUrl, {
      temp_water: sensorData.value.temp_water,
      ph: sensorData.value.ph,
      tds: sensorData.value.tds,
      turbidity: sensorData.value.turbidity,
      do_real: sensorData.value.do
    })
    
    if (!res.success) {
      throw new Error(res.error)
    }
    
    result.value = res.data

    // Tambahkan ke riwayat prediksi
    addPrediction({
      timestamp: new Date().toLocaleTimeString('id-ID'),
      temp: sensorData.value.temp_water,
      ph: sensorData.value.ph,
      tds: sensorData.value.tds,
      turbidity: sensorData.value.turbidity,
      do_predict: res.data.data.do_prediction,
      do_real: sensorData.value.do
    })

  } catch (err: any) {
    console.error("FULL FETCH ERROR:", err);
    errorMsg.value = err.message || 'Koneksi ke AI Terputus'
  } finally {
    isLoading.value = false
  }
}

// Gunakan watch pada lastUpdated untuk mentrigger prediksi
// secara akurat setiap kali ada pembaruan data dari serial (meski nilainya sama)
watch(
  lastUpdated,
  (newTime) => {
    if (newTime) {
      testPrediction()
    }
  }
)
</script>

<template>
  <div class="h-full flex flex-col p-4 lg:p-6 overflow-y-auto">
    <div class="w-full max-w-7xl mx-auto flex flex-col gap-4 lg:gap-6">
      
      <!-- HEADER DASHBOARD -->
      <div class="flex items-center justify-between pb-2 border-b" :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl" :class="isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20"></path>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold" :class="isDarkMode ? 'text-white' : 'text-slate-800'">Dashboard Prediksi AI</h1>
            <p class="text-xs" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Memantau kualitas air secara real-time</p>
          </div>
        </div>
      </div>
      
      <!-- DUA KOLOM GRID (Kiri: Sensor, Kanan: Hasil Prediksi) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        <!-- KOLOM KIRI: 4 KOTAK SENSOR -->
        <div class="lg:col-span-7 grid grid-cols-2 gap-4 items-start">
          
          <!-- Box Temp -->
          <div class="p-4 lg:p-5 rounded-2xl flex flex-col justify-center border shadow-sm transition-transform hover:-translate-y-1"
               :class="isDarkMode ? 'bg-slate-800/60 border-white/5' : 'bg-white border-slate-200'">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-6 h-6 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
              </svg>
              <p class="text-sm font-semibold tracking-wide" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Suhu Air</p>
            </div>
            <p class="text-3xl font-extrabold" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
              {{ sensorData.temp_water === 0 ? '-' : sensorData.temp_water.toFixed(1) }} <span class="text-base font-normal text-slate-500">°C</span>
            </p>
          </div>
          
          <!-- Box pH -->
          <div class="p-4 lg:p-5 rounded-2xl flex flex-col justify-center border shadow-sm transition-transform hover:-translate-y-1"
               :class="isDarkMode ? 'bg-slate-800/60 border-white/5' : 'bg-white border-slate-200'">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
              </svg>
              <p class="text-sm font-semibold tracking-wide" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Kadar pH</p>
            </div>
            <p class="text-3xl font-extrabold" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
              {{ sensorData.ph === 0 ? '-' : sensorData.ph.toFixed(2) }}
            </p>
          </div>
          
          <!-- Box TDS -->
          <div class="p-4 lg:p-5 rounded-2xl flex flex-col justify-center border shadow-sm transition-transform hover:-translate-y-1"
               :class="isDarkMode ? 'bg-slate-800/60 border-white/5' : 'bg-white border-slate-200'">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M22 12h.01"></path>
                <path d="M4 22c1.333-2 2.667-2 4 0s2.667 2 4 0 2.667-2 4 0 2.667 2 4 0"></path>
                <path d="M4 17c1.333-2 2.667-2 4 0s2.667 2 4 0 2.667-2 4 0 2.667 2 4 0"></path>
              </svg>
              <p class="text-sm font-semibold tracking-wide" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Zat Padat (TDS)</p>
            </div>
            <p class="text-3xl font-extrabold" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
              {{ sensorData.tds === 0 ? '-' : sensorData.tds.toFixed(0) }} <span class="text-base font-normal text-slate-500">ppm</span>
            </p>
          </div>
          
          <!-- Box Turbidity -->
          <div class="p-4 lg:p-5 rounded-2xl flex flex-col justify-center border shadow-sm transition-transform hover:-translate-y-1"
               :class="isDarkMode ? 'bg-slate-800/60 border-white/5' : 'bg-white border-slate-200'">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.07 4.93a10 10 0 0 0-14.14 0M22 12c-2.4 4 -6.2 6 -10 6s-7.6-2 -10-6c2.4-4 6.2-6 10-6s7.6 2 10 6z"></path>
              </svg>
              <p class="text-sm font-semibold tracking-wide" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Kekeruhan</p>
            </div>
            <p class="text-3xl font-extrabold" :class="isDarkMode ? 'text-white' : 'text-slate-800'">
              {{ sensorData.turbidity === 0 ? '-' : sensorData.turbidity.toFixed(1) }} <span class="text-base font-normal text-slate-500">NTU</span>
            </p>
          </div>
          
        </div>

        <!-- KOLOM KANAN: Hasil Prediksi & Komparasi -->
        <div class="lg:col-span-5 p-4 lg:p-6 rounded-2xl border shadow-xl flex flex-col relative"
             :class="isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'">
          
          <!-- Indikator Loading -->
          <div class="absolute top-4 right-4" v-if="isLoading">
            <span class="flex h-3 w-3 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-full w-full bg-indigo-500"></span>
            </span>
          </div>

          <!-- State Error -->
          <div v-if="errorMsg" class="flex-1 flex items-center justify-center min-h-[250px]">
            <div class="p-4 w-full rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-center flex flex-col items-center gap-2">
              <svg class="w-8 h-8 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <p class="font-bold text-sm">Gagal Terhubung ke AI</p>
                <p class="text-xs opacity-80">{{ errorMsg }}</p>
              </div>
            </div>
          </div>
          
          <!-- State Success -->
          <div v-else-if="result && result.status === 'success'" class="flex-1 flex flex-col gap-4">
            
            <div class="grid grid-cols-2 gap-4 flex-1">
              <!-- AI PREDICTION CARD -->
              <div class="flex flex-col p-4 rounded-2xl shadow-inner relative overflow-hidden justify-center items-center transition-all duration-300"
                   :class="[result.data.is_critical ? 'bg-red-500/10 border border-red-500/50' : (isDarkMode ? 'bg-neon-green/10 border border-neon-green/30' : 'bg-green-50 border border-green-300'), isLoading ? 'opacity-80 scale-[0.98]' : '']">
                
                <div class="absolute top-2 left-2 flex items-center gap-2">
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-black/10 backdrop-blur-md" :class="isDarkMode ? 'text-white' : 'text-slate-800'">AI MODEL</span>
                  
                  <span v-if="isLoading" class="flex items-center gap-1 text-[10px] font-bold text-indigo-500 animate-pulse">
                    <svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                    </svg>
                    PROSES...
                  </span>
                </div>
                
                <p class="text-[11px] font-bold uppercase tracking-wider mt-4" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Prediksi DO</p>
                <div class="flex items-baseline gap-1">
                  <p class="text-4xl font-black drop-shadow-sm" :class="result.data.is_critical ? 'text-red-500' : (isDarkMode ? 'text-neon-green' : 'text-green-600')">
                    {{ result.data.do_prediction }}
                  </p>
                  <span class="text-xs font-bold" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">mg/L</span>
                </div>
              </div>

              <!-- REAL SENSOR CARD -->
              <div class="flex flex-col p-4 rounded-2xl shadow-inner relative overflow-hidden justify-center items-center"
                   :class="isDarkMode ? 'bg-slate-800/80 border border-slate-600' : 'bg-slate-50 border border-slate-200'">
                <span class="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded bg-black/10 backdrop-blur-md" :class="isDarkMode ? 'text-white' : 'text-slate-800'">SENSOR ASLI</span>
                <p class="text-[11px] font-bold uppercase tracking-wider mt-4" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Pembacaan DO</p>
                <div class="flex items-baseline gap-1">
                  <p class="text-4xl font-black drop-shadow-sm" :class="isDarkMode ? 'text-sky-400' : 'text-sky-600'">
                    {{ sensorData.do === 0 ? '-' : sensorData.do.toFixed(1) }}
                  </p>
                  <span class="text-xs font-bold" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">mg/L</span>
                </div>
              </div>
            </div>

            <!-- STATUS KELAYAKAN AIR -->
            <div class="w-full flex items-center justify-between p-3 rounded-xl border" :class="isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'">
              <div class="flex items-center gap-2">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        :class="result.data.is_critical ? 'bg-red-400' : 'bg-green-400'"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3"
                        :class="result.data.is_critical ? 'bg-red-500' : 'bg-green-500'"></span>
                </span>
                <p class="text-xs font-semibold uppercase tracking-wider" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">Status Kelayakan</p>
              </div>
              <p class="text-sm font-extrabold uppercase tracking-wide" :class="result.data.is_critical ? 'text-red-500' : (isDarkMode ? 'text-neon-green' : 'text-green-700')">
                {{ result.data.status_message }}
              </p>
            </div>

          </div>

          <!-- State Idle (Menunggu) -->
          <div v-else class="flex-1 flex flex-col items-center justify-center text-center opacity-40 min-h-[200px]">
             <svg class="w-10 h-10 animate-pulse mb-3" :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path d="M12 2v20"></path>
               <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
             </svg>
             <p class="text-xs font-medium tracking-wide" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">AI Stanby. Menunggu aliran data...</p>
          </div>
          
        </div>

      </div>

      <!-- TABEL RIWAYAT PREDIKSI AI -->
      <div class="mt-2 p-4 lg:p-6 rounded-2xl border shadow-xl flex flex-col flex-1" 
           :class="isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'">
        
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold" :class="isDarkMode ? 'text-white' : 'text-slate-800'">Riwayat Prediksi AI</h2>
          <!-- Filter Dropdown -->
          <select v-model="filterLimit" 
                  class="text-sm px-3 py-1.5 rounded-lg border outline-none cursor-pointer" 
                  :class="isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-700'">
            <option :value="10">10 Terakhir</option>
            <option :value="20">20 Terakhir</option>
            <option :value="50">50 Terakhir</option>
            <option :value="200">Semua</option>
          </select>
        </div>

        <div class="overflow-y-auto overflow-x-auto rounded-xl border max-h-[350px]" :class="isDarkMode ? 'border-white/10' : 'border-slate-200'">
          <table class="w-full text-left border-collapse relative">
            <thead class="sticky top-0 z-10">
              <tr class="border-b" :class="isDarkMode ? 'bg-slate-800 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                <th class="py-3 px-4 font-semibold text-sm w-[15%]">Waktu</th>
                <th class="py-3 px-4 font-semibold text-sm w-[45%]">Input Sensor (Suhu, pH, TDS, Kekeruhan)</th>
                <th class="py-3 px-4 font-semibold text-sm w-[20%]">Prediksi AI (DO)</th>
                <th class="py-3 px-4 font-semibold text-sm w-[20%]">Sensor Asli (DO)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in filteredHistory" :key="idx" 
                  class="border-b last:border-0 hover:bg-black/5 transition-colors" 
                  :class="isDarkMode ? 'border-white/5 text-slate-300 bg-slate-900' : 'border-slate-100 text-slate-700 bg-white'">
                <td class="py-3 px-4 text-sm whitespace-nowrap">{{ item.timestamp }}</td>
                <td class="py-3 px-4 text-sm font-medium">
                  {{ item.temp.toFixed(1) }}°C, {{ item.ph.toFixed(2) }} pH, {{ item.tds.toFixed(0) }} ppm, {{ item.turbidity.toFixed(1) }} NTU
                </td>
                <td class="py-3 px-4 text-sm font-bold" :class="isDarkMode ? 'text-neon-green' : 'text-green-600'">
                  {{ item.do_predict }} <span class="text-xs font-normal opacity-70">mg/L</span>
                </td>
                <td class="py-3 px-4 text-sm font-bold" :class="isDarkMode ? 'text-sky-400' : 'text-sky-600'">
                  {{ item.do_real.toFixed(1) }} <span class="text-xs font-normal opacity-70">mg/L</span>
                </td>
              </tr>
              <tr v-if="filteredHistory.length === 0">
                <td colspan="4" class="py-8 text-center text-sm font-medium" :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'">
                  Belum ada data prediksi yang terekam.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Kustomisasi scrollbar agar lebih estetis */
::-webkit-scrollbar {
  width: 14px;
  height: 14px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 10px;
  border: 3px solid transparent;
  background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8);
}
</style>

