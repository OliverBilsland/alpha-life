# Alpha Life — Design Rules

The game is about learning to read a business. Everything else — the city, the car, the bar tab — is
there to make that reading cost something. These are the rules the build commits to. If a change
breaks one of them, it's the wrong change.

---

## Rule 1 — Process is scored separately from money

The single most important rule. Two independent verdicts come out of every trade:

- **Process**: did you pick the better *business*, and for the *right reason*?
- **Money**: did the market reward that name this period?

They are stored in different fields (`better`/`driver` vs `market`) and read into different variables
(`sound` vs `won`), and neither is derived from the other. The scenario author sets them
independently and, in a third of the bank, sets them in conflict.

```js
const sound = pick === s.better && reason === s.driver;
const won   = pick === s.market;
```

**Why it must stay separate.** In real research the feedback signal is money, and money is noisy
enough over a four-month horizon to teach you nothing — or worse, to teach you the wrong thing. A
game that scores you only on P&L trains you to chase whatever paid last. So the game keeps a second
scoreboard that money cannot touch: `xp`, `streak` and the quadrant grid move only on process. The
`.sig` panel is subtitled *"Process scored separately from money"* and sits on the office screen
permanently, under every trade, not just at the end.

**The reason is not optional.** Sound requires *both* halves. Picking Meridian Trust because it looks
cheap is scored the same as picking Parkview — you got the answer without the argument, and the
reveal says so in those words: *"Right name, wrong reason — you said Valuation, it was Balance
sheet."* The `Commit` button stays disabled until both a company and a driver are chosen; there is
no way to submit a call without stating why.

**Corollary:** the four `REASONS` (Growth / Profitability / Balance sheet / Valuation) map exactly to
four of the five metrics on the card. That's not decoration — it's the claim that a thesis has to
name its axis. And the ending text calls out the most common failure: *"most people default to growth
or valuation and miss the balance-sheet calls entirely."* Eight of the twenty scenarios turn on the
balance sheet. That imbalance is intentional.

---

## Rule 2 — The four decision-quality quadrants

Process × outcome gives four cells, and every trade lands in exactly one. The grid is always visible.

|  | **Made money** | **Lost money** |
|---|---|---|
| **Sound process** | `gpgo` — Right call, rewarded | `gpbo` — Right call, market disagreed |
| **Unsound process** | `bpgo` — Wrong call, got lucky | `bpbo` — Wrong call, punished |

The colour coding carries the argument. `gpgo` is green (gain). `gpbo` is **blue — the process
colour, not a loss colour**: you did the work, and the tally is a badge, not a penalty. `bpgo` is
grey — the most dangerous cell in the game, deliberately rendered as *nothing*, because being right
by accident should feel like no information at all. `bpbo` is red.

Each reveal names its cell in plain language (`"Sound process, bad outcome"`), so the vocabulary is
taught by repetition rather than by a tutorial.

**The bank is built to fill all four.** In five of the twenty scenarios `better !== market` — the
better business loses. Those are the `gpbo` factory, and each carries a `twist` paragraph explaining
*why* correctness lost:

- **Vella** — being early: *"Vella rerated to 34× before the model broke. Being early is the most expensive way to be right."*
- **Atelier** — M&A: *"the largest single source of good-process-bad-outcome in research."*
- **Tandem** — regulatory freeze: right on every metric, discount widened before it closed.
- **Cascade** — a commission, not a spreadsheet, decided the outcome.
- **Westmark** — correct read of the business, adverse read of the regulator.

Those five exist so the player experiences the divergence rather than being told about it. Without
them the quadrant grid would be a diagonal and the whole distinction would be theatre.

**The ending grades process, not money.** `finish()` counts `gpgo + gpbo` — sound decisions
regardless of outcome — and reports `bpgo` separately as *"Right for wrong reasons."* Net worth is
printed, but no verdict is attached to it. The verdict paragraph is entirely about process.

---

## Rule 3 — Focus decays, and decay redacts metrics

Focus starts at 5 and drops by 1 per trading session. It is never restored by anything free.

```
focus >= 3   →  all five metrics readable
focus <  3   →  Operating margin redacted (—)
focus <  1   →  Operating margin and Debt/EBITDA both redacted
```

**Fatigue is modelled as information loss, not as a stat penalty.** No accuracy modifier, no random
noise, no dice. You read the same companies with strictly less data, and you still have to commit.
The office prints the state of it — *"Focus 2. You are reading these cards tired — 1 metric is
unreadable"* — so the cost is never invisible.

