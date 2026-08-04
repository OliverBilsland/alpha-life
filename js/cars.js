/* ==================== CARS ====================
   A car is never a stat bump. Each tier buys four different things at once:
     access  - which districts you can physically reach
     time    - trips per month, the budget every non-office errand spends
     speed   - whether crossing a 4200px city is viable at all
     burden  - insurance + running costs that scale into a real monthly decision
   Tier also gates employment (careers.js), because two of the roles need a car. */

const CARS=[
 {t:0,n:'On foot',        d:'Buses, and time you do not have.',
  cost:0,     ins:0,   run:0,    speed:1.9, trips:4,
  note:'Old Town only. Everything else is a bus ride you cannot fit into a working month.'},
 {t:1,n:'Voss Estate',    d:'Nine years old, honest, slow.',
  cost:4500,  ins:60,  run:150,  speed:4.1, trips:6,
  note:'Opens Midtown: the dealership, the bank, the recruiters. The analyst desk needs a car.'},
 {t:2,n:'Kestrel 400',    d:'Executive saloon. Quietly expensive.',
  cost:19000, ins:190, run:310,  speed:5.2, trips:8,
  note:'Opens The Heights. The club will not valet a nine-year-old estate, and the PM seat expects one of these.'},
 {t:3,n:'Anton GT',       d:'Two seats, one purpose.',
  cost:62000, ins:640, run:720,  speed:6.6, trips:11,
  note:'Opens Harbour: the exchange floor and the private bank.'},
 {t:4,n:'Ferrata Superba',d:'The car people describe to other people.',
  cost:185000,ins:1750,run:1450, speed:8.2, trips:14,
  note:'Opens The Coast. It is a genuinely bad financial decision that buys you rooms nothing else opens.'}
];

const car=()=>CARS[carTier];
const carSpeed=()=>car().speed;
const carMonthly=()=>car().ins+car().run;
const tripsPerMonth=()=>car().trips+(homeTier>=2?1:0);   /* a home office saves a journey */

/* ---------- trips: the monthly errand budget ---------- */
/* The office and home are free. Everything else costs one. */
const FREE_VISITS=['office','apt'];
function tripCost(id){return FREE_VISITS.includes(id)?0:1;}
function canVisit(id){return tripCost(id)===0||trips>0;}
function spendTrip(id){
  if(tripCost(id)&&trips>0){trips--;hud();}
}

/* ---------- district access ---------- */
function districtOpen(d){return carTier>=d.req;}
function lockedDistrictFor(x){
  const d=districtAt(x);
  return districtOpen(d)?null:d;
}
const carNeededFor=d=>CARS.find(c=>c.t===d.req);

function roomDealer(){
  const owned=car();
  $('sheet').innerHTML=`<div class="roomhd"><h2>VOSS MOTORS</h2>
      <span class="sub">Cars · cash ${money(cash)}</span></div>
    <p class="note">You drive a <strong>${owned.n}</strong>. Running it costs
      ${money(carMonthly())} a month and it gives you ${car().trips} trips.</p>
    <div class="items">${CARS.slice(1).map(c=>{
      const have=carTier>=c.t, next=c.t===carTier+1;
      const tradeIn=have?0:Math.round(car().cost*0.55);
      const due=Math.max(0,c.cost-tradeIn);
      const afford=cash>=due;
      const dis=have||!afford;
      return `<button class="item ${have?'owned':''}" data-t="${c.t}" ${dis?'disabled':''}>
        <div class="nm"><span>${c.n}</span><span class="pr">${have?'OWNED':money(due)}</span></div>
        <div class="ef">${c.d} ${c.note}</div>
        <div class="carstat">
          <span>${c.speed.toFixed(1)} speed</span><span>${c.trips} trips/mo</span>
          <span>${money(c.ins+c.run)}/mo to run</span>
          <span>${DISTRICTS.filter(d=>d.req<=c.t).length} districts</span></div>
        ${!have&&tradeIn?`<div class="rec">Trade-in on the ${owned.n}: ${money(tradeIn)}</div>`:''}
        ${!have&&!afford?`<div class="rec">Short ${money(due-cash)}</div>`:''}</button>`;
    }).join('')}</div>
    <p class="note k" style="margin-top:18px">A car is the only purchase that changes the map. It is
      also the only one whose running cost keeps arriving after the excitement has worn off — the
      Superba costs more per month than your first apartment did.</p>`;
  document.querySelectorAll('.item:not([disabled])').forEach(el=>el.addEventListener('click',()=>{
    const t=+el.dataset.t, c=CARS[t];
    const due=Math.max(0,c.cost-Math.round(car().cost*0.55));
    if(cash<due) return;
    cash-=due; carTier=t; P.driving=t>0;
    if(careerStage<1) careerStage=1;   /* the analyst desk needs a car */
    hud(); leave();
    moment(c.n.toUpperCase(), t>=3?'The city just got small.':'Everything just got closer.');
  }));
}
