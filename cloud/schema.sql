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
create or replace function public.touch_app_data() returns trigger
  language plpgsql as $$
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
