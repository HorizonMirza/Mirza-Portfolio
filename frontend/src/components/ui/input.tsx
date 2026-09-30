import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'min-h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-base text-text placeholder:text-muted disabled:opacity-50 aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  )
}
