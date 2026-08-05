/* ==================== LIFE: GOALS, PURCHASES, CASH ====================
   The question this file exists to answer: does the player want one more market
   session because they can SEE what it is buying?

   So every upgrade has three things, and the screen shows all three:
     cost      progress toward it, updated after every trade
     effect    a concrete change to how the game plays
     world     something visibly different in the city afterwards

   Nothing here is cosmetic-only, and nothing here is invisible. */

const LIFE=[
 {id:'night', n:'A night out', cost:260, repeat:true,
  d:'Somewhere loud, with people who do this for a living.',
  fx:'Reputation +4. You will read tomorrow tired — next session starts a point of focus down.',
  world:'The bar front lights up for the rest of the month.',
  can:()=>true,
  buy(){ rep+=4; hangover=true; nightOutMonth=month; contacts+=1; }},

 {id:'laptop', n:'A decent laptop', cost:900,
  d:'Your own machine, and a screen you can actually read a filing on.',
  fx:'Unlocks a sixth number on every company card: cash conversion.',
  world:'A blue desk-light appears in your window at night.',
  can:()=>!owned.laptop,
  buy(){ owned.laptop=true; }},

 {id:'acct', n:'Finance course', cost:1500,
  d:'Two evenings a week at the Institute, taught by someone who has done it.',
  fx:'Unlocks free cash flow — what the business actually generates after keeping itself alive.',
  world:'The Institute puts your name on the board outside.',
  can:()=>!owned.acct,
  buy(){ owned.acct=true; }},

 {id:'car', n:'Used car', cost:2800,
  d:'Nine years old, honest, and it starts.',
  fx:'Opens Midtown and qualifies you for the analyst seat. Costs $210 a month to run.',
  world:'It is parked outside your building whenever you are not in it.',
  can:()=>carTier===0,
  buy(){ carTier=1; carCond=100; }},

 {id:'flat', n:'Apartment upgrade', cost:3600,
  d:'A room you can think in, one floor up and facing the water.',
  fx:'Maximum focus rises to 6, and focus decays half as fast.',
  world:'Your building gains a lit floor and a balcony.',
  can:()=>homeTier===0,
  buy(){ homeTier=1; }}
];

const lifeById=id=>LIFE.find(x=>x.id===id);
const lifeAvailable=()=>LIFE.filter(x=>x.can());
function lifeProgress(u){return Math.max(0,Math.min(1,cash/u.cost));}

/* ---------- the goal ---------- */
/* If the player has not chosen one, aim at the cheapest thing still open, so the
   progress bar is never empty and there is always a reason to trade again. */
function currentGoal(){
  const g=goal&&lifeById(goal);
  if(g&&g.can()) return g;
  /* auto-target the cheapest LASTING upgrade -- a night out is repeatable and
     would otherwise sit at the top of the list forever, which is not a goal */
  const open=lifeAvailable().filter(x=>!x.repeat);
  if(!open.length) return null;
  return open.slice().sort((a,b)=>a.cost-b.cost)[0];
}
function goalHTML(){
  const g=currentGoal(); if(!g) return '';
  const p=lifeProgress(g), pct=Math.round(p*100);
  const short=Math.max(0,g.cost-cash);
  return `<section class="goal">
    <div class="goalhd"><span>Working toward</span><span>${g.n}</span></div>
    <div class="goalbar"><i style="width:${pct}%"></i></div>
    <div class="goalfoot">${short?`${money(short)} to go · ${pct}%`
      :`<strong>Affordable now.</strong> It is waiting at home.`}</div>
  </section>`;
}

/* ---------- buying, from the city, at home ---------- */
function buyLife(id){
  const u=lifeById(id);
  if(!u||!u.can()||cash<u.cost) return false;
  cash-=u.cost; u.buy();
  justBought=id; boughtAt=month;
  if(goal===id) goal=null;
  hud(); save();
  return true;
}

