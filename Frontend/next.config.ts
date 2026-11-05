import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

import { buildCsp, SECURITY_HEADERS } from './src/lib/csp'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Optimasi gambar hanya untuk akun Cloudinary milik situs ini (bukan semua res.cloudinary.com).
const cloudName = process.env.CLOUDINARY_CLOUD_NAME

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Hanya untuk image Docker (Frontend/Dockerfile): server mandiri berisi dependency yang terpakai saja.
  // Vercel dan CI tidak memasangnya, jadi build mereka tidak berubah.
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
  images: {
    remotePatterns: cloudName
      ? [{ protocol: 'https', hostname: 'res.cloudinary.com', pathname: `/${cloudName}/**` }]
      : [],
  },
  experimental: {
    // 404 global untuk URL yang tidak cocok rute mana pun (app/global-not-found.tsx). URL ber-titik yang
    // tertangkap [locale] dialihkan lewat rewrite afterFiles di bawah.
    globalNotFound: true,
  },
  // Halaman Skill digabung ke beranda (keputusan pemilik 2026-10-01); tautan lama diarahkan ke sana.
  async redirects() {
    return [{ source: '/:locale(id|en)/skills', destination: '/:locale#skills', permanent: true }]
  },
  // URL tak dikenal yang mengandung titik (mis. /x.txt, /wp-login.php, /a/b.php) dilewati proxy
  // (matcher-nya mengecualikan berkas), lalu tertangkap [locale] dengan locale tidak sah sehingga
  // tampil 404 bawaan Next berbahasa Inggris. Rewrite afterFiles diperiksa SETELAH berkas public/,
  // _next/static, dan halaman non-dinamis (robots.txt, sitemap.xml, favicon.ico), tetapi SEBELUM rute
  // dinamis, jadi hanya URL yang memang tidak ada yang diarahkan ke 404 situs bahasa Indonesia; URL di
  // browser tidak berubah dan statusnya tetap 404 (audit 2026-11-05, 404 global).
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/:path((?!(?:id|en|admin|api|_next|_vercel)(?:/|$)).*\\..*)',
          destination: '/id/halaman-tidak-ditemukan',
        },
      ],
      fallback: [],
    }
  },
  async headers() {
    const dev = process.env.NODE_ENV !== 'production'
    const preview = process.env.VERCEL_ENV === 'preview'
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      // CSP tanpa nonce untuk semua kecuali /admin (admin diberi CSP ber-nonce oleh src/proxy.ts)
      {
        source: '/((?!admin).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: buildCsp({ dev, preview, upgrade: process.env.VERCEL === '1' }),
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
