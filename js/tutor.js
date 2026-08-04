/* ==================== THE ACCOUNTING TUTOR ====================
   A second income earned by LEARNING rather than trading.

   Four rules this file is built around:

   1. The explanation is the product. Every answer -- right or wrong -- gets the
      concept in plain English, why the answer is what it is, and how it shows up
      on a company card. Never "incorrect, next question".
   2. Pay for engagement, not for correctness. Working through the explanation
      and answering the follow-up is what earns the fee; being right adds a
      bonus. You cannot skip the teaching and still be paid.
   3. Repeats decay hard. Answering the same question again pays a fraction, so
      an answer key is worth almost nothing. There is also a monthly ceiling.
   4. Every question is about accounting the trading game actually uses -- the
      five numbers on the cards and the line items behind them.

   It starts from "what is revenue" and builds to "why is a cheap multiple
   sometimes a warning", for someone who has never taken a finance class. */

const TUTOR_LEVELS=[
 {n:'Foundations',  d:'What the words mean. Revenue, costs, profit.'},
 {n:'Margins',      d:'What is left over, and what that tells you about a business.'},
 {n:'The balance sheet', d:'Debt, and who really decides what happens in a bad year.'},
 {n:'Cash',         d:'Why profit and cash are not the same thing.'},
 {n:'Valuation',    d:'What you are paying, and whether cheap is really cheap.'}
];

