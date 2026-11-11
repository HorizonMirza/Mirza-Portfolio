import { cookies } from 'next/headers'
import type { ReactNode } from 'react'

import { AdminLangProvider } from '@/components/admin/admin-lang'
import { AdminGlassShell } from '@/components/admin/glass-settings'
import { AdminSidebar } from '@/components/admin/sidebar'
import { SIDEBAR_COOKIE } from '@/components/admin/sidebar-cookie'
import { SidebarStateProvider } from '@/components/admin/sidebar-state'
import { AdminTopBar } from '@/components/admin/top-bar'
import { getPublicProfile } from '@/features/profile/public'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { getAdminLang } from '@/lib/admin-lang-server'
import { DEFAULT_PROFILE_AVATAR } from '@/lib/default-photo'

// Semua halaman di (panel) wajib sesi SUPER_ADMIN yang valid (dicek di server).
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireSuperAdminPage()
  // foto bulat yang sama dengan topbar situs publik (foto dari admin didahulukan)
  const profile = await getPublicProfile()
  const identity = { adminName: admin.name, photo: profile?.photo?.url ?? DEFAULT_PROFILE_AVATAR }
  const lang = await getAdminLang()
  // sidebar desktop diciutkan lewat hamburger (DESIGN.md bagian 126), dibaca server agar tidak melompat
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === 'collapsed'
  return (
    <AdminLangProvider initial={lang}>
      {/* Desain 5+ (pilihan pemilik 2026-11-11, DESIGN.md bagian 112): top bar, sidebar, dan panel isi
          dari kaca buram hitam-putih di atas latar yang bisa diatur lewat tombol Tampilan */}
      <AdminGlassShell>
        {/* Kerangka tetap setinggi layar (revisi pemilik 2026-11-11, DESIGN.md bagian 114): sidebar
            penuh dari atas sampai bawah, top bar selebar panel isi, keduanya tidak ikut bergulir. Hanya
            isi di dalam panel besar yang digulir (batang gulir disembunyikan). */}
        <SidebarStateProvider initialCollapsed={collapsed}>
          <div className="flex h-full gap-4">
            <AdminSidebar {...identity} />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 md:gap-4">
              <AdminTopBar {...identity} />
              <main
                id="main"
                className="admin-glass-panel no-scrollbar min-h-0 flex-1 scroll-pt-6 overflow-y-auto overscroll-contain rounded-[20px] px-4 pt-6 pb-10 sm:px-6 md:rounded-[27px] lg:scroll-pt-8 lg:px-8 lg:pt-8"
              >
                <div className="admin-main-in mx-auto w-full max-w-6xl">{children}</div>
              </main>
            </div>
          </div>
        </SidebarStateProvider>
      </AdminGlassShell>
    </AdminLangProvider>
  )
}
