import type { Metadata } from 'next'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { SkillsLive } from '@/features/skills/components/skills-live'
import { listSkillCategoriesAdmin } from '@/features/skills/queries'
import { resolveLogo } from '@/features/skills/skill-items'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { isUploadConfigured } from '@/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: `${t('Skill teknis')} · Home` }
}

// Home → Skill teknis (revisi pemilik 2026-11-12, DESIGN.md bagian 143): tanpa globe, hanya daftar
// kategori (nama Indonesia dan Inggris) dan skill-nya; logo tiap skill ditekan untuk diunggah.
export default async function SkillsPage() {
  await requireSuperAdminPage()
  const categories = await listSkillCategoriesAdmin()
  return (
    <>
      <PageHeader title="Home" />
      <ModuleTabs moduleId="home" current="/admin/skills" />
      <SkillsLive
        configured={isUploadConfigured()}
        categories={categories.map((c) => ({
          id: c.id,
          name_id: c.name_id,
          name_en: c.name_en,
          skills: c.skills.map((s) => ({
            id: s.id,
            name: s.name,
            icon: s.icon,
            logo: s.logo,
            // logo yang tampil di situs: unggahan, logo bawaan (public/skills), atau tidak ada
            shown: resolveLogo(s.name, s.icon, s.logo),
          })),
        }))}
      />
    </>
  )
}
