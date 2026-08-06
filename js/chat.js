/* ==================== CHAT ====================
   Players talking to each other, in the bottom-left corner of the city.

   UI ONLY. The socket, the wire format, the rate limit and the profanity filter
   all live in js/live.js — this file calls window.liveSay() and listens for the
   'alphalife:chat' event. One connection, one place that knows the protocol.

   ADDITIVE, like the rest of the online layer. If js/config.js is missing or
   live.js bailed out, nothing here is built: no panel, no listener, no key
   binding, and the game is exactly as it was.

   Loaded last, after js/live.js. */

(function(){
  'use strict';

  if(typeof onlineReady !== 'function' || !onlineReady()) return;
  if(typeof window.liveSay !== 'function') return;   /* live.js stood down */

  const MAX_LINES = 7;      /* what is kept on screen */
  const FADE_MS   = 45000;  /* quiet chat gets out of the way on its own */
  const MAXLEN    = 140;

  let box = null, log = null, input = null, hint = null;
  let fadeTimer = null;

  /* ---------- styles ---------- */
  function injectCSS(){
    if(document.getElementById('chatCSS')) return;
    const s = document.createElement('style');
    s.id = 'chatCSS';
    s.textContent = `
      /* Below .ov (50) so a room screen covers it, above the city. */
      #chat{position:fixed;left:18px;bottom:18px;z-index:46;width:300px;
        max-width:min(300px,calc(100vw - 36px));display:flex;flex-direction:column;
        gap:6px;pointer-events:none;transition:opacity .4s}
      #chat.dim{opacity:.32}
      #chat:hover,#chat.hot{opacity:1}

      #chatLog{display:flex;flex-direction:column;gap:3px;
        max-height:150px;overflow:hidden;justify-content:flex-end}
      #chatLog .cmsg{background:#0D0A16B8;border-left:2px solid #4A3E75;
        border-radius:0 3px 3px 0;padding:4px 8px;font-size:12px;line-height:1.4;
        color:var(--hud-ink);word-break:break-word;
        animation:chatIn .22s cubic-bezier(.2,.9,.3,1) both}
      #chatLog .cmsg b{color:#8FA3FF;font-weight:600;margin-right:5px}
      #chatLog .cmsg.me{border-left-color:var(--amber)}
      #chatLog .cmsg.me b{color:var(--amber)}
      #chatLog .cmsg.sys{border-left-color:#4A3E75;color:var(--hud-dim);
        font-family:var(--mono);font-size:10px;letter-spacing:.06em}
      @keyframes chatIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

      #chatBar{display:flex;align-items:center;gap:6px;pointer-events:auto}
      #chatIn{flex:1;min-width:0;background:#0D0A16D9;border:1px solid #F7F2E72E;
        border-radius:3px;color:var(--hud-ink);font-family:var(--sans);
        font-size:12px;padding:6px 9px;outline:none;transition:.15s}
      #chatIn::placeholder{color:var(--hud-dim);opacity:.75}
      #chatIn:focus{border-color:#8FA3FF88;background:#0D0A16F2}
      #chatHint{font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;
        text-transform:uppercase;color:var(--hud-dim);white-space:nowrap;
        pointer-events:none;opacity:.8}

      /* The encounter notice owns this corner too. The chat moves, not the
         notice: the notice is declared in index.html and styled from
         css/game.css, and restyling it from here did not take — the rule
         matched and simply had no effect, as did an inline style. Whatever
         that is, it is not worth a workaround when moving our own element is
         both simpler and verifiable. The chat is built here, so it obeys. */
      #chat.pushed{bottom:88px}
      /* On touch the joystick owns the corner outright, so move up past it. */
      body.touch #chat{bottom:150px;left:calc(18px + env(safe-area-inset-left))}
      body.touch #chat.pushed{bottom:220px}
      @media (max-width:560px){
        #chat{width:calc(100vw - 36px)}
        #chatLog{max-height:104px}
      }`;
    document.head.appendChild(s);
  }

  /* ---------- build ---------- */
  function build(){
    if(box) return;
    injectCSS();

    box = document.createElement('div');
    box.id = 'chat';
    box.innerHTML =
      '<div id="chatLog"></div>' +
      '<div id="chatBar">' +
        '<input id="chatIn" maxlength="' + MAXLEN + '" autocomplete="off" ' +
          'spellcheck="false" placeholder="Say something…">' +
        '<span id="chatHint">T</span>' +
      '</div>';
    document.body.appendChild(box);
    document.body.classList.add('hasChat');

    log   = box.querySelector('#chatLog');
    input = box.querySelector('#chatIn');
    hint  = box.querySelector('#chatHint');

    /* The city reads every keydown on window and turns WASD into movement and
       `e` into "enter this building". While the field has focus its keys are
       swallowed on the way out — the event has already reached the input, so
       typing works, but city.js never sees it. Same trick as
       js/leaderboard.js bindField(); getting this wrong means typing "was"
       walks you into a wall. */
    ['keydown','keyup','keypress'].forEach(t =>
      input.addEventListener(t, e => e.stopPropagation()));

    input.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); say(); }
      else if(e.key === 'Escape'){ e.preventDefault(); input.blur(); }
    });
    input.addEventListener('focus', () => { box.classList.add('hot'); wake(); });
    input.addEventListener('blur',  () => { box.classList.remove('hot'); idle(); });

    /* T or / opens the chat. NOT Enter — Enter belongs to the city, where it
       walks you through the door you are standing at, and taking it here meant
       the game could not be entered at all while this file was loaded. A chat
       box is a guest in someone else's keyboard; it does not get the key the
       host was already using. */
    addEventListener('keydown', e => {
      if(e.key !== 't' && e.key !== 'T' && e.key !== '/') return;
      if(document.activeElement === input) return;
      if(isBusy()) return;
      e.preventDefault();
      e.stopPropagation();
      input.focus();
    }, true);
  }

  /* Anywhere the keyboard already belongs to something else. */
  function isBusy(){
    if(typeof inRoom !== 'undefined' && inRoom) return true;
    if(typeof gameOver !== 'undefined' && gameOver) return true;
    if(typeof splashDone !== 'undefined' && !splashDone) return true;
    const a = document.activeElement;
    if(a && a !== input && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return true;
    /* the leaderboard's own overlay, name entry included */
    const lb = document.getElementById('lbOv');
    if(lb && lb.classList.contains('on') && !lb.classList.contains('lbSide')) return true;
    return false;
  }

  /* ---------- fade ---------- */
  function wake(){
    if(!box) return;
    box.classList.remove('dim');
    clearTimeout(fadeTimer);
  }
  function idle(){
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
      if(box && document.activeElement !== input) box.classList.add('dim');
    }, FADE_MS);
  }

  /* ---------- messages ---------- */
  function line(name, text, kind){
    if(!log) return;
    const el = document.createElement('div');
    el.className = 'cmsg' + (kind ? ' ' + kind : '');
    if(name){
      const b = document.createElement('b');
      b.textContent = name;          /* textContent: never parse a remote name */
      el.appendChild(b);
    }
    el.appendChild(document.createTextNode(text));
    log.appendChild(el);
    while(log.children.length > MAX_LINES) log.removeChild(log.firstChild);
    wake(); idle();
  }

  function say(){
    const text = input.value;
    if(!text.trim()) return;
    const res = window.liveSay(text);
    if(res && res.ok){ input.value = ''; return; }
    /* Rejected: rate limit, no name, not connected, or the filter. Say why
       rather than swallowing it — a message that vanishes reads as a bug. */
    if(res && res.why) line(null, res.why, 'sys');
    if(res && res.why === 'Pick a name first.' &&
       typeof window.openNameEntry === 'function'){
      input.blur();
      window.openNameEntry();
    }
  }

  /* ---------- wiring ---------- */
  addEventListener('alphalife:chat', ev => {
    const d = ev && ev.detail;
    if(!d) return;
    build();
    line(d.name, d.text, d.self ? 'me' : '');
  });

  /* Step aside while a street encounter is showing, and drop back when it
     fades. Watching the notice's own class is enough — js/activities.js toggles
     `on` and nothing else moves it. */
  function watchEncNote(){
    const note = document.getElementById('encNote');
    if(!note || typeof MutationObserver !== 'function') return;
    const sync = () => {
      if(box) box.classList.toggle('pushed', note.classList.contains('on'));
    };
    new MutationObserver(sync).observe(note, {attributes:true, attributeFilter:['class']});
    sync();
  }

  build();
  watchEncNote();
  idle();

  /* Console handles. */
  window.chatSay = t => { build(); return window.liveSay(t); };
})();
