import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container, PageIntro } from '@/components/site/section-heading'
import { ProjectRow } from '@/features/projects/components/public/project-row'
import { ProjectSpotlight } from '@/features/projects/components/public/project-spotlight'
import { getPublishedProjects } from '@/features/projects/public'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/projects'>): Promise<Metadata> {
  const locale = await metadataLocale(params)
  if (!locale) return {}
  const t = await getTranslations({ locale, namespace: 'Projects' })
  return pageMetadata({
    locale,
    path: '/projects',
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

export default async function ProjectsPage({ params }: PageProps<'/[locale]/projects'>) {
  const locale = await resolveLocale(params)
  const [t, projects] = await Promise.all([
    getTranslations({ locale, namespace: 'Projects' }),
    getPublishedProjects(),
  ])

  return (
    <Container className="pb-20">
      {/* judul di tengah, tanpa kalimat pengantar dan tanpa filter (revisi pemilik 2026-10-08) */}
      <PageIntro title={t('title')} align="center" />
      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-muted">{t('empty')}</p>
      ) : (
        // Pilihan pemilik 2026-10-08 (demo 6): gambar dan teks zig-zag, tanpa kartu bertumpuk.
        // Efek gulir "lampu sorot" (pilihan pemilik 2026-10-09): project di tengah layar terang.
        <ProjectSpotlight className="flex flex-col gap-16 md:gap-24">
          {projects.map((p, i) => (
            <li key={p.slug}>
              <ProjectRow project={p} index={i} locale={locale} />
            </li>
          ))}
        </ProjectSpotlight>
      )}
      {/* kalimat "Project lain sedang dalam pengerjaan" + tautan GitHub/perjalanan dihapus (revisi
          pemilik 2026-10-08) */}
    </Container>
  )
}
