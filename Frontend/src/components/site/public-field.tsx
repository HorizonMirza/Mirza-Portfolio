import type { CSSProperties, ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Field form publik: label selalu terlihat, galat terhubung lewat aria-describedby.
export function PublicField({
  id,
  label,
  error,
  hint,
  className,
  shine,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  className?: string
  // urutan kolom untuk kilau berjalan di tepi kotak (form kontak); kosong = tanpa kilau
  shine?: number
  children: (a: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode
}) {
  const describedBy =
    [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {shine === undefined ? (
        children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })
      ) : (
        <div
          className={cn('field-shine rounded-md', error && 'field-shine-bad')}
          // kilau tiap kolom berselang agar tidak bergerak serempak
          style={{ '--shine-delay': `${-shine * 1.1}s` } as CSSProperties}
        >
          {children({
            id,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': describedBy,
          })}
        </div>
      )}
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

// Kolom jebakan bot: tersembunyi dari pengunjung dan pembaca layar, tidak bisa difokus.
export function Honeypot({ label, id }: { label: string; id: string }) {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label htmlFor={id}>{label}</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  )
}
