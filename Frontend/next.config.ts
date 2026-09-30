import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // 404 global untuk URL di luar /[locale] (app/global-not-found.tsx)
    globalNotFound: true,
  },
  // Header keamanan lengkap dan CSP ditambahkan di Milestone 4.
}

export default withNextIntl(nextConfig)
