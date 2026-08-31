/**
 * Serial Port Manager — Aquaphonik Desktop
 * Handles scanning, connecting, reading, and writing to serial ports.
 * Communicates with Vue renderer via IPC through the main process.
 *
 * Features:
 * - Throttled data forwarding (max 1x per THROTTLE_MS) to prevent UI lag
 * - Auto-reconnect with retry when USB cable is unplugged unexpectedly
 */

import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { BrowserWindow } from 'electron'

// --- Configuration ---
const THROTTLE_MS = 2000 // Kirim data ke renderer/callback max 1x per 2 detik
const RECONNECT_INTERVAL_MS = 3000 // Coba reconnect setiap 3 detik
const RECONNECT_MAX_RETRIES = 20 // Max 20 percobaan (~1 menit)

// --- State ---
let port: SerialPort | null = null
let parser: ReadlineParser | null = null
let dataCallback: ((data: Record<string, number>) => void) | null = null

// Throttle state
let lastForwardTimestamp = 0
let pendingData: Record<string, number> | null = null
let throttleTimer: ReturnType<typeof setTimeout> | null = null

// Auto-reconnect state
let lastConnectedPath = ''
let lastConnectedBaud = 115200
let isManualDisconnect = false
let reconnectTimer: ReturnType<typeof setInterval> | null = null
let reconnectAttempts = 0

/**
 * Register a callback to receive parsed sensor data (used by main process for DB logging)
 */
export function onData(callback: (data: Record<string, number>) => void): void {
  dataCallback = callback
}

export interface SerialPortInfo {
  path: string
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  vendorId?: string
  productId?: string
}

/**
 * Scan all available COM/Serial ports
 */
export async function listPorts(): Promise<SerialPortInfo[]> {
  try {
    const ports = await SerialPort.list()
    return ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer,
      serialNumber: p.serialNumber,
      pnpId: p.pnpId,
      vendorId: p.vendorId,
      productId: p.productId
    }))
  } catch (error) {
    console.error('[Serial] Error listing ports:', error)
    return []
  }
}

/**
 * Connect to a specific serial port
 */
export function connectPort(
  portPath: string,
  baudRate: number = 115200
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    // Stop any ongoing reconnect attempts
    stopReconnect()

    // Disconnect existing port first
    if (port && port.isOpen) {
      port.close()
      port = null
      parser = null
    }

    try {
      port = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        autoOpen: false
      })

      // Create readline parser (JSON comes line by line from ESP32)
      parser = new ReadlineParser({ delimiter: '\n' })
      port.pipe(parser)

      // Listen for parsed data (each line = one JSON payload)
      parser.on('data', (rawLine: string) => {
        handleSerialData(rawLine.trim())
      })

      // Handle port errors
      port.on('error', (err) => {
        console.error('[Serial] Port error:', err.message)
        sendToRenderer('serial:error', { message: err.message })
      })

      // Handle port close — trigger auto-reconnect if not manual
      port.on('close', () => {
        console.log('[Serial] Port closed')
        sendToRenderer('serial:status', { connected: false, port: '' })

        // Auto-reconnect jika bukan disconnect manual (misalnya USB tercabut)
        if (!isManualDisconnect && lastConnectedPath) {
          startReconnect()
        }
      })

      // Open the port
      port.open((err) => {
        if (err) {
          console.error('[Serial] Failed to open port:', err.message)
          resolve({ success: false, message: err.message })
        } else {
          // Simpan info koneksi terakhir untuk auto-reconnect
          lastConnectedPath = portPath
          lastConnectedBaud = baudRate
          isManualDisconnect = false
          reconnectAttempts = 0

          console.log(`[Serial] Connected to ${portPath} @ ${baudRate} baud`)
          sendToRenderer('serial:status', { connected: true, port: portPath })
          resolve({ success: true, message: `Connected to ${portPath}` })
        }
      })
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Serial] Connection error:', errMsg)
      resolve({ success: false, message: errMsg })
    }
  })
}

/**
 * Disconnect from the current serial port (manual — does NOT trigger auto-reconnect)
 */
export function disconnectPort(): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    // Tandai sebagai disconnect manual agar auto-reconnect tidak aktif
    isManualDisconnect = true
    stopReconnect()

    if (port && port.isOpen) {
      port.close((err) => {
        if (err) {
          resolve({ success: false, message: err.message })
        } else {
          port = null
          parser = null
          lastConnectedPath = ''
          resolve({ success: true, message: 'Disconnected' })
        }
      })
    } else {
      lastConnectedPath = ''
      resolve({ success: true, message: 'Already disconnected' })
    }
  })
}

// =====================================================
// Auto-Reconnect
// =====================================================

/**
 * Mulai proses auto-reconnect secara berkala.
 * Dipicu saat port tertutup secara tidak sengaja (USB tercabut, dsb).
 */
