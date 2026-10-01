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

// permukaan melayang bersama: kapsul menu dan tombol-tombol bulat di topbar
const floating = 'border border-border bg-surface/90 shadow-lg backdrop-blur-lg'
const pill = `flex items-center gap-1 rounded-full p-1 ${floating}`

// Foto profil bulat di dalam lingkaran berbingkai (sama seperti tombol bahasa dan tema):
// foto dari admin bila ada, selain itu foto bawaan pemilik.
function Avatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full p-1 ${floating}`}
    >
      <Image
        src={photoUrl ?? DEFAULT_PROFILE_AVATAR}
        alt=""
        width={72}
        height={72}
        sizes="36px"
        className="size-full rounded-full object-cover"
      />
      <span className="sr-only">{name}</span>
    </Link>
  )
}

// Topbar "tubelight" tiga bagian: foto bulat di kiri, kapsul menu di tengah (desktop),
// tombol bahasa dan tema di kanan, masing-masing lingkaran sendiri.
// HP: menu pindah ke kapsul ikon di bawah layar.
export async function SiteHeader({ locale }: { locale: AppLocale }) {
  const [t, profile] = await Promise.all([
    getTranslations({ locale, namespace: 'Nav' }),
    getPublicProfile(),
  ])
  const name = profile?.name ?? 'Muhammad Mirza'

  return (
    <>
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 px-4 pt-3 sm:px-6 lg:px-8 lg:pt-4">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="justify-self-start">
            <Avatar name={name} photoUrl={profile?.photo?.url} />
          </div>
          <nav aria-label={t('label')} className="hidden lg:block">
            <div className={pill}>
              <NavLinks variant="top" />
            </div>
          </nav>
          <div className="col-start-3 flex items-center gap-2 justify-self-end">
            {profile?.hasCv ? (
              <a
                href={`/api/cv?locale=${locale}`}
                className="hidden min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg shadow-lg transition-colors hover:bg-primary/90 lg:inline-flex"
              >
                <Download className="size-4" aria-hidden="true" />
                {t('downloadCv')}
              </a>
            ) : null}
            <LocaleSwitcher className={`size-11 ${floating}`} />
            <ThemeToggle className={`size-11 ${floating}`} />
          </div>
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
