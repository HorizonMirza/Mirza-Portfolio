'use client'

// Pilihan teknologi project di admin: skill yang dimiliki, dikelompokkan per kategori seperti tab
// Skill teknis. Ditekan untuk dipilih atau dilepas.

import { useAdminT } from '@/components/admin/admin-lang'
import type { Lang } from '@/components/admin/live-edit'
import { cn } from '@/lib/utils'

import type { SkillOptionGroup } from '@backend/features/skills/queries'

export function ProjectStackPick({
  groups: skillGroups,
  lang,
  label,
  selected,
  onToggle,
}: {
  groups: SkillOptionGroup[]
  lang: Lang
  label: string
  selected: string[]
  onToggle: (id: string) => void
}) {
  const t = useAdminT()
  return (
    <div className="pj-pick admin-tight flex flex-col" role="group" aria-label={label}>
      {skillGroups.length === 0 ? (
        <p className="text-sm text-muted">{t('Belum ada skill. Tambahkan di menu Skill.')}</p>
      ) : (
        skillGroups.map((group) => (
          <section
            key={group.id}
            className="border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0"
          >
            <p className="text-lg font-semibold">{lang === 'en' ? group.name_en : group.name}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {group.skills.map((skill) => {
                const on = selected.includes(skill.id)
                return (
                  <li key={skill.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => onToggle(skill.id)}
                      className={cn(
                        'inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium',
                        on
                          ? 'border-text bg-surface ring-1 ring-text'
                          : 'border-dashed border-border text-muted hover:text-text',
                      )}
                    >
                      {skill.logo ? (
                        // logo kecil statis (unggahan atau public/skills), tanpa optimasi next/image
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={skill.logo.src}
                          alt=""
                          width={20}
                          height={20}
                          className="size-5 object-contain"
                          data-invert-dark={skill.logo.invertDark ? '' : undefined}
                        />
                      ) : null}
                      {skill.name}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
