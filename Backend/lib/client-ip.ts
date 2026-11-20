// IP pengunjung dari header proxy. Hanya dipakai untuk di-hash (rate limit, pengunjung unik harian),
// tidak pernah disimpan mentah (hanya server).

import 'server-only'

import { isIP } from 'node:net'

// Entri paling kiri x-forwarded-for bisa diisi bebas oleh klien, jadi yang dipercaya:
// - TRUSTED_PROXIES diisi (IP atau CIDR IPv4, dipisah koma; sama dengan yang dipakai Better Auth):
//   rantai dibaca dari kanan, melewati proxy tepercaya, IP pertama yang bukan proxy = klien.
// - Di Vercel (VERCEL terisi): Vercel menimpa x-forwarded-for dengan IP klien, entri pertama aman.
// - Di luar Vercel tanpa daftar proxy (mis. di balik satu reverse proxy): entri paling
//   kanan, yaitu yang ditambahkan proxy terdekat, bukan entri kiri yang bisa dipalsukan.
type Env = Record<string, string | undefined>

// "10.0.0.1" → bilangan 32-bit tak bertanda.
function ipv4ToInt(ip: string) {
  return ip.split('.').reduce((n, octet) => (n << 8) + Number(octet), 0) >>> 0
}

// IP cocok dengan satu entri TRUSTED_PROXIES: IP persis atau rentang CIDR IPv4.
function matchesProxy(ip: string, entry: string) {
  const [base, bitsRaw] = entry.split('/')
  if (!base) return false
  if (bitsRaw === undefined) return ip === base
  if (isIP(ip) !== 4 || isIP(base) !== 4) return false
  const bits = Number(bitsRaw)
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask)
}

// Daftar proxy tepercaya dari TRUSTED_PROXIES (dipisah koma).
export function trustedProxies(env: Env = process.env): string[] {
  return (env.TRUSTED_PROXIES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// IP klien menurut aturan di atas; 'unknown' bila tidak ada header sama sekali.
export function clientIp(headers: Headers, env: Env = process.env): string {
  const chain = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (chain.length > 0) {
    const proxies = trustedProxies(env)
    if (proxies.length > 0) {
      for (let i = chain.length - 1; i >= 0; i--) {
        const hop = chain[i]!
        if (!proxies.some((p) => matchesProxy(hop, p))) return hop
      }
      return chain[0]!
    }
    if (env.VERCEL) return chain[0]!
    return chain[chain.length - 1]!
  }
  return headers.get('x-real-ip')?.trim() || 'unknown'
}
