import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { HighlightTable } from '@/features/highlights/components/highlight-table'
import { listHighlightsAdmin } from '@/features/highlights/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Angka' }

export default async function HighlightsPage() {
  await requireSuperAdminPage()
  const items = await listHighlightsAdmin()
  const nf = new Intl.NumberFormat('id-ID')
  return (
    <>
      <PageHeader
        eyebrow="Konten"
        title="Angka di beranda"
        description="Angka pencapaian yang bisa dibuktikan, seperti di CV. Bagian Dalam angka sedang tidak ditampilkan di beranda (revisi 2026-10-16), jadi angka di sini tersimpan tetapi belum tampil."
        actions={
          <Button asChild>
            <Link href="/admin/highlights/new">
              <Plus aria-hidden="true" />
              Tambah
            </Link>
          </Button>
        }
      />
      <HighlightTable
        rows={items.map((h) => ({
          id: h.id,
          display: nf.format(h.value) + h.suffix,
          label_id: h.label_id,
          source: h.source ?? '',
          order: h.order,
          status: h.status,
        }))}
      />
    </>
  )
}
