import { describe, expect, it } from 'vitest'

import { iconSlug, inkFor, resolveIcon, toKeycaps } from '@/features/skills/keycaps'

describe('keycaps', () => {
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

  it('warna logo hitam atau putih sesuai kontras', () => {
    expect(inkFor('#F7DF1E')).toBe('#0a0a0a')
    expect(inkFor('#000000')).toBe('#ffffff')
    expect(inkFor('#262626')).toBe('#ffffff')
  })

  it('skill tanpa logo brand memakai ikon umum atau singkatan', () => {
    const [pm, other, ts] = toKeycaps(
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
      ],
      'en',
      (slug) => `Judul ${slug}`,
    )
    expect(pm.glyph).toEqual({ kind: 'generic', name: 'kanban' })
    expect(pm.category).toBe('Non-technical')
    expect(other.glyph).toBeNull()
    expect(other.label).toBe('PS')
    expect(ts.color).toBe('#3178C6')
    expect(ts.projects).toEqual([{ slug: 'porto', title: 'Judul porto' }])
  })
})
