import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { FlowButtonContent, flowButtonClassName } from '@/components/ui/flow-button'
import { StatusPage } from '@/components/ui/status-page'
import { getAdminLang } from '@/lib/admin-lang-server'

// 401: ada cookie sesi tetapi sesinya tidak sah atau sudah berakhir (lib/auth-guard.ts memanggil
// unauthorized()). Tanpa cookie sama sekali, proxy langsung mengarahkan ke login. Teks mengikuti
// bahasa admin (revisi pemilik 2026-11-16, halaman status bersama).
export default async function AdminUnauthorized() {
  const status = await getTranslations({ locale: await getAdminLang(), namespace: 'Status' })
  return (
    <main id="main">
      <StatusPage
        code={401}
        title={status('401.title')}
        body={status('401.body')}
        action={
          <Link href="/admin/login" className={flowButtonClassName}>
            <FlowButtonContent text={status('login')} />
          </Link>
        }
      />
    </main>
  )
}
