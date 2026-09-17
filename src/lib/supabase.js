import { createClient } from '@supabase/supabase-js'

// The project URL and public key come from .env.local, which git ignores, so they
// never land in the repository. The build still bakes them into the site's
// JavaScript — that's how Supabase works; the database rules protect the data.
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
