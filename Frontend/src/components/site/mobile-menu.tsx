'use client'

import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ReactNode, useEffect, useRef } from 'react'

import { usePathname } from '@/i18n/navigation'

// Panel layar penuh memakai atribut popover bawaan browser: Esc dan klik tombol
// sudah ditangani browser. JS di sini hanya menutup panel setelah pindah halaman.
export function MobileMenu({ children }: { children: ReactNode }) {
  const t = useTranslations('Nav')
  const pathname = usePathname()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = panel.current
    if (el?.matches(':popover-open')) el.hidePopover()
  }, [pathname])

  return (
    <>
      <button
        type="button"
        popoverTarget="site-menu"
        className="inline-flex size-11 items-center justify-center rounded-md text-text hover:bg-surface-2 lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
        <span className="sr-only">{t('openMenu')}</span>
      </button>
      <div
        id="site-menu"
        ref={panel}
        popover="auto"
        aria-label={t('label')}
        className="site-menu m-0 h-dvh max-h-none w-full max-w-none bg-bg p-4 text-text backdrop:bg-black/40"
      >
        <div className="flex justify-end">
          <button
            type="button"
            popoverTarget="site-menu"
            popoverTargetAction="hide"
            className="inline-flex size-11 items-center justify-center rounded-md hover:bg-surface-2"
          >
            <X className="size-5" aria-hidden="true" />
            <span className="sr-only">{t('closeMenu')}</span>
          </button>
        </div>
        {children}
      </div>
    </>
  )
}
