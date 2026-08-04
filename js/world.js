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
 {id:'heights',x0:2180, x1:3080, req:2, n:'THE HEIGHTS', c:'#20262E'},
 {id:'harbour',x0:3080, x1:3760, req:3, n:'HARBOUR',     c:'#1C2429'},
 {id:'coast',  x0:3760, x1:4200, req:4, n:'THE COAST',   c:'#22282C'}
];
const districtAt=x=>DISTRICTS.find(d=>x>=d.x0&&x<d.x1)||DISTRICTS[0];

const B=[
 /* ---- Old Town: everything the opening arc needs, on foot ---- */
 {id:'office', x:760, y:150, w:360,h:230,n:'ARDENT CAPITAL', s:'Your desk',c:'#2B3A4F'},
 {id:'apt',    x:150, y:190, w:250,h:200,n:'APARTMENT 4B',   s:'Home',c:'#4A4036'},
 {id:'bar',    x:170, y:1500,w:230,h:170,n:'THE LONG ROOM',  s:'Bar',c:'#5A3A32'},
 {id:'school', x:700, y:1540,w:330,h:220,n:'CITY INSTITUTE', s:'Courses',c:'#33454A'},
 {id:'realtor',x:200, y:880, w:220,h:150,n:'HALE PROPERTY',  s:'Leasing',c:'#4A4453'},
 {id:'gym',    x:790, y:880, w:210,h:150,n:'THE YARD',       s:'Gym',c:'#3D4A3C'},
 {id:'rest',   x:430, y:1500,w:230,h:170,n:"BRUNO'S",        s:'Dining',c:'#7A4030'},
 {id:'board',  x:1120,y:880, w:230,h:150,n:'THE NOTICE',     s:'What is on',c:'#2E4658'},

 /* ---- Midtown: cars, employers, credit ---- */
 {id:'dealer', x:1290,y:220, w:340,h:210,n:'VOSS MOTORS',    s:'Cars',c:'#3A4A3E'},
 {id:'tech',   x:1830,y:230, w:250,h:180,n:'BYTE WORKS',     s:'Dev studio',c:'#2E4440'},
 {id:'bank',   x:1290,y:1220,w:300,h:200,n:'MERIDIAN BANK',  s:'Credit',c:'#2F3B4A'},
 {id:'recruit',x:1830,y:1250,w:280,h:190,n:'HOLBROOK & CO',  s:'Recruiters',c:'#453A4E'},

 /* ---- The Heights: status, networking, desk access ---- */
 {id:'club',   x:2260,y:250, w:290,h:210,n:'MERIDIAN CLUB',  s:'Members only',c:'#3E2C46'},
 {id:'annex',  x:2660,y:250, w:300,h:200,n:'THE ANNEX',      s:'Nightclub',c:'#5A2C4E'},
 {id:'prime',  x:2250,y:1250,w:280,h:190,n:'PRIME BROKERAGE',s:'Desk access',c:'#25404A'},
 {id:'rostrum',x:2720,y:1250,w:300,h:200,n:'THE ROSTRUM',    s:'Benefit galas',c:'#4B3B2E'},

 /* ---- Harbour: the professional end of the market ---- */
 {id:'floor',  x:3160,y:280, w:320,h:220,n:'THE FLOOR',      s:'Exchange',c:'#2A3D3A'},
 {id:'pbank',  x:3180,y:1350,w:290,h:200,n:'CAVENDISH TRUST',s:'Private bank',c:'#37384A'},

 /* ---- The Coast ---- */
 {id:'estates', x:3820,y:660, w:300,h:230,n:'COAST PROPERTY',s:'Estates',c:'#4A4443'},
 {id:'headland',x:3820,y:1560,w:300,h:210,n:'THE HEADLAND',  s:'Private club',c:'#42304A'}
];

const ROADS=[
 {x:0,y:500,w:W,h:110},{x:0,y:1120,w:W,h:110},{x:0,y:1830,w:W,h:110},
 {x:470,y:0,w:110,h:H},{x:1080,y:0,w:110,h:H},{x:1700,y:0,w:110,h:H},
 {x:2080,y:0,w:110,h:H},{x:2600,y:0,w:110,h:H},{x:2980,y:0,w:110,h:H},
 {x:3620,y:0,w:110,h:H},{x:4020,y:0,w:110,h:H}
];
