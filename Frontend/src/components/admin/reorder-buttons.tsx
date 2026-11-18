'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { Button } from '@/components/ui/button'
import type { ActionResult } from '@backend/lib/action-result'
import type { MoveDirection } from '@backend/lib/reorder'

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
  const t = useAdminT()
  const [pending, startTransition] = useTransition()
  // arah yang sedang dikirim: panahnya berganti spinner
  const [moving, setMoving] = useState<MoveDirection | null>(null)

  function move(direction: MoveDirection) {
    setMoving(direction)
    startTransition(async () => {
      const result = await onMove(direction)
      if (!result.ok) toast.error(t(result.message))
    })
  }

  return (
    <div className="inline-flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="px-2"
        aria-label={t('Naikkan {item}', { item: itemLabel })}
        disabled={isFirst || pending}
        loading={pending && moving === 'up'}
        onClick={() => move('up')}
      >
        <ChevronUp aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="px-2"
        aria-label={t('Turunkan {item}', { item: itemLabel })}
        disabled={isLast || pending}
        loading={pending && moving === 'down'}
        onClick={() => move('down')}
      >
        <ChevronDown aria-hidden="true" />
      </Button>
    </div>
  )
}
