import type { ReactNode } from 'react'

import { AdminLangProvider } from '@/components/admin/admin-lang'
import { AdminGlassShell } from '@/components/admin/glass-settings'
import { AdminSidebar } from '@/components/admin/sidebar'
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
  return (
    <AdminLangProvider initial={lang}>
      {/* Desain 5+ (pilihan pemilik 2026-11-11, DESIGN.md bagian 112): top bar, sidebar, dan panel isi
          dari kaca buram hitam-putih di atas latar yang bisa diatur lewat tombol Atur kaca */}
      <AdminGlassShell>
        {/* Kerangka tetap setinggi layar (revisi pemilik 2026-11-11, DESIGN.md bagian 114): sidebar
            penuh dari atas sampai bawah, top bar selebar panel isi, keduanya tidak ikut bergulir. Hanya
            isi di dalam panel besar yang digulir (batang gulir disembunyikan). */}
        <div className="flex h-full gap-4">
          <AdminSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 md:gap-4">
            <AdminTopBar {...identity} />
            <main
              id="main"
              className="admin-glass-panel no-scrollbar min-h-0 flex-1 scroll-pt-6 overflow-y-auto overscroll-contain rounded-[20px] px-4 pt-6 pb-28 sm:px-6 md:rounded-[27px] md:pb-10 lg:scroll-pt-8 lg:px-8 lg:pt-8"
            >
              <div className="admin-main-in mx-auto w-full max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
      </AdminGlassShell>
    </AdminLangProvider>
  )
}
