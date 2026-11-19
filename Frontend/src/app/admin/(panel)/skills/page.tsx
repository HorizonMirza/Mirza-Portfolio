// Admin → Home, tab Skill teknis: globe skill dan editor kategori serta skill.

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { SkillsLive } from '@/features/skills/components/skills-live'

import { getPublicSkills } from '@backend/features/skills/public'
import { listSkillCategoriesAdmin } from '@backend/features/skills/queries'
import { resolveLogo, toSkillItems } from '@backend/features/skills/skill-items'
import { getAdminT } from '@backend/lib/admin-lang-server'
import { requireSuperAdminPage } from '@backend/lib/auth-guard'
import { loc } from '@backend/lib/localized'
import { isUploadConfigured } from '@backend/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: `${t('Skill Teknis')} · Home` }
}

// Home → Skill teknis: bagian "Keahlian Teknis"
// tampil seperti di beranda situs (globe, tiap bahasa dari data tersimpan), di bawahnya bagian untuk
// mengubah dan menambah kategori dan skill; ID/EN dan Simpan di paling bawah seperti halaman lain.
export default async function SkillsPage() {
  await requireSuperAdminPage()
  const [categories, publicSkills, tId, tEn, gId, gEn] = await Promise.all([
    listSkillCategoriesAdmin(),
    getPublicSkills(),
    getTranslations({ locale: 'id', namespace: 'Home' }),
    getTranslations({ locale: 'en', namespace: 'Home' }),
    getTranslations({ locale: 'id', namespace: 'SkillGlobe' }),
    getTranslations({ locale: 'en', namespace: 'SkillGlobe' }),
  ])
  const preview = (locale: 'id' | 'en', heading: string, g: typeof gId) => ({
    heading,
    items: toSkillItems(publicSkills, locale),
    categories: publicSkills.map((c) => loc(c, 'name', locale)),
    labels: {
      globe: g('label'),
      list: g('list'),
      categories: g('categories'),
      category: g('category'),
      all: g('all'),
    },
  })
  return (
    <>
      <PageHeader title="Home" />
      <ModuleTabs moduleId="home" current="/admin/skills" />
      <SkillsLive
        configured={isUploadConfigured()}
        preview={{
          id: preview('id', tId('stackHeading'), gId),
          en: preview('en', tEn('stackHeading'), gEn),
        }}
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
