/* ==================== GLOSSARY / TEACHING ====================
   Every financial term the game uses is explainable on demand, in plain English,
   for someone who has never taken a finance class.

   Three surfaces:
     termChip(id,label)  an inline tappable term anywhere in the UI
     teachOnce(...ids)   a panel shown the FIRST time a concept appears in play
     roomGlossary()      a browsable list of everything, grouped

   Every entry has: what it is, and why it matters for the decision in front of
   you. No entry is allowed to explain a term using another unexplained term. */

const TERMS={
/* ---------- the five numbers on a company card ---------- */
 growth:{g:'Metric', n:'Revenue growth',
  one:'How much more the company sold this year than last, as a percentage.',
  why:'It is the clearest sign a business is winning customers. A company growing 30% is taking the market; one growing 3% is holding on. Growth compounds — a bigger company next year sells more the year after.'},
 margin:{g:'Metric', n:'Operating margin',
  one:'Of every $100 of sales, how much is left as profit after the costs of running the business.',
  why:'It tells you whether the company controls its own pricing. A 30% margin means customers pay up and rivals cannot easily undercut. A 5% margin means every cost increase is a crisis.'},
 leverage:{g:'Metric', n:'Debt / EBITDA',
  one:'How many years of earnings it would take to pay off the company’s debts. Lower is safer.',
  why:'This is the number that decides who survives a bad year. Under 2x is comfortable. Over 4x means the lenders, not the managers, decide what happens next when trading gets difficult.'},
 pe:{g:'Metric', n:'P / E (price to earnings)',
  one:'How many years of current profits you are paying for the company at today’s share price.',
  why:'It is the price tag. Paying 10x means the market expects little; paying 60x means it expects a great deal, and you lose money if the company merely does well rather than brilliantly.'},
 conversion:{g:'Metric', n:'Cash conversion',
  one:'How much of the reported profit actually arrives as cash in the bank.',
  why:'Profit is an opinion; cash is a fact. A company reporting big profits but converting 20% of them to cash is spending everything it earns just to stand still — or the profits are not real.'},

/* ---------- the securities ---------- */
 equity:{g:'Security', n:'Equity (shares)',
  one:'Owning a slice of a company. You gain if it does well, and lose if it does badly.',
  why:'The simplest way to back a judgement about a business. No time limit and no borrowing — which is why it is where everyone starts.'},
 bond:{g:'Security', n:'Bonds',
  one:'Lending money to a company in exchange for fixed interest payments and your money back at the end.',
  why:'You do not need the company to thrive, only to survive and pay you. That makes it a different question from equity: not "which is better" but "which will definitely pay me back".'},
 duration:{g:'Security', n:'Duration',
  one:'How far in the future your money comes back. Longer means the bond’s price swings more when interest rates change.',
  why:'If rates rise, every existing bond is worth less — because new ones pay more. A long bond falls hard; a short one barely moves. You can pick the right company and still lose money by choosing the wrong length.'},
 credit:{g:'Security', n:'Credit risk',
  one:'The chance the borrower simply cannot pay you back.',
  why:'It is the loss no clever structuring can undo. A heavily indebted company that does not convert profits to cash may not pay at all — and then the interest rate you agreed is irrelevant.'},
 short:{g:'Security', n:'Short selling',
  one:'Borrowing shares you do not own, selling them, and buying them back later — hoping the price fell in between.',
  why:'It lets you profit from spotting a bad business, not just a good one. But your loss is not capped: a share you are short can rise forever, while it can only ever fall to zero in your favour.'},
 borrow:{g:'Security', n:'Borrow cost',
  one:'The fee you pay to whoever lends you the shares you are shorting.',
  why:'You pay it whether or not you turn out to be right. Popular shorts cost more to borrow, so being early to an idea is cheaper than joining a crowd.'},
 squeeze:{g:'Security', n:'Short squeeze',
  one:'When lots of people are short the same share and its price rises, they all rush to buy back at once — pushing it higher still.',
  why:'It is how a correct short can still ruin you. The more obvious your idea, the more people are already in it, and the more violently it unwinds.'},
 option:{g:'Security', n:'Options',
  one:'Paying a fee now for the right — but not the obligation — to buy something at a set price before a deadline.',
  why:'The most you can lose is the fee, and the upside can be many times it. The catch is the deadline: you can be completely right about a company and still get nothing if it happens too late.'},
 strike:{g:'Security', n:'Strike price',
  one:'The price at which your option lets you buy. Further from today’s price means a cheaper option that needs a bigger move.',
  why:'It is the dial between "likely to pay a little" and "unlikely to pay a lot". Cheaper options are not better value, they are a different bet.'},
 premium:{g:'Security', n:'Premium',
  one:'The fee you pay upfront for an option. It is gone either way.',
  why:'It is why options can lose money on a correct call. You have to be right by more than the premium cost you.'},
 pairs:{g:'Security', n:'Pairs trade',
  one:'Buying the better company and short selling the worse one at the same time, in the same industry.',
  why:'It strips out the whole market’s direction. If the sector crashes, both fall and you are unharmed; you are paid purely on whether you ranked the two correctly.'},
 hedge:{g:'Security', n:'Hedge ratio',
  one:'How much you sell short against what you buy. Equal amounts cancels out market direction entirely.',
  why:'Hedging less leaves you exposed to the whole sector rising or falling. It is the choice of whether you want a pure opinion on two companies, or an opinion plus a bet on the industry.'},

/* ---------- how the game scores you ---------- */
 process:{g:'Scoring', n:'Process',
  one:'Whether your decision was defensible with what you knew at the time.',
  why:'It is the only part you control. Markets are noisy over short periods, so a good decision can lose and a bad one can win — judging yourself on the result teaches you the wrong lesson.'},
 outcome:{g:'Scoring', n:'Outcome',
  one:'Whether the trade made money this period.',
  why:'Over a few months this is close to a coin flip even for experts. It matters enormously for your balance and almost not at all for measuring your skill.'},
 sound:{g:'Scoring', n:'A sound call',
  one:'Picking the better business AND correctly naming which number makes it better.',
  why:'Getting the right answer for the wrong reason means you will get it wrong next time, when the same reasoning points elsewhere. The game requires both halves for exactly that reason.'},
 quadrant:{g:'Scoring', n:'The four boxes',
  one:'Every trade is filed by process (sound or not) and outcome (made or lost money) — four combinations.',
  why:'It separates skill from luck. "Wrong call, got lucky" is the dangerous box, because it feels identical to success at the time.'},
 drawdown:{g:'Scoring', n:'Drawdown',
  one:'How far your money has fallen from its highest point, as a percentage.',
  why:'It is what a loss actually feels like, and what makes investors leave. A fund that ends the year flat after halving in the middle has usually lost its clients.'},
 volatility:{g:'Scoring', n:'Volatility',
  one:'How much your returns jump around from month to month.',
  why:'Two funds can earn the same over a year while one was calm and the other terrifying. The calm one keeps its investors, which is why it survives to keep earning.'},
 riskadj:{g:'Scoring', n:'Risk-adjusted return',
  one:'How much you made compared with how much fear you caused getting there.',
  why:'Doubling your money by risking everything is not twice as good as doubling it safely — it is a strategy that eventually loses everything. This is the number professionals are actually judged on.'},
 sizing:{g:'Scoring', n:'Position size',
  one:'What share of your money you put behind a single decision.',
  why:'It is a separate decision from being right. Betting 65% of the fund on a good idea can still end you, because being right on average does not stop you being wrong at the worst moment.'},

/* ---------- running money ---------- */
 aum:{g:'Fund', n:'AUM (assets under management)',
  one:'The total money other people have given you to invest.',
  why:'Your fees come from it, so it is your income — and it can be withdrawn, so it is also your job security.'},
 mgmtfee:{g:'Fund', n:'Management fee',
  one:'A small percentage of the money you manage, paid to you every month whatever happens.',
  why:'It is the salary of running a fund. It is small, which is why a flat month does not cover a decent lifestyle.'},
 perffee:{g:'Fund', n:'Performance fee',
  one:'A share of the profits you make for investors, paid only when you make some.',
  why:'It is where the real money is, and where the temptation is: taking huge risks pays you when it works and costs you nothing when it does not.'},
 redemption:{g:'Fund', n:'Redemption',
  one:'Investors taking their money back out.',
  why:'It usually follows a frightening month rather than a bad year. Losing money is survivable; losing investors is not.'},
 capacity:{g:'Fund', n:'Capacity',
  one:'The limit on how much money a strategy can handle before it stops working well.',
  why:'Buying $1m of something barely moves its price; buying $100m moves it against you. The edge that made you successful shrinks as you get bigger — which is why great small funds often become mediocre big ones.'},
 leverageFin:{g:'Fund', n:'Leverage (borrowing to invest)',
  one:'Using borrowed money so your positions are larger than your own capital.',
  why:'It multiplies both results. It turns a good process into wealth quickly and a poor one into ruin quickly — and the interest is due either way.'},
 xp:{g:'Scoring', n:'Process XP',
  one:'Points earned only for sound calls — never for making money.',
  why:'It is what unlocks new instruments here. Skill buys access; money cannot, because if money could buy a more powerful tool then money would be buying skill.'}
};

