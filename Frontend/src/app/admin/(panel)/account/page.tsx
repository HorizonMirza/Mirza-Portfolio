import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { AccountPanel } from '@/features/account/components/account-panel'
import { getAccountOverview } from '@/features/account/queries'
import { getSiteOptionsForEdit } from '@/features/settings/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { getEmailConfig } from '@/lib/email'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Akun') }
}

export default async function AccountPage() {
  const admin = await requireSuperAdminPage()
  const [overview, options] = await Promise.all([
    getAccountOverview(admin.userId, admin.sessionId),
    getSiteOptionsForEdit(),
  ])
  return (
    <>
      <PageHeader title="Akun" />
      <AccountPanel
        name={admin.name}
        email={admin.email}
        adminSince={overview.adminSince}
        sessions={overview.sessions}
        events={overview.events}
        loginNotify={options.loginNotify}
        emailReady={getEmailConfig() !== null}
      />
    </>
  )
}
