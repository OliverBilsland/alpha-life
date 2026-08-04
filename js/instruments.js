/* ==================== INSTRUMENTS ====================
   The comparison loop is the foundation: every instrument still asks "which is
   the better business, and on which axis". What changes is what you DO with the
   answer, and therefore how you can lose.

   Unlocks are priced in process XP, which only accrues on sound calls. Skill
   buys access; money never does. That is the whole reason the gate is xp and
   not cash.

   Each instrument defines:
     ask(s)      what the player must decide, beyond company + driver
     settle(...) how the position resolves, given the scenario and the choices
   so market.js stays a renderer and the risk maths live here. */

const INSTRUMENTS=[
{
  id:'equity', n:'Equity', sub:'Long a business',
  xp:0, win:0.25, lose:0.18,
  blurb:'Buy the better business and wait. The foundation everything else is built on.',
  teach:'Right business, right reason, and the market has to agree with you inside the period.',
  extra:null,
  sound:(s,c)=>c.pick===s.better&&c.reason===s.driver,
  settle(s,c){
    const won=c.pick===s.market;
    return {won, mult:won?this.win:-this.lose,
      line:won?`${s[s.market].t} outperformed and you owned it.`
               :`${s[s.market].t} outperformed and you did not.`};
  }
},
{
  id:'bond', n:'Bonds', sub:'Credit, and a view on rates',
  xp:300, win:0.14, lose:0.11,
  blurb:'Lend to the better credit. Then decide how much rate risk to carry.',
  teach:'Two decisions, not one. Getting the credit right and the duration wrong still loses money — which is exactly how bond desks lose money.',
  extra:{key:'dur', label:'Duration', hint:'How far out you lend',
    opts:[{id:'short',n:'Short',s:'2 years · barely moves',k:0.4},
          {id:'med',  n:'Medium',s:'7 years · standard',k:1.0},
          {id:'long', n:'Long',  s:'25 years · all the rate risk',k:2.2}]},
  /* credit quality is a balance-sheet/valuation question -- growth is not a credit axis */
  sound:(s,c)=>c.pick===s.better&&c.reason===s.driver,
  settle(s,c){
    const creditOk=c.pick===s.market;
    const k=this.extra.opts.find(o=>o.id===c.dur).k;
    /* a deterministic-per-scenario rate move, so the same card always behaves the same */
    const move=s.rate!==undefined?s.rate:0;
    const carry=creditOk?this.win:-this.lose;
    const rate=-move*k*0.16;
    const mult=carry+rate;
    return {won:mult>=0, mult,
      line:`${creditOk?'The credit held.':'The credit widened.'} Rates moved ${move>0?'up':move<0?'down':'sideways'}${move?' '+Math.abs(move*100).toFixed(0)+'bp':''}, and ${k>1.5?'long':k<0.6?'short':'medium'} duration ${Math.abs(rate)<0.01?'barely noticed':(rate<0?'took the hit':'was paid for it')}.`};
  }
},
{
  id:'short', n:'Short', sub:'Sell the worse business',
  xp:800, win:0.22, lose:0.26,
  blurb:'The loop inverted: pick the company you would not own, and profit when it lags.',
  teach:'Shorts lose more than they win, because a business you are short can rise without limit and a squeeze does not care that you were right.',
  extra:null,
  /* sound means correctly identifying the WORSE company, for the right reason */
  sound:(s,c)=>c.pick!==s.better&&c.reason===s.driver,
  settle(s,c){
    const won=c.pick!==s.market;                 /* the name you shorted lagged */
    return {won, mult:won?this.win:-this.lose,
      line:won?`${s[c.pick].t} lagged, which is what you were paid for.`
               :`${s[c.pick].t} outperformed while you were short it. That is the asymmetry.`};
  }
},
{
  id:'pairs', n:'Pairs', sub:'Long one, short the other',
  xp:1400, win:0.17, lose:0.15,
  blurb:'Own the better business and short the worse one. You are paid on the gap, not the direction.',
  teach:'Market-neutral. It cannot be rescued by a rising tide and cannot be sunk by a falling one — the only question is whether you ranked the pair correctly.',
  extra:null,
  /* `pick` is the leg you are LONG; sound requires the correct assignment */
  sound:(s,c)=>c.pick===s.better&&c.reason===s.driver,
  settle(s,c){
    const won=c.pick===s.market;
    return {won, mult:won?this.win:-this.lose,
      line:won?`The spread went your way: long ${s[c.pick].t}, short the other.`
               :`The spread went against you — the one you shorted was the one that worked.`};
  }
},
{
  id:'option', n:'Options', sub:'Buy convexity',
  xp:2200, win:0.62, lose:1.0,
  blurb:'Pay a premium for leveraged upside and a floor under the downside.',
  teach:'You can be right and still lose the premium. Capped loss, uncapped-feeling upside, and a bill that arrives whether or not you were correct.',
  extra:{key:'strike', label:'Strike', hint:'How far out of the money',
    opts:[{id:'atm', n:'At the money',s:'Costly, likely to pay',prem:0.34,pay:1.9},
          {id:'otm', n:'Out of the money',s:'Cheap, needs to be right',prem:0.18,pay:3.6},
          {id:'far', n:'Far out',s:'A lottery ticket with a thesis',prem:0.08,pay:7.5}]},
  sound:(s,c)=>c.pick===s.better&&c.reason===s.driver,
  settle(s,c){
    const o=this.extra.opts.find(x=>x.id===c.strike);
    const won=c.pick===s.market;
    /* the premium is spent either way; a winner returns premium * payoff */
    const mult=won?o.prem*(o.pay-1):-o.prem;
    return {won, mult,
      line:won?`It expired in the money. ${Math.round(o.prem*100)}% premium returned ${o.pay.toFixed(1)}x.`
               :`It expired worthless. You paid ${Math.round(o.prem*100)}% of the stake to be wrong — and would have paid it to be right early, too.`};
  }
}];

