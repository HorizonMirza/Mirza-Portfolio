'use client'

import { Ellipsis } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type KeyboardEvent, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import {
  InlineInput,
  LANG_NAME,
  type Lang,
  LangToggle,
  LiveStage,
} from '@/components/admin/live-edit'
import { ReorderButtons } from '@/components/admin/reorder-buttons'
import type { ActionResult } from '@/lib/action-result'

import {
  deleteSkill,
  deleteSkillCategory,
  moveSkill,
  moveSkillCategory,
  saveSkill,
  saveSkillCategory,
} from '../actions'
import type { SkillCategoryAdmin } from '../queries'
import type { SkillItem } from '../skill-items'
import { SkillGlobe } from './skill-globe'
import { SkillDialog } from './skill-dialogs'

type GlobeLabels = {
  globe: string
  list: string
  categories: string
  category: string
  all: string
}

// Enter menyimpan seperti keluar dari kolom
function blurOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'Enter') {
    event.preventDefault()
    event.currentTarget.blur()
  }
}

// Teks yang disimpan sendiri saat kolom ditinggalkan (atau Enter), tanpa tombol Simpan: daftar
// skill berisi banyak butir kecil, masing-masing tersimpan langsung seperti di aplikasi catatan.
function AutoText({
  value,
  label,
  className,
  placeholder,
  maxLength = 60,
  onSave,
}: {
  value: string
  label: string
  className?: string
  placeholder?: string
  maxLength?: number
  onSave: (next: string) => Promise<ActionResult<unknown>>
}) {
  const t = useAdminT()
  const router = useRouter()
  const [text, setText] = useState(value)
  const [saved, setSaved] = useState(value)
  const [pending, startTransition] = useTransition()
  // data dari server berubah (mis. setelah dimuat ulang): ikut diperbarui selama tidak sedang diketik
  if (value !== saved && text === saved) {
    setSaved(value)
    setText(value)
  }
  return (
    <InlineInput
      label={label}
      value={text}
      placeholder={placeholder}
      maxLength={maxLength}
      size={Math.max(3, (text || placeholder || '').length + 1)}
      className={className}
      aria-busy={pending || undefined}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={blurOnEnter}
      onBlur={() => {
        const next = text.trim()
        if (next === saved.trim()) return
        if (!next) {
          setText(saved)
          return
        }
        startTransition(async () => {
          const result = await onSave(next)
          if (result.ok) {
            setSaved(next)
            toast.success(t(result.message))
            router.refresh()
          } else {
            toast.error(t(result.message))
            setText(saved)
          }
        })
      }}
    />
  )
}

// Kolom tambah (kategori atau skill baru): Enter membuat butir baru lalu kosong lagi
function AddText({
  label,
  placeholder,
  className,
  onAdd,
}: {
  label: string
  placeholder: string
  className?: string
  onAdd: (text: string) => Promise<ActionResult<unknown>>
}) {
  const t = useAdminT()
  const router = useRouter()
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()
  const submit = () => {
    const next = text.trim()
    if (!next || pending) return
    startTransition(async () => {
      const result = await onAdd(next)
      if (result.ok) {
        setText('')
        toast.success(t(result.message))
        router.refresh()
      } else toast.error(t(result.message))
    })
  }
  return (
    <InlineInput
      label={label}
      value={text}
      placeholder={placeholder}
      maxLength={60}
      size={Math.max(placeholder.length, text.length + 1)}
      className={className}
      aria-busy={pending || undefined}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          submit()
        }
      }}
      onBlur={submit}
    />
  )
}

