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

  /* The sign over the door: a lit disc in the kind's colour with its pictogram
     in it. This is what makes the city readable at a glance — the same mark
     appears on the minimap, so recognising it once is enough. */
  drawKindBadge(cx,b,d,lit,near);
}

/* ---------- pictograms ----------
   Deliberately crude and high-contrast: these are read at 22px while moving,
   often in peripheral vision, so silhouette beats detail every time. Drawn in a
   -10..10 box around the origin, so the same routine serves the building badge
   and the minimap dot at whatever scale is asked for. */
function drawKindIcon(cx,kind,size){
  const s=size/20;
  cx.save(); cx.scale(s,s);
  cx.lineCap='round'; cx.lineJoin='round';
  const fill=c=>{cx.fillStyle=c;};
  fill('#12101C');

  switch(kind){
    case 'desk':      /* a rising chart — this is where you trade */
      cx.fillRect(-8,2,3.5,5); cx.fillRect(-3,-1,3.5,8); cx.fillRect(2,-5,3.5,12);
      cx.beginPath(); cx.moveTo(6,-8); cx.lineTo(9,-8); cx.lineTo(9,-5); cx.closePath(); cx.fill();
      break;
    case 'home':      /* a house */
      cx.beginPath(); cx.moveTo(0,-8); cx.lineTo(9,-1); cx.lineTo(6,-1); cx.lineTo(6,8);
      cx.lineTo(-6,8); cx.lineTo(-6,-1); cx.lineTo(-9,-1); cx.closePath(); cx.fill();
      break;
    case 'money':     /* stacked coins */
      cx.beginPath(); if(cx.ellipse){cx.ellipse(0,-4,8,3.2,0,0,7);}else{cx.arc(0,-4,8,0,7);} cx.fill();
      cx.fillRect(-8,-4,16,5);
      cx.beginPath(); if(cx.ellipse){cx.ellipse(0,1,8,3.2,0,0,7);}else{cx.arc(0,1,8,0,7);} cx.fill();
      cx.fillRect(-8,1,16,5);
      cx.beginPath(); if(cx.ellipse){cx.ellipse(0,6,8,3.2,0,0,7);}else{cx.arc(0,6,8,0,7);} cx.fill();
      break;
    case 'learn':     /* an open book */
      cx.beginPath(); cx.moveTo(-9,-6); cx.lineTo(-1,-4); cx.lineTo(-1,7); cx.lineTo(-9,5); cx.closePath(); cx.fill();
      cx.beginPath(); cx.moveTo(9,-6); cx.lineTo(1,-4); cx.lineTo(1,7); cx.lineTo(9,5); cx.closePath(); cx.fill();
      break;
    case 'social':    /* two heads */
      cx.beginPath(); cx.arc(-4,-3,3.6,0,7); cx.fill();
      cx.beginPath(); cx.arc(4.5,-2,3,0,7); cx.fill();
      cx.beginPath(); cx.moveTo(-10,8); cx.quadraticCurveTo(-4,0,2,8); cx.closePath(); cx.fill();
      cx.beginPath(); cx.moveTo(0,8); cx.quadraticCurveTo(4.5,2,9.5,8); cx.closePath(); cx.fill();
      break;
    case 'work':      /* a briefcase */
      cx.fillRect(-9,-2,18,10);
      cx.fillRect(-3.5,-7,7,3);
      cx.fillRect(-1.5,-5,3,4);
      break;
    case 'car':       /* a car, seen from the side */
      cx.beginPath(); cx.moveTo(-9,3); cx.lineTo(-7,-2); cx.lineTo(-2,-2); cx.lineTo(1,-6);
      cx.lineTo(6,-6); cx.lineTo(8,-2); cx.lineTo(9,3); cx.closePath(); cx.fill();
      cx.beginPath(); cx.arc(-5,4.5,2.4,0,7); cx.fill();
      cx.beginPath(); cx.arc(5,4.5,2.4,0,7); cx.fill();
      break;
    case 'body':      /* a dumbbell */
      cx.fillRect(-3,-2.5,6,5);
      cx.fillRect(-8,-6,4,12); cx.fillRect(4,-6,4,12);
      break;
    case 'status':    /* a star */
      cx.beginPath();
      for(let i=0;i<10;i++){
        const a=-Math.PI/2+i*Math.PI/5, r=i%2?3.8:9;
        i?cx.lineTo(Math.cos(a)*r,Math.sin(a)*r):cx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
      }
      cx.closePath(); cx.fill();
      break;
  }
  cx.restore();
}

