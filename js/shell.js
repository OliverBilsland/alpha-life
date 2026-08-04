/* ==================== SHELL ====================
   Title screen, pause/resume, and lifecycle. Loads last, after persist.js, so
   it can tell a fresh run from a resumed one. Owns no game state. */

/* `splashDone` is declared in state.js and read directly by step(). Wrapping
   step() here instead would leak one frame of simulation, because boot.js
   schedules the first callback before this file runs. */

/* ---------- title ---------- */
function showSplash(){
  /* persist.js writes an initial save on a fresh boot, so re-reading storage here
     would always look like a resume. `saved` is its own load result. */
  const resumed=!!saved;
  const btn=$('splashBtn'), foot=$('splashFoot');
  btn.textContent=resumed?'Continue':'Start New Life';
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

/* ---------- lifecycle ----------
   The game does NOT pause when you click away. Losing focus only triggers a
   save, so a run keeps going in the background and comes back exactly as it
   was.

   Safe because saving never depended on pausing: persist.js saves on
   visibilitychange, pagehide and blur, on every hud() call, and on a position
   poll. And payday double-charging is prevented by persist.js restoring INTO
   the payday screen when inRoom==='payday' -- also nothing to do with pause. */
addEventListener('blur',()=>{try{save();}catch(e){}});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){try{save();}catch(e){}}
});
bindHudTerms();
showSplash();
