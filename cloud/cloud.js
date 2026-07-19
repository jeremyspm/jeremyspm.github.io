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
     • Newest-write-wins per app key (single user across their own devices).
   ============================================================================ */
(function () {
  'use strict';

  var CFG = window.HUB_CLOUD || { url: '', key: '' };
  var META_KEY = '__cloud_meta__';           // local shadow: per-key mtime + last pushed stamp
  var RELOAD_FLAG = '__cloud_reloaded__';     // sessionStorage guard against reload loops

  var Cloud = {
    enabled: !!(CFG.url && CFG.key),          // both present → cloud is switched on
    client: null,
    _user: null,
    _keys: [],                                // registered localStorage keys to sync
    _listeners: [],                           // auth-change callbacks
    _readyResolve: null,
  };
  // Resolves once supabase-js is loaded, the client exists, and any session is restored.
  Cloud.ready = new Promise(function (res) { Cloud._readyResolve = res; });

  /* ---------- tiny helpers ---------- */
  function log() { /* console.debug.apply(console, ['[cloud]'].concat([].slice.call(arguments))); */ }
  function meta() { try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { return {}; } }
  function saveMeta(m) { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {} }
  function markLocal(key) { var m = meta(); m[key] = m[key] || {}; m[key].mtime = Date.now(); saveMeta(m); }
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
  Cloud.sync = function (keys) {
    keys = [].concat(keys || []);
    keys.forEach(function (k) { if (Cloud._keys.indexOf(k) < 0) Cloud._keys.push(k); });
    wrapSetItem();
    return Cloud.ready.then(function () { return Cloud._user ? pullAll() : null; });
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
    var m = meta(), jobs = [];
    Cloud._keys.forEach(function (key) {
      var raw = localStorage.getItem(key);
      if (raw == null) return;
      var data; try { data = JSON.parse(raw); } catch (e) { return; }
      jobs.push(
        Cloud.client.from('app_data')
          .upsert({ user_id: Cloud._user.id, app_key: key, data: data }, { onConflict: 'user_id,app_key' })
          .select('updated_at').maybeSingle()
          .then(function (r) {
            if (r && !r.error && r.data) { m[key] = m[key] || {}; m[key].synced = r.data.updated_at; saveMeta(m); }
          }, function () {})
      );
    });
    return Promise.all(jobs);
  }

  function pullAll() {
    if (!Cloud.client || !Cloud._user || !Cloud._keys.length) return Promise.resolve();
    return Cloud.client.from('app_data')
      .select('app_key,data,updated_at')
      .in('app_key', Cloud._keys)
      .then(function (r) {
        if (!r || r.error || !r.data) return;
        var m = meta(), changed = false, missing = Cloud._keys.slice();
        r.data.forEach(function (row) {
          missing.splice(missing.indexOf(row.app_key), 1);
          var localMtime = (m[row.app_key] && m[row.app_key].mtime) || 0;
          var cloudTime = new Date(row.updated_at).getTime();
          // Cloud strictly newer than the local copy → adopt it.
          if (cloudTime > localMtime) {
            try {
              localStorage.setItem(row.app_key, JSON.stringify(row.data));  // wrapper will mark local; that's fine
              m = meta(); m[row.app_key] = { mtime: cloudTime, synced: row.updated_at }; saveMeta(m);
              changed = true;
            } catch (e) {}
          }
        });
        // Keys the cloud has never seen but we hold locally → push them up.
        if (missing.length) pushAll();
        if (changed) reloadOnce();
      }, function () {});
  }

  // After adopting fresher cloud data on load, the app's in-memory state is stale.
  // Reload exactly once per session so it re-reads localStorage. Guarded against loops.
  function reloadOnce() {
    try {
      if (sessionStorage.getItem(RELOAD_FLAG)) { notifyApplied(); return; }
      sessionStorage.setItem(RELOAD_FLAG, '1');
      location.reload();
    } catch (e) { notifyApplied(); }
  }
  function notifyApplied() {
    try { window.dispatchEvent(new CustomEvent('cloud:applied', { detail: { keys: Cloud._keys.slice() } })); } catch (e) {}
  }

  Cloud.init();
  window.Cloud = Cloud;
})();
