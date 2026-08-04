/* ==================== CARS ====================
   A car is never a stat bump. Each tier buys four different things at once:
     access  - which districts you can physically reach
     speed   - whether crossing a 4200px city is viable at all
     burden  - insurance + running costs that scale into a real monthly decision
     upkeep  - condition, which decides whether it starts at all

   Moving around the city is FREE. Nothing about exploring costs a session, a
   trip or any other scarce resource -- sessions are spent only on trades.
   Tier also gates employment (careers.js), because two of the roles need a car. */

const CARS=[
 {t:0,n:'On foot',        d:'Buses, and time you do not have.',
  cost:0,     ins:0,   run:0,    speed:1.9,
  note:'Old Town only. Everything else is a bus ride you cannot fit into a working month.'},
 {t:1,n:'Voss Estate',    d:'Nine years old, honest, slow.',
  cost:4500,  ins:60,  run:150,  speed:4.1,
  note:'Opens Midtown: the dealership, the bank, the recruiters. The analyst desk needs a car.'},
 {t:2,n:'Kestrel 400',    d:'Executive saloon. Quietly expensive.',
  cost:19000, ins:190, run:310,  speed:5.2,
  note:'Opens The Heights. The club will not valet a nine-year-old estate, and the PM seat expects one of these.'},
 {t:3,n:'Anton GT',       d:'Two seats, one purpose.',
  cost:62000, ins:640, run:720,  speed:6.6,
  note:'Opens Harbour: the exchange floor and the private bank.'},
 {t:4,n:'Ferrata Superba',d:'The car people describe to other people.',
  cost:185000,ins:1750,run:1450, speed:8.2,
  note:'Opens The Coast. It is a genuinely bad financial decision that buys you rooms nothing else opens.'}
];

const car=()=>CARS[carTier];

/* CONDITION. A car wears out with use. Neglect does not reduce a stat -- it takes
   the car off the road entirely. Servicing is a real monthly claim on cash
   that competes with everything else. */
/* Condition no longer taxes exploration. It decides whether the car works: a
   neglected car simply will not start, and you are back on foot until it is
   serviced. Slower, never scarcer. */
const CONDITION_BANDS=[
 {at:75,n:'Sound',       drives:true, note:'Runs properly.'},
 {at:40,n:'Tired',       drives:true, note:'Something rattles, but it goes.'},
 {at:15,n:'Unreliable',  drives:true, note:'Starts on the third try. Service it soon.'},
 {at:0, n:'Off the road',drives:false,note:'It will not start. You are walking until it is serviced.'}
];
const conditionBand=()=>carTier===0?CONDITION_BANDS[0]:CONDITION_BANDS.find(b=>carCond>=b.at);
const serviceCost=()=>Math.round(car().cost*0.035+180);
function wearCar(){ if(carTier>0) carCond=Math.max(0,carCond-(3+carTier*1.6)); }
function serviceCar(){
  const c=serviceCost();
  if(cash<c||carTier===0||carCond>=100) return false;
  cash-=c; carCond=100; hud(); return true;
}
const carSpeed=()=>carRuns()?car().speed:CARS[0].speed;
const carRuns=()=>carTier===0?false:conditionBand().drives;
const carMonthly=()=>car().ins+car().run;
/* Exploring is free. These remain so that nothing else has to know that. */
function canVisit(){return true;}
function spendTrip(){}

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
      ${money(carMonthly())} a month.${carTier&&!carRuns()?' <strong>It is not currently starting.</strong>':''}</p>
    ${carTier>0?`<div class="ledger">
      <div class="lr"><span>Condition</span><span class="${carCond<45?'neg':''}">${Math.round(carCond)}% \u00b7 ${conditionBand().n}</span></div>
      <div class="lr"><span>Effect</span><span>${conditionBand().note}</span></div>
      <div class="lr"><span>Full service</span><span>${money(serviceCost())}</span></div>
    </div>
    <button class="btn ghost" id="svc" ${cash>=serviceCost()&&carCond<100?'':'disabled'}>${
      carCond>=100?'Nothing to do':cash<serviceCost()?'Cannot afford a service':'Service it \u00b7 '+money(serviceCost())}</button>`:''}
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
          <span>${c.speed.toFixed(1)} speed</span>
          <span>${money(c.ins+c.run)}/mo to run</span>
          <span>${DISTRICTS.filter(d=>d.req<=c.t).length} districts</span></div>
        ${!have&&tradeIn?`<div class="rec">Trade-in on the ${owned.n}: ${money(tradeIn)}</div>`:''}
        ${!have&&!afford?`<div class="rec">Short ${money(due-cash)}</div>`:''}</button>`;
    }).join('')}</div>
    <p class="note k" style="margin-top:18px">A car is the only purchase that changes the map. It is
      also the only one whose running cost keeps arriving after the excitement has worn off — the
      Superba costs more per month than your first apartment did.</p>`;
  const sv=$('svc');
  if(sv) sv.addEventListener('click',()=>{ if(serviceCar()){toast('Serviced. It starts first time again.');roomDealer();} });
  document.querySelectorAll('.item:not([disabled])').forEach(el=>el.addEventListener('click',()=>{
    const t=+el.dataset.t, c=CARS[t];
    const due=Math.max(0,c.cost-Math.round(car().cost*0.55));
    if(cash<due) return;
    cash-=due; carTier=t; carCond=100; P.driving=t>0;
    hud(); leave();
    moment(c.n.toUpperCase(), t>=3?'The city just got small.':'Everything just got closer.');
  }));
}
