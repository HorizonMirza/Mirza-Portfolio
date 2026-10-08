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
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/profile', label: 'Profil', icon: UserRound },
  { href: '/admin/projects', label: 'Project', icon: FolderKanban },
  { href: '/admin/skills', label: 'Skill', icon: Sparkles },
  { href: '/admin/experience', label: 'Pengalaman', icon: BriefcaseBusiness },
  { href: '/admin/highlights', label: 'Angka', icon: TrendingUp },
  { href: '/admin/messages', label: 'Pesan', icon: Inbox },
  { href: '/admin/subscribers', label: 'Pelanggan', icon: Mail },
  { href: '/admin/audit', label: 'Log audit', icon: History },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
  { href: '/admin/account', label: 'Akun', icon: KeyRound },
] as const

// Link aktif: sama persis untuk dashboard, awalan untuk halaman lain.
export function isNavActive(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)
}
