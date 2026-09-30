import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border bg-surface p-5 shadow-sm dark:shadow-none',
        className,
      )}
      {...props}
    />
  )
}
