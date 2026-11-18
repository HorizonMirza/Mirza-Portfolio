// Aturan Prettier sama dengan Frontend (satu sumber: Frontend/.prettierrc.json). Dijalankan dari
// Frontend/: pnpm format / pnpm format:check memeriksa folder ini juga.
import config from '../Frontend/.prettierrc.json' with { type: 'json' }

const backendConfig = { ...config, tailwindStylesheet: '../Frontend/src/app/globals.css' }

export default backendConfig
