'use client'

import { ExternalLink, LogOut, Menu } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { adminNav, adminNavGroups, isNavActive } from '@/components/admin/nav'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

type AdminIdentity = { adminName: string; photo: string | StaticImageData }

// Foto bulat berbingkai, sama dengan foto di topbar situs publik.
function Avatar({ photo, size }: { photo: AdminIdentity['photo']; size: 'sm' | 'md' }) {
  const px = size === 'sm' ? 36 : 44
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-surface p-0.5',
        size === 'sm' ? 'size-10' : 'size-12',
      )}
    >
      <Image
        src={photo}
        alt=""
        width={px}
        height={px}
        sizes={`${px}px`}
        className="size-full rounded-full object-cover"
      />
    </span>
  )
}

// Lampu hitam/putih (ikut warna teks tema) di tepi kiri menu aktif, seperti topbar situs publik.
function Lamp() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 -left-[5px] h-6 w-1 -translate-y-1/2 rounded-l-full bg-text"
    >
      <span className="absolute -top-2 -left-3 h-10 w-6 rounded-full bg-text/20 blur-md" />
    </span>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Menu admin" className="flex flex-col gap-5">
      {adminNavGroups.map((group) => (
        <div key={group}>
          <p className="mb-1.5 px-3.5 text-[0.6875rem] font-semibold tracking-widest text-muted uppercase">
            {group}
          </p>
          <ul className="flex flex-col gap-0.5">
            {adminNav
              .filter((item) => item.group === group)
              .map((item) => {
                const { href, label, icon: Icon } = item
                const active = isNavActive(pathname, item)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex min-h-10 items-center gap-3 rounded-full px-3.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2/60 hover:text-text',
                        active && 'bg-surface-2 text-text',
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                      {active ? <Lamp /> : null}
                    </Link>
                  </li>
                )
              })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SignOutButton() {
  const router = useRouter()
  async function signOut() {
    await authClient.signOut()
    router.replace('/admin/login')
    router.refresh()
  }
  return (
    <Button variant="secondary" className="flex-1" onClick={signOut}>
      <LogOut aria-hidden="true" />
      Keluar
    </Button>
  )
}

function SidebarBody({
  adminName,
  photo,
  onNavigate,
  withTheme = true,
}: AdminIdentity & { onNavigate?: () => void; withTheme?: boolean }) {
  return (
    <>
      <div className="flex items-center gap-3 px-1">
        <Avatar photo={photo} size="md" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm leading-snug font-semibold">{adminName}</p>
        </div>
      </div>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <a
          href="/id"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center gap-3 rounded-full px-3.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2/60 hover:text-text"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Lihat situs
          <span className="sr-only">(membuka tab baru)</span>
        </a>
        <div className="flex items-center gap-2">
          <SignOutButton />
          {withTheme ? <ThemeToggle className="size-11" /> : null}
        </div>
      </div>
    </>
  )
}

// Desktop (≥ 1024 px): sidebar penuh di tepi kiri setinggi layar (bisa digulir sendiri tanpa batang
// gulir), jadi menu, tema, dan Keluar tetap terlihat walau halamannya panjang.
export function AdminSidebar(props: AdminIdentity) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border bg-surface lg:block">
      <div className="flex h-full flex-col gap-6 overflow-y-auto overscroll-contain p-4">
        <SidebarBody {...props} />
      </div>
    </aside>
  )
}

// HP dan tablet (< 1024 px): bilah atas menempel berisi tombol menu, nama halaman, dan tombol tema;
// menu lengkap membuka laci dari kiri dengan isi yang sama dengan sidebar desktop.
export function AdminMobileBar(props: AdminIdentity) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = adminNav.find((item) => isNavActive(pathname, item))
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface px-4 py-2 lg:hidden">
        <SheetTrigger asChild>
          <Button variant="secondary" size="icon" aria-label="Buka menu admin">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <p className="min-w-0 flex-1 truncate font-display text-lg font-semibold uppercase">
          {current?.label ?? 'Admin'}
        </p>
        <ThemeToggle className="size-11" />
      </header>
      {/* bisa digulir: di HP pendek tombol Keluar di dasar menu tetap terjangkau */}
      <SheetContent
        aria-describedby={undefined}
        className="gap-6 overflow-y-auto overscroll-contain"
      >
        <SheetTitle className="sr-only">Menu admin</SheetTitle>
        <SidebarBody {...props} withTheme={false} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
