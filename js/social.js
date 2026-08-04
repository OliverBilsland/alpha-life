/* ==================== LIFESTYLE & STATUS ====================
   Two currencies that are not money:
     rep       what rooms will have you, and how much capital you are offered
     contacts  people who will actually write a cheque, spent by converting them

   Nothing here is decoration. Every venue either gates something, reveals
   something, or converts one currency into another. */

const REP_TIERS=[
 {at:0,  n:'Unknown'},{at:10, n:'Known on the desk'},{at:25, n:'Spoken of'},
 {at:50, n:'Sought out'},{at:90, n:'A name'}
];
const repTier=()=>REP_TIERS.filter(t=>rep>=t.at).pop();

/* Reputation also accrues from doing the job well -- a sound call is noticed. */
function repFromCall(sound){ if(sound){rep+=1; if(streak>=3) rep+=1;} }

/* The fund offer scales with standing: this is rep's biggest single payoff. */
const offerMultiplier=()=>(1+Math.min(rep,120)/120)*(knows('kestrel')?1.25:1);
const offeredCapital=()=>Math.round(AUM0*offerMultiplier());

/* RELATIONSHIPS. Contacts were a counter; these are people. Each one is met at a
   specific venue, needs a number of meetings to mature, and unlocks exactly one
   thing that nothing else in the game provides. */
const PEOPLE=[
 {id:'kestrel',n:'Ana Kestrel',   role:'Allocator, family office', at:'headland', need:3,
  gives:'Will seed a fund at better terms: +25% on any capital you are offered.'},
 {id:'moss',   n:'Daniel Moss',   role:'Sell-side analyst',        at:'bar',      need:2,
  gives:'Reads you his notes. The street line shows without the terminal.'},
 {id:'vance',  n:'Priya Vance',   role:'Prime brokerage',          at:'club',     need:3,
  gives:'Cheaper borrow: short fees fall by a third.'},
 {id:'ozal',   n:'Hakan Ozal',    role:'Credit desk',              at:'rostrum',  need:2,
  gives:'Flags issuers he would not lend to. Bond defaults are shown in advance.'},
 {id:'renn',   n:'Marta Renn',    role:'Headhunter',               at:'recruit',  need:2,
  gives:'Keeps you employed: a failed review costs no seat, once.'}
];
const metWith=id=>met[id]||0;
const knows=id=>metWith(id)>=(PEOPLE.find(p=>p.id===id)||{need:99}).need;
function meetAt(venue){
  const here=PEOPLE.filter(p=>p.at===venue&&!knows(p.id));
  if(!here.length) return null;
  const p=here[0];
  met[p.id]=metWith(p.id)+1;
  return {p, now:knows(p.id)};
}
function relationshipHTML(){
  return `<div class="reftab">${PEOPLE.map(p=>`<div><b>${p.n}</b>
    <span>${p.role} \u00b7 ${p.gives}</span>
    <em>${knows(p.id)?'known':metWith(p.id)+'/'+p.need}</em></div>`).join('')}</div>`;
}

/* ---------- the gym: the only non-money route to readable metrics ---------- */
function roomGym(){
  const cost=140, can=cash>=cost&&!gymMonth;
  $('sheet').innerHTML=`<div class="roomhd"><h2>THE YARD</h2>
      <span class="sub">Gym · cash ${money(cash)}</span></div>
    <p class="note">An hour of not looking at a screen. It does not restore focus — it raises the
      <strong>ceiling</strong> for the rest of the month, so what you buy at the bar goes further.</p>
    <p class="note">Focus ceiling is <strong>${focusCap()}</strong>${gymMonth?' (already raised this month)':''}.</p>
    <button class="btn" id="train" ${can?'':'disabled'}>${gymMonth?'Already done this month':can?'Train · '+money(cost):'Not enough cash'}</button>
    <p class="note k" style="margin-top:18px">Housing sets how fast focus falls, venues set where it
      sits, and this sets how high it can go. Three systems, one resource, no overlap.</p>
    <button class="btn ghost" id="gOut">Leave</button>`;
  if(can) $('train').addEventListener('click',()=>{
    cash-=cost; gymMonth=true; rep+=1; hud();
    toast('Ceiling raised for the month.'); leave();
  });
  $('gOut').addEventListener('click',leave);
}

