/* ==================== THE CIRCUIT ====================
   A racetrack along the bottom of the city, with lap timing.

   WHERE, AND WHY THERE. The strip below the last road (y 1940-2400) was empty,
   and it spans Old Town and Midtown -- the two districts that need no car. So
   the circuit is reachable from the first minute of a new game, on foot if you
   like, rather than being another thing locked behind the ladder.

   WHAT IT IS NOT. It pays nothing. No cash, no process, no reputation, no
   effect on the market or the leaderboard. It is the one part of this game that
   is only a game, and keeping it that way is deliberate: the moment a lap time
   pays out, it stops being a break from the scoring and becomes more scoring.

   The best lap is kept in its own localStorage key rather than in the save, so
   it survives New Game -- a personal best belongs to the player, not to a run.

   Loaded after js/world.js (needs W/H), before js/city.js calls into it. */

const TRACK_W   = 68;          /* asphalt width */
const TRACK_KEY = 'alphalife.bestlap';

/* Centreline, clockwise, closed. Deliberately not an oval: two long straights
   to use the boost on, a tightening right that punishes carrying too much
   speed, and a kink that rewards the Halden's turn-in. */
/* Kept inside y 1982..2342: below that the world edge blocks at 2384, and half
   the asphalt plus a margin has to fit, or the outside line of the last corner
   runs into an invisible wall. */
const TRACK=[
  [430,2035],[820,2010],[1250,2020],[1560,2055],[1800,2108],
  [1930,2180],[1900,2262],[1700,2308],[1330,2320],[980,2302],
  [720,2314],[430,2298],[250,2238],[212,2148],[268,2072]
];

/* ---------- geometry ----------
   Segment lengths are precomputed once: the lap logic asks "how far round am
   I" on every frame, and that answer must not cost a square root per segment
   per frame more than it already does. */
const TRACK_SEG=[];
let TRACK_LEN=0;
(function(){
  for(let i=0;i<TRACK.length;i++){
    const a=TRACK[i], b=TRACK[(i+1)%TRACK.length];
    const dx=b[0]-a[0], dy=b[1]-a[1];
    const len=Math.hypot(dx,dy);
    TRACK_SEG.push({a,b,dx,dy,len,at:TRACK_LEN});
    TRACK_LEN+=len;
  }
})();

/* Distance to the centreline, and how far round the lap that point is (0..1).
   Returns null nowhere -- every point in the world has a nearest bit of track,
   which is what `dist` is for. */
function trackNearest(x,y){
  let best={d:Infinity,s:0};
  for(const sg of TRACK_SEG){
    const t=Math.max(0,Math.min(1,((x-sg.a[0])*sg.dx+(y-sg.a[1])*sg.dy)/(sg.len*sg.len||1)));
    const px=sg.a[0]+sg.dx*t, py=sg.a[1]+sg.dy*t;
    const d=Math.hypot(x-px,y-py);
    if(d<best.d) best={d,s:(sg.at+sg.len*t)/TRACK_LEN};
  }
  return best;
}
const onTrack=(x,y)=>trackNearest(x,y).d<TRACK_W*0.62;

/* ---------- lap state ----------
   Transient except the record. SECTORS must be passed in order, so cutting the
   infield or reversing over the line does not manufacture a lap. */
const SECTORS=6;
let raceLastSector=-1, raceSeen=[], raceStart=0, raceLap=0, raceLive=false;
let raceBest=null, raceLastLap=null, raceFlash=0;

(function(){
  try{ const v=parseFloat(localStorage.getItem(TRACK_KEY)); if(isFinite(v)) raceBest=v; }
  catch(e){}
})();

function raceSaveBest(ms){
  raceBest=ms;
  try{ localStorage.setItem(TRACK_KEY,String(Math.round(ms))); }catch(e){}
}

const lapText=ms=>{
  if(ms==null) return '--.---';
  const s=ms/1000;
  const m=Math.floor(s/60);
  const r=(s-m*60);
  return (m?m+':':'')+(m&&r<10?'0':'')+r.toFixed(3);
};

