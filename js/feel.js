/* ==================== FEEL ====================
   Presentation only. Nothing here reads or writes game state except to notice
   that a displayed number changed. Loaded after ledger.js, before boot.js. */

/* ---------- a beat for the moments that deserve one ---------- */
let momentT;
function moment(big,small){
  const m=$('moment'); if(!m) return;
  m.innerHTML=`<div class="mbig">${big}</div><div class="msml">${small}</div>`;
  m.classList.remove('on'); void m.offsetWidth; m.classList.add('on');
  clearTimeout(momentT); momentT=setTimeout(()=>m.classList.remove('on'),2200);
}

/* ---------- pulse a HUD figure when it actually changes ---------- */
const _hudFeel=hud;
let hudSeen={};
hud=function(){
  _hudFeel.apply(null,arguments);
  const now={hPort:port,hCash:cash,hFocus:focus,hSess:sessionsLeft,hAum:aum};
  for(const id in now){
    const prev=hudSeen[id];
    if(prev!==undefined&&prev!==now[id]){
      const el=$(id);
      if(el){
        el.classList.remove('pulse','pdown');
        void el.offsetWidth;
        el.classList.add('pulse');
        if(now[id]<prev) el.classList.add('pdown');
      }
    }
    hudSeen[id]=now[id];
  }
};
