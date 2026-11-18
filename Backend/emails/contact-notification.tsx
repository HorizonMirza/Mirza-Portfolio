import { emailColors, EmailLayout } from './layout'

// Notifikasi untuk pemilik (bahasa Indonesia). Teks pengunjung dirender sebagai teks biasa oleh React.
export function ContactNotificationEmail({
  name,
  email,
  subject,
  body,
  locale,
  adminUrl,
}: {
  name: string
  email: string
  subject: string | null
  body: string
  locale: string
  adminUrl: string
}) {
  return (
    <EmailLayout lang="id" preview={`Pesan baru dari ${name}`}>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>
        Pesan baru dari formulir kontak
      </p>
      <p style={{ margin: '0 0 4px' }}>
        <strong>Dari:</strong> {name} ({email})
      </p>
      {subject ? (
        <p style={{ margin: '0 0 4px' }}>
          <strong>Subjek:</strong> {subject}
        </p>
      ) : null}
      <p style={{ margin: '0 0 16px', color: emailColors.muted, fontSize: 14 }}>
        Halaman: {locale.toUpperCase()}
      </p>
      <p
        style={{
          margin: '0 0 24px',
          whiteSpace: 'pre-wrap',
          borderTop: `1px solid ${emailColors.border}`,
          paddingTop: 16,
        }}
      >
        {body}
      </p>
      <p style={{ margin: 0, fontSize: 14 }}>
        Balas langsung email ini, atau buka <a href={adminUrl}>kotak masuk admin</a>.
      </p>
    </EmailLayout>
  )
}
