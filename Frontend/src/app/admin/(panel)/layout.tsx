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
        {/* sidebar penuh dari atas sampai bawah; top bar hanya selebar panel isi (revisi 2026-11-11) */}
        <div className="flex items-start gap-4">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
            <AdminTopBar {...identity} />
            <main
              id="main"
              className="admin-glass-panel min-h-[calc(100dvh-6.5rem)] rounded-[20px] px-4 pt-6 pb-28 sm:px-6 md:rounded-[27px] md:pb-10 lg:px-8 lg:pt-8"
            >
              <div className="admin-main-in mx-auto w-full max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
      </AdminGlassShell>
    </AdminLangProvider>
  )
}
