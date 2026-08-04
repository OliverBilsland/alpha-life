/* ---------- payday ---------- */
function payday(){
  inRoom='payday';$('exitBtn').classList.remove('on');enterRoom();
  const inc=income(),exp=expenses();
  cash+=inc-exp;
  if(appLeft>0){appLeft--;if(appLeft===0)appLive=true;}
  if(arc===2) fundMonthEnd();
  wearCar();
  lastReview=runReview();
  let forced=0;
  if(cash<0){
    forced=-cash;
    /* liquidate the portfolio, then property, then admit it */
    const fromPort=Math.min(forced,Math.max(0,port));
    port-=fromPort; cash=0;
    const short=forced-fromPort;
    if(short>0){
      if(homeTier>0&&home().own){
        /* the equity must be released BEFORE the tier drops, or it evaporates */
        const released=homeEquity();
        homeTier=1;
        cash=Math.max(0,released-short);
        if(released<short) bankrupt=true;
      } else bankrupt=true;
    }
  }
  renderPayday(inc,exp,forced);
}
function renderPayday(inc,exp,forced){
  /* ENDLESS: the only ending is bankruptcy. Month four hands you the outside-
     capital offer if you have earned it, and a fund closing puts you back on the
     desk rather than ending the run. */
  const last = bankrupt;
  const offer = arc===1 && month>=MONTHS && !offerMade && fundEligible();
  $('sheet').innerHTML=`<div class="roomhd"><h2>Month ${month} closed</h2><span class="sub">${offer?'Bills, then an approach':last?'Final settlement':'Bills, then back out'}</span></div>
    ${bankrupt?`<p class="note" style="color:var(--loss)"><strong>You ran out of money.</strong>
      Expenses exceeded everything you could sell. The lifestyle was not the mistake on its own —
      it was the lifestyle plus the monthly commitments that arrive whether or not the market
      cooperated.</p>`:''}
    ${arc===2?teachOnce('aum','mgmtfee')+teachOnce('perffee','redemption'):''}
    ${teachOnce('drawdown')}
    ${chapterTurnHTML()}
    ${reviewNoteHTML()}
    ${fundNoteHTML()}
    ${forced?`<p class="note" style="color:var(--warn)">Expenses exceeded cash. ${money(forced)} was liquidated from the portfolio to cover the gap \u2014 the most expensive way to fund a lifestyle.</p>`:''}
    ${cashflowHTML(inc,exp,forced)}
    <div class="ledger">
      <div class="lr"><span>Trading P&amp;L</span><span class="${monthPnl>=0?'pos':'neg'}">${monthPnl>=0?'+':''}${money(monthPnl)}</span></div>
      ${arc===2?fundLedgerHTML():`<div class="lr"><span>Salary · ${job().n}</span><span class="pos">+${money(jobPay())}</span></div>`}
      ${appLive?`<div class="lr"><span>App revenue</span><span class="pos">+${money(700)}</span></div>`:''}
      ${appLeft>0?`<div class="lr"><span>App in build</span><span>${appLeft} mo left</span></div>`:''}
      <div class="lr"><span>Rent${owned.apt?' (upgraded)':''}</span><span class="neg">\u2212${money(rent+(owned.apt?600:0))}</span></div>
      ${owned.car?`<div class="lr"><span>Car running costs</span><span class="neg">\u2212${money(150)}</span></div>`:''}
      ${debt?`<div class="lr"><span>Interest on ${money(debt)} drawn</span><span class="neg">−${money(debtService())}</span></div>`:''}
      <div class="lr"><span>Income tax</span><span class="neg">−${money(incomeTax())}</span></div>
      <div class="lr"><span>Cash</span><span>${money(cash)}</span></div>
    </div>
    <div class="steplbl"><span>Move money</span><em>Position size scales with portfolio</em></div>
    <div class="rrow">
      ${[500,2000,5000].map(v=>`<button class="rbtn" data-r="${v}" ${cash<v?'disabled':''}>Invest ${money(v)}</button>`).join('')}
      <button class="rbtn" data-r="all" ${cash<100?'disabled':''}>Invest all cash</button>
      <button class="rbtn" data-w="2000" ${port<2000?'disabled':''}>Withdraw $2,000</button>
    </div>
    <button class="btn" id="ok">${offer?'See who has been reading your work'
      :last?'See where you ended up'
      :(arc===2&&fundClosed)?'Face the investors'
      :'Start month '+(month+1)}</button>`;
  document.querySelectorAll('.rbtn[data-r]').forEach(el=>el.addEventListener('click',()=>{
    const v=el.dataset.r==='all'?cash:+el.dataset.r;if(cash<v)return;cash-=v;port+=v;hud();renderPayday(inc,exp,0);}));
  document.querySelectorAll('.rbtn[data-w]').forEach(el=>el.addEventListener('click',()=>{
    const v=+el.dataset.w;if(port<v)return;port-=v;cash+=v;hud();renderPayday(inc,exp,0);}));
  $('ok').addEventListener('click',()=>{
    if(offer){offerMade=true;roomFundOffer();return;}
    if(last){finish();return;}
    if(arc===2&&fundClosed){closeFund();return;}
    month++;sessionsLeft=ROUNDS_PER_MONTH;monthPnl=0;
    stepPropertyMarket();
    tips=tips.filter(t=>t.i>=idx);
    owned.rateread=false;
    research=researchPerMonth();gymMonth=false;floorMonth=false;
    inRoom=null;$('ov').classList.remove('on');
    P.x=330;P.y=470;hud();toast('Month '+month+'. Five sessions.');
  });
  hud();
}

