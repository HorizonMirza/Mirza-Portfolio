'use client'

import { createContext, type ReactNode, useContext, useState, useTransition } from 'react'

import { applyResult } from '@/components/admin/apply-result'
import { useAdminT } from '@/components/admin/admin-lang'
import {
  InlineArea,
  InlineInput,
  LANG_NAME,
  type Lang,
  LangToggle,
  LiveErrors,
  LiveStage,
  SaveBar,
  StateBox,
  useEditLang,
} from '@/components/admin/live-edit'

import { saveSiteTexts } from '../actions'
import { checkTextValue, entriesOf, findTextEntry, type ModuleId } from '../catalog'
import type { SiteTextsInput } from '../schema'

type Values = SiteTextsInput['values']
type Defaults = Record<string, Record<Lang, string>>

type Ctx = {
  lang: Lang
  values: Values
  defaults: Defaults
  errors: Record<string, string>
  set: (key: string, value: string) => void
}

const TextCtx = createContext<Ctx | null>(null)

// Teks situs yang diketik langsung di pratinjau halaman. Yang tampil selalu teks yang dilihat
// pengunjung: ubahan admin bila ada, selain itu teks bawaan. Teks yang dikembalikan sama persis
// dengan bawaan (atau dikosongkan) disimpan kosong, artinya kembali ke bawaan.
export function EditText({
  k,
  className,
  block = false,
}: {
  k: string
  className?: string
  // isi selebar wadahnya (judul, paragraf); selain itu selebar teksnya
  block?: boolean
}) {
  const ctx = useContext(TextCtx)
  const t = useAdminT()
  const entry = findTextEntry(k)
  if (!ctx || !entry) return null
  const { lang, values, defaults, errors, set } = ctx
  const fallback = defaults[k]?.[lang] ?? ''
  const shown = values[k]?.[lang] || fallback
  const error = errors[`${k}.${lang}`]
  const label = `${t(entry.label)} (${t(LANG_NAME[lang])})`
  // id tetap seperti form lama (mis. About-title-id), dipakai efek acak huruf saat bahasa berganti
  const id = `${k.replace('.', '-')}-${lang}`
  const errorId = error ? `${id}-error` : undefined
  if (entry.multiline || block)
    return (
      <InlineArea
        id={id}
        label={label}
        value={shown}
        measure={shown}
        maxLength={entry.max + 50}
        invalid={Boolean(error)}
        describedBy={errorId}
        className={className}
        onChange={(event) => set(k, event.target.value)}
      />
    )
  return (
    <InlineInput
      id={id}
      label={label}
      value={shown}
      maxLength={entry.max + 50}
      size={Math.max(2, shown.length + 1)}
      invalid={Boolean(error)}
      describedBy={errorId}
      className={className}
      onChange={(event) => set(k, event.target.value)}
    />
  )
}

// cuplikan hasil mesin pencari untuk judul dan deskripsi halaman (SEO)
export function SearchSnippet({ path, prefix }: { path: string; prefix: string }) {
  return (
    <StateBox note="Hasil mesin pencari">
      <p className="text-xs text-muted">mmirza.site › {path}</p>
      <EditText k={`${prefix}.metaTitle`} block className="mt-1 text-lg font-medium" />
      <EditText k={`${prefix}.metaDescription`} className="mt-1 text-sm text-muted" />
    </StateBox>
  )
}

// Admin → modul situs (About, Experience, Projects, Contact, Navbar, Footer), DESIGN.md bagian 135:
// halaman tampil seperti di situs dan teksnya diketik langsung. Tombol ID/EN memilih bahasa yang
// diubah; Simpan satu baris di bawah.
export function SiteTextLive({
  moduleId,
  initialValues,
  defaults,
  children,
}: {
  moduleId: ModuleId
  initialValues: Values
  defaults: Defaults
  children: ReactNode
}) {
  const t = useAdminT()
  const entries = entriesOf(moduleId)
  const [lang, setLang] = useEditLang()
  const [values, setValues] = useState<Values>(initialValues)
  const [saved, setSaved] = useState<Values>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  const set = (key: string, value: string) => {
    const fallback = defaults[key]?.[lang] ?? ''
    setValues((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? { id: '', en: '' }),
        // sama dengan bawaan = tidak ada ubahan
        [lang]: value.trim() === fallback.trim() ? '' : value,
      },
    }))
  }

  const dirty = (l: Lang) =>
    entries.some((e) => (values[e.key]?.[l] ?? '') !== (saved[e.key]?.[l] ?? ''))

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    for (const entry of entries)
      for (const l of ['id', 'en'] as const) {
        const message = checkTextValue(entry, (values[entry.key]?.[l] ?? '').trim())
        if (message) found[`${entry.key}.${l}`] = message
      }
    setErrors(found)
    if (Object.keys(found).length) {
      // galat hanya di bahasa lain: pindah ke bahasa itu agar terlihat
      const first = Object.keys(found)[0]!
      const l = first.slice(first.lastIndexOf('.') + 1) as Lang
      if (!Object.keys(found).some((k) => k.endsWith(`.${lang}`))) setLang(l)
      return
    }
    startTransition(async () => {
      const result = await saveSiteTexts(moduleId, { values })
      if (applyResult(result)) setSaved(values)
      else if (!result.ok && result.fieldErrors) {
        const mapped: Record<string, string> = {}
        for (const [name, message] of Object.entries(result.fieldErrors))
          mapped[name.replace(/^values\./, '')] = message
        setErrors(mapped)
      }
    })
  }

  const messages = Object.entries(errors).map(([key, message]) => {
    const dot = key.lastIndexOf('.')
    const entry = findTextEntry(key.slice(0, dot))
    const l = key.slice(dot + 1) as Lang
    return {
      id: l === lang ? `${key.slice(0, dot).replace('.', '-')}-${l}-error` : undefined,
      text: `${entry ? t(entry.label) : key} (${t(LANG_NAME[l])}): ${t(message)}`,
    }
  })

  return (
    <TextCtx.Provider value={{ lang, values, defaults, errors, set }}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <LiveStage className="relative bg-bg px-4 pt-14 pb-10 text-text sm:px-10">
          <LangToggle
            lang={lang}
            onChange={setLang}
            dirty={{ id: dirty('id'), en: dirty('en') }}
            className="absolute top-3 right-3"
          />
          <div lang={lang} className="mx-auto flex max-w-[1000px] flex-col gap-10">
            {children}
          </div>
        </LiveStage>
        <LiveErrors messages={messages} />
        <SaveBar pending={pending} />
      </form>
    </TextCtx.Provider>
  )
}