/* ---------- the club: membership converts visits into contacts ---------- */
const CLUB_FEE=4800;
function roomClub(){
  const member=!!owned.club;
  const canJoin=!member&&cash>=CLUB_FEE&&rep>=25;
  const cost=member?120:250;
  const can=cash>=cost;
  $('sheet').innerHTML=`<div class="roomhd"><h2>MERIDIAN CLUB</h2>
      <span class="sub">${member?'Member':'Guest'} · ${repTier().n}</span>
      </div>
    <p class="note">Loud, expensive, and full of people who allocate capital.</p>
    ${member
      ? `<p class="note">As a member the room opens up: every evening here restores focus
         <em>and</em> adds a contact. Contacts are people who will take a call about money,
         and they are spent when you actually ask.</p>`
      : `<p class="note">Guests get the bar and the noise. Members get introduced.
         Membership is ${money(CLUB_FEE)} a year and they will not take you below
         <strong>25 reputation</strong> — you have ${rep}.</p>`}
    <div class="ledger">
      <div class="lr"><span>Reputation</span><span>${rep} · ${repTier().n}</span></div>
      <div class="lr"><span>Contacts</span><span>${contacts}</span></div>
    </div>
    <button class="btn" id="buy" ${can?'':'disabled'}>${can?`Stay a while · ${money(cost)}`:'Not enough cash'}</button>
    ${!member?`<button class="btn ghost" id="join" ${canJoin?'':'disabled'}>${
      rep<25?`Membership needs 25 reputation`:`Take membership · ${money(CLUB_FEE)}/yr`}</button>`:''}
    <p class="note k" style="margin-top:18px">This is consumption that compounds. The drink buys back
      focus; the membership buys the introductions that later become capital.</p>`;
  if(can) $('buy').addEventListener('click',()=>{
    cash-=cost; focus=Math.min(focusCap(),focus+5);
    if(member){contacts+=1;rep+=1;}
    const m=member?meetAt('club'):null;
    hud();
    if(m&&m.now) moment(m.p.n.toUpperCase(),m.p.role);
    else toast(m?'You spoke to '+m.p.n+' again.':member?'Focus restored. Two introductions made.':'Focus restored.');
    leave();
  });
  const j=$('join');
  if(j&&canJoin) j.addEventListener('click',()=>{
    cash-=CLUB_FEE; owned.club=true; rep+=6; hud(); roomClub();
    toast('Elected. The room is different from the inside.');
  });
}

/* ---------- the rostrum: buy standing outright ---------- */
/* Cost per point must FALL as the tier rises, or the larger gifts are dominated
   and no one would ever buy them: 500 -> 409 -> 368 per point. */
const GALAS=[
 {n:'Table at a benefit',   cost:2500,  rep:5,  contacts:1,
  d:'A table, a cheque, and your name in the programme.'},
 {n:'Named sponsor',        cost:9000,  rep:22, contacts:4,
  d:'Your name on the evening. People who did not know you now do.'},
 {n:'Endow a fellowship',   cost:28000, rep:76, contacts:9,
  d:'A permanent association with something that outlasts a good year.'}
];
function roomRostrum(){
  $('sheet').innerHTML=`<div class="roomhd"><h2>THE ROSTRUM</h2>
      <span class="sub">Benefit galas · ${repTier().n} · ${rep} rep</span></div>
    <p class="note k">Reputation is the one currency you can buy outright, and it is not vanity:
      it gates the portfolio-manager seat, it sets how much outside capital you are offered, and
      the private club will not seat you without it.</p>
    <div class="items">${GALAS.map((g,i)=>{
      const can=cash>=g.cost;
      return `<button class="item" data-g="${i}" ${can?'':'disabled'}>
        <div class="nm"><span>${g.n}</span><span class="pr">${money(g.cost)}</span></div>
        <div class="ef">${g.d}</div>
        <div class="carstat"><span>+${g.rep} reputation</span><span>+${g.contacts} contacts</span>
          <span>${(g.cost/g.rep).toFixed(0)} per point</span></div>
        ${!can?`<div class="rec">Short ${money(g.cost-cash)}</div>`:''}</button>`;
    }).join('')}</div>
    <p class="note" style="margin-top:16px">Current offer if you raised capital today:
      <strong>${money(offeredCapital())}</strong> — ${offerMultiplier().toFixed(2)}× the base, because
      of your standing.</p>
    <button class="btn ghost" id="roOut">Leave</button>`;
  document.querySelectorAll('.item:not([disabled])').forEach(el=>el.addEventListener('click',()=>{
    const g=GALAS[+el.dataset.g]; if(cash<g.cost) return;
    cash-=g.cost; rep+=g.rep; contacts+=g.contacts;
    const m=meetAt('rostrum'); hud(); roomRostrum();
    if(m&&m.now) moment(m.p.n.toUpperCase(),m.p.role); else toast('+'+g.rep+' reputation.');
  }));
  $('roOut').addEventListener('click',leave);
}

