'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAdminT } from '@/components/admin/admin-lang'
import { adminNav, isNavActive } from '@/components/admin/nav'
import { type AdminIdentity, ProfileMenu } from '@/components/admin/profile-menu'
import { fadeLabel, useSidebarState } from '@/components/admin/sidebar-state'
import { cn } from '@/lib/utils'

// Lampu hitam/putih (ikut warna teks tema) di tepi kiri menu aktif, seperti topbar situs publik.
// Dikembalikan atas permintaan pemilik 2026-11-11 (sempat dihapus di DESIGN.md bagian 122).
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

// rail: sidebar kaca hanya ikon (label tetap ada untuk pembaca layar). Di tablet selalu; di desktop
// saat diciutkan lewat tombol hamburger (compact).
function NavLinks({
  onNavigate,
  rail = false,
  compact = false,
}: {
  onNavigate?: () => void
  rail?: boolean
  compact?: boolean
}) {
  const pathname = usePathname()
  const t = useAdminT()
  const hideText = cn(rail && 'max-lg:sr-only', rail && fadeLabel(compact))
  return (
    <nav
      aria-label={t('Menu admin')}
      // satu daftar menyambung tanpa label dan jarak kelompok (revisi pemilik 2026-11-11)
      className="flex flex-col gap-0.5"
    >
      <ul className="flex flex-col gap-0.5">
        {adminNav
          .filter((item) => item.inSidebar !== false)
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
                  // nama menu muncul saat kursor di atas ikon bila sidebar hanya ikon
                  title={rail || compact ? label : undefined}
                  className={cn(
                    'relative flex min-h-10 items-center gap-3 rounded-md px-3.5 text-sm font-semibold whitespace-nowrap text-muted transition-colors hover:bg-surface-2 hover:text-text',
                    // ikon tepat di tengah rel 4.75rem: (4.75 - 2 x 0.75 padding sidebar - 1 ikon) / 2
                    rail && 'max-lg:justify-center max-lg:px-0 lg:px-[1.125rem]',
                    active && 'bg-surface-2 text-text',
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className={hideText}>{label}</span>
                  {active ? <Lamp /> : null}
                </Link>
              </li>
            )
          })}
      </ul>
    </nav>
  )
}

// Isi laci menu (HP dan tablet, dibuka dari tombol hamburger): seluruh menu. Identitas dan menu
// profil di HP ada di foto top bar, jadi tidak diulang di sini.
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return <NavLinks onNavigate={onNavigate} />
}

// Sidebar kaca (DESIGN.md bagian 112-114, 126): penuh dari atas sampai bawah layar di kiri top bar dan
// panel isi, tidak ikut bergulir. Puncaknya foto, nama, dan Super Admin sekaligus tombol menu profil
// (satu-satunya tempat identitas di tablet dan desktop), lalu menu (digulir sendiri tanpa batang
// gulir). Tablet (768-1023 px): rel ikon. Desktop: 20rem (280 px, rem desktop 14 px) agar nama lengkap tidak terpotong, atau rel
// ikon saat diciutkan lewat tombol hamburger di top bar (lebar beranimasi, pilihan diingat cookie).
export function AdminSidebar(identity: AdminIdentity) {
  const { collapsed } = useSidebarState()
  return (
    <aside
      data-collapsed={collapsed ? 'true' : 'false'}
      className={cn(
        // lebar berganti pelan dan halus (revisi pemilik 2026-11-11: sebelumnya 300 ms terlalu cepat)
        'admin-glass-panel relative z-40 hidden h-full w-[4.75rem] shrink-0 flex-col rounded-[23px] transition-[width] duration-500 ease-in-out-soft motion-reduce:transition-none md:flex',
        collapsed ? 'lg:w-[4.75rem]' : 'lg:w-[20rem]',
      )}
    >
      <div className="shrink-0 px-2.5 pt-3 lg:px-3">
        <ProfileMenu {...identity} variant="sidebar" compact={collapsed} className="w-full" />
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-2.5 pt-4 pb-3 lg:px-3">
        <NavLinks rail compact={collapsed} />
      </div>
    </aside>
  )
}
