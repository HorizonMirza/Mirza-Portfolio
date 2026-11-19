'use client'

// Laci samping (Sheet) di atas Radix Dialog, dipakai menu admin di layar sempit.

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

// Panel geser dari samping (menu admin di HP). Dibangun di atas Radix Dialog. Masuk dan keluar dengan
// animasi CSS halus (.sheet-panel/.sheet-overlay di styles/admin/panel.css); Radix
// menunggu animasi keluar selesai sebelum melepas panel.
export const Sheet = DialogPrimitive.Root
export const SheetTitle = DialogPrimitive.Title

export function SheetContent({
  className,
  children,
  closeLabel,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { closeLabel: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        className={cn(
          'sheet-panel fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface p-4 shadow-lg',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">{closeLabel}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