function finish(){
  if(bankrupt){bankruptFinish();return;}
  if(arc===2){fundFinish();return;}
  gameOver=true;
  const sound=quad.gpgo+quad.gpbo,lucky=quad.bpgo,net=netWorth();
  const bought=Object.keys(owned).map(k=>ITEMS[k]?ITEMS[k].n:k);
  if(carTier>0) bought.push(CARS[carTier].n);
  if(homeTier>0) bought.push(HOMES[homeTier].n);
  if(appLive||appLeft>0)bought.push('Side app');
  let v;
  if(sound>=14)v='You read the businesses correctly most of the time. That is the skill the game exists to build \u2014 the money follows it eventually, not reliably.';
  else if(sound>=9)v='Roughly coin-flip on process. Check which axis you kept citing \u2014 most people default to growth or valuation and miss the balance-sheet calls entirely.';
  else v='Process was weak. Worth asking whether you picked the company that looked cheap, or the one that was actually better.';
  $('sheet').innerHTML=`<div class="roomhd"><h2>Four months later</h2><span class="sub">Final</span></div>
    <div class="ledger">
      <div class="lr"><span>Portfolio</span><span>${money(port)}</span></div>
      <div class="lr"><span>Cash</span><span>${money(cash)}</span></div>
      <div class="lr"><span>Max drawdown</span><span>${(maxDD*100).toFixed(1)}%</span></div>
      <div class="lr"><span>Sound decisions</span><span>${sound} of ${idx}</span></div>
      <div class="lr"><span>Right for wrong reasons</span><span>${lucky}</span></div>
      <div class="lr"><span>Net worth</span><span>${money(net)}</span></div>
    </div>
    <p class="note"><strong>Bought:</strong> ${bought.length?bought.join(', '):'nothing \u2014 you ran the whole game frugal'}</p>
    <p class="note">${v}</p>
    <p class="note k">The question this build exists to answer: did driving to the club feel like part of the game, or like a menu with a map on top? If the world is doing work, you should remember the drive after you bought the car.</p>
    <button class="btn" onclick="newGame()">Play again</button>`;
  $('exitBtn').classList.remove('on');
}

function bankruptFinish(){
  gameOver=true;
  const sound=quad.gpgo+quad.gpbo;
  $('sheet').innerHTML=`<div class="roomhd"><h2>Out of money</h2>
      <span class="sub">Month ${month} · ${job().n}</span></div>
    <div class="ledger">
      <div class="lr"><span>Portfolio</span><span>${money(Math.max(0,port))}</span></div>
      <div class="lr"><span>Cash</span><span>${money(Math.max(0,cash))}</span></div>
      <div class="lr"><span>Owed</span><span class="neg">${money(debt)}</span></div>
      <div class="lr"><span>Monthly commitments</span><span class="neg">−${money(expenses())}</span></div>
      <div class="lr"><span>Sound decisions</span><span>${sound} of ${idx}</span></div>
    </div>
    <p class="note">The bills arrived and there was nothing left to sell. Cars, property and credit
      all bill monthly; only the portfolio compounds, and it is the first thing sold to cover them.</p>
    <p class="note k">${sound>=idx*0.5
      ? 'Worth being clear about what failed. The calls were mostly defensible — the balance sheet was not. Those are different mistakes and only one of them is about reading businesses.'
      : 'Both halves went wrong: the reading and the arithmetic. The reading is the one the game can teach.'}</p>
    <button class="btn" onclick="newGame()">Play again</button>`;
  $('exitBtn').classList.remove('on');
  $('ov').classList.add('on');
}
