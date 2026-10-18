import { describe, expect, it } from 'vitest'

import { existsSync } from 'node:fs'
import path from 'node:path'

import {
  iconSlug,
  logoColorFor,
  resolveIcon,
  resolveLogo,
  toSkillItems,
} from '@/features/skills/skill-items'

import { skillCategories } from '../../../Database/seed/seed-data'

describe('skill-items', () => {
  it('slug mengikuti aturan Simple Icons', () => {
    expect(iconSlug('Next.js')).toBe('nextdotjs')
    expect(iconSlug('C++')).toBe('cplusplus')
    expect(iconSlug('Tailwind CSS')).toBe('tailwindcss')
  })

  it('ikon dicari dari kolom icon, lalu dari nama dan alias', () => {
    expect(resolveIcon('HTML', null)?.title).toBe('HTML5')
    expect(resolveIcon('Postgres', null)?.title).toBe('PostgreSQL')
    expect(resolveIcon('Apa saja', 'react')?.title).toBe('React')
    expect(resolveIcon('Project Management', null)).toBeNull()
  })

  it('semua skill pilihan pemilik punya logo (permintaan 2026-10-18)', () => {
    const missing = skillCategories
      .flatMap((c) => c.skills)
      .filter((name) => resolveIcon(name, null) === null)
    expect(missing).toEqual([])
    expect(resolveIcon('VS Code', null)?.title).toBe('Visual Studio Code')
    expect(resolveIcon('Codex', null)?.title).toBe('OpenAI')
    expect(resolveIcon('Kiro', null)?.evenOdd).toBe(true)
  })

  it('semua skill pilihan pemilik memakai logo asli yang berkasnya ada', () => {
    const missing = skillCategories
      .flatMap((c) => c.skills)
      .filter((name) => {
        const logo = resolveLogo(name, null)
        return !logo || !existsSync(path.join(process.cwd(), 'public', logo.src))
      })
    expect(missing).toEqual([])
    expect(resolveLogo('Codex', null)).toEqual({ src: '/skills/openai.svg', invertDark: true })
  })

  it('logo hampir hitam mengikuti warna teks, logo lain memakai warna brand', () => {
    expect(logoColorFor('F7DF1E')).toBe('#F7DF1E')
    expect(logoColorFor('000000')).toBeNull()
    expect(logoColorFor('181717')).toBeNull()
  })

  it('skill tanpa logo brand memakai ikon umum atau singkatan', () => {
    const [pm, other, ts, next] = toSkillItems(
      [
        {
          id: 'c1',
          name_id: 'Non-teknis',
          name_en: 'Non-technical',
          skills: [
            { id: 's1', name: 'Project Management', icon: null, projectSlugs: [] },
            { id: 's2', name: 'Public Speaking', icon: null, projectSlugs: [] },
            { id: 's3', name: 'TypeScript', icon: null, projectSlugs: ['porto'] },
          ],
        },
        {
          id: 'c2',
          name_id: 'Framework',
          name_en: 'Frameworks',
          skills: [{ id: 's4', name: 'Next.js', icon: null, projectSlugs: [] }],
        },
      ],
      'en',
    )
    expect(pm.glyph).toEqual({ kind: 'generic', name: 'kanban' })
    expect(pm.category).toBe('Non-technical')
    expect(other.glyph).toBeNull()
    expect(other.label).toBe('PS')
    expect(ts.logoColor).toBe('#3178C6')
    expect(ts.categoryIndex).toBe(0)
    expect(next.categoryIndex).toBe(1)
    expect(next.logoColor).toBeNull()
  })
})
