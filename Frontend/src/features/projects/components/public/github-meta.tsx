import { GitFork, Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { getGithubMeta } from '@/features/projects/github'
import type { AppLocale } from '@/i18n/routing'
import { formatDateShort } from '@/lib/localized'
import { cn } from '@/lib/utils'

// Bintang, bahasa, dan waktu push terakhir dari GitHub (cache 1 jam). Tidak tampil bila API gagal.
export async function GithubMetaLine({
  repo,
  locale,
  className,
}: {
  repo: string | null
  locale: AppLocale
  className?: string
}) {
  const meta = await getGithubMeta(repo)
  if (!meta) return null
  const t = await getTranslations({ locale, namespace: 'Projects' })
  return (
    <p
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        <Star className="size-3.5" aria-hidden="true" />
        {t('stars', { count: meta.stars })}
      </span>
      {meta.language ? (
        <span className="inline-flex items-center gap-1">
          <GitFork className="size-3.5" aria-hidden="true" />
          <span className="sr-only">{t('language')}: </span>
          {meta.language}
        </span>
      ) : null}
      {meta.pushedAt ? (
        <span>{t('updated', { date: formatDateShort(meta.pushedAt, locale) })}</span>
      ) : null}
    </p>
  )
}
