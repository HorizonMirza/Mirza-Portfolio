import { hasLocale } from 'next-intl'

import { getPublicProfile } from '@/features/profile/public'
import { routing } from '@/i18n/routing'
import { loc } from '@/lib/localized'
import { horizonCard, OG_SIZE } from '@/lib/og/card'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Muhammad Mirza'

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  const profile = await getPublicProfile()
  return horizonCard({
    eyebrow: profile?.name ?? 'Muhammad Mirza',
    title: profile ? loc(profile, 'headline', locale) : 'Muhammad Mirza',
    subtitle: profile ? loc(profile, 'currentRole', locale) || undefined : undefined,
  })
}
