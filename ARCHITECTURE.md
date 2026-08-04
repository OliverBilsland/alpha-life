# Alpha Life — Architecture

No build step, no modules, no bundler, and — since Phase 5 — **no external dependencies at all**.
`index.html` is a bare DOM skeleton plus one stylesheet link and fourteen `<script>` tags; the scripts are
**classic scripts, not ES modules**, so they share one global scope and the game still opens by
double-clicking the file. The whole thing runs off two surfaces:

- a **canvas** (`#cv`) that draws the city and only the city, and
- a **DOM overlay** (`.ov` / `#sheet`) that draws every interior, rendered by `innerHTML`.

The two never run at once. `inRoom` is the switch: when it's non-null the loop stops simulating and
stops drawing, and the sheet owns the screen.

---

## 1. File layout

`index.html` — canvas, HUD stat pods, `#prompt`, `#toast`, `#stick`/`#knob`/`#actBtn`, `#exitBtn`,
`#ov`/`#sheet`, `#newBtn`. Everything else in the UI is generated at runtime.

`css/game.css` — CSS variables (paper/ink palette, `--process`/`--gain`/`--loss`), HUD, prompt,
toast, touch controls, and the whole interior design system: `.co` company cards, `.rz` choice
buttons, `.reveal` result panel, `.ledger`, `.grid2` quadrant grid, one mobile breakpoint at 660px.

The scripts, **in load order** — the order is load-bearing, see below:

| File | What's there |
|---|---|
| `js/data.js` | `REASONS` (4 thesis drivers), `S` (20 scenarios), `ITEMS` (5 purchasables) |
| `js/world.js` | `W`/`H` (4200x2400), `DISTRICTS`, `B` buildings, `ROADS` |
| `js/cars.js` | `CARS` tiers, trips budget, district gating, `roomDealer()` |
| `js/econ.js` | cross-cutting money maths: `housingMonthly()`, `jobPay()`, `fixedCosts()` |
| `js/state.js` | tuning constants, all mutable globals, `$`/`money`/`shuffle`, `expenses()`/`income()`, `hud()`, `toast()` |
| `js/city.js` | `resize()`, `draw()`, `door()`, `nearBuilding()`, `blocked()`, keyboard + touch input, `step()`, `promptFor()` |
| `js/rooms.js` | `enter()`/`leave()`, `roomShop`, `roomVenue`, `roomApt` |
| `js/generate.js` | `genScenario()`, `validate()`, sector/prose banks, `scenarioAt()` deck router |
| `js/market.js` | `roomOffice()`, `sync()`, `sigHTML()`, `commit()` — the actual game |
| `js/tutorial.js` | `TUT` coach steps, `tutPanel()`/`tutAfter()`/`tutBind()`, `roomRef()` reference screen |
| `js/fund.js` | arc-2 constants, `startFund()`, `fundMonthEnd()`, `roomFundOffer()`, `fundFinish()` |
| `js/ledger.js` | `payday()`, `renderPayday()`, `finish()` |
| `js/feel.js` | `moment()` beat layer, HUD pulse wrapper — presentation only |
| `js/boot.js` | shuffle the deck, paint HUD, start the loop, tutorial toast |
| `js/persist.js` | localStorage save/load, autosave wrappers, `newGame()` |
| `js/shell.js` | title screen, pause/resume, lifecycle |

**Why the order matters.** Almost nothing executes at parse time — the files are overwhelmingly
`function` declarations and `const`/`let` initializers — but three things do:

- `city.js` runs `resize()` immediately and does `const cv=$('cv')`, so it must follow `state.js`
  (which defines `$`) and the DOM (all scripts sit at the end of `<body>`).
- `boot.js` starts the game, so it must follow everything it calls.
- `shell.js` must come **after** `persist.js` — it reads persist's own `saved` result to tell a
  fresh run from a resumed one. Re-reading storage would not work, because persist writes an initial
  save on a fresh boot.
