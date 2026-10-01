import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

import { buildCsp, SECURITY_HEADERS } from './src/lib/csp'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Optimasi gambar hanya untuk akun Cloudinary milik situs ini (bukan semua res.cloudinary.com).
const cloudName = process.env.CLOUDINARY_CLOUD_NAME

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: cloudName
      ? [{ protocol: 'https', hostname: 'res.cloudinary.com', pathname: `/${cloudName}/**` }]
      : [],
  },
  experimental: {
    // 404 global untuk URL di luar /[locale] (app/global-not-found.tsx)
    globalNotFound: true,
  },
  // Halaman Skill digabung ke beranda (keputusan pemilik 2026-10-01); tautan lama diarahkan ke sana.
  async redirects() {
    return [{ source: '/:locale(id|en)/skills', destination: '/:locale#skills', permanent: true }]
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
