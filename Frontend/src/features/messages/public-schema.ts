import { z } from 'zod'

// Pesan galat berupa kunci di messages/*.json (namespace Contact).
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(100, 'nameTooLong'),
  email: z.string().trim().max(254, 'emailInvalid').pipe(z.email('emailInvalid')),
  subject: z.string().trim().max(150, 'subjectTooLong'),
  message: z.string().trim().min(10, 'messageShort').max(5000, 'messageLong'),
  locale: z.enum(['id', 'en']),
})

export const CONTACT_RATE_LIMIT = { window: 3600, max: 5 }
