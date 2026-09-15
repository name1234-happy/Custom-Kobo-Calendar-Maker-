const $ = id => document.getElementById(id);

const WEEK_CHOICES = ["What's happening","Goals","To-do","Reading","Appointments","Important"];
const RETRO_CHOICES = ["Books finished","Pages read","Favourite book","Best quote / idea","What I enjoyed","Next month"];
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

const S = {
  year: 2026, start: 1, width: 1264, height: 1680, ppi: 227, unit: "px",
  bg: "#F4F7FB", accent: "#1479FF", monthly: true, weekly: true, daily: true,
  retro: true, pages: true, happening: true, next: true,
  view: "month", previewMonth: 0, selectedDate: "2026-01-05",
  special: [], holidayColor: "#FF4D5A", eventColor: "#1479FF",
  weekSections: ["What's happening","Goals","To-do","Reading"],
  retroSections: ["Books finished","Pages read","Favourite book","What I enjoyed","Next month"]
};

function normalizeState(x){
  if(!x || typeof x !== "object") return;
  Object.assign(S,x);
  S.year=Number(S.year)||2026; S.start=Number(S.start); S.width=Number(S.width)||1264; S.height=Number(S.height)||1680; S.ppi=Number(S.ppi)||227;
  S.special=Array.isArray(S.special)?S.special:[];
  S.weekSections=Array.isArray(S.weekSections)?S.weekSections:WEEK_CHOICES.slice(0,4);
  S.retroSections=Array.isArray(S.retroSections)?S.retroSections:RETRO_CHOICES.slice(0,5);
  S.previewMonth=Math.max(0,Math.min(11,Number(S.previewMonth)||0));
  S.selectedDate=S.selectedDate||`${S.year}-01-05`;
  S.holidayColor=S.holidayColor||"#FF4D5A"; S.eventColor=S.eventColor||"#1479FF";
}

