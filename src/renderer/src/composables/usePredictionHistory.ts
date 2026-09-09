import { ref, computed } from 'vue'

const history = ref<any[]>([])
const filterLimit = ref(10)
let isInitialized = false

export function usePredictionHistory() {
  const initHistory = async () => {
    if (isInitialized) return
    try {
      // @ts-ignore
      const data = await window.api.database.getAiPredictions(200)
      if (data && data.length > 0) {
        history.value = data.map((d: any) => ({
          ...d,
          temp: d.temp_water,
          timestamp: new Date(d.timestamp).toLocaleTimeString('id-ID')
        }))
      }
      isInitialized = true
    } catch (e) {
      console.error('Failed to load AI predictions from DB', e)
    }
  }

  const addPrediction = async (data: any) => {
    // Add locally for instant UI update
    history.value.unshift(data)
    if (history.value.length > 200) {
      history.value.pop()
    }
    
    // Save to DB
    try {
      // @ts-ignore
      await window.api.database.saveAiPrediction(data)
    } catch (e) {
      console.error('Failed to save AI prediction to DB', e)
    }
  }

  const filteredHistory = computed(() => {
    return history.value.slice(0, filterLimit.value)
  })

  // Start init in background
  initHistory()

  return {
    history,
    filteredHistory,
    filterLimit,
    addPrediction
  }
}
