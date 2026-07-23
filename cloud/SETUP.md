# Cloud sync — one-time setup (~5 minutes)

This makes the hub a login point: users sign in once and each app's saved
progress syncs to the cloud and follows them to any device. **Until you finish
step 4, the hub and every app behave exactly as they do now (offline, local).**

Everything Claude can't do is here — it all needs *your* Supabase login.

---

## 1 · Create a fresh Supabase project (2 min)

1. Go to <https://supabase.com> → sign in → **New project**.
2. Name it e.g. `jeremy-hub`. Pick a strong database password (you won't need
   it day-to-day — save it somewhere anyway). Region: closest to you.
3. Wait for it to finish provisioning (~1 min).

## 2 · Create the table (1 min)

1. Left sidebar → **SQL Editor** → **New query**.
2. Open `schema.sql` (next to this file), copy the **whole** thing, paste, **Run**.
3. You should see "Success. No rows returned." That's correct.

## 3 · Turn on email login (1 min)

1. Left sidebar → **Authentication** → **Sign In / Providers** (or **Providers**).
2. Make sure **Email** is enabled.
3. For instant onboarding of other users, turn **OFF** "Confirm email"
   (Authentication → **Providers → Email → Confirm email** toggle). This lets
   people sign up and use it immediately without waiting for a confirmation
   email — fine for a study tool, and it avoids the free-tier email limits.
   *(Leave it ON if you'd rather verify addresses; users then must click a link
   before first sign-in.)*

## 4 · Wire the keys in (1 min)

1. Left sidebar → **Project Settings** → **API**.
2. Copy two values:
   - **Project URL** → looks like `https://abcdefgh.supabase.co`
   - **anon / public** key → a long token starting `eyJ...`
     ⚠️ Use the **anon / public** key, NOT `service_role` (that one is secret).
3. Paste both into `hub/cloud/config.js`, then commit + push:
   ```js
   window.HUB_CLOUD = {
     url: "https://abcdefgh.supabase.co",
     key: "eyJhbGci...your anon key..."
   };
   ```

**Or just hand those two values to Claude** and it'll paste, push, and verify
the whole thing end-to-end.

---

## What's already built and waiting

- `schema.sql` — the table + Row-Level Security (each user sees only their own
  data) + an updated_at trigger for conflict handling.
- `cloud.js` — the shared sync engine (`window.Cloud`): sign up / in / out,
  and transparent localStorage sync. Offline-first; degrades to local-only on
  any failure.
- `config.js` — the two-value config (empty = dormant).
- Hub login panel — appears automatically once `config.js` is filled.
- `suggestions.sql` — the public suggestions box on the hub (anyone can suggest
  & upvote without an account; already applied to the BN-hub project). To
  moderate: Table Editor → `suggestions` → set `hidden` to true on a row.

## Adding sync to any app later (the whole integration)

In the app's `<head>` (or before its script):
```html
<script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="https://jeremyspm.github.io/cloud/config.js"></script>
<script src="https://jeremyspm.github.io/cloud/cloud.js"></script>
```
Then once, early in the app's own script:
```js
Cloud.sync(['medcalcdrill.v1']);   // whatever localStorage key(s) this app owns
```
That's it. Signed out or offline, the app is unchanged; signed in, that key
syncs across devices, newest-write-wins.

## Notes / lessons from the retired Japan tracker

- **Real accounts + RLS**, not a shared passphrase room — proper per-user
  isolation this time.
- **Free projects still pause after ~7 days idle** and can eventually be
  deleted. Real users signing in counts as activity, so an adopted app stays
  alive naturally — but **keep local data + backups as the source of truth**
  and treat the cloud as the convenience layer, never the only copy. A synthetic
  keep-alive ping did NOT save the last project; real usage is the real fix.
