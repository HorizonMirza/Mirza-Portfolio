// Tujuan pengalihan setelah login admin. Hanya halaman admin di situs sendiri yang diizinkan (cegah
// open redirect); selain itu ke /admin.

export function safeAdminRedirect(target: string | undefined): string {
  if (!target) return '/admin'
  if (!target.startsWith('/admin')) return '/admin'
  if (target.startsWith('//') || target.includes('\\')) return '/admin'
  if (target === '/admin/login' || target.startsWith('/admin/login?')) return '/admin'
  return target
}
