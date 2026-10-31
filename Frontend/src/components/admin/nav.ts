import {
  type LucideIcon,
  Code,
  DoorOpen,
  Ghost,
  History,
  House,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PanelBottom,
  PanelTop,
  Route,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  group: (typeof adminNavGroups)[number]
  // halaman data yang terhubung ke menu ini (tab di halaman modul), supaya menu tetap menyala di sana
  match?: readonly string[]
}

export const adminNav: readonly NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, group: 'Utama' },
  // satu halaman per modul situs publik (features/site-text/catalog.ts SITE_MODULES)
  { href: '/admin/pages/intro', label: 'Bagian Awal', icon: DoorOpen, group: 'Halaman situs' },
  {
    href: '/admin/pages/home',
    label: 'Home',
    icon: House,
    group: 'Halaman situs',
    match: ['/admin/skills'],
  },
  {
    href: '/admin/pages/about',
    label: 'About',
    icon: User,
    group: 'Halaman situs',
    match: ['/admin/profile'],
  },
  {
    href: '/admin/pages/experience',
    label: 'Experience',
    icon: Route,
    group: 'Halaman situs',
    match: ['/admin/experience'],
  },
  {
    href: '/admin/pages/projects',
    label: 'Projects',
    icon: Code,
    group: 'Halaman situs',
    match: ['/admin/projects'],
  },
  { href: '/admin/pages/contact', label: 'Contact', icon: MessageSquare, group: 'Halaman situs' },
  { href: '/admin/pages/navbar', label: 'Navbar', icon: PanelTop, group: 'Halaman situs' },
  { href: '/admin/pages/footer', label: 'Footer', icon: PanelBottom, group: 'Halaman situs' },
  { href: '/admin/pages/privacy', label: 'Privasi', icon: ShieldCheck, group: 'Halaman situs' },
  { href: '/admin/pages/other', label: 'Halaman lain', icon: Ghost, group: 'Halaman situs' },
  { href: '/admin/messages', label: 'Pesan', icon: Inbox, group: 'Kotak masuk' },
  { href: '/admin/subscribers', label: 'Pelanggan', icon: Mail, group: 'Kotak masuk' },
  { href: '/admin/audit', label: 'Log audit', icon: History, group: 'Sistem' },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings, group: 'Sistem' },
  { href: '/admin/account', label: 'Akun', icon: KeyRound, group: 'Sistem' },
]

// Urutan kelompok menu di sidebar admin; tiap item memilih kelompoknya lewat `group`.
export const adminNavGroups = ['Utama', 'Halaman situs', 'Kotak masuk', 'Sistem'] as const

function under(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

// Link aktif: sama persis untuk dashboard, awalan untuk halaman lain (juga halaman data yang terhubung).
export function isNavActive(pathname: string, item: Pick<NavItem, 'href' | 'match'>) {
  if (item.href === '/admin') return pathname === '/admin'
  return under(pathname, item.href) || (item.match ?? []).some((href) => under(pathname, href))
}
