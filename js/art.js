/* ==================== ART ====================
   All canvas drawing. Code-drawn, no image assets.

   The look is a warm dusk city: deep indigo ground, saturated buildings with
   amber lit windows and extruded rooftops, warm lamp pools on the pavement, and
   a per-district hue so regions read at a glance. */

const FONT_COND='700 13px "IBM Plex Sans Condensed","Avenir Next Condensed","Arial Narrow",-apple-system,sans-serif';
const FONT_MONO='400 10px "IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace';
const CANVAS_COND=FONT_COND, CANVAS_MONO=FONT_MONO;   /* names kept for the ship checks */
const FONT_DIST='700 26px "IBM Plex Sans Condensed","Avenir Next Condensed","Arial Narrow",-apple-system,sans-serif';

const PAL={
  void:'#0D0A16',
  ground:'#1B1730', groundHi:'#241E3E',
  kerb:'#332B4E', kerbHi:'#3E3459',
  road:'#241E33', roadEdge:'#3A3050', dash:'#E9A93C',
  lamp:'#FFCE7A', lampGlow:'rgba(255,196,102,0.10)',
  shadow:'rgba(8,5,18,0.55)',
  winOn:'#FFD98A', winOn2:'#FFB25E', winOff:'#372F52',
  roof:'#2A2340', roofHi:'#3B3255',
  locked:'rgba(9,6,18,0.66)', gate:'#C9622E',
  ink:'#F7F2E7', inkDim:'rgba(247,242,231,0.42)'
};

