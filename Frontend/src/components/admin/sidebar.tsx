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

// rail: sidebar kaca di tablet hanya ikon (label tetap ada untuk pembaca layar), penuh di desktop
function NavLinks({ onNavigate, rail = false }: { onNavigate?: () => void; rail?: boolean }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Menu admin" className={cn('flex flex-col', rail ? 'gap-3 lg:gap-5' : 'gap-5')}>
      {adminNavGroups.map((group) => (
        <div key={group}>
          <p
            className={cn(
              'mb-1.5 px-3.5 text-[0.6875rem] font-semibold tracking-widest text-muted uppercase',
              rail && 'sr-only lg:not-sr-only',
            )}
          >
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
                      title={rail ? label : undefined}
                      className={cn(
                        'relative flex min-h-10 items-center gap-3 rounded-full px-3.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text',
                        rail && 'max-lg:justify-center max-lg:px-0',
                        active && 'bg-surface-2 text-text',
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className={rail ? 'max-lg:sr-only' : undefined}>{label}</span>
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

// Sidebar kaca (desain 5+, DESIGN.md bagian 112): menempel di bawah top bar setinggi sisa layar (bisa
// digulir sendiri tanpa batang gulir). Tablet (768-1023 px): rel ikon; desktop: menu penuh. Di HP
// menu dibuka lewat laci dan dock bawah (top-bar.tsx). Nama panel ada di top bar.
export function AdminSidebar() {
  return (
    <aside className="admin-glass-panel sticky top-[5.5rem] hidden h-[calc(100dvh-6.5rem)] w-[4.75rem] shrink-0 rounded-[23px] md:block lg:w-60">
      <div className="h-full overflow-y-auto overscroll-contain px-2.5 py-4 lg:px-3">
        <NavLinks rail />
      </div>
    </aside>
  )
}
