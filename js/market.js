/* ---------- office / market ---------- */
function roomOffice(){
  if(sessionsLeft<=0){
    $('sheet').innerHTML=`<div class="roomhd"><h2>ARDENT CAPITAL</h2><span class="sub">Desk closed</span>
      <button class="refbtn" id="refBtn">How scoring works</button></div>
      <p class="note">No sessions left this month. The market will be here. Go home and settle up.</p>
      <button class="btn ghost" id="out">Leave the office</button>`;
    $('refBtn').addEventListener('click',roomRef);
    $('out').addEventListener('click',leave);return;
  }
  pick=null;reason=null;locked=false;
  if(!instrumentUnlocked(instrumentById(instr))) instr='equity';
  if(!allowedSizes().includes(conv)) conv='std';
  const INST=instrumentById(instr);
  if(INST.extra&&!INST.extra.opts.some(o=>o.id===extraChoice)) extraChoice=INST.extra.opts[1].id;
  const s=scenarioAt(idx);
  s.rate=rateMoveFor(idx);
  const red = (focus<3 ? (focus<1?['m','l']:['m']) : []).filter(k=>!revealed.includes(k));
  const row=(l,v,c)=>`<div class="m ${c||''}"><span class="lbl">${l}</span><span class="val">${v}</span></div>`;
  $('sheet').innerHTML=`<div class="roomhd"><h2>ARDENT CAPITAL</h2>
      <span class="sub">Month ${month} \u00b7 session ${ROUNDS_PER_MONTH-sessionsLeft+1} of ${ROUNDS_PER_MONTH} \u00b7 ${s.sector}</span>
      <button class="refbtn" id="refBtn">How scoring works</button></div>
    ${tutPanel()}
    ${red.length?`<p class="note" style="color:var(--warn)">Focus ${focus}. You are reading these cards tired — ${red.length} metric${red.length>1?'s are':' is'} unreadable.${canResearch()?` Your home office can recover ${research===1?'one':research}: ${red.map(k=>`<button class="rsrch" data-m="${k}">Research ${k==='m'?'operating margin':'debt / EBITDA'}</button>`).join(' ')}`:''}</p>`:''}
    <p class="instask">${INST.id==='short'?'Pick the business you would <strong>not</strong> own — you are selling it.'
      :INST.id==='pairs'?'Pick the business you <strong>own</strong>. The other leg is sold short automatically.'
      :'Pick the better business.'}</p>
    <div class="cards">${['a','b'].map(k=>{const c=s[k];return `
      <button class="co" data-k="${k}" aria-pressed="false">
        <div class="tick">${c.t}</div><div class="desc">${c.d}</div>
        ${row('Revenue growth',c.g+'%')}
        ${row('Operating margin',red.includes('m')?'\u2014':c.m+'%',red.includes('m')?'redact':'')}
        ${row('Debt / EBITDA',red.includes('l')?'\u2014':c.l.toFixed(1)+'\u00d7',red.includes('l')?'redact':'')}
        ${row('P / E',c.p+'\u00d7')}
        ${owned.acct?row('Cash conversion',c.f+'%','extra'):row('Cash conversion','locked','locked')}
      </button>`}).join('')}</div>
    ${owned.term?`<div class="street"><b>Terminal \u00b7 street positioning</b>${s.street}</div>`:''}
    <div class="step"><div class="steplbl"><span>Instrument</span>
        <em>${unlockedInstruments().length} of ${INSTRUMENTS.length} desks open · ${xp} XP</em></div>
      <div class="grid5">${INSTRUMENTS.map(i=>{const open=instrumentUnlocked(i);
        return `<button class="rz inst" data-i="${i.id}" ${open?'':'disabled'}
          aria-pressed="${i.id===instr}"><b>${i.n}</b><small>${open?i.sub:i.xp+' XP'}</small></button>`;
      }).join('')}</div>
      <p class="instnote">${INST.teach}</p></div>
    ${INST.extra?`<div class="step"><div class="steplbl"><span>${INST.extra.label}</span><em>${INST.extra.hint}</em></div>
      ${INST.id==='bond'&&owned.credit?`<p class="instnote">Credit analysis: rates are set to move
        <strong>${s.rate>0?'+':''}${Math.round(s.rate*100)}bp</strong> over this period.</p>`:''}
      <div class="grid3">${INST.extra.opts.map(o=>`<button class="rz xo" data-x="${o.id}"
        aria-pressed="${o.id===extraChoice}"><b>${o.n}</b><small>${
          INST.id==='option'&&owned.deriv
            ? money(sizeBase()*CONV.find(c=>c.id===conv).pct*o.prem)+' premium · '+o.pay.toFixed(1)+'x'
            : o.s}</small></button>`).join('')}</div></div>`:''}
    <div class="step"><div class="steplbl"><span>${INST.id==='short'?'Which do you sell?':INST.id==='pairs'?'Which leg do you own?':'What drives your call?'}</span></div>
      <div class="grid4">${REASONS.map(r=>`<button class="rz" data-r="${r.id}" aria-pressed="false"><b>${r.name}</b><small>${r.hint}</small></button>`).join('')}</div></div>
    <div class="step"><div class="steplbl"><span>Position size</span><em>${arc===2?'Fund '+money(aum):'Portfolio '+money(port)}</em></div>
      <div class="grid4">${CONV.map(c=>{const ok=allowedSizes().includes(c.id);
        return `<button class="rz cv" data-c="${c.id}" ${ok?'':'disabled'} aria-pressed="${c.id===conv}"><b>${c.n}</b><small>${ok?money(sizeBase()*c.pct)+' at risk':job().n==='Fund founder'?'':'needs PM'}</small></button>`;}).join('')}</div></div>
    <button class="btn" id="go" disabled>Commit position</button>
    <div id="rev"></div>${statsHTML()}${sigHTML()}`;
  document.querySelectorAll('.co').forEach(el=>el.addEventListener('click',()=>{if(locked)return;
    pick=el.dataset.k;document.querySelectorAll('.co').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.k===pick)));sync();}));
  document.querySelectorAll('.rz[data-r]').forEach(el=>el.addEventListener('click',()=>{if(locked)return;
    reason=el.dataset.r;document.querySelectorAll('.rz[data-r]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.r===reason)));sync();}));
  document.querySelectorAll('.cv:not([disabled])').forEach(el=>el.addEventListener('click',()=>{if(locked)return;
    conv=el.dataset.c;document.querySelectorAll('.cv').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.c===conv)));}));
  document.querySelectorAll('.inst:not([disabled])').forEach(el=>el.addEventListener('click',()=>{
    if(locked)return; instr=el.dataset.i; roomOffice();}));
  document.querySelectorAll('.xo').forEach(el=>el.addEventListener('click',()=>{if(locked)return;
    extraChoice=el.dataset.x;
    document.querySelectorAll('.xo').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.x===extraChoice)));}));
  $('go').addEventListener('click',commit);
  $('refBtn').addEventListener('click',roomRef);
  document.querySelectorAll('.rsrch').forEach(el=>el.addEventListener('click',()=>{
    if(doResearch(el.dataset.m)){toast('Recovered from your own notes.');roomOffice();}
  }));
  tutBind();
}
function sizeBase(){return arc===2?aum:port;}
function sync(){$('go').disabled=!(pick&&reason);}
function sigHTML(){
  const c=(q,t)=>`<div class="gq" data-q="${q}"><span class="n">${quad[q]}</span><div class="t">${t}</div></div>`;
  return `<section class="sig"><div class="steplbl"><span>Decision quality</span><em>Process scored separately from money</em></div>
    <div class="grid2"><div class="gh"></div><div class="gh">Made money</div><div class="gh">Lost money</div>
    <div class="gh">Sound</div>${c('gpgo','Right call, rewarded')}${c('gpbo','Right call, market disagreed')}
    <div class="gh">Unsound</div>${c('bpgo','Wrong call, got lucky')}${c('bpbo','Wrong call, punished')}</div></section>`;
}

