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
