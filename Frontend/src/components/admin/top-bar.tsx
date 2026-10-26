'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { LangSwitch } from '@/components/admin/admin-lang'
import { adminNav, isNavActive } from '@/components/admin/nav'
import { ProfileMenu, type AdminIdentity } from '@/components/admin/profile-menu'
import { SidebarNav } from '@/components/admin/sidebar'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

// Top bar di semua ukuran layar (permintaan pemilik 2026-10-26): di kiri tombol menu (hanya HP/tablet,
// membuka laci) dan nama halaman, di kanan tombol bahasa isian ID/EN, tema gelap/terang, dan profil.
export function AdminTopBar(props: AdminIdentity) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = adminNav.find((item) => isNavActive(pathname, item))
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg px-4 py-2.5 sm:px-6 lg:px-8">
        <SheetTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="lg:hidden"
            aria-label="Buka menu admin"
          >
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-muted">
          {current && current.group !== 'Utama' ? `${current.group} / ` : ''}
          <span className="text-text">{current?.label ?? 'Admin'}</span>
        </p>
        <LangSwitch />
        <ThemeToggle className="size-11" />
        <ProfileMenu {...props} />
      </header>
      {/* bisa digulir: di HP pendek menu terbawah tetap terjangkau */}
      <SheetContent
        aria-describedby={undefined}
        className="gap-6 overflow-y-auto overscroll-contain"
      >
        <SheetTitle className="sr-only">Menu admin</SheetTitle>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
