import { AdminStageSkeleton } from '@/components/admin/page-skeletons'

// Skeleton shimmer sesuai layout halaman ini selama datanya diambil (DESIGN.md bagian 111 dan 169)
export default function Loading() {
  return <AdminStageSkeleton shape="skills" tabs={4} lang />
}
