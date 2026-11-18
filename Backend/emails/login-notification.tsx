import { emailColors, EmailLayout } from './layout'

// Notifikasi login baru ke pemilik (bahasa Indonesia). Tanpa IP: hanya waktu dan perangkat.
export function LoginNotificationEmail({
  when,
  device,
  accountUrl,
}: {
  when: string
  device: string
  accountUrl: string
}) {
  return (
    <EmailLayout lang="id" preview="Ada login baru ke panel admin">
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>Login baru ke panel admin</p>
      <p style={{ margin: '0 0 4px' }}>
        <strong>Waktu:</strong> {when}
      </p>
      <p style={{ margin: '0 0 20px' }}>
        <strong>Perangkat:</strong> {device}
      </p>
      <p style={{ margin: 0, fontSize: 14, color: emailColors.muted }}>
        Bila ini bukan Anda, segera ganti password di <a href={accountUrl}>halaman Akun</a>.
        Mengganti password mengeluarkan semua sesi lain.
      </p>
    </EmailLayout>
  )
}
