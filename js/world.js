/* ==================== WORLD ====================
   Five districts across a 4200x2400 city. The outer three are gated by car
   tier: districtAt() feeds blocked(), so an ungated district is physically
   unreachable rather than merely discouraged.

   Old Town and Midtown are both open on foot. Midtown holds the dealership, so
   gating it behind a car was a chicken-and-egg -- you could not go and look at
   cars until you already owned one. */
const W=4200,H=2400;

const DISTRICTS=[
 {id:'old',    x0:0,    x1:1180, req:0, n:'OLD TOWN',    c:'#1D2126'},
 {id:'mid',    x0:1180, x1:2180, req:0, n:'MIDTOWN',     c:'#1E242B'},
 /* req is a car TIER, not a price. The ladder in cars.js grew, so these moved
    to keep the money identical: the Heights still costs about 19k to reach,
    Harbour 62k, the Coast 185k. The new cars sit BETWEEN the gates rather than
    in front of them, so the economy is untouched and there is simply more to
    buy on the way. */
 {id:'heights',x0:2180, x1:3080, req:3, n:'THE HEIGHTS', c:'#20262E'},
 {id:'harbour',x0:3080, x1:3760, req:5, n:'HARBOUR',     c:'#1C2429'},
 {id:'coast',  x0:3760, x1:4200, req:7, n:'THE COAST',   c:'#22282C'}
];
const districtAt=x=>DISTRICTS.find(d=>x>=d.x0&&x<d.x1)||DISTRICTS[0];

/* ---------- what a place is, as a shape and a colour ----------
   Every building carries a `k`. It drives the pictogram over the door, the
   colour of the door plaque, and the dot on the minimap — the same mark in all
   three places, so a building is identified once and recognised everywhere
   after that. The point is that you can cross the city and know what you are
   looking at without reading a single sign.

   Nine kinds, not twenty: a legend you cannot hold in your head is a legend you
   read every time, which is the thing being removed. */
const KINDS={
  desk:   {c:'#6FA8FF', n:'Trading desk'},
  home:   {c:'#E8A33D', n:'Where you live'},
  money:  {c:'#4FD1A5', n:'Money and credit'},
  learn:  {c:'#B58BFF', n:'Learn something'},
  social: {c:'#FF7BA8', n:'People and contacts'},
  work:   {c:'#7FD0E8', n:'Work for money'},
  car:    {c:'#FFD166', n:'Cars'},
  body:   {c:'#8FE07A', n:'Health and focus'},
  status: {c:'#D98BFF', n:'Status and access'}
};

/* ---------- the layout ----------
   Buildings used to sit wherever they landed, which meant the only way to know
   where anything was, was to have been there. They are now on a grid with a
   rule you can feel without being told it:

     NORTH  row (y 170)   money coming in   -- your desk, employers, the market
     MIDDLE row (y 690)   money moving      -- banks, courses, leasing, cars
     SOUTH  rows (y 1290, 1600)  your life  -- home, gym, bars, clubs

   Every district repeats the same three bands, so "the bank is in the middle
   row" is true in Midtown and in Harbour. Columns sit in the gaps between the
   vertical roads, so every door opens onto a road rather than onto the back of
   something else, and nothing needs to be squeezed past.

   Anything moved here must stay clear of ROADS below: horizontal at y 500,
   1120 and 1830, each 110 deep. */
const B=[
 /* ---- Old Town: live, work, learn, unwind. The whole opening arc, on foot ---- */
 {id:'apt',    x:90,  y:180, w:260,h:200,n:'APARTMENT 4B',   s:'Home',c:'#4A4036',k:'home'},
 {id:'office', x:620, y:170, w:380,h:230,n:'ARDENT CAPITAL', s:'Your desk',c:'#2B3A4F',k:'desk'},
 {id:'realtor',x:100, y:690, w:250,h:190,n:'HALE PROPERTY',  s:'Leasing',c:'#4A4453',k:'home'},
 {id:'school', x:620, y:690, w:330,h:220,n:'CITY INSTITUTE', s:'Courses',c:'#33454A',k:'learn'},
 {id:'gym',    x:100, y:1290,w:230,h:190,n:'THE YARD',       s:'Gym',c:'#3D4A3C',k:'body'},
 {id:'board',  x:620, y:1290,w:250,h:190,n:'THE NOTICE',     s:'What is on',c:'#2E4658',k:'learn'},
 {id:'bar',    x:100, y:1600,w:240,h:180,n:'THE LONG ROOM',  s:'Bar',c:'#5A3A32',k:'social'},
 {id:'rest',   x:620, y:1600,w:250,h:180,n:"BRUNO'S",        s:'Dining',c:'#7A4030',k:'social'},

 /* ---- Midtown: cars, employers, credit ---- */
 {id:'dealer', x:1210,y:170, w:340,h:220,n:'VOSS MOTORS',    s:'Cars',c:'#3A4A3E',k:'car'},
 {id:'tech',   x:1830,y:180, w:240,h:200,n:'BYTE WORKS',     s:'Dev studio',c:'#2E4440',k:'work'},
 {id:'bank',   x:1210,y:690, w:300,h:210,n:'MERIDIAN BANK',  s:'Credit',c:'#2F3B4A',k:'money'},
 {id:'recruit',x:1830,y:690, w:240,h:200,n:'HOLBROOK & CO',  s:'Recruiters',c:'#453A4E',k:'work'},

 /* ---- The Heights: status, networking, desk access ---- */
 {id:'prime',  x:2210,y:180, w:280,h:200,n:'PRIME BROKERAGE',s:'Desk access',c:'#25404A',k:'desk'},
 {id:'club',   x:2730,y:180, w:240,h:210,n:'MERIDIAN CLUB',  s:'Members only',c:'#3E2C46',k:'status'},
 {id:'rostrum',x:2210,y:1290,w:300,h:200,n:'THE ROSTRUM',    s:'Benefit galas',c:'#4B3B2E',k:'status'},
 {id:'annex',  x:2730,y:1290,w:240,h:200,n:'THE ANNEX',      s:'Nightclub',c:'#5A2C4E',k:'social'},

 /* ---- Harbour: the professional end of the market ---- */
 {id:'floor',  x:3120,y:180, w:320,h:220,n:'THE FLOOR',      s:'Exchange',c:'#2A3D3A',k:'desk'},
 {id:'pbank',  x:3120,y:690, w:300,h:210,n:'CAVENDISH TRUST',s:'Private bank',c:'#37384A',k:'money'},

 /* ---- The Coast: nothing is earned here, only spent ---- */
 {id:'estates', x:3760,y:690, w:250,h:220,n:'COAST PROPERTY',s:'Estates',c:'#4A4443',k:'home'},
 {id:'headland',x:3760,y:1290,w:250,h:200,n:'THE HEADLAND',  s:'Private club',c:'#42304A',k:'status'}
];
const kindOf=b=>KINDS[b&&b.k]||KINDS.desk;

const ROADS=[
 {x:0,y:500,w:W,h:110},{x:0,y:1120,w:W,h:110},{x:0,y:1830,w:W,h:110},
 {x:470,y:0,w:110,h:H},{x:1080,y:0,w:110,h:H},{x:1700,y:0,w:110,h:H},
 {x:2080,y:0,w:110,h:H},{x:2600,y:0,w:110,h:H},{x:2980,y:0,w:110,h:H},
 {x:3620,y:0,w:110,h:H},{x:4020,y:0,w:110,h:H}
];
