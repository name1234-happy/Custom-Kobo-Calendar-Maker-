const $=id=>document.getElementById(id);
const S={year:2026,start:1,width:1264,height:1680,ppi:227,unit:"px",bg:"#F4F7FB",accent:"#1479FF",monthly:true,weekly:true,daily:true,retro:true,pages:true,happening:true,next:true,view:"month",special:[],holidayColor:"#FF4D5A",eventColor:"#1479FF",weekSections:["What's happening","Goals","To-do","Reading"],retroSections:["Books finished","Pages read","Favourite book","Best quote / idea","What I enjoyed","Next month"]};
const weekDefaults=["What's happening","Goals","To-do","Reading"],retroDefaults=["Books finished","Pages read","Favourite book","Best quote / idea","What I enjoyed","Next month"];
function opts(id,arr){$(id).innerHTML=arr.map((x,i)=>`<label class=option><input type=checkbox data-group="${id}" data-i="${i}" checked> ${x}</label>`).join("")}
opts("weekOptions",S.weekSections);opts("retroOptions",S.retroSections);
function read(){["year","start","width","height","ppi","unit","bg","accent","monthly","weekly","daily","retro","pages","happening","next"].forEach(k=>{let e=$(k);S[k]=e.type==="checkbox"?e.checked:e.value});S.weekSections=[...document.querySelectorAll('#weekOptions input:checked')].map(e=>weekDefaults[+e.dataset.i]);S.retroSections=[...document.querySelectorAll('#retroOptions input:checked')].map(e=>retroDefaults[+e.dataset.i]);S.holidayColor=$("holidayColor").value;S.eventColor=$("eventColor").value}
function syncForm(){
  for(const k of ["year","start","width","height","ppi","unit","bg","accent"]){if($(k))$(k).value=S[k]}
  for(const k of ["monthly","weekly","daily","retro","pages","happening","next"]){if($(k))$(k).checked=!!S[k]}
  $("holidayColor").value=S.holidayColor||"#FF4D5A";
  $("eventColor").value=S.eventColor||"#1479FF";
  opts("weekOptions",weekDefaults); opts("retroOptions",retroDefaults);
  document.querySelectorAll('#weekOptions input').forEach(e=>e.checked=S.weekSections.includes(weekDefaults[+e.dataset.i]));
  document.querySelectorAll('#retroOptions input').forEach(e=>e.checked=S.retroSections.includes(retroDefaults[+e.dataset.i]));
}
function saveDesign(){
  read();
  const data={format:"Kobo Calendar Maker Design",version:4,savedAt:new Date().toISOString(),settings:S};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download=`Kobo_Calendar_Design_${S.year}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function loadDesign(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=()=>{try{
    const data=JSON.parse(r.result),loaded=data.settings||data;Object.assign(S,loaded);
    S.special=Array.isArray(S.special)?S.special:[];
    S.weekSections=Array.isArray(S.weekSections)?S.weekSections:weekDefaults.slice();
    S.retroSections=Array.isArray(S.retroSections)?S.retroSections:retroDefaults.slice();
    syncForm();renderList();render();alert("Design loaded successfully! You can continue editing it.");
  }catch(e){alert("This is not a valid Kobo Calendar Maker JSON design.");}};
  r.readAsText(file);
}
$("save").onclick=saveDesign;
$("loadBtn").onclick=()=>$("file").click();
$("file").onchange=e=>{loadDesign(e.target.files[0]);e.target.value=""};
$("uploadBoxButton") && ($("uploadBoxButton").onclick=()=>$("file").click());

function pdfColor(hex){const h=(hex||"#1479FF").replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function addHeader(doc,title){doc.setFillColor(...pdfColor(S.accent));doc.roundedRect(.25,.25,5.05,.48,.06,.06,'F');doc.setTextColor(255,255,255);doc.setFontSize(12);doc.text(title,.42,.56);doc.setTextColor(20,35,55);}
function exportPDF(){
  read();
  if(!window.jspdf){alert("PDF library could not be loaded. Please reload the website with an internet connection.");return;}
  const {jsPDF}=window.jspdf;
  const w=Number(S.width)/Number(S.ppi),h=Number(S.height)/Number(S.ppi);
  const doc=new jsPDF({orientation:w>h?'landscape':'portrait',unit:'in',format:[w,h],compress:true});
  const first=new Date(S.year,0,1),last=new Date(S.year,11,31),daily={};
  let page=1;
  if(S.monthly)page+=12;
  const weeks=[];let ws=weekStart(first);while(ws<=last){weeks.push(new Date(ws));ws.setDate(ws.getDate()+7)}
  if(S.weekly)page+=weeks.length;
  if(S.daily){for(let d=new Date(first);d<=last;d.setDate(d.getDate()+1)){daily[iso(d)]=page++;}}
  let started=false;const addPage=()=>{if(started)doc.addPage();started=true};
  if(S.monthly){for(let m=0;m<12;m++){addPage();addHeader(doc,`${new Date(S.year,m,1).toLocaleString('en-US',{month:'long'}).toUpperCase()} ${S.year} · MONTH OVERVIEW`);const names=S.start===0?["SUN","MON","TUE","WED","THU","FRI","SAT"]:S.start===6?["SAT","SUN","MON","TUE","WED","THU","FRI"]:["MON","TUE","WED","THU","FRI","SAT","SUN"];const off=(new Date(S.year,m,1).getDay()-S.start+7)%7,lastday=new Date(S.year,m+1,0).getDate();let x0=.25,y0=1.0,cw=.70,ch=.78;doc.setFontSize(6);names.forEach((n,i)=>{doc.setFillColor(...pdfColor(S.accent));doc.rect(x0+i*cw,y0,cw-.03,.22,'F');doc.setTextColor(255,255,255);doc.text(n,x0+i*cw+.14,y0+.15)});for(let n=1;n<=lastday;n++){let z=off+n-1,row=Math.floor(z/7),col=z%7,x=x0+col*cw,y=y0+.25+row*ch;doc.setFillColor(248,250,252);doc.setDrawColor(210,220,230);doc.rect(x,y,cw-.03,ch-.03,'FD');doc.setTextColor(20,35,55);doc.setFontSize(9);doc.text(String(n),x+.06,y+.18);let dt=`${S.year}-${String(m+1).padStart(2,'0')}-${String(n).padStart(2,'0')}`;S.special.filter(e=>e.date===dt).slice(0,2).forEach((e,j)=>{doc.setFillColor(...pdfColor(e.color));doc.roundedRect(x+.05,y+.28+j*.17,cw-.13,.13,.02,.02,'F');doc.setTextColor(20,35,55);doc.setFontSize(4.5);doc.text(e.name.slice(0,18),x+.08,y+.37+j*.17)});if(daily[dt])doc.link(x,y,cw-.03,ch-.03,{pageNumber:daily[dt]});}}}
  if(S.weekly){for(const d of weeks){addPage();const e=new Date(d);e.setDate(e.getDate()+6);addHeader(doc,`WEEK OVERVIEW · ${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${e.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`);for(let i=0;i<7;i++){let q=new Date(d);q.setDate(d.getDate()+i);let x=.3+i*.72;doc.setFillColor(...pdfColor(S.accent));doc.roundedRect(x,1,.67,1.15,.04,.04,'F');doc.setTextColor(255,255,255);doc.setFontSize(6);doc.text(q.toLocaleDateString('en-US',{weekday:'short'}),x+.07,1.16);doc.setFontSize(15);doc.text(String(q.getDate()),x+.07,1.42);doc.setFontSize(6);doc.text(q.toLocaleDateString('en-US',{month:'short'}),x+.07,1.58);if(daily[iso(q)])doc.link(x,1,.67,1.15,{pageNumber:daily[iso(q)]});}let yy=2.45;for(const sec of S.weekSections){doc.setTextColor(20,35,55);doc.setFontSize(7);doc.text(sec,.35,yy);for(let l=0;l<4;l++)doc.line(.35,yy+.13+l*.18,5.0,yy+.13+l*.18);yy+=.9;}}}
  if(S.daily){for(let d=new Date(first);d<=last;d.setDate(d.getDate()+1)){addPage();addHeader(doc,d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).toUpperCase());let yy=1.0;for(const e of S.special.filter(e=>e.date===iso(d))){doc.setFillColor(...pdfColor(e.color));doc.roundedRect(.35,yy,4.55,.25,.03,.03,'F');doc.setTextColor(20,35,55);doc.setFontSize(6);doc.text(`${e.type.toUpperCase()} · ${e.name}`,.45,yy+.16);yy+=.34;}if(S.happening){doc.setFontSize(8);doc.text("WHAT'S HAPPENING?",.35,yy+.05);for(let l=0;l<12;l++)doc.line(.35,yy+.18+l*.27,5,yy+.18+l*.27);yy+=3.55;}if(S.pages){doc.setFontSize(7);doc.text('PAGE TRACKER: FROM __________  TO __________  PAGES __________',.35,yy);yy+=.4;}if(S.next){doc.setFontSize(7);doc.text('NEXT READING',.35,yy);doc.line(.35,yy+.15,5,yy+.15);}}}
  doc.save(`Kobo_Calendar_${S.year}.pdf`);
}
$("export").onclick=exportPDF;
renderList();render();
