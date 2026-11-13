import { redirect } from 'next/navigation'

// Daftar pendidikan kini bagian dari halaman About (tab Profil dan Pendidikan digabung atas
// permintaan pemilik 2026-11-13, DESIGN.md bagian 146); entri tetap dibuka di /admin/education/[id].
export default function EducationPage() {
  redirect('/admin/profile')
}
