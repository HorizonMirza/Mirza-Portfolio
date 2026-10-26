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

// Permukaan melayang yang sama dengan topbar situs publik (components/site/site-header.tsx): tanpa
// backdrop-blur, latar 95% pekat.
const floating = 'border border-border bg-surface/95 shadow-lg'

// Menu cepat di bilah bawah HP; sisanya lewat tombol Menu. Urutan = urutan kolom.
const SHORTCUTS = ['/admin', '/admin/pages/projects', '/admin/messages', '/admin/settings'] as const
const shortcutItems = SHORTCUTS.map((href) => adminNav.find((item) => item.href === href)!)

// Foto bulat berbingkai, sama dengan foto di topbar situs publik.
function Avatar({ photo, size }: { photo: AdminIdentity['photo']; size: 'sm' | 'md' }) {
  const px = size === 'sm' ? 36 : 44
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full p-0.5',
        floating,
        size === 'sm' ? 'size-11' : 'size-12',
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

// Lampu hitam/putih (ikut warna teks tema) di tepi menu aktif, seperti topbar situs publik.
function Lamp({ edge }: { edge: 'left' | 'top' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute bg-text',
        edge === 'left'
          ? 'top-1/2 -left-[5px] h-6 w-1 -translate-y-1/2 rounded-l-full'
          : '-top-[5px] left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full',
      )}
    >
      <span
        className={cn(
          'absolute rounded-full bg-text/20 blur-md',
          edge === 'left' ? '-top-2 -left-3 h-10 w-6' : '-top-2 -left-2 h-6 w-12',
        )}
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
          <p className="mb-1.5 px-3.5 font-mono text-[0.6875rem] tracking-widest text-muted uppercase">
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
                      {active ? <Lamp edge="left" /> : null}
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

// Desktop (≥ 1024 px): dock melayang di kiri setinggi layar (bisa digulir sendiri), jadi menu, tema,
// dan Keluar tetap terlihat walau halamannya panjang.
export function AdminSidebar(props: AdminIdentity) {
  return (
    <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-64 shrink-0 lg:block">
      <div
        className={cn(
          'flex h-full flex-col gap-6 overflow-y-auto overscroll-contain rounded-3xl p-4',
          floating,
        )}
      >
        <SidebarBody {...props} />
      </div>
    </aside>
  )
}

// Lampu bilah bawah: satu elemen yang digeser per kolom lewat transform (dikerjakan GPU), sama dengan
// bilah bawah situs publik (components/site/nav-links.tsx).
function BottomLamp({ index }: { index: number }) {
  if (index < 0) return null
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 w-[calc((100%-4*var(--nav-gap))/5)] transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      style={{ transform: `translateX(calc(${index} * (100% + var(--nav-gap))))` }}
    >
      <Lamp edge="top" />
    </span>
  )
}

// HP dan tablet (< 1024 px), seperti situs publik: foto bulat, nama halaman, dan tombol tema melayang di
// atas; kapsul menu cepat di bawah layar dengan tombol Menu untuk sisanya.
export function AdminMobileBar(props: AdminIdentity) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = adminNav.find((item) => isNavActive(pathname, item))
  const shortcut = shortcutItems.findIndex((item) => isNavActive(pathname, item))
  // halaman di luar menu cepat: lampu jatuh di tombol Menu
  const lampIndex = shortcut >= 0 ? shortcut : current ? shortcutItems.length : -1
  const itemClass =
    'relative inline-flex h-[3.75rem] w-full items-center justify-center rounded-full text-muted transition-colors hover:text-text'

  return (
    <>
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 flex items-center gap-3 px-3 pt-3 sm:px-4 lg:hidden">
        <Link href="/admin" aria-label="Dashboard admin" className="shrink-0 rounded-full">
          <Avatar photo={props.photo} size="sm" />
        </Link>
        <div
          className={cn(
            'flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-full px-4',
            floating,
          )}
        >
          <p className="font-mono text-[0.625rem] leading-none tracking-widest text-note uppercase">
            Super Admin
          </p>
          <p className="mt-0.5 truncate text-sm leading-tight font-semibold">
            {current?.label ?? 'Admin'}
          </p>
        </div>
        <ThemeToggle className={cn('size-11', floating)} />
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <nav
          aria-label="Menu cepat admin"
          className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <div className={cn('flex w-full max-w-md items-center rounded-full p-1.5', floating)}>
            <ul className="relative grid w-full grid-cols-5 gap-(--nav-gap) [--nav-gap:0.25rem]">
              <BottomLamp index={lampIndex} />
              {shortcutItems.map(({ href, label, icon: Icon }, i) => (
                <li key={href} className="min-w-0">
                  <Link
                    href={href}
                    aria-current={i === shortcut ? 'page' : undefined}
                    className={cn(itemClass, i === shortcut && 'bg-surface-2 text-text')}
                  >
                    <Icon className="size-6" strokeWidth={2} aria-hidden="true" />
                    <span className="sr-only">{label}</span>
                  </Link>
                </li>
              ))}
              <li className="min-w-0">
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="Buka menu admin"
                    className={cn(
                      itemClass,
                      lampIndex === shortcutItems.length && 'bg-surface-2 text-text',
                    )}
                  >
                    <Menu className="size-6" strokeWidth={2} aria-hidden="true" />
                  </button>
                </SheetTrigger>
              </li>
            </ul>
          </div>
        </nav>
        {/* bisa digulir: di HP pendek tombol Keluar di dasar menu tetap terjangkau */}
        <SheetContent
          aria-describedby={undefined}
          className="gap-6 overflow-y-auto overscroll-contain"
        >
          <SheetTitle className="sr-only">Menu admin</SheetTitle>
          <SidebarBody {...props} withTheme={false} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
