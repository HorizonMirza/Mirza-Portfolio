import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { AccountPanel } from '@/features/account/components/account-panel'
import { getAccountOverview } from '@/features/account/queries'
import { getPublicProfile } from '@/features/profile/public'
import { getSiteOptionsForEdit } from '@/features/settings/queries'
import { DEFAULT_PROFILE_AVATAR } from '@/lib/default-photo'
import { isUploadConfigured } from '@/lib/uploads'
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
  const [overview, options, profile] = await Promise.all([
    getAccountOverview(admin.userId, admin.sessionId),
    getSiteOptionsForEdit(),
    getPublicProfile(),
  ])
  return (
    <>
      <PageHeader title="Akun" />
      <AccountPanel
        name={admin.name}
        email={admin.email}
        // foto bulat yang sama dengan top bar dan sidebar
        photo={profile?.photo?.url ?? DEFAULT_PROFILE_AVATAR}
        adminSince={overview.adminSince}
        passwordChangedAt={overview.passwordChangedAt}
        sessions={overview.sessions}
        events={overview.events}
        loginNotify={options.loginNotify}
        emailReady={getEmailConfig() !== null}
        uploadReady={isUploadConfigured()}
      />
    </>
  )
}
