# Shipping Alpha Life to the App Store

Alpha Life is a static web app: HTML, CSS, and a set of classic `<script>` files. **No build step, no
bundler, no dependencies, no network access at runtime.** That makes wrapping it straightforward, but
Apple will not accept a plain website — the sections below cover what has to be added and exactly how.

Everything in *Verified offline* is already done in this repo. Everything from *Wrapping* onward
requires a Mac, Xcode, and a paid Apple Developer account, none of which I can run from here.

---

## 1. Verified offline

**The invariant changed in the online phase, and it changed narrowly. Read this before assuming
either the old or the new version of it.**

- **The game** — the whole single-player loop: city, rooms, market, payday, tutor, save/resume —
  still makes **zero network requests**, and must keep making zero. Nothing in the core loop is
  allowed to call out, wait on a response, or degrade when there is no network.
- **The optional online layer** — leaderboard and live players, both set up in §8 — does make requests, but
  only when `js/config.js` exists with real Supabase keys in it. That file is **gitignored and
  absent on a fresh clone**, so out of the box the game still makes zero requests and the old
  invariant holds exactly as before.

So the honest statement is now: *no network dependency*, rather than *no network code*. The game
never needs the network; it can optionally use it.

Confirmed by grep across `index.html`, `css/game.css` and `js/`: no `import()`, no `type="module"`,
no remote `<script src>` or `<link href>` — every asset is local, and the game still opens from
`file://` by double-clicking. The only files containing `fetch`/`WebSocket` are `js/online.js` and
`js/live.js`, both of which return early when unconfigured.

**If you are shipping to the App Store and want the old guarantee back**, delete `js/config.js` (or
never create it) and the app is network-free again with no code changes. See §8.5 for the privacy
declarations you need if you *do* ship the online layer.

The Google Fonts links were removed in Phase 5. The trade-off: **IBM Plex is no longer used**, and the
CSS falls back to system stacks (`-apple-system` / SF Pro on iOS, condensed falls back to Avenir Next
Condensed). Canvas text uses the same stacks via `CANVAS_COND` / `CANVAS_MONO` in `js/city.js`.

**To restore the exact original typography**, self-host the fonts — do not re-add the CDN links, they
break offline use and add a third-party tracker Apple will ask about:

1. Download IBM Plex (SIL Open Font License) from `github.com/IBM/plex/releases`.
2. Put `IBMPlexSans-Regular/Medium/SemiBold`, `IBMPlexSansCondensed-Bold`, and
   `IBMPlexMono-Regular/Medium/SemiBold` as `.woff2` into `assets/fonts/`.
3. Add `@font-face` blocks at the top of `css/game.css` with `font-display:block` and
   `src:url("../assets/fonts/....woff2") format("woff2")`.
4. The `--sans` / `--cond` / `--mono` variables already list the IBM Plex families first, so nothing
   else changes. Ship the OFL licence text in the bundle.

**Verify offline before every release:** open DevTools → Network, tick *Offline*, hard-reload. The
game must boot, play a full month, save, and resume. Also open `index.html` directly by
double-clicking (`file://`) — it must work there too, since a `file://` failure usually means
something crept in that needs a server.

Do that check **twice**: once with `js/config.js` absent, and once with it present and pointing at a
host that cannot be reached. Both must play identically. The second is the one that catches an online
feature that has quietly become load-bearing — if the game stalls, blocks on a spinner, or throws
with the network off, something in the core loop started waiting on the online layer and needs to be
put back behind a fail-soft path.

---

## 2. What is already in the repo

| Asset | Location | Notes |
|---|---|---|
| App icons, 15 sizes | `assets/icons/icon-<N>.png` | Opaque, truecolour, square, no alpha, no rounded corners |
| Web manifest | `manifest.webmanifest` | `display:fullscreen`, theme `#0E1013` |
| Title / loading screen | `#splash` in `index.html`, `js/shell.js` | Shows *Continue* with a live save summary, else *Begin* |
| Lifecycle | `js/shell.js` | Saves on hide/blur/pagehide; the game does not pause |
| iOS web-app meta | `index.html` `<head>` | `apple-mobile-web-app-capable`, status bar style, apple-touch-icon |
| Safe-area handling | `css/game.css` | `env(safe-area-inset-*)` on HUD, joystick, action button, sheets |

