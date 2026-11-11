'use client'

import { History, Inbox, LayoutDashboard, Layers, Menu, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useState } from 'react'

import { LangSwitch, useAdminT } from '@/components/admin/admin-lang'
import { GlassControl } from '@/components/admin/glass-settings'
import { adminNav, isNavActive } from '@/components/admin/nav'
import { ProfileMenu, type AdminIdentity } from '@/components/admin/profile-menu'
import { SidebarNav } from '@/components/admin/sidebar'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

// Dock kaca di bawah layar HP (desain 5+): menu yang paling sering dibuka; "Halaman" membuka laci
// berisi seluruh menu.
const DOCK = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/messages', label: 'Pesan', icon: Inbox },
  { href: '/admin/audit', label: 'Log audit', icon: History },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
] as const

// Top bar kaca di semua ukuran layar (desain 5+, DESIGN.md bagian 112-113): selebar panel isi (logo
// panel ada di sidebar). Di kiri tombol menu (HP) dan nama halaman; di kanan Tampilan, bahasa tampilan
// ID/EN, tema gelap/terang, dan profil, semuanya di tengah tinggi bar.
export function AdminTopBar(props: AdminIdentity) {
  const pathname = usePathname()
  const t = useAdminT()
  const [open, setOpen] = useState(false)
  const current = adminNav.find((item) => isNavActive(pathname, item))
  const dockItem = (href: string) =>
    isNavActive(pathname, adminNav.find((item) => item.href === href) ?? { href })
  const onSitePage = !DOCK.some((item) => dockItem(item.href))
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <header className="admin-glass-panel relative z-30 flex h-[3.875rem] shrink-0 items-center gap-1.5 rounded-[18px] px-2 sm:gap-2 sm:px-3 md:rounded-[20px] md:pr-3 md:pl-5">
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label={t('Buka menu admin')}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-2 md:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </SheetTrigger>
        {/* nama halaman (revisi pemilik 2026-11-06), Inter biasa seperti layar utama (2026-11-11) */}
        <p className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight sm:text-xl">
          {t(current?.label ?? 'Admin')}
        </p>
        <GlassControl />
        <LangSwitch />
        <ThemeToggle className="size-11" label={t('Mode gelap')} />
        <ProfileMenu {...props} />
      </header>
      <nav
        aria-label={t('Menu cepat')}
        className="admin-glass-panel fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 gap-0.5 rounded-full p-1.5 md:hidden"
      >
        {DOCK.slice(0, 1).map(({ href, label, icon: Icon }) => (
          <DockLink key={href} href={href} label={t(label)} active={dockItem(href)}>
            <Icon className="size-5" aria-hidden="true" />
          </DockLink>
        ))}
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label={t('Halaman situs dan menu lain')}
            className={cn(
              'inline-flex size-11 items-center justify-center rounded-full text-muted',
              onSitePage && 'bg-surface-2 text-text',
            )}
          >
            <Layers className="size-5" aria-hidden="true" />
          </button>
        </SheetTrigger>
        {DOCK.slice(1).map(({ href, label, icon: Icon }) => (
          <DockLink key={href} href={href} label={t(label)} active={dockItem(href)}>
            <Icon className="size-5" aria-hidden="true" />
          </DockLink>
        ))}
      </nav>
      {/* bisa digulir: di HP pendek menu terbawah tetap terjangkau */}
      <SheetContent
        aria-describedby={undefined}
        className="admin-sheet admin-glass-panel gap-6 overflow-y-auto overscroll-contain rounded-r-[23px] border-0"
      >
        <SheetTitle className="sr-only">{t('Menu admin')}</SheetTitle>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

function DockLink({
  href,
  label,
  active,
  children,
}: {
  href: string
  label: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors',
        active && 'bg-surface-2 text-text',
      )}
    >
      {children}
    </Link>
  )
}
