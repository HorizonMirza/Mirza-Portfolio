import { Prisma } from '@/generated/prisma/client'
import { UnauthorizedError } from '@/lib/auth-guard'

// Hasil standar Server Action admin, ditampilkan sebagai toast dan galat per field.
export type ActionResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

export function ok<T>(message: string, data?: T): ActionResult<T> {
  return { ok: true, message, data }
}

export function fail(message: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, message, fieldErrors }
}

// Ubah galat umum menjadi pesan yang aman ditampilkan (tanpa detail internal).
export function toActionError(
  error: unknown,
  uniqueFieldLabels: Record<string, string> = {},
): ActionResult<never> {
  if (error instanceof UnauthorizedError) return fail('Sesi berakhir. Silakan masuk lagi.')
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const field = uniqueViolationFields(error.meta).find((t) => t in uniqueFieldLabels)
      if (field)
        return fail('Data sudah dipakai.', { [field]: `${uniqueFieldLabels[field]} sudah dipakai` })
      return fail('Data yang sama sudah ada.')
    }
    if (error.code === 'P2025') return fail('Data tidak ditemukan. Mungkin sudah dihapus.')
    if (error.code === 'P2003') return fail('Data masih dipakai oleh data lain.')
  }
  console.error('[admin-action]', error instanceof Error ? error.message : error)
  return fail('Terjadi kesalahan. Coba lagi.')
}

// Nama kolom dari galat unik. Prisma 7 dengan driver adapter hanya memberi nama indeks
// ("Skill_name_key"), versi lama memberi meta.target.
export function uniqueViolationFields(meta: Record<string, unknown> | undefined): string[] {
  if (!meta) return []
  if (meta.target) return ([] as string[]).concat(meta.target as string[] | string)
  const cause = (
    meta.driverAdapterError as { cause?: { constraint?: { fields?: string[]; index?: string } } }
  )?.cause
  if (cause?.constraint?.fields) return cause.constraint.fields
  const index = cause?.constraint?.index
  const match = index ? /^[A-Za-z0-9]+_(.+)_key$/.exec(index) : null
  return match ? match[1]!.split('_') : []
}

// Galat Zod → { field: pesan pertama }.
export function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.')
    if (key && !(key in out)) out[key] = issue.message
  }
  return out
}
