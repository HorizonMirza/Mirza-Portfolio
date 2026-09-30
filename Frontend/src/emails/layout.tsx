import type { ReactNode } from 'react'

// Kerangka email sederhana: tabel + gaya inline agar tampil sama di klien email umum.
const colors = {
  text: '#0b1220',
  muted: '#475569',
  primary: '#1d4fd7',
  border: '#cbd5e1',
  bg: '#f6f9fc',
}

export function EmailLayout({
  lang,
  preview,
  children,
}: {
  lang: string
  preview: string
  children: ReactNode
}) {
  return (
    <html lang={lang}>
      {/* eslint-disable-next-line @next/next/no-head-element -- ini dokumen email, bukan halaman Next */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          backgroundColor: colors.bg,
          fontFamily: 'Helvetica, Arial, sans-serif',
          color: colors.text,
        }}
      >
        <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>{preview}</div>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ padding: '32px 16px' }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    maxWidth: 560,
                    backgroundColor: '#ffffff',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: 28, fontSize: 16, lineHeight: '1.6' }}>
                        <p
                          style={{
                            margin: '0 0 20px',
                            fontFamily: 'monospace',
                            fontSize: 12,
                            letterSpacing: 2,
                            color: colors.muted,
                          }}
                        >
                          MUHAMMAD MIRZA
                        </p>
                        {children}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        backgroundColor: colors.primary,
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: 10,
        textDecoration: 'none',
        fontWeight: 600,
      }}
    >
      {children}
    </a>
  )
}

export const emailColors = colors
