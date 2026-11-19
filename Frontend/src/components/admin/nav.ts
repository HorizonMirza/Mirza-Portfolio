// Link aktif: sama persis untuk dashboard, awalan untuk halaman lain (juga halaman data yang terhubung).

import {
  type LucideIcon,
  Code,
  Ghost,
  House,
  Inbox,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  PanelBottom,
  PanelTop,
  Route,
  Settings,
  User,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  // halaman data yang terhubung ke menu ini (tab di halaman modul), supaya menu tetap menyala di sana
  match?: readonly string[]
  // false: tidak tampil di sidebar (hanya untuk nama halaman di top bar)
  inSidebar?: boolean
}

export const adminNav: readonly NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  // satu halaman per modul situs publik (Backend/features/site-text/catalog.ts SITE_MODULES)
  {
    // tab pertama Home adalah kartu pembuka (Bagian Awal), lalu peran dan skill
    href: '/admin/pages/intro',
    label: 'Home',
    icon: House,
    match: ['/admin/pages/home', '/admin/roles', '/admin/skills', '/admin/github'],
  },
  {
    // tab pertama About adalah Profil
    href: '/admin/profile',
    label: 'About',
    icon: User,
    match: ['/admin/pages/about', '/admin/education'],
  },
  {
    // menu langsung ke timeline pengalaman
    href: '/admin/experience',
    label: 'Experience',
    icon: Route,
    match: ['/admin/pages/experience'],
  },
  {
    // menu langsung ke daftar project
    href: '/admin/projects',
    label: 'Projects',
    icon: Code,
    match: ['/admin/pages/projects'],
  },
  { href: '/admin/pages/contact', label: 'Contact', icon: MessageSquare },
  { href: '/admin/pages/navbar', label: 'Navbar', icon: PanelTop },
  { href: '/admin/pages/footer', label: 'Footer', icon: PanelBottom },
  // pratinjau 11 halaman status, di atas Pesan
  { href: '/admin/status', label: 'Halaman Status', icon: Ghost },
  { href: '/admin/messages', label: 'Pesan', icon: Inbox },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
  // Akun dibuka dari menu profil, tidak di sidebar; tetap terdaftar agar nama halaman di top bar
  // berfungsi.
  { href: '/admin/account', label: 'Akun', icon: KeyRound, inSidebar: false },
]

function under(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isNavActive(pathname: string, item: Pick<NavItem, 'href' | 'match'>) {
  if (item.href === '/admin') return pathname === '/admin'
  return under(pathname, item.href) || (item.match ?? []).some((href) => under(pathname, href))
}
