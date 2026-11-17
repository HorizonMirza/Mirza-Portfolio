import Link from 'next/link'

import { cn } from '@/lib/utils'

// Filter sebagai tautan (?status=...) agar bisa dibagikan dan bekerja tanpa JavaScript.
// stretch: satu baris selebar panel sampai tepi kiri-kanan, tombol terpisah sama lebar, yang aktif
// terisi penuh (tab Home, revisi pemilik 2026-11-11 dan 2026-11-12, DESIGN.md bagian 129 dan 131).
// Tidak pernah digeser menyamping (revisi pemilik 2026-11-17): bila tidak muat dalam satu baris,
// tombol turun ke baris berikutnya. Flex-wrap dengan dasar lebar dari label terpanjang, paling lebar
// setengah baris (jadi selalu minimal dua per baris, mis. Beranda 2x2 di HP); tombol yang tersisa di
// baris terakhir melebar penuh (mis. 503 di Halaman Status, Arsip di Pesan).
export function FilterTabs({
  label,
  items,
  stretch = false,
}: {
  label: string
  items: { href: string; label: string; count?: number; active: boolean }[]
  stretch?: boolean
}) {
  if (stretch) {
    const text = (item: (typeof items)[number]) =>
      item.count !== undefined ? `${item.label} (${item.count})` : item.label
    // perkiraan lebar label terpanjang (±0,5 rem per huruf text-sm) + padding tombol px-3
    const minRem = Math.max(...items.map((item) => text(item).length)) * 0.5 + 1.75
    return (
      <nav
        aria-label={label}
        // selebar panel isi sampai tepi kiri-kanan (revisi pemilik 2026-11-12), keluar dari batas
        // max-w-6xl isi halaman: 100cqw = lebar isi <main> (@container di layout panel)
        className="admin-bleed mb-6 flex flex-wrap gap-2 py-1"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            style={{ flex: `1 1 min(${minRem.toFixed(2)}rem, calc(50% - 0.25rem))` }}
            className={cn(
              'inline-flex min-h-11 min-w-0 items-center justify-center rounded-md px-3 text-center text-sm font-semibold transition-colors',
              item.active
                ? 'bg-text text-bg'
                : 'border border-border bg-surface text-muted hover:bg-surface-2 hover:text-text',
            )}
          >
            {/* jumlah dalam kurung, huruf sama dengan namanya (revisi pemilik 2026-11-16) */}
            {text(item)}
          </Link>
        ))}
      </nav>
    )
  }
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
