import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { SkillsLive } from '@/features/skills/components/skills-live'
import { listSkillCategoriesAdmin } from '@/features/skills/queries'
import { toSkillItems } from '@/features/skills/skill-items'
import { getAdminLang, getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: `${t('Skill teknis')} · Home` }
}

// Home → Skill teknis: bagian Keahlian Teknis seperti di beranda (globe asli), daftar kategori dan
// skill diketik langsung di bawahnya (DESIGN.md bagian 134)
export default async function SkillsPage() {
  await requireSuperAdminPage()
  const [categories, lang] = await Promise.all([listSkillCategoriesAdmin(), getAdminLang()])
  const [tHome, tGlobe] = await Promise.all([
    getTranslations({ locale: lang, namespace: 'Home' }),
    getTranslations({ locale: lang, namespace: 'SkillGlobe' }),
  ])
  // globe hanya kategori yang berisi skill, sama seperti beranda
  const filled = categories
    .filter((c) => c.skills.length > 0)
    .map((c) => ({ ...c, skills: c.skills.map((s) => ({ ...s, projectSlugs: [] })) }))
  return (
    <>
      <PageHeader title="Home" />
      <ModuleTabs moduleId="home" current="/admin/skills" />
      <SkillsLive
        categories={categories}
        items={toSkillItems(filled, lang)}
        heading={tHome('stackHeading')}
        globeLabels={{
          globe: tGlobe('label'),
          list: tGlobe('list'),
          categories: tGlobe('categories'),
          category: tGlobe('category'),
          all: tGlobe('all'),
        }}
      />
    </>
  )
}
