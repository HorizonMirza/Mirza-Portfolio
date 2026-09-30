'use client'

import { useTranslations } from 'next-intl'
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

// Filter project di klien: kartu dirender server, filter hanya menyembunyikan lewat atribut hidden.
// Tanpa JavaScript semua project tetap tampil.
export function ProjectFilter({
  categories,
  skills,
  items,
  children,
}: {
  categories: { value: string; label: string }[]
  skills: { id: string; name: string }[]
  // metadata tiap kartu (urutan sama dengan children yang bertanda data-card)
  items: { slug: string; category: string; skillIds: string[] }[]
  children: ReactNode
}) {
  const t = useTranslations('Projects')
  const uid = useId()
  const grid = useRef<HTMLDivElement>(null)
  const [category, setCategory] = useState('')
  const [skill, setSkill] = useState('')
  const visible = useMemo(
    () =>
      new Set(
        items
          .filter(
            (i) => (!category || i.category === category) && (!skill || i.skillIds.includes(skill)),
          )
          .map((i) => i.slug),
      ),
    [items, category, skill],
  )

  // Hanya menyentuh DOM (atribut hidden), state tetap dihitung saat render.
  useEffect(() => {
    for (const card of grid.current?.querySelectorAll<HTMLElement>('[data-card]') ?? []) {
      card.hidden = !visible.has(card.dataset.card ?? '')
    }
  }, [visible])

  const reset = () => {
    setCategory('')
    setSkill('')
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        {categories.length > 1 ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${uid}-category`}>{t('filterCategory')}</Label>
            <select
              id={`${uid}-category`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-11 rounded-md border border-border-strong bg-surface px-3 text-base text-text"
            >
              <option value="">{t('all')}</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${uid}-skill`}>{t('filterTech')}</Label>
          <select
            id={`${uid}-skill`}
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="min-h-11 rounded-md border border-border-strong bg-surface px-3 text-base text-text"
          >
            <option value="">{t('all')}</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div ref={grid} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
      <div role="status" aria-live="polite" className="empty:hidden">
        {visible.size === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-6 text-muted">
            <p>{t('emptyFilter')}</p>
            <Button variant="secondary" size="sm" onClick={reset}>
              {t('resetFilter')}
            </Button>
          </div>
        ) : null}
      </div>
    </>
  )
}
