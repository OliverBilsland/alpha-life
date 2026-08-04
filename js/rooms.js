/* ==================== ROOMS ==================== */
function enter(b){
  inRoom=b.id; $('ov').classList.add('on'); $('exitBtn').classList.add('on');
  $('prompt').classList.remove('on');
  if(b.id==='office') roomOffice();
  else if(b.id==='apt') roomApt();
  else if(b.id==='bar') roomVenue('THE LONG ROOM','Bar',80,2,'A quiet drink and an hour not thinking about the market. Cheap, partial.');
  else if(b.id==='club') roomVenue('MERIDIAN CLUB','Members only',250,5,'Loud, expensive, and full of people who allocate capital. Full focus.');
  else if(b.id==='dealer') roomShop('VOSS MOTORS','Used cars',['car']);
  else if(b.id==='school') roomShop('CITY INSTITUTE','Courses',['acct','term']);
  else if(b.id==='realtor') roomShop('HALE PROPERTY','Leasing',['apt']);
  else if(b.id==='tech') roomShop('BYTE WORKS','Dev studio',['app']);
}
function leave(){
  inRoom=null;$('ov').classList.remove('on');$('exitBtn').classList.remove('on');
  P.y+=30; hud();
}
$('exitBtn').addEventListener('click',()=>{if(inRoom!=='payday')leave();});

function roomShop(title,sub,ids){
  $('sheet').innerHTML=`<div class="roomhd"><h2>${title}</h2><span class="sub">${sub} \u00b7 cash ${money(cash)}</span></div>
    <div class="items">${ids.map(k=>{const it=ITEMS[k];
      const own=owned[k]||(k==='app'&&(appLive||appLeft>0));
      const dis=own||cash<it.cost;
      return `<button class="item ${own?'owned':''}" data-k="${k}" ${dis?'disabled':''}>
        <div class="nm"><span>${it.n}</span><span class="pr">${own?(k==='app'&&appLeft>0?'BUILDING':'OWNED'):money(it.cost)}</span></div>
        <div class="ef">${it.ef}</div></button>`}).join('')}</div>
    <p class="note" style="margin-top:18px">${cash<Math.min(...ids.map(k=>ITEMS[k].cost))?'Not enough cash. The portfolio is where the money is \u2014 but selling it to buy things is how people stay poor while looking rich.':'Cash spent here leaves the portfolio permanently smaller than it would have been.'}</p>`;
  document.querySelectorAll('.item:not([disabled])').forEach(el=>el.addEventListener('click',()=>{
    const k=el.dataset.k,it=ITEMS[k];
    if(cash<it.cost)return; cash-=it.cost;
    if(k==='app'){appLeft=3;} else {owned[k]=true;}
    if(k==='car'){P.driving=true;toast('You bought the car. Everything just got closer.');}
    if(k==='acct')toast('Cash conversion now shows on every card.');
    if(k==='term')toast('Terminal installed. You can see the crowd now.');
    if(k==='apt')toast('You moved. Focus will hold longer.');
    if(k==='app')toast('Build started. Three months to revenue.');
    hud();roomShop(title,sub,ids);
  }));
}

function roomVenue(title,sub,cost,gain,copy){
  const can=cash>=cost;
  $('sheet').innerHTML=`<div class="roomhd"><h2>${title}</h2><span class="sub">${sub} \u00b7 cash ${money(cash)}</span></div>
    <p class="note">${copy}</p>
    <p class="note">Focus is at <strong>${focus}</strong>. Below 3, you start missing metrics on the cards \u2014 you read the same companies with less information.</p>
    <button class="btn" id="buy" ${can?'':'disabled'}>${can?`Stay a while \u00b7 ${money(cost)}`:'Not enough cash'}</button>
    <p class="note k" style="margin-top:18px">This is consumption. It buys you nothing you can sell. It is also the only way to keep reading five metrics instead of three \u2014 which is the argument for spending money on yourself, made honestly.</p>`;
  if(can)$('buy').addEventListener('click',()=>{
    cash-=cost; focus=Math.min(5,focus+gain); hud();
    toast(gain>=5?'Focus restored.':'Focus +'+gain);
    leave();
  });
}

function roomApt(){
  $('sheet').innerHTML=`<div class="roomhd"><h2>APARTMENT 4B</h2><span class="sub">${owned.apt?'Upgraded':'Rent '+money(rent)+'/mo'}</span></div>
    <p class="note">${sessionsLeft>0?`You still have <strong>${sessionsLeft}</strong> trading session${sessionsLeft>1?'s':''} this month. Sleeping now forfeits them.`:'The month is done. Sleep, and the bills come due.'}</p>
    <div class="ledger">
      <div class="lr"><span>Portfolio</span><span>${money(port)}</span></div>
      <div class="lr"><span>Cash</span><span>${money(cash)}</span></div>
      <div class="lr"><span>Monthly income</span><span class="pos">+${money(income())}</span></div>
      <div class="lr"><span>Monthly expenses</span><span class="neg">\u2212${money(expenses())}</span></div>
      <div class="lr"><span>Net monthly</span><span class="${income()-expenses()>=0?'pos':'neg'}">${income()-expenses()>=0?'+':''}${money(income()-expenses())}</span></div>
    </div>
    <button class="btn" id="sleep">${sessionsLeft>0?'Sleep anyway \u2014 end month '+month:'End month '+month}</button>
    <button class="btn ghost" id="stay">Back out</button>`;
  $('sleep').addEventListener('click',payday);
  $('stay').addEventListener('click',leave);
}