- `persist.js` must come **after** `boot.js`. `boot.js` shuffles a fresh deck and calls `hud()`; if
  the autosave wrapper were already installed, that call would overwrite the save with default state
  before it was ever read.

Top-level `let`/`const` in a classic script live in the shared global lexical environment rather than
on `globalThis`, which is why `persist.js` can assign `port`, `idx`, `order` and the rest by bare
name across file boundaries, and why `quad`/`P` (declared `const`) must be mutated in place instead.

---

## 2. The render loop

`step()` (`city.js:94`) is the only `requestAnimationFrame` callback, and it always re-schedules itself. It is
guarded:

```js
if(!inRoom && !gameOver){ …movement, prompt, draw()… }
requestAnimationFrame(step);
```

So the world simulates and repaints only while you're outdoors and alive. Inside a room the rAF keeps
ticking but does nothing — which is why interiors cost nothing and why the world is frozen exactly as
you left it when you walk back out.

Per frame, in order:

1. **Read input.** `dx`/`dy` are assembled from WASD + arrow keys + the touch vector `tv`, summed.
   Diagonals are normalized (`if(m>1)`), and facing (`P.dir`) only updates above a 0.08 deadzone so
   the sprite doesn't spin when the stick recenters.
2. **Move with axis separation.** `P.x` and `P.y` are tested independently against `blocked()`, so
   sliding along a wall works instead of sticking.
3. **Proximity prompt.** `nearBuilding()` toggles `.prompt.on` and fills it with the building name
   plus a *context line* from `promptFor(b)` — sessions remaining, price of a drink, whether you
   already own the car. The mobile `#actBtn` gets `.live` off the same test.
4. **`draw()`.**

`draw()` (`city.js:8`) is immediate-mode, painted fresh every frame, in strict painter's order:

- clamp a camera to `P` and the world bounds, `translate(-cam.x,-cam.y)`;
- ground: a 200px grid of inset 192px blocks, giving the gutters that read as sidewalks;
- roads: filled `ROADS` rects, then a dashed centreline drawn along the long axis (`r.w>r.h` picks
  horizontal vs vertical);
- buildings: offset dark rect as a drop shadow, body in `b.c`, a darker header band, a procedural
  window grid from nested `for` loops, a white door slab at `door(b)`, name inside the header, and
  the `b.s` subtitle beneath the footprint;
- player: `translate`+`rotate` to `P.dir`, then either a red car body with headlights or a white
  circle with a blue facing nub.

There is no sprite sheet, no image asset, no z-sorting, and no dirty-rect logic — the whole city is
cheap enough to repaint every frame. `resize()` handles DPR (capped at 2) by scaling the backing
store and calling `setTransform` once.

---

## 3. Collision and proximity

Three tiny functions do all the spatial work, and they are deliberately not a physics system.

```js
door(b)          // {x: b.x+b.w/2, y: b.y+b.h+4}  — bottom-centre, just outside the wall
nearBuilding()   // first b where hypot(P - door(b)) < 62
blocked(x,y)     // any building AABB inflated by 14px, or within 16px of the world edge
```

- **Buildings are AABBs inflated by 14px.** That padding is the player's radius; it's why you never
  visually overlap a wall.
- **The door is a point, not a trigger volume.** Entry is a 62px radius circle around a point 4px
  below the building's bottom edge — outside the blocked region, so you can always physically reach
  it. Doors face south, always, which is why every building has clear space beneath it.
- **`nearBuilding()` returns the first match**, so overlapping doors would be ambiguous; the layout
  in `B` keeps them far apart.
- **The world edge is a fourth wall** folded into the same function (`x<16 || y>H-16 …`).

Entry is never automatic. `blocked()` keeps you out of the footprint; `nearBuilding()` only *offers*;
`enter()` is called explicitly from the E/Enter keydown handler or the touch `#actBtn` click.

---

## 4. The room system

A "room" is not a place — it's a string in `inRoom` plus one HTML string written into `#sheet`.

