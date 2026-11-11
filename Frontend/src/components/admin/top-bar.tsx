'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'

import { LangSwitch, useAdminT } from '@/components/admin/admin-lang'
import { GlassControl } from '@/components/admin/glass-settings'
import { adminNav, isNavActive } from '@/components/admin/nav'
import { type AdminIdentity, ProfileMenu } from '@/components/admin/profile-menu'
import { SidebarNav } from '@/components/admin/sidebar'
import { useSidebarState } from '@/components/admin/sidebar-state'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

const DESKTOP = '(min-width: 1024px)'

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

// Top bar kaca (DESIGN.md bagian 112-113, 126): di kiri tombol hamburger dan nama halaman; di kanan
// Tampilan, bahasa tampilan ID/EN, dan tema. Hamburger di desktop menciutkan sidebar menjadi ikon atau
// melebarkannya lagi; di HP dan tablet membuka laci berisi seluruh menu. Foto profil hanya di HP
// (di tablet dan desktop identitas dan menu profil ada di puncak sidebar, tidak diulang di sini).
export function AdminTopBar(props: AdminIdentity) {
  const pathname = usePathname()
  const t = useAdminT()
  const [open, setOpen] = useState(false)
  const { collapsed, toggle } = useSidebarState()
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP).matches,
    () => true,
  )
  const current = adminNav.find((item) => isNavActive(pathname, item))
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <header className="admin-glass-panel relative z-30 flex h-[3.875rem] shrink-0 items-center gap-1.5 rounded-[18px] px-2 sm:gap-2 sm:px-3 md:rounded-[20px] md:pr-3">
        <button
          type="button"
          aria-label={t('Menu samping')}
          aria-expanded={desktop ? !collapsed : open}
          onClick={() => (window.matchMedia(DESKTOP).matches ? toggle() : setOpen(true))}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-2"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        {/* nama halaman (revisi pemilik 2026-11-06), Inter biasa seperti layar utama (2026-11-11) */}
        <p className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight sm:text-xl">
          {t(current?.label ?? 'Admin')}
        </p>
        <GlassControl />
        <LangSwitch />
        <ThemeToggle className="size-11" label={t('Mode gelap')} />
        <ProfileMenu {...props} variant="avatar" className="md:hidden" />
      </header>
      {/* bisa digulir: di HP pendek menu terbawah tetap terjangkau */}
      <SheetContent
        aria-describedby={undefined}
        className="admin-sheet admin-glass-panel gap-6 overflow-y-auto overscroll-contain rounded-r-[23px] border-0 pt-16"
      >
        <SheetTitle className="sr-only">{t('Menu admin')}</SheetTitle>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
