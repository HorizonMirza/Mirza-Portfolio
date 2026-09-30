import { z } from 'zod'

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().max(254, 'emailInvalid').pipe(z.email('emailInvalid')),
  locale: z.enum(['id', 'en']),
})

export const NEWSLETTER_RATE_LIMIT = { window: 3600, max: 5 }
