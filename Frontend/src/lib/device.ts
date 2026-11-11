// Nama browser dan sistem dari user-agent, tanpa menyimpan string lengkapnya di tampilan. null = tidak
// dikenal. Dipakai email login (Indonesia) dan Admin → Akun (ikut bahasa admin).
export type DeviceParts = { browser: string | null; os: string | null; mobile: boolean }

export function deviceParts(userAgent: string | null | undefined): DeviceParts {
  const ua = userAgent ?? ''
  const browser = /edg\//i.test(ua)
    ? 'Edge'
    : /chrome\/|crios\//i.test(ua)
      ? 'Chrome'
      : /firefox\/|fxios\//i.test(ua)
        ? 'Firefox'
        : /safari\//i.test(ua)
          ? 'Safari'
          : null
  const os = /android/i.test(ua)
    ? 'Android'
    : /iphone|ipad/i.test(ua)
      ? 'iOS'
      : /windows/i.test(ua)
        ? 'Windows'
        : /mac os/i.test(ua)
          ? 'macOS'
          : /linux/i.test(ua)
            ? 'Linux'
            : null
  return { browser, os, mobile: /mobile|android|iphone/i.test(ua) }
}
