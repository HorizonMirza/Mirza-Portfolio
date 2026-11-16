// Panjang minimal password Super Admin, satu sumber untuk Better Auth, form ganti password, seed, dan
// skrip reset password (audit 2026-10-31, EFF-08). Tanpa impor lain agar aman dipakai di klien.
export const MIN_PASSWORD_LENGTH = 12

// Aturan isi password baru (revisi pemilik 2026-11-16): selain panjang, wajib ada huruf besar, huruf
// kecil, angka, dan simbol. Satu sumber untuk form (daftar syarat) dan schema server.
export const PASSWORD_RULES = {
  upper: (value: string) => /\p{Lu}/u.test(value),
  lower: (value: string) => /\p{Ll}/u.test(value),
  digit: (value: string) => /\p{Nd}/u.test(value),
  symbol: (value: string) => /[^\p{L}\p{N}\s]/u.test(value),
}

export function meetsPasswordRules(value: string) {
  return Object.values(PASSWORD_RULES).every((rule) => rule(value))
}
