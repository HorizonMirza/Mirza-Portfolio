// Isian dengan ikon kecil di kiri (form Akun). Ikon hanya hiasan: nama
// isian tetap dari label.

import type { ComponentProps, ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function IconInput({
  icon,
  className,
  ...props
}: ComponentProps<typeof Input> & { icon: ReactNode }) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted [&_svg]:size-4"
      >
        {icon}
      </span>
      <Input {...props} className={cn('ps-10', className)} />
    </div>
  )
}
