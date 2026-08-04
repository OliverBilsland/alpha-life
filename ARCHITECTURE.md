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
| `js/art.js` | the entire canvas layer: palette, ground, roads, lamps, buildings, character, car |
| `js/cars.js` | `CARS` tiers, trips budget, district gating, `roomDealer()` |
| `js/activities.js` | nightclub, restaurants, monthly events, street encounters, tips |
| `js/social.js` | `rep`/`contacts`, gym, club, galas, Headland, exchange floor, base-rate display |
| `js/careers.js` | `JOBS` ladder, `promote()`, credit line, `roomBank()`, `roomRecruit()` |
| `js/housing.js` | `HOMES` tiers, focus slope/ceiling, research actions, hosting, `roomRealtor()` |
| `js/econ.js` | cross-cutting money maths: `housingMonthly()`, `jobPay()`, `fixedCosts()` |
| `js/state.js` | tuning constants, all mutable globals, `$`/`money`/`shuffle`, `expenses()`/`income()`, `hud()`, `toast()` |
| `js/city.js` | `resize()`, `draw()`, `door()`, `nearBuilding()`, `blocked()`, keyboard + touch input, `step()`, `promptFor()` |
| `js/rooms.js` | `enter()`/`leave()`, `roomShop`, `roomVenue`, `roomApt` |
| `js/instruments.js` | `INSTRUMENTS` table, XP gating, `roomPrime()` desk |
| `js/glossary.js` | `TERMS`, `termChip()`, `openTerm()`, `teachOnce()`, `roomGlossary()` |
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

`draw()` (`city.js`) is immediate-mode, painted fresh every frame, in strict painter's order:

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

### 2a. The art layer

Everything drawn on canvas lives in `art.js`; `city.js`'s `draw()` is now a six-line composition
call. Still code-drawn — no image assets.

The look is a **warm dusk city**. `PAL` holds the canvas palette; `DTINT` gives each district its own
hue so regions read at a glance. Depth comes from four things: an extruded roof slab offset up-left
of each facade, a left-to-right gradient on the facade, warm lamp pools on the pavement, and a
radial vignette over the whole frame.

Per-building detail (rooftop clutter, which windows are lit, aerials) comes from `rngFor(b.id)` — a
FNV hash seeding mulberry32 — so it is **stable frame to frame**, asserted by comparing two
consecutive frames' op signatures. Buildings are depth-sorted by `y` before drawing so extrusions
overlap correctly.

**The character** is assembled from ~14 parts: shadow ellipse, two swinging legs, shoes, coat,
placket, scarf, arms, head, hair and eyes. `facingOf(dir)` resolves to `up`/`down`/`left`/`right`,
and the walk cycle is driven by **distance travelled** (`walkPhase` in `city.js`), so it stops dead
when the player does rather than marching on the spot.

Getting into the car is a transition, not a swap: `P.vt` eases 0→1, the car fades in while the
character shrinks and fades out, and the person deliberately counter-rotates so they never spin with
the vehicle's heading.

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
(1.9 → 8.2, on a map big enough that it matters), a running cost that scales from $150 to $3,200 a
month, and upkeep — `carCond` decays with use, and a neglected car simply **will not start**, putting
you back on foot at 1.9 until it is serviced.

**Moving around the city is free.** There is no trips budget, no per-visit cost, and no resource of
any kind consumed by exploring: `canVisit()` is unconditional and sessions are decremented in exactly
one place, `commit()`. An earlier design charged a monthly "trips" budget for entering any building,
which taxed the one thing the city exists to encourage.

### 6g. Housing

Five tiers, each changing a *different* system rather than the same number harder:

| Tier | Changes |
|---|---|
| Riverside one-bed | focus decay slope — a point every other session |
| Warehouse loft | **home office**: research actions, and a focus ceiling of 6 |
| Cavendish penthouse | **hosting**: converts the house into capital |
| Coast estate | both at scale, ceiling 7 |

`focusDecay()` returns `idx % home().decay === 0 ? 1 : 0`, so housing owns the *slope* while venues
own the level and `focusCap()` owns the ceiling. Three systems, one resource, no overlap.

**Research** is the loft's real payoff: `doResearch(key)` spends an action to un-redact one metric on
the current card only, and `clearResearch()` wipes it at commit. It converts housing into an
information system — the same currency the accounting course and terminal trade in — rather than a
stat. It never touches the trade maths.

