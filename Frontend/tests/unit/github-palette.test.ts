// Tes unit Backend/lib/github-palette: warna grafik GitHub.

import { describe, expect, it } from 'vitest'

import {
  GITHUB_PALETTE,
  GITHUB_PRESET_KEYS,
  GITHUB_PRESETS,
  HEX_COLOR,
  isDefaultPalette,
  presetOf,
  toPalette,
} from '@backend/lib/github-palette'

describe('warna grafik GitHub', () => {
  it('lima pilihan, tiap pilihan empat warna hex per tema, dan biru adalah bawaan', () => {
    expect(GITHUB_PRESET_KEYS).toEqual(['red', 'yellow', 'green', 'blue', 'purple'])
    for (const key of GITHUB_PRESET_KEYS)
      for (const theme of ['light', 'dark'] as const) {
        expect(GITHUB_PRESETS[key][theme]).toHaveLength(4)
        for (const color of GITHUB_PRESETS[key][theme]) expect(color).toMatch(HEX_COLOR)
      }
    expect(GITHUB_PRESETS.blue).toBe(GITHUB_PALETTE)
    expect(isDefaultPalette(GITHUB_PRESETS.blue)).toBe(true)
    expect(isDefaultPalette(GITHUB_PRESETS.purple)).toBe(false)
  })

  it('palet dari database yang rusak diabaikan, yang sah dikenali sebagai pilihannya', () => {
    expect(toPalette(null)).toBeNull()
    expect(toPalette('merah')).toBeNull()
    expect(toPalette({ light: ['#fff'], dark: [] })).toBeNull()
    expect(toPalette({ light: ['x', 'y', 'z', 'w'], dark: GITHUB_PALETTE.dark })).toBeNull()
    for (const key of GITHUB_PRESET_KEYS)
      expect(presetOf(toPalette(JSON.parse(JSON.stringify(GITHUB_PRESETS[key]))))).toBe(key)
    // kosong atau tidak cocok pilihan mana pun: biru bawaan
    expect(presetOf(null)).toBe('blue')
    expect(
      presetOf({ light: ['#000000', '#111111', '#222222', '#333333'], dark: GITHUB_PALETTE.dark }),
    ).toBe('blue')
  })
})
