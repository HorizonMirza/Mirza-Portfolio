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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Menu admin" className="flex flex-col gap-5">
      {adminNavGroups.map((group) => (
        <div key={group}>
          <p className="mb-1.5 px-3 font-mono text-[0.6875rem] tracking-widest text-muted uppercase">
            {group}
          </p>
          <ul className="flex flex-col gap-0.5">
            {adminNav
              .filter((item) => item.group === group)
              .map(({ href, label, icon: Icon }) => {
                const active = isNavActive(pathname, href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        // garis biru di kiri menandai halaman aktif, senada label biru di tiap halaman
                        'relative flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text',
                        active &&
                          'bg-surface-2 text-text before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-note',
                      )}
                    >
                      <Icon className={cn('size-4', active && 'text-note')} aria-hidden="true" />
                      {label}
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
    <Button variant="ghost" className="flex-1 justify-start" onClick={signOut}>
      <LogOut aria-hidden="true" />
      Keluar
    </Button>
  )
}

function SidebarBody({
  adminName,
  photo,
  onNavigate,
}: AdminIdentity & { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-1">
        <Avatar photo={photo} size="md" />
        <div className="min-w-0">
          <p className="font-mono text-label tracking-widest text-note uppercase">Super Admin</p>
          <p className="mt-0.5 line-clamp-2 text-sm leading-snug font-semibold">{adminName}</p>
        </div>
      </div>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <a
          href="/id"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Lihat situs
          <span className="sr-only">(membuka tab baru)</span>
        </a>
        <div className="flex items-center gap-2">
          <SignOutButton />
          <ThemeToggle />
        </div>
      </div>
    </>
  )
}

// Desktop (≥ 1024 px): sidebar menempel setinggi layar dan bisa digulir sendiri, jadi menu, tema,
// dan Keluar tetap terlihat walau halamannya panjang.
export function AdminSidebar(props: AdminIdentity) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 overflow-y-auto overscroll-contain border-r border-border bg-surface p-4 lg:flex">
      <SidebarBody {...props} />
    </aside>
  )
}

// HP dan tablet: bilah atas menempel dengan foto bulat, nama halaman aktif, dan tombol menu.
export function AdminMobileBar(props: AdminIdentity) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = adminNav.find((item) => isNavActive(pathname, item.href))
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur lg:hidden">
      <Link href="/admin" aria-label="Dashboard admin" className="shrink-0 rounded-full">
        <Avatar photo={props.photo} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[0.6875rem] tracking-widest text-note uppercase">
          Super Admin
        </p>
        <p className="truncate text-sm font-semibold">{current?.label ?? 'Admin'}</p>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Buka menu admin">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        {/* bisa digulir: di HP pendek tombol Keluar di dasar menu tetap terjangkau */}
        <SheetContent
          aria-describedby={undefined}
          className="gap-6 overflow-y-auto overscroll-contain"
        >
          <SheetTitle className="sr-only">Menu admin</SheetTitle>
          <SidebarBody {...props} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
