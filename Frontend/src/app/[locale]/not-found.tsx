import { useTranslations } from 'next-intl'

import { Container } from '@/components/site/section-heading'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default function LocaleNotFound() {
  const t = useTranslations('NotFound')

  return (
    <Container className="flex min-h-[60dvh] flex-col justify-center py-16">
      <p className="font-mono text-label tracking-widest text-note uppercase">404</p>
      <h1 className="mt-3 text-h1 font-bold">{t('title')}</h1>
      <p className="mt-4 max-w-prose text-muted">{t('body')}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">{t('home')}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/projects">{t('projects')}</Link>
        </Button>
      </div>
    </Container>
  )
}
