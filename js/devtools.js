/* ==================== DEV TOOLS — LOCAL ONLY ====================
   A testing aid, not a game system. It grants cash on demand so purchases and
   the economy can be exercised without grinding for them.

   THE BOUNDARY, and why it is drawn here:

   This file may touch exactly one piece of state — `cash` — and may call
   `hud()` to repaint and persist it. That is the whole contract.

   It must never write to a leaderboard, a shared backend, or any network
   surface. Today that is trivially true because the game has none (SHIP.md:
   "no network access at runtime"), but the rule is written down so it survives
   the day multiplayer lands: a cheat that can reach the shared standings is a
   cheat that invalidates them. There is deliberately no fetch/XHR/WebSocket/
   sendBeacon call anywhere below, and nothing here may be called from a
   submit path.

   It must not touch process-vs-outcome scoring or economy balance either.
   `quad`, `xp`, `streak`, `recent` and the soundness record are untouched, and
   so are `peak`/`maxDD` — those track `port`, not `cash` (market.js:137), so a
   grant cannot flatter a drawdown. The one number a grant does move is the
   end-screen net worth, which is `port+cash+homeEquity()-debt` (econ.js) and is
   an outcome figure by definition.

   OFF BY DEFAULT. Nothing below runs, and no key is bound, until the build is
   armed — see `armed()`. A player who never types `#dev` cannot reach it.

   TO REMOVE BEFORE RELEASE: delete the one `<script src="js/devtools.js">`
   line from index.html. This file is entirely self-contained — its own DOM
   node, its own styles, its own storage keys — so nothing else needs editing
   and nothing else references it. */

