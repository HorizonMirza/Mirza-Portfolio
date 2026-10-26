'use client'

import { RotateCcw } from 'lucide-react'
import { useState, useTransition } from 'react'

import { applyResult } from '@/components/admin/apply-result'
import { FormFooter } from '@/components/admin/form-footer'
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
  const changed = Boolean(value.id || value.en)
  const slug = entry.key.replace('.', '-')
  return (
    <fieldset className="flex flex-col gap-3 border-0 p-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend className="float-left text-sm font-semibold">{entry.label}</legend>
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
      <div className="grid gap-4 sm:grid-cols-2">
        {LANGS.map(({ lang, label }) => {
          const id = `${slug}-${lang}`
          const error = errors[`${entry.key}.${lang}`]
          const props = {
            id,
            value: value[lang],
            placeholder: defaults[lang],
            maxLength: entry.max + 50,
            'aria-invalid': error ? (true as const) : undefined,
            'aria-describedby': error ? `${id}-error` : undefined,
          }
          return (
            <div key={lang} className="flex flex-col gap-2">
              <Label htmlFor={id}>
                {label}
                <span className="sr-only"> untuk {entry.label}</span>
              </Label>
              {entry.multiline ? (
                <Textarea
                  rows={3}
                  {...props}
                  onChange={(event) => onChange(lang, event.target.value)}
                />
              ) : (
                <Input {...props} onChange={(event) => onChange(lang, event.target.value)} />
              )}
              {error ? (
                <p id={`${id}-error`} className="text-sm text-danger">
                  {error}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
      {entry.placeholders?.length ? (
        <p className="text-xs text-muted">
          Boleh memakai {entry.placeholders.map((p) => `{${p}}`).join(' dan ')}; diisi otomatis.
        </p>
      ) : null}
    </fieldset>
  )
}
