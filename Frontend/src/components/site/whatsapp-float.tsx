import { getTranslations } from 'next-intl/server'

import { getPublicProfile } from '@/features/profile/public'
import { BRAND_ICONS } from '@/features/skills/brand-icons'
import { whatsappUrl } from '@/lib/seo'

// Tombol WhatsApp melayang di pojok kanan bawah (Admin → Pengaturan, DESIGN.md bagian 119). Nomor dari
// kartu kontak Footer; tanpa nomor tombol tidak dipasang. Di HP duduk di atas menu bawah.
export async function WhatsAppFloat() {
  const [profile, t] = await Promise.all([getPublicProfile(), getTranslations('Common')])
  if (!profile?.whatsapp) return null
  return (
    <a
      href={whatsappUrl(profile.whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t('whatsapp')} ${t('openInNewTab')}`}
      title={t('whatsapp')}
      className="fixed right-4 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] z-30 grid size-12 place-items-center rounded-full border border-border bg-surface text-text shadow-lg transition-transform duration-200 ease-out-soft hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 lg:right-6 lg:bottom-6"
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true">
        <path d={BRAND_ICONS.whatsapp.path} />
      </svg>
    </a>
  )
}
