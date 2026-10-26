'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { adminNav, adminNavGroups, isNavActive } from '@/components/admin/nav'
import { cn } from '@/lib/utils'

// Lampu hitam/putih (ikut warna teks tema) di tepi kiri menu aktif, seperti topbar situs publik.
function Lamp() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 -left-[5px] h-6 w-1 -translate-y-1/2 rounded-l-full bg-text"
    >
      <span className="absolute -top-2 -left-3 h-10 w-6 rounded-full bg-text/20 blur-md" />
    </span>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Menu admin" className="flex flex-col gap-5">
      {adminNavGroups.map((group) => (
        <div key={group}>
          <p className="mb-1.5 px-3.5 text-[0.6875rem] font-semibold tracking-widest text-muted uppercase">
            {group}
          </p>
          <ul className="flex flex-col gap-0.5">
            {adminNav
              .filter((item) => item.group === group)
              .map((item) => {
                const { href, label, icon: Icon } = item
                const active = isNavActive(pathname, item)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex min-h-10 items-center gap-3 rounded-full px-3.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2/60 hover:text-text',
                        active && 'bg-surface-2 text-text',
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                      {active ? <Lamp /> : null}
                    </Link>
                  </li>
                )
              })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

// Isi sidebar: nama panel dan menu per kelompok. Dipakai sidebar desktop dan laci di HP.
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <Link
        href="/admin"
        onClick={onNavigate}
        className="px-3.5 font-display text-xl font-bold tracking-wide uppercase"
      >
        Super Admin
      </Link>
      <NavLinks onNavigate={onNavigate} />
    </>
  )
}

// Desktop (≥ 1024 px): sidebar penuh di tepi kiri setinggi layar (bisa digulir sendiri tanpa batang
// gulir), jadi semua menu tetap terlihat walau halamannya panjang.
export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border bg-surface lg:block">
      <div className="flex h-full flex-col gap-6 overflow-y-auto overscroll-contain p-4">
        <SidebarNav />
      </div>
    </aside>
  )
}