function startReconnect(): void {
  if (reconnectTimer) return // Sudah berjalan

  reconnectAttempts = 0
  console.log(`[Serial] ⚡ Koneksi terputus, memulai auto-reconnect ke ${lastConnectedPath}...`)
  sendToRenderer('serial:reconnecting', {
    port: lastConnectedPath,
    attempt: 0,
    maxRetries: RECONNECT_MAX_RETRIES
  })

  reconnectTimer = setInterval(async () => {
    reconnectAttempts++

    // Cek apakah port tersedia di daftar
    const ports = await listPorts()
    const portExists = ports.some((p) => p.path === lastConnectedPath)

    if (portExists) {
      console.log(
        `[Serial] 🔄 Percobaan reconnect ${reconnectAttempts}/${RECONNECT_MAX_RETRIES} — port ditemukan, connecting...`
      )

      const result = await connectPort(lastConnectedPath, lastConnectedBaud)
      if (result.success) {
        console.log(`[Serial] ✅ Auto-reconnect berhasil ke ${lastConnectedPath}`)
        stopReconnect()
        return
      }
    } else {
      console.log(
        `[Serial] 🔄 Percobaan reconnect ${reconnectAttempts}/${RECONNECT_MAX_RETRIES} — port belum tersedia`
      )
    }

    sendToRenderer('serial:reconnecting', {
      port: lastConnectedPath,
      attempt: reconnectAttempts,
      maxRetries: RECONNECT_MAX_RETRIES
    })

    // Batas max retry tercapai
    if (reconnectAttempts >= RECONNECT_MAX_RETRIES) {
      console.error(`[Serial] ❌ Auto-reconnect gagal setelah ${RECONNECT_MAX_RETRIES} percobaan`)
      sendToRenderer('serial:reconnect-failed', {
        port: lastConnectedPath,
        attempts: reconnectAttempts
      })
      stopReconnect()
    }
  }, RECONNECT_INTERVAL_MS)
}

/**
 * Hentikan proses auto-reconnect.
 */
function stopReconnect(): void {
  if (reconnectTimer) {
    clearInterval(reconnectTimer)
    reconnectTimer = null
  }
  reconnectAttempts = 0
}

// =====================================================
// Data Handling with Throttle
// =====================================================

/**
 * Send a command string to the microcontroller
 * Examples: "POMPA:1", "POMPA:0", "OKSIGEN:1", "OKSIGEN:0"
 */
export function sendCommand(command: string): { success: boolean; message: string } {
  if (!port || !port.isOpen) {
    return { success: false, message: 'Serial port not connected' }
  }

  try {
    port.write(command + '\n', (err) => {
      if (err) {
        console.error('[Serial] Write error:', err.message)
        sendToRenderer('serial:error', { message: `Write failed: ${err.message}` })
      } else {
        console.log(`[Serial] Sent command: ${command}`)
      }
    })
    return { success: true, message: `Command sent: ${command}` }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: errMsg }
  }
}

/**
 * Get current connection status
 */
export function getStatus(): { connected: boolean; port: string } {
  return {
    connected: port !== null && port.isOpen,
    port: port?.path || ''
  }
}

/**
 * Handle incoming serial data — parse JSON, throttle, and forward.
 *
 * Throttle logic:
 * - Data dari ESP32 masuk setiap ~2 detik, tapi bisa burst lebih cepat
 * - Kita hanya meneruskan ke renderer/callback max 1x per THROTTLE_MS
 * - Data terbaru selalu disimpan sehingga yang dikirim selalu yang paling aktual
 */
function handleSerialData(rawLine: string): void {
  // Skip empty lines or debug messages
  if (!rawLine || !rawLine.startsWith('{')) {
    return
  }

  try {
    const data = JSON.parse(rawLine) as Record<string, number>
    const now = Date.now()

    // Jika sudah lewat interval throttle, kirim langsung
    if (now - lastForwardTimestamp >= THROTTLE_MS) {
      forwardData(data)
      lastForwardTimestamp = now

      // Hapus pending timer jika ada
      if (throttleTimer) {
        clearTimeout(throttleTimer)
        throttleTimer = null
      }
      pendingData = null
    } else {
      // Simpan data terbaru, set timer untuk kirim saat interval berikutnya
      pendingData = data
      if (!throttleTimer) {
        const remainingMs = THROTTLE_MS - (now - lastForwardTimestamp)
        throttleTimer = setTimeout(() => {
          if (pendingData) {
            forwardData(pendingData)
            lastForwardTimestamp = Date.now()
            pendingData = null
          }
          throttleTimer = null
        }, remainingMs)
      }
    }
  } catch {
    // Not valid JSON — could be debug output from MCU, ignore silently
    console.log('[Serial] Non-JSON data:', rawLine.substring(0, 80))
  }
}

/**
 * Forward parsed data to renderer (IPC) and registered callback (DB/Socket.IO)
 */
function forwardData(data: Record<string, number>): void {
  sendToRenderer('serial:data', data)
  if (dataCallback) {
    dataCallback(data)
  }
}

/**
 * Send data to the renderer process via IPC
 */
function sendToRenderer(channel: string, data: unknown): void {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data)
    }
  })
}

/**
 * Cleanup on app quit
 */
export function cleanup(): void {
  isManualDisconnect = true
  stopReconnect()

  if (throttleTimer) {
    clearTimeout(throttleTimer)
    throttleTimer = null
  }

  if (port && port.isOpen) {
    port.close()
  }
  port = null
  parser = null
}
