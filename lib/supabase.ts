import { createClient } from '@supabase/supabase-js';

const url        = import.meta.env.VITE_SUPABASE_URL         as string;
const key        = import.meta.env.VITE_SUPABASE_ANON_KEY    as string;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string | undefined;

if (!url || !key) {
  console.error('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
}

// All tables live in the "mvp" schema
export const supabase = createClient(url, key, {
  db: { schema: 'mvp' },
});

// Storage client — uses service key to bypass RLS on storage.objects (MVP, no auth yet).
// Falls back to anon key if service key is not configured.
export const supabaseStorage = serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : supabase;
