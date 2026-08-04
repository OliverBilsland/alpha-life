/* ==================== RENDER ==================== */
/* No webfonts are loaded (the game must run with no network), so canvas text
   uses the same system stacks the CSS falls back to. */
const CANVAS_COND='700 13px "IBM Plex Sans Condensed","Avenir Next Condensed","Arial Narrow",-apple-system,sans-serif';
const CANVAS_DIST='700 26px "IBM Plex Sans Condensed","Avenir Next Condensed","Arial Narrow",-apple-system,sans-serif';
const CANVAS_MONO='400 10px "IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace';
const cv=$('cv'),cx=cv.getContext('2d');
let VW=0,VH=0,DPR=1;
function resize(){DPR=Math.min(devicePixelRatio||1,2);VW=innerWidth;VH=innerHeight;
  cv.width=VW*DPR;cv.height=VH*DPR;cx.setTransform(DPR,0,0,DPR,0,0);}
addEventListener('resize',resize);resize();

function draw(){
  const cam={x:Math.max(0,Math.min(W-VW,P.x-VW/2)),y:Math.max(0,Math.min(H-VH,P.y-VH/2))};
  cx.fillStyle='#171A1E';cx.fillRect(0,0,VW,VH);
  cx.save();cx.translate(-cam.x,-cam.y);

  // district bands
  DISTRICTS.forEach(d=>{
    const open=districtOpen(d);
    cx.fillStyle=d.c;
    for(let x=d.x0;x<d.x1;x+=200)for(let y=0;y<H;y+=200)
      cx.fillRect(x+4,y+4,Math.min(192,d.x1-x-8),192);
    if(!open){cx.fillStyle='#0A0C0E9E';cx.fillRect(d.x0,0,d.x1-d.x0,H);}
    // checkpoint stripe on the boundary
    if(d.x0>0){
      cx.fillStyle=open?'#3A4048':'#6E4A2E';
      for(let y=0;y<H;y+=48) cx.fillRect(d.x0-5,y,10,26);
    }
    cx.fillStyle=open?'#EDEFEA20':'#EDEFEA38';
    cx.font=CANVAS_DIST; cx.textAlign='center';
    cx.fillText(open?d.n:d.n+'  ·  '+carNeededFor(d).n.toUpperCase()+' REQUIRED',
      (d.x0+d.x1)/2, 62);
  });
  // roads
  cx.fillStyle='#25292F';ROADS.forEach(r=>cx.fillRect(r.x,r.y,r.w,r.h));
  cx.strokeStyle='#3A4048';cx.lineWidth=2;cx.setLineDash([22,20]);
  ROADS.forEach(r=>{cx.beginPath();
    if(r.w>r.h){cx.moveTo(r.x,r.y+r.h/2);cx.lineTo(r.x+r.w,r.y+r.h/2);}
    else{cx.moveTo(r.x+r.w/2,r.y);cx.lineTo(r.x+r.w/2,r.y+r.h);}cx.stroke();});
  cx.setLineDash([]);

  // buildings
  const near=nearBuilding();
  B.forEach(b=>{
    cx.fillStyle='#0C0E11';cx.fillRect(b.x+7,b.y+9,b.w,b.h);
    cx.fillStyle=b.c;cx.fillRect(b.x,b.y,b.w,b.h);
    cx.fillStyle='#00000033';cx.fillRect(b.x,b.y,b.w,26);
    // windows
    cx.fillStyle='#EDEFEA18';
    for(let wx=b.x+18;wx<b.x+b.w-24;wx+=34)for(let wy=b.y+40;wy<b.y+b.h-40;wy+=32)cx.fillRect(wx,wy,18,16);
    // door
    const d=door(b);
    const lit=near&&near.id===b.id;
    if(lit){cx.fillStyle='#EDEFEA22';cx.fillRect(d.x-34,d.y-16,68,30);}
    cx.fillStyle=lit?'#FFFFFF':'#EDEFEA';cx.fillRect(d.x-20,d.y-6,40,10);
    cx.fillStyle='#EDEFEA';cx.font=CANVAS_COND;
    cx.textAlign='center';cx.fillText(b.n,b.x+b.w/2,b.y+18);
    cx.fillStyle='#EDEFEA88';cx.font=CANVAS_MONO;
    cx.fillText(b.s.toUpperCase(),b.x+b.w/2,b.y+b.h+18);
  });

  // player
  cx.save();cx.translate(P.x,P.y);cx.rotate(P.dir);
  if(P.driving){
    cx.fillStyle='#F3E6A012';cx.beginPath();cx.moveTo(18,-9);cx.lineTo(150,-52);
    cx.lineTo(150,52);cx.lineTo(18,9);cx.closePath();cx.fill();
    cx.fillStyle='#00000055';cx.fillRect(-16,-9,34,20);
    cx.fillStyle='#C8452F';cx.fillRect(-18,-11,36,22);
    cx.fillStyle='#1A1D22';cx.fillRect(-6,-9,12,18);
    cx.fillStyle='#F3E6A0';cx.fillRect(16,-9,4,6);cx.fillRect(16,3,4,6);
  }else{
    cx.fillStyle='#00000055';cx.beginPath();cx.arc(2,2,10,0,7);cx.fill();
    cx.fillStyle='#EDEFEA';cx.beginPath();cx.arc(0,0,10,0,7);cx.fill();
    cx.fillStyle='#2B4C7E';cx.fillRect(4,-4,7,8);
  }
  cx.restore();
  cx.restore();
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
    if(splashDone&&!paused) simulate();
    draw();
  }
  requestAnimationFrame(step);
}
function simulate(){
  {
    const sp=carSpeed();
    let dx=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0)+tv.x;
    let dy=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0)+tv.y;
    const m=Math.hypot(dx,dy);
    if(m>1){dx/=m;dy/=m;}
    if(m>.08){P.dir=Math.atan2(dy,dx);}
    const nx=P.x+dx*sp, ny=P.y+dy*sp;
    if(!blocked(nx,P.y))P.x=nx;
    if(!blocked(P.x,ny))P.y=ny;

    const b=nearBuilding(),pr=$('prompt');
    const gate=nearGate();
    if(b){pr.classList.add('on');
      pr.innerHTML=`Enter ${b.n}<small>${promptFor(b)}</small>`;
      $('actBtn').classList.toggle('live',canVisit(b.id));}
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
  if(b.id==='dealer') return owned.car?'You already own the car':'Used car \u00b7 $4,500';
  if(b.id==='school') return 'Courses \u00b7 accounting, terminal';
  if(b.id==='realtor') return owned.apt?'You already moved':'Better apartment \u00b7 $5,000';
  if(b.id==='tech') return appLive?'App is live':appLeft>0?'In build \u2014 '+appLeft+' mo':'Fund an app \u00b7 $7,500';
  return '';
}
