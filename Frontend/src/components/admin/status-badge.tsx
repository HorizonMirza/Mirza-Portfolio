'use client'

import { useAdminT } from '@/components/admin/admin-lang'
import { Badge } from '@/components/ui/badge'

export function StatusBadge({ status }: { status: 'DRAFT' | 'PUBLISHED' }) {
  const t = useAdminT()
  return status === 'PUBLISHED' ? (
    <Badge tone="success">{t('Terbit')}</Badge>
  ) : (
    <Badge>{t('Draf')}</Badge>
  )
}
