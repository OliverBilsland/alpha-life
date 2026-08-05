/* ==================== ACTIVITIES ====================
   Things to do that are fun and still feed the economy. The rule from DESIGN.md
   holds: consumption must convert into access, information or capital. Nothing
   here is a pure sink.

   The four channels it converts into:
     tips      a named company gets a street read before you trade it
     access    reputation, contacts, and named relationships
     capital   money committed to the portfolio or the fund
     time      sessions and focus (never movement -- exploring is free) */

/* ---------- tips: information you can actually act on ---------- */
/* A tip attaches to a future scenario index and reveals which way the market
   went. It is information, not accuracy -- it tells you the outcome, never
   which business is better, so it can make you money without making you sound. */
function addTip(atIdx,src){
  if(tips.some(t=>t.i===atIdx)) return null;
  tips.push({i:atIdx,src});
  if(tips.length>6) tips.shift();
  return atIdx;
}
const tipFor=i=>tips.find(t=>t.i===i)||null;
function tipHTML(s,i){
  const t=tipFor(i); if(!t) return '';
  return `<p class="instnote" style="border-color:var(--warn)"><strong>A word from ${t.src}.</strong>
    Whatever the businesses look like, money is going into <strong>${s[s.market].t}</strong> this
    period. That is an outcome, not an argument — trading on it can pay you without making the call
    defensible, and the quadrant grid will say so.</p>`;
}

/* ---------- the nightclub ---------- */
const CLUB_NIGHTS=[
 {id:'bar',    n:'Stand at the bar',  cost:180,   rep:1, contacts:0, tip:0,
  d:'Loud, cheap, and you will speak to nobody who matters.'},
 {id:'booth',  n:'Bottle service',    cost:2600,  rep:4, contacts:2, tip:1,
  d:'A booth, a bucket, and people come to you. Someone always says something.'},
 {id:'host',   n:'Host the room',     cost:11000, rep:12, contacts:4, tip:2,
  d:'Your name on the table. Allocators drink for free and remember who paid.'}
];
function roomNightclub(){
  $('sheet').innerHTML=`<div class="roomhd"><h2>THE ANNEX</h2>
      <span class="sub">Nightclub · ${repTier().n} · cash ${money(cash)}</span></div>
    <p class="note">Two in the morning is when people say the thing they would not say at eleven.
      It is an absurd way to source information and it is how a great deal of it is sourced.</p>
    <div class="items">${CLUB_NIGHTS.map((n,i)=>{
      const can=cash>=n.cost;
      return `<button class="item" data-n="${i}" ${can?'':'disabled'}>
        <div class="nm"><span>${n.n}</span><span class="pr">${money(n.cost)}</span></div>
        <div class="ef">${n.d}</div>
        <div class="carstat"><span>+${n.rep} reputation</span><span>+${n.contacts} contacts</span>
          <span>${n.tip?n.tip+' tip'+(n.tip>1?'s':''):'no tips'}</span>
          <span>+1 focus</span></div>
        ${!can?`<div class="rec">Short ${money(n.cost-cash)}</div>`:''}</button>`;
    }).join('')}</div>
    <p class="note k" style="margin-top:16px">A tip tells you where the money went, not which company
      deserved it. Acting on one can pay you and still score as unsound — which is the cleanest
      demonstration this game has that the two scoreboards are separate.</p>
    <button class="btn ghost" id="ncOut">Leave</button>`;
  document.querySelectorAll('.item:not([disabled])').forEach(el=>el.addEventListener('click',()=>{
    const n=CLUB_NIGHTS[+el.dataset.n]; if(cash<n.cost) return;
    cash-=n.cost; rep+=n.rep; contacts+=n.contacts;
    focus=Math.min(focusCap(),focus+1);
    for(let k=0;k<n.tip;k++) addTip(idx+1+k,'the Annex');
    const m=meetAt('annex'); hud(); leave();
    if(m&&m.now) moment(m.p.n.toUpperCase(),m.p.role);
    else if(n.tip) moment('SOMEONE TALKED',n.tip+' tip'+(n.tip>1?'s':'')+' for the week ahead');
    else toast('A late one.');
  }));
  $('ncOut').addEventListener('click',leave);
}

