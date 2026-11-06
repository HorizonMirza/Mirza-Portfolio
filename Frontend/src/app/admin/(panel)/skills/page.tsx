import type { Metadata } from 'next'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { SkillsManager } from '@/features/skills/components/skills-manager'
import { listSkillCategoriesAdmin } from '@/features/skills/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Skill' }

export default async function SkillsPage() {
  await requireSuperAdminPage()
  const categories = await listSkillCategoriesAdmin()
  return (
    <>
      <PageHeader
        title="Home"
        description="Daftar skill per kategori untuk globe Keahlian Teknis. Urutan di sini dipakai di situs publik. Kategori hanya bisa dihapus bila sudah kosong."
      />
      <ModuleTabs moduleId="home" current="/admin/skills" />
      <SkillsManager categories={categories} />
    </>
  )
}
