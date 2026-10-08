import { describe, expect, it } from 'vitest'

import { initials, organizationName } from '@/features/experience/schema'

describe('initials', () => {
  it('mengambil dua huruf awal tanpa "PT" dan tanpa bagian setelah koma', () => {
    expect(initials('PT PGAS Solution')).toBe('PS')
    expect(initials('Student Support, BINUS University')).toBe('SS')
    expect(initials('BINUS University')).toBe('BU')
  })

  it('jatuh ke dua huruf pertama bila tidak ada kata berhuruf besar', () => {
    expect(initials('algo')).toBe('AL')
  })
})

describe('organizationName', () => {
  const binus = {
    organization: 'Universitas Bina Nusantara',
    organization_en: 'Bina Nusantara University',
  }

  it('bahasa Indonesia memakai nama utama', () => {
    expect(organizationName(binus, 'id')).toBe('Universitas Bina Nusantara')
  })

  it('bahasa Inggris memakai organization_en bila diisi', () => {
    expect(organizationName(binus, 'en')).toBe('Bina Nusantara University')
  })

  it('organization_en kosong atau null jatuh ke nama utama', () => {
    expect(organizationName({ organization: 'Ace Padel Club', organization_en: null }, 'en')).toBe(
      'Ace Padel Club',
    )
    expect(organizationName({ organization: 'Ace Padel Club', organization_en: '' }, 'en')).toBe(
      'Ace Padel Club',
    )
  })
})
