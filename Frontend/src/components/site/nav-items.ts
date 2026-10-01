// Urutan navigasi publik (DESIGN.md bagian 4).
export const siteNav = [
  { href: '/', key: 'home' },
  { href: '/about', key: 'about' },
  { href: '/experience', key: 'experience' },
  { href: '/projects', key: 'projects' },
  { href: '/contact', key: 'contact' },
] as const

export function isSiteNavActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
