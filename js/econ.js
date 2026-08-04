/* ==================== ECONOMY ====================
   One home for the cross-cutting money maths, so no single system can quietly
   change what another one charges. Each category adds its line here; HOMES and
   JOBS are placeholders until housing.js and careers.js land, and reproduce the
   pre-expansion balance exactly. */

const HOMES=[
 {n:'Apartment 4B',     rent:1200, tax:0, maint:0},
 {n:'Better apartment', rent:1800, tax:0, maint:0}
];
const JOBS=[
 {n:'Junior analyst', pay:2400},
 {n:'Analyst',        pay:4200}   /* 2400 + the old car bonus of 1800 */
];

function housingMonthly(){
  const h=HOMES[Math.min(homeTier,HOMES.length-1)];
  return h.rent+h.tax+h.maint;
}
function jobPay(){
  return arc===2 ? 0 : JOBS[Math.min(careerStage,JOBS.length-1)].pay;
}
function researchPerMonth(){ return 0; }   /* housing.js grants these */

const fixedCosts=()=>housingMonthly()+carMonthly();
