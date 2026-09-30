import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { Card } from '@/components/ui/card'
import { ChangePasswordForm } from '@/features/account/components/change-password-form'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Akun' }

export default async function AccountPage() {
  const admin = await requireSuperAdminPage()
  return (
    <>
      <PageHeader eyebrow="Keamanan" title="Akun" />
      <div className="flex flex-col gap-6">
        <Card className="max-w-lg">
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted">Nama</dt>
            <dd className="font-medium">{admin.name}</dd>
            <dt className="text-muted">Email</dt>
            <dd className="break-all">{admin.email}</dd>
            <dt className="text-muted">Peran</dt>
            <dd>Super Admin</dd>
          </dl>
        </Card>
        <ChangePasswordForm />
      </div>
    </>
  )
}
