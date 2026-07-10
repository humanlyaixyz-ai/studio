-- ============================================================
-- Click-App MVP Schema  (mvp schema)
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

create schema if not exists mvp;

grant usage on schema mvp to anon, service_role;
alter default privileges in schema mvp grant all on tables    to anon, service_role;
alter default privileges in schema mvp grant all on sequences to anon, service_role;

-- Projects -------------------------------------------------------
create table if not exists mvp.projects (
  id              text        primary key,
  name            text        not null,
  created_at      bigint      not null,
  category        text        not null,
  model           text        not null,
  brand_name      text        not null default '',
  shots           jsonb       not null default '[]',
  environment     text        default '',
  lighting        text        default '',
  negative_prompt text        default '',
  seed            integer,
  fashion_type    text        default 'Casual',
  mood            text        default 'Standard Studio',
  inserted_at     timestamptz default now()
);

-- Project Assets (files in Storage bucket "project-assets") ------
create table if not exists mvp.project_assets (
  id            text        primary key,
  project_id    text        not null references mvp.projects(id) on delete cascade,
  slot_key      text        not null,
  storage_path  text        not null,
  mime_type     text        not null,
  created_at    timestamptz default now()
);

create index if not exists idx_mvp_assets_pid on mvp.project_assets(project_id);

-- SKUs (must be defined before generation_batches references it) --
create table if not exists mvp.skus (
  id          text        primary key,
  project_id  text        not null references mvp.projects(id) on delete cascade,
  name        text        not null,
  sku_code    text,
  created_at  bigint      not null
);

create index if not exists idx_mvp_skus_pid on mvp.skus(project_id);

-- SKU Assets (one row per slot per SKU) --------------------------
create table if not exists mvp.sku_assets (
  sku_id        text        not null references mvp.skus(id) on delete cascade,
  slot_key      text        not null,
  storage_path  text        not null,
  mime_type     text        not null,
  created_at    timestamptz default now(),
  primary key (sku_id, slot_key)
);

-- Generation Batches ---------------------------------------------
create table if not exists mvp.generation_batches (
  id          text   primary key,
  project_id  text   references mvp.projects(id) on delete cascade,
  sku_id      text   references mvp.skus(id) on delete set null,
  timestamp   bigint not null,
  model       text   not null,
  category    text   not null
);

create index if not exists idx_mvp_batches_pid on mvp.generation_batches(project_id);

-- Generated Images (files in Storage bucket "generated-images") --
create table if not exists mvp.generated_images (
  id              text        primary key,
  batch_id        text        not null references mvp.generation_batches(id) on delete cascade,
  status          text        not null default 'pending',
  prompt          text,
  error_message   text,
  generation_time integer,
  storage_path    text,
  created_at      timestamptz default now()
);

create index if not exists idx_mvp_images_batch on mvp.generated_images(batch_id);

-- Disable RLS for MVP (no auth yet) ------------------------------
alter table mvp.projects           disable row level security;
alter table mvp.project_assets     disable row level security;
alter table mvp.generation_batches disable row level security;
alter table mvp.generated_images   disable row level security;
alter table mvp.skus               disable row level security;
alter table mvp.sku_assets         disable row level security;

-- Explicit grants ------------------------------------------------
grant all on mvp.projects           to anon, service_role;
grant all on mvp.project_assets     to anon, service_role;
grant all on mvp.generation_batches to anon, service_role;
grant all on mvp.generated_images   to anon, service_role;
grant all on mvp.skus               to anon, service_role;
grant all on mvp.sku_assets         to anon, service_role;

-- ============================================================
-- Storage buckets + policies
-- ============================================================

-- Create buckets (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-assets',   'project-assets',   true,  52428800, array['image/jpeg','image/png','image/webp','image/gif']),
  ('generated-images', 'generated-images', false, 52428800, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Storage policies (drop-then-recreate so the script is idempotent)
do $$ begin

  -- project-assets: anon can upload, read, update (upsert), and delete
  drop policy if exists "anon upload to project-assets"  on storage.objects;
  drop policy if exists "anon read from project-assets"  on storage.objects;
  drop policy if exists "anon update in project-assets"  on storage.objects;
  drop policy if exists "anon delete from project-assets" on storage.objects;

  -- generated-images policies
  drop policy if exists "service_role upload to generated-images" on storage.objects;
  drop policy if exists "anon read from generated-images"         on storage.objects;

end $$;

create policy "anon upload to project-assets"
  on storage.objects for insert to anon
  with check (bucket_id = 'project-assets');

create policy "anon read from project-assets"
  on storage.objects for select to anon
  using (bucket_id = 'project-assets');

create policy "anon update in project-assets"
  on storage.objects for update to anon
  using (bucket_id = 'project-assets');

create policy "anon delete from project-assets"
  on storage.objects for delete to anon
  using (bucket_id = 'project-assets');

-- generated-images: service_role only for writes; anon can read
create policy "service_role upload to generated-images"
  on storage.objects for insert to service_role
  with check (bucket_id = 'generated-images');

create policy "anon read from generated-images"
  on storage.objects for select to anon
  using (bucket_id = 'generated-images');