function renderOptions(){
  $("weekOptions").innerHTML=WEEK_CHOICES.map(x=>`<label class="option"><input type="checkbox" data-group="week" value="${escapeHtml(x)}" ${S.weekSections.includes(x)?"checked":""}> ${escapeHtml(x)}</label>`).join("");
  $("retroOptions").innerHTML=RETRO_CHOICES.map(x=>`<label class="option"><input type="checkbox" data-group="retro" value="${escapeHtml(x)}" ${S.retroSections.includes(x)?"checked":""}> ${escapeHtml(x)}</label>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function syncForm(){
  ["year","start","width","height","ppi","unit","bg","accent","holidayColor","eventColor"].forEach(k=>{if($(k))$(k).value=S[k]??""});
  ["monthly","weekly","daily","retro","pages","happening","next"].forEach(k=>{if($(k))$(k).checked=!!S[k]});
  renderOptions(); renderList(); syncViews();
}
function readForm(){
  ["year","start","width","height","ppi"].forEach(k=>S[k]=Number($(k).value));
  ["unit","bg","accent","holidayColor","eventColor"].forEach(k=>S[k]=$(k).value);
  ["monthly","weekly","daily","retro","pages","happening","next"].forEach(k=>S[k]=$(k).checked);
  S.weekSections=[...document.querySelectorAll('[data-group="week"]:checked')].map(e=>e.value);
  S.retroSections=[...document.querySelectorAll('[data-group="retro"]:checked')].map(e=>e.value);
}

function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dateObj(k){const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)}
function eventsFor(k){return S.special.filter(e=>e.date===k)}
function colorFor(e){return e.type==="holiday"?S.holidayColor:S.eventColor}
function tags(k){return eventsFor(k).map(e=>`<div class="special ${e.type}" style="background:${colorFor(e)}" title="${escapeHtml(e.name)}">${escapeHtml(e.name)}</div>`).join("")}
function weekdayNames(){return S.start===0?["SUN","MON","TUE","WED","THU","FRI","SAT"]:S.start===6?["SAT","SUN","MON","TUE","WED","THU","FRI"]:["MON","TUE","WED","THU","FRI","SAT","SUN"]}

function monthPreview(){
  const y=S.year,m=S.previewMonth,first=new Date(y,m,1),lastDay=new Date(y,m+1,0).getDate();
  const off=(first.getDay()-S.start+7)%7; let cells=Array(off).fill(""); for(let n=1;n<=lastDay;n++)cells.push(n); while(cells.length%7)cells.push("");
  const names=weekdayNames();
  const tabs=MONTHS.map((x,i)=>`<button class="mtab" style="background:${i===m?S.accent:["#FF5364","#1479FF","#8B5CF6","#10B981","#F59E0B","#EC4899","#0EA5E9","#84CC16","#F97316","#6366F1","#14B8A6","#EF4444"][i]}" onclick="S.previewMonth=${i};render()">${x}</button>`).join("");
  return `<div class="page" style="--bg:${S.bg};--accent:${S.accent}"><div class="monthtabs">${tabs}</div><div class="head" style="background:${S.accent}">${new Date(y,m,1).toLocaleString("en-US",{month:"long"}).toUpperCase()} ${y} · MONTHLY OVERVIEW</div><div class="legend"><span><i class="dot" style="background:${S.holidayColor}"></i>Holiday</span><span><i class="dot" style="background:${S.eventColor}"></i>Event</span></div><div class="cal">${names.map(n=>`<div class="dow" style="background:${S.accent}">${n}</div>`).join("")}${cells.map(n=>n?`<div class="cell" data-date="${iso(new Date(y,m,n))}" onclick="openDay('${iso(new Date(y,m,n))}')"><b>${n}</b>${tags(iso(new Date(y,m,n)))}<span class="weeklink">Open day</span></div>`:"<div></div>").join("")}</div></div>`;
}

function weekStart(d){const x=new Date(d);x.setDate(x.getDate()-((x.getDay()-S.start+7)%7));return x}
function weekPreview(){
  const selected=dateObj(S.selectedDate),start=weekStart(selected),boxes=[];
  for(let i=0;i<7;i++){const q=new Date(start);q.setDate(start.getDate()+i);const k=iso(q),ev=eventsFor(k);boxes.push(`<div class="weekday" onclick="openDay('${k}')"><div class="weekdayhead" style="background:${S.accent}"><span>${q.toLocaleDateString("en-US",{weekday:"short"})}</span><b>${q.getDate()}</b><small>${q.toLocaleDateString("en-US",{month:"short"})}</small></div><div class="events">${ev.length?ev.map(e=>`<div class="event" style="background:${colorFor(e)}">${e.type.toUpperCase()} · ${escapeHtml(e.name)}</div>`).join(""):'<div class="none">No special dates</div>'}</div></div>`)}
  return `<div class="page" style="--bg:${S.bg};--accent:${S.accent}"><div class="head" style="background:${S.accent}">WEEKLY OVERVIEW</div><div class="weekgrid">${boxes.join("")}</div>${S.weekSections.map(x=>`<div class="wide"><h4>${escapeHtml(x)}</h4><div class="lines"></div></div>`).join("")}</div>`;
}
function dayPreview(){
  const d=dateObj(S.selectedDate),k=iso(d);
  return `<div class="page" style="--bg:${S.bg};--accent:${S.accent}"><div class="daybar" style="background:${S.accent}">${d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase()}</div>${eventsFor(k).map(e=>`<div class="event" style="background:${colorFor(e)};margin-top:8px">${e.type.toUpperCase()} · ${escapeHtml(e.name)}</div>`).join("")}${S.happening?`<div class="wide" style="min-height:320px"><h4>WHAT'S HAPPENING?</h4><div class="lines" style="height:275px"></div></div>`:""}${S.pages?`<div class="tracker"><div class="stat"><b>START PAGE</b><br>________</div><div class="stat"><b>END PAGE</b><br>________</div><div class="stat"><b>PAGES READ</b><br>________</div></div>`:""}${S.next?`<div class="wide"><h4>NEXT READING</h4><div class="lines"></div></div>`:""}</div>`;
}
function retroPreview(){
  return `<div class="page" style="--bg:${S.bg};--accent:${S.accent}"><div class="head" style="background:${S.accent}">WEEKLY RETROSPECTIVE</div>${S.retroSections.map(x=>`<div class="wide" style="min-height:120px"><h4>${escapeHtml(x)}</h4><div class="lines" style="height:80px"></div></div>`).join("")}</div>`;
}
function render(){
  readForm();
  let html=S.view==="month"?monthPreview():S.view==="week"?weekPreview():S.view==="day"?dayPreview():retroPreview();
  $("preview").innerHTML=html;
  document.documentElement.style.setProperty("--accent",S.accent);
  renderList();
}
function syncViews(){
  document.querySelectorAll(".view").forEach(b=>b.classList.toggle("active",b.dataset.view===S.view));
  renderOptions(); render();
}
function openDay(k){S.selectedDate=k;S.view="day";syncViews()}

function renderList(){
  const el=$("list"); if(!el)return;
  el.innerHTML=S.special.map((x,i)=>`<div class="item" style="border-left-color:${colorFor(x)}"><button onclick="removeSpecial(${i})">×</button><b>${escapeHtml(x.name)}</b><br>${x.type==="holiday"?"Holiday":"Event"} · ${x.date}</div>`).join("");
}
function removeSpecial(i){S.special.splice(i,1);render()}

$("add").onclick=()=>{const date=$("spDate").value,name=$("spName").value.trim(),type=$("spType").value;if(!date||!name)return alert("Please enter a date and name.");S.special.push({date,name,type});$("spName").value="";render()};

document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("designPanel").hidden=b.dataset.panel!=="design";$("specialPanel").hidden=b.dataset.panel!=="special"});
document.querySelectorAll(".view").forEach(b=>b.onclick=()=>{S.view=b.dataset.view;syncViews()});
document.addEventListener("input",e=>{if(e.target.closest("aside")){readForm();render()}});

