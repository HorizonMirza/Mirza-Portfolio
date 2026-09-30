import { Badge } from '@/components/ui/badge'

export function StatusBadge({ status }: { status: 'DRAFT' | 'PUBLISHED' }) {
  return status === 'PUBLISHED' ? <Badge tone="success">Terbit</Badge> : <Badge>Draf</Badge>
}
