'use client'

import { Archive, Inbox, MailCheck, MailOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useTransition } from 'react'

import { applyResult } from '@/components/admin/apply-result'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { Button } from '@/components/ui/button'

import { deleteMessage, setMessageStatus } from '../actions'
import type { MessageStatusValue } from '../schema'

export function MessageActions({ id, status }: { id: string; status: MessageStatusValue }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const autoMarked = useRef(false)

  // Pesan baru otomatis ditandai dibaca saat dibuka.
  useEffect(() => {
    if (status !== 'NEW' || autoMarked.current) return
    autoMarked.current = true
    void setMessageStatus(id, 'READ')
  }, [id, status])

  function change(next: MessageStatusValue) {
    startTransition(async () => {
      applyResult(await setMessageStatus(id, next))
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'ARCHIVED' ? (
        <Button variant="secondary" size="sm" onClick={() => change('READ')} disabled={pending}>
          <Inbox aria-hidden="true" />
          Keluarkan dari arsip
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => change('ARCHIVED')} disabled={pending}>
          <Archive aria-hidden="true" />
          Arsipkan
        </Button>
      )}
      {status === 'READ' ? (
        <Button variant="ghost" size="sm" onClick={() => change('NEW')} disabled={pending}>
          <MailOpen aria-hidden="true" />
          Tandai belum dibaca
        </Button>
      ) : status === 'NEW' ? (
        <Button variant="ghost" size="sm" onClick={() => change('READ')} disabled={pending}>
          <MailCheck aria-hidden="true" />
          Tandai dibaca
        </Button>
      ) : null}
      <ConfirmDelete
        itemLabel="pesan ini"
        onConfirm={() => deleteMessage(id)}
        onDone={() => router.replace('/admin/messages')}
      />
    </div>
  )
}
