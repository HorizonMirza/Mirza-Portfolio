'use client'

import { Archive, Inbox, MailCheck, MailOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { Button } from '@/components/ui/button'

import { deleteMessage, setMessageStatus } from '@backend/features/messages/actions'
import type { MessageStatusValue } from '@backend/features/messages/schema'

export function MessageActions({ id, status }: { id: string; status: MessageStatusValue }) {
  const router = useRouter()
  const t = useAdminT()
  const [pending, startTransition] = useTransition()
  const autoMarked = useRef(false)

  // Pesan baru otomatis ditandai dibaca saat dibuka.
  useEffect(() => {
    if (status !== 'NEW' || autoMarked.current) return
    autoMarked.current = true
    void setMessageStatus(id, 'READ')
  }, [id, status])

  // tombol yang sedang menunggu server menampilkan spinner
  const [busy, setBusy] = useState<MessageStatusValue | null>(null)
  function change(next: MessageStatusValue) {
    setBusy(next)
    startTransition(async () => {
      applyResult(await setMessageStatus(id, next))
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'ARCHIVED' ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => change('READ')}
          disabled={pending}
          loading={pending && busy === 'READ'}
        >
          <Inbox aria-hidden="true" />
          {t('Keluarkan dari Arsip')}
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => change('ARCHIVED')}
          disabled={pending}
          loading={pending && busy === 'ARCHIVED'}
        >
          <Archive aria-hidden="true" />
          {t('Arsipkan')}
        </Button>
      )}
      {status === 'READ' ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => change('NEW')}
          disabled={pending}
          loading={pending && busy === 'NEW'}
        >
          <MailOpen aria-hidden="true" />
          {t('Tandai Belum Dibaca')}
        </Button>
      ) : status === 'NEW' ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => change('READ')}
          disabled={pending}
          loading={pending && busy === 'READ'}
        >
          <MailCheck aria-hidden="true" />
          {t('Tandai Dibaca')}
        </Button>
      ) : null}
      <ConfirmDelete
        title="Hapus Pesan"
        itemLabel={t('pesan ini')}
        onConfirm={() => deleteMessage(id)}
        onDone={() => router.replace('/admin/messages')}
      />
    </div>
  )
}

// Tombol hapus di ujung baris daftar pesan (di samping tanggal dan jam), dengan dialog konfirmasi.
export function DeleteMessageButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  return (
    <ConfirmDelete
      title="Hapus Pesan"
      iconOnly
      itemLabel={name}
      onConfirm={() => deleteMessage(id)}
      onDone={() => router.refresh()}
    />
  )
}
