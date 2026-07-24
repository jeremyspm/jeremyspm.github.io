-- ============================================================================
--  BN Hub — public suggestions box (+ upvotes, no downvotes)
--
--  ALREADY APPLIED to the BN-hub Supabase project (migration "suggestions_box",
--  2026-07-23) — kept here as the source-of-truth reference. Safe to re-run.
--
--  Anyone (anonymous or signed in) may read suggestions, add one, and like them.
--  Likes can be removed again (un-like), and a poster can delete their OWN post —
--  both gated by a per-device secret. No one can edit/delete anyone else's post
--  from the browser — moderation still happens in the Supabase dashboard: set
--  hidden = true on a row to take it off the site.
-- ============================================================================

create table if not exists public.suggestions (
  id         uuid        primary key default gen_random_uuid(),
  body       text        not null check (char_length(btrim(body)) between 3 and 500),
  author     text        check (author is null or char_length(author) <= 40),
  hidden     boolean     not null default false,
  created_at timestamptz not null default now()
);

-- The device that created a suggestion — stored so the original poster (and only
-- them) can delete their own post. It is NEVER selected back to clients, so a
-- device id can't leak to other visitors. Nullable: rows created before this
-- column existed have none, and so can't be deleted from the browser.
alter table public.suggestions add column if not exists author_device text
  check (author_device is null or char_length(author_device) between 8 and 64);

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

-- No update/delete policies on either table → direct client DELETE is denied by
-- RLS. The two owner-scoped deletions below are the ONLY way a visitor can remove
-- anything, and each is gated by a device secret held solely in that browser.

-- Un-like: remove the caller's own upvote. security definer so it can delete past
-- RLS, but it only ever touches the exact (suggestion, voter) pair the caller owns.
-- (Same honest-visitor stance as the rest of this file — a determined actor who
--  already reads the public vote rows could abuse it; on a student hub that's fine.)
create or replace function public.remove_vote(p_id uuid, p_voter text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.suggestion_votes
  where suggestion_id = p_id and voter = p_voter;
$$;

-- Delete-own-post: removes a suggestion only when the caller's device matches the
-- one that created it. author_device is a secret held only in the poster's browser,
-- so no other visitor can delete someone else's post. Cascades to its votes.
create or replace function public.delete_suggestion(p_id uuid, p_device text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.suggestions
  where id = p_id and author_device is not null and author_device = p_device;
$$;

grant execute on function public.remove_vote(uuid, text)       to anon, authenticated;
grant execute on function public.delete_suggestion(uuid, text) to anon, authenticated;
