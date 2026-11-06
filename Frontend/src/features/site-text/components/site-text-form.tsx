'use client'

import { RotateCcw } from 'lucide-react'
import { useState, useTransition } from 'react'

import { applyResult } from '@/components/admin/apply-result'
import { useAdminLang } from '@/components/admin/admin-lang'
import { BilingualTabs, countLangErrors } from '@/components/admin/bilingual-tabs'
import { Field } from '@/components/admin/field'
import { FormFooter } from '@/components/admin/form-footer'
import { LangChip } from '@/components/admin/lang-chip'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { type IntroInput, introSchema } from '@/features/settings/schema'

import { saveSiteTexts } from '../actions'
import { type ModuleId, type TextEntry, checkTextValue, entriesOf } from '../catalog'
import type { SiteTextsInput } from '../schema'

type Lang = 'id' | 'en'
type Values = SiteTextsInput['values']
type Defaults = Record<string, Record<Lang, string>>

const LANGS: { lang: Lang; label: string }[] = [
  { lang: 'id', label: 'Indonesia' },
  { lang: 'en', label: 'English' },
]

export function SiteTextForm({
  moduleId,
  initialValues,
  defaults,
  intro,
}: {
  moduleId: ModuleId
  initialValues: Values
  defaults: Defaults
  // hanya modul Bagian Awal: kartu pembuka disimpan bersama teksnya dengan satu tombol Simpan
  intro?: IntroInput
}) {
  const entries = entriesOf(moduleId)
  // kartu per bagian, urut sesuai kemunculan pertama di daftar
  const sections = [...new Set(entries.map((entry) => entry.section))]
  const [values, setValues] = useState<Values>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [introValues, setIntroValues] = useState<IntroInput | undefined>(intro)
  const [introErrors, setIntroErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  const setValue = (key: string, lang: Lang, value: string) =>
    setValues((current) => ({
      ...current,
      [key]: { ...(current[key] ?? { id: '', en: '' }), [lang]: value },
    }))

  const reset = (key: string) => {
    setValues((current) => ({ ...current, [key]: { id: '', en: '' } }))
    setErrors((current) => {
      const next = { ...current }
      delete next[`${key}.id`]
      delete next[`${key}.en`]
      return next
    })
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    for (const entry of entries) {
      for (const { lang } of LANGS) {
        const message = checkTextValue(entry, (values[entry.key]?.[lang] ?? '').trim())
        if (message) found[`${entry.key}.${lang}`] = message
      }
    }
    setErrors(found)
    const introIssues: Record<string, string> = {}
    if (introValues) {
      const parsed = introSchema.safeParse(introValues)
      if (!parsed.success)
        for (const issue of parsed.error.issues)
          introIssues[String(issue.path[0])] ??= issue.message
    }
    setIntroErrors(introIssues)
    if (Object.keys(found).length || Object.keys(introIssues).length) return
    startTransition(async () => {
      // teks dan kartu pembuka dalam satu aksi dan satu transaksi (DB-02)
      const result = await saveSiteTexts(moduleId, { values }, introValues ?? undefined)
      const ok = applyResult(result)
      if (!ok && !result.ok && result.fieldErrors) {
        const mapped: Record<string, string> = {}
        const introMapped: Record<string, string> = {}
        for (const [name, message] of Object.entries(result.fieldErrors)) {
          if (name.startsWith('intro.')) introMapped[name.slice('intro.'.length)] = message
          else mapped[name.replace(/^values\./, '')] = message
        }
        setErrors(mapped)
        setIntroErrors(introMapped)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {introValues ? (
        <IntroCard
          values={introValues}
          errors={introErrors}
          onChange={(patch) => setIntroValues({ ...introValues, ...patch })}
        />
      ) : null}
      {sections.map((section) => (
        <Card key={section} className="flex flex-col gap-5">
          <h2 className="text-h3 font-semibold">{section}</h2>
          {entries
            .filter((entry) => entry.section === section)
            .map((entry) => (
              <TextRow
                key={entry.key}
                entry={entry}
                value={values[entry.key] ?? { id: '', en: '' }}
                defaults={defaults[entry.key] ?? { id: '', en: '' }}
                errors={errors}
                onChange={(lang, value) => setValue(entry.key, lang, value)}
                onReset={() => reset(entry.key)}
              />
            ))}
        </Card>
      ))}
      <FormFooter pending={pending} />
    </form>
  )
}

type IntroKey = 'introTitle_id' | 'introTitle_en' | 'introBody_id' | 'introBody_en'

function IntroCard({
  values,
  errors,
  onChange,
}: {
  values: IntroInput
  errors: Record<string, string>
  onChange: (patch: Partial<IntroInput>) => void
}) {
  const fields = (lang: Lang) => {
    const title = `introTitle_${lang}` as IntroKey
    const body = `introBody_${lang}` as IntroKey
    return (
      <>
        <Field
          id={title}
          label={lang === 'id' ? 'Judul' : 'Title'}
          hint={lang === 'id' ? 'Mis. Informasi Penting' : 'E.g. Important Information'}
          error={errors[title]}
        >
          {(a) => (
            <Input
              {...a}
              value={values[title]}
              onChange={(e) => onChange({ [title]: e.target.value })}
            />
          )}
        </Field>
        <Field
          id={body}
          label={lang === 'id' ? 'Isi' : 'Text'}
          hint={
            lang === 'id'
              ? 'Dua sampai tiga kalimat, maksimal 600 karakter. Tulis **teks** untuk huruf tebal.'
              : 'Two or three sentences. Use **text** for bold.'
          }
          error={errors[body]}
        >
          {(a) => (
            <Textarea
              rows={4}
              {...a}
              value={values[body]}
              onChange={(e) => onChange({ [body]: e.target.value })}
            />
          )}
        </Field>
      </>
    )
  }
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-h3 font-semibold">Pemberitahuan pembuka</h2>
        <p className="mt-1 text-sm text-muted">
          Berisi judul, isi, pilihan ID/EN, serta tombol Resume CV (bila CV ada) dan Beranda.
        </p>
      </div>
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          className="size-5 accent-primary"
          checked={values.introEnabled}
          onChange={(e) => onChange({ introEnabled: e.target.checked })}
        />
        <span>Tampilkan pemberitahuan pembuka</span>
      </label>
      <BilingualTabs errors={countLangErrors(errors)} id={fields('id')} en={fields('en')} />
    </Card>
  )
}

function TextRow({
  entry,
  value,
  defaults,
  errors,
  onChange,
  onReset,
}: {
  entry: TextEntry
  value: Record<Lang, string>
  defaults: Record<Lang, string>
  errors: Record<string, string>
  onChange: (lang: Lang, value: string) => void
  onReset: () => void
}) {
  // hanya bahasa yang dipilih di top bar yang tampil; galat di bahasa lain tetap diberitahukan
  const { lang: shown } = useAdminLang()
  const other = LANGS.find((l) => l.lang !== shown)!
  const otherError = errors[`${entry.key}.${other.lang}`]
  const changed = Boolean(value.id || value.en)
  const id = `${entry.key.replace('.', '-')}-${shown}`
  const error = errors[`${entry.key}.${shown}`]
  const props = {
    id,
    value: value[shown],
    placeholder: defaults[shown],
    maxLength: entry.max + 50,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  }
  // Satu label per isian; bahasanya ditandai kode kecil (dulu label kedua "Indonesia" di bawah judul
  // isian, dobel dengan tombol bahasa di top bar)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Label htmlFor={id} className="font-semibold">
            {entry.label}
            <span className="sr-only"> ({LANGS.find((l) => l.lang === shown)!.label})</span>
          </Label>
          <LangChip lang={shown} />
        </span>
        {changed ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Kembalikan bawaan: ${entry.label}`}
            onClick={onReset}
          >
            <RotateCcw aria-hidden="true" />
            Kembalikan bawaan
          </Button>
        ) : null}
      </div>
      {entry.multiline ? (
        <Textarea rows={3} {...props} onChange={(event) => onChange(shown, event.target.value)} />
      ) : (
        <Input {...props} onChange={(event) => onChange(shown, event.target.value)} />
      )}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {otherError ? (
        <p className="text-sm text-danger">
          Galat di {other.label}: {otherError}
        </p>
      ) : null}
      {entry.placeholders?.length ? (
        <p className="text-xs text-muted">
          Boleh memakai {entry.placeholders.map((p) => `{${p}}`).join(' dan ')}; diisi otomatis.
        </p>
      ) : null}
    </div>
  )
}
