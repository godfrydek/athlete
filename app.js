const STORAGE_KEY = 'trainingArcOS.v1';
const PIN_KEY = 'trainingArcOS.pinHash';
const PIN_MODE = 'trainingArcOS.pinMode';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const today = () => new Date().toISOString().slice(0,10);

let state = loadState();

function loadState(){
  const fallback = {
    targets:{kcal:2900, protein:175, carbs:360, fat:75},
    daily:{}, nutrition:[], gym:[], runs:[], settings:{created:new Date().toISOString()}
  };
  try { return {...fallback, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {})}; }
  catch { return fallback; }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
function num(v,d=0){ const n=Number(v); return Number.isFinite(n)?n:d; }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function formatDate(d){ return new Date(d+'T12:00:00').toLocaleDateString('cs-CZ',{day:'numeric',month:'short'}); }
function dateValue(form, name='date'){ return form.elements[name]?.value || today(); }
function setDefaultDates(){ $$('input[type="date"]').forEach(i=>{ if(!i.value) i.value=today(); }); }
async function hashPin(pin){
  const bytes = new TextEncoder().encode('training-arc-os:' + pin);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function initLock(){
  $('#todayText').textContent = new Date().toLocaleDateString('cs-CZ',{weekday:'long',day:'numeric',month:'long'});
  const mode = localStorage.getItem(PIN_MODE);
  const pinHash = localStorage.getItem(PIN_KEY);
  if(mode === 'off') return showApp();
  $('#lockScreen').classList.remove('hidden');
  if(pinHash){ $('#pinLogin').classList.remove('hidden'); $('#pinInput').focus(); }
  else { $('#pinSetup').classList.remove('hidden'); $('#newPin').focus(); }
}
function showApp(){ $('#lockScreen').classList.add('hidden'); $('#app').classList.remove('hidden'); setDefaultDates(); render(); }

$('#createPinBtn').addEventListener('click', async()=>{
  const pin=$('#newPin').value.trim();
  if(pin.length<4) return $('#lockMsg').textContent='PIN dej aspoň 4 znaky.';
  localStorage.setItem(PIN_KEY, await hashPin(pin)); localStorage.setItem(PIN_MODE,'on'); showApp(); toast('PIN nastaven.');
});
$('#skipPinBtn').addEventListener('click',()=>{ localStorage.setItem(PIN_MODE,'off'); showApp(); });
$('#unlockBtn').addEventListener('click', async()=>{
  const ok = await hashPin($('#pinInput').value.trim()) === localStorage.getItem(PIN_KEY);
  if(ok) showApp(); else $('#lockMsg').textContent='Špatný PIN bro.';
});
$('#pinInput').addEventListener('keydown', e=>{ if(e.key==='Enter') $('#unlockBtn').click(); });
$('#resetBtn').addEventListener('click',()=>{ if(confirm('Reset smaže PIN i data v appce. Fakt?')){ localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(PIN_KEY); localStorage.removeItem(PIN_MODE); location.reload(); } });
$('#lockBtn').addEventListener('click',()=>{ if(localStorage.getItem(PIN_MODE)==='off') toast('Secure režim je vypnutý.'); else location.reload(); });

$$('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.nav-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  $$('.view').forEach(v=>v.classList.remove('active-view'));
  $('#'+btn.dataset.view).classList.add('active-view');
  $('#pageTitle').textContent = btn.textContent;
  if(btn.dataset.view==='stats') setTimeout(drawCharts,50);
}));

