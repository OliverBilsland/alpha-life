/* ==================== ECONOMY ====================
   One home for the cross-cutting money maths, so no single system can quietly
   change what another one charges. Each category adds its line here; HOMES and
   JOBS are placeholders until housing.js and careers.js land, and reproduce the
   pre-expansion balance exactly. */

const JOBS=[
 {n:'Junior analyst', pay:2400},
 {n:'Analyst',        pay:4200}   /* 2400 + the old car bonus of 1800 */
];

function jobPay(){
  return arc===2 ? 0 : JOBS[Math.min(careerStage,JOBS.length-1)].pay;
}

const fixedCosts=()=>housingMonthly()+carMonthly();
const netWorth=()=>port+cash+homeEquity();
