import { globalIgnores } from 'eslint/config'

import frontend from '../Frontend/eslint.config.mjs'

// Aturan sama dengan Frontend (satu sumber). ESLint mencari konfigurasi dari lokasi tiap berkas, jadi
// folder ini butuh berkas konfigurasi sendiri. Dijalankan dari Frontend/: pnpm lint.
const eslintConfig = [...frontend, globalIgnores(['generated/**', 'node_modules/**'])]

export default eslintConfig
