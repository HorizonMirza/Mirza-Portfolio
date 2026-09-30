import 'server-only'

import { render } from '@react-email/render'

import { LoginNotificationEmail } from '@/emails/login-notification'
import { getDb } from '@/lib/db'
import { getEmailConfig, sendEmail } from '@/lib/email'
import { siteUrl } from '@/lib/env'
import { formatDateTime } from '@/lib/format'

// Ringkas user-agent menjadi "Chrome di Windows" tanpa menyimpan string lengkap di email.
export function describeDevice(userAgent: string | null | undefined): string {
  const ua = userAgent ?? ''
  const browser = /edg\//i.test(ua)
    ? 'Edge'
    : /chrome\//i.test(ua)
      ? 'Chrome'
      : /firefox\//i.test(ua)
        ? 'Firefox'
        : /safari\//i.test(ua)
          ? 'Safari'
          : 'Browser tidak dikenal'
  const os = /android/i.test(ua)
    ? 'Android'
    : /iphone|ipad/i.test(ua)
      ? 'iOS'
      : /windows/i.test(ua)
        ? 'Windows'
        : /mac os/i.test(ua)
          ? 'macOS'
          : /linux/i.test(ua)
            ? 'Linux'
            : 'sistem tidak dikenal'
  return `${browser} di ${os}`
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
