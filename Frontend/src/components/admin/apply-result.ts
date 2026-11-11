'use client'

import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'

import { currentAdminLang } from '@/components/admin/admin-lang'
import type { ActionResult } from '@/lib/action-result'
import { adminT } from '@/lib/admin-i18n'

// Tampilkan hasil Server Action: toast, dan galat dari server dipasang ke field form. Pesan dari server
// berbahasa Indonesia dan diterjemahkan di sini sesuai bahasa admin (galat field diterjemahkan Field).
export function applyResult<T extends FieldValues>(
  result: ActionResult<unknown>,
  setError?: UseFormSetError<T>,
): boolean {
  const lang = currentAdminLang()
  if (result.ok) {
    toast.success(adminT(lang, result.message))
    return true
  }
  toast.error(adminT(lang, result.message))
  if (setError && result.fieldErrors) {
    for (const [name, message] of Object.entries(result.fieldErrors)) {
      setError(name as Path<T>, { type: 'server', message })
    }
  }
  return false
}
