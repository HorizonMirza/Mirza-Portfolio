import 'server-only'

import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

// Kartu Open Graph bergaya "Horizon": latar gelap, grid perspektif, garis horizon biru.
// Memakai font bawaan next/og (font situs berformat woff2 tidak didukung satori).
export function horizonCard({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  const lines = Array.from({ length: 17 }, (_, i) => i)
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0a0f1c',
        color: '#e8eef9',
        padding: '64px 72px 0',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            letterSpacing: 6,
            color: '#a3b0c8',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.08,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              fontSize: 30,
              color: '#a3b0c8',
              maxWidth: 1000,
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      <div
        style={{
          display: 'flex',
          position: 'relative',
          height: 150,
          marginLeft: -72,
          marginRight: -72,
        }}
      >
        <svg
          width="1200"
          height="150"
          viewBox="0 0 1200 150"
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          {lines.map((i) => (
            <line
              key={`v${i}`}
              x1="600"
              y1="0"
              x2={-600 + i * 150}
              y2="150"
              stroke="#38bdf8"
              strokeOpacity="0.28"
            />
          ))}
          {[0.08, 0.22, 0.42, 0.7].map((d) => (
            <line
              key={`h${d}`}
              x1="0"
              y1={150 * d}
              x2="1200"
              y2={150 * d}
              stroke="#38bdf8"
              strokeOpacity="0.22"
            />
          ))}
          <line x1="0" y1="0.5" x2="1200" y2="0.5" stroke="#7ba1ff" strokeWidth="2" />
        </svg>
      </div>
    </div>,
    OG_SIZE,
  )
}
