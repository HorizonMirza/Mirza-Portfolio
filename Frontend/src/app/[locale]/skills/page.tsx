import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Chip, Container, PageIntro } from '@/components/site/section-heading'
import { getPublishedProjects } from '@/features/projects/public'
import { SkillKeyboard } from '@/features/skills/components/skill-keyboard'
import { SkillKeyboard3D } from '@/features/skills/components/skill-keyboard-3d'
import { toKeycaps } from '@/features/skills/keycaps'
import { getPublicSkills } from '@/features/skills/public'
import { Link } from '@/i18n/navigation'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { loc } from '@/lib/localized'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/skills'>): Promise<Metadata> {
  const locale = await metadataLocale(params)
  if (!locale) return {}
  const t = await getTranslations({ locale, namespace: 'Skills' })
  return pageMetadata({
    locale,
    path: '/skills',
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

export default async function SkillsPage({ params }: PageProps<'/[locale]/skills'>) {
  const locale = await resolveLocale(params)
  const [t, tKeyboard, categories, projects] = await Promise.all([
    getTranslations({ locale, namespace: 'Skills' }),
    getTranslations({ locale, namespace: 'SkillKeyboard' }),
    getPublicSkills(),
    getPublishedProjects(),
  ])
  const titleBySlug = new Map(projects.map((p) => [p.slug, loc(p, 'title', locale)]))
  const keycaps = toKeycaps(categories, locale, (slug) => titleBySlug.get(slug) ?? slug)

  return (
    <Container className="pb-20">
      <PageIntro title={t('title')} intro={t('intro')} />
      {categories.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-muted">{t('none')}</p>
      ) : (
        <>
          <SkillKeyboard3D
            keycaps={keycaps}
            label={tKeyboard('label')}
            className="mb-16"
            fallback={
              <SkillKeyboard
                keycaps={keycaps}
                labels={{
                  keyboard: tKeyboard('label'),
                  hint: tKeyboard('hint'),
                  usedIn: t('usedIn'),
                }}
              />
            }
          />
          <div className="divide-y divide-border border-y border-border">
            {categories.map((c, i) => (
              <section
                key={c.id}
                aria-labelledby={`skill-cat-${c.id}`}
                className="reveal grid gap-4 py-8 md:grid-cols-[16rem_1fr] md:gap-10"
              >
                <h2 id={`skill-cat-${c.id}`} className="text-h3 font-semibold">
                  <span
                    className="mb-1 block font-mono text-label tracking-widest text-note"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {loc(c, 'name', locale)}
                </h2>
                <ul className="flex flex-wrap content-start gap-3">
                  {c.skills.map((s) => (
                    <li key={s.id} className="flex flex-col gap-1">
                      <Chip className="px-3 py-1 text-sm">{s.name}</Chip>
                      {s.projectSlugs.length > 0 ? (
                        <span className="text-xs text-muted">
                          {t('usedIn')}{' '}
                          {s.projectSlugs.map((slug, j) => (
                            <span key={slug}>
                              {j > 0 ? ', ' : null}
                              <Link
                                href={`/projects/${slug}`}
                                className="text-primary underline underline-offset-4"
                              >
                                {titleBySlug.get(slug) ?? slug}
                              </Link>
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted">{tKeyboard('credit')}</p>
        </>
      )}
    </Container>
  )
}
