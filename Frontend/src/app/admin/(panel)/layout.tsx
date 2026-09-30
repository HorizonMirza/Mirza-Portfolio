import type { ReactNode } from 'react'

import { requireSuperAdminPage } from '@/lib/auth-guard'

// Semua halaman di (panel) wajib sesi SUPER_ADMIN yang valid (dicek di server).
export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireSuperAdminPage()
  return children
}
