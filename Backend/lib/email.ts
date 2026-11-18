import 'server-only'

import { z } from 'zod'

const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  // contoh: "Muhammad Mirza <halo@domainanda.site>" (domain harus terverifikasi di Resend)
  EMAIL_FROM: z.string().min(3),
  CONTACT_TO_EMAIL: z.email().optional(),
})

export type EmailConfig = z.infer<typeof emailEnvSchema>

// null bila Resend belum diatur: fitur email mati dengan pesan jelas, bukan error.
export function getEmailConfig(
  source: Record<string, string | undefined> = process.env,
): EmailConfig | null {
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, v]) => v !== undefined && v.trim() !== ''),
  )
  const parsed = emailEnvSchema.safeParse(cleaned)
  return parsed.success ? parsed.data : null
}

export class EmailError extends Error {}

// Kirim lewat REST API Resend dengan fetch (tanpa SDK). Isi email tidak pernah dicatat di log.
export async function sendEmail(input: {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  headers?: Record<string, string>
}) {
  const config = getEmailConfig()
  if (!config) throw new EmailError('Email belum diatur')
  let res: Response
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
        headers: input.headers,
      }),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new EmailError('Resend tidak bisa dihubungi')
  }
  if (!res.ok) {
    console.warn('[email] status', res.status)
    throw new EmailError('Resend menolak permintaan')
  }
}