The icon is the decision-quality quadrant — green / blue / grey / red — which is the game's core idea
rendered as a mark. It is generated, not drawn by hand, so it re-renders cleanly at any size.

---

## 3. Apple-required assets

### 3.1 App icon

Xcode 14+ needs **only the 1024×1024** in the asset catalog ("Single Size"); it derives the rest. The
smaller PNGs here are for a manual catalog or non-Xcode toolchains.

Hard requirements, all satisfied by the generated files:

- 1024×1024 PNG, **no alpha channel**, no transparency.
- **Square, with square corners** — iOS applies the rounded mask itself. Never pre-round it.
- No drop shadow, no border, sRGB, flattened.

### 3.2 Launch screen — **required, and the most common rejection**

iOS will not accept a launch *image* for new submissions; it must be a **launch storyboard** (or
SwiftUI equivalent). Do not screenshot the splash and use it as an image.

In Xcode: *File → New → File → Launch Screen*, then:

- Set the view background to `#0E1013`.
- Add a centred image view with the 1024 icon, constrained to ~74×74pt, centre X and Y.
- Optionally a label "ALPHA LIFE", 16pt, letter-spaced, colour `#EDEFEA`, below the mark.
- Set it as *Launch Screen File* in the target's General tab.

Keep it static and nearly empty — Apple rejects launch screens that look like a splash advertisement,
and it must resemble the first frame of the app. The in-app `#splash` is separate and is fine.

### 3.3 Screenshots

Required for App Store Connect. You need **one set** and can reuse it across sizes if the aspect
matches — but a 6.7" set is mandatory.

| Device class | Pixel size (portrait) | Required |
|---|---|---|
| iPhone 6.7" / 6.9" (15/16 Pro Max) | 1290×2796 | **Yes** |
| iPhone 6.5" (11 Pro Max, XS Max) | 1242×2688 | Only if you list older devices |
| iPad Pro 12.9" (2nd gen) | 2048×2732 | **Yes, if the app supports iPad** |
| iPad Pro 12.9" (6th gen) | 2048×2732 | Yes, if supporting iPad |

3–10 per set. Suggested shots, in order: the market screen with two cards; a reveal showing *Sound
process, bad outcome*; the decision-quality quadrant; the city with the car; the fund offer screen.
Capture with the iOS Simulator (`⌘S` saves at the exact required resolution).

### 3.4 Metadata for App Store Connect

- **Name** (30 chars): `Alpha Life`
- **Subtitle** (30 chars): suggestion — `Read the business, not the price`
- **Promotional text** (170), **Description** (4000), **Keywords** (100, comma-separated, no spaces)
- **Support URL** and **Marketing URL** — a support URL is mandatory and must resolve
- **Privacy Policy URL** — mandatory even when you collect nothing
- **Category**: Games → primary; Simulation or Educational as the subcategory
- **Copyright**, **Age rating questionnaire**, **Export compliance**

### 3.5 Privacy

The game collects nothing, has no accounts, no analytics, no ads, no third-party SDKs, and its only
storage is `localStorage` on-device.

- App Privacy → **"Data Not Collected"**.
- No `PrivacyInfo.xcprivacy` manifest is required for the app itself, but **Capacitor or any plugin
  you add may require one** — check each dependency. Required-reason API declarations apply if
  anything touches `UserDefaults`, file timestamps, disk space, or system boot time.
- **Encryption**: set `ITSAppUsesNonExemptEncryption = false` in `Info.plist`. There is no crypto in
  the app; without this key every upload prompts a compliance question.

### 3.6 Age rating

Answer the questionnaire honestly. The game simulates investing, not gambling — there is no wagering
of real money and no purchasable currency. It should land at **4+**, though "Simulated Gambling" is
worth reading carefully; select *None*. If the reviewer disagrees, the fallback is 12+.

---

## 4. Wrapping — Capacitor (recommended)

Capacitor gives a real Xcode project wrapping a `WKWebView`, with no code changes to the game.

