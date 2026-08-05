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

## Rule 6 — Generated cases owe the player the same contract as written ones

The bank is effectively unlimited, but a procedural case is not allowed to be a worse deal than a
hand-written one. Two things the authored twenty do implicitly are enforced in code, and a case that
fails either is rebuilt rather than shipped:

- **Exactly one metric decides it.** The player is required to name the axis, so more than one
  defensible reason would be an unfair loss. The driver's advantage must be at least 1.15
  normalised units and at least 1.7× any other axis. A player who ranks the four axes by advantage
  lands on the intended driver in 100% of cases — that is a test, not an aspiration.
- **The wrong answer always looks good.** The losing company must win on at least two of the other
  three axes. A case where the better business is also the obvious business teaches nothing.

The corollaries matter as much:

- **No positional tell.** `better` is `'a'` 49.8% of the time. If it skewed, the game would be
  beatable without reading anything.
- **The 25% disagreement rate is preserved**, and a `twist` is attached exactly when the market
  disagrees — so the `gpbo` box keeps filling and keeps being explained.
- **Cash conversion still lies in the same direction it lies in the authored set** — flattering the
  mature, melting company on growth and value calls. It's a supporting metric, never the decider,
  which is why it can afford to mislead.

What the generator must never do is make a case *easier* to guess than an authored one. Variety is
the goal; a lower difficulty floor is not.

## Rule 7 — The second arc is unlocked by process and lost to volatility

Managing outside capital is gated on **12 sound calls of 20** — a process bar. The balance at the end
of month four is irrelevant to whether the offer arrives. A player who got rich by guessing does not
get the mandate; a player who was right and unlucky does.

Once inside, the failure mode is deliberately not "you were wrong". Investors redeem on a bad month,
on three-month volatility, on a drawdown from the peak, on two consecutive down months. **You can be
closed while your process score is excellent**, and the ending says so in as many words. That is the
`gpbo` box scaled up to a career: correct, and terminated anyway.

This is also what makes position size a decision rather than a dial to max out. Measured: for a
competent player, high conviction buys no extra chance of a strong win over standard sizing but
quadruples the risk of losing the fund. The lesson is the one the intro arc cannot teach, because in
the intro arc nobody can take your money away.

The verdict screen still reports sound decisions and "right for wrong reasons" separately from AUM,
and still refuses to grade the money. Survival and correctness are printed side by side and never
summed.

## Rule 8 — Instruments are different questions, not bigger numbers

Five desks, and each one asks something the others cannot:

- **Equity** — own the better business.
- **Bonds** — lend to the better credit, *and* take a view on rates. Two decisions, so being right
  about the company and wrong about duration still loses money. That is how bond desks actually lose.
- **Short** — the loop inverted. `sound` requires naming the *worse* business, and the payoff is
  deliberately asymmetric (−26% against +22%) because a squeeze does not care that you were right.
- **Pairs** — long one leg, short the other. Immune to direction; paid only on whether you ranked
  the pair correctly. The lowest-variance way to be exactly as right as you were.
- **Options** — pay a premium either way. Capped loss, convex upside, and the bill arrives even when
  the thesis was correct but early.

**Access is bought with process XP and nothing else.** 100 XP per sound call, and money cannot move
it — a test sets cash and portfolio to eight figures and confirms not one desk opens. This is Rule 1
extended: if money could buy a more powerful instrument, money would be buying process, and the two
scoreboards would have merged.

The comparison loop stays underneath all five. Every instrument still asks which business is better
and on which axis; what changes is what you do with the answer, and therefore how you can lose.

## Rule 9 — Status is a currency, and currencies must convert

Reputation and contacts exist because "networking" has to mean something mechanical or it is
decoration. Each one has a source, a sink, and an exchange rate:

- **Reputation** comes from sound calls (and can be bought outright at the Rostrum). It gates the
  portfolio-manager seat, gates the Headland, and multiplies the outside-capital offer from 1.0× to
  2.0×. That last one is the payoff that makes standing worth buying.
- **Contacts** come from club membership and hosting. They convert at the Headland into committed
  capital at the best rate in the game.

Two rules keep this honest. **No tier may be dominated** — gala cost per point has to fall as the
gift grows, or the large ones are decoration with a price tag. And **no venue may sell accuracy**:
the gym raises the focus ceiling, the club buys introductions, the courses reveal data or improve
terms, and not one of them changes the chance that a call is right.

The focus economy now has three owners and no overlap: housing sets the slope, venues set the level,
the gym sets the ceiling. When three systems touch one resource, each must touch a different part of
it, or two of them are the same upgrade wearing different names.