$('#quickForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=e.target; const d=today(); state.daily[d] = {...(state.daily[d]||{}),
    weight: num(f.weight.value, state.daily[d]?.weight || 0) || undefined,
    kcal: num(f.kcal.value, state.daily[d]?.kcal || 0), protein: num(f.protein.value, state.daily[d]?.protein || 0),
    steps: num(f.steps.value, state.daily[d]?.steps || 0)};
  f.reset(); save(); toast('Dnešek uložen.');
});
$('#nutritionForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=e.target; const item={id:crypto.randomUUID(),date:dateValue(f),kcal:num(f.kcal.value),protein:num(f.protein.value),carbs:num(f.carbs.value),fat:num(f.fat.value),fiber:num(f.fiber.value),water:num(f.water.value),note:f.note.value.trim()};
  state.nutrition.push(item); state.daily[item.date] = {...(state.daily[item.date]||{}), kcal:item.kcal, protein:item.protein, carbs:item.carbs, fat:item.fat};
  f.reset(); setDefaultDates(); save(); toast('Kalorie uložené.');
});
$('#targetsForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=e.target; ['kcal','protein','carbs','fat'].forEach(k=>{ if(f[k].value) state.targets[k]=num(f[k].value,state.targets[k]); });
  save(); toast('Cíle aktualizované.');
});
$('#gymForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=e.target; const item={id:crypto.randomUUID(),date:dateValue(f),workout:f.workout.value.trim()||'Workout',exercise:f.exercise.value.trim()||'Cvik',sets:num(f.sets.value,1),reps:f.reps.value.trim()||'0',weight:num(f.weight.value),rir:f.rir.value===''?null:num(f.rir.value),note:f.note.value.trim()};
  state.gym.push(item); f.reset(); setDefaultDates(); save(); toast('Cvik přidán.');
});
$('#runForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=e.target; const item={id:crypto.randomUUID(),date:dateValue(f),type:f.type.value.trim()||'Run',distance:num(f.distance.value),time:f.time.value.trim(),seconds:parseTime(f.time.value.trim()),hr:num(f.hr.value),rpe:num(f.rpe.value),elevation:num(f.elevation.value),note:f.note.value.trim()};
  state.runs.push(item); f.reset(); setDefaultDates(); save(); toast('Běh přidán.');
});
$('#targetsForm').addEventListener('reset',()=>render());
$('#exportBtn').addEventListener('click', exportData); $('#quickExport').addEventListener('click', exportData);
$('#importInput').addEventListener('change', importData);
$('#clearBtn').addEventListener('click',()=>{ if(confirm('Smazat nutrition/gym/run/daily logy?')){ state.daily={}; state.nutrition=[]; state.gym=[]; state.runs=[]; save(); toast('Zápisy smazané.'); }});
$('#pinChangeForm').addEventListener('submit', async e=>{ e.preventDefault(); const pin=e.target.pin.value.trim(); if(pin.length<4) return toast('PIN min. 4 znaky.'); localStorage.setItem(PIN_KEY, await hashPin(pin)); localStorage.setItem(PIN_MODE,'on'); e.target.reset(); toast('PIN změněn.'); });
$('#demoBtn').addEventListener('click', addDemoData);

function parseTime(t){
  if(!t) return 0; const p=t.split(':').map(Number); if(p.some(n=>!Number.isFinite(n))) return 0;
  if(p.length===2) return p[0]*60+p[1]; if(p.length===3) return p[0]*3600+p[1]*60+p[2]; return p[0];
}
function pace(run){ if(!run.distance||!run.seconds) return '—'; const sec=run.seconds/run.distance; return `${Math.floor(sec/60)}:${String(Math.round(sec%60)).padStart(2,'0')}/km`; }
function volume(g){ const reps = String(g.reps).split(',').map(x=>num(x.trim())).reduce((a,b)=>a+b,0) || num(g.reps); return Math.round(num(g.weight)*reps); }
function weekStart(date=new Date()){ const d=new Date(date); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); d.setHours(0,0,0,0); return d; }
function inThisWeek(dateStr){ return new Date(dateStr+'T12:00:00') >= weekStart(); }
function lastDays(n){ return [...Array(n)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(n-1-i)); return d.toISOString().slice(0,10); }); }

