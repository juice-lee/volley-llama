import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Without these the app still builds but can't reach its data, so stop early.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']) {
    if (!env[name]) throw new Error(`${name} is missing. Copy .env.example to .env.local and fill it in.`)
  }
  return { plugins: [react()] }
})
