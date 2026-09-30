'use server'

import { render } from '@react-email/render'
import { headers } from 'next/headers'
import { getTranslations } from 'next-intl/server'

import { ConfirmSubscriptionEmail } from '@/emails/confirm-subscription'
import { clientIp } from '@/lib/client-ip'
import { getDb } from '@/lib/db'
import { getEmailConfig, sendEmail } from '@/lib/email'
import { siteUrl } from '@/lib/env'
import type { PublicFormState } from '@/lib/form-state'
import { consumePublicRateLimit } from '@/lib/rate-limit'

import { NEWSLETTER_RATE_LIMIT, newsletterSchema } from './public-schema'
import { hashToken, newConfirmToken, unsubscribeToken, verifyUnsubscribeToken } from './tokens'

function field(formData: FormData, name: string) {
  const v = formData.get(name)
  return typeof v === 'string' ? v : ''
}

// Double opt-in. Jawaban sama untuk email baru maupun yang sudah terdaftar,
// supaya form tidak bisa dipakai menebak siapa yang berlangganan.
export async function subscribeNewsletter(
  _prev: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const values = { email: field(formData, 'email') }
  if (field(formData, 'website').trim() !== '') return { status: 'success', message: 'success' }
  if (!getEmailConfig()) return { status: 'error', message: 'unavailable', values }

  const parsed = newsletterSchema.safeParse({
    email: values.email,
    locale: field(formData, 'locale') || 'id',
  })
  if (!parsed.success)
    return {
      status: 'error',
      message: 'emailInvalid',
      fieldErrors: { email: 'emailInvalid' },
      values,
    }

  try {
    const limit = await consumePublicRateLimit(
      'newsletter',
      clientIp(await headers()),
      NEWSLETTER_RATE_LIMIT,
    )
    if (!limit.allowed) return { status: 'error', message: 'rateLimited', values }

    const { email, locale } = parsed.data
    const db = getDb()
    const existing = await db.subscriber.findUnique({
      where: { email },
      select: { id: true, status: true },
    })
    if (existing?.status === 'CONFIRMED') return { status: 'success', message: 'success' }

    const { token, tokenHash } = newConfirmToken()
    const subscriber = existing
      ? await db.subscriber.update({
          where: { id: existing.id },
          data: { status: 'PENDING', tokenHash, locale, unsubscribedAt: null },
          select: { id: true },
        })
      : await db.subscriber.create({ data: { email, tokenHash, locale }, select: { id: true } })

    const t = await getTranslations({ locale, namespace: 'Newsletter' })
    const base = siteUrl()
    const message = ConfirmSubscriptionEmail({
      lang: locale,
      url: `${base}/${locale}/newsletter/confirm?token=${token}`,
      copy: {
        intro: t('emailConfirmIntro'),
        action: t('emailConfirmAction'),
        ignore: t('emailConfirmIgnore'),
      },
    })
    await sendEmail({
      to: email,
      subject: t('emailConfirmSubject'),
      html: await render(message),
      text: await render(message, { plainText: true }),
      headers: {
        'List-Unsubscribe': `<${base}/${locale}/newsletter/unsubscribe?token=${unsubscribeToken(subscriber.id)}>`,
      },
    })
    return { status: 'success', message: 'success' }
  } catch {
    console.error('[newsletter] pendaftaran gagal')
    return { status: 'error', message: 'error', values }
  }
}

export type TokenResult = { status: 'idle' | 'confirmed' | 'unsubscribed' | 'invalid' }

// Konfirmasi lewat tombol (POST), bukan saat tautan dibuka, agar pemindai tautan email tidak ikut mengonfirmasi.
export async function confirmSubscription(
  _prev: TokenResult,
  formData: FormData,
): Promise<TokenResult> {
  const token = field(formData, 'token')
  if (token.length < 20 || token.length > 100) return { status: 'invalid' }
  try {
    const db = getDb()
    const sub = await db.subscriber.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, status: true },
    })
    if (!sub || sub.status !== 'PENDING') return { status: 'invalid' }
    // Token lama dibuang (diganti hash acak baru) sehingga tautan hanya berlaku sekali.
    await db.subscriber.update({
      where: { id: sub.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        tokenHash: newConfirmToken().tokenHash,
      },
    })
    return { status: 'confirmed' }
  } catch {
    return { status: 'invalid' }
  }
}

export async function unsubscribe(_prev: TokenResult, formData: FormData): Promise<TokenResult> {
  const id = verifyUnsubscribeToken(field(formData, 'token'))
  if (!id) return { status: 'invalid' }
  try {
    await getDb().subscriber.update({
      where: { id },
      data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
    })
    return { status: 'unsubscribed' }
  } catch {
    return { status: 'invalid' }
  }
}
