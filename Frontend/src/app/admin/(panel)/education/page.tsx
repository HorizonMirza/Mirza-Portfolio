// Pendidikan diubah langsung di halaman About; alamat ini hanya diarahkan ke sana.

import { redirect } from 'next/navigation'

export default function EducationPage() {
  redirect('/admin/profile')
}