const QUESTIONS=[
/* ---------- 1. Foundations ---------- */
{id:'q-rev', lvl:1, t:'Revenue',
 q:'A bakery sells $500,000 of bread over a year. Its ingredients, staff and rent cost $430,000. What is its revenue?',
 opts:['$500,000','$70,000','$430,000','Whatever the owner takes home'], a:0,
 why:'Revenue is simply everything customers paid you, before a single cost is taken off. The $500,000 is revenue. The $70,000 left after costs is profit — a different number entirely.',
 card:'On a company card, <strong>revenue growth</strong> is how fast this top number is rising. It tells you the business is winning more customers, and it says nothing yet about whether that is profitable.',
 check:{q:'So revenue is:', opts:['Everything customers paid, before costs','What is left after costs'], a:0}},

{id:'q-cost', lvl:1, t:'Costs',
 q:'Which of these is a cost of running the bakery?',
 opts:['Flour, wages and rent','The money customers hand over','The price on the shelf','The number of loaves sold'], a:0,
 why:'Costs are everything the business spends to produce and sell what it sells. Flour, wages and rent are all costs. Nothing a customer pays you is a cost — that is revenue arriving.',
 card:'Costs never appear directly on a card. They appear as their consequence: the <strong>operating margin</strong>, which is what survives after all of them.',
 check:{q:'Wages are:', opts:['A cost','Revenue'], a:0}},

{id:'q-profit', lvl:1, t:'Profit',
 q:'Revenue is $500,000 and total costs are $430,000. What is the profit?',
 opts:['$70,000','$930,000','$500,000','You cannot tell'], a:0,
 why:'Profit is revenue minus costs — $500,000 less $430,000 is $70,000. It is the reward for the whole exercise, and it is a much smaller number than revenue in almost every real business.',
 card:'This is why two companies with the same revenue can be completely different investments. The card shows both: revenue growth for size, margin for what actually survives.',
 check:{q:'Profit is:', opts:['Revenue minus costs','Revenue plus costs'], a:0}},

{id:'q-margin1', lvl:1, t:'What a margin is',
 q:'The bakery makes $70,000 of profit on $500,000 of revenue. What is its margin?',
 opts:['14%','70%','7.1x','$430,000'], a:0,
 why:'A margin is profit expressed as a share of revenue: 70,000 ÷ 500,000 = 14%. It means 14 pence of every pound taken over the counter survives as profit. Turning it into a percentage is what lets you compare a bakery with a bank.',
 card:'<strong>Operating margin</strong> on a card is exactly this calculation. It is the single fastest way to see whether a business keeps what it earns.',
 check:{q:'A margin turns profit into:', opts:['A share of revenue, so you can compare','A total in pounds'], a:0}},

/* ---------- 2. Margins ---------- */
{id:'q-margin2', lvl:2, t:'Reading a margin',
 q:'A company has a 30% operating margin. What does that actually tell you?',
 opts:['It keeps 30p of every pound of sales as profit','It grew 30% this year','It has 30% market share','Its shares rose 30%'], a:0,
 why:'A 30% margin means 30p of every pound of sales survives as operating profit. High margins usually mean customers will pay up and rivals cannot easily undercut you — pricing power. It is a statement about competitive strength, not size.',
 card:'When a card shows two companies in one industry with very different margins, that gap is rarely operational skill. It is usually one of them having something the other does not: a brand, a network, a licence.',
 check:{q:'A high margin usually signals:', opts:['Pricing power','A bigger company'], a:0}},

{id:'q-margin3', lvl:2, t:'Margin versus growth',
 q:'Company A grows 4% a year with a 30% margin. Company B grows 35% with a 9% margin. Which statement is fair?',
 opts:['Neither is automatically better — they are different businesses','A is better, margins always win','B is better, growth always wins','They are identical'], a:0,
 why:'Neither wins by default. A high margin on a business going nowhere eventually gets competed away or simply stops mattering. Fast growth on a thin margin can be superb if the margin improves with scale — or fatal if it never does. The answer depends on which of the two is the real story.',
 card:'This is the core judgement the game asks for. The card gives you both numbers and you have to decide which one is deciding it. That choice is the "reason" you have to name.',
 check:{q:'When growth and margin disagree, you:', opts:['Decide which one is the real story','Always take the higher margin'], a:0}},

{id:'q-margin4', lvl:2, t:'Where margins come from',
 q:'A supermarket runs a 3% margin and a software company runs a 35% margin. Why?',
 opts:['Software costs almost nothing to sell one more copy','Supermarkets are badly run','Software sells more','Supermarkets pay more tax'], a:0,
 why:'It is the shape of the business, not the skill of the managers. Selling one more copy of software costs almost nothing, so nearly all of that sale becomes profit. Selling one more loaf means buying more flour. Thin-margin businesses are not badly run — they are structurally thin.',
 card:'So a margin is only meaningful against companies in the same industry. The game always pairs two companies from one sector for exactly this reason.',
 check:{q:'Margins should be compared:', opts:['Within the same industry','Across any two companies'], a:0}},

/* ---------- 3. The balance sheet ---------- */
{id:'q-debt', lvl:3, t:'Debt',
 q:'What is debt, in one line?',
 opts:['Money the company borrowed and must pay back','Money customers owe the company','The value of its buildings','Its share price'], a:0,
 why:'Debt is borrowed money with a deadline and interest attached. Borrowing is not automatically bad — it is how factories and warehouses get built. What matters is whether the business reliably earns enough to service it.',
 card:'The card shows debt as <strong>Debt / EBITDA</strong>, which measures the burden rather than the raw amount. A large company with large debts may be far safer than a small one with small debts.',
 check:{q:'Debt is:', opts:['Borrowed money that must be repaid','Money owed to the company'], a:0}},

{id:'q-ebitda', lvl:3, t:'EBITDA in plain English',
 q:'EBITDA is a rough measure of what?',
 opts:['The cash the business generates before financing and accounting effects','The share price','Total sales','The tax bill'], a:0,
 why:'EBITDA is a rough stand-in for the cash a business throws off from trading, before interest, tax and accounting charges for wear and tear. It is imperfect — it flatters companies that need heavy reinvestment — but it is the standard yardstick lenders use.',
 card:'It matters because it is the denominator of the leverage ratio on the card. Debt only means something relative to what the business earns.',
 check:{q:'EBITDA roughly measures:', opts:['Cash generated from trading','Money left after all costs and tax'], a:0}},

{id:'q-lev1', lvl:3, t:'Reading leverage',
 q:'A company has Debt / EBITDA of 5x. What does that mean?',
 opts:['It would take about five years of earnings to repay its debts','It earns five times what it borrowed','Its debt grew 5%','It has five loans'], a:0,
 why:'Five times means the debt is about five years of current earnings. Under 2x is generally comfortable; above 4x, one bad year can mean missing a payment. At that point the lenders, not the managers, start deciding what happens next.',
 card:'On a card this is the number that decides survival. A business can look superb on growth and margin and still be handed to its creditors because a repayment fell due in a bad quarter.',
 check:{q:'5x leverage is:', opts:['About five years of earnings owed','Five percent of revenue owed'], a:0}},

{id:'q-lev2', lvl:3, t:'Why leverage bites',
 q:'Two identical companies both see sales fall 20%. One has no debt, one is at 5x. What happens?',
 opts:['The indebted one may be forced to sell assets or refinance on bad terms','Both are equally affected','The indebted one is safer','Nothing, debt is fixed'], a:0,
 why:'The interest bill does not fall when sales do. The unlevered company has a bad year; the levered one may breach the terms of its loans and be forced to sell assets, raise money cheaply, or hand over control. Debt converts a bad year into a permanent loss.',
 card:'This is why leverage often decides a comparison even when the levered company looks better on growth and margin. It is the axis that only matters when things go wrong — and things go wrong.',
 check:{q:'In a downturn, debt:', opts:['Turns a bad year into a permanent loss','Falls along with sales'], a:0}},

/* ---------- 4. Cash ---------- */
{id:'q-cash1', lvl:4, t:'Profit is not cash',
 q:'A company reports $10m of profit but its bank balance barely moved. How?',
 opts:['Customers have not paid yet, or it spent the cash on stock and equipment','It is fraud','Profit always equals cash','It paid too much tax'], a:0,
 why:'Profit is recorded when a sale is agreed, not when the money arrives. A company can book a large profit while the cash is still sitting in unpaid invoices, or has already gone into inventory and machines. Profit is an opinion shaped by accounting rules; cash is a fact.',
 card:'This gap is exactly what the <strong>cash conversion</strong> row on a card measures. It is the single best check on whether the margin above it is real.',
 check:{q:'Profit and cash differ because:', opts:['Profit is recorded before cash arrives','Companies hide cash'], a:0}},

{id:'q-cash2', lvl:4, t:'Cash conversion',
 q:'A company converts 30% of its profit into cash. What should you think?',
 opts:['Most of the reported profit is not arriving as spendable money','It is very profitable','It has 30% margins','It pays 30% tax'], a:0,
 why:'Only 30p of every pound of reported profit is turning into cash. Either it is spending everything just to stand still, or the profits are more accounting than reality. Sustained low conversion is one of the most reliable warning signs there is.',
 card:'On a card, high margin with low conversion is a classic trap. The margin looks like quality and the conversion tells you it is not reaching the bank.',
 check:{q:'Low cash conversion means:', opts:['Reported profit is not becoming spendable cash','The company is growing fast'], a:0}},

{id:'q-fcf', lvl:4, t:'Free cash flow',
 q:'What is free cash flow?',
 opts:['Cash left after the business has paid to keep itself running','Total sales','Profit before tax','Cash held in the bank'], a:0,
 why:'Free cash flow is what remains after the company has paid for everything needed to keep operating — including replacing worn-out equipment. It is the money genuinely available to repay debt, buy back shares or survive a shock. It is the number that decides whether a business has choices.',
 card:'The finance course adds this to every card as margin multiplied by cash conversion. Two companies can show the same operating margin and completely different free cash flow.',
 check:{q:'Free cash flow is money available to:', opts:['Repay debt, or survive a shock','Pay the day-to-day wage bill'], a:0}},

{id:'q-cash3', lvl:4, t:'Going bust while profitable',
 q:'Can a profitable company run out of money and fail?',
 opts:['Yes — if the cash arrives later than the bills','No, profit protects it','Only if it is fraudulent','Only in a recession'], a:0,
 why:'It happens constantly, and fast-growing companies are the most exposed: every new order means paying for stock and wages now and collecting later. Profit on paper is no defence against a payment falling due today.',
 card:'It is why growth plus weak cash conversion plus debt is the most dangerous combination on a card — and why it often looks like the exciting company.',
 check:{q:'A profitable company can fail when:', opts:['Cash arrives later than the bills','It has too much cash'], a:0}},

/* ---------- 5. Valuation ---------- */
{id:'q-pe1', lvl:5, t:'What P/E means',
 q:'A company trades on a P/E of 20. What are you paying?',
 opts:['20 years of current profits for the whole company','20% of its value','20 times its revenue','20 pence per share'], a:0,
 why:'Price to earnings is the price divided by annual profit, so 20x means you are paying twenty years of profit at today’s rate. You are not expecting to wait twenty years — you are betting profits grow. The multiple is the market’s expectation written as a number.',
 card:'It is the price tag on the card. Every other number tells you what you are buying; this one tells you what it costs.',
 check:{q:'A P/E of 20 means:', opts:['Twenty years of current profits','Twenty percent annual return'], a:0}},

{id:'q-pe2', lvl:5, t:'Is cheap really cheap?',
 q:'A company trades on 6x while its rivals trade on 18x. What is the most useful first thought?',
 opts:['Ask what the market knows that makes it worth so much less','It is a bargain','It will rise to 18x','It is a mistake'], a:0,
 why:'A low multiple is a forecast, not a discount. The market is usually pricing something specific: a patent expiring, a shrinking core business, a regulator circling. Sometimes it is wrong — that is where money is made — but the question is always "what am I seeing that they are not", never "this is cheap".',
 card:'This is the difference between a value call and a trap. The other four numbers on the card exist to tell you which one you are looking at.',
 check:{q:'A very low multiple is usually:', opts:['The market pricing a known problem','A pricing error'], a:0}},

{id:'q-pe3', lvl:5, t:'Price against growth',
 q:'Two companies both trade on 15x. One grows 3% a year, the other 25%. Which is more expensive?',
 opts:['The one growing 3%','The one growing 25%','They cost the same','You cannot tell'], a:0,
 why:'The same multiple buys very different futures. In three years the fast grower has roughly doubled its profits and the same price now looks like about 8x; the slow one has barely moved. Identical price tags on different growth are not the same price.',
 card:'It is why the P/E row on a card can never be read on its own. Cheap relative to what is the entire question, and the growth row is half the answer.',
 check:{q:'The same P/E on faster growth is:', opts:['Effectively cheaper','Effectively dearer'], a:0}},

{id:'q-pe4', lvl:5, t:'Putting it together',
 q:'A company shows 40% growth, a 6% margin, 4.5x debt and 20% cash conversion. What is your first concern?',
 opts:['The growth is being funded by borrowing and is not turning into cash','That growth is superb','The margin is fine','There is nothing worrying'], a:0,
 why:'Each number alone is survivable. Together they describe a company growing quickly on borrowed money, keeping little of what it sells, and converting almost none of that into cash. The growth is real, and it is being paid for by lenders rather than by customers.',
 card:'Reading numbers together rather than one at a time is the whole skill. The card is designed so that any single metric can mislead you and the combination cannot.',
 check:{q:'The numbers should be read:', opts:['Together, as one picture','One at a time, best score wins'], a:0}}
];

