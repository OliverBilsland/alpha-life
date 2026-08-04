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
  /* A weak credit can simply not pay. Lending to the wrong issuer is not a
     smaller gain -- it is a different kind of loss, and duration cannot hedge it. */
  defaults:true,
  /* credit quality is a balance-sheet/valuation question -- growth is not a credit axis */
  sound:(s,c)=>c.pick===s.better&&c.reason===s.driver,
  settle(s,c){
    const creditOk=c.pick===s.market;
    const k=this.extra.opts.find(o=>o.id===c.dur).k;
    /* a deterministic-per-scenario rate move, so the same card always behaves the same */
    const move=s.rate!==undefined?s.rate:0;
    /* default risk: only a genuinely weak issuer can go, and only sometimes */
    const held=s[c.pick];
    if(held.l>=3.4&&held.f<=52&&s.deflt){
      return {won:false, mult:-0.62,
        line:held.t+' did not pay. '+held.l.toFixed(1)+'x leverage against '+held.f+
          '% cash conversion was never a coupon, it was a hope. Duration cannot hedge a default.'};
    }
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
  extra:{key:'borrow', label:'Borrow', hint:'What it costs to hold the short',
    opts:[{id:'gc',   n:'General collateral',s:'Cheap borrow on a liquid name',fee:0.02},
          {id:'tight',n:'Tight borrow',      s:'Expensive, but far less crowded',fee:0.07}]},
  /* sound means correctly identifying the WORSE company, for the right reason */
  sound:(s,c)=>c.pick!==s.better&&c.reason===s.driver,
  settle(s,c){
    const won=c.pick!==s.market;
    const o=this.extra.opts.find(x=>x.id===c.borrow)||this.extra.opts[0];
    /* borrow is paid whether or not you were right */
    const fee=o.fee*(knows('vance')?0.67:1);   /* a prime-brokerage relationship is cheaper borrow */
    /* a name the street is already short does not unwind politely; paying up for
       tight borrow is how you avoid standing in the crowded one */
    const crowded=s.crowded===c.pick&&o.id==='gc';
    const squeeze=(!won&&crowded)?0.34:0;
    const mult=(won?this.win:-this.lose)-fee-squeeze;
    return {won:mult>=0, mult,
      line:won?s[c.pick].t+' lagged, which is what you were paid for. Borrow cost '+Math.round(fee*100)+'% of the stake regardless.'
        :squeeze?s[c.pick].t+' squeezed. Everyone was already short it on general collateral, and a crowded short does not unwind politely — '+Math.round(squeeze*100)+'% on top of the loss.'
        :s[c.pick].t+' outperformed while you were short it, and the borrow cost '+Math.round(fee*100)+'% on the way.'};
  }
},
{
  id:'pairs', n:'Pairs', sub:'Long one, short the other',
  xp:1400, win:0.17, lose:0.15,
  blurb:'Own the better business and short the worse one. You are paid on the gap, not the direction.',
  teach:'Market-neutral. It cannot be rescued by a rising tide and cannot be sunk by a falling one — the only question is whether you ranked the pair correctly.',
  extra:{key:'hedge', label:'Hedge ratio', hint:'How much of the long you sell against it',
    opts:[{id:'under',  n:'70% hedged', s:'Keeps some market direction',h:0.7},
          {id:'neutral',n:'Fully hedged',s:'Pure spread, no direction',  h:1.0},
          {id:'over',   n:'130% hedged',s:'Net short the sector',        h:1.3}]},
  /* `pick` is the leg you are LONG; sound requires the correct assignment */
  sound:(s,c)=>c.pick===s.better&&c.reason===s.driver,
  settle(s,c){
    const o=this.extra.opts.find(x=>x.id===c.hedge)||this.extra.opts[1];
    const won=c.pick===s.market;
    const spread=won?this.win:-this.lose;
    /* whatever is not hedged is exposed to the sector, which moves on its own */
    const drift=(s.sector_move||0)*(1-o.h);
    const mult=spread+drift;
    return {won:mult>=0, mult,
      line:(won?'The spread went your way: long '+s[c.pick].t+', short the other.'
               :'The spread went against you — the one you shorted was the one that worked.')+
        (Math.abs(drift)>0.004
          ? ' At '+Math.round(o.h*100)+'% hedged you were '+(o.h<1?'still long':'net short')+
            ' the sector, which moved '+((s.sector_move||0)*100).toFixed(1)+'% — '+
            (drift>0?'in your favour':'against you')+'.'
          : ' Fully hedged, so the sector move was irrelevant.')};
  }
},
{
  id:'option', n:'Options', sub:'Buy convexity',
  xp:2200, win:0.62, lose:1.0,
  blurb:'Pay a premium for leveraged upside and a floor under the downside.',
  teach:'You can be right and still lose the premium. Capped loss, uncapped-feeling upside, and a bill that arrives whether or not you were correct.',
  extra:{key:'strike', label:'Strike', hint:'How far out of the money',
    opts:[{id:'atm', n:'At the money',s:'Costly, likely to pay',prem:0.34,pay:1.9,late:0.55},
          {id:'otm', n:'Out of the money',s:'Cheap, needs to be right',prem:0.18,pay:3.6,late:0.30},
          {id:'far', n:'Far out',s:'A lottery ticket with a thesis',prem:0.08,pay:7.5,late:0.0}]},
  sound:(s,c)=>c.pick===s.better&&c.reason===s.driver,
  settle(s,c){
    const o=this.extra.opts.find(x=>x.id===c.strike)||this.extra.opts[0];
    const won=c.pick===s.market;
    /* Right business, wrong clock is the option trader's specific disease: the
       call was correct and the contract still expired. `late` is how much of a
       correct-but-slow thesis the contract gives back. */
    const slow=!won&&c.pick===s.better;
    const mult=won?o.prem*(o.pay-1):(slow?o.prem*(o.late-1):-o.prem);
    return {won:mult>=0, mult,
      line:won?'It expired in the money. '+Math.round(o.prem*100)+'% premium returned '+o.pay.toFixed(1)+'x.'
        :slow?'You had the right business and the wrong clock. '+
              (o.late>0?Math.round(o.late*100)+'% of the premium came back':'It expired worthless')+
              '. Being early is indistinguishable from being wrong once the contract dies.'
             :'It expired worthless. You paid '+Math.round(o.prem*100)+'% of the stake to be wrong.'};
  }
}];

const instrumentById=id=>INSTRUMENTS.find(i=>i.id===id)||INSTRUMENTS[0];
const instrumentUnlocked=i=>xp>=i.xp;
const unlockedInstruments=()=>INSTRUMENTS.filter(instrumentUnlocked);
function nextInstrument(){return INSTRUMENTS.find(i=>!instrumentUnlocked(i))||null;}

/* A rate move attached deterministically to each scenario index, so bonds have a
   second axis that is stable across re-renders and reloads. */
/* Deterministic per-scenario extras the new axes read. Same seed discipline as
   the generator: stable across re-renders and reloads. */
function bondDefaultFor(i){
  const r=mulberry32((Math.imul(i+13,3266489917)^0x85EBCA6B)>>>0);
  return r()<0.18;
}
function sectorMoveFor(i){
  const r=mulberry32((Math.imul(i+29,2654435761)^0xC2B2AE35)>>>0);
  return Math.round((r()*2-1)*70)/1000;      /* -7.0% .. +7.0% */
}
function crowdedFor(i){
  const r=mulberry32((Math.imul(i+41,1597334677)^0x27D4EB2F)>>>0);
  const hit=r()<0.35;
  return hit?(r()<0.5?'a':'b'):null;
}
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
