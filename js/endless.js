/* ==================== ENDLESS ====================
   The game does not stop. Months 1-4 remain the tutorial arc on the twenty
   authored cases; after that the generator supplies scenarios forever.

   Endless has to mean DEEPENING, not repeating, so four things escalate:

     difficulty  cases get harder to read as chapters pass
     scale       portfolio and fund grow, so decisions get larger
     access      new instruments and tools open on process XP
     standing    the career ladder runs analyst -> founder and keeps going

   The only ways a run ends are bankruptcy, or the player choosing to stop. */

const CHAPTER_MONTHS=6;                 /* a new chapter every six months */
const chapterOf=m=>Math.max(1,Math.floor((m-1)/CHAPTER_MONTHS)+1);
const chapter=()=>chapterOf(month);

const CHAPTERS=[
 {n:'The first twenty',   d:'The hand-written cases everyone starts with.'},
 {n:'On the record',      d:'Generated cases. Your decisions start accumulating into a record.'},
 {n:'Wider mandate',      d:'Harder reads, and the market is less generous about telling you why.'},
 {n:'Institutional',      d:'The gaps narrow. Everything looks defensible until you find the one thing that is not.'},
 {n:'Reflexive',          d:'The distractors are as strong as the signal. Only the deciding axis is decisive.'},
 {n:'Terminal velocity',  d:'As hard as this gets, forever.'}
];
const chapterInfo=c=>CHAPTERS[Math.min(c-1,CHAPTERS.length-1)];

/* 0 at the start, approaching 1. Chapter 1 is the authored tutorial and always 0. */
function difficultyFor(i){
  if(i<S.length) return 0;
  const past=i-S.length;
  return Math.min(0.92, past/260);
}
const difficultyNow=()=>difficultyFor(idx);

/* Scale: the intro portfolio is tiny and the fund is large. Between them, a
   player who stays on the desk still needs the stakes to grow, so a milestone
   bonus lands every chapter for a decent process record. */
function chapterBonus(){
  const sound=quad.gpgo+quad.gpbo;
  const rate=idx?sound/idx:0;
  if(rate<0.45) return 0;
  return Math.round((arc===2?aum:port)*(0.04+0.05*(rate-0.45)/0.55));
}

/* Milestones: what is still ahead, so endless never looks like a treadmill. */
function nextMilestone(){
  const nxt=nextInstrument();
  if(nxt) return {k:'desk', n:nxt.n+' desk', at:nxt.xp+' XP', now:xp+' XP'};
  const j=typeof nextJob==='function'?nextJob():null;
  if(j) return {k:'seat', n:j.n, at:'requirements at Holbrook', now:job().n};
  if(arc!==2) return {k:'fund', n:'Outside capital', at:ARC2_BAR+' sound calls', now:(quad.gpgo+quad.gpbo)+' sound'};
  return {k:'scale', n:'A larger book', at:money(AUM_TARGET), now:money(aum)};
}

function chapterHTML(){
  const c=chapter(), info=chapterInfo(c), m=nextMilestone();
  return `<section class="chapter">
    <div class="chapterhd"><span>Chapter ${c} · ${info.n}</span>
      <span>${Math.round(difficultyNow()*100)}% difficulty</span></div>
    <div class="chapterb">${info.d}
      ${m?`<br><strong>Next:</strong> ${m.n} — ${m.at} (you: ${m.now}).`:''}</div>
  </section>`;
}

/* Shown once per chapter, at the month it turns over. */
function chapterTurnHTML(){
  if(chapterSeen>=chapter()) return '';
  chapterSeen=chapter();
  const info=chapterInfo(chapter());
  const bonus=chapterBonus();
  if(bonus){ if(arc===2){aum+=bonus;aumStart+=bonus;} else port+=bonus; }
  return `<p class="note k"><strong>Chapter ${chapter()} · ${info.n}.</strong> ${info.d}
    ${bonus?`Your record is good enough that money followed it: <strong>${money(bonus)}</strong>
      allocated on the strength of ${Math.round((quad.gpgo+quad.gpbo)/Math.max(1,idx)*100)}% sound calls.`
    :'Nothing extra was allocated — the record does not yet justify it.'}</p>`;
}
