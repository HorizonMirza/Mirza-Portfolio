import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

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
  // Header keamanan lengkap dan CSP ditambahkan di Milestone 4.
}

export default withNextIntl(nextConfig)
