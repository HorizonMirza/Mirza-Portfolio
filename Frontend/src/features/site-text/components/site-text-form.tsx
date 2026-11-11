'use client'

import { RotateCcw } from 'lucide-react'
import { useState, useTransition } from 'react'

import { applyResult } from '@/components/admin/apply-result'
import { useAdminLang, useAdminT } from '@/components/admin/admin-lang'
import { FormFooter } from '@/components/admin/form-footer'
import { LangChip } from '@/components/admin/lang-chip'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
}: {
  moduleId: ModuleId
  initialValues: Values
  defaults: Defaults
}) {
  const t = useAdminT()
  const entries = entriesOf(moduleId)
  // kartu per bagian, urut sesuai kemunculan pertama di daftar
  const sections = [...new Set(entries.map((entry) => entry.section))]
  const [values, setValues] = useState<Values>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
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
    if (Object.keys(found).length) return
    startTransition(async () => {
      const result = await saveSiteTexts(moduleId, { values })
      const ok = applyResult(result)
      if (!ok && !result.ok && result.fieldErrors) {
        const mapped: Record<string, string> = {}
        for (const [name, message] of Object.entries(result.fieldErrors))
          mapped[name.replace(/^values\./, '')] = message
        setErrors(mapped)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {sections.map((section) => (
        <Card key={section} className="flex flex-col gap-5">
          <h2 className="text-h3 font-semibold">{t(section)}</h2>
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
  const t = useAdminT()
  const label = t(entry.label)
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
            {label}
            <span className="sr-only"> ({LANGS.find((l) => l.lang === shown)!.label})</span>
          </Label>
          <LangChip lang={shown} />
        </span>
        {changed ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t('Kembalikan bawaan: {label}', { label })}
            onClick={onReset}
          >
            <RotateCcw aria-hidden="true" />
            {t('Kembalikan bawaan')}
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
          {t(error)}
        </p>
      ) : null}
      {otherError ? (
        <p className="text-sm text-danger">
          {t('Galat di {lang}: {error}', { lang: other.label, error: t(otherError) })}
        </p>
      ) : null}
      {entry.placeholders?.length ? (
        <p className="text-xs text-muted">
          {t('Boleh memakai {names}; diisi otomatis.', {
            names: entry.placeholders.map((p) => `{${p}}`).join(` ${t('dan')} `),
          })}
        </p>
      ) : null}
    </div>
  )
}
