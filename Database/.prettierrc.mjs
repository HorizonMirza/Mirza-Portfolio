// Aturan Prettier sama dengan Frontend (satu sumber: Frontend/.prettierrc.json), tanpa plugin
// Tailwind karena folder ini tidak berisi kelas CSS. Dijalankan dari Frontend/: pnpm format /
// pnpm format:check memeriksa Database/seed juga (schema.prisma dan migrasi SQL tidak diformat Prettier).
import config from '../Frontend/.prettierrc.json' with { type: 'json' }

const databaseConfig = Object.fromEntries(
  Object.entries(config).filter(([key]) => key !== 'plugins' && !key.startsWith('tailwind')),
)
export default databaseConfig
