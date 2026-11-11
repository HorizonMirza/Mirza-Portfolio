import type { ReactNode } from 'react'

import { AdminLangProvider } from '@/components/admin/admin-lang'
import { AdminGlassShell } from '@/components/admin/glass-settings'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminTopBar } from '@/components/admin/top-bar'
import { getPublicProfile } from '@/features/profile/public'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { DEFAULT_PROFILE_AVATAR } from '@/lib/default-photo'

// Semua halaman di (panel) wajib sesi SUPER_ADMIN yang valid (dicek di server).
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireSuperAdminPage()
  // foto bulat yang sama dengan topbar situs publik (foto dari admin didahulukan)
  const profile = await getPublicProfile()
  const identity = { adminName: admin.name, photo: profile?.photo?.url ?? DEFAULT_PROFILE_AVATAR }
  return (
    <AdminLangProvider>
      {/* Desain 5+ (pilihan pemilik 2026-11-11, DESIGN.md bagian 112): top bar, sidebar, dan panel isi
          dari kaca buram hitam-putih di atas latar yang bisa diatur lewat tombol Atur kaca */}
      <AdminGlassShell>
        <AdminTopBar {...identity} />
        <div className="mt-3 flex items-start gap-4 md:mt-4">
          <AdminSidebar />
          <main
            id="main"
            className="admin-glass-panel min-h-[calc(100dvh-6.5rem)] min-w-0 flex-1 rounded-[20px] px-4 pt-6 pb-28 sm:px-6 md:rounded-[27px] md:pb-10 lg:px-8 lg:pt-8"
          >
            <div className="admin-main-in mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </AdminGlassShell>
    </AdminLangProvider>
  )
}