function commit(){
  if(locked||!pick||!reason)return;locked=true;
  const s=scenarioAt(idx);
  s.rate=rateMoveFor(idx);
  const INST=instrumentById(instr);
  const choice={pick,reason,dur:extraChoice,strike:extraChoice};
  const sound=INST.sound(s,choice);
  const res=INST.settle(s,choice);
  const won=res.won;
  const size=sizeBase()*CONV.find(c=>c.id===conv).pct;
  const delta=size*res.mult;
  if(arc===2){
    /* the fund takes the position; the personal stake rides at the same return */
    const r=aum>0?delta/aum:0;
    aum+=delta; monthPnl+=delta; port+=port*r;
  }else{
    port+=delta; monthPnl+=delta;
  }
  peak=Math.max(peak,port);maxDD=Math.max(maxDD,(peak-port)/peak);
  if(sound){xp+=100;streak++;best=Math.max(best,streak);}else streak=0;
  repFromCall(sound);
  focus=Math.max(0,focus-focusDecay());
  const q=sound?(won?'gpgo':'gpbo'):(won?'bpgo':'bpbo');quad[q]++;
  const QN={gpgo:'Sound process, good outcome',gpbo:'Sound process, bad outcome',
    bpgo:'Unsound process, good outcome',bpbo:'Unsound process, bad outcome'};
  const rN=REASONS.find(r=>r.id===reason).name,dN=REASONS.find(r=>r.id===s.driver).name;
  $('go').style.display='none';
  const rb=$('refBtn'); if(rb) rb.style.display='none';
  $('rev').innerHTML=`<div class="reveal"><div class="rvtop">
      <div class="chip"><span class="k">Position result</span>
        <span class="v" style="color:${won?'var(--gain)':'var(--loss)'}">${won?'+':''}${money(delta)}</span>
        <div class="d">${arc===2?'Fund '+money(aum):'Portfolio '+money(port)}</div></div>
      <div class="chip"><span class="k">Process</span>
        <span class="v" style="color:${sound?'var(--process)':'var(--ink-3)'}">${sound?'Sound':'Unsound'}</span>
        <div class="d">${sound?'+100 XP':(INST.id==='short'?(pick!==s.better?'Right name, wrong reason — you said '+rN+', it was '+dN:'You sold the better business'):(pick===s.better?'Right name, wrong reason — you said '+rN+', it was '+dN:'Wrong name'))}</div></div>
      <div class="chip"><span class="k">Streak</span><span class="v">${streak}</span>
        <div class="d">${sound?'Extended':'Reset'}</div></div></div>
    <div class="rvb"><h4>${s[s.market].t} outperformed \u00b7 the call was ${s[s.better].t} on ${dN.toLowerCase()}</h4>
      <p class="settle"><b>${INST.n}</b> ${res.line}</p>
      <p>${s.why}</p>${s.twist?`<p class="twist">${s.twist}</p>`:''}</div>
    <div class="qn">${QN[q]}</div></div>
    ${tutAfter()}
    <button class="btn" id="nx">Next</button>
    <button class="btn ghost" id="lv">Leave the office</button>`;
  idx++;sessionsLeft--;clearResearch();hud();
  $('nx').addEventListener('click',()=>{ if(sessionsLeft>0&&idx<S.length) roomOffice(); else roomOffice(); $('ov').scrollTop=0;});
  $('lv').addEventListener('click',leave);
}
