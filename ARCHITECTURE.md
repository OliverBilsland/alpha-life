# Alpha Life — Architecture

Everything lives in `index.html`: one `<style>` block, a small static DOM skeleton, and one
`<script>` of plain globals and functions. No build step, no modules, no dependencies except two
Google Fonts links. The whole thing runs off two surfaces:

- a **canvas** (`#cv`) that draws the city and only the city, and
- a **DOM overlay** (`.ov` / `#sheet`) that draws every interior, rendered by `innerHTML`.

The two never run at once. `inRoom` is the switch: when it's non-null the loop stops simulating and
stops drawing, and the sheet owns the screen.

---

## 1. File layout, top to bottom

| Lines | Section | What's there |
|---|---|---|
| 10–166 | `<style>` | CSS variables (paper/ink palette, `--process`/`--gain`/`--loss`), HUD, prompt, toast, touch controls, and the whole interior design system: `.co` company cards, `.rz` choice buttons, `.reveal` result panel, `.ledger`, `.grid2` quadrant grid, one mobile breakpoint at 660px |
| 168–189 | static DOM | canvas, HUD stat pods, `#prompt`, `#toast`, `#stick`/`#knob`/`#actBtn`, `#exitBtn`, `#ov`/`#sheet`. Everything else is generated |
| 193–216 | `DATA` | `REASONS` (4 thesis drivers) and `S` (20 scenarios) |
| 219–233 | `WORLD` | `W`/`H` world size, `B` buildings, `ROADS` |
| 236–262 | `STATE` | tuning constants, all mutable globals, `$`/`money`/`shuffle`, `expenses()`/`income()`, `hud()`, `toast()` |
| 265–329 | `RENDER` | `resize()`, `draw()`, `door()`, `nearBuilding()`, `blocked()` |
| 332–354 | `INPUT` | keyboard map, touch joystick |
| 357–388 | `LOOP` | `step()`, `promptFor()` |
| 391–467 | `ROOMS` | `enter()`/`leave()`, `ITEMS`, `roomShop`, `roomVenue`, `roomApt` |
| 470–549 | office/market | `roomOffice()`, `sync()`, `sigHTML()`, `commit()` |
| 552–617 | payday/end | `payday()`, `renderPayday()`, `finish()` |
| 620–622 | boot | shuffle the deck, paint HUD, start the loop, show the tutorial toast |

---

## 2. The render loop

`step()` (357) is the only `requestAnimationFrame` callback, and it always re-schedules itself. It is
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

`draw()` (271) is immediate-mode, painted fresh every frame, in strict painter's order:

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

`enter()` (391) is a flat if/else chain mapping the eight building ids onto **four renderer shapes**:

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
(line 435), and `renderPayday` calls itself after each invest/withdraw click. Listeners die with the
nodes, so there's no accumulation.

`leave()` nudges `P.y += 30` so you step *out* of the door radius; without it `nearBuilding()` would
still be true and the prompt would re-fire immediately.

**`'payday'` is a pseudo-room.** `payday()` sets `inRoom='payday'` — an id no building has — and
hides `#exitBtn`. Both the Escape handler (336) and the exit-button handler (407) explicitly check
`inRoom!=='payday'`, so the month-end settlement is the one screen you cannot walk out of. `finish()`
leaves `gameOver=true` and the overlay up; the only exit is `location.reload()`.

---

## 5. Economy and state

All state is module-level `let`s (238–243). There is no save, no serialization, no state object —
reload is a full reset.

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
cosmetic. `payday()` (552) applies `cash += income() - expenses()`, ticks `appLeft` (and flips
`appLive` when it hits 0), and then does the punishing bit: **if `cash` goes negative, the gap is
liquidated from `port` and reported as `forced`.** Lifestyle overruns are paid for out of compounding
capital, visibly.

**Trading math** lives entirely in `commit()` (517):

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

`S` (196–216) is 20 flat objects, one per sector, and it's the game's content payload.

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

**Metric gating** is what the shop items plug into, and it's all read at render time in `roomOffice`:

- `f` (cash conversion) renders as `locked` italic text unless `owned.acct`;
- `street` renders as a whole block only if `owned.term`;
- `red = focus<3 ? (focus<1 ? ['m','l'] : ['m']) : []` blanks margin, then leverage, to an em dash.

Growth and P/E are never hidden — you always have enough to make *a* call, just not always enough to
make the right one. Note the asymmetry: focus hides metrics you'd otherwise have, purchases reveal
metrics you'd otherwise never see.

---

## 7. Control flow, end to end

```
boot ──▶ step() ──rAF──┐
          │            │
          │  E / tap   │
          ▼            │
        enter(b) ──▶ inRoom set, loop idles
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
                                  month=4 └──▶ finish()  (gameOver, reload to replay)
```

---

## 8. Known quirks worth knowing before refactoring

- **Order of operations in `commit()`:** focus decays using the *pre-increment* `idx` (line 526),
  then `idx++` at 546. Changing that order silently shifts which sessions the apartment protects.
- **The `Next` button's branch is a no-op:** `if(sessionsLeft>0&&idx<S.length) roomOffice(); else
  roomOffice();` (547). `roomOffice()` self-guards on `sessionsLeft<=0`, so the behaviour is correct;
  the condition is vestigial.
- **`P.driving` is set on purchase, not restored on reload** — there's no persistence at all, which
  is fine, but it means `owned.car` and `P.driving` are two representations of one fact.
- **Room renderers close over their own arguments to re-render themselves** (`roomShop(title,sub,ids)`
  calling itself). Any split must keep those arguments reachable.
- **Everything is a global.** `pick`, `reason`, `conv`, `locked` are office-scoped in meaning but
  file-scoped in fact, and `roomOffice()` resets them on entry (477).