/* ---------- economics ----------
   Meaningful early, marginal later, and worth almost nothing on a repeat. */
const TUTOR_BASE=()=>26+tutorLevel*6;      /* paid for working through the lesson */
const TUTOR_BONUS=()=>34+tutorLevel*10;    /* added for a correct first answer   */
const TUTOR_CHECK=()=>12+tutorLevel*4;     /* added for the comprehension check  */
const tutorCap=()=>420+tutorLevel*220;
const tutorSeenCount=id=>tutorSeen[id]||0;
const tutorDecay=id=>1/(1+tutorSeenCount(id)*0.7);
const tutorRoomLeft=()=>Math.max(0,tutorCap()-tutorEarnedMonth);

const tutorPool=()=>QUESTIONS.filter(q=>q.lvl<=tutorLevel);
function tutorPick(){
  const pool=tutorPool();
  /* prefer what you have seen least, so the bank is worked through rather than farmed */
  const min=Math.min(...pool.map(q=>tutorSeenCount(q.id)));
  const fresh=pool.filter(q=>tutorSeenCount(q.id)===min);
  return fresh[Math.floor(Math.random()*fresh.length)];
}
/* Mastery should look like repetition, not a sprint: 6, 8, 10 then 12 correct
   answers to work up the bands. It also keeps the monthly ceiling from jumping
   in the first month, when the early economy is deliberately tight. */
