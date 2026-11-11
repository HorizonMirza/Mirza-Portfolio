'use client'

import type { ReactNode } from 'react'

import { useAdminLang } from '@/components/admin/admin-lang'
import { LangChip, useFieldLang } from '@/components/admin/lang-chip'
import { adminT } from '@/lib/admin-i18n'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Label selalu terlihat, teks bantuan dan galat terhubung lewat aria-describedby. Label dan bantuan
// diterjemahkan ke bahasa isiannya (isian EN berlabel Inggris), galat ke bahasa tampilan admin.
export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  className?: string
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }) => ReactNode
}) {
  const lang = useFieldLang()
  const { lang: uiLang } = useAdminLang()
  const textLang = lang ?? uiLang
  const labelText = adminT(textLang, label)
  const hintText = hint ? adminT(textLang, hint) : undefined
  const errorText = error ? adminT(uiLang, error) : undefined
  const describedBy = [hintText ? `${id}-hint` : null, errorText ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {lang ? (
        // kode bahasa di luar <label> agar teks labelnya tetap persis nama isian
        <div className="flex items-center gap-2">
          <Label htmlFor={id}>{labelText}</Label>
          <LangChip lang={lang} />
        </div>
      ) : (
        <Label htmlFor={id}>{labelText}</Label>
      )}
      {children({
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': errorText ? true : undefined,
      })}
      {hintText ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hintText}
        </p>
      ) : null}
      {errorText ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {errorText}
        </p>
      ) : null}
    </div>
  )
}
