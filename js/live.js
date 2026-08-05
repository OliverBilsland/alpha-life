/* ==================== LIVE PLAYERS ====================
   Other people, moving around the same city, with their names above them.

   Supabase Realtime over a plain WebSocket. Realtime speaks the Phoenix
   channel protocol, which is four JSON message shapes — join, reply, heartbeat,
   broadcast — so it is talked to directly rather than through the SDK. Same
   reason as js/online.js: no bundler, no build step, nothing from a CDN.

   ADDITIVE, like everything online here. If `js/config.js` is missing, the keys
   are placeholders, or the socket never connects, this file does nothing at
   all: no socket, no timers, no draw wrapper. The city renders exactly as it
   did before and the single-player loop never waits on any of it.
   See ARCHITECTURE §12.

   Loaded last, after js/leaderboard.js. */

(function(){
  'use strict';

  if(typeof onlineReady !== 'function' || !onlineReady()) return;

  /* ---------- tuning ----------
     Sized for the Supabase free tier. A player standing still, sitting in a
     room, or reading the market screen sends NOTHING — updates are gated on
     actual movement, which is what keeps the message count survivable. */
  const TOPIC        = 'realtime:alphalife-city';
  const SEND_MS      = 200;      /* 5/sec while genuinely moving, and only then */
  const MOVE_EPS     = 2;        /* px — below this it is the same position     */
  const PEER_TTL     = 15000;    /* drop a player we have not heard from        */
  const SWEEP_MS     = 3000;
  const MAX_PEERS    = 24;       /* draw ceiling, so a busy city stays smooth   */
  const HEARTBEAT_MS = 25000;    /* Realtime closes an idle socket at ~60s      */
  const BACKOFF      = [2000, 4000, 8000, 16000, 30000];

  /* A per-tab identity. Not an account and not persisted — two tabs are two
     players, and closing one forgets it. */
  const SELF_ID = 'p' + Math.random().toString(36).slice(2, 10);

  let ws = null, joined = false, ref = 0, tries = 0;
  let hbTimer = null, sweepTimer = null, retryTimer = null, gaveUp = false;
  let lastSent = 0, lastX = null, lastY = null, lastDir = null;

  /* id -> {name, x, y, dir, driving, at} */
  const peers = new Map();

  const nextRef = () => String(++ref);

  /* ---------- socket ---------- */
  function connect(){
    if(gaveUp || ws) return;
    const cfg = onlineConfig();
    if(!cfg) return;

    /* https://<ref>.supabase.co -> wss://<ref>.supabase.co/realtime/v1/websocket */
    const url = cfg.url.replace(/^http/i, 'ws') +
      '/realtime/v1/websocket?apikey=' + encodeURIComponent(cfg.key) + '&vsn=1.0.0';

    try{ ws = new WebSocket(url); }
    catch(e){ ws = null; retry(); return; }

    ws.onopen = () => {
      tries = 0;
      send({topic: TOPIC, event: 'phx_join', ref: nextRef(), payload: {
        config: {
          broadcast: {self: false, ack: false},
          presence:  {key: SELF_ID},
          private: false,
        },
        access_token: cfg.key,
      }});
      hbTimer = setInterval(heartbeat, HEARTBEAT_MS);
    };

    ws.onmessage = ev => {
      let m; try{ m = JSON.parse(ev.data); }catch(e){ return; }
      if(!m) return;

      if(m.event === 'phx_reply' && m.payload && m.payload.status === 'ok'){
        joined = true;
        return;
      }
      /* A join that is refused is a configuration problem, not a blip — stop
         rather than reconnect forever against a wall. */
      if(m.event === 'phx_reply' && m.payload && m.payload.status === 'error'){
        gaveUp = true; teardown(); return;
      }
      if(m.event === 'broadcast' && m.payload && m.payload.event === 'pos'){
        acceptPeer(m.payload.payload);
      }
    };

    ws.onclose = () => { joined = false; teardown(false); retry(); };
    ws.onerror = () => { try{ ws && ws.close(); }catch(e){} };
  }

  function send(msg){
    if(!ws || ws.readyState !== 1) return;
    try{ ws.send(JSON.stringify(msg)); }catch(e){}
  }
  function heartbeat(){
    send({topic: 'phoenix', event: 'heartbeat', ref: nextRef(), payload: {}});
  }

  function teardown(hard){
    if(hbTimer){ clearInterval(hbTimer); hbTimer = null; }
    if(hard !== false){
      if(sweepTimer){ clearInterval(sweepTimer); sweepTimer = null; }
      if(retryTimer){ clearTimeout(retryTimer); retryTimer = null; }
    }
    if(ws){ try{ ws.onclose = null; ws.close(); }catch(e){} ws = null; }
    peers.clear();
  }

  function retry(){
    if(gaveUp || retryTimer) return;
    if(tries >= BACKOFF.length){ gaveUp = true; return; }
    const wait = BACKOFF[tries++];
    retryTimer = setTimeout(() => { retryTimer = null; connect(); }, wait);
  }

  /* ---------- receiving ----------
     Everything here arrived from someone else's browser, so nothing in it is
     believed. The name goes through the same filter the entry box uses, and the
     coordinates are clamped into the world rather than trusted to be inside it
     — otherwise one bad packet draws a name at infinity. */
  function acceptPeer(d){
    if(!d || typeof d !== 'object') return;
    const id = String(d.id || '').slice(0, 24);
    if(!id || id === SELF_ID) return;

    const x = Number(d.x), y = Number(d.y), dir = Number(d.dir);
    if(!isFinite(x) || !isFinite(y)) return;

    if(!peers.has(id) && peers.size >= MAX_PEERS) return;

    peers.set(id, {
      /* displayName() substitutes a placeholder rather than throwing, so a
         hostile name cannot interrupt anyone's frame. This is the "before it is
         shown to other players" half of the filtering rule. */
      name:    displayName(d.name),
      x:       Math.max(0, Math.min(typeof W === 'number' ? W : 4200, x)),
      y:       Math.max(0, Math.min(typeof H === 'number' ? H : 2400, y)),
      dir:     isFinite(dir) ? dir : 0,
      driving: !!d.driving,
      moving:  !!d.moving,
      at:      Date.now(),
    });
  }

  function sweep(){
    const now = Date.now();
    for(const [id, p] of peers) if(now - p.at > PEER_TTL) peers.delete(id);
  }

  /* ---------- sending ----------
     Called from the draw wrapper, so it is already once per frame, and gated
     three ways: not while a screen is up, not faster than SEND_MS, and not at
     all unless the player actually moved. */
  function maybeSend(){
    if(!joined) return;
    if(typeof inRoom !== 'undefined' && inRoom) return;
    if(typeof gameOver !== 'undefined' && gameOver) return;
    if(typeof splashDone !== 'undefined' && !splashDone) return;

    const now = Date.now();
    if(now - lastSent < SEND_MS) return;

    const moved = lastX === null ||
      Math.abs(P.x - lastX) > MOVE_EPS || Math.abs(P.y - lastY) > MOVE_EPS ||
      Math.abs(P.dir - lastDir) > 0.15;
    if(!moved) return;

    const name = storedName();
    if(!name) return;      /* no name set — watch, but do not appear */

    lastSent = now; lastX = P.x; lastY = P.y; lastDir = P.dir;
    send({topic: TOPIC, event: 'broadcast', ref: nextRef(), payload: {
      type: 'broadcast', event: 'pos',
      payload: {
        id: SELF_ID, name,
        x: Math.round(P.x), y: Math.round(P.y),
        dir: Math.round(P.dir * 100) / 100,
        driving: !!P.driving, moving: !!P.moving,
      },
    }});
  }

  /* ---------- drawing ----------
     drawPlayer() is called from draw() inside the camera translate, right
     before restore, so wrapping it puts remote players in world coordinates for
     free. They are drawn BEFORE the local player, so you are always on top of
     the pile. Wrapping means city.js and art.js are untouched. */
  function drawPeers(cx){
    if(!peers.size) return;
    const halfW = (typeof VW === 'number' ? VW : 1200) / 2 + 90;
    const halfH = (typeof VH === 'number' ? VH : 800) / 2 + 90;

    for(const p of peers.values()){
      if(Math.abs(p.x - P.x) > halfW || Math.abs(p.y - P.y) > halfH) continue;

      cx.save();
      cx.translate(p.x, p.y);
      if(p.driving){
        cx.save(); cx.rotate(p.dir); drawCar(cx, p.dir, 1); cx.restore();
      }else{
        /* Remote players get a static walk pose: their phase is not
           transmitted, and inventing one would animate them out of step with
           their own movement. */
        drawCharacter(cx, p.dir, 0, false, 1);
      }
      cx.restore();

      drawPeerName(cx, p);
    }
  }

  function drawPeerName(cx, p){
    const label = p.name;
    cx.save();
    cx.translate(p.x, p.y - (p.driving ? 26 : 24));
    cx.font = '600 11px ' + (typeof CANVAS_COND !== 'undefined' ? CANVAS_COND : 'sans-serif');
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';

    /* A pill behind the text, because the city is busy and light text alone
       disappears over a lit window. */
    const w = cx.measureText(label).width + 12;
    cx.fillStyle = 'rgba(13,10,22,0.72)';
    if(cx.roundRect){
      cx.beginPath(); cx.roundRect(-w / 2, -8, w, 16, 3); cx.fill();
    }else{
      cx.fillRect(-w / 2, -8, w, 16);
    }
    cx.fillStyle = typeof PAL !== 'undefined' ? PAL.ink : '#F7F2E7';
    cx.fillText(label, 0, 0.5);
    cx.restore();
  }

  /* ---------- wiring ---------- */
  if(typeof drawPlayer === 'function'){
    const _drawPlayerLive = drawPlayer;
    drawPlayer = function(cx, phase){
      try{ maybeSend(); drawPeers(cx); }catch(e){}   /* never break a frame */
      _drawPlayerLive(cx, phase);
    };
  }

  sweepTimer = setInterval(sweep, SWEEP_MS);
  connect();

  /* Stop talking when the tab is hidden — the game deliberately keeps running
     (shell.js), but there is no reason to keep broadcasting to a city nobody is
     looking at, and it is most of the saving on a free tier. */
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'hidden'){
      teardown(); gaveUp = false; tries = 0;
    }else if(!ws && !gaveUp){
      sweepTimer = sweepTimer || setInterval(sweep, SWEEP_MS);
      connect();
    }
  });

  /* Handles for testing and for the console. */
  window.livePeers  = () => Array.from(peers.entries());
  window.liveStatus = () => ({connected: !!ws && ws.readyState === 1, joined, gaveUp,
                              peers: peers.size, selfId: SELF_ID});
  window.__liveAccept = acceptPeer;   /* used by the test harness */
})();
