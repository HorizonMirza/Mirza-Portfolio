import { describe, expect, it } from 'vitest'

import { LANG_REVEAL_KEY, LANG_REVEAL_SCRIPT } from '@/lib/circle-reveal'

describe('LANG_REVEAL_SCRIPT', () => {
  it('JavaScript yang sah dan memakai kunci sessionStorage yang sama', () => {
    expect(() => new Function(LANG_REVEAL_SCRIPT)).not.toThrow()
    expect(LANG_REVEAL_SCRIPT).toContain(`'${LANG_REVEAL_KEY}'`)
  })

  it('hanya mendengar pageswap dan pagereveal, tanpa memuat sumber luar', () => {
    expect(LANG_REVEAL_SCRIPT).toContain("addEventListener('pageswap'")
    expect(LANG_REVEAL_SCRIPT).toContain("addEventListener('pagereveal'")
    expect(LANG_REVEAL_SCRIPT).not.toMatch(/https?:|fetch\(|import\(|eval\(/)
  })
})
