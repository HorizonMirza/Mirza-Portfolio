import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { PageHeader } from '@/components/admin/page-header'
import { HighlightForm } from '@/features/highlights/components/highlight-form'
import { getHighlightForEdit } from '@/features/highlights/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Ubah angka' }

export default async function EditHighlightPage({ params }: PageProps<'/admin/highlights/[id]'>) {
  await requireSuperAdminPage()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const highlight = await getHighlightForEdit(id)
  if (!highlight) notFound()
  return (
    <>
      <PageHeader
        eyebrow="Angka"
        title={`${new Intl.NumberFormat('id-ID').format(highlight.value)}${highlight.suffix ?? ''}`}
        description={highlight.label_id}
      />
      <HighlightForm key={id} highlightId={id} defaultValues={highlight} />
    </>
  )
}
