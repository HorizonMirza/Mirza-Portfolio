import { describe, expect, it } from 'vitest'

import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'

describe('SHIMMER_PLACEHOLDER', () => {
  const svg = decodeURIComponent(SHIMMER_PLACEHOLDER.replace('data:image/svg+xml,', ''))

  it('berupa data URL SVG yang diterima next/image', () => {
    expect(SHIMMER_PLACEHOLDER.startsWith('data:image/svg+xml,')).toBe(true)
    expect(svg.startsWith('<svg')).toBe(true)
  })

  it('mengisi seluruh bidang gambar dan diam saat reduced motion', () => {
    // tanpa viewBox agar background-size cover/contain mengisi bidang, bukan persegi
    expect(svg).not.toContain('viewBox')
    expect(svg).toContain('prefers-reduced-motion:reduce')
  })
})