/* ---------- restaurants ---------- */
const TABLES=[
 {id:'caff', n:'The corner caff',   cost:40,   focus:1, warm:1,
  d:'Eggs, tea, and forty minutes of not thinking about leverage.'},
 {id:'trat', n:'Trattoria Bruno',   cost:520,  focus:2, warm:2,
  d:'Long lunch. The kind of place where a conversation gets somewhere.'},
 {id:'deal', n:'Private dining room',cost:4200, focus:3, warm:4,
  d:'Six seats, no menu, and whoever you invited cannot leave early.'}
];
function roomRestaurant(){
  const inProgress=PEOPLE.filter(p=>!knows(p.id)&&metWith(p.id)>0);
  $('sheet').innerHTML=`<div class="roomhd"><h2>BRUNO&#39;S</h2>
      <span class="sub">Dining · cash ${money(cash)}</span></div>
    <p class="note">Relationships are built at tables. Eating here does not introduce you to anyone
      new — it moves along everyone you have already met.</p>
    ${inProgress.length?`<p class="note">Part-way with:
      <strong>${inProgress.map(p=>p.n+' ('+metWith(p.id)+'/'+p.need+')').join(', ')}</strong>.</p>`
     :`<p class="note">Nobody in progress. Meet people first — the bar, the club, the galas, the
      Annex and the recruiter each have someone worth knowing.</p>`}
    <div class="items">${TABLES.map((tb,i)=>{
      const can=cash>=tb.cost;
      return `<button class="item" data-t="${i}" ${can?'':'disabled'}>
        <div class="nm"><span>${tb.n}</span><span class="pr">${money(tb.cost)}</span></div>
        <div class="ef">${tb.d}</div>
        <div class="carstat"><span>+${tb.focus} focus</span>
          <span>advances ${tb.warm} relationship step${tb.warm>1?'s':''}</span></div>
        ${!can?`<div class="rec">Short ${money(tb.cost-cash)}</div>`:''}</button>`;
    }).join('')}</div>
    <button class="btn ghost" id="rsOut">Leave</button>`;
  document.querySelectorAll('.item:not([disabled])').forEach(el=>el.addEventListener('click',()=>{
    const tb=TABLES[+el.dataset.t]; if(cash<tb.cost) return;
    cash-=tb.cost; focus=Math.min(focusCap(),focus+tb.focus);
    let completed=null;
    for(let k=0;k<tb.warm;k++){
      const pending=PEOPLE.filter(p=>!knows(p.id)&&metWith(p.id)>0);
      if(!pending.length) break;
      const p=pending[0]; met[p.id]=metWith(p.id)+1;
      if(knows(p.id)) completed=p;
    }
    hud(); leave();
    if(completed) moment(completed.n.toUpperCase(),completed.role);
    else toast('A good table.');
  }));
  $('rsOut').addEventListener('click',leave);
}

/* ---------- the monthly event ---------- */
/* One thing is happening in the city each month. It is always an opportunity
   with a price and a specific return, never flavour. */
const EVENTS=[
 {id:'earnings',n:'Earnings season',
  d:'Everything reports at once. The desk is chaos and the reading is worth more.',
  cost:0, act:'Work through it',
  fx:()=>{sessionsLeft+=1; return 'A sixth session this month — earnings season pays the diligent.';}},
 {id:'conf',n:'The sector conference',
  d:'Three days of management teams saying more than they meant to.',
  cost:3800, act:'Attend',
  fx:()=>{addTip(idx+1,'the conference'); addTip(idx+2,'the conference'); rep+=3;
    return 'Two tips and three points of standing.';}},
 {id:'rates',n:'A rate decision',
  d:'The central bank moves this month, and every bond on the desk knows it.',
  cost:0, act:'Read the statement',
  fx:()=>{owned.rateread=true;
    return 'You will see the rate move on every bond card this month, course or no course.';}},
 {id:'ipo',n:'A listing',
  d:'A company is coming to market and the book is being built now.',
  cost:9000, act:'Take an allocation',
  fx:()=>{const g=Math.round((arc===2?aum:port)*0.06);
    if(arc===2){aum+=g;aumStart+=g;} else port+=g;
    return money(g)+' allocated and flipped. Access, not analysis — and it does not touch your record.';}},
 {id:'layoffs',n:'A round of layoffs',
  d:'Two desks are being cut. Nobody is working, everybody is talking.',
  cost:0, act:'Take the temperature',
  fx:()=>{contacts+=3; rep+=1;
    return 'Three people who will need somewhere to go, and remember who called.';}},
 {id:'audit',n:'A compliance review',
  d:'Somebody upstairs wants the decision log explained.',
  cost:0, act:'Present your record',
  fx:()=>{const sound=quad.gpgo+quad.gpbo;
    const good=idx>0&&sound/idx>=0.5;
    if(good){rep+=6; return 'Your record read well. Six points of standing — process, noticed.';}
    rep=Math.max(0,rep-4);
    return 'The record did not read well. Four points of standing gone.';}}
];
const eventFor=m=>EVENTS[(Math.imul(m+3,2654435761)>>>0)%EVENTS.length];
function roomEvent(){
  const e=eventFor(month);
  const done=eventDone===month;
  const can=!done&&cash>=e.cost;
  $('sheet').innerHTML=`<div class="roomhd"><h2>${e.n}</h2>
      <span class="sub">This month in the city</span></div>
    <p class="note">${e.d}</p>
    ${e.cost?`<p class="note">It costs ${money(e.cost)} to be part of.</p>`:''}
    <button class="btn" id="doEv" ${can?'':'disabled'}>${
      done?'Already done this month':e.cost&&cash<e.cost?'Not enough cash':e.act}</button>
    <p class="note k" style="margin-top:16px">One thing happens a month and you can take it or leave
      it. Some of these pay money without touching your record, which is the point — access and
      analysis are different things and the game keeps them in different columns.</p>
    <button class="btn ghost" id="evOut">Leave</button>`;
  if(can) $('doEv').addEventListener('click',()=>{
    cash-=e.cost; eventDone=month;
    const msg=e.fx(); hud(); leave();
    moment(e.n.toUpperCase(),msg);
  });
  $('evOut').addEventListener('click',leave);
}

