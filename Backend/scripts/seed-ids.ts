import { createHash } from 'node:crypto'

// Namespace tetap untuk seed portofolio. Jangan diubah: mengubahnya membuat seed membuat
// baris baru alih-alih memperbarui baris yang sudah ada.
const SEED_NAMESPACE = '6f1c2a4e-8d3b-4c5a-9e7f-1a2b3c4d5e6f'

// UUID v5 (RFC 9562): selalu sama untuk kunci yang sama, sehingga seed tetap idempoten
// walaupun primary key bertipe UUID.
export function seedId(key: string): string {
  const namespace = Buffer.from(SEED_NAMESPACE.replaceAll('-', ''), 'hex')
  const hash = createHash('sha1').update(namespace).update(key, 'utf8').digest()
  const bytes = hash.subarray(0, 16)
  bytes[6] = (bytes[6]! & 0x0f) | 0x50
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
