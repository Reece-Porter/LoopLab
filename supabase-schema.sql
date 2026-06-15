-- ─────────────────────────────────────────────────────────────────────────────
-- LoopLab — Supabase database schema
--
-- HOW TO RUN:
--   1. Open your Supabase project → SQL Editor → New query.
--   2. Paste this whole file in and click "Run".
--   3. Done. The community gallery, publishing and saved arrangements now work.
--
-- This creates one table (`arrangements`) and the Row Level Security (RLS)
-- policies that keep it safe: anyone can READ public arrangements, but users
-- can only create/edit/delete their OWN rows.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.arrangements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'Producer',
  title       text not null,
  description text default '',
  genre_id    text,
  is_public   boolean not null default true,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);

-- Fast lookups for the gallery and a user's own list.
create index if not exists arrangements_public_idx on public.arrangements (is_public, created_at desc);
create index if not exists arrangements_user_idx   on public.arrangements (user_id, created_at desc);

-- Turn on Row Level Security.
alter table public.arrangements enable row level security;

-- READ: anyone (even logged-out) can see public arrangements;
--       signed-in users can additionally see their own private ones.
drop policy if exists "read public or own" on public.arrangements;
create policy "read public or own"
  on public.arrangements for select
  using ( is_public = true or auth.uid() = user_id );

-- INSERT: you can only create rows owned by yourself.
drop policy if exists "insert own" on public.arrangements;
create policy "insert own"
  on public.arrangements for insert
  with check ( auth.uid() = user_id );

-- UPDATE: you can only edit your own rows.
drop policy if exists "update own" on public.arrangements;
create policy "update own"
  on public.arrangements for update
  using ( auth.uid() = user_id );

-- DELETE: you can only delete your own rows.
drop policy if exists "delete own" on public.arrangements;
create policy "delete own"
  on public.arrangements for delete
  using ( auth.uid() = user_id );

-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATE 2: Likes, Comments, and MIDI uploads
--
-- Run this block to add likes + comments tables and the two new columns on
-- arrangements. Safe to run on an existing database — all statements are
-- idempotent (if not exists / drop policy if exists).
-- ─────────────────────────────────────────────────────────────────────────────

-- New columns on arrangements for MIDI uploads.
alter table public.arrangements
  add column if not exists source_type text not null default 'builder',
  add column if not exists midi_url    text;

-- ── Likes ────────────────────────────────────────────────────────────────────

create table if not exists public.likes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  arrangement_id  uuid not null references public.arrangements (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (user_id, arrangement_id)
);

create index if not exists likes_arrangement_idx on public.likes (arrangement_id);

alter table public.likes enable row level security;

drop policy if exists "read likes" on public.likes;
create policy "read likes"
  on public.likes for select using ( true );

drop policy if exists "insert own like" on public.likes;
create policy "insert own like"
  on public.likes for insert
  with check ( auth.uid() = user_id );

drop policy if exists "delete own like" on public.likes;
create policy "delete own like"
  on public.likes for delete
  using ( auth.uid() = user_id );

-- ── Comments ─────────────────────────────────────────────────────────────────

create table if not exists public.comments (
  id              uuid primary key default gen_random_uuid(),
  arrangement_id  uuid not null references public.arrangements (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  author_name     text not null default 'Producer',
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists comments_arrangement_idx on public.comments (arrangement_id, created_at asc);

alter table public.comments enable row level security;

drop policy if exists "read comments" on public.comments;
create policy "read comments"
  on public.comments for select using ( true );

drop policy if exists "insert own comment" on public.comments;
create policy "insert own comment"
  on public.comments for insert
  with check ( auth.uid() = user_id );

drop policy if exists "delete own comment" on public.comments;
create policy "delete own comment"
  on public.comments for delete
  using ( auth.uid() = user_id );

-- ─────────────────────────────────────────────────────────────────────────────
-- Likes table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.likes (
  user_id        uuid not null references auth.users (id) on delete cascade,
  arrangement_id uuid not null references public.arrangements (id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (user_id, arrangement_id)
);

create index if not exists likes_arrangement_idx on public.likes (arrangement_id);

alter table public.likes enable row level security;

drop policy if exists "read likes" on public.likes;
create policy "read likes"
  on public.likes for select
  using ( true );

drop policy if exists "insert own like" on public.likes;
create policy "insert own like"
  on public.likes for insert
  with check ( auth.uid() = user_id );

drop policy if exists "delete own like" on public.likes;
create policy "delete own like"
  on public.likes for delete
  using ( auth.uid() = user_id );

-- ─────────────────────────────────────────────────────────────────────────────
-- Comments table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id             uuid primary key default gen_random_uuid(),
  arrangement_id uuid not null references public.arrangements (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  author_name    text not null default 'Producer',
  body           text not null,
  created_at     timestamptz not null default now()
);

create index if not exists comments_arrangement_idx on public.comments (arrangement_id, created_at asc);

alter table public.comments enable row level security;

drop policy if exists "read comments" on public.comments;
create policy "read comments"
  on public.comments for select
  using ( true );

drop policy if exists "insert own comment" on public.comments;
create policy "insert own comment"
  on public.comments for insert
  with check ( auth.uid() = user_id );

drop policy if exists "delete own comment" on public.comments;
create policy "delete own comment"
  on public.comments for delete
  using ( auth.uid() = user_id );

-- ─────────────────────────────────────────────────────────────────────────────
-- Extend arrangements table for MIDI uploads
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.arrangements
  add column if not exists source_type text not null default 'builder',
  add column if not exists midi_url    text;

-- Storage bucket for MIDI files (run once; safe to re-run due to on conflict do nothing)
-- NOTE: Create the bucket named 'midi' in Supabase Storage dashboard with public access,
-- or run: insert into storage.buckets (id, name, public) values ('midi', 'midi', true) on conflict do nothing;