const tutorNeededForLevel=()=>4+tutorLevel*2;
function tutorMaybeLevel(){
  if(tutorLevel>=TUTOR_LEVELS.length) return false;
  if(tutorLevelCorrect<tutorNeededForLevel()) return false;
  tutorLevel++; tutorLevelCorrect=0; rep+=2;
  return true;
}

/* ---------- the room ---------- */
function roomTutor(){
  if(!tutorReg) return tutorRegisterScreen();
  const lv=TUTOR_LEVELS[tutorLevel-1];
  const soundNow=idx?Math.round((quad.gpgo+quad.gpbo)/idx*100):0;
  $('sheet').innerHTML=`<div class="roomhd"><h2>Tutoring</h2>
      <span class="sub">Level ${tutorLevel} · ${lv.n} · earned ${money(tutorEarnedMonth)} of ${money(tutorCap())} this month</span></div>
    <p class="note k">You are paid for working through the explanation, not for already knowing the
      answer. A wrong answer earns nearly as much as a right one, and teaches more. Repeating a
      question you have already done pays a fraction of it.</p>
    <div class="ledger">
      <div class="lr"><span>Level</span><span>${tutorLevel} of ${TUTOR_LEVELS.length} · ${lv.n}</span></div>
      <div class="lr"><span>Toward the next level</span><span>${tutorLevelCorrect} of ${tutorNeededForLevel()} correct</span></div>
      <div class="lr"><span>Questions worked</span><span>${tutorAnswered}</span></div>
      <div class="lr"><span>Room left this month</span><span class="${tutorRoomLeft()?'pos':'neg'}">${money(tutorRoomLeft())}</span></div>
      ${tutorStartSound!==null&&idx>0?`<div class="lr"><span>Your sound rate since you started teaching</span>
        <span class="${soundNow>=tutorStartSound?'pos':''}">${tutorStartSound}% → ${soundNow}%</span></div>`:''}
    </div>
    <p class="note">${lv.d}</p>
    <button class="btn" id="tqGo" ${tutorRoomLeft()>0?'':'disabled'}>${
      tutorRoomLeft()>0?'Take a question':'No paid slots left this month'}</button>
    ${tutorRoomLeft()>0?'':'<p class="note">You can still study for nothing — the explanations do not run out.</p>'}
    <button class="btn ghost" id="tqFree">Study without pay</button>
    <button class="btn ghost" id="tqOut">Leave</button>`;
  $('tqGo').addEventListener('click',()=>askQuestion(true));
  $('tqFree').addEventListener('click',()=>askQuestion(false));
  $('tqOut').addEventListener('click',leave);
  bindTerms();
}

