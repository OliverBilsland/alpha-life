/* ==================== TUTORIAL / REFERENCE ==================== */
/* Teaching is spread across the first three trades of month one, one idea per
   trade, and is skippable at any point. It renders as a panel above the cards
   and a short follow-up inside the reveal; it never touches the trade maths. */
let tutOn=true;

const TUT=[
 {n:'1 of 3', h:'Read the business, not the price',
  b:`Two companies, same sector. One of them is the better <em>business</em> — that is the
     call, and it is not the same question as which share price went up.
     <br><br>Four numbers decide it, and each one maps to a reason you can give:
     <ul>
       <li><b>Revenue growth</b> — is it getting bigger? <em>(Growth)</em></li>
       <li><b>Operating margin</b> — does it keep what it earns? <em>(Profitability)</em></li>
       <li><b>Debt / EBITDA</b> — can it survive a bad year? Lower is safer. <em>(Balance sheet)</em></li>
       <li><b>P / E</b> — what are you paying for it? Lower is cheaper. <em>(Valuation)</em></li>
     </ul>
     Pick a company <strong>and</strong> the reason that drives your call. You need both
     — the right name for the wrong reason does not count.`,
  a:`That is the loop. One of those four axes was the deciding one; the others were
     noise or a deliberate distraction. Getting the name right by luck scores as unsound,
     because next time the luck runs the other way.`},

 {n:'2 of 3', h:'The money and the thinking are scored apart',
  b:`Below the cards is a grid with four boxes. Every trade lands in one of them, and it
     is the honest scoreboard: <strong>process across the top, outcome down the side</strong>.
     <br><br>A sound call that lost money still counts as sound. A wrong call that made
     money is still wrong — that box is deliberately grey, because being right by
     accident tells you nothing.
     <br><br><strong>Position size</strong> sets how much rides on it: 10%, 25% or 45% of
     the portfolio. Size scales with the portfolio, so it compounds — and a loss costs
     less than a win pays, which means a coin-flipper drifts up while bad process still bleeds.`,
  a:`Note which box you landed in. Over a full run the boxes matter more than the balance:
     the game grades the thinking, and says so at the end.`},

 {n:'3 of 3', h:'Focus is the resource you actually spend',
  b:`Focus starts at 5 and drops by one every trading session. It is never restored for free.
     <br><br>Below 3, <strong>operating margin stops being readable</strong>. Below 1, debt
     goes too. You will still be asked to commit — on a card that looks complete enough
     to act on, minus the axes that would have changed your mind.
     <br><br>The bar restores 2 for $80; the club restores all of it for $250. Neither buys
     you anything you can sell. That is the point.`,
  a:`Five sessions a month against five focus is not an accident. You cannot run a clean
     month without spending on yourself — the reference below is always here if you want
     the rules again.`}
];

const tutActive=()=>tutOn&&idx<TUT.length;

function tutPanel(){
  if(!tutActive()) return '';
  const t=TUT[idx];
  return `<section class="coach">
    <div class="coachhd"><span>Learning the desk · ${t.n}</span>
      <button class="coachskip" id="tutSkip">Skip tutorial</button></div>
    <h4>${t.h}</h4><div class="coachb">${t.b}</div></section>`;
}
function tutAfter(){
  if(!tutActive()) return '';
  return `<div class="coach after"><div class="coachb">${TUT[idx].a}</div></div>`;
}
function tutBind(){
  const s=$('tutSkip');
  if(s) s.addEventListener('click',()=>{tutOn=false;hud();roomOffice();$('ov').scrollTop=0;});
}

/* ---------- persistent reference ---------- */
function refHTML(){
  const q=(k,t,d)=>`<div class="gq" data-q="${k}"><div class="t"><strong>${t}</strong><br>${d}</div></div>`;
  return `<div class="roomhd"><h2>How scoring works</h2>
      <span class="sub">Reference · always available</span></div>

    <p class="note k">Two scores are kept. One is money. The other is whether the call was
      defensible at the time you made it. They are recorded separately and they disagree often.</p>

    <div class="step"><div class="steplbl"><span>A call is sound when both halves are right</span></div>
      <p class="note">You must pick the better business <strong>and</strong> name the axis that
        makes it better. Right company, wrong reason scores as unsound — the reveal will tell
        you which axis it actually was.</p></div>

    <div class="step"><div class="steplbl"><span>The four boxes</span></div>
      <div class="grid2"><div class="gh"></div><div class="gh">Made money</div><div class="gh">Lost money</div>
      <div class="gh">Sound</div>
      ${q('gpgo','Right, rewarded','The call worked and deserved to.')}
      ${q('gpbo','Right, market disagreed','You were correct and still lost. This is not a mistake.')}
      <div class="gh">Unsound</div>
      ${q('bpgo','Wrong, got lucky','The most dangerous box. Grey on purpose — it is not information.')}
      ${q('bpbo','Wrong, punished','The call was weak and the market agreed.')}</div></div>

    <div class="step"><div class="steplbl"><span>The metrics and their reasons</span></div>
      <div class="reftab">
        <div><b>Revenue growth</b><span>Is it getting bigger?</span><em>Growth</em></div>
        <div><b>Operating margin</b><span>Does it keep what it earns?</span><em>Profitability</em></div>
        <div><b>Debt / EBITDA</b><span>Can it survive a bad year? Lower is safer.</span><em>Balance sheet</em></div>
        <div><b>P / E</b><span>What are you paying? Lower is cheaper.</span><em>Valuation</em></div>
        <div><b>Cash conversion</b><span>Are the earnings real cash? Needs the accounting course.</span><em>Supporting</em></div>
      </div></div>

    <div class="step"><div class="steplbl"><span>Position size and outcome</span></div>
      <p class="note">${CONV.map(c=>`<strong>${c.n}</strong> risks ${Math.round(c.pct*100)}% of the portfolio`).join(' · ')}.
        A winning position returns ${Math.round(WIN_R*100)}% of the stake; a losing one costs
        ${Math.round(LOSE_R*100)}%. Size is a share of the portfolio, so the stakes compound as you do.</p></div>

    <div class="step"><div class="steplbl"><span>Focus</span></div>
      <p class="note">Starts at 5, falls by 1 per session. Below 3 the operating margin is
        redacted; below 1 debt goes too. The bar restores 2 for $80, the club restores all for $250,
        and the better apartment halves the rate of decay rather than raising the ceiling.</p></div>

    <div class="step"><div class="steplbl"><span>What money can and cannot buy</span></div>
      <p class="note">Purchases buy <em>information</em> and <em>time</em>, never accuracy.
        The accounting course reveals cash conversion on every card; the terminal shows how the
        street is positioned. Nothing you can buy makes you more likely to be right.</p></div>

    <button class="btn ghost" id="refBack">Back to the desk</button>`;
}
function roomRef(){
  $('sheet').innerHTML=refHTML();
  $('refBack').addEventListener('click',()=>{roomOffice();$('ov').scrollTop=0;});
  $('ov').scrollTop=0;
}