function drawKindBadge(cx,b,d,lit,near){
  const k=kindOf(b);
  const x=d.x, y=b.y+b.h-46;
  const r=near?17:15;

  /* a glow, so the badge reads as the lit thing on a dark facade */
  if(lit){
    cx.fillStyle=near?'rgba(255,240,200,0.22)':'rgba(255,240,200,0.10)';
    cx.beginPath(); cx.arc(x,y,r+9,0,7); cx.fill();
  }
  cx.fillStyle='rgba(10,8,18,0.55)';
  cx.beginPath(); cx.arc(x,y+1.5,r,0,7); cx.fill();
  cx.fillStyle=lit?k.c:'#4A4459';
  cx.beginPath(); cx.arc(x,y,r,0,7); cx.fill();
  cx.fillStyle='rgba(255,255,255,0.22)';
  cx.beginPath(); cx.arc(x,y-r*0.35,r*0.82,Math.PI,0); cx.fill();

  cx.save(); cx.translate(x,y);
  drawKindIcon(cx,b.k,r*1.45);
  cx.restore();
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

/* Rubber laid by a drift. World space, drawn under the buildings and the car,
   so you drive over your own marks rather than in front of them. */
function drawSkids(cx){
  if(typeof SKIDS==='undefined'||!SKIDS.length) return;
  cx.save();
  for(const s of SKIDS){
    cx.save(); cx.translate(s.x,s.y); cx.rotate(s.d);
    cx.fillStyle='rgba(18,14,28,'+(s.a*0.42).toFixed(3)+')';
    cx.fillRect(-9,-11,15,4.5);
    cx.fillRect(-9,7,15,4.5);
    cx.restore();
  }
  cx.restore();
}

/* The paint on the Superba will not sit still. Cheap trick, correct car. */
function flashyPaint(t){
  const hue=(Date.now()*0.09+t*40)%360;
  return 'hsl('+hue.toFixed(0)+',78%,58%)';
}

function drawCar(cx,dir,tier){
  const boosting=typeof boostOn!=='undefined'&&boostOn;
  const sliding =typeof drifting!=='undefined'&&drifting;
  const toy=typeof carToy==='function'?carToy():null;

  let body=(typeof CAR_BODY!=='undefined'&&CAR_BODY[tier])||'#E8574B';
  let dark=(typeof CAR_TRIM!=='undefined'&&CAR_TRIM[tier])||'#B93B35';
  /* the Superba's paint will not sit still */
  if(car&&typeof car==='function'&&car().toy==='nitro'){ body=flashyPaint(0); dark=flashyPaint(0.5); }

  cx.fillStyle=PAL.shadow;
  cx.beginPath(); if(cx.ellipse) cx.ellipse(0,7,22,7,0,0,7); else cx.arc(0,7,18,0,7); cx.fill();

  /* headlight cone — opens up under boost, because speed should be felt */
  cx.fillStyle=boosting?'rgba(255,224,160,0.16)':'rgba(255,214,138,0.10)';
  const reach=boosting?250:165, spread=boosting?76:58;
  cx.beginPath(); cx.moveTo(18,-9); cx.lineTo(reach,-spread); cx.lineTo(reach,spread); cx.lineTo(18,9);
  cx.closePath(); cx.fill();

  /* the afterburner, sized by what this car actually has */
  if(boosting&&toy&&toy.flame>0){
    const f=toy.flame, wob=0.75+Math.random()*0.5;
    const len=(26+34*f)*wob;
    cx.fillStyle='rgba(255,150,60,0.55)';
    cx.beginPath(); cx.moveTo(-19,-7); cx.lineTo(-19-len,0); cx.lineTo(-19,7); cx.closePath(); cx.fill();
    cx.fillStyle='rgba(255,232,160,0.85)';
    cx.beginPath(); cx.moveTo(-19,-3.6); cx.lineTo(-19-len*0.55,0); cx.lineTo(-19,3.6); cx.closePath(); cx.fill();
    if(f>=1){
      cx.fillStyle='rgba(140,200,255,0.5)';
      cx.beginPath(); cx.moveTo(-19,-2); cx.lineTo(-19-len*0.3,0); cx.lineTo(-19,2); cx.closePath(); cx.fill();
    }
  }

  /* The Volt burns nothing, so it crackles instead. Same signal, no flame. */
  if(boosting&&toy&&toy.arc){
    cx.strokeStyle='rgba(120,235,255,0.85)'; cx.lineWidth=1.6;
    for(let i=0;i<3;i++){
      cx.beginPath(); cx.moveTo(-19,(Math.random()-0.5)*14);
      for(let s=1;s<=4;s++) cx.lineTo(-19-s*9,(Math.random()-0.5)*20);
      cx.stroke();
    }
    cx.fillStyle='rgba(120,235,255,0.20)';
    cx.beginPath(); cx.arc(-26,0,15,0,7); cx.fill();
  }

  cx.fillStyle=dark; cx.fillRect(-19,-12,38,24);
  cx.fillStyle=body; cx.fillRect(-19,-11,38,21);
  cx.fillStyle='rgba(255,255,255,0.16)'; cx.fillRect(-19,-11,38,4);
  cx.fillStyle='#151024'; cx.fillRect(-7,-9,13,18);            /* cabin */
  cx.fillStyle='#6FD6F2'; cx.fillRect(-5.5,-7.5,10,15);        /* glass */
  cx.fillStyle='#FFE7B0'; cx.fillRect(17,-9,4.5,6); cx.fillRect(17,3,4.5,6);
  cx.fillStyle='#C9354F'; cx.fillRect(-20,-9,3,5); cx.fillRect(-20,4,3,5);

  /* tyre smoke while the back end is out */
  if(sliding){
    for(let i=0;i<3;i++){
      const r=5+Math.random()*7;
      cx.fillStyle='rgba(220,214,235,'+(0.05+Math.random()*0.09).toFixed(3)+')';
      cx.beginPath(); cx.arc(-22-Math.random()*16,(Math.random()-0.5)*22,r,0,7); cx.fill();
    }
  }
}

/* The meter, drawn under the car in world space so it never needs a corner of
   the screen. Only while driving, and only for a car that has a toy. */
function drawBoostMeter(cx){
  if(typeof carToy!=='function') return;
  const toy=carToy();
  if(!toy||!P.driving||P.vt<0.9) return;
  const v=typeof boostMeter==='undefined'?1:boostMeter;
  const w=42, x=-w/2, y=20;
  cx.fillStyle='rgba(10,8,20,0.55)';
  cx.fillRect(x-1,y-1,w+2,5);
  const full=v>0.985;
  cx.fillStyle=(typeof boostOn!=='undefined'&&boostOn)?'#FFC46A':full?'#8FE07A':'#6FA8FF';
  cx.fillRect(x,y,w*v,3);
}

/* Getting in and out: the character shrinks toward the car, then the car appears.
   P.vt runs 0..1 and is driven in city.js. */
function drawPlayer(cx,phase){
  cx.save(); cx.translate(P.x,P.y);
  /* the meter is level with the world, not with the car's nose */
  drawBoostMeter(cx);
  cx.rotate(P.dir);
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

/* Clicking a building you are not standing at marks it rather than opening it:
   a ring at its door and a line from you to it. It answers "where is that" —
   which is the actual question behind the click — without moving you. */
function drawClickHint(cx){
  if(typeof clickHint==='undefined'||!clickHint) return;
  clickHint.t-=0.012;
  if(clickHint.t<=0){ clickHint=null; return; }
  const d=door(clickHint.b), a=clickHint.t;
  const k=typeof kindOf==='function'?kindOf(clickHint.b):{c:'#FFE7B0'};

  cx.save();
  cx.globalAlpha=a;
  cx.strokeStyle=k.c; cx.lineWidth=2.5;
  cx.beginPath(); cx.arc(d.x,d.y,26+(1-a)*26,0,7); cx.stroke();
  cx.globalAlpha=a*0.45;
  cx.setLineDash([7,7]); cx.lineWidth=2;
  cx.beginPath(); cx.moveTo(P.x,P.y); cx.lineTo(d.x,d.y); cx.stroke();
  cx.restore();
}

/* ---------- the minimap ----------
   Answers the three questions a newcomer actually has -- where am I, what is
   out there, and where can I not go yet -- without a word of text. Drawn in
   screen space at the end of the frame, on the same canvas, so it costs no DOM
   and cannot be knocked out of position by anything else on the page.

   Locked districts are not hidden. Seeing the shape of the city you cannot
   reach yet is most of the reason to want a car. */
const MM_W=214, MM_PAD=16;
const MM_H=Math.round(MM_W*(H/W));

function mmBox(VW,VH){
  const touch=document.body.classList.contains('touch');
  return {x:VW-MM_W-MM_PAD, y:VH-MM_H-(touch?128:MM_PAD), w:MM_W, h:MM_H};
}

function drawMinimap(cx,VW,VH){
  if(VW<520||VH<420) return;              /* no room: the game matters more */
  const m=mmBox(VW,VH);
  const sx=m.w/W, sy=m.h/H;
  const px=v=>m.x+v*sx, py=v=>m.y+v*sy;

  cx.save();

  /* frame */
  cx.fillStyle='rgba(10,8,20,0.72)';
  cx.fillRect(m.x-3,m.y-3,m.w+6,m.h+6);
  cx.strokeStyle='rgba(247,242,231,0.16)'; cx.lineWidth=1;
  cx.strokeRect(m.x-3.5,m.y-3.5,m.w+7,m.h+7);

  /* districts: the ones you cannot enter read as unlit ground */
  for(const d of DISTRICTS){
    const open=districtOpen(d);
    cx.fillStyle=open?'#241E3A':'#15121F';
    cx.fillRect(px(d.x0),m.y,(d.x1-d.x0)*sx,m.h);
    if(!open){
      /* a diagonal hatch says closed without saying "closed" */
      cx.save();
      cx.beginPath(); cx.rect(px(d.x0),m.y,(d.x1-d.x0)*sx,m.h); cx.clip();
      cx.strokeStyle='rgba(247,242,231,0.07)'; cx.lineWidth=1;
      for(let i=-m.h;i<(d.x1-d.x0)*sx;i+=7){
        cx.beginPath(); cx.moveTo(px(d.x0)+i,m.y+m.h); cx.lineTo(px(d.x0)+i+m.h,m.y); cx.stroke();
      }
      cx.restore();
    }
    cx.strokeStyle='rgba(247,242,231,0.10)'; cx.lineWidth=1;
    cx.beginPath(); cx.moveTo(px(d.x1),m.y); cx.lineTo(px(d.x1),m.y+m.h); cx.stroke();
  }

  /* roads, so the routes between places are visible as routes */
  cx.fillStyle='rgba(247,242,231,0.13)';
  for(const r of ROADS) cx.fillRect(px(r.x),py(r.y),Math.max(1,r.w*sx),Math.max(1,r.h*sy));

  /* every building, in its kind colour */
  for(const b of B){
    const open=districtOpen(districtAt(b.x));
    const k=kindOf(b);
    const d=door(b);
    const x=px(d.x), y=py(b.y+b.h/2);
    cx.fillStyle='rgba(0,0,0,0.5)';
    cx.beginPath(); cx.arc(x,y+1,4.2,0,7); cx.fill();
    cx.fillStyle=open?k.c:'rgba(120,112,140,0.55)';
    cx.beginPath(); cx.arc(x,y,3.4,0,7); cx.fill();
  }

  /* other players, if the online layer is running */
  if(typeof window.livePeers==='function'){
    try{
      for(const [,p] of window.livePeers()){
        cx.fillStyle='#8FA3FF';
        cx.beginPath(); cx.arc(px(p.x),py(p.y),2.4,0,7); cx.fill();
      }
    }catch(e){}
  }

  /* you: a triangle, pointing where you are pointing */
  const ux=px(P.x), uy=py(P.y);
  cx.fillStyle='rgba(255,231,176,0.30)';
  cx.beginPath(); cx.arc(ux,uy,7,0,7); cx.fill();
  cx.save();
  cx.translate(ux,uy); cx.rotate(P.dir);
  cx.fillStyle='#FFF3D6';
  cx.beginPath(); cx.moveTo(6,0); cx.lineTo(-4,3.6); cx.lineTo(-4,-3.6); cx.closePath(); cx.fill();
  cx.restore();

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
      cx.fillStyle=(typeof CAR_BODY!=='undefined'&&CAR_BODY[carTier])||'#E8574B';
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
