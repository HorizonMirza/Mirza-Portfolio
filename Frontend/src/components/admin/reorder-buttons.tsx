'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { ActionResult } from '@/lib/action-result'
import type { MoveDirection } from '@/lib/reorder'

// Urutan diubah dengan tombol naik/turun, bukan seret, agar bisa dipakai dengan keyboard dan pembaca layar.
export function ReorderButtons({
  itemLabel,
  isFirst,
  isLast,
  onMove,
}: {
  itemLabel: string
  isFirst: boolean
  isLast: boolean
  onMove: (direction: MoveDirection) => Promise<ActionResult<unknown>>
}) {
  const [pending, startTransition] = useTransition()

  function move(direction: MoveDirection) {
    startTransition(async () => {
      const result = await onMove(direction)
      if (!result.ok) toast.error(result.message)
    })
  }

  return (
    <div className="inline-flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="px-2"
        aria-label={`Naikkan ${itemLabel}`}
        disabled={isFirst || pending}
        onClick={() => move('up')}
      >
        <ChevronUp aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="px-2"
        aria-label={`Turunkan ${itemLabel}`}
        disabled={isLast || pending}
        onClick={() => move('down')}
      >
        <ChevronDown aria-hidden="true" />
      </Button>
    </div>
  )
}
