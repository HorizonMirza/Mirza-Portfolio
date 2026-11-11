import { describe, expect, it } from 'vitest'

import { adminDrafts, adminT, adminVisitsTotal, parseAdminLang } from '@/lib/admin-i18n'

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