**Which metrics vanish is a design choice.** Margin goes first, leverage second. Growth and P/E — the
two the ending text says people over-index on anyway — never disappear. So a tired player is pushed
*toward* the shallow read, holding a card that still looks complete enough to act on. That's the
trap: the game doesn't stop you trading tired, it just quietly removes the axes that would have
changed your mind.

**Restoring it costs money and buys nothing you can sell.** The bar is $80 for +2; the club is $250
for a full restore. `roomVenue` says it outright: *"This is consumption. It buys you nothing you can
sell. It is also the only way to keep reading five metrics instead of three — which is the argument
for spending money on yourself, made honestly."* Five sessions a month against five focus means
running a full month clean requires spending — the decay rate and the session count are tuned against
each other on purpose.

The better apartment halves the decay rate rather than raising the ceiling: it changes the *slope*,
which compounds across four months, instead of handing out a one-off.

---

## Rule 4 — The car changes how the world moves

Buying the car is the one purchase that changes the feel of the game rather than a number on a
screen. Walking is `1.9` px/frame; driving is `4.1` — the city gets roughly 2.2× smaller, the roads
start mattering, and the player sprite changes from a circle to a car with headlights.

```js
const sp = P.driving ? 4.1 : 1.9;
```

**Why this rule is stated explicitly:** it is the load-bearing test of whether the city earns its
place. The ending screen asks the player directly:

> *"did driving to the club feel like part of the game, or like a menu with a map on top? If the
> world is doing work, you should remember the drive after you bought the car."*

That question is the design's own falsification criterion. If the answer is "menu with a map," the
world layer is decoration and should be cut, not decorated further.

**It has to be an economic decision too.** $4,500 up front, +$1,800/mo salary (an analyst job across
town you couldn't reach on foot), −$150/mo to run. So the car is simultaneously the traversal
upgrade, the biggest income unlock, and a recurring drag — one purchase touching movement, the
ledger, and the toast that names it: *"You bought the car. Everything just got closer."*

---

## Rule 5 — Every purchase changes the market screen or the monthly cash math

Nothing is cosmetic and nothing is a flat stat buff. A thing you can buy must do one of two things:
change what you can *see* when you make a call, or change the arithmetic of surviving the month.
Most do both.

| Item | Cost | Changes the market screen | Changes monthly cash |
|---|---|---|---|
| Used car | $4,500 | — (changes movement instead) | +$1,800 salary, −$150 run cost |
| Accounting course | $1,500 | Unlocks **cash conversion** on every card | — |
| Market terminal | $6,000 | Unlocks the **street positioning** line | — |
| Better apartment | $5,000 | Indirect: halves focus decay → fewer redactions | −$600 rent |
| Side app | $7,500 | — | +$700/mo after a 3-month build |
| Bar / Club | $80 / $250 | Restores focus → un-redacts metrics | consumption, no return |

**The two information items are the clearest case.** Cash conversion (`f`) is the metric the game's
own explanations lean on hardest — it's what exposes Lumen at 12%, confirms the top in Redstone at
87%, and separates Norwich's capex from Bridgeport's maintenance. Without the course it renders as
italic *locked* on every card: you can see there's a fifth column and that you can't read it. The
terminal adds the `street` line — how the crowd is positioned — which is the only channel that ever
hints at the `market` field independently of `better`. Both are paid, permanent, and legible.

**The counter-pressure is that cash spent is portfolio forgone.** The shop copy states it every time:
*"Cash spent here leaves the portfolio permanently smaller than it would have been."* And if the
month's bills exceed cash, the shortfall is force-liquidated from the portfolio with a named warning
— *"the most expensive way to fund a lifestyle."* Spending is never free and never punished
arbitrarily; it's just accounted for, in front of you.

**Corollary — a rejected design.** No item may add accuracy, luck, XP multipliers, or a nudge toward
the right answer. The game's currency is information and time, not advantage. An item that made you
*more likely to be right* would break Rule 1 by letting money buy process.

---

## The through-line

Money is the score everyone watches and the one the game refuses to grade you on. Information is what
you actually buy, focus is what you actually spend, and the city is the fee the game charges to make
those feel like decisions instead of menu items. Every rule above exists to keep one sentence true:
**you can do everything right and lose, and the game will still tell you that you did it right.**
