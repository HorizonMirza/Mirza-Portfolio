import { getTranslations } from 'next-intl/server'

import { MarkdownView } from '@/components/shared/markdown-view'
import { getPublicProfile } from '@/features/profile/public'
import type { IntroNoticeContent } from '@/features/settings/public'
import type { routing } from '@/i18n/routing'

import { IntroNotice } from './intro-notice'

// Bagian server pemberitahuan pembuka: memilih teks sesuai bahasa, merender Markdown (disanitasi)
// di server, dan menampilkan tombol Unduh CV hanya bila CV ada.
export async function IntroNoticeSlot({
  locale,
  intro,
}: {
  locale: (typeof routing.locales)[number]
  intro: IntroNoticeContent
}) {
  const [t, tCommon, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'Intro' }),
    getTranslations({ locale, namespace: 'Common' }),
    getPublicProfile(),
  ])
  const en = locale === 'en'
  return (
    <IntroNotice
      eyebrow={t('eyebrow', { name: profile?.name ?? 'Muhammad Mirza' })}
      title={en ? intro.title_en : intro.title_id}
      cvHref={profile?.hasCv ? `/api/cv?locale=${locale}` : null}
      labels={{
        language: t('language'),
        downloadCv: t('downloadCv'),
        projects: t('projects'),
        enter: t('enter'),
        newTab: tCommon('openInNewTab'),
      }}
    >
      <MarkdownView source={en ? intro.body_en : intro.body_id} size="base" />
    </IntroNotice>
  )
}