function saveDesign(){readForm();const data={format:"Kobo Calendar Maker Design",version:5,savedAt:new Date().toISOString(),settings:S};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`Kobo_Calendar_Design_${S.year}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function loadDesign(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);normalizeState(data.settings||data);syncForm();alert("Design loaded successfully! You can continue editing it.")}catch(e){alert("This is not a valid Kobo Calendar Maker JSON file.")}};r.readAsText(file)}
$("save").onclick=saveDesign;$("loadBtn").onclick=()=>$("file").click();$("uploadBoxButton").onclick=()=>$("file").click();$("file").onchange=e=>{loadDesign(e.target.files[0]);e.target.value=""};

function pdfColor(hex){const h=(hex||"#1479FF").replace("#","");return[parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0]}
function exportPDF(){
  readForm(); if(!window.jspdf){alert("PDF library could not be loaded. Please reload with an internet connection.");return}
  const {jsPDF}=window.jspdf; const w=S.width/S.ppi,h=S.height/S.ppi; const doc=new jsPDF({orientation:w>h?"landscape":"portrait",unit:"in",format:[w,h],compress:true});
  const pages=[]; const daily={}; let pageNo=1;
  if(S.monthly)for(let m=0;m<12;m++)pages.push({type:"month",m});
  const first=new Date(S.year,0,1),last=new Date(S.year,11,31); if(S.weekly){let d=weekStart(first);while(d<=last){pages.push({type:"week",d:new Date(d)});d.setDate(d.getDate()+7)}}
  if(S.daily)for(let d=new Date(first);d<=last;d.setDate(d.getDate()+1)){daily[iso(d)]=pages.length+1;pages.push({type:"day",d:new Date(d)})}
  if(S.retro)pages.push({type:"retro"});
  pages.forEach((p,i)=>{
    if(i)doc.addPage();
    doc.setFillColor(...pdfColor(S.accent));doc.roundedRect(.25,.25,5.05,.48,.06,.06,"F");doc.setTextColor(255,255,255);doc.setFontSize(12);
    const title=p.type==="month"?`${new Date(S.year,p.m,1).toLocaleString("en-US",{month:"long"}).toUpperCase()} ${S.year} · MONTH OVERVIEW`:p.type==="week"?`WEEK OVERVIEW`:p.type==="retro"?`WEEKLY RETROSPECTIVE`:p.d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase();
    doc.text(title,.42,.56);doc.setTextColor(20,35,55);
    if(p.type==="month"){const names=weekdayNames();let y0=.95,cw=.70,ch=.78,off=(new Date(S.year,p.m,1).getDay()-S.start+7)%7,lastd=new Date(S.year,p.m+1,0).getDate();doc.setFontSize(6);names.forEach((n,j)=>{doc.setFillColor(...pdfColor(S.accent));doc.rect(.25+j*cw,y0,cw-.03,.22,"F");doc.setTextColor(255,255,255);doc.text(n,.38+j*cw,y0+.15)});for(let n=1;n<=lastd;n++){let z=off+n-1,row=Math.floor(z/7),col=z%7,x=.25+col*cw,y=y0+.25+row*ch;doc.setFillColor(248,250,252);doc.setDrawColor(210,220,230);doc.rect(x,y,cw-.03,ch-.03,"FD");doc.setTextColor(20,35,55);doc.setFontSize(9);doc.text(String(n),x+.05,y+.18);let k=iso(new Date(S.year,p.m,n));if(daily[k])doc.link(x,y,cw-.03,ch-.03,{pageNumber:daily[k]});}}
    if(p.type==="week"){let d=new Date(p.d);for(let i=0;i<7;i++){let q=new Date(d);q.setDate(d.getDate()+i);let x=.28+i*.70;doc.setFillColor(...pdfColor(S.accent));doc.roundedRect(x,1,.65,1.15,.04,.04,"F");doc.setTextColor(255,255,255);doc.setFontSize(6);doc.text(q.toLocaleDateString("en-US",{weekday:"short"}),x+.06,1.15);doc.setFontSize(14);doc.text(String(q.getDate()),x+.06,1.40);if(daily[iso(q)])doc.link(x,1,.65,1.15,{pageNumber:daily[iso(q)]});}let yy=2.45;doc.setTextColor(20,35,55);for(const sec of S.weekSections){doc.setFontSize(7);doc.text(sec,.35,yy);for(let l=0;l<4;l++)doc.line(.35,yy+.14+l*.18,5,yy+.14+l*.18);yy+=.9}}
    if(p.type==="day"){let yy=1.0,k=iso(p.d);for(const e of eventsFor(k)){doc.setFillColor(...pdfColor(colorFor(e)));doc.roundedRect(.35,yy,4.55,.25,.03,.03,"F");doc.setTextColor(20,35,55);doc.setFontSize(6);doc.text(`${e.type.toUpperCase()} · ${e.name}`,.45,yy+.16);yy+=.34}if(S.happening){doc.setFontSize(8);doc.text("WHAT'S HAPPENING?",.35,yy+.05);for(let l=0;l<12;l++)doc.line(.35,yy+.18+l*.27,5,yy+.18+l*.27);yy+=3.55}if(S.pages){doc.setFontSize(7);doc.text("PAGE TRACKER: FROM __________ TO __________",.35,yy);yy+=.4}if(S.next){doc.setFontSize(7);doc.text("NEXT READING",.35,yy);doc.line(.35,yy+.15,5,yy+.15)}}
    if(p.type==="retro"){let yy=1.0;for(const sec of S.retroSections){doc.setFontSize(7);doc.text(sec,.35,yy);for(let l=0;l<4;l++)doc.line(.35,yy+.14+l*.18,5,yy+.14+l*.18);yy+=.9}}
  });
  doc.save(`Kobo_Calendar_${S.year}.pdf`);
}
$("export").onclick=exportPDF;

normalizeState(S);syncForm();
