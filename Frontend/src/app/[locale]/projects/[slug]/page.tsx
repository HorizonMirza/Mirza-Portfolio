import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { CSSProperties } from 'react'

import { Container } from '@/components/site/section-heading'
import { Button } from '@/components/ui/button'
import { browserAddress } from '@/features/projects/browser-address'
import { BackToProjects } from '@/features/projects/components/public/back-to-projects'
import { ProjectGallery } from '@/features/projects/components/public/project-gallery'
import { getPublishedProject, getPublishedProjects } from '@/features/projects/public'
import { BRAND_ICONS } from '@/features/skills/brand-icons'
import { routing } from '@/i18n/routing'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { loc } from '@/lib/localized'
import { pageMetadata } from '@/lib/seo'

// Project baru yang terbit setelah build tetap bisa dibuka (dirender saat pertama diminta).
export const dynamicParams = true

export async function generateStaticParams() {
  const projects = await getPublishedProjects()
  return routing.locales.flatMap((locale) => projects.map((p) => ({ locale, slug: p.slug })))
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/projects/[slug]'>): Promise<Metadata> {
  const locale = await metadataLocale(params)
  const { slug } = await params
  if (!locale) return {}
  const project = await getPublishedProject(slug)
  if (!project) return {}
  // Gambar Open Graph dibuat oleh opengraph-image.tsx di folder ini.
  return pageMetadata({
    locale,
    path: `/projects/${slug}`,
    title: loc(project, 'title', locale),
    description: loc(project, 'summary', locale),
  })
}

export default async function ProjectPage({ params }: PageProps<'/[locale]/projects/[slug]'>) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const [t, tCommon, project] = await Promise.all([
    getTranslations({ locale, namespace: 'Projects' }),
    getTranslations({ locale, namespace: 'Common' }),
    getPublishedProject(slug),
  ])
  if (!project) notFound()

  const title = loc(project, 'title', locale)
  const role = loc(project, 'role', locale)
  // sampul lalu galeri; semuanya bisa dipilih lewat gambar kecil
  const images = [...(project.cover ? [project.cover] : []), ...project.images].map((img) => ({
    url: img.url,
    alt: loc(img, 'alt', locale),
    width: img.width,
    height: img.height,
  }))

  return (
    <Container className="pb-20">
      <nav aria-label="breadcrumb" className="pt-8">
        <BackToProjects slug={project.slug} label={t('back')} />
      </nav>

      {/* Pilihan pemilik 2026-10-08 (demo galeri 1 "carousel + strip", DESIGN.md bagian 47): hanya
          peran, judul, tombol yang dipilih Super Admin, dan foto aplikasi. Ringkasan, teknologi,
          uraian, dan studi kasus tidak ditampilkan di sini. */}
      <header className="pd-head pj-title-box mt-6">
        {role ? <p className="pj-role">{role}</p> : null}
        {/* selalu satu baris di HP dan laptop: ukuran mengikuti lebar kolom (revisi pemilik 2026-10-09) */}
        <h1
          className="pj-title-fit pd-title font-bold"
          style={{ '--chars': title.length } as CSSProperties}
        >
          {title}
        </h1>
        {project.demoUrl || project.repoUrl ? (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {project.demoUrl ? (
              // warna sama dengan tombol GitHub: gelap di mode gelap, terang di mode terang (revisi
              // pemilik 2026-10-09)
              <Button asChild variant="secondary" className="pj-shine">
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden="true" />
                  {t('demo')}
                  <span className="sr-only">{tCommon('openInNewTab')}</span>
                </a>
              </Button>
            ) : null}
            {project.repoUrl ? (
              <Button asChild variant="secondary" className="pj-shine">
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={BRAND_ICONS.github.path} />
                  </svg>
                  {t('repo')}
                  <span className="sr-only">{tCommon('openInNewTab')}</span>
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="mx-auto mt-10 max-w-6xl">
        <ProjectGallery
          slug={project.slug}
          address={browserAddress(project)}
          images={images}
          labels={{
            gallery: t('gallery', { title }),
            thumb: t('image'),
            imageOf: t('imageOf', { current: '{current}', total: '{total}' }),
          }}
        />
      </div>
    </Container>
  )
}
