/* ==================== ECONOMY ====================
   One home for the cross-cutting money maths, so no single system can quietly
   change what another one charges. Each category adds its line here; HOMES and
   JOBS are placeholders until housing.js and careers.js land, and reproduce the
   pre-expansion balance exactly. */



const fixedCosts=()=>housingMonthly()+carMonthly()+debtService();
const netWorth=()=>port+cash+homeEquity()-debt;
