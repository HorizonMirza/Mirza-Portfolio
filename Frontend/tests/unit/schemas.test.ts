import { describe, expect, it } from 'vitest'

import { changePasswordSchema } from '@/features/account/schema'
import {
  dateToMonth,
  emptyExperience,
  experienceSchema,
  monthToDate,
} from '@/features/experience/schema'
import { emptyProfile, profileSchema } from '@/features/profile/schema'
import { emptyProject, projectSchema } from '@/features/projects/schema'
import { skillCategorySchema, skillSchema } from '@/features/skills/schema'

const validProject = {
  ...emptyProject,
  slug: 'gaas',
  title_id: 'GAAS',
  title_en: 'GAAS',
  summary_id: 'Ringkasan',
  summary_en: 'Summary',
  description_id: 'Deskripsi',
  description_en: 'Description',
  year: 2026,
}

function fieldsOf(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return (result.error?.issues ?? []).map((i) => i.path.join('.'))
}

describe('projectSchema', () => {
  it('menerima project lengkap', () => {
    expect(projectSchema.safeParse(validProject).success).toBe(true)
  })
  it('wajib dua bahasa', () => {
    const r = projectSchema.safeParse({ ...validProject, title_en: '', summary_en: '   ' })
    expect(fieldsOf(r)).toEqual(expect.arrayContaining(['title_en', 'summary_en']))
  })
  it('menolak tahun di luar rentang dan kategori asing', () => {
    const r = projectSchema.safeParse({ ...validProject, year: 1999, category: 'LAINNYA' })
    expect(fieldsOf(r)).toEqual(expect.arrayContaining(['year', 'category']))
  })
  it('menolak id skill yang bukan UUID', () => {
    const r = projectSchema.safeParse({ ...validProject, skillIds: ['1 OR 1=1'] })
    expect(r.success).toBe(false)
  })
  it('memangkas spasi', () => {
    const r = projectSchema.parse({ ...validProject, title_id: '  GAAS  ' })
    expect(r.title_id).toBe('GAAS')
  })
})

describe('experienceSchema', () => {
  const base = {
    ...emptyExperience,
    organization: 'BINUS University',
    title_id: 'Mahasiswa',
    title_en: 'Student',
    description_id: '- poin',
    description_en: '- point',
    startMonth: '2024-09',
  }
  it('menerima pengalaman yang masih berlangsung', () => {
    expect(experienceSchema.safeParse(base).success).toBe(true)
  })
  it('menolak bulan selesai sebelum bulan mulai', () => {
    expect(fieldsOf(experienceSchema.safeParse({ ...base, endMonth: '2024-01' }))).toEqual([
      'endMonth',
    ])
  })
  it('menolak format bulan yang salah', () => {
    expect(fieldsOf(experienceSchema.safeParse({ ...base, startMonth: '2024-13' }))).toContain(
      'startMonth',
    )
  })
  it('jenis pekerjaan opsional: kosong atau salah satu jenis LinkedIn', () => {
    expect(experienceSchema.safeParse({ ...base, employmentType: 'INTERNSHIP' }).success).toBe(true)
    expect(experienceSchema.safeParse({ ...base, employmentType: '' }).success).toBe(true)
    expect(fieldsOf(experienceSchema.safeParse({ ...base, employmentType: 'MAGANG' }))).toContain(
      'employmentType',
    )
  })
  it('konversi bulan ke tanggal dan balik tanpa bergeser zona waktu', () => {
    expect(dateToMonth(monthToDate('2025-07'))).toBe('2025-07')
  })
})

describe('profileSchema', () => {
  const base = {
    ...emptyProfile,
    name: 'Muhammad Mirza',
    headline_id: 'h',
    headline_en: 'h',
    bio_id: 'b',
    bio_en: 'b',
  }
  it('kontak boleh kosong', () => {
    expect(profileSchema.safeParse(base).success).toBe(true)
  })
  it('memvalidasi email, WhatsApp, dan URL sosial', () => {
    const r = profileSchema.safeParse({
      ...base,
      email: 'bukan-email',
      whatsapp: '08-12',
      socials: { ...base.socials, github: 'javascript:alert(1)' },
    })
    expect(fieldsOf(r)).toEqual(expect.arrayContaining(['email', 'whatsapp', 'socials.github']))
  })
})

describe('skill schemas', () => {
  it('kategori wajib dua bahasa', () => {
    expect(skillCategorySchema.safeParse({ name_id: 'Bahasa', name_en: '' }).success).toBe(false)
  })
  it('ikon hanya slug', () => {
    const r = skillSchema.safeParse({
      name: 'Next.js',
      icon: '<svg>',
      categoryId: '01a0f218-0209-7656-a356-02d34f1c52c3',
    })
    expect(fieldsOf(r)).toEqual(['icon'])
  })
})

describe('changePasswordSchema', () => {
  const base = {
    currentPassword: 'lama-sekali-123',
    newPassword: 'baru-yang-panjang-1',
    confirmPassword: 'baru-yang-panjang-1',
  }
  it('menerima password baru yang cukup panjang', () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true)
  })
  it('minimal 12 karakter dan konfirmasi harus sama', () => {
    expect(
      fieldsOf(
        changePasswordSchema.safeParse({
          ...base,
          newPassword: 'pendek',
          confirmPassword: 'pendek',
        }),
      ),
    ).toContain('newPassword')
    expect(fieldsOf(changePasswordSchema.safeParse({ ...base, confirmPassword: 'lain' }))).toEqual([
      'confirmPassword',
    ])
  })
  it('password baru tidak boleh sama dengan yang lama', () => {
    const same = 'sama-persis-12345'
    const r = changePasswordSchema.safeParse({
      currentPassword: same,
      newPassword: same,
      confirmPassword: same,
    })
    expect(fieldsOf(r)).toEqual(['newPassword'])
  })
})
