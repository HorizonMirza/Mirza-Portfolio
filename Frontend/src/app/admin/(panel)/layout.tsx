import type { ReactNode } from 'react'

import { AdminMobileBar, AdminSidebar } from '@/components/admin/sidebar'
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
    <div className="min-h-dvh lg:flex lg:gap-6 lg:p-4">
      <AdminSidebar {...identity} />
      <div className="min-w-0 flex-1">
        <AdminMobileBar {...identity} />
        <main
          id="main"
          // bawah memberi ruang untuk kapsul menu di HP
          className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 sm:px-6 lg:px-4 lg:py-6"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
