/**
 * Run: node supabase/setup.mjs
 *
 * Requires two env vars:
 *   SUPABASE_URL        – e.g. https://sdkzparmcifhhgedauyt.supabase.co
 *   SUPABASE_SERVICE_KEY – Service role secret key (Settings → API → service_role)
 *
 * Also accepts DB_PASSWORD for full DDL (table creation + storage policies via pg):
 *   DB_PASSWORD=xxx node supabase/setup.mjs
 *
 * With only the service key the script creates/updates storage buckets; with
 * DB_PASSWORD it applies the full schema.sql as well.
 */

import { readFileSync } from 'fs';
import { URL } from 'url';

const SUPABASE_URL     = process.env.SUPABASE_URL      || 'https://sdkzparmcifhhgedauyt.supabase.co';
const SERVICE_KEY      = process.env.SUPABASE_SERVICE_KEY;
const DB_PASSWORD      = process.env.DB_PASSWORD;
const PROJECT_REF      = 'sdkzparmcifhhgedauyt';

if (!SERVICE_KEY && !DB_PASSWORD) {
  console.error('❌  Provide at least one of:\n  SUPABASE_SERVICE_KEY  (bucket setup)\n  DB_PASSWORD           (full schema + storage policies via pg)');
  process.exit(1);
}

// ── 1. Storage buckets via Supabase JS client (service key) ──────────────────

if (SERVICE_KEY) {
  console.log('🪣  Setting up storage buckets via service key…');

  const { createClient } = await import('@supabase/supabase-js').catch(() => {
    console.error('❌  Run: npm install @supabase/supabase-js'); process.exit(1);
  });
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const buckets = [
    { id: 'project-assets',   name: 'project-assets',   isPublic: true,  fileSizeLimit: 52428800, allowedMimeTypes: ['image/jpeg','image/png','image/webp','image/gif'] },
    { id: 'generated-images', name: 'generated-images', isPublic: false, fileSizeLimit: 52428800, allowedMimeTypes: ['image/jpeg','image/png','image/webp'] },
  ];

  for (const { id, name, isPublic, fileSizeLimit, allowedMimeTypes } of buckets) {
    const { data: existing } = await supabase.storage.getBucket(id);
    if (existing) {
      const { error } = await supabase.storage.updateBucket(id, { public: isPublic, fileSizeLimit, allowedMimeTypes });
      if (error) console.warn(`  ⚠️  Could not update bucket "${id}":`, error.message);
      else       console.log(`  ✅  Bucket "${id}" updated`);
    } else {
      const { error } = await supabase.storage.createBucket(id, { public: isPublic, fileSizeLimit, allowedMimeTypes });
      if (error) console.warn(`  ⚠️  Could not create bucket "${id}":`, error.message);
      else       console.log(`  ✅  Bucket "${id}" created`);
    }
  }

  console.log('\n📋  Storage buckets ready.');
  console.log('    NOTE: Storage RLS policies (allowing anon uploads) require DB access.');
  console.log('    Provide DB_PASSWORD to apply policies, or paste schema.sql into Supabase SQL Editor.\n');
}

// ── 2. Full schema (tables + storage policies) via pg ────────────────────────

if (DB_PASSWORD) {
  console.log('🗄️   Applying full schema via direct Postgres connection…');

  const { default: pg } = await import('pg').catch(() => {
    console.error('❌  Run: npm install pg'); process.exit(1);
  });
  const { Client } = pg;

  const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf-8');
  const connectionString = `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('  ✅  Connected to Postgres');
    await client.query(sql);
    console.log('  ✅  Schema applied (tables + storage policies)');
  } catch (err) {
    console.error('  ❌  Error applying schema:', err.message);
  } finally {
    await client.end();
  }
}

console.log('🎉  Done!');
