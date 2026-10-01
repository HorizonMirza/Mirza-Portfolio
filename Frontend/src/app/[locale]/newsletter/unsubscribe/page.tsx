import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Container } from '@/components/site/section-heading'
import { TokenAction } from '@/features/subscribers/components/token-action'
import { resolveLocale } from '@/lib/locale-page'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function NewsletterPage({
  params,
  searchParams,
}: PageProps<'/[locale]/newsletter/unsubscribe'>) {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: 'Newsletter' })
  const raw = (await searchParams).token
  const token = typeof raw === 'string' ? raw.slice(0, 200) : ''
  return (
    <Container className="flex min-h-[60dvh] flex-col justify-center py-16">
      <p className="font-mono text-label tracking-widest text-muted uppercase">{t('heading')}</p>
      <h1 className="mt-3 mb-6 text-h1 font-bold">{t('emailUnsubscribe')}</h1>
      <TokenAction kind="unsubscribe" token={token} />
    </Container>
  )
}
