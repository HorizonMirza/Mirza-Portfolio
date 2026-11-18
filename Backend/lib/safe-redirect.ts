// Hanya izinkan pengalihan ke halaman admin di situs sendiri (cegah open redirect).
export function safeAdminRedirect(target: string | undefined): string {
  if (!target) return '/admin'
  if (!target.startsWith('/admin')) return '/admin'
  if (target.startsWith('//') || target.includes('\\')) return '/admin'
  if (target === '/admin/login' || target.startsWith('/admin/login?')) return '/admin'
  return target
}
