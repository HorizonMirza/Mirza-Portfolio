import { z } from 'zod'

// Teks satu baris: baris baru, tab, dan karakter kontrol lain diganti spasi. Nama dan subjek masuk ke
// subjek email notifikasi, jadi tidak boleh membawa baris baru (audit 2026-11-01, SEC-04).
export function toSingleLine(value: string) {
  return value
    .replace(/[\p{Cc}\u2028\u2029]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const singleLine = () => z.string().transform(toSingleLine)

// Pesan galat berupa kunci di messages/*.json (namespace Contact).
export const contactSchema = z.object({
  name: singleLine().pipe(z.string().min(1, 'nameRequired').max(100, 'nameTooLong')),
  email: z.string().trim().max(254, 'emailInvalid').pipe(z.email('emailInvalid')),
  subject: singleLine().pipe(z.string().max(150, 'subjectTooLong')),
  message: z.string().trim().min(10, 'messageShort').max(5000, 'messageLong'),
  locale: z.enum(['id', 'en']),
})

// jendela satu jam; max di sini hanya bawaan, nilai yang berlaku dari Admin → Pengaturan
export const CONTACT_RATE_LIMIT = { window: 3600, max: 5 }
