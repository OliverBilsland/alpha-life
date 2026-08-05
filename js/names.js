/* ==================== DISPLAY NAMES ====================
   The one place a display name is judged. Pure and synchronous: no network, no
   state, no DOM. Everything online calls in here, and nothing here calls out.

   It is deliberately usable on a name from ANY source — typed by this player,
   read back from the leaderboard, or arriving over realtime from a stranger's
   browser. A name is never trusted because of where it came from: the client
   that produced it may not be this one. See ARCHITECTURE §11.

   Loaded after js/vendor/obscenity.js, before anything online. */

const NAME_MIN = 3, NAME_MAX = 16;

/* Whole-name exceptions. The obscenity English dataset flags these because of a
   substring, but they are ordinary surnames and place names, and a player
   called Dickinson should not be told to pick a different name. Matched against
   the cleaned, lower-cased name — exact, whole-string, never as a substring, so
   this can never be used to smuggle anything past the filter.
   Add to it when a real false positive turns up. */
const NAME_ALLOW = new Set([
  'dickinson', 'penistone', 'scunthorpe', 'cockburn', 'hancock', 'lightwater',
  'clitheroe', 'assange', 'babcock', 'hitchcock', 'woodcock', 'glasscock',
]);

/* Characters a name may contain: any Unicode letter or combining mark, any
   digit, space, and a short list of punctuation that appears in real names.
   Everything else — emoji, box drawing, arrows, private-use, symbols — is out.
   \p{L} rather than A-Za-z so this does not quietly exclude anyone whose name
   is not written in Latin script. */
const NAME_OK_CHARS = /^[\p{L}\p{M}\p{N} '._-]+$/u;

/* Invisible or direction-bending characters. These are stripped, not rejected:
   a name pasted from a web page often carries a stray zero-width space, and
   silently cleaning that is kinder than refusing it. Bidi overrides matter
   because they can make a rendered name read completely differently from the
   string that was checked. Built from escapes rather than literals so the
   source file stays free of the very characters it is describing. */
const NAME_INVISIBLE = new RegExp(
  '[' +
  '\\u0000-\\u001F\\u007F-\\u009F' +   /* C0 / DEL / C1 control characters  */
  '\\u00AD' +                          /* soft hyphen                       */
  '\\u200B-\\u200F' +                  /* zero-width space .. RTL mark      */
  '\\u202A-\\u202E' +                  /* bidi embedding / override         */
  '\\u2060-\\u2064' +                  /* word joiner, invisible operators  */
  '\\u2066-\\u2069' +                  /* bidi isolates                     */
  '\\uFEFF' +                          /* zero-width no-break space (BOM)   */
  ']', 'gu');

/* ---------- cleaning ----------
   Returns the tidied name. Cleaning is separate from judging so that both the
   entry field and the render path can clean identically before comparing. */
function cleanName(raw){
  let s = String(raw == null ? '' : raw);
  /* NFKC first: folds full-width and other compatibility forms down to the
     characters they look like, so the filter sees them too. */
  try{ s = s.normalize('NFKC'); }catch(e){}
  s = s.replace(NAME_INVISIBLE, '');
  /* Any whitespace run (tab, non-breaking space, line separator) becomes one
     plain space, so a tabbed-out name cannot pose as a longer or stranger one. */
  s = s.replace(/\s+/gu, ' ').trim();
  return s;
}

/* ---------- profanity, including the evasions the library misses ----------
   The vendored matcher already handles leetspeak (sh1t), masking (f*ck),
   character repeats (fuuuck), unicode confusables and case. Two things it does
   not do for a short display name, so they are done here. */
function looksProfane(name){
  const P = (typeof AlphaProfanity !== 'undefined') ? AlphaProfanity : null;
  if(!P) return false;          /* vendor file absent — fail open, never crash */

  const variants = [name];

  /* Spaced-out spelling: "f u c k", "f-u-c-k", "f.u.c.k", "fu ck".
     Only condensed when EVERY token is one or two characters, which is what
     spelling-it-out looks like and what an ordinary name does not. "Ana L"
     (tokens 3,1) and "J R Ewing" (1,1,5) are left alone; "Class Act" too.
     Without this guard, joining tokens would invent words nobody typed. */
  const tokens = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if(tokens.length >= 2 && tokens.every(t => [...t].length <= 2)){
    variants.push(tokens.join(''));
  }

  /* KNOWN AND DELIBERATE GAP: a split with one long token — "fuc k", "shi t" —
     is not condensed and so is not caught.
     Condensing those too would mean joining any two tokens, and "Ana L" then
     reads as a slur. "Ana L" and "fuc k" are structurally identical — short
     token, one-letter token — so no rule can separate them, only a choice about
     which mistake to make. Letting a visibly mangled name through is the
     cheaper error than telling someone their own name is obscene, so the guard
     above stays. Full-word entries are still caught; this only leaks the ones
     that already look broken. */

  return variants.some(v => P.hasMatch(v));
}

/* ---------- the judgement ----------
   -> {ok:true, name:'<cleaned>'} | {ok:false, why:'<message for the player>'}
   Messages are written to be said to a person, not logged. */
function validateName(raw){
  const name = cleanName(raw);

  if(!name) return {ok:false, why:'Please enter a name.'};
  /* Counted in code points, so an accented or non-Latin name is measured the
     way a person would count it rather than in UTF-16 units. */
  const len = [...name].length;
  if(len < NAME_MIN)            return {ok:false, why:'At least ' + NAME_MIN + ' characters, please.'};
  if(len > NAME_MAX)            return {ok:false, why:NAME_MAX + ' characters or fewer, please.'};
  if(!NAME_OK_CHARS.test(name)) return {ok:false, why:'Letters, numbers and spaces only.'};

  if(!NAME_ALLOW.has(name.toLowerCase()) && looksProfane(name)){
    return {ok:false, why:'Please choose a different name.'};
  }
  return {ok:true, name};
}

const nameIsValid = raw => validateName(raw).ok;

/* ---------- the render path ----------
   For names that did NOT come from this browser's entry field: leaderboard rows
   and realtime players. The filter runs again here, because the row was written
   by some other client and a database row is not a promise about its contents.
   Never throws and never returns a rejection the caller has to handle — a bad
   name from a stranger must not be able to interrupt anyone's game, so it is
   replaced with a neutral placeholder and the game carries on. */
function displayName(raw){
  const v = validateName(raw);
  return v.ok ? v.name : 'Player';
}

/* Escapes before interpolation. Every interior in this game is built with
   innerHTML, so a name arriving from the network is markup until proven
   otherwise. validateName's character allowlist already excludes < > and &,
   but this does not rely on that holding — it is the last line, and it is
   cheap. Use escapeName() for anything that reaches innerHTML. */
function escapeName(raw){
  return displayName(raw).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
