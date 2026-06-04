/**
 * Run: node supabase/setup.mjs
 * Connects directly to Supabase Postgres and applies the schema.
 *
 * Get your DB password from:
 *   Supabase Dashboard → Project Settings → Database → Database password
 *
 * Then set it as an env var:
 *   DB_PASSWORD=your_password node supabase/setup.mjs
 */

import { readFileSync } from 'fs';
import { createConnection } from 'net';
import { URL } from 'url';

const password = process.env.DB_PASSWORD;
if (!password) {
  console.error('❌  Set DB_PASSWORD env var. Get it from Supabase Dashboard → Settings → Database.');
  process.exit(1);
}

// Supabase direct connection (not pooler — needed for DDL)
const connectionString =
  `postgresql://postgres.sdkzparmcifhhgedauyt:${password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;

// Dynamically import pg (avoids ESM issues)
const { default: pg } = await import('pg').catch(() => {
  console.error('❌  Run: npm install pg');
  process.exit(1);
});
const { Client } = pg;

const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf-8');

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log('✅  Connected to Supabase Postgres');
  await client.query(sql);
  console.log('✅  Schema applied successfully');
  console.log('\n🎉  Done! Storage buckets (project-assets, generated-images) were already created.');
} catch (err) {
  console.error('❌  Error applying schema:', err.message);
} finally {
  await client.end();
}
