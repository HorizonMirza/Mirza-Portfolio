import Link from 'next/link'

import { cn } from '@/lib/utils'

// Filter sebagai tautan (?status=...) agar bisa dibagikan dan bekerja tanpa JavaScript.
// stretch: satu baris selebar panel sampai tepi kiri-kanan, tombol terpisah sama lebar, yang aktif
// terisi penuh (tab Home, revisi pemilik 2026-11-11 dan 2026-11-12, DESIGN.md bagian 129 dan 131).
// Di layar sempit digeser menyamping.
export function FilterTabs({
  label,
  items,
  stretch = false,
}: {
  label: string
  items: { href: string; label: string; count?: number; active: boolean }[]
  stretch?: boolean
}) {
  if (stretch)
    return (
      <nav
        aria-label={label}
        // selebar panel isi sampai tepi kiri-kanan (revisi pemilik 2026-11-12), keluar dari batas
        // max-w-6xl isi halaman: 100cqw = lebar isi <main> (@container di layout panel)
        className="admin-bleed no-scrollbar mb-6 flex gap-2 overflow-x-auto overscroll-x-contain py-1"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 min-w-fit flex-1 basis-0 items-center justify-center rounded-md px-4 text-sm font-semibold whitespace-nowrap transition-colors',
              item.active
                ? 'bg-text text-bg'
                : 'border border-border bg-surface text-muted hover:bg-surface-2 hover:text-text',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    )
  return (
    <nav
      aria-label={label}
      className="mb-4 flex flex-wrap gap-1 rounded-3xl border border-border bg-surface-2 p-1 sm:inline-flex"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          className={cn(
            'inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted',
            item.active && 'bg-surface text-text shadow-sm',
          )}
        >
          {item.label}
          {item.count !== undefined ? (
            <span className="text-xs tabular-nums">{item.count}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  )
}
