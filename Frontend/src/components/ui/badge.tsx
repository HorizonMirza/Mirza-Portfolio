import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

// Status selalu disertai teks, bukan hanya warna (DESIGN.md bagian 2.1).
const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface-2 text-muted',
        success: 'border-success/40 text-success',
        danger: 'border-danger/40 text-danger',
        primary: 'border-primary/40 text-primary',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
