import { ArrowLeft, Reply } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MessageActions } from '@/features/messages/components/message-actions'
import { getMessage } from '@/features/messages/queries'
import { messageStatusLabel } from '@/features/messages/schema'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatDateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Pesan' }

export default async function MessagePage({ params }: PageProps<'/admin/messages/[id]'>) {
  await requireSuperAdminPage()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const message = await getMessage(id)
  if (!message) notFound()
  const subject = message.subject ?? 'Pesan dari portofolio'
  const mailto = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${subject}`)}`

  return (
    <>
      <Link
        href="/admin/messages"
        className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke kotak masuk
      </Link>
      <PageHeader
        title={subject}
        description={`${messageStatusLabel[message.status]} · ${formatDateTime(message.createdAt)}${message.locale ? ` · halaman ${message.locale.toUpperCase()}` : ''}`}
      />
      <Card className="flex flex-col gap-4">
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-muted">Dari</dt>
          <dd className="font-medium">{message.name}</dd>
          <dt className="text-muted">Email</dt>
          <dd className="break-all">{message.email}</dd>
        </dl>
        {/* Teks biasa: tidak ada HTML dari pengunjung yang dirender. */}
        <p className="border-t border-border pt-4 leading-relaxed break-words whitespace-pre-wrap">
          {message.body}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button asChild>
            <a href={mailto}>
              <Reply aria-hidden="true" />
              Balas lewat email
            </a>
          </Button>
          <MessageActions id={message.id} status={message.status} />
        </div>
      </Card>
    </>
  )
}
