'use client'

import {
  createContext,
  useCallback,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'

import { applyResult } from '@/components/admin/apply-result'
import { useAdminT } from '@/components/admin/admin-lang'
import {
  InlineArea,
  InlineInput,
  LANG_NAME,
  type Lang,
  LangRow,
  LiveErrors,
  SaveBar,
  useEditLang,
} from '@/components/admin/live-edit'

import { SiteFrame } from '@/components/admin/site-frame'

import { saveSiteTexts } from '@backend/features/site-text/actions'
import {
  checkTextValue,
  entriesOf,
  findTextEntry,
  type ModuleId,
} from '@backend/features/site-text/catalog'
import type { SiteTextsInput } from '@backend/features/site-text/schema'

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

// Bagian halaman yang ikut disimpan bersama teks (mis. kartu kontak Footer): mendaftarkan fungsi
// yang memeriksa dan menyimpan datanya, mengembalikan true bila berhasil atau tidak ada ubahan.
type ExtraSave = () => Promise<boolean>
const ExtraSaveCtx = createContext<((save: ExtraSave | null) => void) | null>(null)

export function useRegisterExtraSave(save: ExtraSave) {
  const register = useContext(ExtraSaveCtx)
  const latest = useRef(save)
  useEffect(() => {
    latest.current = save
  })
  useEffect(() => {
    if (!register) return
    register(() => latest.current())
    return () => register(null)
  }, [register])
}

// Teks situs yang tampil apa adanya (tidak bisa diketik di halaman ini), dalam bahasa yang dipilih
export function ShownText({ k }: { k: string }) {
  return <>{useShownText(k)}</>
}

// Teks situs yang sedang tampil (ubahan admin atau bawaan), untuk bagian pratinjau yang tidak bisa
// diketik langsung di tempat (mis. tulisan di kartu ID berbasis kanvas).
export function useShownText(k: string): string {
  const ctx = useContext(TextCtx)
  if (!ctx) return ''
  return ctx.values[k]?.[ctx.lang] || ctx.defaults[k]?.[ctx.lang] || ''
}

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
      wrap
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

// Admin → modul situs (About, Experience, Projects, Contact, Navbar, Footer), revisi 2026-11-12:
// halaman tampil seperti di situs dan teksnya diketik langsung. Tombol ID/EN memilih bahasa yang
// diubah; Simpan satu baris di bawah.
export function SiteTextLive({
  moduleId,
  initialValues,
  defaults,
  languages = true,
  saveTexts = true,
  children,
}: {
  moduleId: ModuleId
  initialValues: Values
  defaults: Defaults
  // pilihan ID/EN di atas Simpan; dimatikan bila halaman tidak punya teks yang diubah per bahasa
  languages?: boolean
  // false: halaman hanya menyimpan bagian lain (mis. kartu kontak Footer), teksnya tidak diubah
  saveTexts?: boolean
  children: ReactNode
}) {
  const t = useAdminT()
  const entries = entriesOf(moduleId)
  const [lang, setLang] = useEditLang()
  const [values, setValues] = useState<Values>(initialValues)
  const [saved, setSaved] = useState<Values>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()
  const extra = useRef<ExtraSave | null>(null)
  const registerExtra = useCallback((save: ExtraSave | null) => {
    extra.current = save
  }, [])

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
      // bagian lain di halaman ini (mis. kartu kontak Footer) disimpan lebih dulu; gagal = berhenti
      if (extra.current && !(await extra.current())) return
      if (!saveTexts) return
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
      <ExtraSaveCtx.Provider value={registerExtra}>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {/* pratinjau 1:1 di bingkai layar dengan pilihan ID/EN di atas Simpan */}
          <SiteFrame autoHeight>
            <div lang={lang}>{children}</div>
          </SiteFrame>
          <LiveErrors messages={messages} />
          {languages ? (
            <LangRow lang={lang} onChange={setLang} dirty={{ id: dirty('id'), en: dirty('en') }} />
          ) : null}
          <SaveBar pending={pending} />
        </form>
      </ExtraSaveCtx.Provider>
    </TextCtx.Provider>
  )
}
