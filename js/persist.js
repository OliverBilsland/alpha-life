/* ==================== PERSIST ==================== */
/* Loaded last, after boot.js. boot.js shuffles a fresh deck and calls hud();
   this file then overwrites that with the saved state and only afterwards
   installs the autosave wrapper — otherwise boot's hud() would overwrite the
   save with default state before it was ever read. Nothing here touches game
   logic or balance; it only mirrors state into localStorage and back. */
const SAVE_KEY='alphalife.save.v1', SAVE_V=1;

function snapshot(){
  return {v:SAVE_V,order,idx,port,cash,xp,streak,best,focus,
    owned,appLeft,appLive,sessionsLeft,month,monthPnl,peak,maxDD,conv,gameOver,tutOn,genSeed,carTier,homeTier,careerStage,rep,contacts,trips,research,gymMonth,floorMonth,instr,extraChoice,debt,arc,aum,aumStart,aumPeak,retHist,fundClosed,
    quad:{gpgo:quad.gpgo,gpbo:quad.gpbo,bpgo:quad.bpgo,bpbo:quad.bpbo},
    /* Only 'payday' is worth restoring: payday() charges the month's bills
       before rendering, but month++/sessionsLeft reset happen in the OK
       handler. Resuming outdoors from that gap would let the player sleep
       again and pay the same month twice. Every other room is freely
       re-enterable, so they resume in the city. */
    room:inRoom==='payday'?'payday':null,
    P:{x:P.x,y:P.y,dir:P.dir,driving:P.driving}};
}

function save(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(snapshot()));}catch(e){}
}

function loadSave(){
  try{
    const raw=localStorage.getItem(SAVE_KEY); if(!raw) return null;
    const d=JSON.parse(raw);
    /* Reject anything we can't safely resume into: a bumped format, or a deck
       that no longer matches the scenario bank (indices could be out of range). */
    if(!d||d.v!==SAVE_V||!Array.isArray(d.order)||d.order.length!==S.length) return null;
    if(!d.P||!d.quad||typeof d.port!=='number'||typeof d.idx!=='number') return null;
    return d;
  }catch(e){return null;}
}

function applySave(d){
  order=d.order; idx=d.idx; port=d.port; cash=d.cash;
  xp=d.xp; streak=d.streak; best=d.best; focus=d.focus;
  owned=d.owned||{}; appLeft=d.appLeft; appLive=d.appLive;
  sessionsLeft=d.sessionsLeft; month=d.month; monthPnl=d.monthPnl;
  peak=d.peak; maxDD=d.maxDD; conv=d.conv; gameOver=d.gameOver;
  /* fields added after a save may be absent — default rather than reject */
  tutOn=d.tutOn!==undefined?d.tutOn:true;
  if(typeof d.genSeed==='number') genSeed=d.genSeed;
  carTier=d.carTier||0; homeTier=d.homeTier||0; careerStage=d.careerStage||0;
  rep=d.rep||0; contacts=d.contacts||0;
  trips=d.trips!==undefined?d.trips:4; research=d.research||0;
  /* pre-tier saves stored these as flags */
  if(d.owned&&d.owned.car&&!d.carTier) carTier=1;
  if(d.owned&&d.owned.apt&&!d.homeTier) homeTier=1;
  debt=d.debt||0; gymMonth=!!d.gymMonth; floorMonth=!!d.floorMonth;
  instr=d.instr||'equity'; extraChoice=d.extraChoice||'med';
  arc=d.arc||1; aum=d.aum||0; aumStart=d.aumStart||0; aumPeak=d.aumPeak||d.aum||0;
  retHist=Array.isArray(d.retHist)?d.retHist:[]; fundClosed=!!d.fundClosed;
  Object.assign(quad,d.quad);
  P.x=d.P.x; P.y=d.P.y; P.dir=d.P.dir; P.driving=d.P.driving;
}

function newGame(){
  try{localStorage.removeItem(SAVE_KEY);}catch(e){}
  location.reload();
}

/* ---------- restore ---------- */
const saved=loadSave();
if(saved) applySave(saved);

/* Autosave: hud() already runs after every state mutation — purchases, venue
   visits, commit(), every payday path, leave() — so wrapping it covers the
   economy without editing any game file. finish() is wrapped separately
   because it sets gameOver without calling hud(). */
const _hud=hud;    hud=function(){_hud.apply(null,arguments);save();};
const _finish=finish; finish=function(){_finish.apply(null,arguments);save();};

/* Player position changes 60x/sec, so it is polled on a throttle instead. */
let lastPX=P.x,lastPY=P.y;
setInterval(()=>{
  if(inRoom||gameOver) return;
  if(P.x===lastPX&&P.y===lastPY) return;
  lastPX=P.x;lastPY=P.y;save();
},800);
addEventListener('pagehide',save);
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save();});

$('newBtn').addEventListener('click',()=>{
  if(confirm('Start a new game? This erases your saved progress.')) newGame();
});

if(saved){
  hud();
  if(gameOver){
    /* step() early-returns on gameOver, so without re-rendering the end screen
       the player would resume staring at a frozen city with no overlay. */
    $('ov').classList.add('on'); finish();
  }else if(saved.room==='payday'){
    $('ov').classList.add('on'); $('exitBtn').classList.remove('on');
    inRoom='payday'; renderPayday(income(),expenses(),0);
  }else{
    toast('Resumed — month '+month+', '+sessionsLeft+' session'+
      (sessionsLeft===1?'':'s')+' left.');
  }
}else save();
