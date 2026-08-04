/* ==================== STATE ==================== */
const ROUNDS_PER_MONTH=5, MONTHS=4, WIN_R=.25, LOSE_R=.18;
const CONV=[{id:'small',n:'Small',pct:.10},{id:'std',n:'Standard',pct:.25},
  {id:'high',n:'High conviction',pct:.45},{id:'conc',n:'Concentrated',pct:.65}];
let order=[],idx=0,port=10000,cash=2000,xp=0,streak=0,best=0,focus=5;
let salary=2400,rent=1200,owned={},appLeft=0,appLive=false;
/* progression tiers -- see cars.js / housing.js / careers.js */
let carTier=0, homeTier=0, careerStage=0, rep=0, contacts=0;
let research=0;
let instr='equity', extraChoice='med';   /* instruments.js */
let debt=0;                              /* drawn against the credit line */
let gymMonth=false, floorMonth=false;    /* once-a-month purchases */
let bankrupt=false;
let carCond=100;                         /* cars.js -- wear */
let propIndex=1, propHist=[1];           /* housing.js -- the property market */
let reviewedAt=0, reviewedSound=0;       /* careers.js -- performance reviews */
let met={};                              /* social.js -- relationships */
let lastReview=null, rennUsed=false;
let tips=[], eventDone=0;                /* activities.js */
let hostedMonth=0, headlandMonth=0;      /* once-a-month capital raises */
let taught={};                           /* glossary.js -- concepts already introduced */
let chapterSeen=0, offerMade=false;      /* endless.js */
let recent=[];                           /* rolling soundness, last 20 calls */
let encounterCooldown=600, pendingEncounter=null;
let sessionsLeft=ROUNDS_PER_MONTH, month=1, monthPnl=0, peak=10000, maxDD=0;
let pick=null,reason=null,conv='std',locked=false,inRoom=null,gameOver=false;
let genSeed=(Math.random()*2147483647)|0;
/* lifecycle gates, owned by shell.js but declared here so step() -- which boot.js
   starts before shell.js loads -- can read them without a temporal-dead-zone throw */
let paused=false, splashDone=false;
const quad={gpgo:0,gpbo:0,bpgo:0,bpbo:0};
const P={x:330,y:470,vx:0,vy:0,dir:0,driving:false,moving:false,vt:0};

const $=i=>document.getElementById(i);
const money=n=>(n<0?'\u2212$':'$')+Math.abs(Math.round(n)).toLocaleString();
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const expenses=()=>housingMonthly()+carMonthly()+debtService()+incomeTax();
/* arc 2 replaces the salary with fee income — see fund.js */
const income=()=>arc===2 ? fundFee()+jobPay()+(appLive?700:0)
                         : jobPay()+(appLive?700:0);

function hud(){
  $('hPort').textContent=money(port);
  $('hPort').className=port>10000?'up':port<10000?'down':'';
  $('hCash').textContent=money(cash);
  $('hCash').className=cash<expenses()?'warn':'';
  $('hFocus').textContent=focus; $('hFocus').className=focus<3?'warn':'';
  $('hSess').textContent=sessionsLeft;
  $('hMonth').textContent=month+' \u00b7 ch '+chapterOf(month);
  $('podAum').style.display=arc===2?'':'none';
  if(arc===2){$('hAum').textContent=money(aum);
    $('hAum').className=aum<AUM_FLOOR*1.2?'warn':aum>AUM0?'up':'';}
}
let toastT;
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2600);}
