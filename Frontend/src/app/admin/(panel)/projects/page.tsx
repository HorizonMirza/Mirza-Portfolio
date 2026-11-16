import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { browserAddress } from '@/features/projects/browser-address'
import { ProjectListLive } from '@/features/projects/components/project-list-live'
import { listProjectsAdmin } from '@/features/projects/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { siteHost } from '@/lib/env'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Project') }
}

// daftar project seperti di situs; baris ditekan untuk diubah (DESIGN.md bagian 138)
export default async function ProjectsPage() {
  await requireSuperAdminPage()
  const projects = await listProjectsAdmin()
  const host = siteHost()
  return (
    <>
      <PageHeader title="Projects" />
      <ProjectListLive
        rows={projects.map((p) => ({
          id: p.id,
          texts: {
            id: { title: p.title_id, role: p.role_id ?? '', summary: p.summary_id },
            en: { title: p.title_en, role: p.role_en ?? '', summary: p.summary_en },
          },
          status: p.status,
          address: browserAddress(p, host),
          cover: p.cover?.url ?? null,
        }))}
      />
    </>
  )
}
