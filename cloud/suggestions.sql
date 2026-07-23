-- ============================================================================
--  BN Hub — public suggestions box (+ upvotes, no downvotes)
--
--  ALREADY APPLIED to the BN-hub Supabase project (migration "suggestions_box",
--  2026-07-23) — kept here as the source-of-truth reference. Safe to re-run.
--
--  Anyone (anonymous or signed in) may read suggestions, add one, and upvote.
--  Nobody can edit or delete from the browser — moderation happens in the
--  Supabase dashboard: set hidden = true on a row to take it off the site.
-- ============================================================================

create table if not exists public.suggestions (
  id         uuid        primary key default gen_random_uuid(),
  body       text        not null check (char_length(btrim(body)) between 3 and 500),
  author     text        check (author is null or char_length(author) <= 40),
  hidden     boolean     not null default false,
  created_at timestamptz not null default now()
);

-- One row per (suggestion, device). `voter` is a random UUID minted in the
-- visitor's browser — the primary key makes an upvote once-per-device.
create table if not exists public.suggestion_votes (
  suggestion_id uuid not null references public.suggestions(id) on delete cascade,
  voter         text not null check (char_length(voter) between 8 and 64),
  created_at    timestamptz not null default now(),
  primary key (suggestion_id, voter)
);

alter table public.suggestions enable row level security;
alter table public.suggestion_votes enable row level security;

drop policy if exists "suggestions readable"  on public.suggestions;
drop policy if exists "suggestions insert"    on public.suggestions;
drop policy if exists "votes readable"        on public.suggestion_votes;
drop policy if exists "votes insert"          on public.suggestion_votes;

-- Everyone (anon included) sees non-hidden suggestions.
create policy "suggestions readable" on public.suggestions
  for select using (not hidden);

-- Everyone may add a suggestion; it can't arrive pre-hidden.
create policy "suggestions insert" on public.suggestions
  for insert with check (not hidden);

-- Vote counts are public; votes may only target visible suggestions.
create policy "votes readable" on public.suggestion_votes
  for select using (true);

create policy "votes insert" on public.suggestion_votes
  for insert with check (
    exists (select 1 from public.suggestions s
            where s.id = suggestion_id and not s.hidden)
  );

-- No update/delete policies on either table → RLS denies them for clients.
