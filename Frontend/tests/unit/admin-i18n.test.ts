import { describe, expect, it } from 'vitest'

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import {
  adminDrafts,
  adminT,
  adminVisitsTotal,
  hasAdminTranslation,
  parseAdminLang,
} from '@/lib/admin-i18n'

describe('bahasa tampilan admin', () => {
  it('cookie selain "en" dianggap bahasa Indonesia', () => {
    expect(parseAdminLang('en')).toBe('en')
    expect(parseAdminLang('id')).toBe('id')
    expect(parseAdminLang(undefined)).toBe('id')
    expect(parseAdminLang('EN')).toBe('id')
  })

  it('menerjemahkan teks yang ada di kamus dan membiarkan sisanya', () => {
    expect(adminT('en', 'Keluar')).toBe('Log out')
    expect(adminT('id', 'Keluar')).toBe('Keluar')
    // nama project atau teks yang belum diterjemahkan tampil apa adanya
    expect(adminT('en', 'Project E2E 123')).toBe('Project E2E 123')
  })

  it('kalimat berangka mengikuti bahasa', () => {
    expect(adminDrafts('id', 2)).toBe('2 draf')
    expect(adminDrafts('en', 1)).toBe('1 draft')
    expect(adminDrafts('en', 3)).toBe('3 drafts')
    expect(adminVisitsTotal('en', 1200)).toBe('Total 1,200 visits. Days in WIB.')
    expect(adminVisitsTotal('id', 1200)).toBe('Total 1.200 kunjungan. Hari menurut WIB.')
  })
})

describe('pola dan isian kamus admin', () => {
  it('pesan validasi dari server diterjemahkan beserta nama isiannya', () => {
    expect(adminT('en', 'Judul wajib diisi')).toBe('Title is required')
    expect(adminT('en', 'Ringkasan maksimal 240 karakter')).toBe(
      'Summary must be at most 240 characters',
    )
    expect(
      adminT('en', 'Kategori masih berisi 1 skill. Pindahkan atau hapus skill-nya dulu.'),
    ).toBe('This category still has 1 skill. Move or delete them first.')
  })

  it('nilai {nama} diisi di kedua bahasa', () => {
    expect(adminT('id', 'Hapus {item}', { item: 'pesan ini' })).toBe('Hapus pesan ini')
    expect(adminT('en', 'Hapus {item}', { item: 'this message' })).toBe('Delete this message')
  })
})

// Setiap t('...') di kode admin harus ada di kamus Inggris, agar tombol ID/EN benar-benar mengganti
// seluruh tampilan admin (permintaan pemilik 2026-11-11, DESIGN.md bagian 115).
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(name) ? [path] : []
  })
}

describe('kelengkapan kamus admin', () => {
  it('semua teks t(...) di panel admin punya terjemahan Inggris', () => {
    // komponen situs publik (folder public/) memakai next-intl, bukan kamus admin
    const files = ['src/components/admin', 'src/features', 'src/app/admin']
      .flatMap(sourceFiles)
      .filter((file) => !/[\\/]public[\\/]/.test(file))
    const missing: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) {
        const text = match[1]!.replace(/\\'/g, "'")
        if (!hasAdminTranslation(text)) missing.push(`${file}: ${text}`)
      }
    }
    expect(missing).toEqual([])
  })
})
