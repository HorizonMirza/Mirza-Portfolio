'use client'

import type { ReactNode } from 'react'

import { LangChip, useFieldLang } from '@/components/admin/lang-chip'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Label selalu terlihat, teks bantuan dan galat terhubung lewat aria-describedby.
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
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {lang ? (
        // kode bahasa di luar <label> agar teks labelnya tetap persis nama isian
        <div className="flex items-center gap-2">
          <Label htmlFor={id}>{label}</Label>
          <LangChip lang={lang} />
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      {children({
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
