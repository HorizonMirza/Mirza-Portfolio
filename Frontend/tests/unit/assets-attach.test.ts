// Tes unit Backend/features/assets (attachUploadedAsset): percobaan ulang tidak menghapus berkas.

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Prisma } from '@backend/generated/prisma/client'

// percobaan ulang setelah jawaban hilang tidak boleh menghapus berkas
// yang sudah dicatat oleh permintaan pertama.
const destroyRemoteAsset = vi.fn(async () => undefined)
const findUnique = vi.fn()
const transaction = vi.fn()

vi.mock('@backend/lib/auth-guard', () => ({
  requireSuperAdmin: async () => ({ userId: 'admin-1' }),
  UnauthorizedError: class UnauthorizedError extends Error {},
}))
vi.mock('@backend/lib/cloudinary', () => ({
  destroyRemoteAsset,
  getCloudinaryConfig: () => ({ cloudName: 'demo', apiKey: '1', apiSecret: 's' }),
  signParams: () => 'sig',
  verifyUploadSignature: () => true,
}))
vi.mock('@backend/lib/db', () => ({
  getDb: () => ({ asset: { findUnique }, $transaction: transaction }),
}))
vi.mock('@backend/lib/audit', () => ({ writeAudit: vi.fn(async () => undefined) }))
vi.mock('@backend/lib/order-lock', () => ({ lockOrderScope: vi.fn(async () => undefined) }))
vi.mock('@backend/lib/revalidate', () => ({ revalidateContent: vi.fn() }))

const { attachUploadedAsset } = await import('@backend/features/assets/actions')

const upload = {
  public_id: 'portfolio/skills/uji-ulang',
  version: 1,
  signature: '0'.repeat(40),
  resource_type: 'image',
  secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/portfolio/skills/uji-ulang.webp',
  bytes: 4000,
  format: 'webp',
  width: 144,
  height: 144,
}
const skillId = '01a0f218-0209-7656-a356-02d34f1c52c3'

function duplicatePublicId() {
  return new Prisma.PrismaClientKnownRequestError('dup', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { driverAdapterError: { cause: { constraint: { index: 'Asset_publicId_key' } } } },
  })
}

describe('attachUploadedAsset', () => {
  beforeEach(() => {
    destroyRemoteAsset.mockClear()
    findUnique.mockReset()
    transaction.mockReset()
  })

  it('berkas yang sudah tercatat dijawab sukses dan tidak dihapus', async () => {
    findUnique.mockResolvedValueOnce({ id: 'asset-1' })
    const r = await attachUploadedAsset('skill-logo', skillId, upload, null)
    expect(r).toMatchObject({ ok: true })
    expect(transaction).not.toHaveBeenCalled()
    expect(destroyRemoteAsset).not.toHaveBeenCalled()
  })

  it('balapan dua permintaan: galat public_id kembar tidak menghapus berkas', async () => {
    findUnique.mockResolvedValueOnce(null)
    transaction.mockRejectedValueOnce(duplicatePublicId())
    const r = await attachUploadedAsset('skill-logo', skillId, upload, null)
    expect(r).toMatchObject({ ok: false })
    expect(destroyRemoteAsset).not.toHaveBeenCalled()
  })

  it('gagal mencatat karena sebab lain tetap membersihkan berkas yatim', async () => {
    findUnique.mockResolvedValueOnce(null)
    transaction.mockRejectedValueOnce(new Error('database mati'))
    const r = await attachUploadedAsset('skill-logo', skillId, upload, null)
    expect(r).toMatchObject({ ok: false })
    expect(destroyRemoteAsset).toHaveBeenCalledTimes(1)
    expect(destroyRemoteAsset).toHaveBeenCalledWith('portfolio/skills/uji-ulang', 'image')
  })
})
