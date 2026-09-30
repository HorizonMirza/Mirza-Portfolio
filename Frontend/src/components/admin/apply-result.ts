'use client'

import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'

import type { ActionResult } from '@/lib/action-result'

// Tampilkan hasil Server Action: toast, dan galat dari server dipasang ke field form.
export function applyResult<T extends FieldValues>(
  result: ActionResult<unknown>,
  setError?: UseFormSetError<T>,
): boolean {
  if (result.ok) {
    toast.success(result.message)
    return true
  }
  toast.error(result.message)
  if (setError && result.fieldErrors) {
    for (const [name, message] of Object.entries(result.fieldErrors)) {
      setError(name as Path<T>, { type: 'server', message })
    }
  }
  return false
}
