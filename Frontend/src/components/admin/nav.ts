import {
  BriefcaseBusiness,
  Code,
  DoorOpen,
  FolderKanban,
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
  Sparkles,
  User,
  UserRound,
} from 'lucide-react'

export const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, group: 'Utama' },
  { href: '/admin/profile', label: 'Profil', icon: UserRound, group: 'Konten' },
  { href: '/admin/projects', label: 'Project', icon: FolderKanban, group: 'Konten' },
  { href: '/admin/skills', label: 'Skill', icon: Sparkles, group: 'Konten' },
  { href: '/admin/experience', label: 'Pengalaman', icon: BriefcaseBusiness, group: 'Konten' },
  // satu halaman per modul situs publik (features/site-text/catalog.ts SITE_MODULES)
  { href: '/admin/pages/intro', label: 'Bagian Awal', icon: DoorOpen, group: 'Halaman situs' },
  { href: '/admin/pages/home', label: 'Home', icon: House, group: 'Halaman situs' },
  { href: '/admin/pages/about', label: 'About', icon: User, group: 'Halaman situs' },
  { href: '/admin/pages/experience', label: 'Experience', icon: Route, group: 'Halaman situs' },
  { href: '/admin/pages/projects', label: 'Projects', icon: Code, group: 'Halaman situs' },
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
] as const

// Menu dikelompokkan seperti label kecil di atas judul tiap halaman admin (Konten, Kotak masuk, ...).
export const adminNavGroups = ['Utama', 'Konten', 'Halaman situs', 'Kotak masuk', 'Sistem'] as const

// Link aktif: sama persis untuk dashboard, awalan untuk halaman lain.
export function isNavActive(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)
}
