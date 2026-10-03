import { describe, expect, it } from 'vitest'

import { emailIssue } from '@/components/admin/login-validation'

describe('emailIssue', () => {
  it('email kosong diminta diisi', () => {
    expect(emailIssue('  ', 'gmail.com')).toBe('Enter your email.')
  })

  it('domain selain domain admin ditandai', () => {
    expect(emailIssue('mirza@yahoo.com', 'gmail.com')).toBe('Use your @gmail.com address.')
    expect(emailIssue('mirza', 'gmail.com')).toBe('Use your @gmail.com address.')
    expect(emailIssue('mirza@gmail.co', 'gmail.com')).toBe('Use your @gmail.com address.')
  })

  it('domain admin lolos tanpa peduli huruf besar dan spasi', () => {
    expect(emailIssue(' Mirza@Gmail.com ', 'gmail.com')).toBeNull()
  })

  it('tanpa domain admin hanya format yang diperiksa', () => {
    expect(emailIssue('admin@contoh.test', null)).toBeNull()
    expect(emailIssue('bukan email', null)).toBe('Enter a valid email address.')
  })
})
