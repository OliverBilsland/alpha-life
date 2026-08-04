/* ==================== SCENARIO GENERATOR ====================
   Produces cases in exactly the authored shape:
     {sector, a:{t,d,g,m,l,p,f}, b:{...}, better, driver, market, street, why, twist?}

   Two guarantees the hand-written set has implicitly, made explicit here:

   1. ONE DECIDING METRIC. The better company must lead decisively on the driver
      axis AND that lead must dominate every other axis, so the intended reason is
      never ambiguous. Scoring demands the player name the axis, so an ambiguous
      case would be an unfair loss. Enforced by validate(), not hoped for.
   2. A DEFENSIBLE-BUT-TEMPTING LOSER. The other company must win on at least two
      of the remaining three axes, so the wrong answer always looks attractive.

   Scenarios are a pure function of (genSeed, index): nothing is stored, and the
   same seed replays the same run forever. */

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;
  return((t^t>>>14)>>>0)/4294967296;};}

/* higher-is-better axes have dir +1; leverage and P/E are dir -1 */
const AX={
  growth :{k:'g',dir: 1,scale:20 ,lo:-4,hi:60,round:v=>Math.round(v)},
  profit :{k:'m',dir: 1,scale:10 ,lo: 3,hi:40,round:v=>Math.round(v)},
  balance:{k:'l',dir:-1,scale:2.0,lo:.1,hi:6.5,round:v=>Math.round(v*10)/10},
  value  :{k:'p',dir:-1,scale:12 ,lo: 5,hi:95,round:v=>Math.round(v)}
};
const AXES=['growth','profit','balance','value'];

const STEMS=['Ashgrove','Bellmore','Carrick','Dunmore','Ellery','Fenwick','Glenmoor','Hartley',
'Inverness','Jarrow','Kelvin','Langmere','Marchwood','Netherby','Oakhurst','Penrith','Quarry Hill',
'Ravensdale','Sandmere','Thorncliff','Underhill','Vantry','Wexford','Yarrow','Ackland','Braemar',
'Corvale','Dashwood','Edgemont','Falkirk','Granby','Holloway','Ilminster','Kirkwall','Lowther',
'Mersey','Norbury','Ordsall','Pentland','Rookwood','Selby','Tarrant','Ulverton','Verity','Wilbraham',
'Ainsworth','Blackwater','Caldmere','Denholm','Everly','Fairhaven','Garrow','Hexham','Ingleby',
'Larkspur','Moreton','Nithsdale','Orwell','Pemberton','Rushmere','Stanmore','Tolland','Waverly'];

