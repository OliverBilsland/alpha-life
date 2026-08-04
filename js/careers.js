/* ==================== CAREERS ====================
   A ladder where every rung changes three things: what you are paid, what
   capital you can reach, and what you are allowed to do at the desk.

   Requirements are always process + a specific asset, never money alone. You
   cannot buy a promotion; you can only fail to qualify for one. */

const JOBS=[
 {t:0,n:'Junior analyst', firm:'Ardent Capital', pay:2400,  credit:0,
  req:{}, sizes:['small','std'],
  d:'You are given two names and asked which is better. Nobody reads the answer yet.'},
 {t:1,n:'Analyst',        firm:'Ardent Capital', pay:4800,  credit:0,
  req:{car:1}, sizes:['small','std','high'],
  d:'The desk across town. It needs someone who can get there, which means a car.'},
 {t:2,n:'Senior analyst', firm:'Ardent Capital', pay:9500,  credit:1,
  req:{xp:600, item:'acct'}, sizes:['small','std','high'],
  d:'You sign the notes now. A credit line against your salary comes with the title.'},
 {t:3,n:'Portfolio manager',firm:'Ardent Capital',pay:19000, credit:3,
  req:{xp:1500, item:'term', car:2, rep:20}, sizes:['small','std','high','conc'],
  d:'Your own book. Position sizes come off the book, not your savings, and concentration is allowed.'},
 {t:4,n:'Fund founder',   firm:'Your own name', pay:0,      credit:0,
  req:{arc:2}, sizes:['small','std','high','conc'],
  d:'No salary. You eat what the fund earns and the investors can leave whenever they like.'}
];

const job=()=>JOBS[careerStage];
const creditLine=()=>Math.round(job().credit*job().pay);
const allowedSizes=()=>job().sizes;

function jobPay(){return arc===2?0:job().pay;}

/* Everything a rung asks for, and whether it is satisfied. */
function jobReqs(j){
  const r=j.req, out=[];
  if(r.car!==undefined)  out.push({ok:carTier>=r.car,  t:`${CARS[r.car].n} or better`});
  if(r.xp!==undefined)   out.push({ok:xp>=r.xp,        t:`${r.xp} process XP (${xp} now)`});
  if(r.item==='acct')    out.push({ok:!!owned.acct,    t:'Accounting course'});
  if(r.item==='term')    out.push({ok:!!owned.term,    t:'Market terminal'});
  if(r.rep!==undefined)  out.push({ok:rep>=r.rep,      t:`${r.rep} reputation (${rep} now)`});
  if(r.arc!==undefined)  out.push({ok:arc>=r.arc,      t:'Outside capital raised'});
  return out;
}
const jobEligible=j=>jobReqs(j).every(x=>x.ok);
const nextJob=()=>JOBS[careerStage+1]||null;

function promote(){
  const n=nextJob(); if(!n||!jobEligible(n)) return false;
  careerStage=n.t;
  if(!allowedSizes().includes(conv)) conv='std';
  hud(); return true;
}

/* ---------- borrowing ---------- */
/* A credit line is capital access, not free money: it is drawn into the
   portfolio and serviced monthly until repaid. */
function debtService(){return Math.round(debt*0.009);}   /* ~11%/yr, punitive on purpose */
function drawCredit(amount){
  const room=creditLine()-debt;
  const a=Math.min(amount,room);
  if(a<=0) return 0;
  debt+=a; port+=a; hud(); return a;
}
function repayCredit(amount){
  const a=Math.min(amount,debt,cash);
  if(a<=0) return 0;
  debt-=a; cash-=a; hud(); return a;
}

