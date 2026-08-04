/* ==================== ARC 2 — OUTSIDE CAPITAL ====================
   The intro arc (months 1-4, the twenty authored cases) is unchanged. Clearing
   a PROCESS bar — not a money bar — unlocks eight months running other people's
   money at roughly 25x the scale.

   The philosophy holds: the fund can be closed on you for reasons that have
   nothing to do with whether your calls were defensible, and the ending still
   grades process separately from survival. Redemptions punish VOLATILITY rather
   than being wrong, because that is what actually ends funds. */

const ARC2_BAR=12;             /* sound decisions of 20 needed to raise capital */
const ARC2_END_MONTH=12;       /* months 5..12 inclusive = 8 months */
const AUM0=250000, AUM_FLOOR=150000, AUM_TARGET=450000;
const MGMT_FEE=0.003;          /* per month on AUM, ~3.6%/yr */
const PERF_FEE=0.20;           /* on a positive month only, never clawed back */
const VOL_LIMIT=0.09;          /* 3-month stdev of monthly returns */
const DD_LIMIT=0.18;           /* peak-to-trough on AUM: what investors actually feel */

let arc=1, aum=0, aumStart=0, aumPeak=0, retHist=[], fundClosed=false, lastFund=null;

const soundCount=()=>quad.gpgo+quad.gpbo;
const fundEligible=()=>soundCount()>=ARC2_BAR;
const fundFee=()=>arc===2?Math.round(aum*MGMT_FEE+Math.max(0,monthPnl)*PERF_FEE):0;
function stdev(a){if(a.length<2)return 0;
  const m=a.reduce((x,y)=>x+y,0)/a.length;
  return Math.sqrt(a.reduce((s,v)=>s+(v-m)*(v-m),0)/a.length);}

function startFund(){
  arc=2; aum=AUM0; aumStart=AUM0; aumPeak=AUM0; retHist=[]; fundClosed=false; lastFund=null;
  month=ARC2_END_MONTH-7; sessionsLeft=ROUNDS_PER_MONTH; monthPnl=0; focus=5;
  inRoom=null; $('ov').classList.remove('on'); $('exitBtn').classList.remove('on');
  P.x=330; P.y=470; hud();
  toast('Capital committed. '+money(AUM0)+' under management.');
}

/* Runs once per month-end, after fees are paid out of the month's P&L. */
function fundMonthEnd(){
  const ret=aumStart>0?monthPnl/aumStart:0;
  const prev=retHist.length?retHist[retHist.length-1]:0;
  retHist.push(ret); if(retHist.length>6) retHist.shift();
  const vol=stdev(retHist.slice(-3));
  /* drawdown is measured before redemptions — it is what the investor sees on
     their statement, and it is the thing large position sizes actually produce */
  const nav=aumStart+monthPnl;
  aumPeak=Math.max(aumPeak,nav);
  const dd=aumPeak>0?(aumPeak-nav)/aumPeak:0;
  let red=0,sub=0;const notes=[];
  if(ret<=-0.10){red+=0.15;notes.push(`a ${(ret*100).toFixed(1)}% month`);}
  if(vol>VOL_LIMIT){red+=0.08;notes.push(`three-month volatility of ${(vol*100).toFixed(1)}%`);}
  if(dd>DD_LIMIT){red+=0.10;notes.push(`a ${(dd*100).toFixed(0)}% drawdown from the peak`);}
  if(ret<0&&prev<0){red+=0.07;notes.push('two consecutive down months');}
  red=Math.min(red,0.30);
  if(!red&&ret>=0.08&&vol<=VOL_LIMIT&&dd<=0.05) sub=0.08;
  const before=aum;
  if(red) aum=Math.round(aum*(1-red));
  else if(sub) aum=Math.round(aum*(1+sub));
  if(aum<AUM_FLOOR) fundClosed=true;
  aumStart=aum;
  return (lastFund={ret,vol,dd,red,sub,before,after:aum,notes});
}

function fundLedgerHTML(){
  if(arc!==2) return '';
  const f=lastFund;
  return `<div class="lr"><span>Management fee</span><span class="pos">+${money(Math.round(aum*MGMT_FEE))}</span></div>
    ${monthPnl>0?`<div class="lr"><span>Performance fee (${Math.round(PERF_FEE*100)}%)</span><span class="pos">+${money(Math.round(monthPnl*PERF_FEE))}</span></div>`:''}
    ${f?`<div class="lr"><span>Fund return this month</span><span class="${f.ret>=0?'pos':'neg'}">${f.ret>=0?'+':''}${(f.ret*100).toFixed(1)}%</span></div>
    <div class="lr"><span>3-month volatility</span><span class="${f.vol>VOL_LIMIT?'neg':''}">${(f.vol*100).toFixed(1)}%</span></div>
    <div class="lr"><span>Drawdown from peak</span><span class="${f.dd>DD_LIMIT?'neg':''}">${(f.dd*100).toFixed(1)}%</span></div>
    ${f.red?`<div class="lr"><span>Redemptions</span><span class="neg">−${money(f.before-f.after)}</span></div>`:''}
    ${f.sub?`<div class="lr"><span>New subscriptions</span><span class="pos">+${money(f.after-f.before)}</span></div>`:''}
    <div class="lr"><span>Assets under management</span><span>${money(aum)}</span></div>`:''}`;
}
function fundNoteHTML(){
  const f=lastFund; if(arc!==2||!f) return '';
  if(f.red) return `<p class="note" style="color:var(--warn)"><strong>${money(f.before-f.after)} redeemed.</strong>
    Investors left over ${f.notes.join(' and ')}. They are not judging whether your calls were
    defensible — they are judging whether the ride was tolerable. ${money(aum)} remains, and the
    fund closes below ${money(AUM_FLOOR)}.</p>`;
  if(f.sub) return `<p class="note" style="color:var(--gain)"><strong>${money(f.after-f.before)} subscribed.</strong>
    A quiet, positive month brings money in. Size compounds faster than returns do.</p>`;
  return '';
}

