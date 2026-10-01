import { Download } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { getPublicProfile } from '@/features/profile/public'
import { DEFAULT_PROFILE_AVATAR } from '@/lib/default-photo'
import type { AppLocale } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'

import { NavLinks } from './nav-links'

const pill =
  'flex items-center gap-1 rounded-full border border-border bg-surface/90 p-1 shadow-lg backdrop-blur-lg'

// Foto profil bulat: foto dari admin bila ada, selain itu foto bawaan pemilik.
function Avatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  return (
    <Link
      href="/"
      className="inline-flex size-10 shrink-0 overflow-hidden rounded-full bg-surface-2 ring-1 ring-border"
    >
      <Image
        src={photoUrl ?? DEFAULT_PROFILE_AVATAR}
        alt=""
        width={80}
        height={80}
        sizes="40px"
        className="size-full object-cover"
      />
      <span className="sr-only">{name}</span>
    </Link>
  )
}

// Topbar "tubelight": kapsul melayang di atas. Desktop: foto, menu teks, bahasa, tema, CV.
// HP: kapsul atas hanya foto, bahasa, tema. Menu pindah ke kapsul ikon di bawah layar.
export async function SiteHeader({ locale }: { locale: AppLocale }) {
  const [t, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'Nav' }),
    getPublicProfile(),
  ])
  const name = profile?.name ?? 'Muhammad Mirza'

  return (
    <>
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 flex justify-center px-4 pt-3 lg:pt-4">
        <div className={pill}>
          <Avatar name={name} photoUrl={profile?.photo?.url} />
          <nav aria-label={t('label')} className="hidden px-1 lg:block">
            <NavLinks variant="top" />
          </nav>
          <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-border lg:block" />
          <LocaleSwitcher />
          <ThemeToggle />
          {profile?.hasCv ? (
            <a
              href={`/api/cv?locale=${locale}`}
              className="ml-1 hidden min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary/90 lg:inline-flex"
            >
              <Download className="size-4" aria-hidden="true" />
              {t('downloadCv')}
            </a>
          ) : null}
        </div>
      </header>
      <nav
        aria-label={t('label')}
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className={pill}>
          <NavLinks variant="bottom" />
        </div>
      </nav>
    </>
  )
}
