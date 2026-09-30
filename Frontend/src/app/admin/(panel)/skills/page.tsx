import type { Metadata } from 'next'

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
        eyebrow="Konten"
        title="Skill"
        description="Kelompokkan skill per kategori. Urutan di sini dipakai di situs publik. Kategori hanya bisa dihapus bila sudah kosong."
      />
      <SkillsManager categories={categories} />
    </>
  )
}
