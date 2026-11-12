import { AdminTableSkeleton } from '@/components/admin/page-skeletons'

// Skeleton shimmer selama data halaman diambil dari database (DESIGN.md bagian 111)
export default function Loading() {
  return <AdminTableSkeleton tabs={2} columns={5} />
}
