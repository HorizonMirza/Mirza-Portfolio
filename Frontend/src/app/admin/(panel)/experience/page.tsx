import type { Metadata } from 'next'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { ExperienceListLive } from '@/features/experience/components/experience-list-live'
import { listExperiencesAdmin } from '@/features/experience/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatPeriod } from '@/lib/format'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Pengalaman') }
}

export default async function ExperiencePage() {
  await requireSuperAdminPage()
  const items = await listExperiencesAdmin('experience')
  const { lang } = await getAdminT()
  return (
    <>
      <PageHeader title="Experience" />
      <ModuleTabs moduleId="experience" current="/admin/experience" />
      <ExperienceListLive
        kind="experience"
        rows={items.map((e) => ({
          id: e.id,
          // isi data ikut bahasa admin bila versi Inggrisnya ada
          organization: (lang === 'en' && e.organization_en) || e.organization,
          title: (lang === 'en' && e.title_en) || e.title_id,
          period: formatPeriod(e.startDate, e.endDate, lang),
          status: e.status,
          logo: e.logo?.url ?? null,
        }))}
      />
    </>
  )
}
