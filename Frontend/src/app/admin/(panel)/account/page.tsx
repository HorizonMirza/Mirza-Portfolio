// Admin → Akun: identitas, keamanan, dan perangkat yang sedang masuk.

import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { AccountPanel } from '@/features/account/components/account-panel'
import { DEFAULT_PROFILE_AVATAR } from '@/lib/default-photo'

import { getAccountOverview } from '@backend/features/account/queries'
import { getPublicProfile } from '@backend/features/profile/public'
import { isUploadConfigured } from '@backend/lib/uploads'
import { getAdminT } from '@backend/lib/admin-lang-server'
import { requireSuperAdminPage } from '@backend/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Akun') }
}

export default async function AccountPage() {
  const admin = await requireSuperAdminPage()
  const [overview, profile] = await Promise.all([
    getAccountOverview(admin.userId, admin.sessionId),
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
        uploadReady={isUploadConfigured()}
      />
    </>
  )
}
