'use server'

// Server Action form kontak publik: validasi, honeypot, rate limit per IP, lalu simpan pesan untuk
// dibaca di Admin → Pesan.

import { headers } from 'next/headers'

import { clientIp } from '@backend/lib/client-ip'
import { getDb } from '@backend/lib/db'
import type { PublicFormState } from '@backend/lib/form-state'
import { consumePublicRateLimit, hashIdentifier } from '@backend/lib/rate-limit'
import { getSiteSettings } from '@backend/features/settings/public'

import { CONTACT_RATE_LIMIT, contactSchema } from './public-schema'

// Nilai teks satu isian form; isian yang tidak ada atau berupa berkas dianggap kosong.
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
    // Admin → Pengaturan: form ditutup dan batas pesan per jam
    const settings = await getSiteSettings()
    if (!settings.contactOpen) return { status: 'error', message: 'closed', values }
    const ip = clientIp(await headers())
    const limit = await consumePublicRateLimit('contact', ip, {
      ...CONTACT_RATE_LIMIT,
      max: settings.contactPerHour,
    })
    if (!limit.allowed) return { status: 'error', message: 'rateLimited', values }

    const data = parsed.data
    await getDb().message.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject || null,
        body: data.message,
        locale: data.locale,
        ipHash: hashIdentifier(ip),
      },
    })
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
