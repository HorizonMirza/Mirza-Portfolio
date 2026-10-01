import { describe, expect, it } from 'vitest'

import { playLanguageSound, playNavSound, playThemeSound } from '@/lib/ui-sounds'

describe('ui-sounds', () => {
  it('tanpa Web Audio (server, browser lama) tidak melempar galat', () => {
    expect(() => playThemeSound(true)).not.toThrow()
    expect(() => playLanguageSound(false)).not.toThrow()
    expect(() => playNavSound()).not.toThrow()
  })
})
