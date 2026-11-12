'use client'

import type { ReactNode } from 'react'

import { useAdminLang } from '@/components/admin/admin-lang'
import { adminT } from '@/lib/admin-i18n'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Label selalu terlihat, teks bantuan dan galat terhubung lewat aria-describedby. Label, bantuan, dan
// galat diterjemahkan ke bahasa tampilan admin.
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
  const { lang: uiLang } = useAdminLang()
  const labelText = adminT(uiLang, label)
  const hintText = hint ? adminT(uiLang, hint) : undefined
  const errorText = error ? adminT(uiLang, error) : undefined
  const describedBy = [hintText ? `${id}-hint` : null, errorText ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{labelText}</Label>
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
