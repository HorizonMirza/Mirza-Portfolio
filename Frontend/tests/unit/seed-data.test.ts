import { describe, expect, it } from 'vitest'

import { experiences, profile, projects, skillCategories } from '../../../Database/seed/seed-data'

type Bilingual = { id: string; en: string }

function expectBilingual(value: Bilingual, label: string) {
  expect(value.id.trim(), `${label} (id)`).not.toBe('')
  expect(value.en.trim(), `${label} (en)`).not.toBe('')
}

describe('data seed', () => {
  it('semua teks publik ada dalam dua bahasa', () => {
    expectBilingual(profile.headline, 'profile.headline')
    expectBilingual(profile.bio, 'profile.bio')
    expectBilingual(profile.currentRole, 'profile.currentRole')
    for (const e of experiences) {
      expectBilingual(e.title, `${e.key}.title`)
      expectBilingual(e.description, `${e.key}.description`)
    }
    for (const c of skillCategories) expectBilingual(c.name, `${c.key}.name`)
    for (const p of projects) {
      expectBilingual(p.title, `${p.slug}.title`)
      expectBilingual(p.summary, `${p.slug}.summary`)
      expectBilingual(p.description, `${p.slug}.description`)
    }
  })

  it('tidak memuat email atau nomor telepon pribadi', () => {
    const text = JSON.stringify({ profile, experiences, projects })
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/)
    expect(text).not.toMatch(/(\+62|08)\d{8,}/)
  })

  it('tanggal valid dan tanggal selesai tidak mendahului tanggal mulai', () => {
    for (const e of experiences) {
      const start = new Date(e.startDate)
      expect(Number.isNaN(start.getTime()), e.key).toBe(false)
      if (e.endDate) expect(new Date(e.endDate) >= start, e.key).toBe(true)
    }
  })

  it('skill project hanya merujuk skill yang ada', () => {
    const known = new Set(skillCategories.flatMap((c) => c.skills))
    for (const p of projects)
      for (const s of p.skills) expect(known.has(s), `${p.slug}: ${s}`).toBe(true)
  })

  it('key unik', () => {
    const keys = experiences.map((e) => e.key)
    expect(new Set(keys).size).toBe(keys.length)
    const skills = skillCategories.flatMap((c) => c.skills)
    expect(new Set(skills).size).toBe(skills.length)
  })
})
