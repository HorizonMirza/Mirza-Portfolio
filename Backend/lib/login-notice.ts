// Email notifikasi ke pemilik setiap ada login baru ke panel admin (hanya server).

import 'server-only'

import { render } from '@react-email/render'

import { LoginNotificationEmail } from '@backend/emails/login-notification'
import { getDb } from '@backend/lib/db'
import { deviceParts } from '@backend/lib/device'
import { getEmailConfig, sendEmail } from '@backend/lib/email'
import { siteUrl } from '@backend/lib/env'
import { formatDateTime } from '@backend/lib/format'

// Ringkas user-agent menjadi "Chrome di Windows" tanpa menyimpan string lengkap di email.
export function describeDevice(userAgent: string | null | undefined): string {
  const { browser, os } = deviceParts(userAgent)
  return `${browser ?? 'Browser tidak dikenal'} di ${os ?? 'sistem tidak dikenal'}`
}

// Dipanggil setelah sesi dibuat. Tidak pernah menggagalkan login: galat hanya dicatat singkat.
export async function notifyLogin(session: {
  userId: string
  userAgent?: string | null
  createdAt?: Date
}) {
  if (!getEmailConfig()) return
  try {
    const user = await getDb().user.findUnique({
      where: { id: session.userId },
      select: { email: true, role: true },
    })
    if (!user || user.role !== 'SUPER_ADMIN') return
    const email = LoginNotificationEmail({
      when: formatDateTime(session.createdAt ?? new Date()),
      device: describeDevice(session.userAgent),
      accountUrl: `${siteUrl()}/admin/account`,
    })
    await sendEmail({
      to: user.email,
      subject: 'Login baru ke panel admin portofolio',
      html: await render(email),
      text: await render(email, { plainText: true }),
    })
  } catch {
    console.warn('[auth] notifikasi login gagal dikirim')
  }
}