```bash
# from the repo root, on a Mac with Xcode + CocoaPods installed
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Alpha Life" com.yourdomain.alphalife --web-dir=.
npx cap add ios
npx cap sync ios
npx cap open ios          # opens Xcode
```

`--web-dir=.` points Capacitor at the repo root, which is already the deployable web root. Because
there is no build step, `npx cap sync ios` after any edit is the entire deploy pipeline.

**Exclude development files from the bundle.** Add a `.gitignore`-style filter or move them, so the
shipped `www` contains only: `index.html`, `manifest.webmanifest`, `css/`, `js/`, `assets/`. Do not
ship `ARCHITECTURE.md`, `DESIGN.md`, `SHIP.md`, or `.git/`.

### Xcode settings to change

1. **General → Identity**: Display Name `Alpha Life`, Bundle Identifier `com.yourdomain.alphalife`,
   Version `1.0.0`, Build `1`.
2. **Deployment Info**: iOS 14.0 minimum is safe. Device orientation — the game is playable in both,
   so leave portrait and landscape on, or restrict to portrait if the screenshots are portrait-only.
3. **Launch Screen File** → the storyboard from §3.2.
4. **App Icon** → drop `icon-1024.png` into `Assets.xcassets/AppIcon`.
5. **Signing & Capabilities** → your team; let Xcode manage signing.
6. **Info.plist** additions:
   ```xml
   <key>ITSAppUsesNonExemptEncryption</key><false/>
   <key>UIRequiresFullScreen</key><true/>
   <key>UIStatusBarHidden</key><true/>
   <key>UIViewControllerBasedStatusBarAppearance</key><false/>
   ```
7. **Capacitor config** (`capacitor.config.json`) — background colour so there is no white flash:
   ```json
   { "appId": "com.yourdomain.alphalife", "appName": "Alpha Life", "webDir": ".",
     "ios": { "backgroundColor": "#0E1013", "contentInset": "never" },
     "server": { "androidScheme": "https" } }
   ```

### Things that behave differently inside WKWebView

- **`localStorage` can be evicted** under storage pressure. The save is ~450 bytes so this is
  unlikely, but for a shipped app consider moving persistence to the Capacitor Preferences plugin,
  which is backed by `UserDefaults` and is not evicted. That is a change to `js/persist.js` only —
  `save()` / `loadSave()` / `newGame()` are the whole surface, and every access is already inside
  `try/catch`.
- **Rubber-band scrolling** on the interior sheets: `contentInset:"never"` plus the existing
  `overflow:hidden` on `body` handles it; verify on a real device.
- **The 300ms tap delay** is gone in modern WKWebView, but confirm the joystick still feels immediate.
- **Safe areas**: already handled in CSS, but `viewport-fit=cover` must be on the viewport meta for
  `env()` to resolve. Add it if the notch area renders wrong:
  `<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">`

---

## 5. Alternatives

**PWA / Add to Home Screen.** Already works — `manifest.webmanifest` and the iOS meta tags are in
place. Host the folder on any static host. No App Store, no fee, no review, but no store presence and
iOS PWA storage is more aggressively evicted.

**Hand-rolled WKWebView shell.** ~40 lines of Swift loading `index.html` from the bundle with
`loadFileURL(_:allowingReadAccessTo:)`. Fewer moving parts than Capacitor and no npm dependency, at
the cost of writing the lifecycle glue yourself. Reasonable here precisely because the game needs no
native APIs.

---

## 6. Submission checklist

- [ ] Offline verified in DevTools and over `file://`
- [ ] Full playthrough on a physical device: intro arc, month rollover, save, force-quit, resume
- [ ] Fund arc reachable and completable; both win and closure endings seen
- [ ] `New game` clears the save and the title screen returns to *Begin*
- [ ] Rotate the device mid-game; rotate inside a room
- [ ] Background the app mid-drive, return, confirm it kept running and the save is intact
- [ ] Icon renders on the home screen with no white corners or halo
- [ ] Launch storyboard shows, with no white flash into the game
- [ ] `ITSAppUsesNonExemptEncryption` set
- [ ] App Privacy → Data Not Collected
- [ ] Screenshots at 1290×2796 (and iPad if supported)
- [ ] Support URL and Privacy Policy URL both resolve
- [ ] Archive → Validate → Distribute to TestFlight; install from TestFlight and replay §6 top to bottom
- [ ] Submit for review

