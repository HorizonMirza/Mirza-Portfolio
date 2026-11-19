// Tombol dasar bergaya shadcn (varian, ukuran, dan asChild lewat Radix Slot).

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

// Tiga tingkat hierarki tombol (DESIGN.md bagian 3). Tinggi minimal 44 px untuk target sentuh.
const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold whitespace-nowrap transition-colors duration-150 ease-out-soft disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:bg-primary/90',
        secondary: 'border border-border-strong bg-surface text-text hover:bg-surface-2',
        ghost: 'text-text hover:bg-surface-2',
      },
      size: {
        default: '',
        sm: 'min-h-9 px-3',
        icon: 'size-11 px-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    // true: gaya tombol dipasang ke elemen anak (misalnya <a>)
    asChild?: boolean
    // aksi sedang menunggu server: spinner di depan teks, tombol tidak bisa ditekan lagi
    loading?: boolean
  }

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild)
    return (
      <Slot className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot>
    )
  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        loading && 'disabled:cursor-wait [&>svg~svg]:hidden',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  )
}