const SECTORS=[
 {n:'Specialty chemicals',sfx:['CHEMICAL','MATERIALS','INDUSTRIES'],
  g:[3,18],m:[9,24],l:[.8,3.4],p:[8,22],f:[45,85],
  pairs:[['Capacity build-out, contracted offtake','Mature plants, steady utilisation'],
         ['Formulations, patent-protected','Commodity intermediates, spot-priced']]},
 {n:'Aerospace suppliers',sfx:['AEROSPACE','SYSTEMS','TECHNOLOGIES'],
  g:[4,22],m:[8,23],l:[.7,4.2],p:[10,30],f:[40,82],
  pairs:[['Sole-source content, long programmes','Build-to-print machining, competed'],
         ['Aftermarket-weighted revenue','Original-equipment weighted, cyclical']]},
 {n:'Grocery retail',sfx:['MARKETS','GROCERS','STORES'],
  g:[1,14],m:[3,11],l:[.9,4.0],p:[7,19],f:[50,90],
  pairs:[['Aggressive store openings, leased','Dense existing footprint, owned sites'],
         ['Discount format, volume-led','Full-service format, basket-led']]},
 {n:'Insurance',sfx:['UNDERWRITING','ASSURANCE','MUTUAL'],
  g:[2,15],m:[8,26],l:[.5,3.0],p:[6,17],f:[55,92],
  pairs:[['Rapid premium growth, new lines','Disciplined book, declined business'],
         ['Broker-led distribution','Direct distribution, owned renewals']]},
 {n:'Logistics',sfx:['LOGISTICS','FREIGHT','TRANSPORT'],
  g:[3,20],m:[5,17],l:[1.0,4.6],p:[8,24],f:[42,80],
  pairs:[['Asset-heavy, owned fleet expansion','Asset-light brokerage, variable cost'],
         ['Contract logistics, sticky volume','Spot market exposure, cyclical']]},
 {n:'Software',sfx:['SOFTWARE','SYSTEMS','LABS'],
  g:[8,42],m:[4,34],l:[.1,2.4],p:[14,80],f:[25,88],
  pairs:[['Land-grab pricing, heavy sales spend','Entrenched seats, price-led growth'],
         ['Usage-based, expansion-led','Committed contracts, renewal-led']]},
 {n:'Building products',sfx:['BUILDING','PRODUCTS','SUPPLY'],
  g:[2,19],m:[7,21],l:[.6,3.8],p:[7,18],f:[45,84],
  pairs:[['Volume growth into new regions','Consolidated in core geography'],
         ['Manufactured, plant-intensive','Distributed, working-capital light']]},
 {n:'Medical devices',sfx:['MEDICAL','DEVICES','SURGICAL'],
  g:[4,26],m:[10,30],l:[.4,3.2],p:[12,40],f:[40,86],
  pairs:[['New platform launch, building installed base','Mature installed base, consumables pull'],
         ['Hospital capital sales, lumpy','Recurring disposables, predictable']]},
 {n:'Asset management',sfx:['CAPITAL','PARTNERS','ASSET MGMT'],
  g:[1,20],m:[15,38],l:[.2,2.2],p:[7,21],f:[60,95],
  pairs:[['Flows into newer strategies','Legacy mandates, fee pressure'],
         ['Performance-fee weighted','Management-fee weighted, stable']]},
 {n:'Packaging',sfx:['PACKAGING','CONTAINER','GROUP'],
  g:[1,13],m:[8,20],l:[1.2,4.4],p:[7,17],f:[50,86],
  pairs:[['Converting capacity added on contract','Legacy lines, full utilisation'],
         ['Substrate-advantaged, sustainable mix','Conventional substrate, price-taken']]},
 {n:'Hotels',sfx:['HOSPITALITY','HOTELS','RESORTS'],
  g:[2,24],m:[6,26],l:[1.0,5.4],p:[9,28],f:[35,80],
  pairs:[['Owned real estate, expanding keys','Franchised, fee-based, capital-light'],
         ['Resort-weighted, seasonal','Corporate-weighted, weekday-led']]},
 {n:'Education',sfx:['EDUCATION','LEARNING','ACADEMIES'],
  g:[3,25],m:[6,24],l:[.4,3.0],p:[9,26],f:[45,88],
  pairs:[['Enrolment growth, campuses opening','Steady enrolment, fixed estate'],
         ['Online-led, low incremental cost','Campus-led, capacity-constrained']]},
 {n:'Waste services',sfx:['ENVIRONMENTAL','WASTE','SERVICES'],
  g:[1,12],m:[12,28],l:[1.4,4.8],p:[8,20],f:[55,90],
  pairs:[['Landfill-owning, permitted capacity','Collection-only, disposal purchased'],
         ['Municipal contracts, bid annually','Commercial routes, priced freely']]},
 {n:'Consumer electronics',sfx:['ELECTRONICS','DEVICES','TECH'],
  g:[2,30],m:[4,18],l:[.2,2.8],p:[8,32],f:[30,78],
  pairs:[['Category expansion, marketing-led','Single strong category, defended'],
         ['Own-brand, retail-distributed','Contract-manufactured for others']]},
 {n:'Agriculture',sfx:['AGRICULTURE','FARMS','AGRI'],
  g:[1,17],m:[6,22],l:[1.0,4.6],p:[6,16],f:[38,80],
  pairs:[['Acreage expansion, debt-funded','Owned acreage, unlevered'],
         ['Single-crop concentration','Diversified rotation, hedged']]},
 {n:'Defence services',sfx:['DEFENCE','FEDERAL','SOLUTIONS'],
  g:[2,16],m:[6,18],l:[.6,3.6],p:[9,22],f:[48,86],
  pairs:[['Recompete-heavy portfolio','Sole-source, long-dated awards'],
         ['Cost-plus weighted, low risk','Fixed-price weighted, margin upside']]}
];

