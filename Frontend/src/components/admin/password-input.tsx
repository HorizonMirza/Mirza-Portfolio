'use client'

// Isian password dengan gembok di kiri dan tombol mata untuk menampilkan atau menyembunyikan
// isinya. Tombolnya bisa difokus keyboard dan memberi tahu keadaannya lewat aria-pressed.

import { Eye, EyeOff, Lock } from 'lucide-react'
import { type ComponentProps, useState } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function PasswordInput({ className, ...props }: Omit<ComponentProps<typeof Input>, 'type'>) {
  const t = useAdminT()
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <Lock
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <Input
        {...props}
        type={shown ? 'text' : 'password'}
        className={cn('ps-10 pe-12', className)}
      />
      <button
        type="button"
        aria-pressed={shown}
        aria-label={shown ? t('Sembunyikan Password') : t('Tampilkan Password')}
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