function render(){
  const d=today(), day=state.daily[d]||{}, target=state.targets;
  $('#dashKcal').textContent=`${Math.round(day.kcal||0)} / ${target.kcal}`;
  $('#dashKcalNote').textContent=`${Math.round(target.kcal-(day.kcal||0))} kcal zbývá`;
  $('#dashProtein').textContent=`${Math.round(day.protein||0)} / ${target.protein} g`;
  const latestWeight = latestDaily('weight'); $('#dashWeight').textContent= latestWeight ? `${latestWeight.value} kg` : '— kg';
  $('#weightTrend').textContent = weightTrendText();
  const weekKm = state.runs.filter(r=>inThisWeek(r.date)).reduce((a,r)=>a+num(r.distance),0);
  $('#dashKm').textContent=`${weekKm.toFixed(1)} km`; $('#runTrend').textContent = weekKm>=30?'solidní objem': weekKm>=15?'rozjíždí se':'čeká na kilometry';
  const kcalPct=clamp(((day.kcal||0)/target.kcal)*100,0,120), proteinPct=clamp(((day.protein||0)/target.protein)*100,0,120);
  $('#kcalRing').textContent=`${Math.round(kcalPct)}%`; $('#proteinRing').textContent=`${Math.round(proteinPct)}%`; $('#trainingRing').textContent=String(state.gym.filter(g=>g.date===d).length + state.runs.filter(r=>r.date===d).length);
  $$('.ring')[0].style.setProperty('--deg', `${Math.min(kcalPct,100)*3.6}deg`); $$('.ring')[1].style.setProperty('--deg', `${Math.min(proteinPct,100)*3.6}deg`); $$('.ring')[2].style.setProperty('--deg', `${Math.min(100,(state.gym.filter(g=>g.date===d).length + state.runs.filter(r=>r.date===d).length)*50)*3.6}deg`);
  const score = dailyScore(day); $('#dailyScore').textContent=score; $('#coachSummary').textContent=score>=80?'Dneska to vypadá jako GOAT režim.':'Zapiš víc dat nebo dotáhni kcal/protein/trénink.';
  renderTips(); renderLogs(); fillTargets(); drawCharts();
}
function dailyScore(day){ let s=0; if(day.kcal) s+=25; if(day.protein>=state.targets.protein*.9) s+=25; if(day.weight) s+=15; if(day.steps>=8000) s+=15; if(state.gym.some(g=>g.date===today())||state.runs.some(r=>r.date===today())) s+=20; return clamp(s,0,100); }
function latestDaily(key){ return Object.entries(state.daily).filter(([_,v])=>v[key]).sort(([a],[b])=>b.localeCompare(a)).map(([date,v])=>({date,value:v[key]}))[0]; }
function weightTrendText(){ const vals=Object.entries(state.daily).filter(([_,v])=>v.weight).sort(([a],[b])=>a.localeCompare(b)).slice(-7); if(vals.length<2) return 'trend čeká'; const diff=vals.at(-1)[1].weight-vals[0][1].weight; return `${diff>=0?'+':''}${diff.toFixed(1)} kg / poslední zápisy`; }
function renderTips(){
  const d=state.daily[today()]||{}, tips=[];
  if(!d.kcal) tips.push('Hoď dnešní kalorie, jinak AI coach hádá naslepo.');
  else if(d.kcal < state.targets.kcal-400) tips.push('Jsi dost pod cílem. Pro výkon v gymu/běhu radši nenechávej moc velkou díru.');
  else if(d.kcal > state.targets.kcal+350) tips.push('Kalorie jsou nad cílem. Není problém, jen sleduj 7denní trend váhy.');
  else tips.push('Kalorie jsou v dobrém pásmu. Sleduj výkon a ranní váhu.');
  if((d.protein||0)<state.targets.protein*.85) tips.push('Protein dnes zaostává. Dej ještě tvaroh, maso, vejce, whey nebo skyr.');
  if(state.runs.filter(r=>inThisWeek(r.date)).reduce((a,r)=>a+r.distance,0)>35) tips.push('Běžecký objem už je solidní. Easy dny fakt drž easy, ať nepřetížíš nohy.');
  const hardDays=[...state.runs.filter(r=>r.rpe>=8),...state.gym.filter(g=>g.rir!==null&&g.rir<=1)].filter(x=>lastDays(3).includes(x.date)).length;
  if(hardDays>=3) tips.push('Poslední 3 dny je dost tvrdých zápisů. Zvaž lehčí den nebo víc spánku.');
  if(!state.gym.length && !state.runs.length) tips.push('Začni klidně jen 3 zápisy: váha, kalorie, jeden workout. Pak už grafy ožijí.');
  $('#tipsList').innerHTML=tips.map(t=>`<li>${t}</li>`).join('');
}
function fillTargets(){ const f=$('#targetsForm'); if(!f) return; ['kcal','protein','carbs','fat'].forEach(k=>f[k].placeholder=`${k}: ${state.targets[k]}`); }
function renderLogs(){
  $('#nutritionLog').innerHTML = state.nutrition.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30).map(x=>logItem(x.id,`${formatDate(x.date)} · ${x.kcal} kcal`,`${x.protein}g P · ${x.carbs}g C · ${x.fat}g F`,x.note,'nutrition')).join('') || '<p class="muted">Zatím žádné zápisy.</p>';
  $('#gymLog').innerHTML = state.gym.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,50).map(x=>logItem(x.id,`${formatDate(x.date)} · ${x.exercise}`,`${x.workout} · ${x.sets}× ${x.reps} · ${x.weight} kg · RIR ${x.rir ?? '—'}`,x.note,'gym')).join('') || '<p class="muted">Zatím žádné cviky.</p>';
  $('#runLog').innerHTML = state.runs.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,50).map(x=>logItem(x.id,`${formatDate(x.date)} · ${x.type}`,`${x.distance} km · ${x.time || '—'} · ${pace(x)} · HR ${x.hr||'—'}`,x.note,'runs')).join('') || '<p class="muted">Zatím žádné běhy.</p>';
  $('#progressionTip').textContent = progressionTip(); $('#prBoard').innerHTML = prBoard();
  $$('.delete-log').forEach(b=>b.addEventListener('click',()=>deleteLog(b.dataset.type,b.dataset.id)));
}
function logItem(id,title,meta,note,type){ return `<div class="log-item"><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(meta)}</span>${note?`<small><br>${escapeHtml(note)}</small>`:''}</div><button class="delete-log" data-type="${type}" data-id="${id}">Smazat</button></div>`; }
function deleteLog(type,id){ state[type]=state[type].filter(x=>x.id!==id); save(); toast('Zápis smazán.'); }
function escapeHtml(s){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function progressionTip(){
  if(!state.gym.length) return 'Přidej první cviky a ukážu progres.';
  const last=state.gym.at(-1); const same=state.gym.filter(g=>g.exercise.toLowerCase()===last.exercise.toLowerCase()).slice(-3);
  if(same.length<2) return `U ${last.exercise} máš první zápis. Příště drž techniku a nech 1–2 RIR.`;
  const prev=same.at(-2); const lastVol=volume(last), prevVol=volume(prev);
  if(lastVol>prevVol) return `${last.exercise}: volume šlo nahoru (${prevVol} → ${lastVol}). Příště můžeš zkusit +1 rep nebo +2.5 kg.`;
  return `${last.exercise}: podobný/nižší volume než minule. Zkus nejdřív přidat reps, až potom váhu.`;
}
function prBoard(){
  const prs=[1,5,10].map(dist=>{
    const candidates=state.runs.filter(r=>r.distance>=dist&&r.seconds).map(r=>({dist,time:r.seconds*(dist/r.distance),date:r.date})).sort((a,b)=>a.time-b.time);
    const best=candidates[0]; return `<div class="pr"><span>${dist} km odhad</span><strong>${best?secToTime(best.time):'—'}</strong></div>`;
  }).join('');
  const longest=state.runs.slice().sort((a,b)=>b.distance-a.distance)[0];
  return prs + `<div class="pr"><span>Longest run</span><strong>${longest?longest.distance.toFixed(1)+' km':'—'}</strong></div>`;
}
function secToTime(sec){ sec=Math.round(sec); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60; return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`; }
function aggregateDaily(key, days=14){ return lastDays(days).map(d=>({date:d, value:num(state.daily[d]?.[key]) || state.nutrition.filter(n=>n.date===d).reduce((a,n)=>a+num(n[key]),0)})); }
function aggregateRuns(days=14){ return lastDays(days).map(d=>({date:d,value:state.runs.filter(r=>r.date===d).reduce((a,r)=>a+num(r.distance),0)})); }
function aggregateGym(days=14){ return lastDays(days).map(d=>({date:d,value:state.gym.filter(g=>g.date===d).reduce((a,g)=>a+volume(g),0)})); }
function drawCharts(){ drawLine('weightChart', lastDays(21).map(d=>({date:d,value:num(state.daily[d]?.weight)||null})).filter(x=>x.value), 'kg'); drawLine('kcalChart', aggregateDaily('kcal',14), 'kcal'); drawLine('runChart', aggregateRuns(14), 'km'); drawLine('gymChart', aggregateGym(14), 'vol'); }
function drawLine(id,data,label){
  const c=$('#'+id); if(!c) return; const ctx=c.getContext('2d'), w=c.width=c.clientWidth*devicePixelRatio, h=c.height=220*devicePixelRatio; ctx.clearRect(0,0,w,h); ctx.scale(devicePixelRatio,devicePixelRatio);
  const W=c.clientWidth,H=220,p=26; ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1; for(let i=0;i<4;i++){ const y=p+i*(H-p*2)/3; ctx.beginPath(); ctx.moveTo(p,y); ctx.lineTo(W-p,y); ctx.stroke(); }
  if(!data.length){ ctx.fillStyle='rgba(255,255,255,.45)'; ctx.font='14px system-ui'; ctx.fillText('Čekám na data',p,H/2); return; }
  const vals=data.map(d=>d.value).filter(v=>v!==null), min=Math.min(...vals,0), max=Math.max(...vals,1), range=max-min||1;
  const pts=data.map((d,i)=>({x:p+(data.length===1?.5:i/(data.length-1))*(W-p*2), y:H-p-((d.value-min)/range)*(H-p*2),...d}));
  const grad=ctx.createLinearGradient(0,0,W,0); grad.addColorStop(0,'#7c5cff'); grad.addColorStop(1,'#00e5a8'); ctx.strokeStyle=grad; ctx.lineWidth=3; ctx.beginPath(); pts.forEach((pt,i)=> i?ctx.lineTo(pt.x,pt.y):ctx.moveTo(pt.x,pt.y)); ctx.stroke();
  pts.forEach(pt=>{ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(pt.x,pt.y,3,0,Math.PI*2); ctx.fill(); });
  ctx.fillStyle='rgba(255,255,255,.65)'; ctx.font='12px system-ui'; ctx.fillText(`${Math.round(max)} ${label}`,p,16); ctx.fillText(formatDate(data.at(-1).date),W-p-62,H-6);
}
function exportData(){ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`training-arc-os-${today()}.json`; a.click(); URL.revokeObjectURL(a.href); }
function importData(e){ const file=e.target.files[0]; if(!file) return; const r=new FileReader(); r.onload=()=>{ try{ state=JSON.parse(r.result); save(); toast('Import hotový.'); }catch{ toast('Import failnul.'); } }; r.readAsText(file); }
function addDemoData(){
  if(!confirm('Přidat pár demo zápisů?')) return;
  lastDays(9).forEach((d,i)=>{ state.daily[d]={weight:80.5-i*.12+(i%2*.2),kcal:2700+i*42,protein:155+i*3,steps:7500+i*800}; });
  state.runs.push({id:crypto.randomUUID(),date:lastDays(6)[0],type:'Easy',distance:5.1,time:'29:40',seconds:1780,hr:145,rpe:4,elevation:20,note:'demo'}, {id:crypto.randomUUID(),date:lastDays(3)[0],type:'Tempo',distance:6.0,time:'27:50',seconds:1670,hr:171,rpe:8,elevation:32,note:'demo'});
  state.gym.push({id:crypto.randomUUID(),date:lastDays(4)[0],workout:'Upper',exercise:'Incline bench',sets:3,reps:'8,7,6',weight:75,rir:1,note:'demo'}, {id:crypto.randomUUID(),date:lastDays(1)[0],workout:'Upper',exercise:'Incline bench',sets:3,reps:'8,8,6',weight:75,rir:1,note:'demo'});
  save(); toast('Demo data přidána.');
}

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
initLock();
