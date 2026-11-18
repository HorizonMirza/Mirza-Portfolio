import { describe, expect, it } from 'vitest'

import { BRAND_ICONS } from '@backend/features/skills/brand-icons'
import { CLIENT_ICON_PATHS } from '@/features/skills/client-icon-paths'

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
