import Link from 'next/link'

import { cn } from '@/lib/utils'

// Filter sebagai tautan (?status=...) agar bisa dibagikan dan bekerja tanpa JavaScript.
export function FilterTabs({
  label,
  items,
}: {
  label: string
  items: { href: string; label: string; count?: number; active: boolean }[]
}) {
  return (
    <nav
      aria-label={label}
      className="mb-4 flex flex-wrap gap-1 rounded-md border border-border bg-surface-2 p-0.5 sm:inline-flex"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          className={cn(
            'inline-flex min-h-10 items-center gap-2 rounded-sm px-4 text-sm font-medium text-muted',
            item.active && 'bg-surface text-text shadow-sm',
          )}
        >
          {item.label}
          {item.count !== undefined ? (
            <span className="font-mono text-xs tabular-nums">{item.count}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  )
}
