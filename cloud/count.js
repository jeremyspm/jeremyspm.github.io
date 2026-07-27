/* ============================================================================
   count.js — BN Hub's own visit counter (added 2026-07-27)

   First-party and deliberately small. It writes ONE row per page view into the
   `pageviews` table of the hub's existing Supabase project. There is no third
   party, no ad network, no tag manager, no cookie, and nothing to maintain: no
   account to keep alive, no script to update, no bill.

   WHAT IT RECORDS
     site · path · referrer HOST · a random per-browser id · a per-tab id
     · phone/tablet/desktop · timezone name · browser language
     · the signed-in account id, ONLY if the visitor is signed in.

   WHAT IT DOES NOT RECORD
     No IP address. No user-agent string. No full referrer URL (a full referrer
     can carry someone else's private query string). No cross-site identifier —
     the visitor id is unique to this site and useless anywhere else. No
     fingerprinting. Nothing that names a person who has not signed in.

   So: it answers "how many people, how often, from where, on what device", and
   for signed-in users it answers "which account". It cannot tell you the name of
   an anonymous visitor, and it is not built to.

   FAILURE MODE: silence. Every call is wrapped, nothing is retried, nothing
   blocks rendering, and if Supabase is paused or unreachable the page simply
   carries on. A counter must never be able to break the site it counts.

   OPT-OUT: honours the Global Privacy Control browser signal, and anyone can
   opt out permanently with  localStorage.setItem('hub.nocount','1')
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.HUB_CLOUD;
  if (!CFG || !CFG.url || !CFG.key) return;            // cloud not configured → no-op

  // Never count development. Building this hub means reloading it dozens of times
  // a day from localhost and file://, and every one of those would land in the
  // stats as a "visitor" — the numbers would be mostly Jeremy and therefore
  // worthless. Only real, deployed traffic is recorded.
  var host = location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '[::1]' ||
      host.endsWith('.local') || location.protocol === 'file:') return;

  // Global Privacy Control is a legally recognised opt-out in some places, so it
  // is honoured. (Do-Not-Track deliberately is not: DNT is a signal about
  // cross-site tracking, and this sets no cross-site identifier.)
  try {
    if (navigator.globalPrivacyControl) return;
    if (localStorage.getItem('hub.nocount') === '1') return;
  } catch (e) { /* storage blocked → fall through, we just won't have a stable id */ }

  function rid() {
    try {
      if (crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    return 'r' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  // Stable per browser install (distinguishes returning visitors), and per tab
  // session (so "visits" can be told apart from "pages read in one sitting").
  function keep(store, key) {
    try {
      var v = store.getItem(key);
      if (!v) { v = rid(); store.setItem(key, v); }
      return v;
    } catch (e) { return rid(); }   // private mode → treated as a new visitor
  }

  function device() {
    var w = window.innerWidth || 1024;
    return w < 560 ? 'phone' : w < 1024 ? 'tablet' : 'desktop';
  }

  // Referrer HOST only, and nothing at all for same-site navigation — an internal
  // click is not traffic arriving, and logging it would make every number wrong.
  function refHost() {
    try {
      if (!document.referrer) return null;
      var h = new URL(document.referrer).hostname;
      return (h && h !== location.hostname) ? h.replace(/^www\./, '').slice(0, 80) : null;
    } catch (e) { return null; }
  }

  var seen = {};          // path → last time recorded, so a re-render isn't a new view
  var VISITOR = keep(localStorage, 'hub.vid');
  var SESSION = keep(sessionStorage, 'hub.sid');

  function send(site, path) {
    var now = Date.now();
    if (seen[path] && now - seen[path] < 30000) return;   // same page within 30s → one view
    seen[path] = now;

    var body = {
      site: String(site || 'hub').slice(0, 40),
      path: String(path || '/').slice(0, 200),
      ref: refHost(),
      visitor: VISITOR,
      session: SESSION,
      device: device(),
      tz: null,
      lang: (navigator.language || '').slice(0, 12) || null,
      user_id: null
    };
    try { body.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch (e) {}
    // Only ever the visitor's OWN account id. The row-level policy rejects any
    // attempt to attribute a visit to somebody else's account anyway.
    try {
      var u = window.Cloud && window.Cloud.user && window.Cloud.user();
      if (u && u.id) body.user_id = u.id;
    } catch (e) {}

    try {
      fetch(CFG.url + '/rest/v1/pageviews', {
        method: 'POST',
        headers: {
          'apikey': CFG.key,
          'Authorization': 'Bearer ' + CFG.key,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(body),
        keepalive: true          // survives the tab closing mid-flight
      }).catch(function () {});   // offline / paused / blocked → silence
    } catch (e) {}
  }

  // Public surface. `count()` with no arguments records the current page; the
  // hub calls count(path) again when its in-page view changes, so an SPA still
  // reports the sections people actually read.
  window.hubCount = function (path, site) {
    try { send(site || window.HUB_SITE || 'hub', path || (location.pathname + location.hash)); }
    catch (e) {}
  };

  // First view: after load, so it can never delay first paint.
  if (document.readyState === 'complete') window.hubCount();
  else window.addEventListener('load', function () { window.hubCount(); });
})();
