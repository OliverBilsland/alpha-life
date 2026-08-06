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
  price:0,      rent:1800, own:false, decay:2, cap:6, office:0, host:0,
  ef:'Maximum focus rises to 6, and it decays half as fast — a point every other session.'},
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

/* ---------- where you actually live ----------
   A home used to be a line on a menu: you bought a penthouse and carried on
   walking into the same third-floor flat. Each tier now has a real site, and
   the building marked HOME on the map is the one you own — it moves across the
   city as you climb, and the address is the reward as much as the room is.

   Every site sits in a district you can reach at that point, and buying is
   refused outright if you cannot reach it (see roomRealtor) — moving into a
   house you are physically barred from would strand you with no way home.

   `style` drives the extras drawn in art.js: nothing, then planters, then a
   working loft, then a tower, then gates and a pool. */
const HOME_SITES=[
 {t:0, x:90,   y:180,  w:260, h:200, c:'#4A4036', s:'Home',            style:'flat'},
 {t:1, x:1210, y:1290, w:280, h:200, c:'#46413C', s:'Home · riverside',style:'riverside'},
 {t:2, x:1830, y:1290, w:240, h:210, c:'#3F4A55', s:'Home · the loft', style:'loft'},
 {t:3, x:2210, y:1600, w:300, h:190, c:'#3A3350', s:'Home · penthouse',style:'penthouse'},
 {t:4, x:3760, y:1600, w:250, h:190, c:'#4A4443', s:'Home · the estate',style:'estate'}
];
const homeSite=t=>HOME_SITES[t===undefined?homeTier:t]||HOME_SITES[0];
/* "needs a Halden Verge" but "needs an Okuda Volt" */
const aOrAn=s=>(/^[aeiou]/i.test(String(s))?'an ':'a ')+s;
/* which car tier the address needs — read off the map rather than hardcoded */
const homeReq=t=>districtAt(homeSite(t).x).req;
const homeReachable=t=>carTier>=homeReq(t);

/* Rewrite the `apt` entry in B so the world contains the home you actually
   own. Keeping the id means rooms.js, the props table and every save already
   written go on working untouched. */
function syncHome(){
  const b=B.find(x=>x.id==='apt');
  if(!b) return;
  const st=homeSite();
  b.x=st.x; b.y=st.y; b.w=st.w; b.h=st.h; b.c=st.c;
  b.n=home().n.toUpperCase(); b.s=st.s; b.style=st.style; b.k='home';
}

/* THE PROPERTY MARKET. Values move every month, so a house is an asset with a
   price rather than a fixed badge -- and buying becomes a question of when, not
   just whether. propIndex is a multiplier on every price and on your equity. */
const HOUSE_PRICE=h=>Math.round(h.price*propIndex);
function stepPropertyMarket(){
  /* mean-reverting drift: property is slow, and it does turn */
  const pull=(1-propIndex)*0.06;
  const shock=(Math.random()*2-1)*0.028;
  propIndex=Math.max(0.62,Math.min(1.55,propIndex+pull+shock));
  propHist.push(Math.round(propIndex*1000)/1000);
  if(propHist.length>8) propHist.shift();
}
const propTrend=()=>{
  if(propHist.length<2) return 0;
  return propIndex/propHist[0]-1;
};
const focusCap=()=>home().cap+(gymMonth?1:0);
const researchPerMonth=()=>home().office;
const hostPower=()=>home().host;

/* Owned property: 1.1%/yr tax, plus maintenance that scales with the building. */
const propertyTax=()=>home().own?Math.round(HOUSE_PRICE(home())*0.011/12):0;
const maintenance=()=>home().own?Math.round(HOUSE_PRICE(home())*0.0045/12):0;
/* the mortgage is fixed at what you paid; only tax, upkeep and equity float */
const mortgage=()=>home().own?Math.round(home().price*0.065/12):0;
function housingMonthly(){return home().rent+mortgage()+propertyTax()+maintenance();}
/* you own 30% of the house outright, so your equity moves with the whole value */
const homeEquity=()=>home().own?Math.round(HOUSE_PRICE(home())-home().price*0.70):0;

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
/* A dinner is for people you already know. It CONSUMES contacts rather than
   manufacturing them, and happens once a month -- otherwise it was a pure money
   pump: pay the caterer, receive twice the caterer, repeat. */
