'use client'

import { useTranslations } from 'next-intl'
import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

import { confirmSubscription, type TokenResult, unsubscribe } from '../public-actions'

// Halaman konfirmasi/berhenti: aksi terjadi saat tombol ditekan (POST), bukan saat tautan dibuka.
export function TokenAction({ kind, token }: { kind: 'confirm' | 'unsubscribe'; token: string }) {
  const t = useTranslations('Newsletter')
  const [state, action, pending] = useActionState<TokenResult, FormData>(
    kind === 'confirm' ? confirmSubscription : unsubscribe,
    { status: 'idle' },
  )

  if (state.status !== 'idle') {
    const key =
      state.status === 'confirmed'
        ? 'confirmed'
        : state.status === 'unsubscribed'
          ? 'unsubscribed'
          : 'invalid'
    return (
      <div role="status">
        <h2 className="text-h2 font-bold">{t(`${key}Title`)}</h2>
        <p className="mt-3 text-muted">{t(`${key}Body`)}</p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/">{t('backHome')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <Button type="submit" disabled={pending || !token}>
        {kind === 'confirm' ? t('emailConfirmAction') : t('emailUnsubscribe')}
      </Button>
    </form>
  )
}
