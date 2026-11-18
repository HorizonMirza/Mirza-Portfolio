import { getTranslations } from 'next-intl/server'

import { FlowButtonContent, flowButtonClassName } from '@/components/ui/flow-button'
import { StatusPage } from '@/components/ui/status-page'
import { getAdminLang } from '@backend/lib/admin-lang-server'

// 403: masuk dengan akun yang bukan Super Admin (Backend/lib/auth-guard.ts memanggil forbidden()). Teks
// mengikuti bahasa admin (revisi pemilik 2026-11-16, halaman status bersama).
export default async function AdminForbidden() {
  const lang = await getAdminLang()
  const status = await getTranslations({ locale: lang, namespace: 'Status' })
  return (
    <main id="main">
      <StatusPage
        code={403}
        title={status('403.title')}
        body={status('403.body')}
        action={
          // situs publik di luar router admin
          <a href={`/${lang}`} className={flowButtonClassName}>
            <FlowButtonContent text={status('home')} />
          </a>
        }
      />
    </main>
  )
}
