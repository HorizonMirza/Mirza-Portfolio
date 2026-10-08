import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { HighlightForm } from '@/features/highlights/components/highlight-form'
import { emptyHighlight } from '@/features/highlights/schema'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Tambah angka' }

export default async function NewHighlightPage() {
  await requireSuperAdminPage()
  return (
    <>
      <PageHeader eyebrow="Angka" title="Tambah angka" />
      <HighlightForm highlightId={null} defaultValues={emptyHighlight} />
    </>
  )
}