/* Called once a frame from simulate(). Does nothing at all when the player is
   not on the asphalt, which is almost always. */
function updateLap(){
  if(typeof P==='undefined') return;
  if(typeof inRoom!=='undefined'&&inRoom) return;
  if(typeof splashDone!=='undefined'&&!splashDone) return;

  const near=trackNearest(P.x,P.y);
  const on=near.d<TRACK_W*0.62;

  if(raceFlash>0) raceFlash-=0.011;

  if(!on){
    /* Leaving the circuit abandons the lap rather than pausing it -- a timer
       that waits while you drive to the shops is not a lap time. */
    if(raceLive&&near.d>TRACK_W*1.6){ raceLive=false; raceLastSector=-1; raceSeen=[]; }
    return;
  }

  const sector=Math.min(SECTORS-1,Math.floor(near.s*SECTORS));

  if(!raceLive){
    /* Start timing when you first cross into sector 0 going forwards. */
    if(sector===0){ raceLive=true; raceStart=Date.now(); raceSeen=[0]; raceLastSector=0; }
    return;
  }

  raceLap=Date.now()-raceStart;

  if(sector===raceLastSector) return;

  const next=(raceLastSector+1)%SECTORS;
  if(sector===next){
    raceLastSector=sector;
    if(sector===0){
      /* round the lap: every sector visited, in order */
      if(raceSeen.length>=SECTORS){
        const ms=Date.now()-raceStart;
        raceLastLap=ms; raceFlash=1;
        if(raceBest==null||ms<raceBest) raceSaveBest(ms);
      }
      raceStart=Date.now(); raceSeen=[0];
    }else if(!raceSeen.includes(sector)) raceSeen.push(sector);
  }else{
    /* wrong way, or a cut across the infield: void this lap and re-arm */
    raceLive=false; raceLastSector=-1; raceSeen=[];
  }
}

/* ---------- drawing ---------- */
function trackPath(cx){
  cx.beginPath();
  cx.moveTo(TRACK[0][0],TRACK[0][1]);
  for(let i=1;i<TRACK.length;i++) cx.lineTo(TRACK[i][0],TRACK[i][1]);
  cx.closePath();
}

function drawTrack(cx){
  cx.save();
  cx.lineJoin='round'; cx.lineCap='round';

  /* run-off, then kerb, then asphalt: three strokes of the same path */
  cx.strokeStyle='#2A2438'; cx.lineWidth=TRACK_W+34; trackPath(cx); cx.stroke();
  cx.strokeStyle='#C9354F'; cx.lineWidth=TRACK_W+12; trackPath(cx); cx.stroke();
  cx.strokeStyle='#EFE3C8'; cx.lineWidth=TRACK_W+6;  trackPath(cx); cx.stroke();
  cx.strokeStyle='#1E1B2C'; cx.lineWidth=TRACK_W;    trackPath(cx); cx.stroke();

  /* centre dashes */
  if(cx.setLineDash){
    cx.setLineDash([26,26]);
    cx.strokeStyle='rgba(247,242,231,0.22)'; cx.lineWidth=3;
    trackPath(cx); cx.stroke();
    cx.setLineDash([]);
  }

  /* start / finish, laid across the track at the first point */
  const a=TRACK[0], b=TRACK[1];
  const ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
  cx.save();
  cx.translate(a[0],a[1]); cx.rotate(ang);
  for(let i=0;i<8;i++){
    cx.fillStyle=(i%2)?'#F7F2E7':'#1A1526';
    cx.fillRect(-9,-TRACK_W/2+i*(TRACK_W/8),18,TRACK_W/8);
  }
  /* gantry legs */
  cx.fillStyle='#3B3358';
  cx.fillRect(-6,-TRACK_W/2-26,12,26);
  cx.fillRect(-6,TRACK_W/2,12,26);
  cx.restore();

  /* floodlights down the main straight */
  for(let i=0;i<4;i++){
    const t=0.06+i*0.055;
    const p=trackPointAt(t);
    cx.fillStyle='rgba(255,240,200,0.05)';
    cx.beginPath(); cx.arc(p[0],p[1]-54,86,0,7); cx.fill();
    cx.fillStyle='#4A4163'; cx.fillRect(p[0]-2,p[1]-96,4,44);
    cx.fillStyle='#FFE7B0'; cx.fillRect(p[0]-9,p[1]-102,18,7);
  }

  /* tyre stacks on the outside of the tight right */
  for(let i=0;i<7;i++){
    const p=trackPointAt(0.42+i*0.012);
    const n=trackNormalAt(0.42+i*0.012);
    const tx=p[0]+n[0]*(TRACK_W/2+26), ty=p[1]+n[1]*(TRACK_W/2+26);
    cx.fillStyle='#141220'; cx.beginPath(); cx.arc(tx,ty,9,0,7); cx.fill();
    cx.fillStyle='#2A2438'; cx.beginPath(); cx.arc(tx,ty,5,0,7); cx.fill();
  }

  cx.restore();
}

