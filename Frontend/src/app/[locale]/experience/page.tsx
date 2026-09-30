import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { MarkdownView } from '@/components/shared/markdown-view'
import { Container, PageIntro } from '@/components/site/section-heading'
import { getPublicExperiences } from '@/features/experience/public'
import { EXPERIENCE_TYPES } from '@/features/experience/schema'
import { metadataLocale, resolveLocale } from '@/lib/locale-page'
import { formatMonth, loc } from '@/lib/localized'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/experience'>): Promise<Metadata> {
  const locale = await metadataLocale(params)
  if (!locale) return {}
  const t = await getTranslations({ locale, namespace: 'Experience' })
  return pageMetadata({
    locale,
    path: '/experience',
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

const FILTERS = ['all', ...EXPERIENCE_TYPES] as const

// Filter memakai radio + CSS :has() (globals.css), jadi bekerja tanpa JavaScript dan halaman tetap statis.
export default async function ExperiencePage({ params }: PageProps<'/[locale]/experience'>) {
  const locale = await resolveLocale(params)
  const [t, tCommon, items] = await Promise.all([
    getTranslations({ locale, namespace: 'Experience' }),
    getTranslations({ locale, namespace: 'Common' }),
    getPublicExperiences(),
  ])
  const present = new Set(items.map((i) => i.type))

  return (
    <Container className="pb-20">
      <PageIntro title={t('title')} intro={t('intro')} />
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-muted">{t('none')}</p>
      ) : (
        <div className="experience-filter">
          <fieldset className="mb-10">
            <legend className="mb-3 font-mono text-label tracking-widest text-muted uppercase">
              {t('filterLabel')}
            </legend>
            <div className="flex flex-wrap gap-2">
              {FILTERS.filter((f) => f === 'all' || present.has(f)).map((f) => (
                <label
                  key={f}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border-strong px-4 text-sm font-medium has-checked:border-primary has-checked:bg-primary has-checked:text-primary-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
                >
                  <input
                    type="radio"
                    name="experience-filter"
                    value={f}
                    defaultChecked={f === 'all'}
                    className="sr-only"
                  />
                  {t(f)}
                </label>
              ))}
            </div>
          </fieldset>

          <ol className="relative flex flex-col gap-10 border-l border-border pl-6 md:pl-10">
            {items.map((e) => (
              <li key={e.id} data-type={e.type} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute top-2 -left-[calc(1.5rem+5px)] size-2.5 rounded-full border-2 border-bg bg-primary md:-left-[calc(2.5rem+5px)]"
                />
                <p className="font-mono text-sm text-muted tabular-nums">
                  {formatMonth(e.start, locale)} –{' '}
                  {e.end ? formatMonth(e.end, locale) : tCommon('present')}
                  <span className="ml-3 text-label tracking-widest uppercase">{t(e.type)}</span>
                </p>
                <h2 className="mt-2 text-h3 font-semibold">{loc(e, 'title', locale)}</h2>
                <p className="text-muted">
                  {e.organization}
                  {e.location ? ` · ${e.location}` : ''}
                </p>
                <MarkdownView
                  source={loc(e, 'description', locale)}
                  size="base"
                  className="mt-3 text-muted"
                />
              </li>
            ))}
          </ol>
        </div>
      )}
    </Container>
  )
}
