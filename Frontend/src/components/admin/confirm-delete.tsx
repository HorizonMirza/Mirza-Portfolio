'use client'

import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ActionResult } from '@/lib/action-result'

export function ConfirmDelete({
  itemLabel,
  onConfirm,
  onDone,
}: {
  itemLabel: string
  onConfirm: () => Promise<ActionResult<unknown>>
  onDone?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function confirm() {
    startTransition(async () => {
      const result = await onConfirm()
      if (result.ok) {
        toast.success(result.message)
        setOpen(false)
        onDone?.()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Hapus ${itemLabel}`}>
          <Trash2 aria-hidden="true" />
          <span className="sr-only md:not-sr-only">Hapus</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Hapus {itemLabel}?</DialogTitle>
        <DialogDescription>
          Data yang dihapus tidak bisa dikembalikan. Tindakan ini tercatat di log audit.
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary">Batal</Button>
          </DialogClose>
          <Button
            onClick={confirm}
            disabled={pending}
            className="bg-danger text-white hover:bg-danger/90 dark:text-bg"
          >
            {pending ? 'Menghapus…' : 'Hapus'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