/* a point and an outward normal at lap fraction t */
function trackPointAt(t){
  const want=((t%1)+1)%1*TRACK_LEN;
  for(const sg of TRACK_SEG){
    if(want<=sg.at+sg.len){
      const k=(want-sg.at)/(sg.len||1);
      return [sg.a[0]+sg.dx*k, sg.a[1]+sg.dy*k];
    }
  }
  return TRACK[0];
}
function trackNormalAt(t){
  const want=((t%1)+1)%1*TRACK_LEN;
  for(const sg of TRACK_SEG){
    if(want<=sg.at+sg.len) return [sg.dy/(sg.len||1), -sg.dx/(sg.len||1)];
  }
  return [0,-1];
}

/* ---------- the timer ----------
   Screen space, top centre, and only while the circuit is under you. It is a
   toy: it does not get to occupy the HUD when you are working. */
function drawRaceHud(cx,VW,VH){
  if(typeof P==='undefined') return;
  const near=trackNearest(P.x,P.y);
  const close=near.d<TRACK_W*1.6;
  if(!close&&raceFlash<=0) return;

  const w=214, h=raceBest!=null?62:44, x=(VW-w)/2, y=74;
  cx.save();
  cx.fillStyle='rgba(10,8,20,0.78)';
  cx.fillRect(x,y,w,h);
  cx.strokeStyle=raceFlash>0?'rgba(255,224,160,'+raceFlash.toFixed(2)+')':'rgba(247,242,231,0.18)';
  cx.lineWidth=raceFlash>0?2.5:1;
  cx.strokeRect(x+0.5,y+0.5,w-1,h-1);

  cx.textAlign='left';
  cx.font='600 10px '+CANVAS_MONO;
  cx.fillStyle='#A99CC4';
  cx.fillText(raceLive?'LAP':'CROSS THE LINE TO START',x+12,y+17);

  cx.textAlign='right';
  cx.font='700 22px '+CANVAS_COND;
  cx.fillStyle=raceLive?'#F7F2E7':'#6E6683';
  cx.fillText(lapText(raceLive?raceLap:null),x+w-12,y+24);

  if(raceBest!=null){
    cx.textAlign='left';
    cx.font='600 10px '+CANVAS_MONO;
    cx.fillStyle='#A99CC4'; cx.fillText('BEST',x+12,y+45);
    cx.textAlign='right';
    cx.font='700 16px '+CANVAS_COND;
    cx.fillStyle='#8FE07A'; cx.fillText(lapText(raceBest),x+w-12,y+48);
  }

  if(raceFlash>0&&raceLastLap!=null){
    cx.textAlign='center';
    cx.font='700 13px '+CANVAS_COND;
    cx.fillStyle='rgba(255,224,160,'+Math.min(1,raceFlash).toFixed(2)+')';
    cx.fillText(raceLastLap===raceBest?'NEW BEST LAP':'LAP '+lapText(raceLastLap),x+w/2,y+h+18);
  }
  cx.restore();
}
