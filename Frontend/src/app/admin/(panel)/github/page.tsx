import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { GithubLive } from '@/features/github/components/github-live'
import { skylineLabelsFrom } from '@/features/github/labels'
import { getGithubPaletteForEdit } from '@/features/github/queries'
import { sampleContributions } from '@/features/github/sample'
import { getGithubContributions, githubLogin } from '@/features/profile/github-contributions'
import { getPublicProfile } from '@/features/profile/public'
import { getAdminLang, getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: `${t('GitHub')} · Home` }
}

// Home → GitHub: bagian GitHub beranda seperti di situs; warna grafik kontribusinya bisa diganti
// (DESIGN.md bagian 149). Teks grafik mengikuti bahasa tampilan admin.
export default async function GithubPage() {
  await requireSuperAdminPage()
  const lang = await getAdminLang()
  const [palette, profile, tHome, tSkyline] = await Promise.all([
    getGithubPaletteForEdit(),
    getPublicProfile(),
    getTranslations({ locale: lang, namespace: 'Home' }),
    getTranslations({ locale: lang, namespace: 'Skyline' }),
  ])
  const login = githubLogin(profile?.socials.github)
  const contributions = login ? await getGithubContributions(login) : null
  const data = contributions
    ? contributions.weeks.flat().map((day) => ({ date: day.date, count: day.count }))
    : sampleContributions()
  return (
    <>
      <PageHeader title="Home" />
      <ModuleTabs moduleId="home" current="/admin/github" />
      <GithubLive
        defaultValues={palette}
        data={data}
        sample={!contributions}
        labels={skylineLabelsFrom(tSkyline)}
        heading={tHome('githubHeading')}
        locale={lang === 'id' ? 'id-ID' : 'en-US'}
      />
    </>
  )
}
