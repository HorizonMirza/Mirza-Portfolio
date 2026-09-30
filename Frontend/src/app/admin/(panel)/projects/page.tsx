import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { ProjectTable } from '@/features/projects/components/project-table'
import { listProjectsAdmin } from '@/features/projects/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Project' }

export default async function ProjectsPage() {
  await requireSuperAdminPage()
  const projects = await listProjectsAdmin()
  return (
    <>
      <PageHeader
        eyebrow="Konten"
        title="Project"
        description="Urutan di sini sama dengan urutan di situs publik. Hanya project berstatus terbit yang tampil."
        actions={
          <Button asChild>
            <Link href="/admin/projects/new">
              <Plus aria-hidden="true" />
              Project baru
            </Link>
          </Button>
        }
      />
      <ProjectTable rows={projects.map((p) => ({ ...p, updatedAt: p.updatedAt.toISOString() }))} />
    </>
  )
}
