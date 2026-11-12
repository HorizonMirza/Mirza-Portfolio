'use client'

import { Ellipsis, ImagePlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type KeyboardEvent, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminLang, useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { InlineInput, LANG_NAME, LiveStage } from '@/components/admin/live-edit'
import { ReorderButtons } from '@/components/admin/reorder-buttons'
import { AssetEditDialog } from '@/features/assets/components/asset-edit-dialog'
import type { AssetView } from '@/features/assets/components/asset-panels'
import type { ActionResult } from '@/lib/action-result'
import { cn } from '@/lib/utils'

import {
  deleteSkill,
  deleteSkillCategory,
  moveSkill,
  moveSkillCategory,
  saveSkill,
  saveSkillCategory,
} from '../actions'
import { SkillDialog } from './skill-dialogs'

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

type SkillRow = {
  id: string
  name: string
  icon: string | null
  // logo unggahan (bisa dihapus atau diganti)
  logo: AssetView | null
  // logo yang tampil di situs: unggahan, logo bawaan (public/skills), atau null
  shown: { src: string; invertDark: boolean } | null
}

export type SkillCategoryRow = {
  id: string
  name_id: string
  name_en: string
  skills: SkillRow[]
}

// Admin → Home, tab Skill teknis (revisi pemilik 2026-11-12, DESIGN.md bagian 143): tanpa globe,
// hanya daftar kategori (Programming Languages, Frontend, Backend, Tools, dan yang ditambahkan).
// Nama kategori diketik dalam dua bahasa berdampingan; nama skill diketik langsung. Logo tiap skill
// ditekan untuk diunggah atau diganti; skill baru langsung membuka jendela logo. Semua tersimpan saat
// kolom ditinggalkan; urutan, hapus, ikon, dan pindah kategori lewat tombol kecil yang muncul saat
// butir disorot atau difokus.
export function SkillsLive({
  categories,
  configured,
}: {
  categories: SkillCategoryRow[]
  configured: boolean
}) {
  const t = useAdminT()
  const router = useRouter()
  const { lang } = useAdminLang()
  // skill yang jendela logonya terbuka (id dan nama); skill baru dibuka otomatis setelah dibuat
  const [logoFor, setLogoFor] = useState<{ id: string; name: string } | null>(null)
  const nameOf = (c: SkillCategoryRow) => (lang === 'en' ? c.name_en : c.name_id)
  const options = categories.map((c) => ({ id: c.id, name: nameOf(c) }))
  const tools =
    'flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100'
  const logoSkill = logoFor
    ? categories.flatMap((c) => c.skills).find((s) => s.id === logoFor.id)
    : undefined

  return (
    <>
      <LiveStage className="bg-bg px-4 py-6 text-text sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col">
          {categories.map((category, ci) => (
            <section key={category.id} className="group border-b border-border py-5 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                {/* nama kategori dua bahasa berdampingan */}
                <div className="grid min-w-0 flex-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                  {(['id', 'en'] as const).map((l) => (
                    <div key={l} className="flex min-w-0 items-baseline gap-2">
                      <span
                        aria-hidden="true"
                        className="font-mono text-[0.6875rem] text-muted uppercase"
                      >
                        {l}
                      </span>
                      <AutoText
                        value={l === 'en' ? category.name_en : category.name_id}
                        label={t('Nama kategori ({lang})', { lang: t(LANG_NAME[l]) })}
                        className="min-w-0 text-lg font-semibold"
                        onSave={(next) =>
                          saveSkillCategory(category.id, {
                            name_id: l === 'id' ? next : category.name_id,
                            name_en: l === 'en' ? next : category.name_en,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
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
                    className="group/skill relative inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface pr-3 pl-1 text-sm font-medium"
                  >
                    {/* logo ditekan untuk diunggah atau diganti */}
                    <button
                      type="button"
                      onClick={() => setLogoFor({ id: skill.id, name: skill.name })}
                      className={cn(
                        'admin-editable grid size-8 shrink-0 place-items-center rounded-md hover:bg-surface-2',
                        !skill.shown && 'border border-dashed border-border text-muted',
                      )}
                    >
                      {skill.shown ? (
                        // logo kecil statis (unggahan atau public/skills), tanpa optimasi next/image
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={skill.shown.src}
                          alt=""
                          width={20}
                          height={20}
                          className="size-5 object-contain"
                          data-invert-dark={skill.shown.invertDark ? '' : undefined}
                        />
                      ) : (
                        <ImagePlus className="size-4" aria-hidden="true" />
                      )}
                      <span className="sr-only">{t('Logo {item}', { item: skill.name })}</span>
                    </button>
                    <AutoText
                      value={skill.name}
                      label={t('Nama skill')}
                      // nama pendek (mis. "C") tetap mudah ditekan (axe target-size)
                      className="min-h-8 min-w-6"
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
                    onAdd={async (name) => {
                      const result = await saveSkill(null, {
                        name,
                        icon: '',
                        categoryId: category.id,
                      })
                      // skill baru: langsung buka jendela logo untuk mengunggah gambarnya
                      if (result.ok && result.data) setLogoFor({ id: result.data.id, name })
                      return result
                    }}
                  />
                </li>
              </ul>
            </section>
          ))}
          <div className="pt-5">
            <AddText
              label={t('Kategori baru')}
              placeholder={t('+ Kategori baru')}
              className="text-lg font-semibold text-muted"
              // nama dipakai untuk kedua bahasa dulu; nama Inggris diubah di kolom EN-nya
              onAdd={(name) => saveSkillCategory(null, { name_id: name, name_en: name })}
            />
          </div>
        </div>
      </LiveStage>
      {logoFor ? (
        <AssetEditDialog
          open
          onClose={() => setLogoFor(null)}
          onDone={() => {
            setLogoFor(null)
            router.refresh()
          }}
          title={t('Logo {item}', { item: logoFor.name })}
          description="Logo di globe Keahlian Teknis beranda dan chip teknologi project. Persegi dengan latar transparan (PNG, WebP, atau AVIF), maksimal 1 MB. Kosong: logo bawaan bila ada."
          target="skill-logo"
          targetId={logoFor.id}
          asset={logoSkill?.logo ?? null}
          configured={configured}
        />
      ) : null}
    </>
  )
}
