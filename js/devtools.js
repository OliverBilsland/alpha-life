/* ==================== DEV TOOLS — LOCAL ONLY ====================
   A hidden testing aid: grant yourself cash so purchases and the economy can be
   exercised without grinding. NOT part of the game.

   This file is deliberately self-contained — it injects its own styles, builds
   its own DOM, binds its own keys, and uses its own storage key. It is loaded
   LAST, after shell.js, and no game file references it.

   TO REMOVE FOR RELEASE: delete this file and its one <script> line in
   index.html. Nothing else in the repo knows it exists.
   TO DISABLE WITHOUT DELETING: set DEV_TOOLS_ARMED to false, one line below.

   ---------------------------------------------------------------------------
   LOCAL-ONLY BOUNDARY — the load-bearing property of this file.

   The panel mutates exactly one thing: `cash`, the player's own spendable
   money, in this tab, on this device. It then calls hud(), which persist.js has
   wrapped to write localStorage. localStorage is per-device and per-origin.

   It does NOT touch, and must never touch:
     - `port`, `xp`, `streak`, `quad`, `recent` — the process-vs-outcome scoring
       (DESIGN Rule 1). Granted cash buys things; it never makes a call sound.
     - WIN_R / LOSE_R / CONV / prices / payouts — the real economy balance.
     - any remote destination. This file performs no network calls of any kind.
       The whole app makes zero network requests and that is a release invariant
       (see SHIP.md §1) — keep it that way here.

   A leaderboard and live players now exist, so the older claim here — that
   granted cash has nowhere to leak to — is no longer true by itself, and this
   file now ships armed on the public deployment. ONE thing holds the line: the
   `alphalife.dev.tainted` flag written below marks the save as dev-modified,
   and js/online.js refuses to submit a tainted run. So a stranger who finds
   the chord can enrich their own game and cannot put the result on anybody
   else's leaderboard.

   What that does NOT cover, and should not be assumed to: the flag lives in
   localStorage, so anyone willing to clear one key can launder a cheated save
   back into a submittable one. It is an honest-player gate, not a security
   control, and it cannot be otherwise without a server that watches the whole
   run. Live positions and chat are unaffected either way — neither carries
   money.

   FOR A RELEASE BUILD, delete this file and its <script> line, per SHIP.md §4.
   That is the only reliable removal; a host check is not one, because
   Capacitor serves the app from localhost.
   =========================================================================== */

