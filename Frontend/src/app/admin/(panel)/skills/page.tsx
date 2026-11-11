import type { Metadata } from 'next'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { SkillsManager } from '@/features/skills/components/skills-manager'
import { listSkillCategoriesAdmin } from '@/features/skills/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: `${t('Skill teknis')} · Home` }
}

export default async function SkillsPage() {
  await requireSuperAdminPage()
  const categories = await listSkillCategoriesAdmin()
  return (
    <>
      {/* tanpa deskripsi: tab Home langsung di atas (revisi pemilik 2026-11-11) */}
      <PageHeader title="Home" />
      <ModuleTabs moduleId="home" current="/admin/skills" />
      <SkillsManager categories={categories} />
    </>
  )
}