/* an inline, tappable term */
function termChip(id,label){
  const t=TERMS[id]; if(!t) return label||id;
  return `<button class="term" data-t="${id}">${label||t.n}</button>`;
}

/* ---------- the popover ---------- */
function openTerm(id){
  const t=TERMS[id]; if(!t) return;
  const p=$('termpop'); if(!p) return;
  p.innerHTML=`<div class="tp-card">
      <div class="tp-hd"><span>${t.g}</span>
        <button class="tp-x" id="tpClose">Close</button></div>
      <h3>${t.n}</h3>
      <p class="tp-one">${t.one}</p>
      <p class="tp-why"><strong>Why it matters:</strong> ${t.why}</p>
      <button class="btn ghost" id="tpAll">Open the glossary</button>
    </div>`;
  p.classList.add('on');
  $('tpClose').addEventListener('click',closeTerm);
  $('tpAll').addEventListener('click',()=>{closeTerm();roomGlossary();});
}
function closeTerm(){const p=$('termpop'); if(p) p.classList.remove('on');}
function bindTerms(){
  document.querySelectorAll('.term').forEach(el=>
    el.addEventListener('click',()=>openTerm(el.dataset.t)));
}

/* ---------- first-time teaching ---------- */
/* Returns a panel for any of these ids not yet seen, and marks them seen. The
   point is to explain a concept the moment it first matters, not in advance. */