function tutorRegisterScreen(){
  $('sheet').innerHTML=`<div class="roomhd"><h2>Register as a tutor</h2>
      <span class="sub">City Institute · evening work</span></div>
    <p class="note">The Institute needs people to take beginners through the basics of company
      accounts. It pays, and it is the only work in this city that makes you better at the thing you
      actually do all day.</p>
    <p class="note k">You are paid per lesson worked through, not per correct answer. That is
      deliberate: this is teaching, and the person who has to look something up has learned more
      than the person who already knew it.</p>
    <div class="ledger">
      <div class="lr"><span>Pay</span><span class="pos">about ${money(TUTOR_BASE()+TUTOR_BONUS()+TUTOR_CHECK())} a lesson at first</span></div>
      <div class="lr"><span>Monthly ceiling</span><span>${money(420+220)}, rising with your level</span></div>
      <div class="lr"><span>Repeat questions</span><span class="neg">pay a fraction</span></div>
      <div class="lr"><span>Cost to register</span><span>Nothing</span></div>
    </div>
    <button class="btn" id="tReg">Register</button>
    <button class="btn ghost" id="tRegOut">Not now</button>`;
  $('tReg').addEventListener('click',()=>{
    tutorReg=true;
    tutorStartSound=idx?Math.round((quad.gpgo+quad.gpbo)/idx*100):null;
    hud(); save(); roomTutor();
    toast('Registered. The Institute will send students.');
  });
  $('tRegOut').addEventListener('click',leave);
}

/* ---------- one lesson ---------- */
function askQuestion(paid){
  const q=tutorPick();
  tutorCurrent={q,paid,answered:null};
  $('sheet').innerHTML=`<div class="roomhd"><h2>${q.t}</h2>
      <span class="sub">Level ${q.lvl} · ${paid?'paid lesson':'study, unpaid'}</span></div>
    <p class="tq">${q.q}</p>
    <div class="tqopts">${q.opts.map((o,i)=>
      `<button class="tqo" data-i="${i}">${o}</button>`).join('')}</div>
    <p class="note k" style="margin-top:16px">Answer either way — the explanation comes next
      regardless, and that is the part that pays.</p>`;
  document.querySelectorAll('.tqo').forEach(el=>el.addEventListener('click',()=>
    explainAnswer(+el.dataset.i)));
  $('ov').scrollTop=0;
}