## Rule 10 — Money must be meaningful at both ends of the game

Two failure modes, and the economy is tuned against both.

**Early**, money is meaningful because there is not enough of it. The opening month nets about
$1,650 against a $4,500 car and a $1,500 course, so month one is a genuine choice between mobility
and information.

**Late**, money stops being meaningful the moment income outgrows every price. Three things prevent
that: a progressive tax that takes 42% at the top, monthly commitments that scale faster than
salaries (the estate costs $13,082/month against a $31,000 salary), and **capacity decay** — the
larger the fund, the less the same idea returns.

Capacity decay earns its place twice. Mechanically it is the only thing that stops the second arc
compounding into absurdity; measured without it, the fund reached $8.7m and $198k/month. But it is
also true, and it is the last lesson the game has to teach: the edge that made you does not survive
being scaled, and the number that grows is not the number that matters.

## Rule 11 — The world has to be worth looking at

The original palette was cold slate on grey-green: legible, and joyless. The rule the visual pass
holds to is that **mood is a mechanic** — a player who does not want to look at the city will not
drive across it, and Rule 4 depends on them wanting to.

So: warm dusk, saturated buildings, amber windows, lamp pools, per-district hue. Contrast is not
sacrificed for atmosphere — paper is `#F6F1E5` against `#191410` ink, and the redaction and quadrant
colours stayed semantically identical, just vivid instead of muddy.

The character earns its place the same way. A dot cannot face anywhere, cannot walk, and cannot get
into a car. A figure with legs that swing only while you are actually moving tells you the game is
reading your input — the smallest possible piece of feedback, delivered continuously.

## Rule 12 — Depth is a new way to lose, not a bigger number

The test every Phase 2 addition had to pass: does it introduce a *failure mode the player did not
previously have*? A higher price for a bigger effect is not depth, it is inflation.

- Bonds can now **default**. That is not a larger loss, it is a loss duration cannot hedge — a
  different question about the same card.
- Shorts pay **borrow** whether or not they are right, and a crowded name **squeezes**. The decision
  is no longer just which company is worse, it is whether your thesis is already consensus.
- Pairs choose a **hedge ratio**, which is the choice to let direction back into a market-neutral
  trade. Being fully hedged is now a decision rather than a definition.
- Options can be **right and still expire**. Being early is indistinguishable from being wrong once
  the contract dies, which is the game's central theme expressed in a payoff formula.
- Cars **wear out**, and neglect costs trips rather than points — it takes away decisions.
- Houses have a **price**, so buying is a question of when.
- Seats can be **lost**, so process pressure never stops.

What did not get built: extra car tiers, extra home tiers, higher-paying seats. Every one of those
would have been a bigger number at a higher price, which is the thing this rule exists to refuse.

## Rule 13 — Consumption converts, or it does not ship

Every activity has to hand something back: information, access, capital, or time. A pure money sink
is a punishment for playing, and a pure cosmetic is a lie about depth.

The nightclub is the sharpest case. It sells **tips**, and a tip tells you where the money went —
never which business deserved it. So a player can buy a tip, trade it, make money, and land in
`bpgo`: *wrong call, got lucky*. The screen says as much before they commit. That is Rule 1 made
purchasable: you can buy the outcome and you still cannot buy the process.

The rest follow the same shape. Restaurants advance relationships but introduce nobody, so meeting
and maturing are separate decisions. The monthly event is one opportunity with a price and a return —
including a compliance review that pays reputation on your *sound rate*, the only place in the game
where process converts directly into standing. Street encounters are the only system that gives
things for free, and they are gated on the car, which was paid for.

Ambient life is the one exception, and it is deliberate: pedestrians and traffic convert into nothing
at all. They are there so the city reads as inhabited, which is Rule 11's job, not this one's.

## Rule 14 — If it can be repeated, it will be

Every room that produces money gets asked one question: what happens if a player does this three
times in a row? Two systems failed it and both were shipped before anyone noticed, which is why the
question is now a test rather than a habit.

Hosting paid double what it cost, every trip. Contacts cost $120 to make and converted at $15,000.
Neither was a design decision; both were the arithmetic nobody had multiplied out.

The fix is the same in both cases and it is the one that preserves the fiction: **a raise consumes
the relationship it draws on, and happens once a month.** You cannot dine the same six people every
Tuesday and expect a cheque each time.

