'use client'

// Perubahan Admin → Home, tab Skill teknis yang belum disimpan: nama kategori per bahasa, nama
// skill, kategori dan skill baru (dengan logo yang menunggu diunggah), lalu simpan semuanya sekaligus.
// Dicatat terpisah dari data server agar tetap ada saat data dimuat ulang (mis. setelah urutan diubah).

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import type { Lang } from '@/components/admin/live-edit'
import type { PendingImage } from '@/features/experience/components/use-entries'
import { uploadAsset } from '@/features/assets/upload-client'

import type { AssetView } from '@backend/features/assets/asset-view'
import { saveSkill, saveSkillCategory } from '@backend/features/skills/actions'

export type SkillRow = {
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

export type NewCategory = { key: string; name_id: string; name_en: string }
export type NewSkill = { key: string; catKey: string; name: string; logo?: PendingImage }

const serverName = (c: SkillCategoryRow, l: Lang) => (l === 'en' ? c.name_en : c.name_id)

export function useSkillDrafts(categories: SkillCategoryRow[]) {
  const t = useAdminT()
  const router = useRouter()
  const [catEdits, setCatEdits] = useState<Record<string, Partial<Record<Lang, string>>>>({})
  const [skillEdits, setSkillEdits] = useState<Record<string, string>>({})
  const [newCats, setNewCats] = useState<NewCategory[]>([])
  const [newSkills, setNewSkills] = useState<NewSkill[]>([])
  // penghitung kunci sementara: ref agar dua penambahan dalam satu putaran render tidak membaca
  // nomor yang sama
  const counter = useRef(0)
  const nextKey = () => `new-${counter.current++}`

  const shownName = (c: SkillCategoryRow, l: Lang) => catEdits[c.id]?.[l] ?? serverName(c, l)
  const skillName = (skill: SkillRow) => skillEdits[skill.id] ?? skill.name

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

  // nama yang sama dengan yang tersimpan tidak dicatat sebagai perubahan
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

  function renameNewCategory(key: string, l: Lang, value: string) {
    setNewCats((list) =>
      list.map((c) => (c.key === key ? { ...c, [l === 'en' ? 'name_en' : 'name_id']: value } : c)),
    )
  }

  function renameNewSkill(key: string, value: string) {
    setNewSkills((list) => list.map((s) => (s.key === key ? { ...s, name: value } : s)))
  }

  // nama dipakai untuk bahasa yang sedang dipilih; bahasa lain disalin saat Simpan
  function addCategory(l: Lang, name: string) {
    const key = nextKey()
    setNewCats((list) => [
      ...list,
      { key, name_id: l === 'id' ? name : '', name_en: l === 'en' ? name : '' },
    ])
  }

  function addSkill(catKey: string, name: string) {
    const key = nextKey()
    setNewSkills((list) => [...list, { key, catKey, name }])
  }

  function setNewLogo(key: string, blob: Blob, name: string) {
    const preview = URL.createObjectURL(blob)
    setNewSkills((list) =>
      list.map((s) => {
        if (s.key !== key) return s
        if (s.logo) URL.revokeObjectURL(s.logo.preview)
        return { ...s, logo: { blob, name, preview } }
      }),
    )
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

  // Simpan berurutan: kategori lama, kategori baru (agar skill baru bisa memakai id aslinya), skill
  // lama, lalu skill baru beserta logonya. Yang gagal tetap tercatat sebagai perubahan.
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

  return {
    newCats,
    newSkills,
    dirty,
    dirtyLang,
    shownName,
    skillName,
    editCategory,
    editSkill,
    renameNewCategory,
    renameNewSkill,
    addCategory,
    addSkill,
    setNewLogo,
    dropEmptyEdits,
    discardSkill,
    discardCategory,
    saveAll,
  }
}
