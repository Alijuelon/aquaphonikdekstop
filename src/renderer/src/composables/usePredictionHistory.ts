import { ref, computed } from 'vue'

const history = ref<any[]>([])
const filterLimit = ref(10)

export function usePredictionHistory() {
  const addPrediction = (data: any) => {
    history.value.unshift(data)
    if (history.value.length > 200) {
      history.value.pop()
    }
  }

  const filteredHistory = computed(() => {
    return history.value.slice(0, filterLimit.value)
  })

  return {
    history,
    filteredHistory,
    filterLimit,
    addPrediction
  }
}
