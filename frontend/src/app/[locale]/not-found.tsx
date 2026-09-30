import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default function LocaleNotFound() {
  const t = useTranslations('NotFound')

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh max-w-[1200px] flex-col justify-center px-4 sm:px-6 lg:px-8"
    >
      <p className="font-mono text-label tracking-widest text-muted uppercase">404</p>
      <h1 className="mt-3 text-h1 font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-4 max-w-prose text-muted">{t('body')}</p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/">{t('home')}</Link>
        </Button>
      </div>
    </main>
  )
}
