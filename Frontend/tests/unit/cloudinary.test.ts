import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { getCloudinaryConfig, signParams, verifyUploadSignature } from '@/lib/cloudinary'

describe('signParams', () => {
  // Contoh resmi dari dokumentasi Cloudinary "Generating authentication signatures".
  it('cocok dengan contoh dokumentasi Cloudinary', () => {
    const signature = signParams(
      {
        eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop',
        public_id: 'sample_image',
        timestamp: 1315060510,
      },
      'abcd',
    )
    expect(signature).toBe('bfd09f95f331f558cbd1320e67aa8d488770583e')
  })
  it('urutan parameter tidak berpengaruh', () => {
    expect(signParams({ b: 2, a: 1 }, 's')).toBe(signParams({ a: 1, b: 2 }, 's'))
  })
})

describe('verifyUploadSignature', () => {
  const secret = 'rahasia-tes'
  const signed = (public_id: string, version: number) => ({
    public_id,
    version,
    signature: createHash('sha1')
      .update(`public_id=${public_id}&version=${version}${secret}`)
      .digest('hex'),
  })
  it('menerima respons asli', () => {
    expect(verifyUploadSignature(signed('portfolio/profile/a', 1), secret)).toBe(true)
  })
  it('menolak respons yang diubah', () => {
    const r = signed('portfolio/profile/a', 1)
    expect(verifyUploadSignature({ ...r, public_id: 'portfolio/profile/b' }, secret)).toBe(false)
    expect(verifyUploadSignature({ ...r, signature: '0'.repeat(40) }, secret)).toBe(false)
    expect(verifyUploadSignature(r, 'secret-lain')).toBe(false)
  })
})

describe('getCloudinaryConfig', () => {
  it('null bila kunci belum lengkap (fitur unggah dimatikan)', () => {
    expect(getCloudinaryConfig({})).toBeNull()
    expect(getCloudinaryConfig({ CLOUDINARY_CLOUD_NAME: 'x', CLOUDINARY_API_KEY: '1' })).toBeNull()
  })
  it('terbaca bila lengkap', () => {
    expect(
      getCloudinaryConfig({
        CLOUDINARY_CLOUD_NAME: 'mirza',
        CLOUDINARY_API_KEY: '1',
        CLOUDINARY_API_SECRET: 's',
      }),
    ).toEqual({ cloudName: 'mirza', apiKey: '1', apiSecret: 's' })
  })
  it('menolak nama cloud yang aneh', () => {
    expect(
      getCloudinaryConfig({
        CLOUDINARY_CLOUD_NAME: 'a/b',
        CLOUDINARY_API_KEY: '1',
        CLOUDINARY_API_SECRET: 's',
      }),
    ).toBeNull()
  })
})
