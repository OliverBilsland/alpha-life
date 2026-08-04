/* ==================== SHELL ====================
   Title screen, pause/resume, and lifecycle. Loads last, after persist.js, so
   it can tell a fresh run from a resumed one. Owns no game state. */

/* `paused` and `splashDone` are declared in state.js and read directly by step().
   Wrapping step() here instead would leak one frame of simulation, because
   boot.js schedules the first callback before this file runs. */

/* ---------- title ---------- */
function showSplash(){
  /* persist.js writes an initial save on a fresh boot, so re-reading storage here
     would always look like a resume. `saved` is its own load result. */
  const resumed=!!saved;
  const btn=$('splashBtn'), foot=$('splashFoot');
  btn.textContent=resumed?'Continue':'Begin';
  if(resumed){
    foot.textContent=arc===2
      ? `Fund open · month ${month} of ${ARC2_END_MONTH} · ${money(aum)} under management`
      : `Month ${month} of ${MONTHS} · ${sessionsLeft} session${sessionsLeft===1?'':'s'} left · ${money(port)}`;
  }else{
    foot.textContent='WASD or arrows to move · walk to a door and press E';
  }
  btn.addEventListener('click',dismissSplash);
}
function dismissSplash(){
  if(splashDone) return;
  splashDone=true;
  $('splash').classList.remove('on');
  save();
}

/* ---------- pause ---------- */
function pauseGame(){
  if(paused||!splashDone||gameOver) return;
  paused=true; save();
  $('pauseSub').textContent=inRoom?'Progress saved':'Progress saved · the city is where you left it';
  $('pause').classList.add('on');
}
function resumeGame(){
  if(!paused) return;
  paused=false;
  $('pause').classList.remove('on');
}

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden') pauseGame();
  /* rooms are static, so returning to one needs no acknowledgement */
  else if(inRoom) resumeGame();
});
addEventListener('blur',()=>{try{save();}catch(e){}});
addEventListener('pagehide',pauseGame);

$('pauseBtn').addEventListener('click',resumeGame);
showSplash();
