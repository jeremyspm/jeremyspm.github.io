/* Cloud sync config for BN Hub (Supabase project: BN-hub).
   These two values are PUBLIC by design — the anon key is meant to ship in the
   browser. It grants NO access on its own: Row-Level Security means a user can
   only ever reach their own rows, and only after signing in. The secret
   "service_role" key is NOT here and must never be. */
window.HUB_CLOUD = {
  url: "https://lnfoyklfxrkwgvqkoeor.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZm95a2xmeHJrd2d2cWtvZW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MzYxNjksImV4cCI6MjEwMDAxMjE2OX0.WAlvKYEe556z5ExafHFkWPJMnAZ-maMo2dPytTQ3xsA"
};
