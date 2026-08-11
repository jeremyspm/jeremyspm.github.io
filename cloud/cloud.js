/* ============================================================================
   cloud.js — Jeremy's Hub shared cloud sync (window.Cloud)
   ----------------------------------------------------------------------------
   One login at the hub, every app's saved state follows you to any device.

   HOW IT PLUGS IN (per app — two lines, zero other changes):
     <script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
     <script src="https://jeremyspm.github.io/cloud/config.js"></script>
     <script src="https://jeremyspm.github.io/cloud/cloud.js"></script>
   then once, early in the app:
     Cloud.sync(['medcalcdrill.v1']);      // the localStorage key(s) this app owns

   DESIGN PRINCIPLES
     • Offline-first: if unconfigured, offline, or signed-out, this is a no-op
       and the app runs exactly as it does today on local storage.
     • Real accounts + Row-Level Security do the isolation — each user only ever
       touches their own rows (unlike the retired Japan tracker's shared room).
     • Never throws into the app. Every failure degrades silently to local-only.
     • A device that has nothing unpushed ALWAYS takes the cloud's copy. Where both
       sides really have changed, the app may hand `sync` a merge function; without
       one the local copy stands and goes up. See "WHO WINS" below.

   WHO WINS — and why this is no longer a timestamp comparison
     The first version asked "is the cloud row newer than this device's last local
     write?", comparing a server clock against a device clock. It lost a whole
     evening's work on a phone, because an app WRITES DURING ITS OWN STARTUP —
     a rolled-over session date, a one-off state migration, a ?topic= deep link —
     and each of those stamped the local copy as "just modified" seconds before the
     pull came back. The cloud row was hours old by that measure and was thrown
     away, and the next local write pushed the stale blob over the good one.

     So the question is now "has this device got work the cloud has not seen?",
     answered without reading a clock at all:
       · `synced` — the server's own `updated_at` for the revision we last pushed
         or adopted. Equal to the row we just fetched ⇒ we already hold it.
       · `dirty`  — set when the app writes, cleared when that write is confirmed up.
     and it is read from BOOT — the snapshot of the meta as it stood before this page
     load — so an app's startup writes cannot vote. Clean at boot ⇒ the cloud wins,
     whatever either clock says.
   ============================================================================ */