function teachOnce(...ids){
  const fresh=ids.filter(i=>TERMS[i]&&!taught[i]);
  if(!fresh.length) return '';
  fresh.forEach(i=>{taught[i]=1;});
  return `<section class="teach">
    <div class="teachhd">${fresh.length>1?'Two new ideas':'A new idea'} · first time this has come up</div>
    ${fresh.map(i=>`<div class="teachrow"><h4>${TERMS[i].n}</h4>
      <p>${TERMS[i].one}</p><p class="teachwhy">${TERMS[i].why}</p></div>`).join('')}
    <div class="teachfoot">Any underlined term can be tapped for this again, any time.</div>
  </section>`;
}

/* ---------- the browsable glossary ---------- */
function roomGlossary(){
  const groups=[...new Set(Object.values(TERMS).map(t=>t.g))];
  $('sheet').innerHTML=`<div class="roomhd"><h2>Glossary</h2>
      <span class="sub">Every term this game uses · plain English</span></div>
    <p class="note k">Nothing here assumes you have taken a finance class. Each entry says what the
      thing is, then why it changes a decision. If a term appears underlined anywhere in the game,
      you can tap it and get this.</p>
    ${groups.map(g=>`<div class="step"><div class="steplbl"><span>${g}</span></div>
      <div class="glist">${Object.keys(TERMS).filter(k=>TERMS[k].g===g).map(k=>`
        <div class="gitem"><h4>${TERMS[k].n}</h4>
          <p>${TERMS[k].one}</p>
          <p class="gwhy">${TERMS[k].why}</p></div>`).join('')}</div></div>`).join('')}
    <button class="btn ghost" id="glBack">Back</button>`;
  $('glBack').addEventListener('click',()=>{
    if(inRoom==='office') roomOffice(); else leave();
    $('ov').scrollTop=0;
  });
  $('ov').scrollTop=0;
}
