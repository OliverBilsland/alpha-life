/* ==================== ONLINE — SUPABASE CLIENT ====================
   Leaderboard reads and writes. Everything here is optional, additive, and
   fails soft: if `js/config.js` is missing, the keys are placeholders, the
   network is down or Supabase is unreachable, every function in this file
   returns a benign value and the game carries on exactly as before. Nothing in
   the single player loop calls anything here. See ARCHITECTURE §11.

   NO SDK. Supabase's REST surface (PostgREST) is plain HTTP with two headers,
   so talking to it directly keeps the project's "no build step, no
   dependencies" property intact — there is nothing to bundle and nothing to
   fetch from a CDN at runtime. Realtime is a separate file (js/live.js).

   Loaded after js/names.js, before js/leaderboard.js. */

/* Written by js/devtools.js when cash has been granted. Declared here as the
   canonical reader; the two strings must stay in step if either is renamed. */
const TAINT_KEY_READ = 'alphalife.dev.tainted';

const ONLINE_TIMEOUT = 8000;   /* ms — a hung request must not hang the UI */
const LB_LIMIT = 50;

/* ---------- configuration ---------- */
function onlineConfig(){
  const c = (typeof window !== 'undefined') ? window.ALPHA_CONFIG : null;
  if(!c) return null;
  const url = String(c.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = String(c.SUPABASE_ANON_KEY || '').trim();
  /* Reject the template's own placeholders, so a half-finished copy of
     config.example.js reads as "not configured" rather than as a broken
     project that produces failed requests on every screen. */
  if(!url || !key) return null;
  if(url.includes('YOUR-PROJECT-REF') || key.includes('PASTE-YOUR')) return null;
  if(!/^https:\/\//i.test(url)) return null;
  return {url, key};
}
const onlineReady = () => onlineConfig() !== null;

/* ---------- the cheat gate ----------
   A save that has been given free cash never reaches the leaderboard. The
   marker is written by the dev panel and lives in its own storage key, so it
   survives reloads and is not laundered by the normal save.

   This is a local, honest-player gate, not a security control: anyone can clear
   their own localStorage. It cannot be otherwise without a server that watches
   the whole run. What it does guarantee is the thing that was asked for — the
   dev tool cannot quietly push its own inflated numbers into other people's
   standings, which is the only way that tool could have damaged this feature.
   The server-side CHECK constraints in SHIP.md §8.2 are the second layer. */
function saveIsTainted(){
  try{
    const raw = localStorage.getItem(TAINT_KEY_READ);
    if(!raw) return false;
    const d = JSON.parse(raw);
    return !!(d && d.tainted);
  }catch(e){ return false; }
}

/* ---------- transport ----------
   One place that talks to the network, so there is one place that can fail. */
async function supaFetch(path, opts){
  const cfg = onlineConfig();
  if(!cfg) return {ok:false, why:'offline'};

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ONLINE_TIMEOUT);
  try{
    const res = await fetch(cfg.url + '/rest/v1/' + path, {
      ...opts,
      signal: ctrl.signal,
      headers: {
        'apikey': cfg.key,
        'Authorization': 'Bearer ' + cfg.key,
        'Content-Type': 'application/json',
        ...(opts && opts.headers),
      },
    });
    if(!res.ok){
      let detail = '';
      try{ detail = (await res.text()).slice(0, 200); }catch(e){}
      return {ok:false, why:'http ' + res.status, detail};
    }
    const text = await res.text();
    return {ok:true, data: text ? JSON.parse(text) : null};
  }catch(e){
    /* Aborts, DNS failures, CORS, offline — all the same to the caller. */
    return {ok:false, why: e && e.name === 'AbortError' ? 'timeout' : 'network'};
  }finally{
    clearTimeout(timer);
  }
}

/* ---------- submit ----------
   -> {ok:true} | {ok:false, why:'<message for the player>'} */
async function submitRun(rawName){
  if(!onlineReady())  return {ok:false, why:'The leaderboard is not set up on this device.'};
  if(saveIsTainted()) return {ok:false, why:'This save used the developer cash tool, so it cannot be submitted.'};

  /* The name is validated again here, not trusted from the entry screen. This
     is the "before it is written" half of the requirement: whatever path led
     here — stored name, edited localStorage, a call from the console — the row
     that reaches the database has been through the same filter. */
  const v = validateName(rawName);
  if(!v.ok) return {ok:false, why: v.why};

  const sound = quad.gpgo + quad.gpbo;
  const row = {
    name:          v.name,
    net_worth:     Math.round(netWorth()),
    process_score: sound,
    process_total: idx,
  };
  /* Nonsense never leaves the building, so a broken run cannot poison the
     board even before RLS sees it. */
  if(!isFinite(row.net_worth) || row.process_score < 0 || row.process_total < 0
     || row.process_score > row.process_total){
    return {ok:false, why:'This run does not look complete enough to submit.'};
  }

  const res = await supaFetch('runs', {
    method: 'POST',
    headers: {'Prefer': 'return=minimal'},
    body: JSON.stringify(row),
  });
  if(res.ok) return {ok:true};
  return {ok:false, why: res.why === 'timeout'
    ? 'The leaderboard did not answer in time. Your run is safe locally.'
    : 'Could not reach the leaderboard. Your run is safe locally.'};
}

/* ---------- read ----------
   Ranked by process score: net worth alone rewards a lucky streak, and this
   game's whole argument is that the two are different things (DESIGN Rule 1).
   Net worth rides along as a column, never as the sort key.
   -> {ok:true, rows:[...]} | {ok:false, why:'...'} */
async function fetchLeaderboard(limit){
  if(!onlineReady()) return {ok:false, why:'The leaderboard is not set up on this device.'};

  const n = Math.min(Math.max(1, limit || LB_LIMIT), 100);
  const res = await supaFetch(
    'runs?select=name,net_worth,process_score,process_total,created_at' +
    '&order=process_score.desc,net_worth.desc&limit=' + n, {method:'GET'});

  if(!res.ok) return {ok:false, why:'Could not reach the leaderboard.'};

  /* Every row is re-checked on the way in. These names were written by other
     browsers; the database stored what it was given, and a stored string is not
     a promise about its contents. displayName() replaces anything that fails
     rather than throwing, so one bad row cannot blank the whole screen. */
  const rows = (Array.isArray(res.data) ? res.data : []).map(r => ({
    name:          displayName(r && r.name),
    netWorth:      Number(r && r.net_worth) || 0,
    processScore:  Number(r && r.process_score) || 0,
    processTotal:  Number(r && r.process_total) || 0,
  }));
  return {ok:true, rows};
}

/* ---------- the player's own name ----------
   Local, and validated on the way out of storage as well as in — an edited
   localStorage entry is just another untrusted source. */
const NAME_KEY = 'alphalife.name';

function storedName(){
  try{
    const v = validateName(localStorage.getItem(NAME_KEY) || '');
    return v.ok ? v.name : '';
  }catch(e){ return ''; }
}
function storeName(raw){
  const v = validateName(raw);
  if(!v.ok) return v;
  try{ localStorage.setItem(NAME_KEY, v.name); }catch(e){}
  return v;
}