```
enter(b)  →  inRoom = b.id
             #ov.on, #exitBtn.on, hide prompt
             dispatch on b.id to a room renderer
leave()   →  inRoom = null, hide overlay, P.y += 30, hud()
```

`enter()` (`rooms.js:2`) is a flat if/else chain mapping the eight building ids onto **four renderer shapes**:

| Renderer | Buildings | Shape |
|---|---|---|
| `roomOffice()` | office | the market screen — the actual game |
| `roomApt()` | apt | ledger preview + `payday()` trigger |
| `roomVenue(title,sub,cost,gain,copy)` | bar, club | pay cash → gain focus → auto-`leave()` |
| `roomShop(title,sub,ids)` | dealer, school, realtor, tech | buy from `ITEMS` by id list |

Two parameterized renderers cover six of the eight buildings; only the office and the apartment are
bespoke. Adding a shop is one `B` entry, one `ITEMS` entry, one `enter()` branch, one `promptFor()`
line.

**Rendering discipline:** every room writes a full `innerHTML` string, then immediately re-queries
and binds listeners on the nodes it just created. Nothing is diffed and nothing is retained, so any
state change re-renders the whole sheet — `roomShop` literally calls itself after a purchase
(`rooms.js:38`), and `renderPayday` calls itself after each invest/withdraw click. Listeners die with the
nodes, so there's no accumulation.

`leave()` nudges `P.y += 30` so you step *out* of the door radius; without it `nearBuilding()` would
still be true and the prompt would re-fire immediately.

**`'payday'` is a pseudo-room.** `payday()` sets `inRoom='payday'` — an id no building has — and
hides `#exitBtn`. Both the Escape handler (`city.js:73`) and the exit-button handler (`rooms.js:18`) explicitly check
`inRoom!=='payday'`, so the month-end settlement is the one screen you cannot walk out of. `finish()`
leaves `gameOver=true` and the overlay up; the only exit is `location.reload()`.

---

## 5. Economy and state

All state is module-level `let`s in `state.js` — there is no state object, just named globals.
Serialization is bolted on from outside by `persist.js` (§7) rather than designed in; the game files
themselves have no idea they're being saved.

**Portfolio vs cash are two different pools with two different physics.** This is the central
economic idea and most of the code enforces it.

- `port` moves *only* from trading (`commit`), from explicit transfers at payday, and from forced
  liquidation.
- `cash` moves from salary/expenses at payday, and from purchases.

**Monthly flow.** `income()` and `expenses()` are computed, never stored:

```js
income()   = salary(2400) + (owned.car ? 1800 : 0) + (appLive ? 700 : 0)
expenses() = rent(1200)   + (owned.car ?  150 : 0) + (owned.apt ? 600 : 0)
```

Every purchase either changes one of these two lines or changes the office screen — nothing is
cosmetic. `payday()` (`ledger.js:2`) applies `cash += income() - expenses()`, ticks `appLeft` (and flips
`appLive` when it hits 0), and then does the punishing bit: **if `cash` goes negative, the gap is
liquidated from `port` and reported as `forced`.** Lifestyle overruns are paid for out of compounding
capital, visibly.

**Trading math** lives entirely in `commit()` (`market.js:49`):

```js
size  = port * CONV[conv].pct        // .10 / .25 / .45
delta = won ? size * .25 : -size * .18
```

Position size is a *percentage of portfolio*, so the stakes scale as you compound — and asymmetric
win/loss ratios (WIN_R .25 vs LOSE_R .18) mean a coin-flip player drifts up slowly while a bad
process still bleeds. `peak`/`maxDD` are tracked here and only surface at `finish()`.

**Time.** `sessionsLeft` (5) counts down per commit; `month` (of 4) advances at payday;
`ROUNDS_PER_MONTH * MONTHS === 20 === S.length`, so a full playthrough consumes the deck exactly
once. The apartment lets you sleep early and *forfeit* remaining sessions — the ledger preview in
`roomApt()` exists to make that trade legible before you take it.

