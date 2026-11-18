'use client'

import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Spinner } from '@/components/ui/spinner'
import { useAdminT } from '@/components/admin/admin-lang'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ActionResult } from '@backend/lib/action-result'

export function ConfirmDelete({
  itemLabel,
  title = 'Hapus Data',
  onConfirm,
  onDone,
  iconOnly = false,
}: {
  // nama butir untuk tombol (pembaca layar); judul dialog sengaja umum, tanpa nama butir
  itemLabel: string
  // judul dialog, mis. "Hapus Kategori" (revisi pemilik 2026-11-16: tidak perlu detail)
  title?: string
  onConfirm: () => Promise<ActionResult<unknown>>
  onDone?: () => void
  // hanya ikon tong sampah kecil (kartu dan gambar di pratinjau), tanpa tulisan "Hapus"
  iconOnly?: boolean
}) {
  const t = useAdminT()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function confirm() {
    startTransition(async () => {
      const result = await onConfirm()
      if (result.ok) {
        toast.success(t(result.message))
        setOpen(false)
        onDone?.()
      } else {
        toast.error(t(result.message))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('Hapus {item}', { item: itemLabel })}
          className={iconOnly ? 'size-8 min-h-8 px-0 text-muted hover:text-danger' : undefined}
        >
          <Trash2 aria-hidden="true" />
          <span className={iconOnly ? 'sr-only' : 'sr-only md:not-sr-only'}>{t('Hapus')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t(title)}</DialogTitle>
        <DialogDescription>
          {t(
            'Setelah dihapus, data ini beserta berkas yang terkait tidak bisa dikembalikan lagi. Penghapusan ini tercatat di log audit.',
          )}
        </DialogDescription>
        {/* satu baris penuh seperti Simpan; menutup lewat tombol x di pojok */}
        <button
          type="button"
          onClick={confirm}
          disabled={pending}
          aria-busy={pending || undefined}
          className="mt-6 min-h-11 w-full rounded-md bg-danger text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 dark:text-bg"
        >
          <span className="inline-flex items-center justify-center gap-2">
            {pending ? <Spinner /> : null}
            {pending ? t('Menghapus…') : t('Hapus')}
          </span>
        </button>
      </DialogContent>
    </Dialog>
  )
}
