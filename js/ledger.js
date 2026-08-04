/* ---------- payday ---------- */
function payday(){
  inRoom='payday';$('exitBtn').classList.remove('on');
  const inc=income(),exp=expenses();
  cash+=inc-exp;
  if(appLeft>0){appLeft--;if(appLeft===0)appLive=true;}
  if(arc===2) fundMonthEnd();
  let forced=0;
  if(cash<0){forced=-cash;port-=forced;cash=0;}
  renderPayday(inc,exp,forced);
}
function renderPayday(inc,exp,forced){
  const last = arc===2 ? (month>=ARC2_END_MONTH||fundClosed) : month>=MONTHS;
  const offer = arc===1 && last && fundEligible();
  $('sheet').innerHTML=`<div class="roomhd"><h2>Month ${month} closed</h2><span class="sub">${offer?'Bills, then an approach':last?'Final settlement':'Bills, then back out'}</span></div>
    ${fundNoteHTML()}
    ${forced?`<p class="note" style="color:var(--warn)">Expenses exceeded cash. ${money(forced)} was liquidated from the portfolio to cover the gap \u2014 the most expensive way to fund a lifestyle.</p>`:''}
    <div class="ledger">
      <div class="lr"><span>Trading P&amp;L</span><span class="${monthPnl>=0?'pos':'neg'}">${monthPnl>=0?'+':''}${money(monthPnl)}</span></div>
      ${arc===2?fundLedgerHTML():`<div class="lr"><span>Salary${owned.car?' (analyst role)':''}</span><span class="pos">+${money(salary+(owned.car?1800:0))}</span></div>`}
      ${appLive?`<div class="lr"><span>App revenue</span><span class="pos">+${money(700)}</span></div>`:''}
      ${appLeft>0?`<div class="lr"><span>App in build</span><span>${appLeft} mo left</span></div>`:''}
      <div class="lr"><span>Rent${owned.apt?' (upgraded)':''}</span><span class="neg">\u2212${money(rent+(owned.apt?600:0))}</span></div>
      ${owned.car?`<div class="lr"><span>Car running costs</span><span class="neg">\u2212${money(150)}</span></div>`:''}
      <div class="lr"><span>Cash</span><span>${money(cash)}</span></div>
    </div>
    <div class="steplbl"><span>Move money</span><em>Position size scales with portfolio</em></div>
    <div class="rrow">
      ${[500,2000,5000].map(v=>`<button class="rbtn" data-r="${v}" ${cash<v?'disabled':''}>Invest ${money(v)}</button>`).join('')}
      <button class="rbtn" data-r="all" ${cash<100?'disabled':''}>Invest all cash</button>
      <button class="rbtn" data-w="2000" ${port<2000?'disabled':''}>Withdraw $2,000</button>
    </div>
    <button class="btn" id="ok">${offer?'See who has been reading your work':last?'See where you ended up':'Start month '+(month+1)}</button>`;
  document.querySelectorAll('.rbtn[data-r]').forEach(el=>el.addEventListener('click',()=>{
    const v=el.dataset.r==='all'?cash:+el.dataset.r;if(cash<v)return;cash-=v;port+=v;hud();renderPayday(inc,exp,0);}));
  document.querySelectorAll('.rbtn[data-w]').forEach(el=>el.addEventListener('click',()=>{
    const v=+el.dataset.w;if(port<v)return;port-=v;cash+=v;hud();renderPayday(inc,exp,0);}));
  $('ok').addEventListener('click',()=>{
    if(offer){roomFundOffer();return;}
    if(last){finish();return;}
    month++;sessionsLeft=ROUNDS_PER_MONTH;monthPnl=0;
    trips=tripsPerMonth();research=researchPerMonth();
    inRoom=null;$('ov').classList.remove('on');
    P.x=330;P.y=470;hud();toast('Month '+month+'. Five sessions.');
  });
  hud();
}

function finish(){
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
