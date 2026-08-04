/* ==================== ECONOMY ====================
   One home for the cross-cutting money maths, so no single system can quietly
   change what another one charges. Each category adds its line here; HOMES and
   JOBS are placeholders until housing.js and careers.js land, and reproduce the
   pre-expansion balance exactly. */



/* Progressive monthly tax on earned income. The portfolio is untaxed while it
   compounds, which is deliberate: it makes trading matter more the richer you
   get, and stops a big salary from flattening the whole ladder. */
const TAX_BANDS=[[3000,0.10],[8000,0.24],[20000,0.35],[Infinity,0.42]];
function incomeTax(){
  let gross=jobPay()+(arc===2?fundFee():0), last=0, tax=0;
  for(const [cap,rate] of TAX_BANDS){
    if(gross<=last) break;
    tax+=(Math.min(gross,cap)-last)*rate; last=cap;
  }
  return Math.round(tax);
}
const fixedCosts=()=>housingMonthly()+livingCosts()+carMonthly()+debtService()+incomeTax();
const netWorth=()=>port+cash+homeEquity()-debt;
