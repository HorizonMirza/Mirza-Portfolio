import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { SiteTextForm } from '@/features/site-text/components/site-text-form'
import { getDefaultTexts, getTextsForEdit } from '@/features/site-text/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Teks situs' }

export default async function SiteTextsPage() {
  await requireSuperAdminPage()
  const [initialValues, defaults] = await Promise.all([getTextsForEdit(), getDefaultTexts()])
  return (
    <>
      <PageHeader
        eyebrow="Konten"
        title="Teks situs"
        description="Ubah judul bagian, teks halaman, SEO, dan kebijakan privasi dalam dua bahasa. Isian kosong memakai teks bawaan yang terlihat sebagai placeholder."
      />
      <SiteTextForm initialValues={initialValues.values} defaults={defaults} />
    </>
  )
}