/* ---------- prose ---------- */
const LEAD={
 growth:[(B,O,s)=>`${B.t} grew revenue ${B.g}% against ${O.g}%, and in ${s} that gap compounds into everything else.`,
         (B,O,s)=>`The only number that mattered was the top line: ${B.g}% at ${B.t} versus ${O.g}% at ${O.t}.`,
         (B,O,s)=>`${B.t} at ${B.g}% against ${O.g}% is not a rounding difference in ${s} — it is a different business.`],
 profit:[(B,O,s)=>`${B.t} earning ${B.m}% against ${O.m}% in the same category is not operational luck, it is pricing power.`,
         (B,O,s)=>`${B.t} kept ${B.m}% of every dollar; ${O.t} kept ${O.m}%. In ${s} that spread is the moat.`,
         (B,O,s)=>`Strip out the noise and ${B.t} earns ${B.m}% where ${O.t} earns ${O.m}%.`],
 balance:[(B,O,s)=>`${O.t} runs at ${O.l.toFixed(1)}× where ${B.t} runs at ${B.l.toFixed(1)}×, and in ${s} leverage decides who survives the bad year.`,
          (B,O,s)=>`${B.t} at ${B.l.toFixed(1)}× against ${O.l.toFixed(1)}× is the whole call. Everything else is commentary until the credit window shuts.`,
          (B,O,s)=>`A ${O.l.toFixed(1)}× balance sheet in ${s} is a bet on conditions, not a business; ${B.t} at ${B.l.toFixed(1)}× is the ownable half of the pair.`],
 value:[(B,O,s)=>`${B.t} at ${B.p}× against ${O.t} at ${O.p}× for a comparable asset is a dislocation, not a preference.`,
        (B,O,s)=>`You are paying ${B.p}× for ${B.t} and ${O.p}× for the weaker ${O.t}.`,
        (B,O,s)=>`${B.p}× is what the market charges for ${B.t}; ${O.p}× is what it charges to avoid it.`]
};
const TRAP={
 growth:(B,O)=>`${O.t}'s ${O.g}% top line`,
 profit:(B,O)=>`${O.t}'s ${O.m}% margin against ${B.m}%`,
 balance:(B,O)=>`${O.t}'s cleaner ${O.l.toFixed(1)}× balance sheet`,
 value:(B,O)=>`${O.t}'s ${O.p}× multiple against ${B.p}×`
};
const DISMISS={
 growth:'growth funded by inventory, leases and debt is a financing decision wearing a growth costume.',
 profit:'margin with no volume growth to lever it is a mature-business artifact, not an advantage.',
 balance:'a clean balance sheet is not a reason to own a business that is going nowhere.',
 value:'a low multiple on a deteriorating asset is not a discount, it is a forecast.'
};
const CLOSE={
 growth:['Unit growth compounds; margin does not.',
         'You can fix a margin. You cannot manufacture demand.',
         'Everything else on the card is a second-order question once the top line diverges this far.'],
 profit:['Margin tells you whether you own the network or rent it.',
         'When the other lines are matched, the margin gap is the quality gap.',
         'Pricing power is the only moat that survives a downturn intact.'],
 balance:['Leverage is not a metric, it is the option on every other metric.',
          'Businesses do not die of slow growth. They die of maturities.',
          'The balance sheet decides who is still trading when the cycle turns.'],
 value:['Cheap relative to what is the entire question.',
        'The discount is only real if the asset behind it is.',
        'Paying less for more is the rarest thing on any screen.']
};
const CONV_NOTE={
 high:(B,O)=>` ${B.t} converted ${B.f}% of it to cash, so the earnings were real.`,
 low :(B,O)=>` ${O.t}'s ${O.f}% conversion says those earnings were an accounting event, not a deposit.`
};
const STREET_QUIET=[
 s=>`No differentiated view in ${s}. Both rated hold, coverage thin.`,
 s=>`Positioning is light on both names. Nobody has published a real model.`,
 s=>`The screens rank these two side by side. Nobody has looked underneath.`,
 s=>`Consensus treats the pair as interchangeable exposure to ${s}.`];
