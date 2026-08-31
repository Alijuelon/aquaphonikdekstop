/**
 * Unit Tests — Serial Data Parser
 * Menguji logika parsing JSON dari ESP32 (simulasi handleSerialData).
 *
 * Karena handleSerialData() adalah fungsi private di serial.ts,
 * kita mengekstrak logika parsingnya ke test ini dan memverifikasi behavior-nya.
 */
import { describe, it, expect } from 'vitest'

/**
 * Replika dari logika parsing di serial.ts handleSerialData()
 * Kita test fungsi ini secara independen tanpa dependency ke SerialPort/Electron.
 */
function parseSerialLine(rawLine: string): Record<string, number> | null {
  // Skip empty lines or debug messages (same logic as serial.ts)
  if (!rawLine || !rawLine.startsWith('{')) {
    return null
  }

  try {
    const data = JSON.parse(rawLine) as Record<string, number>
    return data
  } catch {
    return null
  }
}

describe('Serial Data Parser', () => {
  describe('Valid JSON from ESP32', () => {
    it('should parse a complete sensor payload', () => {
      const line =
        '{"temp_water":27.5,"ph":6.8,"tds":450,"do":5.2,"turbidity":120,"water_lvl":75}'
      const result = parseSerialLine(line)

      expect(result).not.toBeNull()
      expect(result!.temp_water).toBe(27.5)
      expect(result!.ph).toBe(6.8)
      expect(result!.tds).toBe(450)
      expect(result!.do).toBe(5.2)
      expect(result!.turbidity).toBe(120)
      expect(result!.water_lvl).toBe(75)
    })

    it('should parse a minimal payload', () => {
      const line = '{"temp_water":25}'
      const result = parseSerialLine(line)

      expect(result).not.toBeNull()
      expect(result!.temp_water).toBe(25)
    })

    it('should handle float precision correctly', () => {
      const line = '{"ph":7.123456,"temp_water":28.99}'
      const result = parseSerialLine(line)

      expect(result).not.toBeNull()
      expect(result!.ph).toBeCloseTo(7.123456, 5)
      expect(result!.temp_water).toBeCloseTo(28.99, 2)
    })

    it('should handle zero values', () => {
      const line = '{"pump_status":0,"oxy_status":0,"tds":0}'
      const result = parseSerialLine(line)

      expect(result).not.toBeNull()
      expect(result!.pump_status).toBe(0)
      expect(result!.oxy_status).toBe(0)
      expect(result!.tds).toBe(0)
    })

    it('should handle negative values (e.g., sub-zero temps)', () => {
      const line = '{"temp_water":-2.5,"temp_air":-10}'
      const result = parseSerialLine(line)

      expect(result).not.toBeNull()
      expect(result!.temp_water).toBe(-2.5)
      expect(result!.temp_air).toBe(-10)
    })
  })

  describe('Invalid / Debug Lines', () => {
    it('should return null for empty string', () => {
      expect(parseSerialLine('')).toBeNull()
    })

    it('should return null for whitespace-only string', () => {
      expect(parseSerialLine('   ')).toBeNull()
    })

    it('should return null for debug text from MCU', () => {
      expect(parseSerialLine('Sensor initialized OK')).toBeNull()
      expect(parseSerialLine('ESP32 ready...')).toBeNull()
      expect(parseSerialLine('[DEBUG] ADC reading: 1024')).toBeNull()
    })

    it('should return null for malformed JSON', () => {
      expect(parseSerialLine('{temp_water:25}')).toBeNull() // missing quotes
      expect(parseSerialLine('{"ph": }')).toBeNull() // missing value
      expect(parseSerialLine('{incomplete')).toBeNull() // truncated
    })

    it('should return null for lines starting with non-brace characters', () => {
      expect(parseSerialLine('OK {"temp":25}')).toBeNull()
      expect(parseSerialLine('> {"temp":25}')).toBeNull()
      expect(parseSerialLine('# comment')).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const line = '{"tds":99999,"co2":50000}'
      const result = parseSerialLine(line)

      expect(result).not.toBeNull()
      expect(result!.tds).toBe(99999)
      expect(result!.co2).toBe(50000)
    })

    it('should handle a complete real-world payload from ESP32', () => {
      // Simulasi payload lengkap yang dikirim oleh firmware
      const line = JSON.stringify({
        temp_water: 27.5,
        ph: 6.82,
        ph_volts: 2.45,
        tds: 480,
        do: 5.6,
        turbidity: 115,
        water_lvl: 80,
        co2: 420,
        eco2: 450,
        tvoc: 30,
        temp_air: 30.2,
        humidity: 65.5,
        pump_status: 1,
        oxy_status: 0
      })

      const result = parseSerialLine(line)
      expect(result).not.toBeNull()
      expect(Object.keys(result!)).toHaveLength(14)
      expect(result!.pump_status).toBe(1)
      expect(result!.humidity).toBe(65.5)
    })
  })
})