**Rent versus buy is a genuine decision** because buying is harder on *both* axes: the loft costs
$2,146/mo against $1,800 rent, and takes a $96,000 deposit out of the portfolio where it would have
compounded. What comes back is equity (`homeEquity()`, counted in `netWorth()`), the office, and
eventually a room worth hosting in. An earlier pass had buying cheaper monthly *and* equity-positive,
which made it a free upgrade rather than a choice.

### 6h. Instruments

`instruments.js` holds a table where each entry owns its own `sound(s, choice)` and
`settle(s, choice)`. `market.js` stayed a renderer: it collects company, driver, size and an optional
second choice, then delegates. Adding an instrument is one table entry, not a branch in `commit()`.

| Instrument | XP | Second decision | Why it is a different question |
|---|---|---|---|
| Equity | 0 | — | Own the better business. The foundation |
| Bonds | 300 | Duration | Credit call *and* a rate view; right credit + wrong duration still loses |
| Short | 800 | — | Inverts the loop: `sound` requires picking the **worse** company |
| Pairs | 1400 | — | Long and short together; paid on the spread, immune to direction |
| Options | 2200 | Strike | Premium paid either way; capped loss, convex upside |

**Gating is `xp`, never cash.** XP only accrues on sound calls, so skill is the only thing that opens
a desk — verified by a test that sets cash and portfolio to 99,999,999 and confirms nothing unlocks.

Bonds need a second axis that is stable across re-renders and reloads, so `rateMoveFor(i)` derives a
deterministic −100bp..+100bp move from the scenario index via the same `mulberry32` the generator
uses. Long duration multiplies it 2.2×, short duration 0.4×. That is what manufactures `gpbo` in the
bond desk: the credit call can be right and the money still wrong.

`roomPrime()` in The Heights explains every desk and how far the next one is.

### 6i. Careers

Five rungs, and each changes **three** things — pay, capital access, and permissions at the desk:

| Stage | Requirement | Pay | Credit | Sizes |
|---|---|---|---|---|
| Junior analyst | — | $2,400 | — | small, standard |
| Analyst | any car | $4,800 | — | + high conviction |
| Senior analyst | 600 XP + accounting | $9,500 | 1× salary | |
| Portfolio manager | 1,500 XP + terminal + saloon + 20 rep | $19,000 | 3× salary | + **concentrated** (65%) |
| Fund founder | the arc-2 offer | fees only | AUM | |

**Every requirement is process or equipment, never cash** — asserted by a test that walks
`JOBS[].req` and rejects any key outside `car / xp / item / rep / arc`. Another sets cash and
portfolio to eight figures and confirms nothing qualifies. Buying a promotion would make money buy
process, which Rule 1 forbids.

`allowedSizes()` is enforced in `roomOffice()`: illegal sizes render disabled with the reason, and
`conv` is repaired to `'std'` on entry and on promotion, so a demotion can never strand the player on
a size they may not use.

The **credit line** is capital access rather than income. `drawCredit()` moves money into `port` and
records `debt`; `debtService()` charges ~10.7%/yr monthly through `expenses()`, and `netWorth()`
subtracts the balance. It is deliberately punitive: borrowed money compounds at your returns and
costs at the bank's, which makes good process rich and bad process bankrupt faster.

### 6j. Lifestyle and status

Two currencies that are not money. **Reputation** decides which rooms will have you and how much
capital you are offered; **contacts** are people who will write a cheque, and are spent by converting
them.

| Venue | Converts | Gated on |
|---|---|---|
| The Yard (gym) | cash → **focus ceiling** +1 for the month | — |
| Meridian Club | membership → 2 contacts per evening | 25 rep |
| The Rostrum | cash → reputation, at a falling price per point | — |
| The Headland | contacts → committed capital, the best rate in the game | 50 rep |
| The Floor | cash → **a sixth trading session** | Harbour (car tier 3) |

Focus is now owned by exactly three systems with no overlap: housing sets the **slope**
(`focusDecay()`), venues set the **level**, and the gym sets the **ceiling** (`focusCap()`).

Reputation's biggest payoff is `offerMultiplier()` — outside capital is offered at 1.0× to 2.0× base
depending on standing, so `startFund()` seeds `aum` from `offeredCapital()` rather than a constant.
Rep also gates the PM seat and the Headland.

Gala pricing must have **falling cost per point** (500 → 409 → 368) or the larger gifts are dominated
and no one would ever buy them. That is asserted by a test, not eyeballed.