const hostNeeds=()=>hostPower()*2;
function hostGain(){
  const used=Math.min(contacts,hostNeeds());
  return {rep:hostPower()*2, used,
          capital:Math.round(used*(arc===2?aum*0.012:Math.max(3500,port*0.012)))};
}
const canHost=()=>hostPower()>0&&hostedMonth!==month&&contacts>=hostNeeds();
function roomHost(){
  const c=hostCost(), g=hostGain();
  const can=cash>=c&&canHost();
  $('sheet').innerHTML=`<div class="roomhd"><h2>Host a dinner</h2>
      <span class="sub">${home().n} · cash ${money(cash)}</span></div>
    <p class="note">A table, a caterer, and eight people who allocate other people's money.
      This is what the square footage is actually for.</p>
    <div class="ledger">
      <div class="lr"><span>Cost</span><span class="neg">−${money(c)}</span></div>
      <div class="lr"><span>Guests needed</span><span class="${contacts>=hostNeeds()?'':'neg'}">${hostNeeds()} contacts (you have ${contacts})</span></div>
      <div class="lr"><span>Reputation</span><span class="pos">+${g.rep}</span></div>
      <div class="lr"><span>${arc===2?'New subscriptions':'Angel capital offered'}</span><span class="pos">+${money(g.capital)}</span></div>
    </div>
    <button class="btn" id="doHost" ${can?'':'disabled'}>${
      hostedMonth===month?'Already hosted this month'
      :contacts<hostNeeds()?'Not enough people to invite'
      :cash<c?'Not enough cash':'Host it · '+money(c)}</button>
    <button class="btn ghost" id="hostBack">Not tonight</button>`;
  if(can) $('doHost').addEventListener('click',()=>{
    cash-=c; rep+=g.rep; contacts-=g.used; hostedMonth=month;
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
    ${cur.own?`<p class="note ${propTrend()>=0?'':'k'}">The market is
      <strong>${propIndex>=1?'up':'down'} ${Math.abs((propIndex-1)*100).toFixed(1)}%</strong> on where
      it started${propHist.length>1?`, and ${propTrend()>=0?'rising':'falling'} over the last few months`:''}.
      Your equity is ${money(homeEquity())} on a house now worth ${money(HOUSE_PRICE(cur))}.</p>`
     :`<p class="note">Property is <strong>${propIndex>=1?'up':'down'} ${Math.abs((propIndex-1)*100).toFixed(1)}%</strong>
      on where it started. Everything below is priced at today's market.</p>`}
    <p class="note">You live in <strong>${cur.n}</strong>, costing ${money(housingMonthly())} a month
      ${cur.own?`(mortgage ${money(mortgage())}, tax ${money(propertyTax())}, upkeep ${money(maintenance())})`
               :`in rent`}.</p>
    <div class="items">${HOMES.slice(1).map(h=>{
      const have=homeTier>=h.t;
      const deposit=h.own?Math.round(HOUSE_PRICE(h)*0.30):Math.round(h.rent*2);
      const afford=cash>=deposit;
      /* You cannot live somewhere you cannot drive to. Without this, buying the
         Coast estate before the car that opens the Coast puts your front door
         behind a checkpoint and leaves you with nowhere to sleep. */
      const reach=homeReachable(h.t);
      const dis=have||!afford||!reach;
      const addr=districtAt(homeSite(h.t).x);
      /* derived from the same rates housingMonthly() charges, so the shop cannot understate it */
      const monthly=h.rent+(h.own?Math.round(h.price*0.065/12)+Math.round(HOUSE_PRICE(h)*0.011/12)+Math.round(HOUSE_PRICE(h)*0.0045/12):0);
      return `<button class="item ${have?'owned':''}" data-t="${h.t}" ${dis?'disabled':''}>
        <div class="nm"><span>${h.n}</span><span class="pr">${have?'LIVED IN':(h.own?'Deposit '+money(deposit):'Deposit '+money(deposit))}</span></div>
        <div class="ef">${h.d} ${h.ef}</div>
        <div class="carstat">
          <span>${money(monthly)}/mo</span>
          <span>focus cap ${h.cap}</span>
          <span>${h.office?h.office+' research/mo':'no home office'}</span>
          <span>${h.host?'hosting x'+h.host:'no hosting'}</span>
          <span>${h.own?'owned · '+money(Math.round(HOUSE_PRICE(h)*0.30))+' equity':'rented'}</span>
          <span style="color:var(--process)">${addr.n}</span></div>
        ${!have&&!reach?`<div class="rec">${addr.n} is closed to you — needs ${aOrAn(CARS[homeReq(h.t)].n)}</div>`:''}
        ${!have&&reach&&!afford?`<div class="rec">Short ${money(deposit-cash)}</div>`:''}</button>`;
    }).join('')}</div>
    <p class="note k" style="margin-top:18px">Buying costs <em>more</em> every month than renting,
      and takes a deposit out of the portfolio where it would otherwise have compounded. What you get
      back is equity, a room to work in, and eventually a room worth hosting in. Whether that trade is
      worth it depends entirely on what your portfolio would have done with the deposit.</p>`;
  document.querySelectorAll('.item:not([disabled])').forEach(el=>el.addEventListener('click',()=>{
    const t=+el.dataset.t, h=HOMES[t];
    const deposit=h.own?Math.round(HOUSE_PRICE(h)*0.30):Math.round(h.rent*2);
    if(cash<deposit) return;
    if(!homeReachable(t)) return;      /* the button is disabled; this is the second lock */
    cash-=deposit; homeTier=t; focus=Math.min(focus,focusCap());
    research=researchPerMonth();
    syncHome();                        /* the map moves with you */
    /* Walk out of the agent's door and the new address is already yours; put
       the player at it, or "moved in" would mean standing outside the old one. */
    const st=homeSite();
    P.x=st.x+st.w/2; P.y=st.y+st.h+46;
    hud(); leave();
    moment(h.own?'KEYS SIGNED FOR':'MOVED IN', h.n+' · '+districtAt(st.x).n);
  }));
}