**Focus** (0–5) decays in `commit()`, one per session, halved to every other session by `owned.apt`
(`focus-(owned.apt?(idx%2?1:0):1)`). It is the only stat spent in one system (the office) and
restored in another (bar/club), which is what makes venues economically real rather than flavour.

`hud()` is the single reconciliation point: five DOM writes plus semantic classes (`.up`/`.down` on
portfolio, `.warn` on cash when it can't cover next month's expenses, `.warn` on focus below 3). It
is called after every mutation.

---

## 6. The scenario bank

`S` (`data.js`) is 20 flat objects, one per sector, and it's the game's content payload.

```js
{
  sector : 'Semiconductors',
  a: { t:name, d:blurb, g:growth%, m:margin%, l:debt/EBITDA, p:P/E, f:cash conversion% },
  b: { …same shape… },
  better : 'a'|'b',    // which company is genuinely the better business
  driver : 'growth'|'profit'|'balance'|'value',   // which axis makes it better
  market : 'a'|'b',    // which one the market actually rewarded
  street : '…',        // terminal-only line: how the crowd is positioned
  why    : '…',        // the teaching paragraph, always shown
  twist  : '…'         // optional: shown when process and outcome diverge
}
```

The three keys that matter are **`better`, `driver` and `market`**, and the design lives in the fact
that they're independent:

- `pick === s.better && reason === s.driver` → **sound process**. Both halves required, so picking the
  right company for the wrong reason scores as unsound (the reveal calls this out by name).
- `pick === s.market` → **money**. Set separately, so `better !== market` is a scenario where the
  right answer loses.

Six of the twenty carry a `twist` — and every one of those is a scenario where `better !== market`
(Vella, Atelier, Tandem, Cascade, Westmark). The twist paragraph is the apology the game owes you for
punishing a correct read.

**Deck handling** is deliberately minimal: `order = shuffle([...S.keys()])` at boot, and `idx`
advances monotonically. `S[order[idx]]` is the current scenario. Sector order varies between runs;
the scenarios themselves never do.

### 6b. The generator

`generate.js` extends the bank indefinitely. `scenarioAt(i)` is the single entry point the office
uses: `i < S.length` returns the authored case at `order[i]`, anything beyond is generated. Because
the intro arc is exactly `ROUNDS_PER_MONTH * MONTHS === S.length === 20`, the authored set is always
the whole first playthrough and generated cases only appear in the fund arc (§6c).

Scenarios are a **pure function of `(genSeed, i)`** via `mulberry32`, so nothing is stored — only the
seed is saved, and the same seed replays the same run forever. `genCache` memoises within a session
so `roomOffice()` and `commit()` cannot disagree about what the player is looking at.

The generator **constructs and then validates** rather than sampling and hoping. Two invariants that
the authored set only satisfies implicitly are enforced explicitly:

1. **One deciding metric.** The better company's advantage on the driver axis must be ≥1.15
   scale-units *and* ≥1.7× the largest advantage on any other axis. Scoring requires the player to
   name the axis, so an ambiguous case would be an unfair loss. Advantages are normalised per axis
   (growth ÷20, margin ÷10, leverage ÷2.0, P/E ÷12) with `dir:-1` for the two where lower is better.
2. **A tempting wrong answer.** The other company must win on ≥2 of the remaining 3 axes, so the
   trap is always baited.

Construction picks the driver, samples the loser inside sector bands, then places the better company
at a forced gap on the driver and *behind* on two trap axes. Band clamping can eat the gap at an
edge, so the loser is pushed away instead; the loop re-validates and widens up to 24 times. Measured
over 20,000 cases: zero ambiguous, zero untrapped, weakest driver lead 1.20 scale-units.

`market` disagrees with `better` 25% of the time and a `twist` is attached exactly when it does.
Cash conversion deliberately **flatters the loser** on growth and value calls — the mature-but-melting
pattern the authored Caldwell and Alden cases use — and supports the winner on profit and balance calls.

