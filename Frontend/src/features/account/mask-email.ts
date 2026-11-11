// "pu•••••@gmail.com": email disamarkan di layar (layar bisa terlihat orang lain), bisa ditampilkan.
export function maskEmail(email: string) {
  const [name = '', domain = ''] = email.split('@')
  const head = name.slice(0, Math.min(2, name.length))
  return `${head}${'•'.repeat(Math.max(3, name.length - head.length))}@${domain}`
}
