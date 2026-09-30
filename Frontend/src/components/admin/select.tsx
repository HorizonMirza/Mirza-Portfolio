import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

// Select bawaan browser: aksesibel dan ringan, gaya mengikuti Input.
export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'min-h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-base text-text aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  )
}
