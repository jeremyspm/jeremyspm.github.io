/* Cloud sync config for Jeremy's Hub.
   Fill these two values in from Supabase (Settings → API), then commit + push.
   Until BOTH are filled, cloud sync stays completely dormant and every app
   behaves exactly as it does today (offline, local-only) — nothing breaks.

   These two values are PUBLIC by design: the anon key is meant to ship in the
   browser. It grants NO access on its own — Row-Level Security means a user can
   only ever reach their own rows, and only after signing in. Never paste the
   "service_role" key here; that one is secret. Only the "anon" / "public" key. */
window.HUB_CLOUD = {
  url: "",   // e.g. "https://abcdefgh.supabase.co"
  key: ""    // the anon / public key (a long token starting with "eyJ...")
};
