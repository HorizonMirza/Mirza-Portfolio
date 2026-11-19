// Wadah lebar konten (Container) dan judul pembuka halaman (PageIntro).

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  )
}

export function PageIntro({
  eyebrow,
  title,
  intro,
  align = 'start',
}: {
  eyebrow?: string
  title: string
  intro?: string
  align?: 'start' | 'center'
}) {
  return (
    // center: rata tengah di semua ukuran layar
    <header className={cn('pt-12 pb-10 md:pt-20', align === 'center' && 'text-center')}>
      {eyebrow ? (
        <p className="font-mono text-label tracking-widest text-note uppercase">{eyebrow}</p>
      ) : null}
      <h1 className={cn('mt-3 max-w-3xl text-h1 font-bold', align === 'center' && 'mx-auto')}>
        {title}
      </h1>
      {intro ? (
        <p className={cn('mt-4 max-w-prose text-muted', align === 'center' && 'mx-auto')}>
          {intro}
        </p>
      ) : null}
    </header>
  )
}
