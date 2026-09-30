import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Paket server-only melempar galat di luar React Server; di tes unit cukup dikosongkan.
vi.mock('server-only', () => ({}))
