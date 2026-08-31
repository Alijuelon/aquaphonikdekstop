/**
 * Unit Tests — In-Memory Cache
 * Menguji fungsi cacheLatestData, getLatestData, normalizeSensorPayload
 */
import { describe, it, expect, beforeEach } from 'vitest'

/**
 * Karena in-memory-cache.ts menggunakan module-level state (let latestData),
 * kita perlu re-import setiap test suite agar state bersih.
 * Vitest mendukung dynamic import + resetModules via vi.
 */
import {
  cacheLatestData,
  getLatestData,
  normalizeSensorPayload
} from '../in-memory-cache'

describe('normalizeSensorPayload', () => {
  it('should rename "do" key to "do_value"', () => {
    const raw = { temp_water: 25.5, ph: 7.0, do: 6.2 }
    const result = normalizeSensorPayload(raw)

    expect(result).toHaveProperty('do_value', 6.2)
    expect(result).not.toHaveProperty('do')
    expect(result).toHaveProperty('temp_water', 25.5)
    expect(result).toHaveProperty('ph', 7.0)
  })

  it('should NOT rename if "do_value" already exists', () => {
    const raw = { temp_water: 25.5, do_value: 6.2 }
    const result = normalizeSensorPayload(raw)

    expect(result).toHaveProperty('do_value', 6.2)
    expect(result).not.toHaveProperty('do')
  })

  it('should pass through data without "do" key unchanged', () => {
    const raw = { temp_water: 25.5, ph: 7.0, tds: 500 }
    const result = normalizeSensorPayload(raw)

    expect(result).toEqual({ temp_water: 25.5, ph: 7.0, tds: 500 })
  })

  it('should not mutate the original object', () => {
    const raw = { do: 6.2, ph: 7.0 }
    const original = { ...raw }
    normalizeSensorPayload(raw)

    expect(raw).toEqual(original)
  })
})

describe('cacheLatestData / getLatestData', () => {
  beforeEach(() => {
    // Cache a known value to reset state (module-level singleton)
    cacheLatestData({ reset: 1 })
  })

  it('should return null-like or previous data before first cache', () => {
    // After reset, the cache has { reset: 1 } from beforeEach
    const data = getLatestData()
    expect(data).toBeTruthy()
  })

  it('should store and retrieve the latest data', () => {
    const sensorData = { temp_water: 28.3, ph: 6.8, tds: 450 }
    cacheLatestData(sensorData)

    const result = getLatestData()
    expect(result).not.toBeNull()
    expect(result!.temp_water).toBe(28.3)
    expect(result!.ph).toBe(6.8)
    expect(result!.tds).toBe(450)
  })

  it('should add a "cached_at" ISO timestamp', () => {
    cacheLatestData({ temp_water: 25 })
    const result = getLatestData()

    expect(result).toHaveProperty('cached_at')
    // Verify it's a valid ISO string
    const date = new Date(result!.cached_at as string)
    expect(date.getTime()).not.toBeNaN()
  })

  it('should overwrite previous data with the latest', () => {
    cacheLatestData({ temp_water: 20 })
    cacheLatestData({ temp_water: 30, ph: 7.5 })

    const result = getLatestData()
    expect(result!.temp_water).toBe(30)
    expect(result!.ph).toBe(7.5)
  })

  it('should not mutate the cached data when input changes', () => {
    const input = { temp_water: 25 }
    cacheLatestData(input)

    // Mutate the input after caching
    input.temp_water = 99

    const result = getLatestData()
    expect(result!.temp_water).toBe(25) // Should still be 25
  })
})
