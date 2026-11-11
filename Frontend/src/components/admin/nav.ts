import {
  type LucideIcon,
  Code,
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
  // satu halaman per modul situs publik (features/site-text/catalog.ts SITE_MODULES)
  {
    href: '/admin/pages/home',
    label: 'Home',
    icon: House,
    // kartu pembuka (Bagian Awal) menjadi tab Home sejak 2026-11-11
    match: ['/admin/pages/intro', '/admin/skills'],
  },
  {
    href: '/admin/pages/about',
    label: 'About',
    icon: User,
    match: ['/admin/profile', '/admin/education'],
  },
  {
    href: '/admin/pages/experience',
    label: 'Experience',
    icon: Route,
    match: ['/admin/experience'],
  },
  {
    href: '/admin/pages/projects',
    label: 'Projects',
    icon: Code,
    match: ['/admin/projects'],
  },
  { href: '/admin/pages/contact', label: 'Contact', icon: MessageSquare },
  { href: '/admin/pages/navbar', label: 'Navbar', icon: PanelTop },
  { href: '/admin/pages/footer', label: 'Footer', icon: PanelBottom },
  { href: '/admin/messages', label: 'Pesan', icon: Inbox },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
  // Akun dibuka dari menu profil, tidak di sidebar; tetap terdaftar agar nama halaman di top bar
  // berfungsi. Log audit dihapus dari panel (revisi pemilik 2026-11-11), pencatatannya tetap.
  { href: '/admin/account', label: 'Akun', icon: KeyRound, inSidebar: false },
]

function under(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

// Link aktif: sama persis untuk dashboard, awalan untuk halaman lain (juga halaman data yang terhubung).
export function isNavActive(pathname: string, item: Pick<NavItem, 'href' | 'match'>) {
  if (item.href === '/admin') return pathname === '/admin'
  return under(pathname, item.href) || (item.match ?? []).some((href) => under(pathname, href))
}
