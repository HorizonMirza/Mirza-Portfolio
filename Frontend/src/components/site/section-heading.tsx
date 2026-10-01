import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Judul bagian dengan penanda koordinat kecil: "02 — Project pilihan" (DESIGN.md bagian 1).
export function SectionHeading({
  id,
  index,
  title,
  action,
  className,
}: {
  id: string
  index: string
  title: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <h2 id={id} className="text-h2 font-bold">
        <span
          className="mb-2 block font-mono text-label font-medium tracking-widest text-muted uppercase"
          aria-hidden="true"
        >
          {index} —
        </span>
        {title}
      </h2>
      {action}
    </div>
  )
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs text-text',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function PageIntro({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string
  title: string
  intro?: string
}) {
  return (
    <header className="pt-12 pb-10 md:pt-20">
      {eyebrow ? (
        <p className="font-mono text-label tracking-widest text-muted uppercase">{eyebrow}</p>
      ) : null}
      <h1 className="mt-3 max-w-3xl text-h1 font-bold">{title}</h1>
      {intro ? <p className="mt-4 max-w-prose text-muted">{intro}</p> : null}
    </header>
  )
}