---

## 7. Known gaps

Honest list of what is *not* done:

- **No audio.** There is no sound design at all. Not required, but it is the largest single gap
  between this and a commercial release.
- **No haptics.** A `Haptics.impact()` on commit would carry real weight on iOS.
- **No landscape-specific layout.** It reflows and is playable, but the city viewport is tuned for
  portrait; landscape shows more world than intended.
- **No accessibility pass.** The interior screens are real DOM and mostly keyboard-navigable, but
  there is no VoiceOver labelling, no focus management when a sheet opens, and the canvas city is
  entirely unreadable to a screen reader. This would need addressing before claiming accessibility.
- **No localisation.** Strings are inline English throughout, and the writing is idiomatic enough
  that translation would be a real project rather than a string extraction.
- **IBM Plex is not bundled**, so the shipped typography is not the designed typography until §1 is
  followed.

---

## 8. The online layer — Supabase setup

Both online features are optional and off until you do this. Ten minutes, once.

### 8.1 Create the project

1. Sign in at `supabase.com` → **New project**. Any region near you; the free tier is enough.
2. Wait for it to finish provisioning (~2 min).

### 8.2 Create the table and its policies

Dashboard → **SQL Editor** → **New query** → paste all of this → **Run**.

```sql
create table if not exists public.runs (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  net_worth     bigint      not null,
  process_score integer     not null,
  process_total integer     not null,
  created_at    timestamptz not null default now()
);

-- Ranked by process, so this is the index that matters.
create index if not exists runs_process_idx
  on public.runs (process_score desc, net_worth desc);

alter table public.runs enable row level security;

-- Anyone may read the board.
create policy "runs are readable by everyone"
  on public.runs for select
  to anon
  using (true);

-- Anyone may add a run, but only one that passes these checks. This is the
-- server-side half of the rules in js/names.js: the client is not trusted,
-- because the client is a browser someone else is holding.
create policy "runs are insertable with sane values"
  on public.runs for insert
  to anon
  with check (
    char_length(name) between 3 and 16
    and name !~ '[[:cntrl:]]'
    and process_total between 0 and 500
    and process_score between 0 and process_total
    and net_worth between -1000000000 and 1000000000
  );

-- No updates, no deletes: nothing is granted, so nothing is possible.
```

Note there is deliberately **no `to anon` update or delete policy**. With RLS on and no policy, those
operations are refused outright, so a leaked anon key cannot rewrite or wipe the board.

### 8.3 Paste your keys

Dashboard → **Settings** → **API**. Copy two values:

| Dashboard field | Goes into |
|---|---|
| **Project URL** | `SUPABASE_URL` |
| **Project API keys → `anon` `public`** | `SUPABASE_ANON_KEY` |

Then, in the repo:

```bash
cp js/config.example.js js/config.js     # js/config.js is gitignored
```

and edit `js/config.js`:

```js
window.ALPHA_CONFIG = {
  SUPABASE_URL:      'https://abcdefghijklm.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...',
};
```

Reload. A **Leaderboard** button appears on the title screen — that button's presence is the signal
that the config was read.

**Never paste the `service_role` key.** It bypasses RLS entirely. The `anon` key is meant to be
public and ships in every browser; the policies above are what actually protect the table.

### 8.4 What this costs

Nothing, in practice. The free tier covers 500MB of database and 5GB egress/month. A leaderboard row
is roughly 100 bytes, and the board is read on demand rather than polled.

### 8.5 Privacy declarations, if you ship it

§3.5 changes if the online layer is enabled. You are now collecting a user-supplied display name and
game statistics, linked to nothing else:

- **Data collected:** "Other data" → the display name and run statistics. Not linked to identity, not
  used for tracking.
- You are no longer able to answer "no data collected" on the App Store privacy questionnaire.
- Supabase is a third-party processor; name it in your privacy policy.

If you would rather not deal with any of that, ship without `js/config.js` and the answer stays "no
data collected".
