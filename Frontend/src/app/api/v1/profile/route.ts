import { getPublicProfile } from '@/features/profile/public'

import { apiError, apiLocale, ok, options, text } from '../helpers'

// Email dan WhatsApp sengaja tidak disertakan agar tidak mudah dipanen bot.
export async function GET(request: Request) {
  const locale = apiLocale(request)
  const p = await getPublicProfile()
  if (!p) return apiError(404, 'NOT_FOUND', 'Profil belum diisi')
  return ok(
    {
      name: p.name,
      headline: text(p, 'headline', locale),
      bio: text(p, 'bio', locale),
      currentRole: text(p, 'currentRole', locale),
      availability: p.availability,
      availabilityNote: text(p, 'availabilityNote', locale),
      city: p.city,
      socials: p.socials,
      photo: p.photo ? { url: p.photo.url, alt: text(p.photo, 'alt', locale) } : null,
    },
    { locale },
  )
}

export const OPTIONS = options
