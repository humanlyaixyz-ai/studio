import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL  as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  console.error('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
}

// All tables live in the "mvp" schema
export const supabase = createClient(url, key, {
  db: { schema: 'mvp' },
});
