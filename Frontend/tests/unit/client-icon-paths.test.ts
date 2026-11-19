// Tes unit Backend/features/skills/brand-icons dan src/features/skills/client-icon-paths:
// CLIENT_ICON_PATHS.

import { describe, expect, it } from 'vitest'

import { CLIENT_ICON_PATHS } from '@/features/skills/client-icon-paths'

import { BRAND_ICONS } from '@backend/features/skills/brand-icons'

describe('CLIENT_ICON_PATHS', () => {
  it('sama persis dengan path di BRAND_ICONS', () => {
    for (const [slug, path] of Object.entries(CLIENT_ICON_PATHS)) {
      expect(BRAND_ICONS[slug]?.path, slug).toBe(path)
    }
  })

  it('ikon yang dipakai komponen klien tidak memakai viewBox atau evenOdd khusus', () => {
    for (const slug of Object.keys(CLIENT_ICON_PATHS)) {
      expect(BRAND_ICONS[slug]?.viewBox, slug).toBeUndefined()
      expect(BRAND_ICONS[slug]?.evenOdd, slug).toBeFalsy()
    }
  })
})