/* deterministic per-building jitter so detail is stable frame to frame */
function hash32(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rngFor(str){let a=hash32(str);return()=>{a|=0;a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* each district gets a hue so you always know where you are */
const DTINT={old:'#2A1F33', mid:'#17223A', heights:'#2B1836', harbour:'#10262E', coast:'#2E2418'};

/* ---------- ground ---------- */
function drawGround(cx,cam,VW,VH){
  cx.fillStyle=PAL.void; cx.fillRect(cam.x,cam.y,VW,VH);
  for(const d of DISTRICTS){
    const x0=Math.max(d.x0,cam.x-40), x1=Math.min(d.x1,cam.x+VW+40);
    if(x1<=x0) continue;
    cx.fillStyle=DTINT[d.id]||PAL.ground;
    cx.fillRect(x0,cam.y-40,x1-x0,VH+80);
  }
  /* pavement blocks with a lit top edge for depth */
  const bx0=Math.max(0,Math.floor((cam.x-200)/200)*200), bx1=Math.min(W,cam.x+VW+200);
  const by0=Math.max(0,Math.floor((cam.y-200)/200)*200), by1=Math.min(H,cam.y+VH+200);
  for(let x=bx0;x<bx1;x+=200)for(let y=by0;y<by1;y+=200){
    cx.fillStyle=PAL.kerb;   cx.fillRect(x+6,y+6,188,188);
    cx.fillStyle=PAL.kerbHi; cx.fillRect(x+6,y+6,188,3);
  }
  /* locked districts are dimmed, with a warm checkpoint stripe */
  for(const d of DISTRICTS){
    if(districtOpen(d)) continue;
    cx.fillStyle=PAL.locked; cx.fillRect(d.x0,cam.y-40,d.x1-d.x0,VH+80);
  }
}

function drawRoads(cx){
  for(const r of ROADS){
    cx.fillStyle=PAL.road; cx.fillRect(r.x,r.y,r.w,r.h);
    cx.fillStyle=PAL.roadEdge;
    if(r.w>r.h){cx.fillRect(r.x,r.y,r.w,2);cx.fillRect(r.x,r.y+r.h-2,r.w,2);}
    else{cx.fillRect(r.x,r.y,2,r.h);cx.fillRect(r.x+r.w-2,r.y,2,r.h);}
  }
  cx.strokeStyle=PAL.dash; cx.lineWidth=2.5; cx.globalAlpha=0.55; cx.setLineDash([26,22]);
  for(const r of ROADS){
    cx.beginPath();
    if(r.w>r.h){cx.moveTo(r.x,r.y+r.h/2);cx.lineTo(r.x+r.w,r.y+r.h/2);}
    else{cx.moveTo(r.x+r.w/2,r.y);cx.lineTo(r.x+r.w/2,r.y+r.h);}
    cx.stroke();
  }
  cx.setLineDash([]); cx.globalAlpha=1;
}

/* street lamps along the horizontal roads, with a warm pool of light */
function drawLamps(cx,cam,VW){
  for(const r of ROADS){
    if(r.w<r.h) continue;
    const y=r.y+r.h+8;
    const x0=Math.max(0,Math.floor((cam.x-300)/300)*300);
    for(let x=x0;x<cam.x+VW+300;x+=300){
      cx.fillStyle=PAL.lampGlow;
      cx.beginPath(); cx.arc(x,y,74,0,7); cx.fill();
      cx.fillStyle='#4A3F63'; cx.fillRect(x-2,y-30,4,30);
      cx.fillStyle=PAL.lamp;  cx.beginPath(); cx.arc(x,y-32,4.5,0,7); cx.fill();
    }
  }
}

/* ---------- buildings ---------- */
function drawBuilding(cx,b,near){
  const rnd=rngFor(b.id);
  const lit=districtOpen(districtAt(b.x));
  const dep=16;                                   /* extrusion depth */

  cx.fillStyle=PAL.shadow;
  cx.fillRect(b.x+9,b.y+13,b.w,b.h);

  /* extruded roof: a lighter slab offset up-left, then the facade */
  cx.fillStyle=PAL.roof;   cx.fillRect(b.x-dep*0.35,b.y-dep,b.w,b.h);
  cx.fillStyle=PAL.roofHi; cx.fillRect(b.x-dep*0.35,b.y-dep,b.w,4);

  cx.fillStyle=b.c; cx.fillRect(b.x,b.y,b.w,b.h);
  /* facade shading: darker to the right, lighter at the top */
  const g=cx.createLinearGradient?cx.createLinearGradient(b.x,0,b.x+b.w,0):null;
  if(g){g.addColorStop(0,'rgba(255,255,255,0.09)');g.addColorStop(1,'rgba(0,0,0,0.22)');
    cx.fillStyle=g;cx.fillRect(b.x,b.y,b.w,b.h);}
  cx.fillStyle='rgba(0,0,0,0.30)'; cx.fillRect(b.x,b.y,b.w,30);

  /* rooftop clutter */
  for(let i=0;i<3;i++){
    const rw=10+rnd()*22, rh=6+rnd()*10;
    const rx=b.x+12+rnd()*(b.w-40), ry=b.y-dep-rh+3;
    cx.fillStyle='#2F2846'; cx.fillRect(rx,ry,rw,rh);
    cx.fillStyle='#403757'; cx.fillRect(rx,ry,rw,2);
  }
  if(rnd()>0.45){
    const ax=b.x+b.w-26;
    cx.fillStyle='#4A4163'; cx.fillRect(ax,b.y-dep-26,2.5,26);
    cx.fillStyle='#E9584B'; cx.beginPath(); cx.arc(ax+1,b.y-dep-28,2.5,0,7); cx.fill();
  }

  /* windows: warm, some lit, in a stable pattern */
  for(let wx=b.x+16;wx<b.x+b.w-26;wx+=32)
    for(let wy=b.y+42;wy<b.y+b.h-38;wy+=30){
      const v=rnd();
      cx.fillStyle=!lit?PAL.winOff:v>0.62?PAL.winOn:v>0.44?PAL.winOn2:PAL.winOff;
      cx.fillRect(wx,wy,17,15);
      if(lit&&v>0.44){cx.fillStyle='rgba(255,214,138,0.13)';cx.fillRect(wx-4,wy-3,25,21);}
    }

  /* ground-floor storefront + canopy over the door */
  const d=door(b);
  cx.fillStyle='rgba(0,0,0,0.28)'; cx.fillRect(b.x,b.y+b.h-30,b.w,30);
  if(lit){cx.fillStyle='rgba(255,206,122,0.16)';cx.fillRect(b.x+8,b.y+b.h-26,b.w-16,20);}
  cx.fillStyle=near?'rgba(255,224,160,0.30)':'rgba(255,206,122,0.13)';
  cx.beginPath(); cx.ellipse?cx.ellipse(d.x,d.y+16,54,22,0,0,7):cx.arc(d.x,d.y+16,40,0,7); cx.fill();
  cx.fillStyle='#1A1526'; cx.fillRect(d.x-19,b.y+b.h-26,38,26);
  cx.fillStyle=near?'#FFE7B0':PAL.lamp; cx.fillRect(d.x-22,b.y+b.h-30,44,6);
  cx.fillStyle=near?'#FFF3D6':'#EFE3C8'; cx.fillRect(d.x-20,d.y-6,40,9);

  /* signage */
  cx.fillStyle=lit?PAL.ink:PAL.inkDim;
  cx.font=FONT_COND; cx.textAlign='center';
  cx.fillText(b.n,b.x+b.w/2,b.y+20);
  cx.fillStyle=lit?'rgba(247,242,231,0.55)':PAL.inkDim;
  cx.font=FONT_MONO;
  cx.fillText(b.s.toUpperCase(),b.x+b.w/2,b.y+b.h+30);
}

/* ---------- the character ---------- */
/* Built from parts so it reads at 20px: shadow, two legs that swing, a coat,
   two arms, a head. Facing is derived from dir; the walk cycle is driven by
   distance travelled, so it stops when the player stops. */
const SKIN='#EFC08E', HAIR='#2C1E1A', COAT='#E8574B', COAT_D='#B93B35',
      TROUSER='#2E3C74', SHOE='#1A1526', SCARF='#3FBFA0';

function facingOf(dir){
  const dx=Math.cos(dir), dy=Math.sin(dir);
  if(Math.abs(dx)>Math.abs(dy)) return dx>0?'right':'left';
  return dy>0?'down':'up';
}

function drawCharacter(cx,dir,phase,moving,scale){
  const f=facingOf(dir);
  const s=scale===undefined?1:scale;
  const sw=moving?Math.sin(phase*Math.PI*2):0;          /* leg swing */
  const bob=moving?Math.abs(Math.cos(phase*Math.PI*2))*1.2:0;
  cx.save(); cx.scale(s,s);

  cx.fillStyle=PAL.shadow;
  cx.beginPath();
  if(cx.ellipse) cx.ellipse(0,9,10,4.2,0,0,7); else cx.arc(0,9,8,0,7);
  cx.fill();

  const flip=(f==='left')?-1:1;
  cx.save(); cx.translate(0,-bob);

  /* legs */
  cx.fillStyle=TROUSER;
  if(f==='left'||f==='right'){
    cx.fillRect(-3+sw*3,1,4.5,9); cx.fillRect(-3-sw*3,1,4.5,9);
  }else{
    cx.fillRect(-5,1+Math.abs(sw)*1.5,4.5,9); cx.fillRect(1,1-Math.abs(sw)*1.5,4.5,9);
  }
  cx.fillStyle=SHOE;
  if(f==='left'||f==='right'){cx.fillRect(-4+sw*3,9.5,6,2.5);cx.fillRect(-4-sw*3,9.5,6,2.5);}
  else{cx.fillRect(-5.5,9.5,5.5,2.5);cx.fillRect(0.5,9.5,5.5,2.5);}

  /* coat */
  cx.fillStyle=COAT;   cx.fillRect(-6,-7,12,9);
  cx.fillStyle=COAT_D; cx.fillRect(flip*3.2-1.2,-7,2.4,9);      /* button placket / back seam */
  cx.fillStyle=SCARF;  cx.fillRect(-5.5,-8.5,11,2.4);

  /* arms swing opposite the legs */
  cx.fillStyle=COAT_D;
  if(f==='left'||f==='right'){
    cx.fillRect(-2.2-sw*2.6,-6,3.4,8);
  }else{
    cx.fillRect(-8.2,-6+sw*1.6,2.8,8); cx.fillRect(5.4,-6-sw*1.6,2.8,8);
  }

  /* head */
  cx.fillStyle=SKIN; cx.beginPath(); cx.arc(0,-12.5,5.4,0,7); cx.fill();
  cx.fillStyle=HAIR;
  if(f==='up'){ cx.beginPath(); cx.arc(0,-12.5,5.4,0,7); cx.fill(); }
  else{
    cx.beginPath(); cx.arc(0,-13.6,5.4,Math.PI,0); cx.fill();
    cx.fillRect(-5.4,-14.2,10.8,2.6);
    if(f!=='down'){ cx.fillRect(flip*2.4,-14,3,5); }
  }
  if(f==='down'){
    cx.fillStyle='#1A1526';
    cx.fillRect(-2.6,-12.6,1.6,1.8); cx.fillRect(1.0,-12.6,1.6,1.8);
  }else if(f!=='up'){
    cx.fillStyle='#1A1526'; cx.fillRect(flip*1.6-0.8,-12.6,1.6,1.8);
  }
  cx.restore(); cx.restore();
}

function drawCar(cx,dir,tier){
  const body=['#E8574B','#E8574B','#3E7BD6','#D9A227','#C9354F'][tier]||'#E8574B';
  const dark=['#B93B35','#B93B35','#2C5CA6','#A97C15','#96263A'][tier]||'#B93B35';
  cx.fillStyle=PAL.shadow;
  cx.beginPath(); if(cx.ellipse) cx.ellipse(0,7,22,7,0,0,7); else cx.arc(0,7,18,0,7); cx.fill();
  /* headlight cone */
  cx.fillStyle='rgba(255,214,138,0.10)';
  cx.beginPath(); cx.moveTo(18,-9); cx.lineTo(165,-58); cx.lineTo(165,58); cx.lineTo(18,9);
  cx.closePath(); cx.fill();
  cx.fillStyle=dark; cx.fillRect(-19,-12,38,24);
  cx.fillStyle=body; cx.fillRect(-19,-11,38,21);
  cx.fillStyle='rgba(255,255,255,0.16)'; cx.fillRect(-19,-11,38,4);
  cx.fillStyle='#151024'; cx.fillRect(-7,-9,13,18);            /* cabin */
  cx.fillStyle='#6FD6F2'; cx.fillRect(-5.5,-7.5,10,15);        /* glass */
  cx.fillStyle='#FFE7B0'; cx.fillRect(17,-9,4.5,6); cx.fillRect(17,3,4.5,6);
  cx.fillStyle='#C9354F'; cx.fillRect(-20,-9,3,5); cx.fillRect(-20,4,3,5);
}

/* Getting in and out: the character shrinks toward the car, then the car appears.
   P.vt runs 0..1 and is driven in city.js. */
function drawPlayer(cx,phase){
  cx.save(); cx.translate(P.x,P.y); cx.rotate(P.dir);
  const t=P.vt===undefined?(P.driving?1:0):P.vt;
  if(t>0.02) { cx.save(); cx.globalAlpha=Math.min(1,t*1.6); drawCar(cx,P.dir,carTier); cx.restore(); }
  if(t<0.98){
    cx.save(); cx.rotate(-P.dir);                 /* the person does not rotate with the car */
    cx.globalAlpha=Math.min(1,(1-t)*1.6);
    drawCharacter(cx,P.dir,phase,P.moving,0.6+0.4*(1-t));
    cx.restore();
  }
  cx.restore();
}

/* a warm vignette so the edges fall away */
function drawVignette(cx,VW,VH){
  if(!cx.createRadialGradient) return;
  const g=cx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.35,VW/2,VH/2,Math.max(VW,VH)*0.78);
  g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(8,5,20,0.55)');
  cx.fillStyle=g; cx.fillRect(0,0,VW,VH);
}

function drawDistrictLabels(cx,cam,VW){
  for(const d of DISTRICTS){
    const mid=(d.x0+d.x1)/2;
    if(mid<cam.x-500||mid>cam.x+VW+500) continue;
    const open=districtOpen(d);
    cx.fillStyle=open?'rgba(247,242,231,0.13)':'rgba(255,190,130,0.30)';
    cx.font=FONT_DIST; cx.textAlign='center';
    cx.fillText(open?d.n:d.n+'  ·  '+carNeededFor(d).n.toUpperCase()+' REQUIRED',mid,64);
  }
  /* checkpoint posts on closed boundaries */
  for(const d of DISTRICTS){
    if(d.x0===0) continue;
    const open=districtOpen(d);
    cx.fillStyle=open?'#3A3050':PAL.gate;
    for(let y=0;y<H;y+=52) cx.fillRect(d.x0-5,y,10,28);
  }
}

/* ==================== AMBIENT LIFE ====================
   The city is inhabited: pedestrians walk the pavements, traffic runs the roads,
   and windows flicker. All procedural, all deterministic in layout, and all
   purely decorative -- nothing here touches collision or state. */

const CROWD=[], TRAFFIC=[];
function seedLife(){
  CROWD.length=0; TRAFFIC.length=0;
  const r=rngFor('crowd');
  for(let i=0;i<90;i++){
    const road=ROADS[Math.floor(r()*ROADS.length)];
    const horiz=road.w>road.h;
    CROWD.push({
      x:road.x+r()*road.w, y:horiz?road.y+road.h+10+r()*26:road.y+r()*road.h,
      dir:r()<0.5?-1:1, horiz, sp:0.22+r()*0.30, ph:r(),
      c:['#E8574B','#3FBFA0','#E9A93C','#8FA3FF','#D98AC4','#F0E0C0'][Math.floor(r()*6)]
    });
  }
  for(let i=0;i<34;i++){
    const road=ROADS[Math.floor(r()*ROADS.length)];
    const horiz=road.w>road.h;
    TRAFFIC.push({
      x:road.x+r()*road.w, y:road.y+(horiz?road.h*0.3+r()*road.h*0.4:r()*road.h),
      dir:r()<0.5?-1:1, horiz, sp:1.1+r()*1.9,
      c:['#7C7060','#3E5F8A','#8A4038','#4A6E52','#6A5A7A'][Math.floor(r()*5)]
    });
  }
}
function stepLife(){
  for(const p of CROWD){
    if(p.horiz) p.x+=p.sp*p.dir; else p.y+=p.sp*p.dir;
    p.ph=(p.ph+p.sp*0.05)%1;
    if(p.x<-40) p.x=W+40; if(p.x>W+40) p.x=-40;
    if(p.y<-40) p.y=H+40; if(p.y>H+40) p.y=-40;
  }
  for(const v of TRAFFIC){
    if(v.horiz) v.x+=v.sp*v.dir; else v.y+=v.sp*v.dir;
    if(v.x<-60) v.x=W+60; if(v.x>W+60) v.x=-60;
    if(v.y<-60) v.y=H+60; if(v.y>H+60) v.y=-60;
  }
}
function drawLife(cx,cam,VW,VH){
  const vis=(o)=>o.x>cam.x-60&&o.x<cam.x+VW+60&&o.y>cam.y-60&&o.y<cam.y+VH+60;
  for(const v of TRAFFIC){
    if(!vis(v)||!districtOpen(districtAt(v.x))) continue;
    cx.save(); cx.translate(v.x,v.y); cx.rotate(v.horiz?(v.dir>0?0:Math.PI):(v.dir>0?Math.PI/2:-Math.PI/2));
    cx.fillStyle=PAL.shadow; cx.fillRect(-13,-6,28,15);
    cx.fillStyle=v.c;        cx.fillRect(-14,-7,28,14);
    cx.fillStyle='#151024';  cx.fillRect(-5,-5,9,10);
    cx.fillStyle='#FFE7B0';  cx.fillRect(12,-5,3,3); cx.fillRect(12,2,3,3);
    cx.restore();
  }
  for(const p of CROWD){
    if(!vis(p)||!districtOpen(districtAt(p.x))) continue;
    const bob=Math.abs(Math.sin(p.ph*Math.PI*2))*1.1;
    cx.fillStyle=PAL.shadow;
    cx.beginPath(); if(cx.ellipse) cx.ellipse(p.x,p.y+5,4.5,2,0,0,7); else cx.arc(p.x,p.y+5,4,0,7);
    cx.fill();
    cx.fillStyle='#2E3C74'; cx.fillRect(p.x-2.2,p.y-1-bob,4.4,6);
    cx.fillStyle=p.c;       cx.fillRect(p.x-2.8,p.y-6-bob,5.6,5.5);
    cx.fillStyle='#EFC08E'; cx.beginPath(); cx.arc(p.x,p.y-8.5-bob,2.4,0,7); cx.fill();
  }
}

/* ==================== WHAT YOU BOUGHT, VISIBLE IN THE CITY ====================
   Every life upgrade leaves a mark on the world. This is the point of the goal
   loop: you should be able to look at your own building and see what the last
   ten market sessions actually bought. */
function propsFor(id){
  const b=B.find(x=>x.id===id); if(!b) return;
  const d=door(b);

  if(id==='apt'){
    /* the laptop: a blue desk-light in your window */
    if(owned.laptop){
      const lx=b.x+16+32, ly=b.y+42;                       /* one window on the grid */
      cx.fillStyle='rgba(110,190,255,0.20)'; cx.fillRect(lx-7,ly-7,17+14,15+14);
      cx.fillStyle='#6FD6F2'; cx.fillRect(lx,ly,17,15);
      cx.fillStyle='#BFEEFF'; cx.fillRect(lx,ly,17,3);
    }
    /* the upgrade: a lit extra floor and a balcony */
    if(homeTier>=1){
      cx.fillStyle='#5A4E42'; cx.fillRect(b.x-4,b.y-30,b.w+8,26);
      cx.fillStyle='#6E6053'; cx.fillRect(b.x-4,b.y-30,b.w+8,4);
      for(let wx=b.x+14;wx<b.x+b.w-24;wx+=30){
        cx.fillStyle=PAL.winOn; cx.fillRect(wx,b.y-24,16,13);
        cx.fillStyle='rgba(255,214,138,0.16)'; cx.fillRect(wx-4,b.y-27,24,19);
      }
      cx.fillStyle='#3A3247'; cx.fillRect(b.x+b.w-74,b.y+b.h-64,58,5);
      for(let i=0;i<5;i++) cx.fillRect(b.x+b.w-72+i*13,b.y+b.h-64,3,15);
    }
    /* the car, parked outside whenever you are not in it */
    if(carTier>0&&!P.driving){
      const px=d.x+74, py=d.y+20;
      cx.save(); cx.translate(px,py);
      cx.fillStyle=PAL.shadow; cx.fillRect(-15,-6,32,16);
      cx.fillStyle=['#E8574B','#E8574B','#3E7BD6','#D9A227','#C9354F'][carTier]||'#E8574B';
      cx.fillRect(-16,-8,32,16);
      cx.fillStyle='#151024'; cx.fillRect(-6,-6,12,12);
      cx.fillStyle='#6FD6F2'; cx.fillRect(-5,-5,10,10);
      cx.restore();
    }
  }

  /* the finance course: your name on the board outside the Institute */
  if(id==='school'&&owned.acct){
    cx.fillStyle='#F2E2B8'; cx.fillRect(d.x-46,d.y+16,92,20);
    cx.fillStyle='#2B2119'; cx.fillRect(d.x-44,d.y+18,88,16);
    cx.fillStyle='#FFD98A'; cx.font=FONT_MONO; cx.textAlign='center';
    cx.fillText('ENROLLED',d.x,d.y+30);
  }

  /* a night out: the bar front stays lit for the rest of the month */
  if(id==='bar'&&nightOutMonth===month){
    cx.fillStyle='rgba(255,110,180,0.20)';
    cx.beginPath();
    if(cx.ellipse) cx.ellipse(d.x,d.y+10,88,40,0,0,7); else cx.arc(d.x,d.y+10,70,0,7);
    cx.fill();
    for(let i=0;i<7;i++){
      cx.fillStyle=i%2?'#FF6EB4':'#6FD6F2';
      cx.fillRect(b.x+16+i*28,b.y+b.h-40,18,4);
    }
  }
}
function drawProps(){ ['apt','school','bar'].forEach(propsFor); }
