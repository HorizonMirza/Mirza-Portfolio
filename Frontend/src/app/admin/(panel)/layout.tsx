import type { ReactNode } from 'react'

import { AdminMobileBar, AdminSidebar } from '@/components/admin/sidebar'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// Semua halaman di (panel) wajib sesi SUPER_ADMIN yang valid (dicek di server).
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireSuperAdminPage()
  return (
    <div className="flex min-h-dvh">
      <AdminSidebar adminName={admin.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileBar adminName={admin.name} />
        <main
          id="main"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
