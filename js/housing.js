/* ==================== HOUSING ====================
   Every tier changes a different system, not a number:
     tier 1  focus decays half as fast          (slope)
     tier 2  home office -> research actions    (information)
     tier 3  hosting -> raises capital          (access to money)
     tier 4  both, at scale, plus a focus ceiling of 7
   Renting is a pure cost. Buying converts rent into a mortgage plus property tax
   and maintenance, and puts equity on the balance sheet -- so it is a genuine
   rent-versus-buy decision rather than an upgrade button. */

const HOMES=[
 {t:0,n:'Apartment 4B',    d:'Third floor, no lift, one window that matters.',
  price:0,      rent:1200, own:false, decay:1, cap:5, office:0, host:0,
  ef:'Where you start. Focus falls a point every session and there is nowhere to work.'},
 {t:1,n:'Riverside one-bed',d:'A room you can actually think in.',
  price:0,      rent:1800, own:false, decay:2, cap:5, office:0, host:0,
  ef:'Focus decays half as fast — a point every other session. Still rented, still dead money.'},
 {t:2,n:'Warehouse loft',  d:'Bought, not rented. A desk with two screens and a door that shuts.',
  price:320000, rent:0,    own:true,  decay:2, cap:6, office:2, host:0,
  ef:'A home office: two research actions a month, each one un-redacting a metric before you commit. Focus ceiling 6.'},
 {t:3,n:'Cavendish penthouse',d:'The floor people mention having been to.',
  price:760000, rent:0,    own:true,  decay:3, cap:6, office:3, host:1,
  ef:'Three research actions. Hosting raises outside capital — a dinner here moves money.'},
 {t:4,n:'Coast estate',    d:'Gates, gravel, and a view worth the drive.',
  price:1950000,rent:0,    own:true,  decay:4, cap:7, office:4, host:2,
  ef:'Four research actions, focus ceiling 7, and hosting at a scale that changes what people offer you.'}
];

const home=()=>HOMES[homeTier];
const focusCap=()=>home().cap;
const researchPerMonth=()=>home().office;
const hostPower=()=>home().host;

/* Owned property: 1.1%/yr tax, plus maintenance that scales with the building. */
const propertyTax=()=>home().own?Math.round(home().price*0.011/12):0;
const maintenance=()=>home().own?Math.round(home().price*0.0045/12):0;
const mortgage=()=>home().own?Math.round(home().price*0.065/12):0;   /* interest-only */
function housingMonthly(){return home().rent+mortgage()+propertyTax()+maintenance();}
const homeEquity=()=>home().own?Math.round(home().price*0.30):0;      /* 30% deposit put down */

/* focus decays once every `decay` sessions -- tier 1 halves it, tier 4 quarters it */
function focusDecay(){return (idx%home().decay===0)?1:0;}

/* ---------- research: the home office ---------- */
/* Spends one action to reveal a metric focus has redacted, for this card only. */
let revealed=[];
function canResearch(){return research>0&&home().office>0;}
function doResearch(key){
  if(!canResearch()||revealed.includes(key)) return false;
  research--; revealed.push(key); hud(); return true;
}
const clearResearch=()=>{revealed=[];};

