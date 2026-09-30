import { requireSuperAdminPage } from '@/lib/auth-guard'

export default async function DashboardPage() {
  const admin = await requireSuperAdminPage()
  return (
    <main id="main" className="p-6">
      <h1 className="text-h2 font-bold">Dashboard</h1>
      <p className="mt-2 text-muted">Halo, {admin.name}.</p>
    </main>
  )
}
