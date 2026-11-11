'use client'

import { History, Inbox, LayoutDashboard, Layers, Menu, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useState } from 'react'

import { LangSwitch } from '@/components/admin/admin-lang'
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

// Top bar kaca di semua ukuran layar (desain 5+, DESIGN.md bagian 112): di kiri tombol menu (HP),
// logo panel, dan nama halaman; di kanan Atur kaca, bahasa isian ID/EN, tema gelap/terang, dan profil.
export function AdminTopBar(props: AdminIdentity) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = adminNav.find((item) => isNavActive(pathname, item))
  const dockItem = (href: string) =>
    isNavActive(pathname, adminNav.find((item) => item.href === href) ?? { href })
  const onSitePage = !DOCK.some((item) => dockItem(item.href))
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <header className="admin-glass-panel sticky top-3 z-30 flex h-[3.875rem] items-center gap-1.5 rounded-[18px] px-2 sm:gap-2 sm:px-3 md:top-4 md:rounded-[20px] md:px-4">
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Buka menu admin"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-2 md:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </SheetTrigger>
        <Link href="/admin" className="hidden shrink-0 items-center gap-2.5 sm:flex">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-[10px] bg-text font-display text-sm font-bold text-bg"
          >
            MM
          </span>
          <span className="text-sm font-semibold max-lg:sr-only">Super Admin</span>
        </Link>
        <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-border sm:block" />
        {/* nama halaman, besar (revisi pemilik 2026-11-06) */}
        <p className="min-w-0 flex-1 truncate font-display text-xl tracking-wide uppercase sm:text-2xl">
          {current?.label ?? 'Admin'}
        </p>
        <GlassControl />
        <LangSwitch />
        <ThemeToggle className="size-11" />
        <ProfileMenu {...props} />
      </header>
      <nav
        aria-label="Menu cepat"
        className="admin-glass-panel fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 gap-0.5 rounded-full p-1.5 md:hidden"
      >
        {DOCK.slice(0, 1).map(({ href, label, icon: Icon }) => (
          <DockLink key={href} href={href} label={label} active={dockItem(href)}>
            <Icon className="size-5" aria-hidden="true" />
          </DockLink>
        ))}
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Halaman situs dan menu lain"
            className={cn(
              'inline-flex size-11 items-center justify-center rounded-full text-muted',
              onSitePage && 'bg-surface-2 text-text',
            )}
          >
            <Layers className="size-5" aria-hidden="true" />
          </button>
        </SheetTrigger>
        {DOCK.slice(1).map(({ href, label, icon: Icon }) => (
          <DockLink key={href} href={href} label={label} active={dockItem(href)}>
            <Icon className="size-5" aria-hidden="true" />
          </DockLink>
        ))}
      </nav>
      {/* bisa digulir: di HP pendek menu terbawah tetap terjangkau */}
      <SheetContent
        aria-describedby={undefined}
        className="admin-sheet admin-glass-panel gap-6 overflow-y-auto overscroll-contain rounded-r-[23px] border-0"
      >
        <SheetTitle className="sr-only">Menu admin</SheetTitle>
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
