-- ============================================================================
--  Jeremy's Hub — cloud sync schema
--  Paste this whole file into the Supabase SQL Editor and press RUN once.
--  Safe to re-run: everything is guarded with "if not exists" / "drop ... if".
--
--  Design (learned from the retired Japan tracker, which had NO per-user
--  isolation): every user gets a real account, and Row-Level Security means a
--  user can ONLY ever read or write their own rows. One table holds every
--  app's saved state — one row per (user, app).
-- ============================================================================

-- One row per (user, app_key). `data` is that app's whole saved state as JSON.
create table if not exists public.app_data (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  app_key    text        not null,                 -- e.g. 'medcalcdrill.v1'
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, app_key)
);

-- Turn ON row-level security (without a policy this DENIES everything — good default).
alter table public.app_data enable row level security;

-- Replace policies cleanly on re-run.
drop policy if exists "own rows readable"  on public.app_data;
drop policy if exists "own rows insert"    on public.app_data;
drop policy if exists "own rows update"    on public.app_data;
drop policy if exists "own rows delete"    on public.app_data;

-- A logged-in user may touch ONLY rows whose user_id matches their auth id.
create policy "own rows readable" on public.app_data
  for select using (auth.uid() = user_id);

create policy "own rows insert" on public.app_data
  for insert with check (auth.uid() = user_id);

create policy "own rows update" on public.app_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows delete" on public.app_data
  for delete using (auth.uid() = user_id);

-- Keep updated_at honest on every write (so "newest wins" conflict handling works).
-- `set search_path = ''` pins the function's schema resolution so it can't be
-- hijacked via a mutable search_path (clears the Supabase linter warning).
create or replace function public.touch_app_data() returns trigger
  language plpgsql
  set search_path = ''
  as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists app_data_touch on public.app_data;
create trigger app_data_touch before insert or update on public.app_data
  for each row execute function public.touch_app_data();

-- ============================================================================
--  Done. Nothing else to configure in SQL.
--  Remaining setup (all in the dashboard UI, see SETUP.md):
--    • Authentication → Providers → Email: enable it
--    • For instant multi-user onboarding, turn OFF "Confirm email"
--    • Settings → API: copy the Project URL and the anon/public key into
--      hub/cloud/config.js
-- ============================================================================

-- ============================================================================
--  Visit counter (migration "pageview_counter", 2026-07-27)
--  ALREADY APPLIED to the BN-hub project — kept here as the source of truth.
--
--  First-party analytics: the hub counts its own visits instead of shipping a
--  third-party tracker. No IP, no user-agent, no full referrer, no cross-site
--  id, no cookie. Client is hub/cloud/count.js.
-- ============================================================================
create table if not exists public.pageviews (
  id      bigint generated always as identity primary key,
  at      timestamptz not null default now(),
  site    text not null check (char_length(site) between 1 and 40),
  path    text not null check (char_length(path) <= 200),
  ref     text check (ref is null or char_length(ref) <= 80),   -- HOST only, never a full URL
  visitor text not null check (char_length(visitor) between 8 and 64),
  session text not null check (char_length(session) between 8 and 64),
  user_id uuid references auth.users(id) on delete set null,    -- only when signed in
  device  text check (device in ('phone','tablet','desktop')),
  tz      text check (tz is null or char_length(tz) <= 60),
  lang    text check (lang is null or char_length(lang) <= 12)
);

create index if not exists pageviews_at_idx      on public.pageviews (at desc);
create index if not exists pageviews_site_at_idx on public.pageviews (site, at desc);

alter table public.pageviews enable row level security;

drop policy if exists "anyone may record a visit" on public.pageviews;
drop policy if exists "owner reads stats"         on public.pageviews;

-- Anyone may add a visit, but may not attribute it to another account.
create policy "anyone may record a visit" on public.pageviews
  for insert to anon, authenticated
  with check (user_id is null or auth.uid() = user_id);

-- Only the owner can read it back, and only signed in. No update/delete policy,
-- so rows are append-only from the browser.
-- Both of Jeremy's accounts (personal + Manukau student), added 27/07/2026 —
-- migration "pageview_stats_second_owner". Keep this list in step with OWNERS
-- in hub/index.html.
create policy "owner reads stats" on public.pageviews
  for select to authenticated
  using (auth.jwt() ->> 'email' in ('jeremyspm1999@gmail.com','masa64@manukaumail.com'));
