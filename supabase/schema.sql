-- ============================================================
-- Click-App MVP tables  (public schema, click_ prefix)
-- Run once in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Projects -------------------------------------------------------
create table if not exists public.click_projects (
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
create table if not exists public.click_project_assets (
  id            text        primary key,
  project_id    text        not null references public.click_projects(id) on delete cascade,
  slot_key      text        not null,
  storage_path  text        not null,
  mime_type     text        not null,
  created_at    timestamptz default now()
);

create index if not exists idx_click_assets_pid on public.click_project_assets(project_id);

-- Generation Batches ---------------------------------------------
create table if not exists public.click_generation_batches (
  id          text   primary key,
  project_id  text   references public.click_projects(id) on delete cascade,
  timestamp   bigint not null,
  model       text   not null,
  category    text   not null
);

create index if not exists idx_click_batches_pid on public.click_generation_batches(project_id);

-- Generated Images (files in Storage bucket "generated-images") --
create table if not exists public.click_generated_images (
  id              text        primary key,
  batch_id        text        not null references public.click_generation_batches(id) on delete cascade,
  status          text        not null default 'pending',
  prompt          text,
  error_message   text,
  generation_time integer,
  storage_path    text,
  created_at      timestamptz default now()
);

create index if not exists idx_click_images_batch on public.click_generated_images(batch_id);

-- Disable RLS for MVP (no auth yet) ------------------------------
alter table public.click_projects           disable row level security;
alter table public.click_project_assets     disable row level security;
alter table public.click_generation_batches disable row level security;
alter table public.click_generated_images   disable row level security;
