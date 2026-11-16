import { describe, expect, it } from 'vitest'

import { employmentText } from '@/features/experience/display'

const tr = (type: string) => (type === 'INTERNSHIP' ? 'Magang' : type)
const none = { employmentType: null, employmentLabel_id: null, employmentLabel_en: null }

describe('employmentText', () => {
  it('teks bebas bahasa itu didahulukan', () => {
    expect(
      employmentText(
        { ...none, employmentLabel_id: 'Magang X', employmentLabel_en: 'Intern X' },
        'en',
        tr,
      ),
    ).toBe('Intern X')
  })
  it('tanpa teks bebas memakai jenis lama dari daftar', () => {
    expect(employmentText({ ...none, employmentType: 'INTERNSHIP' }, 'id', tr)).toBe('Magang')
  })
  it('hanya satu bahasa terisi: dipakai di bahasa lain juga', () => {
    expect(employmentText({ ...none, employmentLabel_en: 'Internship' }, 'id', tr)).toBe(
      'Internship',
    )
  })
  it('semua kosong: tidak ditampilkan', () => {
    expect(employmentText(none, 'id', tr)).toBe('')
  })
})