### 6c. Arc 2 — outside capital

`fund.js` adds a second arc gated on a **process** bar: `soundCount() >= 12` of 20. Money is never
the gate, which is the whole point. Below the bar the game ends exactly as it did before.

`arc` is the switch. In arc 2, `sizeBase()` returns `aum` instead of `port`, so a position is ~25×
an intro trade; the personal portfolio rides at the same *return* (`port += port * delta/aum`) rather
than the same amount, so the player keeps skin in the game without double-counting. `income()` drops
the salary and pays `fundFee()` — 0.3%/month of AUM plus 20% of a positive month, never clawed back.
A flat month does not cover rent, by design.

`fundMonthEnd()` runs once per payday and is where investors react. **Redemptions are triggered by
volatility, not by being wrong** — a −10% month, 3-month return stdev over 9%, a peak-to-trough
drawdown over 18%, or two consecutive down months, capped at 30% combined. A quiet strong month
(≥8%, low vol, near the peak) brings 8% of new subscriptions in. Below `AUM_FLOOR` the fund closes
and the run ends.

The drawdown trigger exists specifically so position size is a real decision. Measured over 60 runs
per cell, high conviction for a competent player carries **15% closure risk for the same 68%
strong-win rate** as standard sizing — strictly worse. For a coin-flip player it is 68% closure.
Without that trigger, size had no downside at any skill level.

### 6f. Districts and cars

The city is 4200x2400 across five districts. `districtAt(x)` maps a coordinate to a district, and
`blocked()` returns true for any district whose `req` exceeds `carTier` — so an unreachable district
is **physically unreachable**, not merely discouraged. `nearGate()` drives the prompt that explains
which car opens it.

A car tier buys four separate things, which is why it is never a stat bump: district access, speed
(1.9 → 8.2, on a map big enough that it matters), **trips** — a monthly errand budget that every
non-office visit spends — and a running cost that scales from $150 to $3,200 a month.

Trips are the mechanical answer to "what is reachable per session". `FREE_VISITS` exempts the office
and home; everything else costs one, refilled at month rollover by `tripsPerMonth()`. So a better car
literally buys more decisions per month, and the exotic's monthly burden is larger than the starting
apartment's rent.

**Metric gating** is what the shop items plug into, and it's all read at render time in `roomOffice`:

- `f` (cash conversion) renders as `locked` italic text unless `owned.acct`;
- `street` renders as a whole block only if `owned.term`;
- `red = focus<3 ? (focus<1 ? ['m','l'] : ['m']) : []` blanks margin, then leverage, to an em dash.

Growth and P/E are never hidden — you always have enough to make *a* call, just not always enough to
make the right one. Note the asymmetry: focus hides metrics you'd otherwise have, purchases reveal
metrics you'd otherwise never see.

---

## 6a. Onboarding

`tutorial.js` holds three coach steps in `TUT`, one per idea, keyed to the first three trades
(`tutActive() === tutOn && idx < 3`). `roomOffice()` calls `tutPanel()` above the cards and
`commit()` calls `tutAfter()` inside the reveal, so each idea is introduced before a trade and
closed out after it. Order: metrics and the reason requirement → sizing and the process/outcome
split → focus decay and redaction.

The panel carries its own **Skip tutorial** button; skipping sets `tutOn=false`, which persists.
Nothing in `TUT` touches trade maths — it is presentation only, so the tutorial cannot alter a
result.

`roomRef()` is the permanent reference, reachable from a **How scoring works** button in the office
header (including when the desk is closed). It reads `CONV`, `WIN_R` and `LOSE_R` live rather than
restating them, so it cannot drift from the balance. It's hidden during a reveal — `commit()` sets
`#refBtn` to `display:none` alongside `#go` — so navigating away can't discard an explanation the
player is mid-way through reading.

---

## 6d. Feel

`feel.js` is presentation only and reads game state solely to notice a displayed number changed. It
wraps `hud()` a second time (persist.js wraps it again later, which composes fine) and pulses any HUD
figure whose value moved, marking falls with a separate keyframe.

