/* ==================== WORLD ==================== */
const W=2000,H=1500;
const B=[
 {id:'office', x:820, y:120, w:360,h:230,n:'ARDENT CAPITAL',s:'Your desk',c:'#2B3A4F'},
 {id:'apt',    x:150, y:170, w:250,h:200,n:'APARTMENT 4B',s:'Home',c:'#4A4036'},
 {id:'bar',    x:170, y:900, w:230,h:170,n:'THE LONG ROOM',s:'Bar',c:'#5A3A32'},
 {id:'club',   x:1520,y:960, w:290,h:210,n:'MERIDIAN CLUB',s:'Members only',c:'#3E2C46'},
 {id:'dealer', x:1500,y:180, w:320,h:200,n:'VOSS MOTORS',s:'Used cars',c:'#3A4A3E'},
 {id:'school', x:760, y:940, w:330,h:220,n:'CITY INSTITUTE',s:'Courses',c:'#33454A'},
 {id:'realtor',x:200, y:560, w:220,h:150,n:'HALE PROPERTY',s:'Leasing',c:'#4A4453'},
 {id:'tech',   x:1540,y:570, w:250,h:170,n:'BYTE WORKS',s:'Dev studio',c:'#2E4440'},
];
const ROADS=[
 {x:0,y:430,w:W,h:110},{x:0,y:790,w:W,h:110},{x:0,y:1210,w:W,h:110},
 {x:470,y:0,w:110,h:H},{x:1200,y:0,w:110,h:H},{x:1860,y:0,w:110,h:H}
];
