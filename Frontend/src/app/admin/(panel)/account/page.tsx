import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { Card } from '@/components/ui/card'
import { ChangePasswordForm } from '@/features/account/components/change-password-form'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Akun') }
}

export default async function AccountPage() {
  const admin = await requireSuperAdminPage()
  const { t } = await getAdminT()
  return (
    <>
      <PageHeader title="Akun" />
      <div className="flex flex-col gap-6">
        <Card className="max-w-lg">
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted">{t('Nama')}</dt>
            <dd className="font-medium">{admin.name}</dd>
            <dt className="text-muted">Email</dt>
            <dd className="break-all">{admin.email}</dd>
            <dt className="text-muted">{t('Peran')}</dt>
            <dd>Super Admin</dd>
          </dl>
        </Card>
        <ChangePasswordForm />
      </div>
    </>
  )
}