`moment(big, small)` is a full-screen beat, deliberately rationed. Only the car uses it: buying it
now calls `leave()` and drops the player straight onto the street, because the point of the purchase
is the drive, not a receipt.

Transitions moved the overlay from `display:none` to `visibility`+`opacity` so it can animate;
`pointer-events` is toggled with it so a hidden overlay can never swallow a click. The canvas gained
a headlight cone while driving and a highlight on the door you're in range of — both pure `draw()`
additions with no state.

**Hover rules are gated behind `@media (hover:hover)`.** Ungated `:hover` sticks after a tap on
touch devices, so every hover rule was moved and `:active` press states added in their place. Touch
targets grow under `@media (pointer:coarse)` and the controls respect `env(safe-area-inset-*)`.
`prefers-reduced-motion` collapses every animation added here.

---

## 6e. Shell and lifecycle

`step()` is gated on two flags declared in `state.js`: `splashDone` and `paused`. They live there
rather than in `shell.js` on purpose — `boot.js` starts the loop before `shell.js` parses, so a flag
declared in `shell.js` would be in the temporal dead zone when `step()` first ran. An earlier version
wrapped `step()` instead and leaked exactly one frame of simulation before the gate applied.

The loop still calls `draw()` while gated, only skipping `simulate()`, so the city is rendered and
ready underneath the title screen rather than appearing on dismissal.

`shell.js` shows the title screen (*Begin*, or *Continue* with a live summary of where the save left
off), and pauses on `visibilitychange`/`pagehide`, saving as it goes. Returning to a room auto-resumes
because rooms are static; returning to the city waits for an explicit tap so the player is not dropped
mid-drive.

**Offline is a hard constraint.** There are no webfonts, no CDN, no `fetch`. Canvas text uses
`CANVAS_COND`/`CANVAS_MONO` system stacks mirroring the CSS fallbacks. `SHIP.md` documents how to
self-host IBM Plex to restore the intended typography.

---

## 7. Persistence

`persist.js` mirrors the game into `localStorage` under `alphalife.save.v1`. It is deliberately
**parasitic**: it edits none of the game files and adds no state of its own to them. Instead it
wraps two existing globals.

```js
const _hud=hud;       hud    = function(){ _hud.apply(null,arguments);    save(); };
const _finish=finish; finish = function(){ _finish.apply(null,arguments); save(); };
```

This works because top-level `function` declarations in a classic script are writable properties of
`globalThis`, and every call site resolves the name at call time. `hud()` is already the
reconciliation point called after every state mutation (§5), so wrapping it captures the entire
economy for free. `finish()` needs its own wrapper only because it sets `gameOver` without calling
`hud()`.

**Player position is polled, not wrapped.** `P` changes 60×/sec, so a `setInterval` writes at most
every 800ms and only when the position actually moved, plus a `pagehide` / `visibilitychange` flush
so the last few steps survive a tab close.

**Saved:** `order`, `idx`, `port`, `cash`, `xp`, `streak`, `best`, `focus`, `owned`, `appLeft`,
`appLive`, `sessionsLeft`, `month`, `monthPnl`, `peak`, `maxDD`, `conv`, `gameOver`, `quad`, and
`P.{x,y,dir,driving}` — about 440 bytes of JSON.

**Not saved, on purpose:** `pick`/`reason`/`locked` (reset by `roomOffice()` on entry, so persisting
them is meaningless); `salary`/`rent` (declared `let` but never reassigned — saving them would pin a
future balance change to old saves); `P.vx`/`P.vy` (declared, never written).

**Three restore paths**, in `persist.js`'s tail:

| Saved condition | On load |
|---|---|
| `gameOver` | re-render the end screen and show the overlay |
| `inRoom === 'payday'` | re-render the payday screen |
| anything else | resume outdoors at the saved `P` |