// Admin → Home, tab Skill teknis (DESIGN.md bagian 134): bagian "Keahlian Teknis" beranda tampil
// seperti di situs (globe asli), lalu daftar kategori dan skill di bawahnya yang diketik langsung.
// Nama tersimpan saat kolom ditinggalkan; urutan, hapus, ikon, dan pindah kategori lewat tombol
// kecil yang muncul saat butir disorot atau difokus.
export function SkillsLive({
  categories,
  items,
  heading,
  globeLabels,
}: {
  categories: SkillCategoryAdmin[]
  items: SkillItem[]
  heading: string
  globeLabels: GlobeLabels
}) {
  const t = useAdminT()
  const [lang, setLang] = useState<Lang>('id')
  const nameOf = (c: SkillCategoryAdmin) => (lang === 'en' ? c.name_en : c.name_id)
  const options = categories.map((c) => ({ id: c.id, name: nameOf(c) }))
  const tools =
    'flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100'

  return (
    <LiveStage className="relative bg-bg px-4 py-10 text-text sm:px-8 md:py-14">
      <LangToggle lang={lang} onChange={setLang} className="absolute top-3 right-3" />
      <h2 className="mb-4 text-center text-h2 font-bold">{heading}</h2>
      {items.length > 0 ? (
        <SkillGlobe
          items={items}
          categories={categories.filter((c) => c.skills.length > 0).map(nameOf)}
          labels={globeLabels}
        />
      ) : null}

      <div className="mx-auto mt-10 flex max-w-4xl flex-col" lang={lang}>
        {categories.map((category, ci) => (
          <section key={category.id} className="group border-t border-border py-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <AutoText
                key={`${category.id}-${lang}`}
                value={nameOf(category)}
                label={t('Nama kategori ({lang})', { lang: t(LANG_NAME[lang]) })}
                className="text-lg font-semibold"
                onSave={(next) =>
                  saveSkillCategory(category.id, {
                    name_id: lang === 'id' ? next : category.name_id,
                    name_en: lang === 'en' ? next : category.name_en,
                  })
                }
              />
              <div className={tools}>
                <ReorderButtons
                  itemLabel={t('kategori {name}', { name: nameOf(category) })}
                  isFirst={ci === 0}
                  isLast={ci === categories.length - 1}
                  onMove={(dir) => moveSkillCategory(category.id, dir)}
                />
                <ConfirmDelete
                  itemLabel={t('kategori {name}', { name: nameOf(category) })}
                  onConfirm={() => deleteSkillCategory(category.id)}
                />
              </div>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {category.skills.map((skill, si) => (
                <li
                  key={skill.id}
                  className="group/skill relative inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium"
                >
                  <AutoText
                    value={skill.name}
                    label={t('Nama skill')}
                    onSave={(next) =>
                      saveSkill(skill.id, {
                        name: next,
                        icon: skill.icon ?? '',
                        categoryId: category.id,
                      })
                    }
                  />
                  {/* alat kecil melayang di atas chip saat disorot atau difokus (di HP: ketuk nama skill) */}
                  <span className="absolute bottom-full left-0 z-20 hidden pb-1 group-focus-within/skill:flex group-hover/skill:flex">
                    <span className="flex items-center rounded-md border border-border bg-surface p-0.5 shadow-lg">
                      <ReorderButtons
                        itemLabel={skill.name}
                        isFirst={si === 0}
                        isLast={si === category.skills.length - 1}
                        onMove={(dir) => moveSkill(skill.id, dir)}
                      />
                      <SkillDialog
                        skillId={skill.id}
                        categories={options}
                        defaultValues={{
                          name: skill.name,
                          icon: skill.icon ?? '',
                          categoryId: category.id,
                        }}
                        trigger={
                          <button
                            type="button"
                            aria-label={t('Ikon dan kategori {item}', { item: skill.name })}
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text"
                          >
                            <Ellipsis className="size-4" aria-hidden="true" />
                          </button>
                        }
                      />
                      <ConfirmDelete
                        itemLabel={skill.name}
                        onConfirm={() => deleteSkill(skill.id)}
                      />
                    </span>
                  </span>
                </li>
              ))}
              <li className="inline-flex min-h-10 items-center rounded-md border border-dashed border-border px-3 text-sm text-muted">
                <AddText
                  label={t('Tambah skill ke {name}', { name: nameOf(category) })}
                  placeholder={t('+ Skill baru')}
                  onAdd={(name) => saveSkill(null, { name, icon: '', categoryId: category.id })}
                />
              </li>
            </ul>
          </section>
        ))}
        <div className="border-t border-border pt-5">
          <AddText
            label={t('Kategori baru')}
            placeholder={t('+ Kategori baru')}
            className="text-lg font-semibold text-muted"
            // nama dipakai untuk kedua bahasa dulu; bahasa lain diubah lewat tombol ID/EN
            onAdd={(name) => saveSkillCategory(null, { name_id: name, name_en: name })}
          />
        </div>
      </div>
    </LiveStage>
  )
}
