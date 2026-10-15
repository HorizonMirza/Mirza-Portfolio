import { getTranslations } from 'next-intl/server'

import { MarkdownView } from '@/components/shared/markdown-view'
import { getPublicProfile } from '@/features/profile/public'
import type { IntroNoticeContent } from '@/features/settings/public'
import { routing } from '@/i18n/routing'

import { IntroNotice, type IntroNoticeVersion } from './intro-notice'

type Locale = (typeof routing.locales)[number]

// Bagian server pemberitahuan pembuka: menyiapkan isi dua bahasa sekaligus (Markdown dirender dan
// disanitasi di server) agar tombol ID/EN di kartu bisa berganti bahasa tanpa memuat halaman.
// Tombol Unduh CV hanya tampil bila CV ada.
export async function IntroNoticeSlot({
  locale,
  intro,
}: {
  locale: Locale
  intro: IntroNoticeContent
}) {
  const profile = await getPublicProfile()
  const versions = await Promise.all(
    routing.locales.map(async (l): Promise<[Locale, IntroNoticeVersion]> => {
      const [t, tCommon] = await Promise.all([
        getTranslations({ locale: l, namespace: 'Intro' }),
        getTranslations({ locale: l, namespace: 'Common' }),
      ])
      return [
        l,
        {
          eyebrow: t('eyebrow', { name: profile?.name ?? 'Muhammad Mirza' }),
          title: l === 'en' ? intro.title_en : intro.title_id,
          body: <MarkdownView source={l === 'en' ? intro.body_en : intro.body_id} size="base" />,
          cvHref: profile?.hasCv ? `/api/cv?locale=${l}` : null,
          labels: {
            language: t('language'),
            downloadCv: t('downloadCv'),
            home: t('home'),
            newTab: tCommon('openInNewTab'),
          },
        },
      ]
    }),
  )
  return (
    <IntroNotice
      locale={locale}
      versions={Object.fromEntries(versions) as Record<Locale, IntroNoticeVersion>}
    />
  )
}
