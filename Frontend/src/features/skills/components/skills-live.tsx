'use client'

// Admin → Home, tab Skill teknis: bagian "Keahlian Teknis" tampil seperti di beranda (globe asli,
// bahasa mengikuti pilihan ID/EN), di bawahnya daftar kategori dan skill yang bisa diubah dan
// ditambah. Nama kategori (per bahasa), nama skill, dan butir baru tersimpan saat Simpan ditekan
// (use-skill-drafts.ts); hapus dan ganti logo langsung tersimpan. Skill baru memilih logo dulu dan
// logonya diunggah saat Simpan.

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
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
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'

import { deleteSkillCategory } from '@backend/features/skills/actions'
import type { SkillItem } from '@backend/features/skills/skill-items'

import { AddInline, DiscardButton, holdEnter, SkillChip } from './skill-chip'
import { SkillGlobe } from './skill-globe'
import { type SkillCategoryRow, useSkillDrafts } from './use-skill-drafts'

type SkillsPreview = Record<
  Lang,
  {
    heading: string
    items: SkillItem[]
    categories: string[]
    labels: { globe: string; list: string; categories: string; category: string; all: string }
  }
>

// alat kategori muncul saat kategori disorot atau difokus; di HP selalu terlihat
const TOOLS =
  'flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100'

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
  // logo ditekan: langsung membuka pemilih berkas, lalu pemotong gambar
  const picker = useAssetPicker({ configured, onDone: () => router.refresh() })
  const drafts = useSkillDrafts(categories)
  const refresh = () => router.refresh()

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!drafts.dirty) {
      toast.success(t('Skill disimpan.'))
      return
    }
    startTransition(drafts.saveAll)
  }

  const pickNewLogo = (key: string) =>
    picker.pick('skill-logo', undefined, (blob, name) => drafts.setNewLogo(key, blob, name))

  // skill baru di satu kategori (tersimpan atau baru), lalu kolom tambah skill
  const draftChips = (catKey: string, catName: string) => (
    <>
      {drafts.newSkills
        .filter((s) => s.catKey === catKey)
        .map((draft) => (
          <SkillChip
            key={draft.key}
            draft={draft}
            name={draft.name}
            onPickLogo={() => pickNewLogo(draft.key)}
            onNameChange={(value) => drafts.renameNewSkill(draft.key, value)}
            onNameBlur={drafts.dropEmptyEdits}
            onDiscard={() => drafts.discardSkill(draft.key)}
            onRefresh={refresh}
          />
        ))}
      <li className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-sm text-muted">
        <AddInline
          label={t('Tambah Skill ke {name}', { name: catName })}
          placeholder={t('+ Skill Baru')}
          onAdd={(name) => drafts.addSkill(catKey, name)}
        />
      </li>
    </>
  )

  const view = preview[lang]
  const categoryLabel = t('Nama Kategori ({lang})', { lang: t(LANG_NAME[lang]) })

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
            {categories.map((category) => {
              const catName = drafts.shownName(category, lang)
              return (
                <section key={category.id} className="group border-b border-border py-5 first:pt-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <InlineInput
                      key={lang}
                      label={categoryLabel}
                      value={catName}
                      maxLength={60}
                      size={Math.max(3, catName.length + 1)}
                      className="min-w-0 text-lg font-semibold"
                      onChange={(event) => drafts.editCategory(category, lang, event.target.value)}
                      onKeyDown={holdEnter}
                      onBlur={drafts.dropEmptyEdits}
                    />
                    <div className={TOOLS}>
                      <ConfirmDelete
                        title="Hapus Kategori"
                        iconOnly
                        itemLabel={t('kategori {name}', { name: catName })}
                        onConfirm={() => deleteSkillCategory(category.id)}
                      />
                    </div>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {category.skills.map((skill) => (
                      <SkillChip
                        key={skill.id}
                        skill={skill}
                        name={drafts.skillName(skill)}
                        onPickLogo={() => picker.pick('skill-logo', skill.id)}
                        onNameChange={(value) => drafts.editSkill(skill, value)}
                        onNameBlur={drafts.dropEmptyEdits}
                        onRefresh={refresh}
                      />
                    ))}
                    {draftChips(category.id, catName)}
                  </ul>
                </section>
              )
            })}
            {drafts.newCats.map((category) => {
              const catName = lang === 'en' ? category.name_en : category.name_id
              return (
                <section key={category.key} className="group border-b border-border py-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <InlineInput
                      key={lang}
                      label={categoryLabel}
                      value={catName}
                      maxLength={60}
                      size={Math.max(3, catName.length + 1)}
                      className="min-w-0 text-lg font-semibold"
                      onChange={(event) =>
                        drafts.renameNewCategory(category.key, lang, event.target.value)
                      }
                      onKeyDown={holdEnter}
                    />
                    <div className={TOOLS}>
                      <DiscardButton
                        label={t('Buang {item}', {
                          item: t('kategori {name}', { name: catName }),
                        })}
                        onClick={() => drafts.discardCategory(category.key)}
                      />
                    </div>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2">{draftChips(category.key, catName)}</ul>
                </section>
              )
            })}
            <div className="pt-5">
              <AddInline
                label={t('Kategori Baru')}
                placeholder={t('+ Kategori Baru')}
                className="text-lg font-semibold text-muted"
                onAdd={(name) => drafts.addCategory(lang, name)}
              />
            </div>
          </div>
        </LiveStage>
        {/* bahasa isi tepat di atas Simpan, seperti halaman lain */}
        <LangRow lang={lang} onChange={setLang} dirty={drafts.dirtyLang} />
        <SaveBar pending={pending} />
      </form>
      {picker.element}
    </>
  )
}
