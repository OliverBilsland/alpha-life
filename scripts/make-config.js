#!/usr/bin/env node
/* ==================== DEPLOY-TIME CONFIG GENERATOR ====================

   Writes js/config.js from environment variables, so the Supabase values can
   live in Vercel's dashboard instead of in a public git repo.

   WHY THIS EXISTS. js/config.js is gitignored, so it is absent from the
   deployed checkout and its <script> tag 404s — the game then runs in its
   offline single-player form, which is correct locally but not what you want
   on a public deployment. This regenerates the file at build time.

   WHAT THIS IS NOT. The publishable key is not a secret and this does not make
   it one: it ships to every browser that loads the game and is visible in
   DevTools. What protects the table is the Row Level Security policy set in
   SHIP.md §8.2, not the obscurity of the key. The point of this script is repo
   hygiene — no keys in git, no secret-scanner noise, and rotation without a
   commit.

   NO DEPENDENCIES, and none may be added — the project has no package.json and
   this must keep working with a bare `node scripts/make-config.js`.

   FAILS SOFT. If the variables are absent, this warns and exits 0 without
   writing. A deploy with no config is a playable offline game, which is the
   documented fallback (SHIP.md §1), not a broken build. It fails HARD only for
   a secret key, which would be a genuine security incident. */

'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'js', 'config.js');

const rawUrl = (process.env.SUPABASE_URL || '').trim();
const rawKey = (process.env.SUPABASE_ANON_KEY || '').trim();

/* ---------- fail soft: no config means an offline deploy ---------- */
if (!rawUrl || !rawKey) {
  console.warn(
    '[make-config] SUPABASE_URL and/or SUPABASE_ANON_KEY are not set.\n' +
    '[make-config] Skipping js/config.js — the deploy will be the offline\n' +
    '[make-config] single-player game with no leaderboard. Set both in\n' +
    '[make-config] Vercel -> Settings -> Environment Variables to enable it.'
  );
  process.exit(0);
}

/* ---------- fail hard: a secret key must never reach a browser ----------
   Two shapes to catch. The new format is prefixed. The legacy format is a JWT
   whose payload names the role, so decode it rather than guessing. */
function isSecretKey(key) {
  if (/^sb_secret_/i.test(key)) return true;
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
      );
      if (payload && payload.role === 'service_role') return true;
    } catch (e) { /* not a JWT we can read; fall through */ }
  }
  return false;
}

if (isSecretKey(rawKey)) {
  console.error(
    '[make-config] REFUSING TO BUILD: SUPABASE_ANON_KEY holds a SECRET key\n' +
    '[make-config] (sb_secret_... / service_role). That key bypasses Row Level\n' +
    '[make-config] Security and this file is served to every visitor. Replace it\n' +
    '[make-config] with the publishable (anon) key and rotate the leaked one.'
  );
  process.exit(1);
}

/* ---------- normalise the URL ----------
   js/online.js appends '/rest/v1/' and js/live.js appends
   '/realtime/v1/websocket', so this must be the bare project origin. The
   dashboard shows the REST endpoint with the path already on it, which is an
   easy thing to paste by mistake; strip it rather than deploy a broken site. */
let url = rawUrl.replace(/\/+$/, '');
const trimmed = url.replace(/\/(rest|realtime|auth|storage)\/v\d+$/i, '');
if (trimmed !== url) {
  console.warn('[make-config] Stripped an API path from SUPABASE_URL — using the project origin.');
  url = trimmed;
}

if (!/^https:\/\//i.test(url)) {
  console.error('[make-config] REFUSING TO BUILD: SUPABASE_URL must start with https:// — got ' + JSON.stringify(rawUrl));
  process.exit(1);
}

/* ---------- write ----------
   JSON.stringify does the escaping, so a stray quote in a value cannot break
   out and produce a syntactically invalid file. */
const body =
  '/* GENERATED AT DEPLOY TIME by scripts/make-config.js — do not edit, and do\n' +
  '   not commit. Values come from the SUPABASE_URL and SUPABASE_ANON_KEY\n' +
  '   environment variables. Locally this file is yours to write by hand; see\n' +
  '   js/config.example.js. */\n\n' +
  'window.ALPHA_CONFIG = {\n' +
  '  SUPABASE_URL:      ' + JSON.stringify(url) + ',\n' +
  '  SUPABASE_ANON_KEY: ' + JSON.stringify(rawKey) + ',\n' +
  '};\n';

fs.writeFileSync(OUT, body, 'utf8');

/* Never log the key itself — build logs are retained and often shared. */
console.log('[make-config] Wrote js/config.js for ' + url + ' (key ' + rawKey.slice(0, 12) + '…, ' + rawKey.length + ' chars)');
