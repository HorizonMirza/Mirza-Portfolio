import 'server-only'

import { createHash, timingSafeEqual } from 'node:crypto'

import { z } from 'zod'

const cloudinaryEnvSchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().regex(/^[a-z0-9_-]+$/i),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
})

export type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string }

// null bila kunci belum diisi: fitur unggah dimatikan dengan pesan yang jelas, bukan error.
export function getCloudinaryConfig(
  source: Record<string, string | undefined> = process.env,
): CloudinaryConfig | null {
  const parsed = cloudinaryEnvSchema.safeParse(source)
  if (!parsed.success) return null
  return {
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
    apiSecret: parsed.data.CLOUDINARY_API_SECRET,
  }
}

// Tanda tangan Cloudinary: parameter diurutkan, digabung "a=1&b=2", ditambah secret, lalu SHA-1.
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const payload = Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] !== undefined)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return createHash('sha1')
    .update(payload + apiSecret)
    .digest('hex')
}

// Respons unggah asli dari Cloudinary membawa signature atas public_id + version.
export function verifyUploadSignature(
  result: { public_id: string; version: number | string; signature: string },
  apiSecret: string,
): boolean {
  const expected = signParams({ public_id: result.public_id, version: result.version }, apiSecret)
  const a = Buffer.from(expected)
  const b = Buffer.from(result.signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Hapus berkas di Cloudinary. Gagal tidak menggagalkan aksi admin, cukup dicatat tanpa detail.
// Gambar bawaan repo (public/images/projects, publicId `local-demo/...`) tidak ada di Cloudinary,
// jadi tidak pernah dikirim.
export const LOCAL_DEMO_PUBLIC_ID_PREFIX = 'local-demo/'

export async function destroyRemoteAsset(publicId: string, resourceType: 'image' | 'raw') {
  if (publicId.startsWith(LOCAL_DEMO_PUBLIC_ID_PREFIX)) return
  const config = getCloudinaryConfig()
  if (!config) return
  const timestamp = Math.floor(Date.now() / 1000)
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: config.apiKey,
    signature: signParams({ public_id: publicId, timestamp }, config.apiSecret),
  })
  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/destroy`,
      {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!res.ok) console.warn('[cloudinary] destroy status', res.status)
  } catch {
    console.warn('[cloudinary] destroy gagal')
  }
}

export type RemoteResource = { publicId: string; createdAt: string; resourceType: 'image' | 'raw' }

// Daftar berkas di Cloudinary dengan awalan tertentu (Admin API, Basic auth key:secret), paling
// banyak `maxPages` x 500 berkas. Dipakai pembersih berkas yatim di cron harian. Gagal = daftar
// kosong, sehingga pembersih tidak pernah menghapus apa pun saat API bermasalah.
export async function listRemoteResources(
  prefix: string,
  resourceType: 'image' | 'raw',
  maxPages = 4,
): Promise<RemoteResource[]> {
  const config = getCloudinaryConfig()
  if (!config) return []
  const auth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')
  const out: RemoteResource[] = []
  let cursor: string | undefined
  try {
    for (let page = 0; page < maxPages; page++) {
      const query = new URLSearchParams({ type: 'upload', prefix, max_results: '500' })
      if (cursor) query.set('next_cursor', cursor)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/resources/${resourceType}?${query}`,
        { headers: { authorization: `Basic ${auth}` }, signal: AbortSignal.timeout(8000) },
      )
      if (!res.ok) {
        console.warn('[cloudinary] list status', res.status)
        return []
      }
      const body = (await res.json()) as {
        resources?: { public_id?: unknown; created_at?: unknown }[]
        next_cursor?: unknown
      }
      for (const r of body.resources ?? []) {
        if (typeof r.public_id === 'string' && typeof r.created_at === 'string')
          out.push({ publicId: r.public_id, createdAt: r.created_at, resourceType })
      }
      if (typeof body.next_cursor !== 'string') break
      cursor = body.next_cursor
    }
  } catch {
    console.warn('[cloudinary] list gagal')
    return []
  }
  return out
}
