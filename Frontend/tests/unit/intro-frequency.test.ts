import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  INTRO_PENDING_ATTR,
  INTRO_SEEN_KEY,
  INTRO_WEEK_MS,
  introPendingScript,
  introSeen,
  markIntroSeen,
} from '@/features/settings/intro-pending'
import type { IntroFrequency } from '@/features/settings/options'

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  }
}

function stubStorages() {
  const session = memoryStorage()
  const local = memoryStorage()
  vi.stubGlobal('sessionStorage', session)
  vi.stubGlobal('localStorage', local)
  return { session, local }
}

// Jalankan skrip sebaris seperti di <body> dan kembalikan apakah kartu ditandai akan dibuka.
function scriptMarksPending(frequency: IntroFrequency) {
  const attrs = new Set<string>()
  const documentStub = {
    documentElement: {
      setAttribute: (name: string) => attrs.add(name),
      removeAttribute: (name: string) => attrs.delete(name),
    },
  }
  new Function('navigator', 'document', 'setTimeout', introPendingScript(frequency))(
    { webdriver: false },
    documentStub,
    () => 0,
  )
  return attrs.has(INTRO_PENDING_ATTR)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('frekuensi kartu pembuka', () => {
  it('setiap kunjungan baru: hanya diingat selama sesi browser', () => {
    const { session, local } = stubStorages()
    expect(introSeen('visit')).toBe(false)
    expect(scriptMarksPending('visit')).toBe(true)
    markIntroSeen('visit')
    expect(session.getItem(INTRO_SEEN_KEY)).toBe('1')
    expect(local.getItem(INTRO_SEEN_KEY)).toBeNull()
    expect(introSeen('visit')).toBe(true)
    expect(scriptMarksPending('visit')).toBe(false)
  })

  it('sekali saja: tetap diingat di kunjungan berikutnya', () => {
    stubStorages()
    markIntroSeen('once', 1000)
    // sesi baru: sessionStorage kosong, localStorage tetap
    vi.stubGlobal('sessionStorage', memoryStorage())
    expect(introSeen('once', 10 * INTRO_WEEK_MS)).toBe(true)
    expect(scriptMarksPending('once')).toBe(false)
  })

  it('seminggu sekali: muncul lagi setelah 7 hari', () => {
    stubStorages()
    const now = Date.now()
    markIntroSeen('weekly', now - INTRO_WEEK_MS + 60_000)
    expect(introSeen('weekly', now)).toBe(true)
    expect(scriptMarksPending('weekly')).toBe(false)
    markIntroSeen('weekly', now - INTRO_WEEK_MS - 60_000)
    expect(introSeen('weekly', now)).toBe(false)
    expect(scriptMarksPending('weekly')).toBe(true)
  })

  it('penyimpanan diblokir: kartu tetap boleh tampil tanpa galat', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    vi.stubGlobal('sessionStorage', blocked)
    vi.stubGlobal('localStorage', blocked)
    expect(introSeen('weekly')).toBe(false)
    expect(() => markIntroSeen('once')).not.toThrow()
  })
})
