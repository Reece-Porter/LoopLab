-- ─────────────────────────────────────────────────────────────────────────────
-- LoopLab — Supabase database schema  (single authoritative source of truth)
--
-- HOW TO RUN
--   Supabase → SQL Editor → New query → paste this whole file → Run.
--
-- This file is SAFE TO RE-RUN at any time:
--   • every table uses  create table if not exists   (never drops your data)
--   • new columns use    add column if not exists     (backfills safely)
--   • every policy is    drop policy if exists → create  (policies hold no data)
--   • there is NO drop table and NO drop column anywhere
--
-- It is also SELF-HEALING: if an older deploy created `likes` without an `id`
-- column, the ALTER below adds it (the app needs likes.id), backfilling existing
-- rows. Nothing is destroyed.
--
-- SECURITY MODEL (enforced by the Row Level Security policies at the bottom):
--   • Anonymous visitors (holding the public anon key) are READ-ONLY. Every
--     insert/update/delete requires auth.uid() = user_id, which is null for
--     anonymous requests, so all writes are denied.
--   • Anyone can read PUBLIC arrangements, plus all likes and comments.
--     Private arrangements (is_public = false) are visible only to their owner.
--   • Signed-in users can only create/edit/delete their OWN rows.
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════════
-- ARRANGEMENTS  (community-published builds + uploaded MIDI files)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.arrangements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'Producer',
  title       text not null,
  description text default '',
  genre_id    text,
  is_public   boolean not null default true,
  source_type text not null default 'builder',   -- 'builder' | 'midi_upload'
  midi_url    text,                                -- public URL when source_type = 'midi_upload'
  data        jsonb not null,
  created_at  timestamptz not null default now()
);

-- Self-heal: add the MIDI columns if an older deploy created the table without them.
alter table public.arrangements
  add column if not exists source_type text not null default 'builder',
  add column if not exists midi_url    text;

create index if not exists arrangements_public_idx on public.arrangements (is_public, created_at desc);
create index if not exists arrangements_user_idx   on public.arrangements (user_id, created_at desc);

alter table public.arrangements enable row level security;

-- READ: anyone can see public rows; owners can additionally see their private ones.
drop policy if exists "read public or own" on public.arrangements;
create policy "read public or own"
  on public.arrangements for select
  using ( is_public = true or auth.uid() = user_id );

-- INSERT: you may only create rows owned by yourself.
drop policy if exists "insert own" on public.arrangements;
create policy "insert own"
  on public.arrangements for insert
  with check ( auth.uid() = user_id );

-- UPDATE: you may only edit your own rows, AND may not reassign them to someone
-- else (the WITH CHECK closes that gap).
drop policy if exists "update own" on public.arrangements;
create policy "update own"
  on public.arrangements for update
  using      ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- DELETE: you may only delete your own rows.
drop policy if exists "delete own" on public.arrangements;
create policy "delete own"
  on public.arrangements for delete
  using ( auth.uid() = user_id );


-- ═══════════════════════════════════════════════════════════════════════════
-- LIKES
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.likes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  arrangement_id uuid not null references public.arrangements (id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (user_id, arrangement_id)
);

-- Self-heal: an older deploy may have created `likes` with a composite primary
-- key and no `id` column. The app selects/deletes likes by `id`, so ensure it
-- exists. This backfills existing rows with a generated uuid and never drops data.
alter table public.likes
  add column if not exists id uuid not null default gen_random_uuid();

create index if not exists likes_arrangement_idx on public.likes (arrangement_id);

alter table public.likes enable row level security;

-- READ: like counts are public (a public gallery). Exposes user_id UUIDs only.
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


-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE — MIDI uploads bucket
-- Explicit policies so uploads are governed here rather than left to defaults.
-- Public read (files are shared in the community); only signed-in users upload.
-- ═══════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('midi', 'midi', true)
on conflict (id) do nothing;

drop policy if exists "public read midi" on storage.objects;
create policy "public read midi"
  on storage.objects for select
  using ( bucket_id = 'midi' );

drop policy if exists "authenticated upload midi" on storage.objects;
create policy "authenticated upload midi"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'midi' );

drop policy if exists "owner delete midi" on storage.objects;
create policy "owner delete midi"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'midi' and owner = auth.uid() );


-- ═══════════════════════════════════════════════════════════════════════════
-- PROFILES  (identity + per-feature access flags; powers backend authorisation)
--
-- One row per auth user. `role` and `can_download` are the access controls the
-- backend checks server-side. Users may READ their own row but may NOT write
-- role/flags (there is no user INSERT/UPDATE policy), so nobody can grant
-- themselves access — only the signup trigger (security definer) and the service
-- role key (server / admin) can write. Adding a future gated feature = add a
-- boolean flag column here, no app migration required.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role         text not null default 'user',      -- 'user' | 'admin'
  can_download boolean not null default false,     -- backend downloader access
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: give every EXISTING user a profile row (safe, idempotent).
insert into public.profiles (id, display_name)
select u.id, coalesce(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

-- Admin check as a SECURITY DEFINER function so admin policies don't recurse
-- on the profiles table's own RLS.
create or replace function public.is_admin()
  returns boolean
  language sql
  security definer
  set search_path = public
  stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- READ: a user may read only their own row …
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select
  using ( auth.uid() = id );

-- … and an admin may read everyone (for the admin panel).
drop policy if exists "admin read all profiles" on public.profiles;
create policy "admin read all profiles" on public.profiles for select
  using ( public.is_admin() );

-- WRITE: ONLY admins may update roles/flags. There is deliberately NO insert or
-- update policy for ordinary users, so a normal account cannot set its own
-- role='admin' or can_download=true — RLS denies the write outright.
drop policy if exists "admin update profiles" on public.profiles;
create policy "admin update profiles" on public.profiles for update
  using ( public.is_admin() ) with check ( public.is_admin() );

-- ── BOOTSTRAP YOUR OWN ADMIN (run once, replace the email) ───────────────────
-- The SQL editor runs as a privileged role and bypasses RLS, so this is how the
-- first admin is created when nobody is an admin yet:
--
--   update public.profiles
--   set role = 'admin', can_download = true
--   where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');


-- ─────────────────────────────────────────────────────────────────────────────
-- OPTIONAL HARDENING — not enabled by default.
--
-- The client caps title/description/body lengths, but a caller using the raw
-- API could bypass that and insert oversized rows. To enforce caps server-side,
-- run the block below. IMPORTANT: adding a CHECK to a populated table FAILS if
-- any existing row already exceeds the limit — verify first, e.g.
--   select max(char_length(title)), max(char_length(coalesce(description,''))) from public.arrangements;
--   select max(char_length(body)) from public.comments;
-- Only then uncomment and run:
--
--   alter table public.arrangements
--     add constraint arrangements_title_len       check (char_length(title) <= 80),
--     add constraint arrangements_description_len  check (char_length(coalesce(description,'')) <= 400);
--   alter table public.comments
--     add constraint comments_body_len             check (char_length(body) <= 500);
-- ─────────────────────────────────────────────────────────────────────────────
