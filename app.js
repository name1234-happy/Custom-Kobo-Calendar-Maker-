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
  monthColors: ["#FF5364","#1479FF","#8B5CF6","#10B981","#F59E0B","#EC4899","#0EA5E9","#84CC16","#F97316","#6366F1","#14B8A6","#EF4444"],
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
  S.monthColors=Array.isArray(S.monthColors)?S.monthColors.slice(0,12):[];
  while(S.monthColors.length<12) S.monthColors.push("#1479FF");
}

function renderOptions(){
  $("weekOptions").innerHTML=WEEK_CHOICES.map(x=>`<label class="option"><input type="checkbox" data-group="week" value="${escapeHtml(x)}" ${S.weekSections.includes(x)?"checked":""}> ${escapeHtml(x)}</label>`).join("");
  $("retroOptions").innerHTML=RETRO_CHOICES.map(x=>`<label class="option"><input type="checkbox" data-group="retro" value="${escapeHtml(x)}" ${S.retroSections.includes(x)?"checked":""}> ${escapeHtml(x)}</label>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function renderMonthColors(){
  $("monthColors").innerHTML=MONTHS.map((m,i)=>`<label>${m}<input type="color" data-month-color="${i}" value="${S.monthColors[i]}"></label>`).join("");
}
function syncForm(){
  ["year","start","width","height","ppi","unit","bg","accent","holidayColor","eventColor"].forEach(k=>{if($(k))$(k).value=S[k]??""});
  ["monthly","weekly","daily","retro","pages","happening","next"].forEach(k=>{if($(k))$(k).checked=!!S[k]});
  renderOptions(); renderMonthColors(); renderList(); syncViews();
}
function readForm(){
  ["year","start","width","height","ppi"].forEach(k=>S[k]=Number($(k).value));
  ["unit","bg","accent","holidayColor","eventColor"].forEach(k=>S[k]=$(k).value);
  ["monthly","weekly","daily","retro","pages","happening","next"].forEach(k=>S[k]=$(k).checked);
  S.weekSections=[...document.querySelectorAll('[data-group="week"]:checked')].map(e=>e.value);
  S.retroSections=[...document.querySelectorAll('[data-group="retro"]:checked')].map(e=>e.value);
  document.querySelectorAll("[data-month-color]").forEach(e=>S.monthColors[Number(e.dataset.monthColor)]=e.value);
}

function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dateObj(k){const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)}
function eventsFor(k){return S.special.filter(e=>e.date===k)}
function colorFor(e){return e.type==="holiday"?S.holidayColor:S.eventColor}
function tags(k){return eventsFor(k).map(e=>`<div class="special ${e.type}" style="background:${colorFor(e)}" title="${escapeHtml(e.name)}">${escapeHtml(e.name)}</div>`).join("")}
function weekdayNames(){return S.start===0?["SUN","MON","TUE","WED","THU","FRI","SAT"]:S.start===6?["SAT","SUN","MON","TUE","WED","THU","FRI"]:["MON","TUE","WED","THU","FRI","SAT","SUN"]}

function monthTabs(active){
  return `<div class="monthtabs">${MONTHS.map((x,i)=>`<button class="mtab ${i===active?"active":""}" style="background:${S.monthColors[i]}" onclick="S.previewMonth=${i};render()">${x}</button>`).join("")}</div>`;
}
function pageShell(content,activeMonth){
  return `<div class="page" style="background:${S.bg}">${monthTabs(activeMonth)}${content}</div>`;
}
function monthPreview(){
  const y=S.year,m=S.previewMonth,first=new Date(y,m,1),lastDay=new Date(y,m+1,0).getDate();
  const off=(first.getDay()-S.start+7)%7; let cells=Array(off).fill(""); for(let n=1;n<=lastDay;n++)cells.push(n); while(cells.length%7)cells.push("");
  const names=weekdayNames();
  const cellsHtml=cells.map(n=>n?`<div class="cell" data-date="${iso(new Date(y,m,n))}" onclick="openDay('${iso(new Date(y,m,n))}')"><b>${n}</b>${tags(iso(new Date(y,m,n)))}<span class="weeklink">Open day</span></div>`:"<div></div>").join("");
  const weekButton=S.weekly?`<button class="navWeek" style="background:${S.accent}" onclick="S.selectedDate='${iso(first)}';S.view='week';syncViews()">→ Open Week Overview for this month</button>`:"";
  return pageShell(`${`<div class="head" style="background:${S.accent}">${first.toLocaleString("en-US",{month:"long"}).toUpperCase()} ${y} · MONTHLY OVERVIEW</div>${weekButton}<div class="legend"><span><i class="dot" style="background:${S.holidayColor}"></i>Holiday</span><span><i class="dot" style="background:${S.eventColor}"></i>Event</span></div><div class="cal">${names.map(n=>`<div class="dow" style="background:${S.accent}">${n}</div>`).join("")}${cellsHtml}</div>`}`,m);
}

function weekStart(d){const x=new Date(d);x.setDate(x.getDate()-((x.getDay()-S.start+7)%7));return x}
function weekPreview(){
  const selected=dateObj(S.selectedDate),start=weekStart(selected),boxes=[];
  for(let i=0;i<7;i++){const q=new Date(start);q.setDate(start.getDate()+i);const k=iso(q),ev=eventsFor(k);boxes.push(`<div class="weekday" onclick="openDay('${k}')"><div class="weekdayhead" style="background:${S.accent}"><span>${q.toLocaleDateString("en-US",{weekday:"short"})}</span><b>${q.getDate()}</b><small>${q.toLocaleDateString("en-US",{month:"short"})}</small></div><div class="events">${ev.length?ev.map(e=>`<div class="event" style="background:${colorFor(e)}">${e.type.toUpperCase()} · ${escapeHtml(e.name)}</div>`).join(""):'<div class="none">No special dates</div>'}</div></div>`)}
  return pageShell(`<div class="head" style="background:${S.accent}">WEEKLY OVERVIEW</div><div class="navWeek" style="background:${S.accent}" onclick="S.view='month';S.previewMonth=new Date(S.selectedDate).getMonth();syncViews()">← Back to Monthly Overview</div><div class="weekgrid">${boxes.join("")}</div>${S.weekSections.map(x=>`<div class="wide"><h4>${escapeHtml(x)}</h4><div class="lines"></div></div>`).join("")}`,start.getMonth());
}
function dayPreview(){
  const d=dateObj(S.selectedDate),k=iso(d);
  return pageShell(`<div class="daybar" style="background:${S.accent}">${d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase()}</div><div class="navWeek" style="background:${S.accent}" onclick="S.view='month';S.previewMonth=${d.getMonth()};syncViews()">← Back to Monthly Overview</div>${eventsFor(k).map(e=>`<div class="event" style="background:${colorFor(e)};margin-top:8px">${e.type.toUpperCase()} · ${escapeHtml(e.name)}</div>`).join("")}${S.happening?`<div class="wide" style="min-height:320px"><h4>WHAT'S HAPPENING?</h4><div class="lines" style="height:275px"></div></div>`:""}${S.pages?`<div class="tracker"><div class="stat"><b>START PAGE</b><br>________</div><div class="stat"><b>END PAGE</b><br>________</div><div class="stat"><b>PAGES READ</b><br>________</div></div>`:""}${S.next?`<div class="wide"><h4>NEXT READING</h4><div class="lines"></div></div>`:""}`,d.getMonth());
}
function retroPreview(){
  const m=dateObj(S.selectedDate).getMonth();
  return pageShell(`<div class="head" style="background:${S.accent}">WEEKLY RETROSPECTIVE</div><div class="navWeek" style="background:${S.accent}" onclick="S.view='week';syncViews()">← Back to Weekly Overview</div>${S.retroSections.map(x=>`<div class="wide" style="min-height:120px"><h4>${escapeHtml(x)}</h4><div class="lines" style="height:80px"></div></div>`).join("")}`,m);
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
async function exportPDF(){
  readForm();
  if(!window.jspdf || !window.html2canvas){
    alert("The PDF libraries could not be loaded. Please reload the website with an internet connection.");
    return;
  }
  const {jsPDF}=window.jspdf;
  const Wpx=Math.max(100,Number(S.width)||1264), Hpx=Math.max(100,Number(S.height)||1680);
  const W=Math.max(2,Wpx/(Number(S.ppi)||227)), H=Math.max(2,Hpx/(Number(S.ppi)||227));
  const doc=new jsPDF({orientation:W>H?"landscape":"portrait",unit:"in",format:[W,H],compress:true});

  // Build the exact same page HTML used by the live preview, then capture it.
  // This keeps colours, spacing, boxes, tabs, special dates and section choices in sync.
  const host=document.createElement("div");
  host.style.position="fixed";host.style.left="-100000px";host.style.top="0";host.style.width="760px";host.style.background="white";host.style.zIndex="-1";
  document.body.appendChild(host);

  const pages=[];
  const first=new Date(S.year,0,1), last=new Date(S.year,11,31);
  if(S.monthly) for(let m=0;m<12;m++) pages.push({type:"month",m});
  if(S.weekly){let d=weekStart(first);while(d<=last){pages.push({type:"week",d:new Date(d)});d.setDate(d.getDate()+7)}}
  if(S.daily) for(let d=new Date(first);d<=last;d.setDate(d.getDate()+1)) pages.push({type:"day",d:new Date(d)});
  if(S.retro) pages.push({type:"retro"});

  // Reuse the same preview functions, so PDF output cannot silently diverge from the preview.
  function pageHTML(p){
    if(p.type==="month"){const old=S.previewMonth;S.previewMonth=p.m;const h=monthPreview();S.previewMonth=old;return h}
    if(p.type==="week"){const old=S.selectedDate;S.selectedDate=iso(p.d);const h=weekPreview();S.selectedDate=old;return h}
    if(p.type==="day"){const old=S.selectedDate;S.selectedDate=iso(p.d);const h=dayPreview();S.selectedDate=old;return h}
    return retroPreview();
  }

  for(let i=0;i<pages.length;i++){
    if(i) doc.addPage();
    const p=pages[i];
    host.innerHTML=pageHTML(p);
    const pageEl=host.querySelector('.page');
    if(!pageEl) continue;
    // Use the same CSS page size as the live preview, with no browser clipping.
    pageEl.style.width="760px";
    pageEl.style.minHeight="0";
    pageEl.style.height="auto";
    pageEl.style.aspectRatio=`${Wpx}/${Hpx}`;
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const canvas=await html2canvas(pageEl,{scale:2,backgroundColor:null,useCORS:true,logging:false,windowWidth:760});
    const img=canvas.toDataURL("image/png");
    doc.addImage(img,"PNG",0,0,W,H,undefined,"FAST");
  }
  host.remove();
  if(!pages.length){doc.text("No pages selected.",.5,.7)}
  doc.save(`Kobo_Calendar_${S.year}.pdf`);
}

$("export").onclick=exportPDF;

normalizeState(S);syncForm();