function roomLife(){
  const g=currentGoal();
  $('sheet').innerHTML=`<div class="roomhd"><h2>Your life</h2>
      <span class="sub">Cash ${money(cash)} · every purchase changes something</span></div>
    ${goalHTML()}
    <p class="note k">These are bought with cash, not with the portfolio. Cash comes from your
      salary and from moving money out of investments — so every one of them is a decision about
      whether this month's progress is worth more than next year's compounding.</p>
    <div class="items">${LIFE.map(u=>{
      const done=!u.can(), afford=cash>=u.cost;
      const cls=['item',done?'owned':'',justBought===u.id?'fresh':''].filter(Boolean).join(' ');
      return `<button class="${cls}" data-l="${u.id}" ${done||!afford?'disabled':''}>`
        +`<div class="nm"><span>${u.n}</span><span class="pr">${done?'DONE':money(u.cost)}</span></div>`
        +`<div class="ef">${u.d}</div>`
        +`<div class="lfx">${u.fx}</div>`
        +`<div class="rec">In the city: ${u.world}</div>`
        +(!done&&!afford?`<div class="rec short">Short ${money(u.cost-cash)}</div>`:'')
        +`</button>`;}).join('')}</div>
    <div class="step"><div class="steplbl"><span>Aim at one</span><em>the bar at the desk tracks it</em></div>
      <div class="rrow">${lifeAvailable().map(u=>
        `<button class="rbtn ${g&&g.id===u.id?'on':''}" data-g="${u.id}">${u.n}</button>`).join('')}</div></div>
    <button class="btn ghost" id="lifeInv">Move money between cash and portfolio</button>
    <button class="btn ghost" id="lifeOut">Back</button>`;
  document.querySelectorAll('.item:not([disabled])').forEach(el=>el.addEventListener('click',()=>{
    const u=lifeById(el.dataset.l);
    if(buyLife(el.dataset.l)){
      leave();
      moment(u.n.toUpperCase(), u.world);
    }
  }));
  document.querySelectorAll('.rbtn[data-g]').forEach(el=>el.addEventListener('click',()=>{
    goal=el.dataset.g; hud(); roomLife();
  }));
  $('lifeInv').addEventListener('click',roomInvest);
  $('lifeOut').addEventListener('click',()=>roomApt());
  bindTerms();
}

/* ---------- move any amount, either direction ---------- */
function roomInvest(){
  $('sheet').innerHTML=`<div class="roomhd"><h2>Move money</h2>
      <span class="sub">Cash ${money(cash)} · portfolio ${money(port)}</span></div>
    <p class="note">${termChip('cash','Cash')} pays for rent, upgrades and nights out.
      ${termChip('portfolio','The portfolio')} is what compounds. Anything you move out of the
      portfolio stops compounding the moment you move it.</p>
    <div class="step"><div class="steplbl"><span>Into the portfolio</span></div>
      <div class="rrow">${[250,1000,5000].map(v=>
        `<button class="rbtn" data-in="${v}" ${cash<v?'disabled':''}>${money(v)}</button>`).join('')}
        <button class="rbtn" data-in="all" ${cash<50?'disabled':''}>All cash</button></div></div>
    <div class="step"><div class="steplbl"><span>Out to cash</span></div>
      <div class="rrow">${[250,1000,5000].map(v=>
        `<button class="rbtn" data-out="${v}" ${port<v?'disabled':''}>${money(v)}</button>`).join('')}
        <button class="rbtn" data-out="goal" ${!currentGoal()?'disabled':''}>Enough for the goal</button></div></div>
    <div class="step"><div class="steplbl"><span>Any amount</span></div>
      <div class="rrow">
        <button class="rbtn" data-adj="-1000">−1,000</button>
        <button class="rbtn" data-adj="-100">−100</button>
        <span class="amt" id="amtV">${money(moveAmt)}</span>
        <button class="rbtn" data-adj="100">+100</button>
        <button class="rbtn" data-adj="1000">+1,000</button>
      </div>
      <div class="rrow">
        <button class="rbtn" id="amtIn" ${cash<moveAmt||moveAmt<=0?'disabled':''}>Invest that</button>
        <button class="rbtn" id="amtOut" ${port<moveAmt||moveAmt<=0?'disabled':''}>Withdraw that</button>
      </div></div>
    ${goalHTML()}
    <button class="btn ghost" id="invOut">Back</button>`;
  const re=()=>roomInvest();
  document.querySelectorAll('.rbtn[data-in]').forEach(el=>el.addEventListener('click',()=>{
    const v=el.dataset.in==='all'?cash:+el.dataset.in;
    if(cash>=v&&v>0){cash-=v;port+=v;hud();} re();}));
  document.querySelectorAll('.rbtn[data-out]').forEach(el=>el.addEventListener('click',()=>{
    const g=currentGoal();
    const v=el.dataset.out==='goal'?Math.min(port,Math.max(0,(g?g.cost:0)-cash)):+el.dataset.out;
    if(port>=v&&v>0){port-=v;cash+=v;hud();} re();}));
  document.querySelectorAll('.rbtn[data-adj]').forEach(el=>el.addEventListener('click',()=>{
    moveAmt=Math.max(0,moveAmt+ +el.dataset.adj); re();}));
  $('amtIn').addEventListener('click',()=>{
    if(cash>=moveAmt&&moveAmt>0){cash-=moveAmt;port+=moveAmt;hud();} re();});
  $('amtOut').addEventListener('click',()=>{
    if(port>=moveAmt&&moveAmt>0){port-=moveAmt;cash+=moveAmt;hud();} re();});
  $('invOut').addEventListener('click',roomLife);
  bindTerms();
}

