'use server'

import { render } from '@react-email/render'
import { headers } from 'next/headers'
import { after } from 'next/server'

import { ContactNotificationEmail } from '@/emails/contact-notification'
import { clientIp } from '@/lib/client-ip'
import { getDb } from '@/lib/db'
import { getEmailConfig, sendEmail } from '@/lib/email'
import { siteUrl } from '@/lib/env'
import type { PublicFormState } from '@/lib/form-state'
import { consumePublicRateLimit, hashIdentifier } from '@/lib/rate-limit'

import { CONTACT_RATE_LIMIT, contactSchema, toSingleLine } from './public-schema'

function field(formData: FormData, name: string) {
  const v = formData.get(name)
  return typeof v === 'string' ? v : ''
}

export async function submitContact(
  _prev: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const values = {
    name: field(formData, 'name'),
    email: field(formData, 'email'),
    subject: field(formData, 'subject'),
    message: field(formData, 'message'),
  }
  // Honeypot: bot mengisi semua kolom. Balas "berhasil" tanpa menyimpan apa pun.
  if (field(formData, 'website').trim() !== '') return { status: 'success', message: 'success' }

  const parsed = contactSchema.safeParse({ ...values, locale: field(formData, 'locale') || 'id' })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '')
      if (key && !(key in fieldErrors)) fieldErrors[key] = issue.message
    }
    return { status: 'error', message: 'invalid', fieldErrors, values }
  }

  try {
    const ip = clientIp(await headers())
    const limit = await consumePublicRateLimit('contact', ip, CONTACT_RATE_LIMIT)
    if (!limit.allowed) return { status: 'error', message: 'rateLimited', values }

    const data = parsed.data
    const saved = await getDb().message.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject || null,
        body: data.message,
        locale: data.locale,
        ipHash: hashIdentifier(ip),
      },
      select: { id: true },
    })

    // Pesan sudah tersimpan; notifikasi dikirim setelah jawaban sampai ke pengunjung (after), jadi
    // pengunjung tidak ikut menunggu Resend (sampai 10 detik, audit 2026-11-02 PERF-05). Gagal kirim
    // tidak menggagalkan pengunjung.
    const config = getEmailConfig()
    const to = config?.CONTACT_TO_EMAIL
    if (to) {
      const email = ContactNotificationEmail({
        name: data.name,
        email: data.email,
        subject: data.subject || null,
        body: data.message,
        locale: data.locale,
        adminUrl: `${siteUrl()}/admin/messages/${saved.id}`,
      })
      after(async () => {
        try {
          await sendEmail({
            to,
            // nama dan subjek sudah satu baris dari skema; dibersihkan lagi sebagai pengaman header
            subject: toSingleLine(`Pesan baru: ${data.subject || data.name}`).slice(0, 150),
            html: await render(email),
            text: await render(email, { plainText: true }),
            replyTo: data.email,
          })
        } catch {
          console.warn('[contact] notifikasi email gagal')
        }
      })
    }
    // isian dan waktu kirim dikembalikan untuk tiket ringkasan setelah terkirim
    return {
      status: 'success',
      message: 'success',
      values: { ...values, sentAt: new Date().toISOString() },
    }
  } catch {
    console.error('[contact] gagal menyimpan pesan')
    return { status: 'error', message: 'error', values }
  }
}
