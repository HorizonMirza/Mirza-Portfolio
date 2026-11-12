import type { Metadata } from 'next'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { browserAddress } from '@/features/projects/browser-address'
import { ProjectListLive } from '@/features/projects/components/project-list-live'
import { listProjectsAdmin } from '@/features/projects/queries'
import { getAdminLang, getAdminT } from '@/lib/admin-lang-server'
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
  const [projects, lang] = await Promise.all([listProjectsAdmin(), getAdminLang()])
  const en = lang === 'en'
  const host = siteHost()
  return (
    <>
      <PageHeader title="Projects" />
      <ModuleTabs moduleId="projects" current="/admin/projects" />
      <ProjectListLive
        rows={projects.map((p) => ({
          id: p.id,
          title: (en && p.title_en) || p.title_id,
          role: (en && p.role_en) || p.role_id || '',
          summary: (en && p.summary_en) || p.summary_id,
          status: p.status,
          featured: p.featured,
          address: browserAddress(p, host),
          cover: p.cover?.url ?? null,
        }))}
      />
    </>
  )
}
