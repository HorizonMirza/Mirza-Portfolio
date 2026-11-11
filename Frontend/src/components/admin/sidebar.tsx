'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAdminT } from '@/components/admin/admin-lang'
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

// Logo dan nama panel di puncak sidebar (revisi pemilik 2026-11-11: pindah dari top bar)
function Brand({ rail = false, onNavigate }: { rail?: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className={cn(
        'flex min-h-11 items-center gap-2.5 px-2',
        rail && 'max-lg:justify-center max-lg:px-0',
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-text text-sm font-bold text-bg"
      >
        MM
      </span>
      <span className={cn('text-base font-semibold', rail && 'max-lg:sr-only')}>Super Admin</span>
    </Link>
  )
}

// rail: sidebar kaca di tablet hanya ikon (label tetap ada untuk pembaca layar), penuh di desktop
function NavLinks({ onNavigate, rail = false }: { onNavigate?: () => void; rail?: boolean }) {
  const pathname = usePathname()
  const t = useAdminT()
  return (
    <nav
      aria-label={t('Menu admin')}
      className={cn('flex flex-col', rail ? 'gap-3 lg:gap-5' : 'gap-5')}
    >
      {adminNavGroups
        .filter((group) =>
          adminNav.some((item) => item.group === group && item.inSidebar !== false),
        )
        .map((group) => (
          <div key={group}>
            <p
              className={cn(
                'mb-1.5 px-3.5 text-xs font-medium text-muted',
                rail && 'sr-only lg:not-sr-only',
              )}
            >
              {t(group)}
            </p>
            <ul className="flex flex-col gap-0.5">
              {adminNav
                .filter((item) => item.group === group && item.inSidebar !== false)
                .map((item) => {
                  const { href, icon: Icon } = item
                  const label = t(item.label)
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

// Isi laci menu di HP: nama panel dan menu per kelompok.
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <Brand onNavigate={onNavigate} />
      <NavLinks onNavigate={onNavigate} />
    </>
  )
}

// Sidebar kaca (desain 5+, DESIGN.md bagian 112-114): penuh dari atas sampai bawah layar di kiri top
// bar dan panel isi, tidak ikut bergulir, berisi logo dan nama panel lalu menu (bisa digulir sendiri tanpa batang gulir).
// Tablet (768-1023 px): rel ikon; desktop: menu penuh. Di HP menu dibuka lewat laci dan dock bawah.
export function AdminSidebar() {
  return (
    <aside className="admin-glass-panel hidden h-full w-[4.75rem] shrink-0 rounded-[23px] md:block lg:w-60">
      <div className="flex h-full flex-col gap-5 overflow-y-auto overscroll-contain px-2.5 py-3 lg:px-3">
        <Brand rail />
        <NavLinks rail />
      </div>
    </aside>
  )
}