(function () {
  'use strict';

  var CFG = window.HUB_CLOUD || { url: '', key: '' };
  var META_KEY = '__cloud_meta__';           // local shadow: per-key {mtime, synced, dirty}
  var BACKUP_PRE = '__cloud_backup__.';       // pre-adoption copy, one per key
  var RELOAD_AT = '__cloud_reloaded__';       // sessionStorage: when we last reloaded for a pull
  var RELOAD_QUIET = 20000;                   // …and how long before we may do it again
  var BACKUP_MAX = 2000000;                   // don't spend the whole quota on a safety copy

  var Cloud = {
    enabled: !!(CFG.url && CFG.key),          // both present → cloud is switched on
    client: null,
    _user: null,
    _keys: [],                                // registered localStorage keys to sync
    _merge: {},                               // app_key → function(local, cloud) → merged
    _listeners: [],                           // auth-change callbacks
    _readyResolve: null,
  };
  /* The meta AS IT STOOD BEFORE THIS PAGE LOADED. Read once, at the top of the IIFE,
     which is the only moment it is guaranteed to be free of the app's own startup
     writes — this script runs before the app's. Everything about who-wins is decided
     against this snapshot, never against the live meta. */
  var BOOT = (function () {
    try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { return {}; }
  })();
  // Resolves once supabase-js is loaded, the client exists, and any session is restored.
  Cloud.ready = new Promise(function (res) { Cloud._readyResolve = res; });

  /* ---------- tiny helpers ---------- */
  function log() { /* console.debug.apply(console, ['[cloud]'].concat([].slice.call(arguments))); */ }
  function meta() { try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { return {}; } }
  function saveMeta(m) { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {} }
  function metaOf(key) { var m = meta(); return m[key] || {}; }
  // `mtime` is kept for the one legacy decision below and for eyeballing; `dirty` is
  // what the merge actually reads.
  function markLocal(key) {
    var m = meta(); m[key] = m[key] || {};
    m[key].mtime = Date.now(); m[key].dirty = true;
    saveMeta(m);
  }
  function stamp(key, syncedAt, dirty) {
    var m = meta(); m[key] = m[key] || {};
    if (syncedAt) m[key].synced = syncedAt;
    m[key].dirty = !!dirty;
    saveMeta(m);
  }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  // Wait for the supabase-js UMD global (loaded with `defer`, may arrive after us).
  function waitForLib(timeoutMs) {
    return new Promise(function (resolve) {
      if (window.supabase && window.supabase.createClient) return resolve(true);
      var waited = 0, step = 50;
      var iv = setInterval(function () {
        if (window.supabase && window.supabase.createClient) { clearInterval(iv); resolve(true); }
        else if ((waited += step) >= timeoutMs) { clearInterval(iv); resolve(false); }
      }, step);
    });
  }

  /* ---------- lifecycle ---------- */
  Cloud.init = function () {
    if (!Cloud.enabled) { Cloud._readyResolve(false); return Cloud.ready; }
    waitForLib(8000).then(function (ok) {
      if (!ok) { log('supabase-js not available — staying local-only'); Cloud._readyResolve(false); return; }
      // persistSession:true + shared origin = one login at the hub carries to every app.
      Cloud.client = window.supabase.createClient(CFG.url, CFG.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'hub-auth' }
      });
      Cloud.client.auth.getSession().then(function (r) {
        Cloud._user = (r && r.data && r.data.session && r.data.session.user) || null;
        Cloud.client.auth.onAuthStateChange(function (_evt, session) {
          var was = Cloud._user && Cloud._user.id;
          Cloud._user = (session && session.user) || null;
          fireChange();
          if (Cloud._user && Cloud._user.id !== was) pullAll();   // just signed in → pull their data
        });
        Cloud._readyResolve(true);
        fireChange();
        if (Cloud._user) pullAll();                               // already signed in on load → pull
      });
    });
    return Cloud.ready;
  };

  function fireChange() { Cloud._listeners.forEach(function (cb) { try { cb(Cloud._user); } catch (e) {} }); }

  /* ---------- public auth API (users type their OWN passwords — that's normal app use) ---------- */
  Cloud.user = function () { return Cloud._user; };
  Cloud.onChange = function (cb) { Cloud._listeners.push(cb); try { cb(Cloud._user); } catch (e) {} };

  // Friendlier text for the common network-failure message.
  function nicer(m) {
    return /fetch|networkerror|network request/i.test(m || '')
      ? "Couldn't reach the server — check your connection and try again." : m;
  }
  // Normalise BOTH a thrown rejection AND a resolved {error} (supabase-js
  // returns network failures as a resolved error, not a throw) so callers never
  // need try/catch and a UI button can't get stuck.
  function guard(p) {
    return p.then(function (r) {
      if (r && r.error && r.error.message) r.error.message = nicer(r.error.message);
      return r;
    }, function (e) {
      return { error: { message: nicer((e && e.message) || String(e)) } };
    });
  }
  Cloud.signUp = function (email, password) {
    if (!Cloud.client) return Promise.resolve({ error: { message: 'Cloud not ready' } });
    return guard(Cloud.client.auth.signUp({ email: email, password: password }));
  };
  Cloud.signIn = function (email, password) {
    if (!Cloud.client) return Promise.resolve({ error: { message: 'Cloud not ready' } });
    return guard(Cloud.client.auth.signInWithPassword({ email: email, password: password }));
  };
  Cloud.signOut = function () {
    if (!Cloud.client) return Promise.resolve({});
    return Cloud.client.auth.signOut();
  };
  // Send a password-reset email; the link lands on the hub's reset page.
  Cloud.resetPassword = function (email) {
    if (!Cloud.client) return Promise.resolve({ error: { message: 'Cloud not ready' } });
    return guard(Cloud.client.auth.resetPasswordForEmail(email, {
      redirectTo: (CFG.resetUrl || 'https://jeremyspm.github.io/reset.html')
    }));
  };
  // Set a new password (used on the reset page once the recovery link is open).
  Cloud.updatePassword = function (newPassword) {
    if (!Cloud.client) return Promise.resolve({ error: { message: 'Cloud not ready' } });
    return guard(Cloud.client.auth.updateUser({ password: newPassword }));
  };

  /* ---------- data sync ---------- */
  // Register the localStorage key(s) this app owns. Returns a promise that
  // resolves after the first pull/merge, so an app may `await Cloud.sync([...])`
  // before its first render to guarantee freshest data.
  // `opts.merge(local, cloud)` — OPTIONAL, and only ever called when both sides have
  // genuinely moved since they last agreed. Return the combined value, or null to say
  // "I can't combine these", which keeps the local copy and sends it up. An app that
  // gives no merge function behaves as before: local stands, and one side's work is
  // lost. Anything holding a record per item (progress, a log, flags) should give one.
  Cloud.sync = function (keys, opts) {
    keys = [].concat(keys || []);
    keys.forEach(function (k) { if (Cloud._keys.indexOf(k) < 0) Cloud._keys.push(k); });
    if (opts && typeof opts.merge === 'function') {
      keys.forEach(function (k) { Cloud._merge[k] = opts.merge; });
    }
    wrapSetItem();
    return Cloud.ready.then(function () { return Cloud._user ? pullAll() : null; });
  };

  // What the app may show the reader. `mode`: off (not configured) · out (signed out)
  // · pending (local work not yet up) · synced.
  Cloud.state = function () {
    if (!Cloud.enabled) return { mode: 'off' };
    if (!Cloud._user) return { mode: 'out' };
    var m = meta(), pending = false, at = null;
    Cloud._keys.forEach(function (k) {
      var r = m[k] || {};
      if (r.dirty) pending = true;
      if (r.synced && (!at || r.synced > at)) at = r.synced;
    });
    return { mode: pending ? 'pending' : 'synced', email: Cloud._user.email || '', at: at };
  };

  // The copy this device held immediately before it adopted the cloud's. Nothing
  // reads it automatically — it exists so that adopting is never the end of a story.
  Cloud.backup = function (key) {
    try { return JSON.parse(localStorage.getItem(BACKUP_PRE + key)); } catch (e) { return null; }
  };
  Cloud.rollback = function (key) {
    var b = Cloud.backup(key);
    if (!b || b.data == null) return false;
    try { localStorage.setItem(key, b.data); return true; } catch (e) { return false; }
  };

  // Monkeypatch localStorage.setItem ONCE so changes to registered keys queue a push.
  // Transparent to the app — it keeps calling localStorage normally.
  var setItemWrapped = false;
  function wrapSetItem() {
    if (setItemWrapped) return; setItemWrapped = true;
    var native = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (k, v) {
      native(k, v);
      if (Cloud._keys.indexOf(k) >= 0) { markLocal(k); pushSoon(); }
    };
    window.addEventListener('pagehide', flushNow);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushNow(); });
  }

  var pushSoon = debounce(function () { pushAll(); }, 1200);
  function flushNow() { if (Cloud._user) pushAll(); }

  function pushAll() {
    if (!Cloud.client || !Cloud._user) return Promise.resolve();
    var jobs = [];
    Cloud._keys.forEach(function (key) {
      var raw = localStorage.getItem(key);
      if (raw == null) return;
      var mk = metaOf(key);
      /* Nothing has changed since the revision the cloud already holds. Re-uploading
         identical bytes would bump `updated_at`, which every OTHER device then reads
         as news and RELOADS for — a tab left open on a phone reloading itself each
         time a laptop is opened, with nothing to show for it. */
      if (mk.synced && mk.dirty === false) return;
      var data; try { data = JSON.parse(raw); } catch (e) { return; }
      jobs.push(
        Cloud.client.from('app_data')
          .upsert({ user_id: Cloud._user.id, app_key: key, data: data }, { onConflict: 'user_id,app_key' })
          .select('updated_at').maybeSingle()
          .then(function (r) {
            if (!r || r.error || !r.data) return;
            // Clean ONLY if nothing was written while the request was in flight —
            // otherwise the write that landed mid-push would never be sent.
            stamp(key, r.data.updated_at, localStorage.getItem(key) !== raw);
          }, function () {})
      );
    });
    return Promise.all(jobs);
  }

  /* Does this device have work the cloud row does not contain?
       'none'     — we already hold exactly this revision; do nothing.
       'cloud'    — we were clean at boot, so the cloud row is simply ahead: take it.
       'conflict' — both sides moved since they last agreed; merge or keep local. */
  function decide(key, cloudStamp) {
    var mk = metaOf(key), boot = BOOT[key] || {};
    if (mk.synced && mk.synced === cloudStamp) return 'none';
    if (boot.dirty !== undefined) return boot.dirty ? 'conflict' : 'cloud';
    /* Meta written by the version before `dirty` existed. Fall back to the old
       timestamp test ONCE — but against the BOOT mtime, so a startup write still
       cannot vote. That alone is the fix for the bug this replaced. */
    return (boot.mtime || 0) >= new Date(cloudStamp).getTime() ? 'conflict' : 'cloud';
  }

  function backupLocal(key, raw) {
    if (raw == null || raw.length > BACKUP_MAX) return;
    try { localStorage.setItem(BACKUP_PRE + key, JSON.stringify({ at: Date.now(), data: raw })); } catch (e) {}
  }

  // Returns true when localStorage actually changed and the app needs re-reading.
  function applyRow(row) {
    var key = row.app_key, verdict = decide(key, row.updated_at);
    if (verdict === 'none') return false;

    var localRaw = localStorage.getItem(key);
    var local = null;
    try { local = localRaw == null ? null : JSON.parse(localRaw); } catch (e) {}

    /* THE MERGE RUNS ON EVERY DIVERGENCE, not only on a flagged conflict. When this
       device is clean the merge is a no-op by construction — the local copy is an
       ancestor of the cloud one, so combining them returns the cloud one — and where
       the flags are wrong, or too coarse to have noticed (a device whose meta predates
       this file has no `dirty` to read), combining is the answer that cannot drop
       anything. An app that offers a merge is telling us its data can always be
       combined; take it at its word rather than second-guessing with a heuristic. */
    var fn = Cloud._merge[key], next = row.data, combined = false;
    if (fn && local) {
      try { var out = fn(local, row.data); if (out != null) { next = out; combined = true; } } catch (e) {}
    }
    // A real conflict we could not combine → the local copy stands, and goes up.
    if (!combined && verdict === 'conflict') { stamp(key, null, true); pushSoon(); return false; }

    var raw, cloudRaw;
    try { raw = JSON.stringify(next); cloudRaw = JSON.stringify(row.data); } catch (e) { return false; }
    /* Dirty only if what we now hold is not what the cloud holds. A merge that came
       out equal to the cloud row (the ordinary case on a clean device) is an adoption
       by another name, and must not be pushed back — that would bump `updated_at` and
       send every other device off to reload for nothing. */
    var ahead = raw !== cloudRaw;
    if (raw === localRaw) { stamp(key, row.updated_at, ahead); if (ahead) pushSoon(); return false; }
    backupLocal(key, localRaw);
    try { localStorage.setItem(key, raw); } catch (e) { return false; }   // wrapper marks dirty
    /* `synced` records which cloud revision we have INCORPORATED — set even after a
       merge, because it is what stops the next pull combining the same row again. */
    stamp(key, row.updated_at, ahead);
    if (ahead) pushSoon();
    return true;
  }

  function pullAll() {
    if (!Cloud.client || !Cloud._user || !Cloud._keys.length) return Promise.resolve();
    return Cloud.client.from('app_data')
      .select('app_key,data,updated_at')
      .in('app_key', Cloud._keys)
      .then(function (r) {
        if (!r || r.error || !r.data) return;
        var changed = false, missing = Cloud._keys.slice();
        r.data.forEach(function (row) {
          var i = missing.indexOf(row.app_key);
          if (i >= 0) missing.splice(i, 1);
          if (applyRow(row)) changed = true;
        });
        // Keys the cloud has never seen but we hold locally → push them up.
        if (missing.length) pushAll();
        if (changed) reloadOnce();
      }, function () {});
  }

  /* After adopting fresher cloud data the app's in-memory state is stale, so reload
     to make it re-read localStorage.

     The guard used to be one reload per SESSION, which quietly created a second way
     to lose work: a later pull in the same tab would update localStorage, skip the
     reload, and the app's next save() would write its stale state straight back over
     the data that had just arrived. It is a quiet PERIOD instead — long enough that
     nothing can loop, short enough that a real second pull still lands. `cloud:applied`
     fires either way, for apps that would rather re-read than be reloaded. */
  function reloadOnce() {
    if (!notifyApplied()) return;            // the app re-read it itself
    try {
      var last = +sessionStorage.getItem(RELOAD_AT) || 0;
      if (Date.now() - last < RELOAD_QUIET) return;
      sessionStorage.setItem(RELOAD_AT, String(Date.now()));
      location.reload();
    } catch (e) {}
  }
  // Returns false when a listener called preventDefault() — its way of saying it has
  // re-read the new state and would rather not have the page pulled out from under it.
  function notifyApplied() {
    try {
      return window.dispatchEvent(new CustomEvent('cloud:applied',
        { cancelable: true, detail: { keys: Cloud._keys.slice() } }));
    } catch (e) { return true; }
  }

  Cloud.init();
  window.Cloud = Cloud;
})();
