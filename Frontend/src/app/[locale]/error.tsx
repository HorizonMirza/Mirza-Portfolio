'use client'

import { useTranslations } from 'next-intl'

import { Container } from '@/components/site/section-heading'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

// Pesan sopan tanpa detail teknis (DESIGN.md bagian 6).
export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Error')
  return (
    <Container className="flex min-h-[60dvh] flex-col justify-center py-16">
      <p className="font-mono text-label tracking-widest text-note uppercase">500</p>
      <h1 className="mt-3 text-h1 font-bold">{t('title')}</h1>
      <p className="mt-4 max-w-prose text-muted">{t('body')}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => reset()}>{t('retry')}</Button>
        <Button asChild variant="secondary">
          <Link href="/">{t('home')}</Link>
        </Button>
      </div>
    </Container>
  )
}