function explainAnswer(chosen){
  const {q,paid}=tutorCurrent;
  const right=chosen===q.a;
  tutorCurrent.answered=chosen; tutorCurrent.right=right;
  $('sheet').innerHTML=`<div class="roomhd"><h2>${q.t}</h2>
      <span class="sub">${right?'You had it':'Worth going through'}</span></div>
    <div class="verdict ${right?'ok':'no'}">
      <div class="vhd">${right?'Correct':'Not quite'}</div>
      <div class="vb"><strong>The answer is:</strong> ${q.opts[q.a]}
        ${right?'':`<br><span class="vyou">You said: ${q.opts[chosen]}</span>`}</div>
    </div>
    <section class="lesson">
      <div class="lhd">Why</div>
      <p>${q.why}</p>
      <div class="lhd">On a company card</div>
      <p>${q.card}</p>
    </section>
    <div class="step"><div class="steplbl"><span>One check, so it sticks</span></div>
      <p class="tq small">${q.check.q}</p>
      <div class="tqopts">${q.check.opts.map((o,i)=>
        `<button class="tqo" data-c="${i}">${o}</button>`).join('')}</div></div>`;
  document.querySelectorAll('.tqo[data-c]').forEach(el=>el.addEventListener('click',()=>
    finishLesson(+el.dataset.c)));
  $('ov').scrollTop=0;
}

function finishLesson(checkChosen){
  const {q,paid,right}=tutorCurrent;
  const checkRight=checkChosen===q.check.a;
  let paidOut=0;
  if(paid){
    const decay=tutorDecay(q.id);
    let gross=TUTOR_BASE()+(right?TUTOR_BONUS():0)+(checkRight?TUTOR_CHECK():0);
    gross=Math.round(gross*decay);
    paidOut=Math.min(gross,tutorRoomLeft());
    cash+=paidOut; tutorEarnedMonth+=paidOut;
  }
  tutorSeen[q.id]=tutorSeenCount(q.id)+1;
  tutorAnswered++;
  if(right) tutorLevelCorrect++;
  const levelled=tutorMaybeLevel();
  hud(); save();

  const repeat=tutorSeenCount(q.id)>1;
  $('sheet').innerHTML=`<div class="roomhd"><h2>Lesson done</h2>
      <span class="sub">${q.t}</span></div>
    <div class="lesson">
      <div class="lhd">${checkRight?'Check: right':'Check: the answer was — '+q.check.opts[q.check.a]}</div>
      <p>${checkRight?'That is the idea in one line. Keep it.'
        :'Worth re-reading the explanation above — that one line is the whole concept.'}</p>
    </div>
    ${paid?`<div class="ledger">
      <div class="lr"><span>Lesson worked</span><span class="pos">+${money(Math.round(TUTOR_BASE()*tutorDecay(q.id)))}</span></div>
      ${right?`<div class="lr"><span>Answer correct</span><span class="pos">+${money(Math.round(TUTOR_BONUS()*tutorDecay(q.id)))}</span></div>`:''}
      ${checkRight?`<div class="lr"><span>Check correct</span><span class="pos">+${money(Math.round(TUTOR_CHECK()*tutorDecay(q.id)))}</span></div>`:''}
      ${repeat?`<div class="lr"><span>Repeat question</span><span class="neg">×${tutorDecay(q.id).toFixed(2)}</span></div>`:''}
      <div class="lr"><span>Paid</span><span class="pos">+${money(paidOut)}</span></div>
      <div class="lr"><span>Left this month</span><span>${money(tutorRoomLeft())}</span></div>
    </div>`:`<p class="note">Studied for nothing. The explanation was the same.</p>`}
    ${levelled?`<p class="note k"><strong>Level ${tutorLevel} · ${TUTOR_LEVELS[tutorLevel-1].n}.</strong>
      ${TUTOR_LEVELS[tutorLevel-1].d} Harder questions, and the pay goes up with them.</p>`:''}
    <button class="btn" id="tNext" ${tutorRoomLeft()>0?'':'disabled'}>Another</button>
    <button class="btn ghost" id="tStudy">Another, unpaid</button>
    <button class="btn ghost" id="tDone">Back</button>`;
  if(levelled) moment('LEVEL '+tutorLevel,TUTOR_LEVELS[tutorLevel-1].n);
  $('tNext').addEventListener('click',()=>askQuestion(true));
  $('tStudy').addEventListener('click',()=>askQuestion(false));
  $('tDone').addEventListener('click',roomTutor);
  $('ov').scrollTop=0;
}
