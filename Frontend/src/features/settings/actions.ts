'use server'

import { Prisma } from '@/generated/prisma/client'
import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { isDefaultPalette } from '@/lib/github-palette'
import { revalidateContent } from '@/lib/revalidate'

import { githubPaletteSchema } from '@/features/github/schema'

import { siteOptionSchema } from './options'
import { introSchema } from './schema'
import { introSettingData, writeSetting } from './write'

// Simpan SiteSetting dalam transaksinya sendiri, lalu perbarui cache.
async function saveSetting(
  actorId: string,
  data: Prisma.SiteSettingUncheckedUpdateInput,
): Promise<void> {
  await getDb().$transaction((tx) => writeSetting(tx, actorId, data))
  revalidateContent('settings')
}

// Satu pengaturan dari Admin → Pengaturan, disimpan otomatis setiap kontrol diubah (DESIGN.md
// bagian 119). Hanya kolom di siteOptionSchema yang bisa ditulis; setiap perubahan masuk log audit.
export async function saveSiteOption(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = siteOptionSchema.safeParse(input)
    if (!parsed.success) {
      const message = parsed.error.issues.find((i) => i.path[0] === 'value')?.message
      return fail(message ?? 'Pengaturan tidak dikenal.')
    }
    const { key, value } = parsed.data
    await saveSetting(admin.userId, { [key]: value })
    return ok('Tersimpan')
  } catch (error) {
    return toActionError(error)
  }
}

// Isi kartu pembuka (Admin → Home, tab Kartu pembuka), satu-satunya bagian kartu yang bisa diubah.
export async function saveIntroNotice(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = introSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    await saveSetting(admin.userId, introSettingData(parsed.data))
    return ok('Kartu pembuka disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}

// Warna grafik kontribusi GitHub di beranda (Admin → Home → GitHub). Sama dengan warna bawaan =
// disimpan kosong, supaya perubahan bawaan situs ke depan ikut tampil.
export async function saveGithubPalette(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = githubPaletteSchema.safeParse(input)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Periksa kembali warna.')
    const palette = {
      light: parsed.data.light.map((c) => c.toLowerCase()),
      dark: parsed.data.dark.map((c) => c.toLowerCase()),
    }
    await saveSetting(admin.userId, {
      githubPalette: isDefaultPalette(palette) ? Prisma.DbNull : palette,
    })
    return ok('Warna GitHub disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}