const instrumentById=id=>INSTRUMENTS.find(i=>i.id===id)||INSTRUMENTS[0];
const instrumentUnlocked=i=>xp>=i.xp;
const unlockedInstruments=()=>INSTRUMENTS.filter(instrumentUnlocked);
function nextInstrument(){return INSTRUMENTS.find(i=>!instrumentUnlocked(i))||null;}

/* A rate move attached deterministically to each scenario index, so bonds have a
   second axis that is stable across re-renders and reloads. */
function rateMoveFor(i){
  const r=mulberry32((Math.imul(i+7,2246822519)^0x9E3779B9)>>>0);
  const v=Math.round((r()*2-1)*100)/100;      /* -1.00 .. +1.00, i.e. -100bp..+100bp */
  return Math.abs(v)<0.12?0:v;
}

/* ---------- the desk: where instruments are explained and unlocked ---------- */
function roomPrime(){
  const nxt=nextInstrument();
  $('sheet').innerHTML=`<div class="roomhd"><h2>PRIME BROKERAGE</h2>
      <span class="sub">Desk access · ${xp} process XP</span>
      <button class="refbtn" id="refBtn">How scoring works</button></div>
    <p class="note k">Desks are opened by process, not by money. Every sound call is 100 XP; nothing
      you can buy moves this number. That is deliberate — the only thing that should let you trade a
      more dangerous instrument is evidence you can read a business.</p>
    <div class="items">${INSTRUMENTS.map(i=>{
      const open=instrumentUnlocked(i);
      return `<button class="item ${open?'owned':''}" disabled>
        <div class="nm"><span>${i.n}</span><span class="pr">${open?'OPEN':i.xp+' XP'}</span></div>
        <div class="ef">${i.blurb}<br><em style="color:var(--process)">${i.teach}</em></div>
        <div class="carstat">
          <span>win +${Math.round(i.win*100)}%</span>
          <span>loss −${Math.round(i.lose*100)}%</span>
          <span>${i.extra?i.extra.label.toLowerCase()+' choice':'no second choice'}</span>
          <span>${open?'available at the desk':'locked'}</span></div></button>`;
    }).join('')}</div>
    ${nxt?`<p class="note" style="margin-top:16px">Next desk: <strong>${nxt.n}</strong> at ${nxt.xp} XP.
      You are ${nxt.xp-xp} XP away — ${Math.ceil((nxt.xp-xp)/100)} more sound calls.</p>`
         :`<p class="note" style="margin-top:16px">Every desk is open to you.</p>`}
    <button class="btn ghost" id="pOut">Leave</button>`;
  $('refBtn').addEventListener('click',roomRef);
  $('pOut').addEventListener('click',leave);
}