(function(){
  'use strict';

  var ARM_KEY    = 'alphalife.dev';          /* 'on' once armed, so the hash isn't needed again */
  var TAINT_KEY  = 'alphalife.dev.tainted';  /* '1' once cash has ever been granted on this device */
  var CASH_CAP   = 1e12;                     /* keeps money()/toLocaleString and the save sane */

  /* ---------- arming ----------
     Two ways in, both deliberate: `#dev` (or `?dev`) in the URL arms and then
     remembers, so day-to-day testing is just Ctrl+Shift+D. Neither is
     reachable by normal play. */
  function armedByUrl(){
    return /(^|[#?&])dev(=1|=on)?($|[#?&])/.test(location.hash + location.search);
  }
  function stored(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function store(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function drop(k){ try{ localStorage.removeItem(k); }catch(e){} }

  if(armedByUrl()) store(ARM_KEY,'on');
  function armed(){ return stored(ARM_KEY)==='on'; }

  if(!armed()) return;   /* <-- the off-by-default gate: no panel, no key binding, no listeners */

  /* ---------- amount parsing ----------
     Accepts 50000, 50,000, $50,000 and 50k, because typing the first one
     forty times is how test sessions get abandoned. */
  function parseAmount(raw){
    var s = String(raw==null?'':raw).trim().toLowerCase().replace(/[$,\s]/g,'');
    if(!s) return null;
    var mult = 1;
    if(/[km]$/.test(s)){ mult = s.slice(-1)==='k' ? 1e3 : 1e6; s = s.slice(0,-1); }
    if(!/^-?\d*\.?\d+$/.test(s)) return null;
    var n = parseFloat(s) * mult;
    if(!isFinite(n)) return null;
    return Math.round(n);
  }

  /* ---------- the one mutation ----------
     Every path that changes money goes through here, so the clamp, the taint
     mark and the repaint can't be forgotten by a future edit. */
  function setCash(next, note){
    if(!isFinite(next)) return;
    cash = Math.max(0, Math.min(CASH_CAP, Math.round(next)));
    store(TAINT_KEY,'1');   /* this save is no longer a clean run — see note in ARCHITECTURE.md */
    hud();                  /* repaints the HUD and, via persist.js's wrapper, saves */
    if(typeof toast==='function') toast(note);
    paint();
  }

  function grant(raw){
    var n = parseAmount(raw);
    if(n===null){ flash('Enter an amount — 50000, 50k, $50,000'); return; }
    setCash(cash + n, (n<0?'Dev: removed ':'Dev: granted ') + money(Math.abs(n)));
  }
  function setTo(raw){
    var n = parseAmount(raw);
    if(n===null){ flash('Enter an amount — 50000, 50k, $50,000'); return; }
    setCash(n, 'Dev: cash set to ' + money(Math.max(0,n)));
  }

  /* ---------- panel ----------
     Its own node and its own inline styles rather than anything in game.css,
     so deleting the script tag leaves no orphaned CSS behind. The red border
     and the DEV label are the point: this must never be mistaken for game UI
     in a screenshot. */
  var panel, input, msg, open = false;

  function build(){
    panel = document.createElement('div');
    panel.id = 'devPanel';
    panel.setAttribute('style', [
      'position:fixed','right:12px','bottom:12px','z-index:99999',
      'width:224px','padding:10px 12px 12px','box-sizing:border-box',
      'background:#150d0d','border:1px solid #c0392b','border-radius:8px',
      'font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
      'color:#f2e6e6','box-shadow:0 8px 28px rgba(0,0,0,.55)','display:none'
    ].join(';'));

    panel.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<b style="color:#e8705f;letter-spacing:.08em">DEV · LOCAL ONLY</b>' +
        '<span id="devClose" title="Close (Ctrl+Shift+$)" ' +
              'style="cursor:pointer;padding:0 4px;color:#b98b86">×</span>' +
      '</div>' +
      '<input id="devAmt" type="text" inputmode="numeric" placeholder="50000" ' +
             'style="width:100%;box-sizing:border-box;padding:6px 8px;margin-bottom:6px;' +
             'background:#0c0707;border:1px solid #6b3b34;border-radius:4px;color:#fff;' +
             'font:inherit">' +
      '<div style="display:flex;gap:6px;margin-bottom:6px">' +
        '<button id="devGrant" style="flex:1;padding:6px 0;cursor:pointer;background:#2f7d4f;' +
                'border:0;border-radius:4px;color:#fff;font:inherit">Grant +</button>' +
        '<button id="devSet" style="flex:1;padding:6px 0;cursor:pointer;background:#3a4a6b;' +
                'border:0;border-radius:4px;color:#fff;font:inherit">Set =</button>' +
      '</div>' +
      '<div id="devMsg" style="min-height:15px;color:#b98b86"> </div>' +
      '<div style="margin-top:6px;padding-top:6px;border-top:1px solid #3a2422;color:#8d6b67">' +
        'Local cash only. Never sent anywhere.' +
        '<span id="devDisarm" style="display:block;margin-top:5px;cursor:pointer;text-decoration:underline">' +
        'Disarm dev tools</span>' +
      '</div>';

    document.body.appendChild(panel);
    input = panel.querySelector('#devAmt');
    msg   = panel.querySelector('#devMsg');

    panel.querySelector('#devGrant').addEventListener('click', function(){ grant(input.value); });
    panel.querySelector('#devSet').addEventListener('click',   function(){ setTo(input.value); });
    panel.querySelector('#devClose').addEventListener('click', function(){ toggle(false); });
    panel.querySelector('#devDisarm').addEventListener('click', disarm);

    /* city.js binds keydown/keyup on window and writes keys[e.key] for WASD,
       and preventDefaults the arrows. Without stopping the bubble here, typing
       "50000d" would walk the character across the city while the sim is
       running, and arrow keys wouldn't move the caret. Stopping at the panel
       keeps every keystroke inside it. */
    ['keydown','keyup','keypress'].forEach(function(type){
      panel.addEventListener(type, function(e){
        e.stopPropagation();
        if(type==='keydown' && e.key==='Enter'){ grant(input.value); }
        if(type==='keydown' && e.key==='Escape'){ toggle(false); }
      });
    });
  }

  function flash(t){ if(msg) msg.textContent = t; }
  function paint(){ if(msg) msg.textContent = 'cash now ' + money(cash); }

  function toggle(next){
    if(!panel) build();
    open = (next===undefined) ? !open : !!next;
    panel.style.display = open ? 'block' : 'none';
    if(open){ paint(); input.focus(); input.select(); }
  }

  function disarm(){
    drop(ARM_KEY);
    if(panel && panel.parentNode) panel.parentNode.removeChild(panel);
    if(typeof toast==='function') toast('Dev tools disarmed — reload with #dev to re-arm');
  }

  /* ---------- trigger ----------
     Ctrl+Shift+$ (Ctrl+Shift+4). Capture phase so it lands before city.js's
     window handler, and no plain key is involved, so nothing a player presses
     in normal play can reach it.

     Why this chord and not Ctrl+Shift+D: D is Chrome's "bookmark all tabs",
     and a browser-level shortcut is consumed before the page ever sees the
     event — a page cannot preventDefault its way out of one. Ctrl+Shift+4 is
     unclaimed on Chrome/Windows, and $ is the obvious mnemonic. Deliberately
     NOT accepting metaKey: Cmd+Shift+4 is the macOS screenshot shortcut.

     Matched on e.code, not e.key, because with Shift held e.key is '$' on a US
     layout and something else entirely on others. */
  addEventListener('keydown', function(e){
    if(e.ctrlKey && e.shiftKey && !e.altKey && e.code==='Digit4'){
      e.preventDefault(); e.stopPropagation();
      toggle();
    }
  }, true);

  /* A small console handle, for when a panel is more friction than the task
     deserves. Same single mutation path, same boundary. */
  window.DEV = {
    grant:   grant,
    set:     setTo,
    cash:    function(){ return cash; },
    panel:   toggle,
    disarm:  disarm,
    tainted: function(){ return stored(TAINT_KEY)==='1'; }
  };

  console.log('%cDEV TOOLS ARMED','color:#e8705f;font-weight:bold',
              '— Ctrl+Shift+$ for the panel, or DEV.grant(50000). Local cash only.');
})();
