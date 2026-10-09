import { useTranslations } from 'next-intl'

import { FlowButtonContent, flowButtonClassName } from '@/components/ui/flow-button'
import { NotFound } from '@/components/ui/ghost-404-page'
import { Link } from '@/i18n/navigation'

// 404 di dalam situs (mis. project yang tidak ada): desain "hantu" dari 21st.dev, dua bahasa.
export default function LocaleNotFound() {
  const t = useTranslations('NotFound')

  return (
    <NotFound
      title={t('title')}
      body={t('body')}
      whatIs={t('whatIs')}
      whatIsBody={t('whatIsBody')}
      action={
        <Link href="/" className={flowButtonClassName}>
          <FlowButtonContent text={t('home')} />
        </Link>
      }
    />
  )
}