const STREET_LOUD=[
 (s,W)=>`${W.t} is a crowded long. Momentum funds have been adding for two quarters.`,
 (s,W)=>`Unusual options activity in ${W.t}. Someone is positioned for an event.`,
 (s,W)=>`Flows into ${s} are one-directional right now and ${W.t} is taking most of them.`,
 (s,W)=>`Short interest in ${W.t} has halved in six weeks. The squeeze risk is real.`];
const TWISTS=[
 (W,L)=>`${W.t} took a takeover approach at a 40% premium three weeks later. M&A is the largest single source of good-process-bad-outcome in this job.`,
 (W,L)=>`${W.t} won the period on a policy change nobody had handicapped. Regulated outcomes are decided by committees, not spreadsheets.`,
 (W,L)=>`The market did not care for another four quarters, and ${W.t} rerated hard before ${L.t}'s model broke. Being early is the most expensive way to be right.`,
 (W,L)=>`An index reconstitution forced buying in ${W.t} for a full quarter. Flows do not read balance sheets.`,
 (W,L)=>`${L.t} was right on the fundamentals and lost the period to a short squeeze in ${W.t}. Correct and early is indistinguishable from wrong at the mark.`,
 (W,L)=>`A commodity move rescued ${W.t}'s quarter outright. The business did not improve; the deck did.`];

/* ---------- generation ---------- */
function advantage(B,O,ax){const a=AX[ax];return a.dir*(B[a.k]-O[a.k])/a.scale;}
function validate(B,O,driver){
  const d=advantage(B,O,driver);
  const others=AXES.filter(x=>x!==driver).map(x=>advantage(B,O,x));
  return d>=1.15 && d>=1.7*Math.max(...others.map(Math.abs),0.001)
      && others.filter(v=>v<-0.05).length>=2;
}

