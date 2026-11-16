'use client'

import { Eye, EyeOff } from 'lucide-react'
import { type ComponentProps, useState } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Isian password dengan tombol mata untuk menampilkan atau menyembunyikan isinya (revisi pemilik
// 2026-11-16). Tombolnya bisa difokus keyboard dan memberi tahu keadaannya lewat aria-pressed.
export function PasswordInput({ className, ...props }: Omit<ComponentProps<typeof Input>, 'type'>) {
  const t = useAdminT()
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={shown ? 'text' : 'password'} className={cn('pe-12', className)} />
      <button
        type="button"
        aria-pressed={shown}
        aria-label={shown ? t('Sembunyikan password') : t('Tampilkan password')}
        onClick={() => setShown((value) => !value)}
        className="absolute end-1 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-text"
      >
        {shown ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