The payday case is a **correctness requirement, not a nicety**. `payday()` charges the month's bills
and ticks `appLeft` *before* rendering, but `month++` and the `sessionsLeft` reset happen later in the
OK handler. Resuming outdoors from inside that gap would let the player sleep again and pay the same
month twice. It's the only room worth restoring — every other one is freely re-enterable, and the
office mid-reveal loses only its explanation text, never a committed trade.

The game-over case matters for a subtler reason: `step()` early-returns on `gameOver`, so without
re-rendering the end screen the player would resume staring at a frozen city with no overlay and no
way forward.

**Invalidation.** A save is rejected — and the game starts fresh — if the version key doesn't match,
the JSON is malformed, or `order.length !== S.length`. That last check means editing the scenario
bank can't resume a player into out-of-range deck indices. Every storage access is wrapped in
`try/catch`, so if `localStorage` is unavailable the game runs exactly as it did before, with saving
silently disabled.

`newGame()` clears the key and reloads. It's reachable from `#newBtn` in the HUD (behind a
`confirm()`) and from the end screen's **Play again** button — which *had* to change from
`location.reload()`, because with saves in place a plain reload just restores `gameOver` and
re-renders the same ending.

---

## 8. Control flow, end to end

```
boot ──▶ shuffle deck, hud(), step() ──rAF───────────┐
   │                                                 │
   ▼                                                 │
persist ─ no save ──▶ write the first save           │
   │                                                 │
   └ save ──▶ applySave() ──┬─ gameOver ──▶ finish() screen
                            ├─ 'payday'  ──▶ renderPayday()
                            └─ else      ──▶ resume outdoors
                                   │                 │
        then wrap hud() / finish() ─┘                 │
                                                     │
          │  E / tap                                 │
          ▼                                          │
        enter(b) ──▶ inRoom set, loop idles ◀────────┘
          │
   ┌──────┼───────────────┬──────────────┐
   ▼      ▼               ▼              ▼
 shop   venue         roomOffice       roomApt
 buy    pay→focus      pick/reason/size  │
   │      │                │             │
   │    leave()         commit()         │
   │                    ├ port, quad,    │
   │                    │ focus, idx,    │
   │                    │ sessionsLeft   │
   │                    └ Next → roomOffice
   ▼                                     ▼
 leave() ──▶ inRoom=null, loop resumes  payday()  (no exit)
                                          │
                                  month<4 ├──▶ month++, P reset to spawn, resume
                                  month=4 └──▶ finish()  (gameOver → Play again)

every path above that reaches hud() or finish() writes a save;
position autosaves separately on an 800ms poll
```

---

## 9. Known quirks worth knowing before refactoring

- **Order of operations in `commit()`:** focus decays using the *pre-increment* `idx` (`market.js:58`),
  then `idx++` at `market.js:78`. Changing that order silently shifts which sessions the apartment
  protects.
- **The `Next` button's branch is a no-op:** `if(sessionsLeft>0&&idx<S.length) roomOffice(); else
  roomOffice();` (`market.js:79`). `roomOffice()` self-guards on `sessionsLeft<=0`, so the behaviour is correct;
  the condition is vestigial.
- **`owned.car` and `P.driving` are two representations of one fact.** Both are saved independently;
  if they ever disagree, the car exists in the ledger but not on the road.
- **Room renderers close over their own arguments to re-render themselves** (`roomShop(title,sub,ids)`
  calling itself). Any split must keep those arguments reachable.
- **`conv` only reaches storage on the next `hud()`.** The position-size buttons don't call `hud()`,
  so a size change is persisted at the next commit — which is the value that was actually used, so
  the saved state is never wrong, just written late.
- **Anything that mutates state without calling `hud()` will not autosave.** That's the one
  invariant `persist.js` depends on. New code that changes the economy must either call `hud()` (as
  every existing path does) or `save()` directly.
- **Everything is a global.** `pick`, `reason`, `conv`, `locked` are office-scoped in meaning but
  file-scoped in fact, and `roomOffice()` resets them on entry (`market.js:9`).