/* ---------- street encounters ---------- */
/* Driving occasionally turns something up. Frequency and quality scale with the
   car, because a better car puts you in better places at better times. */
const ENCOUNTERS=[
 {id:'tip',   w:3, min:1, n:'A word at the lights',
  d:'The car alongside is someone you know. They wind the window down.',
  fx:()=>{addTip(idx+1,'a friend at the lights'); return 'A tip for the next name you look at.';}},
 {id:'card',  w:3, min:1, n:'A card through the window',
  d:'A valet you tipped once has been telling people about you.',
  fx:()=>{contacts+=1; rep+=1; return 'One contact, one point of standing.';}},
 {id:'break', w:2, min:1, n:'It will not start',
  d:'Something under the bonnet gives up in traffic.',
  fx:()=>{carCond=Math.max(0,carCond-22); return 'The car is in worse shape than it was.';}},
 {id:'fine',  w:2, min:1, n:'A parking fine',
  d:'Forty minutes over, and they were waiting.',
  fx:()=>{const f=60+carTier*45; cash=Math.max(0,cash-f); return money(f)+' gone, for nothing.';}},
 {id:'lunch', w:2, min:2, n:'Someone flags you down',
  d:'A face from the club. They have twenty minutes and a view on a sector.',
  fx:()=>{focus=Math.min(focusCap(),focus+1); rep+=1; return 'A point of focus and a point of standing.';}},
 {id:'invite',w:2, min:3, n:'An invitation',
  d:'A car like yours gets waved into places a car like your last one did not.',
  fx:()=>{const pending=PEOPLE.filter(p=>!knows(p.id));
    if(pending.length){const p=pending[0];met[p.id]=metWith(p.id)+1;
      return 'A step closer to '+p.n+'.';}
    rep+=2; return 'Two points of standing.';}},
];
function rollEncounter(){
  const pool=ENCOUNTERS.filter(e=>carTier>=e.min);
  const total=pool.reduce((a,e)=>a+e.w,0);
  let x=Math.random()*total;
  for(const e of pool){ x-=e.w; if(x<=0) return e; }
  return pool[0];
}
function maybeEncounter(){
  if(inRoom||gameOver||!splashDone) return;
  if(encounterCooldown>0){encounterCooldown--;return;}
  /* a better car is out more, and meets more */
  const chance=0.00035*(1+carTier*0.55);
  if(Math.random()>chance) return;
  encounterCooldown=1400;
  const e=rollEncounter();
  pendingEncounter=e;
  inRoom='encounter'; $('ov').classList.add('on'); $('exitBtn').classList.remove('on');
  enterRoom();
  $('sheet').innerHTML=`<div class="roomhd"><h2>${e.n}</h2>
      <span class="sub">On the road · ${districtAt(P.x).n}</span></div>
    <p class="note">${e.d}</p>
    <button class="btn" id="encOk">See what it is</button>`;
  $('encOk').addEventListener('click',()=>{
    const msg=e.fx(); pendingEncounter=null;
    hud(); leave(); toast(msg);
  });
}
