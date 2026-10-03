// Pemeriksaan email di form login sebelum bertanya ke server (DESIGN.md bagian 30). Fungsi murni
// agar mudah dites. `domain` adalah domain email Super Admin (mis. "gmail.com"), null bila tidak
// diketahui sehingga hanya format yang diperiksa.
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailIssue(value: string, domain: string | null): string | null {
  const email = value.trim().toLowerCase()
  if (!email) return 'Enter your email.'
  if (!EMAIL_FORMAT.test(email)) {
    return domain ? `Use your @${domain} address.` : 'Enter a valid email address.'
  }
  if (domain && !email.endsWith(`@${domain}`)) return `Use your @${domain} address.`
  return null
}
