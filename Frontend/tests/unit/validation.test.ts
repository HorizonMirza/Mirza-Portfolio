import { describe, expect, it } from 'vitest'

import { githubRepoSchema, optionalUrl, slugify, slugSchema } from '@/lib/validation'

describe('slugify', () => {
  it('mengubah judul menjadi slug huruf kecil', () => {
    expect(slugify('Judul Project Saya!')).toBe('judul-project-saya')
  })
  it('membuang aksen dan tanda baca di ujung', () => {
    expect(slugify('  Café — Ünïcode  ')).toBe('cafe-unicode')
  })
  it('dibatasi 80 karakter', () => {
    expect(slugify('a'.repeat(200))).toHaveLength(80)
  })
})

describe('slugSchema', () => {
  it.each(['gaas', 'portofolio-2026', 'a1'])('menerima %s', (v) => {
    expect(slugSchema.safeParse(v).success).toBe(true)
  })
  it.each(['A', 'Huruf-Besar', 'dua--strip', '-awal', 'spasi di tengah', '../etc'])(
    'menolak %s',
    (v) => {
      expect(slugSchema.safeParse(v).success).toBe(false)
    },
  )
})

describe('githubRepoSchema', () => {
  it.each(['', 'HorizonMirza/mirza-portfolio', 'vercel/next.js'])('menerima "%s"', (v) => {
    expect(githubRepoSchema.safeParse(v).success).toBe(true)
  })
  it.each([
    'mirza-portfolio',
    'a/b/c',
    'owner/..',
    'owner/.',
    'https://github.com/a/b',
    'own er/repo',
  ])('menolak "%s"', (v) => {
    expect(githubRepoSchema.safeParse(v).success).toBe(false)
  })
})

describe('optionalUrl', () => {
  const schema = optionalUrl('URL')
  it('boleh kosong', () => expect(schema.safeParse('').success).toBe(true))
  it('menerima https', () => expect(schema.safeParse('https://contoh.site').success).toBe(true))
  it.each(['javascript:alert(1)', 'ftp://x.y', 'contoh.site'])('menolak %s', (v) => {
    expect(schema.safeParse(v).success).toBe(false)
  })
})