function genScenario(seed,i,diff){
  const rng=mulberry32((Math.imul(seed|0,2654435761)^Math.imul(i+1,40503))>>>0);
  /* difficulty narrows the deciding gap toward the fairness floor and makes the
     distractors stronger. It never makes the driver ambiguous -- validate()
     still has to pass, so a harder case is harder to READ, never unfair. */
  const D=Math.max(0,Math.min(0.92,diff||0));
  const gapLo=1.32-0.16*D, gapHi=2.2-0.86*D;
  const trapLo=0.30+0.30*D, trapHi=0.80+0.52*D;
  const rf=(lo,hi)=>lo+rng()*(hi-lo);
  const ri=(lo,hi)=>Math.round(rf(lo,hi));
  const pick=a=>a[Math.floor(rng()*a.length)%a.length];

  const sec=pick(SECTORS), driver=pick(AXES);
  const trapAxes=AXES.filter(x=>x!==driver);
  /* the neutral axis is the one the loser does NOT get to win on */
  const neutral=trapAxes[Math.floor(rng()*3)%3];

  let O={},B={},tries=0,widen=1;
  do{
    /* loser's metrics anywhere in the sector's plausible band */
    O.g=ri(sec.g[0],sec.g[1]); O.m=ri(sec.m[0],sec.m[1]);
    O.l=Math.round(rf(sec.l[0],sec.l[1])*10)/10; O.p=ri(sec.p[0],sec.p[1]);
    for(const ax of AXES){
      const a=AX[ax];
      let gap;
      if(ax===driver)      gap= a.dir*a.scale*rf(gapLo,gapHi)*widen;
      else if(ax===neutral)gap= a.dir*a.scale*rf(-0.12-0.5*D,0.12);
      else                 gap=-a.dir*a.scale*rf(trapLo,trapHi);
      B[a.k]=a.round(Math.min(a.hi,Math.max(a.lo,O[a.k]+gap)));
    }
    /* clamping can eat the driver gap at a band edge — push the loser away instead */
    const a=AX[driver];
    if(advantage(B,O,driver)<1.2){
      O[a.k]=a.round(Math.min(a.hi,Math.max(a.lo,B[a.k]-a.dir*a.scale*1.6)));
    }
    tries++; widen*=(1+0.12*(1-D));
  }while(!validate(B,O,driver)&&tries<24);

  /* cash conversion: supports quality for profit/balance calls, and deliberately
     flatters the loser on growth/value calls — the mature-but-melting pattern. */
  const flip=(driver==='growth'||driver==='value');
  const base=ri(sec.f[0],sec.f[1]);
  B.f=Math.max(10,Math.min(96,flip?base-ri(6,22):base+ri(8,24)));
  O.f=Math.max(10,Math.min(96,flip?base+ri(4,14):base-ri(6,20)));

  /* names + descriptors */
  let s1=pick(STEMS),s2=pick(STEMS); let guard=0;
  while(s2===s1&&guard++<10) s2=pick(STEMS);
  if(s2===s1) s2=STEMS[(STEMS.indexOf(s1)+7)%STEMS.length];
  B.t=(s1+' '+pick(sec.sfx)).toUpperCase();
  O.t=(s2+' '+pick(sec.sfx)).toUpperCase();
  const pr=pick(sec.pairs);
  /* the more aggressive descriptor goes to whoever is growthier or more levered */
  const bAggr=(B.g>O.g)||(B.l>O.l);
  B.d=bAggr?pr[0]:pr[1]; O.d=bAggr?pr[1]:pr[0];

  /* which side is which */
  const betterIsA=rng()<0.5;
  const better=betterIsA?'a':'b';
  const marketAgrees=rng()<0.75;                 /* market disagrees ~25% */
  const market=marketAgrees?better:(better==='a'?'b':'a');

  /* prose */
  const trapAx=trapAxes.filter(x=>x!==neutral&&advantage(B,O,x)<0);
  const usedTrap=trapAx.length?trapAx[Math.floor(rng()*trapAx.length)%trapAx.length]
                              :trapAxes[0];
  const conv=flip?CONV_NOTE.low(B,O):CONV_NOTE.high(B,O);
  const why=pick(LEAD[driver])(B,O,sec.n.toLowerCase())+
    ` The temptation was ${TRAP[usedTrap](B,O)} — but ${DISMISS[usedTrap]}`+
    conv+' '+pick(CLOSE[driver]);
  const winner=market===better?B:O;
  const street=marketAgrees?pick(STREET_QUIET)(sec.n.toLowerCase())
                          :pick(STREET_LOUD)(sec.n.toLowerCase(),winner);

  const out={sector:sec.n,
    a:betterIsA?B:O, b:betterIsA?O:B,
    better,driver,market,street,why,generated:true,diff:D};
  if(!marketAgrees) out.twist=pick(TWISTS)(winner,better===market?O:B);
  return out;
}

/* ---------- deck ---------- */
/* Authored cases always come first: they are the tutorial set, and the intro arc
   is exactly their length. Everything past them is generated on demand. */
const genCache=new Map();
function scenarioAt(i){
  if(i<S.length) return S[order[i]];
  if(!genCache.has(i)) genCache.set(i,genScenario(genSeed,i,difficultyFor(i)));
  return genCache.get(i);
}