(function(){
  'use strict';

  /* Master switch. false = the chord does nothing and no DOM is created. */
  const DEV_TOOLS_ARMED = true;

  /* The panel is OFF by default: nothing is built or shown until the chord is
     pressed. The chord is a four-key combination (and uses e.code, so it is
     keyboard-layout independent) — a normal player will not stumble into it. */
  const CHORD = e =>
    (e.ctrlKey || e.metaKey) && e.shiftKey && e.altKey && e.code === 'KeyD';

  const TAINT_KEY = 'alphalife.dev.tainted';

  if(!DEV_TOOLS_ARMED) return;

  /* NO HOST CHECK, DELIBERATELY. There was one, restricting this to localhost
     and file://; it was removed on request so the panel is available on the
     deployed build too. Anyone who finds the chord on the public site can give
     themselves cash, and that is the accepted trade — see the boundary note in
     the header for what that does and does not reach.

     To take it out again, set DEV_TOOLS_ARMED above to false, which is one
     line and kills the chord, the DOM and the key listener together. */

  /* If the game somehow did not load, stay out of the way entirely. */
  if(typeof cash === 'undefined' || typeof hud !== 'function') return;

  let panel = null, cashOut = null, amtIn = null;

  /* ---------- styling: injected here so game.css stays untouched ---------- */
  function injectCSS(){
    const s = document.createElement('style');
    s.id = 'devToolsCSS';
    /* Deliberately unlike the game's paper/ink design system — this should
       never be mistaken for a real screen. */
    s.textContent = `
      /* Sits below the HUD row, so the CASH pod it changes stays visible. */
      #devPanel{position:fixed;top:68px;left:12px;z-index:9999;width:232px;
        background:#12001Bee;border:1px dashed #FF3DCB;border-radius:4px;
        padding:10px 11px 11px;color:#FFD9F5;
        font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
        font-size:11px;line-height:1.45;box-shadow:0 8px 30px #000A;
        backdrop-filter:blur(3px)}
      #devPanel h4{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;
        color:#FF3DCB;font-weight:700;margin-bottom:7px;display:flex;
        justify-content:space-between;align-items:center}
      #devPanel .dvNote{color:#B58AA8;font-size:9.5px;line-height:1.4;
        margin-top:8px;border-top:1px solid #FF3DCB33;padding-top:7px}
      #devPanel .dvCash{font-size:15px;color:#FFF;margin-bottom:8px;
        letter-spacing:.02em}
      #devPanel input{width:100%;background:#00000066;border:1px solid #FF3DCB66;
        color:#FFF;border-radius:3px;padding:6px 7px;font:inherit;font-size:12px;
        margin-bottom:6px}
      #devPanel input:focus{outline:none;border-color:#FF3DCB}
      #devPanel button{background:#FF3DCB1F;border:1px solid #FF3DCB66;
        color:#FFD9F5;border-radius:3px;padding:5px 7px;font:inherit;
        font-size:10px;cursor:pointer;transition:.12s}
      #devPanel button:hover{background:#FF3DCB33}
      #devPanel .dvRow{display:flex;gap:5px;margin-bottom:6px}
      #devPanel .dvRow button{flex:1}
      #devPanel .dvGrant{width:100%;padding:7px;font-size:11px;font-weight:700;
        letter-spacing:.06em}
      #devPanel .dvX{background:none;border:none;color:#FF3DCB;font-size:13px;
        padding:0 2px;line-height:1}`;
    document.head.appendChild(s);
  }

  /* ---------- the one mutation this file is allowed to make ---------- */
  function grant(amount){
    const n = Math.round(Number(amount));
    if(!isFinite(n) || n === 0){ flash('Enter a non-zero amount.'); return; }

    cash += n;                 /* local spendable money — nothing else */
    markTainted(n);
    hud();                     /* persist.js's wrapper saves to localStorage */

    flash((n > 0 ? 'Granted ' : 'Removed ') + money(Math.abs(n)) + ' (dev)');
    sync();
  }

  /* Marks this device's save as dev-modified. Its own storage key, so removing
     this file removes the feature completely and leaves no save-format trace. */
  function markTainted(n){
    try{
      const prev = JSON.parse(localStorage.getItem(TAINT_KEY) || '{}');
      localStorage.setItem(TAINT_KEY, JSON.stringify({
        tainted: true,
        totalGranted: (prev.totalGranted || 0) + n,
        grants: (prev.grants || 0) + 1
      }));
    }catch(e){}
  }

  function flash(msg){
    if(typeof toast === 'function') toast(msg);
  }

  function sync(){
    if(cashOut) cashOut.textContent = money(cash);
  }

  /* ---------- panel ---------- */
  function build(){
    injectCSS();
    panel = document.createElement('div');
    panel.id = 'devPanel';
    panel.innerHTML =
      '<h4>Dev · local only <button class="dvX" id="dvClose" ' +
        'title="Close (Ctrl+Shift+Alt+D)">&times;</button></h4>' +
      '<div class="dvCash" id="dvCash"></div>' +
      '<input id="dvAmt" type="number" step="1000" placeholder="Amount, e.g. 250000">' +
      '<button class="dvGrant" id="dvGrant">GRANT CASH</button>' +
      '<div class="dvRow">' +
        '<button data-amt="10000">+10k</button>' +
        '<button data-amt="100000">+100k</button>' +
        '<button data-amt="1000000">+1M</button>' +
      '</div>' +
      '<div class="dvNote">Adds to <b>cash</b> on this device only. Does not ' +
        'touch the portfolio, process scoring or prices. No network, no ' +
        'leaderboard.</div>';
    document.body.appendChild(panel);

    cashOut = panel.querySelector('#dvCash');
    amtIn   = panel.querySelector('#dvAmt');

    /* Buttons blur themselves after use, so they never sit focused holding on
       to the keyboard the player needs to drive away and go spend it. */
    panel.querySelector('#dvGrant').addEventListener('click', e => {
      e.currentTarget.blur(); grant(amtIn.value); });
    panel.querySelector('#dvClose').addEventListener('click', hide);
    panel.querySelectorAll('[data-amt]').forEach(b =>
      b.addEventListener('click', e => {
        e.currentTarget.blur(); grant(b.dataset.amt); }));

    /* Enter submits the grant instead of reaching the game's "enter a door". */
    amtIn.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); grant(amtIn.value); }
    });

    /* Clicks/taps inside the panel must not reach the city. */
    ['mousedown','pointerdown','touchstart','click'].forEach(t =>
      panel.addEventListener(t, e => e.stopPropagation()));

    /* Swallow keys typed into the AMOUNT FIELD on the way OUT, in bubble phase:
       the event has already reached the input (so typing and Enter work), but is
       stopped before city.js's window-level listener can latch it into `keys` or
       read it as "enter the building you are standing on".
       Scoped to the field, not the whole panel — otherwise a button left focused
       after a click would keep swallowing WASD and the car would not move. */
    ['keydown','keyup','keypress'].forEach(t =>
      amtIn.addEventListener(t, e => e.stopPropagation()));
  }

  function show(){
    if(!panel) build();
    panel.style.display = '';
    sync();
    amtIn.focus();
    amtIn.select();
  }
  function hide(){
    if(panel) panel.style.display = 'none';
    /* city.js latches keys on keydown; drop any that stuck while we had focus. */
    if(typeof keys === 'object' && keys) for(const k in keys) keys[k] = false;
  }
  const visible = () => panel && panel.style.display !== 'none';

  /* ---------- the chord ----------
     Capture phase on window so the combination is caught wherever focus is,
     including inside the panel's own input. Keys merely *typed* into the panel
     are handled separately, in bubble phase on the panel (see build()).
     The game itself is never paused while the panel is open — see shell.js. */
  addEventListener('keydown', e => {
    if(!CHORD(e)) return;
    e.preventDefault(); e.stopPropagation();
    visible() ? hide() : show();
  }, true);
})();
