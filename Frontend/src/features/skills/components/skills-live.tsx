'use client'

import { ImagePlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import {
  InlineInput,
  LANG_NAME,
  type Lang,
  LangRow,
  LiveStage,
  Note,
  SaveBar,
  useEditLang,
} from '@/components/admin/live-edit'
import { SiteFrame } from '@/components/admin/site-frame'
import { Container } from '@/components/site/section-heading'
import { RemoveAssetButton } from '@/features/assets/components/remove-asset-button'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'
import type { AssetView } from '@/features/assets/components/asset-panels'
import { uploadAsset } from '@/features/assets/upload-client'
import type { PendingImage } from '@/features/experience/components/use-entries'
import { cn } from '@/lib/utils'

import { deleteSkill, deleteSkillCategory, saveSkill, saveSkillCategory } from '../actions'
import type { SkillItem } from '../skill-items'
import { SkillGlobe } from './skill-globe'

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

export type SkillsPreview = Record<
  Lang,
  {
    heading: string
    items: SkillItem[]
    categories: string[]
    labels: { globe: string; list: string; categories: string; category: string; all: string }
  }
>

type NewCategory = { key: string; name_id: string; name_en: string }
type NewSkill = { key: string; catKey: string; name: string; logo?: PendingImage }

// Kolom tambah (kategori atau skill baru): Enter atau keluar dari kolom menambah butir baru ke
// daftar, lalu kolom kosong lagi. Butir baru baru tersimpan saat Simpan ditekan.
function AddInline({
  label,
  placeholder,
  className,
  onAdd,
}: {
  label: string
  placeholder: string
  className?: string
  onAdd: (text: string) => void
}) {
  const [text, setText] = useState('')
  const submit = () => {
    const next = text.trim()
    if (!next) return
    onAdd(next)
    setText('')
  }
  return (
    <InlineInput
      label={label}
      value={text}
      placeholder={placeholder}
      maxLength={60}
      size={Math.max(placeholder.length, text.length + 1)}
      className={className}
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

// Enter tidak mengirim formulir dari kolom nama
function holdEnter(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'Enter') {
    event.preventDefault()
    event.currentTarget.blur()
  }
}

// Admin → Home, tab Skill teknis (revisi pemilik 2026-11-15, DESIGN.md bagian 153): bagian
// "Keahlian Teknis" tampil seperti di beranda situs (pratinjau, bahasa mengikuti pilihan ID/EN),
// di bawahnya bagian untuk mengubah dan menambah kategori dan skill. Nama kategori (per bahasa) dan
// nama skill serta butir baru tersimpan saat Simpan ditekan; urutan, hapus, ikon, dan pindah
// kategori lewat tombol kecil yang muncul saat butir disorot atau difokus (langsung tersimpan).
// Logo skill tersimpan: ditekan untuk diganti; skill baru memilih logo dulu dan diunggah saat Simpan.
export function SkillsLive({
  categories,
  configured,
  preview,
}: {
  categories: SkillCategoryRow[]
  configured: boolean
  preview: SkillsPreview
}) {
  const t = useAdminT()
  const router = useRouter()
  const [lang, setLang] = useEditLang()
  const [pending, startTransition] = useTransition()
  // logo ditekan: langsung membuka pemilih berkas, lalu pemotong gambar (DESIGN.md bagian 148)
  const picker = useAssetPicker({ configured, onDone: () => router.refresh() })

  // perubahan yang belum disimpan, dicatat terpisah dari data server agar tetap ada saat
  // data dimuat ulang (mis. setelah urutan diubah)
  const [catEdits, setCatEdits] = useState<Record<string, Partial<Record<Lang, string>>>>({})
  const [skillEdits, setSkillEdits] = useState<Record<string, string>>({})
  const [newCats, setNewCats] = useState<NewCategory[]>([])
  const [newSkills, setNewSkills] = useState<NewSkill[]>([])
  const [counter, setCounter] = useState(0)

  const serverName = (c: SkillCategoryRow, l: Lang) => (l === 'en' ? c.name_en : c.name_id)
  const shownName = (c: SkillCategoryRow, l: Lang) => catEdits[c.id]?.[l] ?? serverName(c, l)
  const tools =
    'flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100'
  const nextKey = () => {
    setCounter((n) => n + 1)
    return `new-${counter}`
  }

  const dirty =
    Object.keys(catEdits).length > 0 ||
    Object.keys(skillEdits).length > 0 ||
    newCats.length > 0 ||
    newSkills.length > 0
  const dirtyLang: Partial<Record<Lang, boolean>> = {
    id:
      Object.values(catEdits).some((e) => e.id !== undefined) ||
      newCats.some((c) => c.name_id.trim() !== ''),
    en:
      Object.values(catEdits).some((e) => e.en !== undefined) ||
      newCats.some((c) => c.name_en.trim() !== ''),
  }

  function editCategory(c: SkillCategoryRow, l: Lang, value: string) {
    setCatEdits((all) => {
      const next = { ...all, [c.id]: { ...all[c.id], [l]: value } }
      if (value === serverName(c, l)) delete next[c.id][l]
      if (Object.keys(next[c.id]).length === 0) delete next[c.id]
      return next
    })
  }

  function editSkill(skill: SkillRow, value: string) {
    setSkillEdits((all) => {
      const next = { ...all, [skill.id]: value }
      if (value === skill.name) delete next[skill.id]
      return next
    })
  }

  // keluar dari kolom nama yang dikosongkan: kembali ke nama tersimpan
  function dropEmptyEdits() {
    setCatEdits((all) => {
      const next: typeof all = {}
      for (const [id, e] of Object.entries(all)) {
        const kept = Object.fromEntries(Object.entries(e).filter(([, v]) => v.trim() !== ''))
        if (Object.keys(kept).length > 0) next[id] = kept
      }
      return next
    })
    setSkillEdits((all) => Object.fromEntries(Object.entries(all).filter(([, v]) => v.trim())))
  }

  function discardSkill(key: string) {
    const gone = newSkills.find((s) => s.key === key)
    if (gone?.logo) URL.revokeObjectURL(gone.logo.preview)
    setNewSkills((list) => list.filter((s) => s.key !== key))
  }

  function discardCategory(key: string) {
    for (const s of newSkills.filter((s) => s.catKey === key)) discardSkill(s.key)
    setNewCats((list) => list.filter((c) => c.key !== key))
  }

  function pickNewLogo(key: string) {
    picker.pick('skill-logo', undefined, (blob, name) => {
      const preview = URL.createObjectURL(blob)
      setNewSkills((list) =>
        list.map((s) => {
          if (s.key !== key) return s
          if (s.logo) URL.revokeObjectURL(s.logo.preview)
          return { ...s, logo: { blob, name, preview } }
        }),
      )
    })
  }

  async function saveAll() {
    const failures: string[] = []
    const fail = (message: string) => failures.push(t(message))
    const keptCatEdits = { ...catEdits }
    const keptSkillEdits = { ...skillEdits }
    let keptNewCats: NewCategory[] = []
    let keptNewSkills: NewSkill[] = []
    const realId = new Map<string, string>()

    for (const c of categories) {
      const e = keptCatEdits[c.id]
      if (!e) continue
      const result = await saveSkillCategory(c.id, {
        name_id: e.id ?? c.name_id,
        name_en: e.en ?? c.name_en,
      })
      if (result.ok) delete keptCatEdits[c.id]
      else fail(result.message)
    }
    for (const c of newCats) {
      // satu bahasa kosong: salin dari bahasa lain, bisa diubah lewat ID/EN
      const name_id = c.name_id.trim() || c.name_en.trim()
      const name_en = c.name_en.trim() || c.name_id.trim()
      const result = await saveSkillCategory(null, { name_id, name_en })
      if (result.ok && result.data) realId.set(c.key, result.data.id)
      else {
        keptNewCats.push(c)
        if (!result.ok) fail(result.message)
      }
    }
    for (const c of categories)
      for (const s of c.skills) {
        const next = keptSkillEdits[s.id]
        if (next === undefined) continue
        const result = await saveSkill(s.id, {
          name: next,
          icon: s.icon ?? '',
          categoryId: c.id,
        })
        if (result.ok) delete keptSkillEdits[s.id]
        else fail(result.message)
      }
    for (const s of newSkills) {
      const categoryId = realId.get(s.catKey) ?? s.catKey
      if (categoryId.startsWith('new-')) {
        keptNewSkills.push(s)
        continue
      }
      const result = await saveSkill(null, { name: s.name, icon: '', categoryId })
      if (!result.ok || !result.data) {
        keptNewSkills.push({ ...s, catKey: categoryId })
        if (!result.ok) fail(result.message)
        continue
      }
      // logo yang dipilih sebelum skill tersimpan diunggah sekarang; yang gagal tidak membatalkan
      // skillnya (bisa diunggah ulang dengan menekan logonya)
      if (s.logo) {
        const sent = await uploadAsset('skill-logo', result.data.id, s.logo.blob, s.logo.name)
        if (!sent.ok) toast.error(t(sent.message))
        URL.revokeObjectURL(s.logo.preview)
      }
    }
    keptNewCats = keptNewCats.filter((c) => c.name_id.trim() || c.name_en.trim())
    keptNewSkills = keptNewSkills.filter((s) => s.name.trim())
    setCatEdits(keptCatEdits)
    setSkillEdits(keptSkillEdits)
    setNewCats(keptNewCats)
    setNewSkills(keptNewSkills)
    if (failures.length > 0) toast.error(failures[0])
    else toast.success(t('Skill disimpan.'))
    router.refresh()
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!dirty) {
      toast.success(t('Skill disimpan.'))
      return
    }
    startTransition(saveAll)
  }

  const view = preview[lang]
  const tool = (children: React.ReactNode) => <div className={tools}>{children}</div>

  const skillChip = (opts: {
    key: string
    skill?: SkillRow
    category?: SkillCategoryRow
    draft?: NewSkill
  }) => {
    const { skill, category, draft } = opts
    const name = draft ? draft.name : (skillEdits[skill!.id] ?? skill!.name)
    const shown = skill?.shown
    const logoPreview = draft?.logo?.preview
    return (
      <li
        key={opts.key}
        className="group/skill relative inline-flex min-h-9 items-center gap-2 rounded-md border border-border bg-surface pr-3 pl-1 text-sm font-medium"
      >
        {/* logo ditekan untuk diunggah atau diganti */}
        <button
          type="button"
          onClick={() => (skill ? picker.pick('skill-logo', skill.id) : pickNewLogo(draft!.key))}
          className={cn(
            'admin-editable grid size-7 shrink-0 place-items-center rounded-md hover:bg-surface-2',
            !shown && !logoPreview && 'text-muted',
          )}
        >
          {logoPreview || shown ? (
            // logo kecil statis (unggahan atau public/skills), tanpa optimasi next/image
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoPreview ?? shown!.src}
              alt=""
              width={20}
              height={20}
              className="size-5 object-contain"
              data-invert-dark={!logoPreview && shown?.invertDark ? '' : undefined}
            />
          ) : (
            <ImagePlus className="size-4" aria-hidden="true" />
          )}
          <span className="sr-only">{t('Logo {item}', { item: name })}</span>
        </button>
        <InlineInput
          label={t('Nama Skill')}
          value={name}
          maxLength={60}
          size={Math.max(3, name.length + 1)}
          // nama pendek (mis. "C") tetap mudah ditekan (axe target-size)
          className="min-h-6 min-w-6"
          onChange={(event) => {
            const value = event.target.value
            if (draft)
              setNewSkills((list) =>
                list.map((s) => (s.key === draft.key ? { ...s, name: value } : s)),
              )
            else editSkill(skill!, value)
          }}
          onKeyDown={holdEnter}
          onBlur={dropEmptyEdits}
        />
        {/* alat kecil melayang di atas chip saat disorot atau difokus (di HP: ketuk nama skill) */}
        <span className="absolute bottom-full left-0 z-20 hidden pb-1 group-focus-within/skill:flex group-hover/skill:flex">
          <span className="flex items-center rounded-md border border-border bg-surface p-0.5 shadow-lg">
            {skill && category ? (
              <>
                {skill.logo ? (
                  <RemoveAssetButton
                    assetId={skill.logo.id}
                    label={t('Logo {item}', { item: skill.name })}
                    onDone={() => router.refresh()}
                  />
                ) : null}
                <ConfirmDelete
                  title="Hapus Skill"
                  iconOnly
                  itemLabel={skill.name}
                  onConfirm={() => deleteSkill(skill.id)}
                />
              </>
            ) : (
              <button
                type="button"
                aria-label={t('Buang {item}', { item: name })}
                onClick={() => discardSkill(draft!.key)}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </span>
        </span>
      </li>
    )
  }

  const addSkill = (catKey: string) => (name: string) => {
    const key = nextKey()
    setNewSkills((list) => [...list, { key, catKey, name }])
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {/* bagian "Keahlian Teknis" seperti di beranda; tersimpan terakhir kali, bahasa ikut ID/EN */}
        {view.items.length > 0 ? (
          <SiteFrame autoHeight>
            <div lang={lang}>
              {/* ruang di bawah supaya daftar kategori yang terbuka tidak terpotong bingkai */}
              <section className="pt-16 pb-56 md:pt-24 md:pb-60">
                <Container>
                  <h2 className="mb-4 text-center text-h2 font-bold">
                    <span>{view.heading}</span>
                  </h2>
                  {/* globe asli: bisa diputar dan ditekan seperti di situs */}
                  <SkillGlobe
                    key={lang}
                    items={view.items}
                    categories={view.categories}
                    labels={view.labels}
                  />
                </Container>
              </section>
            </div>
          </SiteFrame>
        ) : (
          <LiveStage className="bg-bg px-4 py-6 text-text sm:px-8">
            <Note>Belum ada skill, bagian ini belum tampil di situs.</Note>
          </LiveStage>
        )}

        {/* bagian yang bisa diubah dan ditambah */}
        <LiveStage className="bg-bg px-4 py-6 text-text sm:px-8">
          <div className="admin-tight mx-auto flex max-w-4xl flex-col">
            {categories.map((category) => (
              <section key={category.id} className="group border-b border-border py-5 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <InlineInput
                    key={lang}
                    label={t('Nama Kategori ({lang})', { lang: t(LANG_NAME[lang]) })}
                    value={shownName(category, lang)}
                    maxLength={60}
                    size={Math.max(3, shownName(category, lang).length + 1)}
                    className="min-w-0 text-lg font-semibold"
                    onChange={(event) => editCategory(category, lang, event.target.value)}
                    onKeyDown={holdEnter}
                    onBlur={dropEmptyEdits}
                  />
                  {tool(
                    <>
                      <ConfirmDelete
                        title="Hapus Kategori"
                        iconOnly
                        itemLabel={t('kategori {name}', { name: shownName(category, lang) })}
                        onConfirm={() => deleteSkillCategory(category.id)}
                      />
                    </>,
                  )}
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {category.skills.map((skill) =>
                    skillChip({
                      key: skill.id,
                      skill,
                      category,
                    }),
                  )}
                  {newSkills
                    .filter((s) => s.catKey === category.id)
                    .map((draft) => skillChip({ key: draft.key, draft }))}
                  <li className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-sm text-muted">
                    <AddInline
                      label={t('Tambah Skill ke {name}', { name: shownName(category, lang) })}
                      placeholder={t('+ Skill Baru')}
                      onAdd={addSkill(category.id)}
                    />
                  </li>
                </ul>
              </section>
            ))}
            {newCats.map((category) => (
              <section key={category.key} className="group border-b border-border py-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <InlineInput
                    key={lang}
                    label={t('Nama Kategori ({lang})', { lang: t(LANG_NAME[lang]) })}
                    value={lang === 'en' ? category.name_en : category.name_id}
                    maxLength={60}
                    size={Math.max(
                      3,
                      (lang === 'en' ? category.name_en : category.name_id).length + 1,
                    )}
                    className="min-w-0 text-lg font-semibold"
                    onChange={(event) => {
                      const value = event.target.value
                      setNewCats((list) =>
                        list.map((c) =>
                          c.key === category.key
                            ? { ...c, [lang === 'en' ? 'name_en' : 'name_id']: value }
                            : c,
                        ),
                      )
                    }}
                    onKeyDown={holdEnter}
                  />
                  {tool(
                    <button
                      type="button"
                      aria-label={t('Buang {item}', {
                        item: t('kategori {name}', {
                          name: lang === 'en' ? category.name_en : category.name_id,
                        }),
                      })}
                      onClick={() => discardCategory(category.key)}
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>,
                  )}
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {newSkills
                    .filter((s) => s.catKey === category.key)
                    .map((draft) => skillChip({ key: draft.key, draft }))}
                  <li className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-sm text-muted">
                    <AddInline
                      label={t('Tambah Skill ke {name}', {
                        name: lang === 'en' ? category.name_en : category.name_id,
                      })}
                      placeholder={t('+ Skill Baru')}
                      onAdd={addSkill(category.key)}
                    />
                  </li>
                </ul>
              </section>
            ))}
            <div className="pt-5">
              <AddInline
                label={t('Kategori Baru')}
                placeholder={t('+ Kategori Baru')}
                className="text-lg font-semibold text-muted"
                // nama dipakai untuk bahasa yang sedang dipilih; bahasa lain disalin saat Simpan
                onAdd={(name) => {
                  const key = nextKey()
                  setNewCats((list) => [
                    ...list,
                    { key, name_id: lang === 'id' ? name : '', name_en: lang === 'en' ? name : '' },
                  ])
                }}
              />
            </div>
          </div>
        </LiveStage>
        {/* bahasa isi tepat di atas Simpan, seperti halaman lain */}
        <LangRow lang={lang} onChange={setLang} dirty={dirtyLang} />
        <SaveBar pending={pending} />
      </form>
      {picker.element}
    </>
  )
}
