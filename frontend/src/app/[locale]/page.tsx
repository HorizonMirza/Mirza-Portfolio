import { ArrowUpRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { hasLocale, useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { use } from 'react'

import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'
import { routing } from '@/i18n/routing'

// Halaman sementara Milestone 1: memastikan bahasa, tema, token, dan font berjalan.
// Hero "Horizon" dan halaman lengkap dibuat di M3–M4.
export default function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = use(params)
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const t = useTranslations('Home')

  return (
    <>
      <header className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <span className="font-mono text-sm font-medium tracking-wide">MM</span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main
        id="main"
        className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-[1200px] flex-col justify-center px-4 pb-16 sm:px-6 lg:px-8"
      >
        <p className="font-mono text-label tracking-widest text-muted uppercase">{t('eyebrow')}</p>
        <h1 className="mt-3 max-w-3xl text-h1 font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-4 max-w-prose text-muted">{t('body')}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <a href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer">
              {t('linkedin')}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
              {t('github')}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </div>
      </main>
    </>
  )
}
