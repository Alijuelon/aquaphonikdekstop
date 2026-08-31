/**
 * In-Memory Cache — Aquaphonik Desktop
 * Pengganti Redis: menyimpan data sensor real-time di memori proses Electron.
 * Dipakai oleh Express API (/api/current) dan Socket.IO (saat client baru connect).
 *
 * Keunggulan dibanding Redis:
 * - Tidak butuh service external
 * - Latency ~0 (langsung dari RAM)
 * - Tidak ada dependency tambahan
 */

let latestData: Record<string, unknown> | null = null

/**
 * Normalisasi key `do` → `do_value` agar konsisten di seluruh aplikasi.
 * (Dipindahkan dari redis-cache.ts)
 */
export function normalizeSensorPayload(
  raw: Record<string, unknown>
): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...raw }
  if ('do' in normalized && !('do_value' in normalized)) {
    normalized.do_value = normalized.do
    delete normalized.do
  }
  return normalized
}

/**
 * Simpan 1 pembacaan sensor terbaru ke memori.
 * Dipanggil setiap kali data masuk dari serial port.
 */
export function cacheLatestData(data: Record<string, unknown>): void {
  latestData = { ...data, cached_at: new Date().toISOString() }
}

/**
 * Ambil pembacaan terakhir dari cache memori.
 * Dipakai oleh:
 * - Express API `/api/current`
 * - Socket.IO saat client baru terhubung (kirim data terakhir)
 */
export function getLatestData(): Record<string, unknown> | null {
  return latestData
}
