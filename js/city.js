/* ==================== RENDER ==================== */
/* Canvas fonts and every drawing routine live in art.js. */
const cv=$('cv'),cx=cv.getContext('2d');
let VW=0,VH=0,DPR=1;
function resize(){DPR=Math.min(devicePixelRatio||1,2);VW=innerWidth;VH=innerHeight;
  cv.width=VW*DPR;cv.height=VH*DPR;cx.setTransform(DPR,0,0,DPR,0,0);}
addEventListener('resize',resize);resize();

function draw(){
  const cam={x:Math.max(0,Math.min(W-VW,P.x-VW/2)),y:Math.max(0,Math.min(H-VH,P.y-VH/2))};
  cx.fillStyle=PAL.void; cx.fillRect(0,0,VW,VH);
  cx.save(); cx.translate(-cam.x,-cam.y);

  drawGround(cx,cam,VW,VH);
  drawRoads(cx);
  drawLamps(cx,cam,VW);
  drawLife(cx,cam,VW,VH);
  drawDistrictLabels(cx,cam,VW);

  const near=nearBuilding();
  /* painter's order: further-up buildings first so extrusions overlap correctly */
  B.slice().sort((a,b)=>a.y-b.y).forEach(b=>drawBuilding(cx,b,near&&near.id===b.id));
  drawProps();

  drawPlayer(cx,walkPhase);
  cx.restore();
  drawVignette(cx,VW,VH);
}

function door(b){return {x:b.x+b.w/2, y:b.y+b.h+4};}
function nearBuilding(){
  for(const b of B){const d=door(b);
    if(Math.hypot(P.x-d.x,P.y-d.y)<62) return b;}
  return null;
}
function blocked(x,y){
  for(const b of B){ if(x>b.x-14&&x<b.x+b.w+14&&y>b.y-14&&y<b.y+b.h+14) return true; }
  if(x<16||y<16||x>W-16||y>H-16) return true;
  /* district checkpoints: an unreachable district is genuinely unreachable */
  return !districtOpen(districtAt(x));
}

/* ==================== INPUT ==================== */
const keys={};
addEventListener('keydown',e=>{
  keys[e.key.toLowerCase()]=true;
  if((e.key==='e'||e.key==='E'||e.key==='Enter')&&!inRoom){const b=nearBuilding();if(b)enter(b);}
  if(e.key==='Escape'&&inRoom&&inRoom!=='payday')leave();
  if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
let tv={x:0,y:0};
if(matchMedia('(pointer:coarse)').matches){
  document.body.classList.add('touch');
  const st=$('stick'),kn=$('knob');let act=false,ox=0,oy=0;
  const set=(dx,dy)=>{const d=Math.hypot(dx,dy),m=Math.min(d,46),a=Math.atan2(dy,dx);
    const nx=Math.cos(a)*m,ny=Math.sin(a)*m;
    kn.style.transform=`translate(${nx}px,${ny}px)`;tv={x:nx/46,y:ny/46};};
  st.addEventListener('touchstart',e=>{act=true;const r=st.getBoundingClientRect();
    ox=r.left+r.width/2;oy=r.top+r.height/2;e.preventDefault();},{passive:false});
  st.addEventListener('touchmove',e=>{if(!act)return;const t=e.touches[0];
    set(t.clientX-ox,t.clientY-oy);e.preventDefault();},{passive:false});
  const end=()=>{act=false;tv={x:0,y:0};kn.style.transform='translate(0,0)';};
  st.addEventListener('touchend',end);st.addEventListener('touchcancel',end);
  $('actBtn').addEventListener('click',()=>{const b=nearBuilding();if(b&&!inRoom)enter(b);});
}

/* ==================== LOOP ==================== */
function step(){
  if(!inRoom&&!gameOver){
    if(splashDone){ simulate(); stepLife(); maybeEncounter(); }
    draw();
  }
  requestAnimationFrame(step);
}
let walkPhase=0;
function simulate(){
  {
    const sp=carSpeed();
    let dx=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0)+tv.x;
    let dy=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0)+tv.y;
    const m=Math.hypot(dx,dy);
    if(m>1){dx/=m;dy/=m;}
    if(m>.08){P.dir=Math.atan2(dy,dx);}
    const nx=P.x+dx*sp, ny=P.y+dy*sp;
    const ox=P.x, oy=P.y;
    if(!blocked(nx,P.y))P.x=nx;
    if(!blocked(P.x,ny))P.y=ny;
    const moved=Math.hypot(P.x-ox,P.y-oy);
    P.moving=moved>0.05;
    walkPhase=(walkPhase+moved/(P.driving?26:14))%1;
    /* getting in and out of the car is a transition, not a swap */
    const target=P.driving?1:0;
    if(P.vt===undefined) P.vt=target;
    P.vt+=Math.max(-0.09,Math.min(0.09,target-P.vt));

    const b=nearBuilding(),pr=$('prompt');
    const gate=nearGate();
    if(b){pr.classList.add('on');
      pr.innerHTML=`Enter ${b.n}<small>${promptFor(b)}</small>`;
      $('actBtn').classList.add('live');}
    else if(gate){pr.classList.add('on');
      pr.innerHTML=`${gate.n} is closed to you<small>Needs a ${carNeededFor(gate).n}</small>`;
      $('actBtn').classList.remove('live');}
    else{pr.classList.remove('on');$('actBtn').classList.remove('live');}
  }
}
/* the first locked district within a short walk of the player */
function nearGate(){
  for(const d of DISTRICTS){
    if(districtOpen(d)) continue;
    if(Math.abs(P.x-d.x0)<150) return d;
  }
  return null;
}
function promptFor(b){
  if(b.id==='office') return sessionsLeft>0? sessionsLeft+' trading sessions left':'No sessions left \u2014 go home';
  if(b.id==='apt') return sessionsLeft>0? 'Sleeping ends the month early':'End the month';
  if(b.id==='bar') return '$80 \u00b7 restores 2 focus';
  if(b.id==='club') return '$250 \u00b7 full focus, and people talk';
  if(b.id==='dealer') return owned.car?'You already own the car':'Used car \u00b7 '+money(CARS[1].cost);
  if(b.id==='school') return tutorReg?'Courses \u00b7 tutoring pays '+money(tutorRoomLeft())+' more this month':'Courses \u00b7 and paid tutoring work';
  if(b.id==='annex') return 'Bottle service, tips, and people who talk';
  if(b.id==='rest') return 'Eat \u00b7 moves relationships along';
  if(b.id==='board') return eventDone===month?'You have taken this month\u2019s':eventFor(month).n;
  if(b.id==='gym') return 'Raise the focus ceiling for the month';
  if(b.id==='rostrum') return 'Buy standing outright';
  if(b.id==='headland') return 'Turn contacts into capital';
  if(b.id==='floor') return 'Buy a sixth trading session';
  if(b.id==='prime') return 'Which desks are open to you';
  if(b.id==='bank') return 'Credit against your title';
  if(b.id==='recruit') return 'Seats, and what they need';
  if(b.id==='pbank') return 'Credit against your balance sheet';
  if(b.id==='estates') return 'High-end property';
  if(b.id==='realtor') return owned.apt?'You already moved':'Better apartment \u00b7 $5,000';
  if(b.id==='tech') return appLive?'App is live':appLeft>0?'In build \u2014 '+appLeft+' mo':'Fund an app \u00b7 $7,500';
  return '';
}