The general rule: anything that converts into capital carries a month flag. Anything that converts
into *information* — tips — is allowed to be repeatable, because it is deliberately loss-making and
scores as unsound anyway. Information you can grind for. Money you cannot.

## Rule 15 — Never use a word the player has not been given

The game is trying to take someone with no finance background toward reading a business the way a
professional does. That is impossible if it says "debt to EBITDA" and moves on.

Every financial term is tappable where it appears, and every explanation answers two questions in
that order: *what is this*, and *why does it change the decision in front of me*. The second is the
one that matters — "operating margin is profit over revenue" teaches nothing; "it tells you whether
the company controls its own pricing" is a thing you can act on.

Three constraints keep it honest:

- **No entry may lean on another undefined term.** A glossary that explains duration using "yield
  curve" has explained nothing.
- **Teach at the point of use.** A concept is introduced the first time it actually appears — bonds
  explain duration when you first select bonds, not in a manual up front. Nobody reads the manual,
  and if they did they would not remember it by the time it mattered.
- **The wall of text is available but never mandatory.** The glossary is one tap away and can be
  ignored entirely; the game teaches by putting the explanation exactly where the decision is.

## Rule 16 — Exploring is free

The city exists to be driven around. Charging for that — as an earlier "trips" budget did, taking one
per building visit — meant the optimal play was to stop looking at the world, which is the exact
opposite of what Rule 4 is trying to prove.

So: **sessions are spent in one place only, committing a trade.** Walking, driving, opening any door,
browsing any shop, reading the glossary and taking a street encounter all cost nothing. The scarce
resources are focus, cash and sessions, and none of them is touched by movement.

Cars keep their meaning without owning a scarce resource. They buy access (districts), speed (a
4200px map), burden (running costs), and upkeep — a neglected car will not start, which slows you
down but never *rations* you. Slower is a fair punishment; scarcer is a tax on curiosity.

## Rule 17 — Endless has to deepen, or it is a treadmill

Removing the four-month wall is easy. Making the two-hundredth case matter as much as the twentieth
is the actual problem, and repetition is what kills a procedural game.

Four things escalate, and they are deliberately different kinds of escalation:

- **Difficulty** — the deciding number stays decisive, but the distractors close in on it. Dominance
  over the strongest wrong signal falls from 2.81× to 1.99×, and nearly all three other axes end up
  pointing at the wrong company. What never changes is fairness: **zero ambiguous cases at any
  difficulty**, because the answer must always be defensible.
- **Scale** — a chapter allocation arrives every six months, sized by your sound rate and paid only
  above 45%. Money follows the record, which is Rule 1 expressed as growth.
- **Access** — two more desks, still on process XP alone.
- **Standing** — the career ladder keeps running, and a lost fund is a setback rather than an ending.

That last one matters most. **A fund closing returns you to a desk with your record intact.** The
money is gone, the reputation is dented, but the twenty-seven sound calls are still twenty-seven
sound calls — because the record is the only thing that was ever really yours. Being able to raise
again after failing is the truest thing an endless version of this game can say.

One structural correction came out of it: a cumulative bar becomes meaningless when there is no time
limit, since anyone clears it by waiting. The fund gate is now **12 sound of your last 20**, forever.

## Rule 18 — A session should be worth doing for a reason you can see

The test this build is aimed at: *does the player want one more market session because they are
visibly working toward something?*

So every purchase carries three things and the screen shows all three — what it costs (with a bar
that moves after every trade), what it changes about play, and what changes **in the city**. The last
one matters most. A number going up in a menu is an abstraction; a car parked outside your building,
a light in your window, your name on the Institute board — those are the last ten sessions made
visible.

The goal is never empty. If the player has not chosen one, the game aims at the cheapest lasting
upgrade, so there is always a bar filling. And the purchases are bought with **cash**, not the
portfolio, which keeps every one of them a genuine decision: this month's visible progress against
next year's compounding. `roomInvest()` exists to make that trade explicit — including a button that
pulls exactly enough for the goal and no more.

None of this touches the scoring. Money still buys information, access and time; it never buys
process, and the quadrant grid still sits under every trade saying so.

## Rule 19 — Pay for the lesson, not for the answer

The tutor is the only place the game pays you to learn, so it has to resist the obvious exploit:
memorise an answer key, farm cash, learn nothing.

Three things do that, and only one of them is a limit:

- **The explanation is unconditional.** Right or wrong, you get the concept, why the answer is what
  it is, and where it appears on a company card. A wrong answer earns 52% of a right one — enough
  that being wrong is never punished, because the person who had to look it up learned more.