Four new courses keep to Rule 5 — information and terms, never accuracy: **credit analysis** reveals
the bond rate move before you choose duration, **derivatives** prices option premiums in cash,
**statistics** shows your own base rates via `statsHTML()`, and **negotiation** improves fee and
borrowing terms. `roomPbank()` lends against the balance sheet rather than the title, at a better
rate than the salary line.

### 6k. The economy

Retuned once every system existed, because the probe showed most of the content was unreachable: at
$1,200/month net the loft was **80 months away** and the estate **487**, inside a 12-month game.

Four levers fixed it:

1. **The fund arc runs months 5–20** (16 months, ~80 generated scenarios) instead of 8. The ladder
   needs time to be climbed.
2. **Salaries retuned** to 3,200 / 6,800 / 15,500 / 31,000, and **AUM0 raised to $1.2m** so fee income
   is a real living.
3. **Progressive income tax** (`incomeTax()`, 10/24/35/42% bands) on salary and fees. The portfolio is
   untaxed while it compounds, which deliberately makes trading matter more the richer you get and
   stops a large salary flattening the ladder.
4. **Capacity decay** — `capacityFactor()`. A $10k portfolio and a $10m fund do not get the same edge
   from the same idea. Without it the fund compounded exponentially: measured at **$8.7m AUM and
   $198k/month** before it was added. It is also the truest thing arc 2 can teach, so the office
   shows the drag explicitly rather than applying it silently.

Measured over 24 runs per skill level:

| Pick accuracy | Reaches arc 2 | Fund closed | Survives to month 20 | Median net worth |
|---|---|---|---|---|
| Coin-flip | 38% | 25% | 13% | $14,394 |
| Learning | 88% | 21% | 67% | $188,237 |
| Good | 100% | 4% | 96% | $319,008 |
| Expert | 100% | 4% | 96% | $371,779 |

**Bankruptcy** exists as a floor, not a designed lose condition: forced liquidation drains the
portfolio, then sells property down to a rental, and only declares bankruptcy if that is still not
enough. A reckless bot over 20 runs never triggered it, so it is honestly a guard — but it is a
tested one, and it closes a real hole where `port` could go negative and produce negative position
sizes. Fixing it also caught a bug where selling a $585,000 estate released none of its equity.

### 6l. Second axes (Phase 2 depth)

Every system gained a mechanism rather than a bigger number.

**Instruments** each got a second way to lose:

| Instrument | New axis | The failure it introduces |
|---|---|---|
| Bonds | `s.deflt` + issuer quality | A weak issuer (≥3.4× levered, ≤52% conversion) can simply not pay. Duration cannot hedge a default |
| Short | Borrow choice + `s.crowded` | Borrow is paid whether or not you are right; a crowded name on general collateral squeezes 34% |
| Pairs | Hedge ratio 70/100/130% | Whatever is unhedged rides `s.sector_move` — direction re-enters a market-neutral trade by choice |
| Options | `late` per strike | Right business, wrong clock: a correct-but-slow thesis returns part of the premium, and nothing at all on the far strike |

All four extras are deterministic per scenario index (`bondDefaultFor`, `crowdedFor`,
`sectorMoveFor`), same seed discipline as the generator. The terminal and the credit course now
*reveal* those axes, which is what makes them worth owning.

**Cars** gained condition. `carCond` decays each month by `3 + tier*1.6`, so bigger cars wear faster,
and `conditionBand()` subtracts **trips** — the resource cars exist to buy — rather than a stat.
Servicing is a real monthly claim on cash.

**Housing** gained a market. `propIndex` mean-reverts inside 0.62–1.55, and `HOUSE_PRICE()` scales
every price, tax, upkeep and your equity. The mortgage is fixed at what you paid, so a falling market
compresses equity without reducing the bill — which is exactly how negative equity works.

**Careers** gained reviews. `runReview()` runs every ≥5 calls: under 30% sound loses the seat (and
its salary, credit line and position sizes), over 70% pays a bonus. Process pressure becomes
continuous rather than a one-off gate.

**Lifestyle** gained five named people, each met at a different venue over repeat visits, each
unlocking exactly one thing nothing else provides — Kestrel +25% capital, Moss the street line
without a terminal, Vance cheaper borrow, Ozal advance default warnings, Renn one absorbed review.

### 6m. Activities and world life

