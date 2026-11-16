import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { PageHeader } from '@/components/admin/page-header'
import { browserAddress } from '@/features/projects/browser-address'
import { ProjectListLive } from '@/features/projects/components/project-list-live'
import { toChipData } from '@/features/projects/components/public/tech-chips'
import { listProjectsAdmin } from '@/features/projects/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { siteHost } from '@/lib/env'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Project') }
}

// daftar project persis seperti halaman Project situs; sampul ditekan untuk diubah (DESIGN.md bagian 138
// dan 164)
export default async function ProjectsPage() {
  await requireSuperAdminPage()
  const [projects, tId, tEn] = await Promise.all([
    listProjectsAdmin(),
    getTranslations({ locale: 'id', namespace: 'Projects' }),
    getTranslations({ locale: 'en', namespace: 'Projects' }),
  ])
  const host = siteHost()
  return (
    <>
      <PageHeader title="Projects" />
      <ProjectListLive
        // judul halaman dan label chip seperti di situs, per bahasa
        copy={{
          id: { title: tId('title'), stack: tId('stack') },
          en: { title: tEn('title'), stack: tEn('stack') },
        }}
        rows={projects.map((p) => ({
          id: p.id,
          texts: {
            id: { title: p.title_id, role: p.role_id ?? '', summary: p.summary_id },
            en: { title: p.title_en, role: p.role_en ?? '', summary: p.summary_en },
          },
          status: p.status,
          address: browserAddress(p, host),
          cover: p.cover
            ? { url: p.cover.url, width: p.cover.width ?? null, height: p.cover.height ?? null }
            : null,
          chips: toChipData(p.skills),
        }))}
      />
    </>
  )
}