/* ---------- living costs, and the month-end statement ---------- */
/* Rent is housing. Living costs are everything else -- food, transport, the
   things nobody itemises until money is tight. They scale with lifestyle,
   because a bigger life costs more to run even when nothing happens. */
function livingCosts(){
  return 640+homeTier*260+carTier*90+(owned.club?180:0);
}

function cashflowHTML(inc,exp,forced){
  const fee=arc===2?fundFee():0;
  const pay=jobPay();
  const app=appLive?700:0;
  const tax=incomeTax();
  const rent=housingMonthly();
  const live=livingCosts();
  const carC=carMonthly();
  const debtC=debtService();
  const open=cash-(inc-exp);
  const row=(l,v,cls)=>`<div class="cf"><span>${l}</span><span class="${cls||''}">${v}</span></div>`;
  return `<section class="statement">
    <div class="cfhd">Cash flow · month ${month}</div>
    ${row('Opening cash',money(open))}
    <div class="cfsec">Money in</div>
    ${pay?row(job().n,'+'+money(pay),'pos'):''}
    ${fee?row('Fund fees','+'+money(fee),'pos'):''}
    ${app?row('App revenue','+'+money(app),'pos'):''}
    ${row('Total in','+'+money(inc),'pos tot')}
    <div class="cfsec">Money out</div>
    ${row(home().own?'Mortgage, tax and upkeep':'Rent','−'+money(rent),'neg')}
    ${row('Living costs','−'+money(live),'neg')}
    ${carC?row('Car · '+car().n,'−'+money(carC),'neg'):''}
    ${debtC?row('Interest on borrowing','−'+money(debtC),'neg'):''}
    ${row('Income tax','−'+money(tax),'neg')}
    ${row('Total out','−'+money(exp),'neg tot')}
    ${row('Net for the month',(inc-exp>=0?'+':'')+money(inc-exp),(inc-exp>=0?'pos':'neg')+' tot')}
    ${forced?row('Sold from the portfolio to cover it','−'+money(forced),'neg'):''}
    ${row('Closing cash',money(cash),'tot')}
  </section>`;
}

/* ---------- HUD explanations ---------- */
function bindHudTerms(){
  [['podFocus','focusStat'],['podSess','sessionsStat'],
   ['podCash','cash'],['podPort','portfolio'],['podAum','aum']].forEach(([id,term])=>{
    const el=$(id);
    if(el&&!el._bound){el._bound=1;el.addEventListener('click',()=>openTerm(term));}
  });
}
