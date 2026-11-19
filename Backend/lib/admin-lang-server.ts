// Bahasa tampilan admin dan fungsi terjemahnya untuk server component (hanya server).

import 'server-only'

import { cookies } from 'next/headers'

import {
  ADMIN_LANG_COOKIE,
  type AdminLang,
  adminT,
  type AdminVars,
  parseAdminLang,
} from '@backend/lib/admin-i18n'

// Bahasa tampilan admin untuk server component (cookie dari tombol ID/EN di top bar).
export async function getAdminLang(): Promise<AdminLang> {
  return parseAdminLang((await cookies()).get(ADMIN_LANG_COOKIE)?.value)
}

// Bahasa admin beserta fungsi t() yang sudah terikat ke bahasa itu.
export async function getAdminT() {
  const lang = await getAdminLang()
  return { lang, t: (text: string, vars?: AdminVars) => adminT(lang, text, vars) }
}
