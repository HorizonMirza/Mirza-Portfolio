import 'server-only'

import { cookies } from 'next/headers'

import { ADMIN_LANG_COOKIE, type AdminLang, adminT, parseAdminLang } from '@/lib/admin-i18n'

// Bahasa tampilan admin untuk server component (cookie dari tombol ID/EN di top bar).
export async function getAdminLang(): Promise<AdminLang> {
  return parseAdminLang((await cookies()).get(ADMIN_LANG_COOKIE)?.value)
}

export async function getAdminT() {
  const lang = await getAdminLang()
  return { lang, t: (text: string) => adminT(lang, text) }
}
