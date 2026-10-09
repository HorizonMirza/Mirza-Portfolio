import {
  BriefcaseBusiness,
  FolderKanban,
  History,
  Inbox,
  LayoutDashboard,
  Mail,
  Sparkles,
  TrendingUp,
  KeyRound,
  Settings,
  UserRound,
} from 'lucide-react'

export const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, group: 'Utama' },
  { href: '/admin/profile', label: 'Profil', icon: UserRound, group: 'Konten' },
  { href: '/admin/projects', label: 'Project', icon: FolderKanban, group: 'Konten' },
  { href: '/admin/skills', label: 'Skill', icon: Sparkles, group: 'Konten' },
  { href: '/admin/experience', label: 'Pengalaman', icon: BriefcaseBusiness, group: 'Konten' },
  { href: '/admin/highlights', label: 'Angka', icon: TrendingUp, group: 'Konten' },
  { href: '/admin/messages', label: 'Pesan', icon: Inbox, group: 'Kotak masuk' },
  { href: '/admin/subscribers', label: 'Pelanggan', icon: Mail, group: 'Kotak masuk' },
  { href: '/admin/audit', label: 'Log audit', icon: History, group: 'Sistem' },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings, group: 'Sistem' },
  { href: '/admin/account', label: 'Akun', icon: KeyRound, group: 'Sistem' },
] as const

// Menu dikelompokkan seperti label kecil di atas judul tiap halaman admin (Konten, Kotak masuk, ...).
export const adminNavGroups = ['Utama', 'Konten', 'Kotak masuk', 'Sistem'] as const

// Link aktif: sama persis untuk dashboard, awalan untuk halaman lain.
export function isNavActive(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)
}
