/* ==================== LEADERBOARD UI ====================
   The three online screens: name entry, submit, and the board itself.

   Additive by construction. It builds its own overlay rather than borrowing
   `#ov`/`#sheet`, so it can never collide with the room system, and it reaches
   the end screen by WRAPPING finish() the way persist.js and feel.js wrap
   hud() — no game file is edited. If the online layer is not configured, the
   entry points are simply not added and the game is untouched.

   Loaded after js/online.js. */

(function(){
  'use strict';

  let ov = null, sheet = null;

  /* ---------- styles ----------
     Injected at wiring time, not when the overlay is first opened: the title
     screen's Leaderboard button exists before any overlay does, and would
     otherwise render unstyled until something else opened one. */
  function injectCSS(){
    if(document.getElementById('lbCSS')) return;
    const s = document.createElement('style');
    s.id = 'lbCSS';
    s.textContent = `
      /* Above .ov (50) so it can sit over the end screen, below .splash (90). */
      #lbOv{z-index:80}
      #lbOv .lbRow{display:flex;align-items:baseline;gap:10px;padding:7px 0;
        border-bottom:1px solid var(--rule-2)}
      #lbOv .lbRow:last-child{border-bottom:none}
      #lbOv .lbPos{font-family:var(--mono);font-size:11px;color:var(--ink-3);
        width:26px;flex:none}
      #lbOv .lbName{flex:1;font-weight:500;overflow:hidden;text-overflow:ellipsis;
        white-space:nowrap}
      #lbOv .lbProc{font-family:var(--mono);font-size:12px;color:var(--process);
        font-weight:600}
      #lbOv .lbNet{font-family:var(--mono);font-size:11px;color:var(--ink-3);
        width:92px;text-align:right;flex:none}
      #lbOv .lbMe{background:#3B4FD80D;margin:0 -8px;padding-left:8px;padding-right:8px}
      #lbOv .lbErr{color:var(--loss);font-size:13px;min-height:19px;margin:6px 0 2px}
      #lbOv .lbIn{width:100%;font:inherit;font-size:16px;padding:10px 12px;
        border:1px solid var(--rule);border-radius:3px;background:var(--card);
        color:var(--ink);margin-top:4px}
      #lbOv .lbIn:focus{outline:none;border-color:var(--process)}
      #lbOv .lbBtns{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
      /* The in-game entry point. Borrows .st/.st b from the HUD so it sits in
         the pod as if it had always been there; only the states that .st has no
         vocabulary for are defined here. */
      #podOnline{position:relative}
      #hOnline.lbWord{font-size:11px;letter-spacing:.1em;font-family:var(--mono)}
      #hOnline.lbLive{color:#8FA3FF}
      #podOnline:active b{color:var(--amber)}
      /* A dot that only exists while someone else is actually in the city. */
      #podOnline.lbHas::after{content:'';position:absolute;top:1px;right:-7px;
        width:4px;height:4px;border-radius:50%;background:#8FA3FF;
        animation:lbPulse 2s ease-in-out infinite}
      @keyframes lbPulse{0%,100%{opacity:.35}50%{opacity:1}}`;
    document.head.appendChild(s);
  }

  /* ---------- overlay ---------- */
  function build(){
    injectCSS();
    ov = document.createElement('div');
    ov.className = 'ov'; ov.id = 'lbOv';
    ov.innerHTML = '<div class="sheet" id="lbSheet"></div>';
    document.body.appendChild(ov);
    sheet = ov.querySelector('#lbSheet');

    /* The game latches every keydown on window and reads `e` as "enter the
       building you are standing on". While this overlay is up, keys that are
       NOT going to one of its own fields are stopped in capture phase, so the
       player cannot walk into a room behind a screen they cannot see. Keys that
       ARE going to a field are left alone here and stopped on the way out
       instead — see bindField(). */
    addEventListener('keydown', e => {
      if(!isOpen()) return;
      if(e.key === 'Escape'){ e.stopPropagation(); close(); return; }
      if(!sheet.contains(e.target)) e.stopPropagation();
    }, true);
  }

  /* A field swallows its own keys in BUBBLE phase: the event has already
     reached the input, so typing works, but city.js never sees it. */
  function bindField(el){
    ['keydown','keyup','keypress'].forEach(t =>
      el.addEventListener(t, e => e.stopPropagation()));
  }

  const isOpen = () => ov && ov.classList.contains('on');
  function open(){ if(!ov) build(); ov.classList.add('on'); }
  function close(){ if(ov) ov.classList.remove('on'); }

  /* ---------- name entry ---------- */
  function openNameEntry(onSaved){
    open();
    const current = storedName();
    sheet.innerHTML =
      '<div class="roomhd"><h2>Your name on the board</h2>' +
        '<span class="sub">Shown to other players</span></div>' +
      '<p class="note">Three to sixteen characters. Letters, numbers and spaces.</p>' +
      '<input class="lbIn" id="lbName" maxlength="32" autocomplete="off" ' +
        'spellcheck="false" placeholder="e.g. Cassandra">' +
      '<div class="lbErr" id="lbErr"></div>' +
      '<div class="lbBtns">' +
        '<button class="btn" id="lbSave">Save</button>' +
        '<button class="btn" id="lbCancel">Not now</button>' +
      '</div>';

    const input = sheet.querySelector('#lbName');
    const err   = sheet.querySelector('#lbErr');
    bindField(input);
    input.value = current;
    setTimeout(() => { input.focus(); input.select(); }, 30);

    function save(){
      /* The entry-time half of "check on entry AND before it is shown". The
         submit path checks again independently — neither trusts the other. */
      const res = storeName(input.value);
      if(!res.ok){ err.textContent = res.why; input.focus(); return; }
      err.textContent = '';
      close();
      if(typeof toast === 'function') toast('Name set: ' + res.name);
      if(onSaved) onSaved(res.name);
    }
    sheet.querySelector('#lbSave').addEventListener('click', save);
    sheet.querySelector('#lbCancel').addEventListener('click', close);
    input.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); save(); }
    });
    /* Clear a stale error as soon as they start fixing it. */
    input.addEventListener('input', () => { err.textContent = ''; });
  }

  /* ---------- the board ---------- */
  async function openBoard(){
    open();
    sheet.innerHTML =
      '<div class="roomhd"><h2>Leaderboard</h2>' +
        '<span class="sub">Ranked by process</span></div>' +
      '<p class="note">Loading…</p>';

    const res = await fetchLeaderboard(LB_LIMIT);
    if(!isOpen()) return;              /* they closed it while we waited */

    if(!res.ok){
      sheet.innerHTML =
        '<div class="roomhd"><h2>Leaderboard</h2>' +
          '<span class="sub">Unavailable</span></div>' +
        '<p class="note">' + res.why + ' The game is unaffected — everything ' +
        'else works offline.</p>' +
        '<div class="lbBtns"><button class="btn" id="lbBack">Back</button></div>';
      sheet.querySelector('#lbBack').addEventListener('click', close);
      return;
    }

    const me = storedName();
    const rows = res.rows.length ? res.rows.map((r, i) => {
      /* escapeName(), not r.name — every interior here is innerHTML, and this
         string came off the network. */
      const mine = me && r.name === me;
      return '<div class="lbRow' + (mine ? ' lbMe' : '') + '">' +
        '<span class="lbPos">' + (i + 1) + '</span>' +
        '<span class="lbName">' + escapeName(r.name) + '</span>' +
        '<span class="lbProc">' + r.processScore + '/' + r.processTotal + '</span>' +
        '<span class="lbNet">' + money(r.netWorth) + '</span>' +
      '</div>';
    }).join('') : '<p class="note">No runs yet. Be the first.</p>';

    sheet.innerHTML =
      '<div class="roomhd"><h2>Leaderboard</h2>' +
        '<span class="sub">Ranked by process</span></div>' +
      '<p class="note">Sound decisions, not money. Net worth is shown because ' +
      'it is interesting, not because it is the score — a good number there ' +
      'with a bad one beside it mostly means a lucky streak.</p>' +
      '<div class="ledger" style="margin-top:6px">' +
        '<div class="lbRow" style="border-bottom:1px solid var(--rule)">' +
          '<span class="lbPos"></span><span class="lbName" ' +
          'style="font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;' +
          'color:var(--ink-3)">Player</span>' +
          '<span class="lbProc" style="font-size:10px;color:var(--ink-3)">PROCESS</span>' +
          '<span class="lbNet" style="font-size:10px">NET WORTH</span></div>' +
        rows +
      '</div>' +
      '<div class="lbBtns"><button class="btn" id="lbBack">Back</button></div>';
    sheet.querySelector('#lbBack').addEventListener('click', close);
  }

  /* ---------- submit, from the end screen ---------- */
  async function doSubmit(btn, status){
    const name = storedName();
    if(!name){ openNameEntry(() => doSubmit(btn, status)); return; }

    btn.disabled = true;
    status.textContent = 'Submitting…';
    const res = await submitRun(name);
    if(res.ok){
      status.textContent = 'Submitted as ' + name + '.';
      btn.textContent = 'Submitted';
    }else{
      status.textContent = res.why;
      btn.disabled = false;
    }
  }

  /* Appends the online controls to whatever finish() just rendered. finish()
     has three endings — normal, bankrupt and the arc-2 fund — and they all go
     through this one function, so wrapping it covers every one of them. */
  function decorateEndScreen(){
    const host = document.getElementById('sheet');
    if(!host || host.querySelector('#lbSubmitWrap')) return;

    const wrap = document.createElement('div');
    wrap.id = 'lbSubmitWrap';

    if(saveIsTainted()){
      /* The dev cheat's one hard boundary, stated plainly rather than hidden:
         the button is not offered at all, and it says why. */
      wrap.innerHTML =
        '<p class="note k">This save used the developer cash tool, so it ' +
        'cannot be submitted to the leaderboard.</p>' +
        '<div class="lbBtns"><button class="btn" id="lbViewBtn">View leaderboard</button></div>';
    }else{
      wrap.innerHTML =
        '<div class="lbErr" id="lbStatus" style="color:var(--ink-2)"></div>' +
        '<div class="lbBtns">' +
          '<button class="btn" id="lbSubmitBtn">Submit to leaderboard</button>' +
          '<button class="btn" id="lbViewBtn">View leaderboard</button>' +
          '<button class="btn" id="lbNameBtn">Change name</button>' +
        '</div>';
    }
    host.appendChild(wrap);

    const submitBtn = wrap.querySelector('#lbSubmitBtn');
    if(submitBtn) submitBtn.addEventListener('click', () =>
      doSubmit(submitBtn, wrap.querySelector('#lbStatus')));
    wrap.querySelector('#lbViewBtn').addEventListener('click', openBoard);
    const nameBtn = wrap.querySelector('#lbNameBtn');
    if(nameBtn) nameBtn.addEventListener('click', () => openNameEntry());
  }

  /* ---------- wiring ----------
     Nothing below runs unless the online layer is actually configured, so an
     unconfigured clone gets no new buttons and no new behaviour at all. */
  if(!onlineReady()) return;
  injectCSS();

  /* Wrap finish() rather than editing ledger.js. Loaded after persist.js, so
     this sits outside its autosave wrapper — the save still happens first. */
  if(typeof finish === 'function'){
    const _finishLb = finish;
    finish = function(){
      _finishLb.apply(null, arguments);
      try{ decorateEndScreen(); }catch(e){}
    };
  }

  /* ---------- the only way in: the HUD ----------
     There is deliberately no button on the title screen. The board belongs to
     the game, not to the menu in front of it — a title screen should get you
     into a run, and standings you have not set yet are not what you came to
     look at. It also could not be reached once a run started, which is the
     moment you actually want it.

     One HUD stat does both jobs: it opens the board, and it says how many
     people are in the city. It reads live.js through its public
     window.liveStatus() handle rather than reaching into it, and degrades to a
     plain leaderboard button if that file bailed out. Injected rather than
     written into index.html so it does not exist when online is switched off. */
  let hudTimer = null;

  function paintHud(){
    const el = document.getElementById('podOnline');
    const b  = document.getElementById('hOnline');
    if(!el || !b) return;

    /* Without a name you can see other players but never appear to them
       (js/live.js maybeSend), which is a confusing state to be in silently.
       Say so, and make the tap fix it. */
    if(!storedName()){
      b.textContent = 'SET NAME';
      b.className = 'lbWord warn';
      el.classList.remove('lbHas');
      el.title = 'You can see other players, but they cannot see you until you pick a name';
      return;
    }

    const st = (typeof window.liveStatus === 'function') ? window.liveStatus() : null;
    if(!st || !st.joined){
      b.textContent = st && st.gaveUp ? 'OFFLINE' : '—';
      b.className = 'lbWord';
      el.classList.remove('lbHas');
      el.title = 'Not connected to the city right now — tap for the leaderboard';
      return;
    }

    /* peers holds OTHER people, so showing it raw read "ONLINE 0" at the exact
       moment you were demonstrably online. Count yourself: connected and alone
       is one player in the city, not none. The dot and the colour still key off
       the others, because those are what mean "someone is out there". */
    const others = st.peers;
    b.textContent = String(others + 1);
    b.className = others > 0 ? 'lbLive' : '';
    el.classList.toggle('lbHas', others > 0);
    el.title = others === 0
      ? 'Just you in the city right now — tap for the leaderboard'
      : others === 1
        ? 'You and 1 other player in the city — tap for the leaderboard'
        : 'You and ' + others + ' other players in the city — tap for the leaderboard';
  }

  addEventListener('DOMContentLoaded', addHudEntry);
  addHudEntry();
  function addHudEntry(){
    if(document.getElementById('podOnline')) return;
    /* Anchor on #newBtn so this lands in the right-hand pod, before it. */
    const anchor = document.getElementById('newBtn');
    if(!anchor || !anchor.parentNode) return;

    injectCSS();
    const el = document.createElement('div');
    el.className = 'st tap';
    el.id = 'podOnline';
    el.innerHTML = 'ONLINE<b id="hOnline">—</b>';
    el.addEventListener('click', ev => {
      ev.stopPropagation();
      if(!storedName()){ openNameEntry(); return; }
      openBoard();
    });
    anchor.parentNode.insertBefore(el, anchor);

    /* One second is well below human patience and far above the cost of
       reading two integers; the peer map is swept every three. */
    if(!hudTimer) hudTimer = setInterval(paintHud, 1000);
    paintHud();
  }

  /* ---------- ask for a name on the way in ----------
     Immediately on entering the game, if there is not one yet — but not a
     moment before. The old version fired on a flat 420ms timer, which raced
     the title screen's own .32s fade and landed while it was still on screen,
     so it read as part of the loading sequence rather than as the game asking.

     Waiting for the fade to actually finish is the difference. transitionend
     on #splash is the real signal; the timer is only a fallback for the case
     where there is no transition to end (reduced motion, or a browser that
     skips it on a hidden tab).

     This hooks the button rather than wrapping dismissSplash(), because
     shell.js binds that function by reference before this file loads — a
     wrapper on the global would never be called.

     Not a wall: openNameEntry() closes on "Not now", and the HUD keeps saying
     SET NAME afterwards. */
  const splashBtn = document.getElementById('splashBtn');
  if(splashBtn) splashBtn.addEventListener('click', () => {
    if(storedName()) return;
    whenSplashGone(() => { if(!storedName() && !isOpen()) openNameEntry(); });
  });

  function whenSplashGone(fn){
    const sp = document.getElementById('splash');
    if(!sp){ fn(); return; }
    let fired = false;
    const go = () => {
      if(fired) return;
      fired = true;
      sp.removeEventListener('transitionend', go);
      clearTimeout(t);
      fn();
    };
    sp.addEventListener('transitionend', go);
    const t = setTimeout(go, 600);   /* .32s fade + slack */
  }

  /* Console handles, so the board can be opened without finishing a run. */
  window.openLeaderboard = openBoard;
  window.openNameEntry   = openNameEntry;
})();
