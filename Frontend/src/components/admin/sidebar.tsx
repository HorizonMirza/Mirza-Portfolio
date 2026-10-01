'use client'

import { LogOut, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { adminNav, isNavActive } from '@/components/admin/nav'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Menu admin" className="flex flex-col gap-1">
      {adminNav.map(({ href, label, icon: Icon }) => {
        const active = isNavActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text',
              active && 'bg-surface-2 text-text',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
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
    <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
      <LogOut aria-hidden="true" />
      Keluar
    </Button>
  )
}

export function AdminSidebar({ adminName }: { adminName: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4 lg:flex">
      <SidebarBody adminName={adminName} />
    </aside>
  )
}

function SidebarBody({ adminName, onNavigate }: { adminName: string; onNavigate?: () => void }) {
  return (
    <>
      <div>
        <p className="font-mono text-label tracking-widest text-note uppercase">Super Admin</p>
        <p className="mt-1 truncate text-sm font-semibold">{adminName}</p>
      </div>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto flex flex-col gap-3">
        <ThemeToggle />
        <SignOutButton />
      </div>
    </>
  )
}

export function AdminMobileBar({ adminName }: { adminName: string }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 lg:hidden">
      <span className="font-mono text-sm font-medium">MM · Admin</span>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Buka menu admin">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent aria-describedby={undefined} className="gap-6">
          <SheetTitle className="sr-only">Menu admin</SheetTitle>
          <SidebarBody adminName={adminName} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