function roomBank(){
  const room=creditLine()-debt;
  $('sheet').innerHTML=`<div class="roomhd"><h2>MERIDIAN BANK</h2>
      <span class="sub">Credit · ${job().n}</span></div>
    ${creditLine()?`<p class="note">Your title carries a credit line of
      <strong>${money(creditLine())}</strong> — ${job().credit}× salary. It costs
      ${money(Math.round(0.009*100))} a month per $100 drawn, which is expensive, and it is
      capital you can put to work today instead of in six months.</p>`
     :`<p class="note">No credit line at your level. Banks lend against titles, and yours is not
      one they lend against yet. Senior analyst carries one times salary.</p>`}
    <div class="ledger">
      <div class="lr"><span>Credit line</span><span>${money(creditLine())}</span></div>
      <div class="lr"><span>Drawn</span><span class="neg">${money(debt)}</span></div>
      <div class="lr"><span>Available</span><span class="pos">${money(Math.max(0,room))}</span></div>
      <div class="lr"><span>Monthly interest</span><span class="neg">−${money(debtService())}</span></div>
    </div>
    <div class="rrow">
      ${[5000,20000,50000].map(v=>`<button class="rbtn" data-d="${v}" ${room<v?'disabled':''}>Draw ${money(v)}</button>`).join('')}
      <button class="rbtn" data-d="max" ${room<1000?'disabled':''}>Draw the lot</button>
      <button class="rbtn" data-p="max" ${debt<1||cash<1?'disabled':''}>Repay from cash</button>
    </div>
    <p class="note k" style="margin-top:18px">Borrowed money compounds at your returns and costs at
      the bank's. It is the fastest way to make a good process rich and a bad one bankrupt, which is
      exactly why it is gated behind a title you had to earn.</p>
    <button class="btn ghost" id="bOut">Leave</button>`;
  document.querySelectorAll('.rbtn[data-d]').forEach(el=>el.addEventListener('click',()=>{
    drawCredit(el.dataset.d==='max'?creditLine()-debt:+el.dataset.d);roomBank();}));
  document.querySelectorAll('.rbtn[data-p]').forEach(el=>el.addEventListener('click',()=>{
    repayCredit(cash);roomBank();}));
  $('bOut').addEventListener('click',leave);
}

/* ---------- the recruiter ---------- */
function roomRecruit(){
  const n=nextJob();
  $('sheet').innerHTML=`<div class="roomhd"><h2>HOLBROOK &amp; CO</h2>
      <span class="sub">Recruitment · ${job().n}</span></div>
    <p class="note k">Seats are filled on evidence. They read your decision record, not your balance —
      which is why the requirements below are process and equipment, never cash.</p>
    <div class="items">${JOBS.map(j=>{
      const have=careerStage>=j.t, isNext=j.t===careerStage+1;
      const reqs=jobReqs(j);
      return `<button class="item ${have?'owned':''}" data-t="${j.t}" disabled>
        <div class="nm"><span>${j.n}</span><span class="pr">${have?'HELD':j.pay?money(j.pay)+'/mo':'fees only'}</span></div>
        <div class="ef">${j.d}</div>
        <div class="carstat">
          <span>${j.pay?money(j.pay)+'/mo':'no salary'}</span>
          <span>${j.credit?j.credit+'× credit line':'no credit'}</span>
          <span>${j.sizes.length} position sizes</span></div>
        ${!have&&reqs.length?`<div class="reqs">${reqs.map(x=>
          `<span class="${x.ok?'ok':'no'}">${x.ok?'✓':'✕'} ${x.t}</span>`).join('')}</div>`:''}
      </button>`}).join('')}</div>
    ${n?(jobEligible(n)
      ? `<button class="btn" id="takeJob">Take the ${n.n.toLowerCase()} seat</button>`
      : `<p class="note" style="margin-top:16px">You do not qualify for ${n.n.toLowerCase()} yet.</p>`)
     :`<p class="note" style="margin-top:16px">There is nothing above where you are.</p>`}
    <button class="btn ghost" id="rOut">Leave</button>`;
  const b=$('takeJob');
  if(b) b.addEventListener('click',()=>{
    const to=nextJob(); if(promote()){leave();moment(to.n.toUpperCase(),money(to.pay)+' a month');}
  });
  $('rOut').addEventListener('click',leave);
}