`activities.js` holds things to do that convert consumption into one of four channels: **tips**
(information), **access** (rep, contacts, relationships), **capital**, or **time** (trips, sessions,
focus). Nothing in it is a pure sink.

- **The Annex** (nightclub) sells three tiers of night. The cheapest gives no tips at all — access
  has to be paid for. Bottle service and hosting produce `addTip()` entries.
- **Bruno's** (restaurants) introduces nobody; it *advances* relationships already started, which
  makes the venues that introduce people and the venue that matures them two different decisions.
- **The Notice** shows one event per month, chosen deterministically by month index: earnings season
  (+1 session), a conference (two tips), a rate decision (reveals bond rate moves without the
  course), a listing (pays cash without touching your record), layoffs (contacts), a compliance
  review (pays or costs reputation **on your process score**).
- **Street encounters** fire while driving via `maybeEncounter()` in the loop, on a probability that
  scales with car tier and behind a cooldown. Seven outcomes, good and bad — tips, cards, a
  breakdown, a fine, a lost trip.

**Tips are the clearest statement of Rule 1 in the whole game.** `tipHTML()` tells you which company
the market rewarded — an *outcome*, never which business is better. Trading one can make money and
still score `bpgo`, and the screen says so before you act.

**Ambient life** lives in `art.js`: 90 pedestrians and 34 vehicles seeded by `seedLife()`, advanced
by `stepLife()`, drawn by `drawLife()`. They wrap at the map edge, are hidden in locked districts,
and touch nothing — no collision, no state.

### 6n. Balance and exploit control

Retuned again after Phases 2 and 3 added spendable content. Two genuine exploits were found by a
probe that repeats every money-producing room three times and reports anything that pays twice:

1. **Hosting was a pure money pump** — $9,000 in, $18,000 out, repeatable every trip. It now
   *consumes* contacts (`hostNeeds()`), is once a month (`hostedMonth`), and pays a rate tied to
   guests rather than to the house.
2. **Contacts were worth a season of trading each** — $15,000 a head against $120 to make one at the
   club, a 125× pump. `contactValue()` is now ~one good trade, the Headland caps at four a visit and
   once a month (`headlandMonth`), and a club evening yields one contact instead of two.

Everything repeatable now carries a month flag: `gymMonth`, `floorMonth`, `eventDone`, `hostedMonth`,
`headlandMonth`. The exploit probe is kept as `p4-exploit.js` and re-runnable.

**Tips are deliberately loss-making.** Three nights of bottle service costs $33,000 and the tips it
produces returned $25,781 — you buy them for the outcome, not the arithmetic, and they still score
`bpgo`.

Measured across skill, 24 runs each (reaches arc 2 / fund closed / survives to month 20 / median net
worth):

| Accuracy | Arc 2 | Closed | Survives | Median net worth |
|---|---|---|---|---|
| Coin-flip | 21% | 21% | 0% | $15,180 |
| Learning | 75% | 33% | 42% | $78,498 |
| Good | 100% | 4% | 96% | $313,658 |
| Expert | 100% | 0% | 100% | $420,215 |

Money stays meaningful at both ends: month one nets $1,652 against a $4,500 car and a $1,500 course,
and a PM at full lifestyle nets $4,398 of a $31,000 salary once tax, the estate and the exotic are
paid.

### 6o. The teaching layer

The game names a lot of finance. `glossary.js` makes every term of it explainable on demand, for
someone who has never taken a finance class. 32 entries across four groups — Metric, Security,
Scoring, Fund — and each one has exactly two fields: **what it is**, and **why it changes the
decision in front of you**.

Three surfaces, deliberately different:

| Surface | When | What it does |
|---|---|---|
| `termChip(id,label)` | always | Renders an underlined, tappable term inline. `openTerm()` shows a popover over any screen |
| `teachOnce(...ids)` | first appearance | A panel introducing a concept the moment it first matters, then never again. Marks `taught[id]`, which persists |
| `roomGlossary()` | on demand | The browsable list, reachable from the desk header and the scoring reference |

`bindTerms()` attaches the handlers and is called at the end of `enter()` — so a term rendered in
*any* room is tappable — plus explicitly in `roomOffice()`, `commit()`, `roomRef()` and `roomPrime()`,
which re-render in place.

Two rules the entries hold to, both tested: **no entry explains a term using another undefined term**,
and **"what it is" stays under 170 characters**. The teaching layer touches no game state beyond
`taught`, so it cannot change a result.

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
