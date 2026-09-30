import { describe, expect, it } from 'vitest'

import { seedId } from '../../scripts/seed-ids'

const UUID_V5 = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('seedId', () => {
  it('menghasilkan UUID v5 yang valid', () => {
    expect(seedId('experience:pgas-solution')).toMatch(UUID_V5)
  })

  it('selalu sama untuk kunci yang sama (seed idempoten)', () => {
    expect(seedId('skill-category:languages')).toBe(seedId('skill-category:languages'))
  })

  it('berbeda untuk kunci yang berbeda', () => {
    expect(seedId('experience:a')).not.toBe(seedId('experience:b'))
  })
})