- **Nothing is banked until the follow-up.** The fee is paid after the comprehension check, which
  comes after the explanation. You cannot answer and skip.
- **Repeats decay to nothing.** A third pass at the same question pays ×0.32, and the picker always
  serves the least-seen question. An answer key buys you a worse hourly rate, not a better one.

The ceiling exists too, but it is the least interesting defence. The important one is that the
fastest way to earn here is genuinely to work through material you have not seen.

And it stays outside the scoring. Teaching awards no process XP and moves no quadrant — because if
studying could raise your process score, the score would stop measuring your decisions. What it does
instead is honest: it records your sound rate the day you register, and shows you the difference
later. If the teaching works, the number moves on its own.

## Rule 20 — The leaderboard ranks process, because money is the thing being argued with

The board is sorted by **sound decisions**, and net worth is a column beside it. Never the reverse.

Sorting by money would undo the entire game in one line of SQL. Rule 1 says the player can do
everything right and lose; a money-ranked board answers that by putting the luckiest player on top
and calling them the best. Position size is a percentage of portfolio and the win/loss ratio is
asymmetric (.25 up, .18 down), so a coin-flip player drifts upward — given enough runs, the top of a
money board is a list of people who got the variance, not the reasoning.

Net worth is still shown, because hiding it would be dishonest in the other direction — money is
what everyone actually watches, and the game has never pretended otherwise. Showing both is the
point: a large number next to a poor process score is the most instructive row on the board, and it
is legible as exactly what it is.

This is also why the developer cash tool cannot submit. Granted money moves net worth and nothing
else, so a cheated run would appear as an enormous number beside an untouched process score — not
first place, but noise in the column that is supposed to be the honest one. The refusal is in
`js/online.js` and in the end screen, and the server's own `CHECK` constraints are the backstop. See
*Dev tools sit outside the economy*, below, and ARCHITECTURE §11.

And names are filtered on every path, not just at the box you type into. A name that arrives from
another player's browser is checked again before it is drawn, because the leaderboard is the first
surface in this game where one player's input reaches another player's screen.

## Rule 21 — Other players are weather, not opponents

Live players can be seen and cannot be interacted with. No trading, no chat, no bumping, no shared
economy. They walk past; that is the whole feature.

This is a restraint, not a stub. The moment another player can affect your run, the run stops being
a clean record of your own decisions, and Rule 1 — *you can do everything right and lose, and the
game will still tell you that you did it right* — becomes unprovable, because the loss might have
been theirs. The end screen has to be able to say the sentence honestly.

What presence is actually for is the thing the city was always for (Rule 11): making the world feel
like somewhere rather than a menu. A figure crossing the junction while you are deciding whether the
Ferrata is defensible tells you other people are also deciding something. That is atmosphere, and
atmosphere is allowed to be free.

It also has to be free in the literal sense. A stationary player broadcasts nothing, so the cost of
standing still and thinking — which is most of this game — is zero.

## Dev tools sit outside the economy

There is a hidden developer panel that grants cash on demand (`Ctrl`+`Shift`+`Alt`+`D`; see
ARCHITECTURE §10). It exists so the upper tiers can be tested without playing twenty sessions to
afford them. It is a testing aid, and the rules above still have to survive its existence.

**It grants money and nothing else.** Not process XP, not a quadrant, not a streak, not a sound call.
This is Rule 1 held from the other side: if the cheat could raise your process score, the score would
stop measuring your decisions — the same reason the tutor pays cash but awards no XP (Rule 19). A
granted million buys the Ferrata and the Coast estate, and the end screen will still tell you your
process was weak, because it was.

**It changes no prices and no payouts.** The balance stays the balance; the only thing skipped is the
grind to reach it. If a purchase feels wrong when tested with granted cash, that is a real finding
about the purchase, not an artefact of the tool.

**It is local, and it is marked.** It writes to one device's own save and reaches no shared surface —
there is none in this build to reach. If a leaderboard is ever added, the tool leaves a
`alphalife.dev.tainted` marker precisely so a cheated save can be kept out of it. A cheat that could
quietly launder itself into other people's standings would not be a testing aid; it would be a way to
make the honest score meaningless, which is the one thing this game cannot afford.

## The through-line

Money is the score everyone watches and the one the game refuses to grade you on. Information is what
you actually buy, focus is what you actually spend, and the city is the fee the game charges to make
those feel like decisions instead of menu items. Every rule above exists to keep one sentence true:
**you can do everything right and lose, and the game will still tell you that you did it right.**