/* ---------- the headland: contacts become committed capital ---------- */
const HEADLAND_REP=50;
/* A contact should be worth roughly one good trade, not a season of them. It was
   $15,000 a head against $120 to make one at the club -- a 125x pump. */
function contactValue(){return arc===2?Math.round(aum*0.012):Math.max(4500,Math.round(port*0.015));}
function roomHeadland(){
  const allowed=rep>=HEADLAND_REP;
  const n=headlandMonth===month?0:Math.min(contacts,4);
  const raise=n*contactValue();
  $('sheet').innerHTML=`<div class="roomhd"><h2>THE HEADLAND</h2>
      <span class="sub">Private club · needs ${HEADLAND_REP} reputation</span></div>
    ${allowed
      ? `<p class="note">The room where money is actually committed. Every contact you have made can
         be converted here, once, into capital — at a better rate than any dinner or gala.</p>`
      : `<p class="note">You are not seated. ${HEADLAND_REP} reputation gets you in; you have
         <strong>${rep}</strong>. Galas, membership and a decent run of sound calls all count.</p>`}
    <div class="ledger">
      <div class="lr"><span>Contacts</span><span>${contacts}</span></div>
      <div class="lr"><span>Convertible now</span><span>${headlandMonth===month?'none — once a month':n+' (max four a visit)'}</span></div>
      <div class="lr"><span>Per contact</span><span>${money(contactValue())}</span></div>
      <div class="lr"><span>Raise</span><span class="pos">+${money(raise)}</span></div>
    </div>
    <button class="btn" id="raise" ${allowed&&n>0?'':'disabled'}>${
      !allowed?'Not seated':headlandMonth===month?'Already raised this month'
      :n?`Convert ${n} contact${n>1?'s':''} · ${money(raise)}`:'No contacts to convert'}</button>
    <button class="btn ghost" id="hOut">Leave</button>`;
  if(allowed&&n>0) $('raise').addEventListener('click',()=>{
    const m=meetAt('headland');
    if(m&&m.now) moment(m.p.n.toUpperCase(),m.p.role);
    contacts-=n; headlandMonth=month;
    if(arc===2){aum+=raise;aumStart+=raise;} else {port+=raise;}
    rep+=2; hud(); leave();
    moment('COMMITTED', money(raise)+' raised');
  });
  $('hOut').addEventListener('click',leave);
}

/* ---------- the exchange floor: buy a sixth session ---------- */
const FLOOR_FEE=6500;
function roomFloor(){
  const can=cash>=FLOOR_FEE&&!floorMonth&&sessionsLeft>0;
  $('sheet').innerHTML=`<div class="roomhd"><h2>THE FLOOR</h2>
      <span class="sub">Exchange · ${sessionsLeft} sessions left</span></div>
    <p class="note">A seat on the floor for the rest of the month. It buys you one more
      <strong>trading session</strong> — the only thing in the game that adds a decision rather than
      improving one.</p>
    <p class="note">Five sessions is the shape of a month. A sixth is a real edge, and it is priced
      like one: ${money(FLOOR_FEE)}, once a month.</p>
    <button class="btn" id="seat" ${can?'':'disabled'}>${
      floorMonth?'Already taken this month':sessionsLeft<=0?'The month is over':
      can?'Take a seat · '+money(FLOOR_FEE):'Not enough cash'}</button>
    <button class="btn ghost" id="fOut">Leave</button>`;
  if(can) $('seat').addEventListener('click',()=>{
    cash-=FLOOR_FEE; sessionsLeft++; floorMonth=true; rep+=2; hud(); leave();
    toast('Sixth session bought.');
  });
  $('fOut').addEventListener('click',leave);
}

/* ---------- your own base rates, once you have paid to see them ---------- */
function statsHTML(){
  if(!owned.stats||idx===0) return '';
  const sound=quad.gpgo+quad.gpbo, hit=quad.gpgo+quad.bpgo;
  const pc=n=>Math.round(n/idx*100)+'%';
  return `<section class="sig"><div class="steplbl"><span>Your base rates</span>
      <em>Statistics · ${idx} calls</em></div>
    <div class="reftab">
      <div><b>Sound process</b><span>How often the call was defensible</span><em>${pc(sound)}</em></div>
      <div><b>Made money</b><span>How often the market agreed</span><em>${pc(hit)}</em></div>
      <div><b>Right and paid</b><span>Both at once</span><em>${pc(quad.gpgo)}</em></div>
      <div><b>Right and punished</b><span>The cost of being early</span><em>${pc(quad.gpbo)}</em></div>
      <div><b>Wrong and paid</b><span>Luck you should not bank on</span><em>${pc(quad.bpgo)}</em></div>
    </div></section>`;
}