/* ---------- the offer, shown once, at the end of month four ---------- */
function roomFundOffer(){
  inRoom='payday'; $('exitBtn').classList.remove('on');
  $('ov').classList.add('on');
  $('sheet').innerHTML=`<div class="roomhd"><h2>An approach</h2>
      <span class="sub">After month four</span></div>
    <p class="note k">${soundCount()} of ${idx} calls were sound. That is the number that got
      noticed — not the balance. Somebody has been reading your work and would like to allocate
      to it.</p>
    <div class="ledger">
      <div class="lr"><span>Capital offered</span><span>${money(AUM0)}</span></div>
      <div class="lr"><span>Management fee</span><span class="pos">${(MGMT_FEE*100).toFixed(1)}% monthly on assets</span></div>
      <div class="lr"><span>Performance fee</span><span class="pos">${Math.round(PERF_FEE*100)}% of a positive month</span></div>
      <div class="lr"><span>Term</span><span>Eight months</span></div>
      <div class="lr"><span>Fund closes below</span><span class="neg">${money(AUM_FLOOR)}</span></div>
    </div>
    <p class="note">Position sizes are a share of the fund, so every call is about
      <strong>${Math.max(2,Math.round(AUM0/Math.max(port,1)))}×</strong> the size you have been
      trading. Your own portfolio rides alongside at the same return.</p>
    <p class="note">The salary stops. You live on fees, and fees in a flat month do not cover rent.</p>
    <p class="note k">Investors redeem on <strong>volatility</strong>, not on being wrong. A run of
      sound calls that happens to be violent will lose you the mandate faster than a quiet run of
      mediocre ones. That is not a bug in the simulation; it is the job.</p>
    <button class="btn" id="takeIt">Take the capital</button>
    <button class="btn ghost" id="declineIt">Stay small — end here</button>`;
  $('takeIt').addEventListener('click',()=>{startFund();save();});
  $('declineIt').addEventListener('click',()=>{finish();});
  $('ov').scrollTop=0;
}

/* ---------- arc 2 ending ---------- */
function fundFinish(){
  gameOver=true;
  const sound=soundCount(),lucky=quad.bpgo;
  const won=!fundClosed, strong=won&&aum>=AUM_TARGET;
  const pct=idx>20?Math.round(sound/idx*100):0;
  let head,verdict;
  if(strong){head='The fund is open, and bigger';
    verdict=`You finished with ${money(aum)} against ${money(AUM0)} committed, and you did it without
      a month violent enough to send anyone to the exit. That is the whole job: be right often enough,
      and be boring enough about it that you are still here to compound.`;}
  else if(won){head='The fund survived';
    verdict=`${money(aum)} still under management after eight months. Not spectacular, and spectacular
      was never the assignment — the assignment was to still be trading in month twelve.`;}
  else{head='The fund was closed';
    verdict=`Assets fell through ${money(AUM_FLOOR)} and the mandate was pulled in month ${month}.
      Worth separating the two questions: whether the calls were defensible, and whether the ride was
      survivable. ${sound>=idx*0.5?'Yours were mostly defensible. It was the volatility that ended you — which is how most of them end.':'The process was not there either, and the redemptions only made it visible sooner.'}`;}
  $('sheet').innerHTML=`<div class="roomhd"><h2>${head}</h2>
      <span class="sub">${won?'Final':'Month '+month} · outside capital</span></div>
    <div class="ledger">
      <div class="lr"><span>Assets under management</span><span>${money(aum)}</span></div>
      <div class="lr"><span>Peak-to-trough drawdown</span><span>${(maxDD*100).toFixed(1)}%</span></div>
      <div class="lr"><span>Personal portfolio</span><span>${money(port)}</span></div>
      <div class="lr"><span>Cash</span><span>${money(cash)}</span></div>
      <div class="lr"><span>Sound decisions</span><span>${sound} of ${idx} (${pct}%)</span></div>
      <div class="lr"><span>Right for wrong reasons</span><span>${lucky}</span></div>
      <div class="lr"><span>Net worth</span><span>${money(port+cash)}</span></div>
    </div>
    <p class="note">${verdict}</p>
    <p class="note k">The two scores never merged. ${sound} defensible calls is the one you control;
      ${won?'the fund staying open':'the fund closing'} is the one you do not. A career is mostly the
      first number surviving long enough for the second to stop mattering.</p>
    <button class="btn" onclick="newGame()">Play again</button>`;
  $('exitBtn').classList.remove('on');
  $('ov').classList.add('on');
}
