/**
 * useTheme — Dihapus dark mode, pakai light mode permanen (hemat logic + bundle).
 * Kompatibel dengan komponen lama: isDarkMode selalu false, toggleTheme no-op.
 */
import { ref } from 'vue'

const isDarkMode = ref(false)

export function useTheme() {
  function toggleTheme(): void {
    // no-op, dark mode dihapus
  }
  return {
    isDarkMode,
    toggleTheme
  }
}
