import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { ProjectTable } from '@/features/projects/components/project-table'
import { listProjectsAdmin } from '@/features/projects/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Project') }
}

export default async function ProjectsPage() {
  await requireSuperAdminPage()
  const projects = await listProjectsAdmin()
  const { lang, t } = await getAdminT()
  return (
    <>
      <PageHeader
        title="Projects"
        description="Urutan di sini sama dengan urutan di situs publik. Hanya project berstatus terbit yang tampil."
        actions={
          <Button asChild>
            <Link href="/admin/projects/new">
              <Plus aria-hidden="true" />
              {t('Project baru')}
            </Link>
          </Button>
        }
      />
      <ModuleTabs moduleId="projects" current="/admin/projects" />
      <ProjectTable
        rows={projects.map(({ title_id, title_en, ...p }) => ({
          ...p,
          // judul ikut bahasa admin
          title: lang === 'en' ? title_en : title_id,
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />
    </>
  )
}
