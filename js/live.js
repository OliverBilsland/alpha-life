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

  /* ---------- standings ----------
     A separate map from `peers`, on purpose. `peers` is positions, and it only
     fills while someone moves — a player reading the market screen or standing
     still broadcasts nothing, by design, because that is what keeps the message
     count survivable. That is fine for drawing and useless for a scoreboard:
     the people most worth ranking are the ones sitting still doing the analysis.

     So status rides its own slow beat, independent of movement and of the frame
     loop, and lives in its own map with its own TTL. Someone can be in `stats`
     and not in `peers` — online, ranked, simply not walking. */
  const stats = new Map();   /* id -> {name, net, ps, pt, at} */
  const STAT_MS    = 10000;  /* heartbeat when nothing changes */
  const STAT_FLOOR = 1500;   /* never faster than this, even on a change  */
  const STAT_TTL   = 26000;  /* two missed beats and you are off the board */
  let statTimer = null, lastStatAt = 0, lastStatKey = '';

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
      if(m.event === 'broadcast' && m.payload && m.payload.event === 'stat'){
        acceptStat(m.payload.payload);
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
    if(statTimer){ clearInterval(statTimer); statTimer = null; }
    if(hard !== false){
      if(sweepTimer){ clearInterval(sweepTimer); sweepTimer = null; }
      if(retryTimer){ clearTimeout(retryTimer); retryTimer = null; }
    }
    if(ws){ try{ ws.onclose = null; ws.close(); }catch(e){} ws = null; }
    peers.clear();
    stats.clear();
    /* so the first send after reconnecting is not suppressed as unchanged */
    lastStatKey = ''; lastStatAt = 0;
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

  /* Same rule as acceptPeer: this arrived from someone else's browser, so
     nothing in it is believed. The numbers are clamped to the same ranges the
     RLS policy enforces on a submitted run, so a hostile client cannot put an
     absurd figure at the top of everyone's panel. */
  function acceptStat(d){
    if(!d || typeof d !== 'object') return;
    const id = String(d.id || '').slice(0, 24);
    if(!id || id === SELF_ID) return;
    if(!stats.has(id) && stats.size >= MAX_PEERS) return;

    const net = Number(d.net), ps = Number(d.ps), pt = Number(d.pt);
    if(!isFinite(net) || !isFinite(ps) || !isFinite(pt)) return;

    const total = Math.max(0, Math.min(500, Math.round(pt)));
    stats.set(id, {
      name:  displayName(d.name),
      net:   Math.max(-1e9, Math.min(1e9, Math.round(net))),
      /* score can never exceed total — the one invariant the board relies on */
      ps:    Math.max(0, Math.min(total, Math.round(ps))),
      pt:    total,
      at:    Date.now(),
    });
  }

  /* What this player currently is, in the same three numbers a finished run is
     submitted with (js/online.js submitRun) — so a live row and a completed row
     mean the same thing and can be read against each other. */
  function myStats(){
    const name = storedName();
    if(!name) return null;                       /* no name, no appearance */
    if(typeof netWorth !== 'function' || typeof quad !== 'object' || !quad) return null;
    const net = Math.round(netWorth());
    if(!isFinite(net)) return null;
    return {
      name,
      net,
      ps: (quad.gpgo | 0) + (quad.gpbo | 0),
      pt: (typeof idx === 'number' && isFinite(idx)) ? idx : 0,
    };
  }

  /* On a timer rather than in the draw wrapper: draw() does not run while a
     room screen is up, and a player at the desk is exactly who the board is
     about. Sends on change, and otherwise on a slow heartbeat. */
  function maybeSendStat(){
    if(!joined) return;
    if(typeof gameOver !== 'undefined' && gameOver) return;
    if(typeof splashDone !== 'undefined' && !splashDone) return;

    const s = myStats();
    if(!s) return;

    const now = Date.now();
    if(now - lastStatAt < STAT_FLOOR) return;    /* a payday must not burst */
    const key = s.name + '|' + s.net + '|' + s.ps + '|' + s.pt;
    if(key === lastStatKey && now - lastStatAt < STAT_MS) return;

    lastStatKey = key; lastStatAt = now;
    send({topic: TOPIC, event: 'broadcast', ref: nextRef(), payload: {
      type: 'broadcast', event: 'stat',
      payload: {id: SELF_ID, name: s.name, net: s.net, ps: s.ps, pt: s.pt},
    }});
  }

  function sweep(){
    const now = Date.now();
    for(const [id, p] of peers) if(now - p.at > PEER_TTL) peers.delete(id);
    for(const [id, s] of stats) if(now - s.at > STAT_TTL) stats.delete(id);
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

    /* The same clamped camera city.js computes at the top of draw(). It is a
       local const there, so it is recomputed rather than reached for — the two
       must stay in step if that line ever changes.

       Culling used to be |p.x - P.x| > halfW, which silently assumed the
       viewport is centred on the player. It is not near a world edge: standing
       at x=330 with a 1920-wide viewport, everything from x=1050 rightwards is
       on screen and was being culled anyway. Real players vanished in exactly
       the corners of the map where you are most likely to be. */
    const vw = (typeof VW === 'number' ? VW : 1200);
    const vh = (typeof VH === 'number' ? VH : 800);
    const camX = Math.max(0, Math.min((typeof W === 'number' ? W : 4200) - vw, P.x - vw / 2));
    const camY = Math.max(0, Math.min((typeof H === 'number' ? H : 2400) - vh, P.y - vh / 2));
    const M = 90;   /* slack, so a peer is not clipped mid-sprite at the border */

    for(const p of peers.values()){
      if(p.x < camX - M || p.x > camX + vw + M ||
         p.y < camY - M || p.y > camY + vh + M){
        drawPeerEdge(cx, p, camX, camY, vw, vh);
        continue;
      }

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

  /* An off-screen player used to be drawn as nothing at all, which made "three
     people are here" and "the street is empty" look identical — and the city is
     big enough to play a whole session two blocks from someone and never know.
     A chevron at the edge of the viewport, pointing at them.

     Drawn in world coordinates, clamped into the viewport box around P, so it
     stays inside the camera translate drawPlayer() already established and
     needs no screen-space conversion. */
  function drawPeerEdge(cx, p, camX, camY, vw, vh){
    const M = 26;   /* inset, so the chevron is not half off the screen */
    const x = Math.max(camX + M, Math.min(camX + vw - M, p.x));
    const y = Math.max(camY + M, Math.min(camY + vh - M, p.y));

    cx.save();
    cx.translate(x, y);
    /* Point from the marker towards the player it stands for, not from the
       local player — off the corner of a clamped camera those differ. */
    cx.rotate(Math.atan2(p.y - y, p.x - x));
    /* Faint on purpose: this is peripheral information, not a waypoint, and it
       must not compete with the city or read as a game objective. */
    cx.globalAlpha = 0.5;
    cx.fillStyle = '#8FA3FF';
    cx.beginPath();
    cx.moveTo(8, 0); cx.lineTo(-4, 5); cx.lineTo(-4, -5); cx.closePath();
    cx.fill();
    cx.restore();
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
  statTimer  = setInterval(maybeSendStat, 2000);
  connect();

  /* Stop talking when the tab is hidden — the game deliberately keeps running
     (shell.js), but there is no reason to keep broadcasting to a city nobody is
     looking at, and it is most of the saving on a free tier. */
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'hidden'){
      teardown(); gaveUp = false; tries = 0;
    }else if(!ws && !gaveUp){
      sweepTimer = sweepTimer || setInterval(sweep, SWEEP_MS);
      statTimer  = statTimer  || setInterval(maybeSendStat, 2000);
      connect();
    }
  });

  /* Handles for testing and for the console. */
  window.livePeers  = () => Array.from(peers.entries());
  /* Everyone else's current status, for the leaderboard panel. */
  window.liveBoard  = () => Array.from(stats.values())
                              .map(s => ({name: s.name, net: s.net, ps: s.ps, pt: s.pt}));
  window.liveStatus = () => {
    /* Online means either signal: someone standing still still counts, and
       someone who has not picked a name is seen but sends no status. */
    const here = new Set();
    for(const id of peers.keys()) here.add(id);
    for(const id of stats.keys()) here.add(id);
    return {connected: !!ws && ws.readyState === 1, joined, gaveUp,
            peers: here.size, moving: peers.size, ranked: stats.size, selfId: SELF_ID};
  };
  window.__liveAccept = acceptPeer;   /* used by the test harness */
  window.__liveStat   = acceptStat;
})();