/* ---------- hosting: turning a house into capital ---------- */
function hostCost(){return [0,0,0,3200,9000][homeTier];}
function hostGain(){
  /* contacts convert to capital; a bigger house converts more of them */
  return {rep:hostPower()*2, contacts:hostPower()*2,
          capital:Math.round(hostPower()*(arc===2?aum*0.035:9000))};
}
function roomHost(){
  const c=hostCost(), g=hostGain();
  const can=cash>=c&&hostPower()>0;
  $('sheet').innerHTML=`<div class="roomhd"><h2>Host a dinner</h2>
      <span class="sub">${home().n} · cash ${money(cash)}</span></div>
    <p class="note">A table, a caterer, and eight people who allocate other people's money.
      This is what the square footage is actually for.</p>
    <div class="ledger">
      <div class="lr"><span>Cost</span><span class="neg">−${money(c)}</span></div>
      <div class="lr"><span>Reputation</span><span class="pos">+${g.rep}</span></div>
      <div class="lr"><span>Contacts</span><span class="pos">+${g.contacts}</span></div>
      <div class="lr"><span>${arc===2?'New subscriptions':'Angel capital offered'}</span><span class="pos">+${money(g.capital)}</span></div>
    </div>
    <button class="btn" id="doHost" ${can?'':'disabled'}>${can?'Host it · '+money(c):'Not enough cash'}</button>
    <button class="btn ghost" id="hostBack">Not tonight</button>`;
  if(can) $('doHost').addEventListener('click',()=>{
    cash-=c; rep+=g.rep; contacts+=g.contacts;
    if(arc===2){aum+=g.capital;aumStart+=g.capital;} else {port+=g.capital;}
    hud(); leave();
    moment('THE ROOM WORKED', money(g.capital)+' committed');
  });
  $('hostBack').addEventListener('click',()=>roomApt());
}

/* ---------- the estate agent ---------- */
function roomRealtor(){
  const cur=home();
  $('sheet').innerHTML=`<div class="roomhd"><h2>HALE PROPERTY</h2>
      <span class="sub">Leasing &amp; sales · cash ${money(cash)}</span></div>
    <p class="note">You live in <strong>${cur.n}</strong>, costing ${money(housingMonthly())} a month
      ${cur.own?`(mortgage ${money(mortgage())}, tax ${money(propertyTax())}, upkeep ${money(maintenance())})`
               :`in rent`}.</p>
    <div class="items">${HOMES.slice(1).map(h=>{
      const have=homeTier>=h.t;
      const deposit=h.own?Math.round(h.price*0.30):Math.round(h.rent*2);
      const afford=cash>=deposit;
      const dis=have||!afford;
      /* derived from the same rates housingMonthly() charges, so the shop cannot understate it */
      const monthly=h.rent+(h.own?Math.round(h.price*0.065/12)+Math.round(h.price*0.011/12)+Math.round(h.price*0.0045/12):0);
      return `<button class="item ${have?'owned':''}" data-t="${h.t}" ${dis?'disabled':''}>
        <div class="nm"><span>${h.n}</span><span class="pr">${have?'LIVED IN':(h.own?'Deposit '+money(deposit):'Deposit '+money(deposit))}</span></div>
        <div class="ef">${h.d} ${h.ef}</div>
        <div class="carstat">
          <span>${money(monthly)}/mo</span>
          <span>focus cap ${h.cap}</span>
          <span>${h.office?h.office+' research/mo':'no home office'}</span>
          <span>${h.host?'hosting x'+h.host:'no hosting'}</span>
          <span>${h.own?'owned · '+money(Math.round(h.price*0.30))+' equity':'rented'}</span></div>
        ${!have&&!afford?`<div class="rec">Short ${money(deposit-cash)}</div>`:''}</button>`;
    }).join('')}</div>
    <p class="note k" style="margin-top:18px">Buying costs <em>more</em> every month than renting,
      and takes a deposit out of the portfolio where it would otherwise have compounded. What you get
      back is equity, a room to work in, and eventually a room worth hosting in. Whether that trade is
      worth it depends entirely on what your portfolio would have done with the deposit.</p>`;
  document.querySelectorAll('.item:not([disabled])').forEach(el=>el.addEventListener('click',()=>{
    const t=+el.dataset.t, h=HOMES[t];
    const deposit=h.own?Math.round(h.price*0.30):Math.round(h.rent*2);
    if(cash<deposit) return;
    cash-=deposit; homeTier=t; focus=Math.min(focus,focusCap());
    research=researchPerMonth();
    hud(); leave();
    moment(h.own?'KEYS SIGNED FOR':'MOVED IN', h.n);
  }));
}
