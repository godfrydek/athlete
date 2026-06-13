/* Training Arc OS v9 Ulti — additive upgrade layer. */
(function(){
  const V9_VERSION = 'v9 Ulti';
  const V9_VIEWS = [
    ['v9-coach','Coach Hub'],['v9-periodization','Program Builder'],['v9-sport','Sport Events'],['v9-injury','Injury Guard'],['v9-sleep','Sleep Lab'],['v9-pantry','Pantry'],['v9-owner','Owner Lab']
  ];
  const V9_TITLES = Object.fromEntries(V9_VIEWS);
  const qs=(s,r=document)=>r.querySelector(s); const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const has=(id)=>!!document.getElementById(id);
  const clean=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const uid9=()=> 'v9_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const n=(v,d=0)=>{const x=Number(v); return Number.isFinite(x)?x:d;};
  const today=()=>new Date().toISOString().slice(0,10);

  function initV9(){
    patchBranding();
    injectSidebarTools();
    injectNav();
    injectViews();
    injectMobileChrome();
    patchCore();
    bindGlobalUi();
  }

  function patchBranding(){
    document.title='Training Arc OS v9 Ulti';
    const meta=qs('meta[name="description"]'); if(meta) meta.content='Training Arc OS v9 Ulti — private athlete life operating system.';
    qsa('.sidebar-top span').forEach(x=>x.textContent='v9 Ulti');
    qsa('.lock-card h1 span').forEach(x=>x.textContent='v9');
    const side=qs('.lock-side .eyebrow'); if(side) side.textContent='v9 ulti upgrade';
    const h2=qs('.lock-side h2'); if(h2) h2.textContent='Private Athlete Operating System';
    const lead=qs('.lock-card .lead'); if(lead) lead.textContent='All-in-one training arc: výživa, gym, běh, mobilita, eventy, deník, future-self, cloud sync a secure vault.';
  }

  function injectSidebarTools(){
    const nav=qs('#nav'); if(!nav || has('v9NavSearch')) return;
    const tools=document.createElement('div'); tools.className='v9-sidebar-tools'; tools.innerHTML=`
      <input id="v9NavSearch" class="v9-nav-search" placeholder="Search modules…" autocomplete="off" />
      <div class="v9-nav-kpis"><span id="v9NavFoodKpi">Food</span><span id="v9NavRecipeKpi">Recipes</span><span id="v9NavSyncKpi">Vault</span></div>
      <button id="v9CompactSidebar" class="btn ghost tiny full">Compact sidebar</button>`;
    nav.parentNode.insertBefore(tools,nav);
    qs('#v9NavSearch').addEventListener('input',filterNav);
    qs('#v9CompactSidebar').addEventListener('click',()=>qs('.sidebar')?.classList.toggle('v9-compact'));
  }
  function filterNav(){
    const q=(qs('#v9NavSearch')?.value||'').toLowerCase().trim();
    qsa('.nav-btn').forEach(b=>{ const txt=(b.textContent+' '+b.dataset.view).toLowerCase(); b.classList.toggle('v9-hidden', !!q && !txt.includes(q)); });
  }

  function injectNav(){
    const nav=qs('#nav'); if(!nav || has('nav-v9-coach')) return;
    const label=document.createElement('div'); label.className='v9-section-chip'; label.textContent='v9 Ulti'; nav.appendChild(label);
    V9_VIEWS.forEach(([view,label])=>{
      const b=document.createElement('button'); b.className='nav-btn'; b.dataset.view=view; b.id='nav-'+view; b.textContent=label; b.addEventListener('click',()=>switchView(view)); nav.appendChild(b);
    });
  }

  function injectMobileChrome(){
    if(!has('v9MobileToggle')){
      const btn=document.createElement('button'); btn.id='v9MobileToggle'; btn.className='v9-mobile-toggle'; btn.textContent='☰ Modules'; document.body.appendChild(btn);
      const bd=document.createElement('div'); bd.id='v9Backdrop'; bd.className='v9-backdrop'; document.body.appendChild(bd);
      btn.addEventListener('click',()=>{ qs('.sidebar')?.classList.add('show'); bd.classList.add('show'); });
      bd.addEventListener('click',()=>{ qs('.sidebar')?.classList.remove('show'); bd.classList.remove('show'); });
    }
  }

  function injectViews(){
    const anchor=qs('#analytics') || qs('#connections') || qs('.content');
    if(!anchor || has('v9-coach')) return;
    anchor.insertAdjacentHTML('beforebegin', `
<section id="v9-coach" class="view">
  <article class="v9-hero glass"><div><p class="eyebrow">v9 ultimate coach</p><h1>Coach Hub <span>readiness, review, red flags, prompts</span></h1><p class="lead">Jedno místo pro rozhodování: mám dnes tlačit, držet easy, deloadnout, nebo jen vyhrát den?</p><div class="button-row wrap"><button class="btn primary" onclick="v9GenerateDailyCoach()">Generate coach plan</button><button class="btn ghost" onclick="v9CopyCoachPrompt()">Copy AI prompt</button><button class="btn ghost" onclick="v9SaveCoachReview()">Save review</button></div></div><div class="v9-orb"><span>readiness</span><strong id="v9ReadinessScore">0</strong><small id="v9ReadinessLabel">—</small></div></article>
  <div class="grid two"><section class="panel glass"><div class="panel-head"><h3>Daily decision engine</h3><span class="tag">auto</span></div><div id="v9DailyCoach" class="coach-list"></div></section><section class="panel glass"><div class="panel-head"><h3>Weekly review</h3><span class="tag">last 7 days</span></div><textarea id="v9ReviewNote" placeholder="Co šlo dobře, co tě ničilo, co chceš další týden…"></textarea><div id="v9WeeklyReview" class="coach-list"></div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Red flags</h3><span class="tag">risk scan</span></div><div id="v9RedFlags" class="v9-grid"></div></section>
</section>
<section id="v9-periodization" class="view">
  <article class="v9-hero glass"><div><p class="eyebrow">v9 program builder</p><h1>Training Blocks <span>hybrid gym × run periodization</span></h1><p class="lead">Vygeneruj týdenní/měsíční kostru podle cíle, dní a recovery. Neřeší jen cviky, ale i běh, mobilitu a deload.</p></div><div class="v9-orb"><span>block</span><strong>4W</strong><small>base / build / deload</small></div></article>
  <div class="grid two"><section class="panel glass"><div class="panel-head"><h3>Block generator</h3><span class="tag">draft</span></div><div class="form-grid compact"><label>Cíl<select id="v9BlockGoal"><option>Hybrid athlete</option><option>10 km faster</option><option>Muscle-up polish</option><option>Police test prep</option><option>Lean bulk</option><option>Cut performance</option></select></label><label>Gym days<input id="v9GymDays" type="number" value="5" min="0" max="7"></label><label>Run days<input id="v9RunDays" type="number" value="4" min="0" max="7"></label><label>Recovery stav<select id="v9RecoveryState"><option>normal</option><option>fresh</option><option>tired</option><option>rýma / low immune</option><option>race week</option></select></label></div><textarea id="v9BlockNotes" placeholder="Poznámky: závod, škola, směny, bolí lýtko…"></textarea><div class="button-row wrap"><button class="btn primary" onclick="v9GenerateBlock()">Generate block</button><button class="btn ghost" onclick="v9SaveBlock()">Save block</button></div></section><section class="panel glass"><div class="panel-head"><h3>Output</h3><span class="tag">editable idea</span></div><div id="v9BlockOutput" class="plan-grid"></div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Saved blocks</h3><span class="tag" id="v9BlockCount">0</span></div><div id="v9SavedBlocks" class="list"></div></section>
</section>
<section id="v9-sport" class="view">
  <article class="v9-hero glass"><div><p class="eyebrow">v9 sport command</p><h1>Events & Tests <span>races, benchmarks, checklists</span></h1><p class="lead">Závody, testy, PR pokusy, školní/policejní příprava a checklisty na den D.</p></div><div class="v9-orb"><span>next</span><strong id="v9NextEventDays">—</strong><small>days</small></div></article>
  <div class="grid two"><section class="panel glass"><div class="panel-head"><h3>Add event/test</h3><span class="tag">calendar</span></div><div class="form-grid compact"><label>Název<input id="v9EventName" placeholder="Valtice 6 km / 1 km test"></label><label>Datum<input id="v9EventDate" type="date"></label><label>Typ<select id="v9EventType"><option>Race</option><option>Time trial</option><option>Gym PR</option><option>School test</option><option>Police prep</option><option>Health check</option></select></label><label>Goal<input id="v9EventGoal" placeholder="sub 27 / 50 kliků"></label></div><textarea id="v9EventNotes" placeholder="Gear, travel, warm-up, pace plán…"></textarea><button class="btn primary" onclick="v9AddSportEvent()">Add event</button></section><section class="panel glass"><div class="panel-head"><h3>Benchmarks</h3><span class="tag">quick test</span></div><div id="v9Benchmarks" class="v9-grid"></div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Event list</h3><span class="tag" id="v9EventCount">0</span></div><div id="v9EventList" class="list"></div></section>
</section>
<section id="v9-injury" class="view">
  <article class="v9-hero glass"><div><p class="eyebrow">v9 injury guard</p><h1>Prehab & Pain Log <span>stay hard, but not stupid</span></h1><p class="lead">Log bolesti, soreness, symptomy a dostaneš praktický risk scan. Není to doktor, ale pomůže nepřehlížet patterny.</p></div><div class="v9-orb"><span>risk</span><strong id="v9InjuryRisk">0</strong><small>/100</small></div></article>
  <div class="grid two"><section class="panel glass"><div class="panel-head"><h3>Pain / symptom log</h3><span class="tag">private</span></div><div class="form-grid compact"><label>Lokace<input id="v9PainLocation" placeholder="lýtko, koleno, hrudník…"></label><label>Bolest 0–10<input id="v9PainScore" type="number" min="0" max="10" value="0"></label><label>Trigger<input id="v9PainTrigger" placeholder="běh, leg press, bench…"></label><label>Status<select id="v9PainStatus"><option>watch</option><option>improving</option><option>worse</option><option>sharp pain</option><option>swelling</option></select></label></div><textarea id="v9PainNotes" placeholder="Co přesně, kdy, po čem, jestli otok/teplo/dušnost atd."></textarea><button class="btn primary" onclick="v9AddPainLog()">Save log</button></section><section class="panel glass"><div class="panel-head"><h3>Guard advice</h3><span class="tag">rules</span></div><div id="v9InjuryAdvice" class="coach-list"></div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>History</h3><span class="tag" id="v9PainCount">0</span></div><div id="v9PainList" class="list"></div></section>
</section>
<section id="v9-sleep" class="view">
  <article class="v9-hero glass"><div><p class="eyebrow">v9 recovery brain</p><h1>Sleep Lab <span>caffeine, bedtime, readiness</span></h1><p class="lead">Spánek je cheat code. Tady řešíš večerní protokol, kofein cutoff a recovery score.</p></div><div class="v9-orb"><span>sleep avg</span><strong id="v9SleepAvg">—</strong><small>hours / 7d</small></div></article>
  <div class="grid two"><section class="panel glass"><div class="panel-head"><h3>Sleep log</h3><span class="tag">quick</span></div><div class="form-grid compact"><label>Spánek h<input id="v9SleepHours" type="number" step="0.1" placeholder="7.5"></label><label>Kvalita 1–10<input id="v9SleepQuality" type="number" min="1" max="10" placeholder="8"></label><label>Kofein poslední čas<input id="v9CaffeineTime" type="time"></label><label>Wake time<input id="v9WakeTime" type="time"></label></div><textarea id="v9SleepNotes" placeholder="Mobil, stres, teplo, rýma, pozdní trénink…"></textarea><button class="btn primary" onclick="v9SaveSleepLog()">Save sleep</button></section><section class="panel glass"><div class="panel-head"><h3>Sleep optimizer</h3><span class="tag">protocol</span></div><div id="v9SleepAdvice" class="coach-list"></div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Sleep history</h3><span class="tag" id="v9SleepCount">0</span></div><div id="v9SleepList" class="list"></div></section>
</section>
<section id="v9-pantry" class="view">
  <article class="v9-hero glass"><div><p class="eyebrow">v9 nutrition ops</p><h1>Pantry & Shopping <span>budget, stock, groceries</span></h1><p class="lead">Jídlo není jen logování — potřebuješ mít doma věci. Pantry hlídá zásoby, low-stock a generuje nákup.</p></div><div class="v9-orb"><span>items</span><strong id="v9PantryCountOrb">0</strong><small>in stock</small></div></article>
  <div class="grid two"><section class="panel glass"><div class="panel-head"><h3>Add pantry item</h3><span class="tag">stock</span></div><div class="form-grid compact"><label>Item<input id="v9PantryName" placeholder="rýže, whey, skyr…"></label><label>Množství<input id="v9PantryQty" placeholder="2 kg / 6 ks"></label><label>Kategorie<select id="v9PantryCat"><option>protein</option><option>carbs</option><option>fruit/veg</option><option>supps</option><option>snack</option><option>other</option></select></label><label>Low-stock alert<input id="v9PantryAlert" placeholder="pod 1 kg / 2 ks"></label></div><button class="btn primary" onclick="v9AddPantryItem()">Add to pantry</button></section><section class="panel glass"><div class="panel-head"><h3>Smart grocery draft</h3><span class="tag">copy</span></div><div id="v9GroceryDraft" class="coach-list"></div><button class="btn ghost" onclick="v9CopyGroceryDraft()">Copy grocery list</button></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Pantry</h3><span class="tag" id="v9PantryCount">0</span></div><div id="v9PantryList" class="list"></div></section>
</section>
<section id="v9-owner" class="view">
  <article class="v9-hero glass"><div><p class="eyebrow">v9 product mode</p><h1>Owner Lab <span>personal now, paid later</span></h1><p class="lead">Příprava na budoucí free/pro/elite verze: feature gates, legal notes, launch checklist a hosting roadmap.</p></div><div class="v9-orb"><span>mode</span><strong>OS</strong><small>build → host → monetize</small></div></article>
  <div class="grid three"><section class="panel glass"><div class="panel-head"><h3>Free</h3><span class="tag">0 Kč</span></div><div id="v9FreeTier" class="coach-list"></div></section><section class="panel glass"><div class="panel-head"><h3>Pro</h3><span class="tag">25–49 Kč</span></div><div id="v9ProTier" class="coach-list"></div></section><section class="panel glass"><div class="panel-head"><h3>Elite</h3><span class="tag">79–149 Kč</span></div><div id="v9EliteTier" class="coach-list"></div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Hosting → paid checklist</h3><span class="tag">next</span></div><div id="v9OwnerChecklist" class="v9-grid"></div></section>
</section>`);
  }

  function patchCore(){
    if(typeof migrate==='function' && !migrate.__v9){
      const oldMigrate=migrate;
      migrate=function(){ oldMigrate(); migrateV9(); };
      migrate.__v9=true;
    }
    if(typeof renderAll==='function' && !renderAll.__v9){
      const oldRenderAll=renderAll;
      renderAll=function(){ oldRenderAll(); renderV9All(); };
      renderAll.__v9=true;
    }
    if(typeof switchView==='function' && !switchView.__v9){
      const oldSwitch=switchView;
      switchView=function(view){ oldSwitch(view); if(V9_TITLES[view] && has('viewTitle')) qs('#viewTitle').textContent=V9_TITLES[view]; if(qs('#v9Backdrop')){ qs('.sidebar')?.classList.remove('show'); qs('#v9Backdrop').classList.remove('show'); } };
      switchView.__v9=true;
    }
    if(typeof versionHistory==='function' && !versionHistory.__v9){
      const oldVersionHistory=versionHistory;
      versionHistory=function(){
        const hist=oldVersionHistory().filter(x=>x.v!=='v9');
        hist.forEach(x=>{ if(x.tag==='current') x.tag='legacy'; });
        hist.push({v:'v9',title:'Ulti Athlete Command Center',tag:'current',items:['Major sidebar/layout fix for desktop, tablet and mobile','Split upgrade into css/js/data files for hosting readiness','Added Coach Hub, Program Builder, Sport Events, Injury Guard, Sleep Lab, Pantry and Owner Lab','Expanded food and recipe packs again with performance variants','Better changelog/hosting readiness before deploy']});
        return hist;
      };
      versionHistory.__v9=true;
    }
    window.currentPatchNotes=function(){ return ['V10 Historic drží opravenou levou lištu: sticky sidebar, scroll, search, compact mode a mobile drawer.','Appka obsahuje Coach Hub, Program Builder, Sport Events, Injury Guard, Sleep Lab, Pantry a Owner Lab.','Projekt má separátní css/js/data soubory, aby byl připravenější na hosting a další refactor.','Nutrition pack je rozšířený o další food/recipe/performance varianty.','Branding je V10 Historic; další velký krok je hosting a cloud test.']; };
    window.renderVersionsPage=function(){
      if(!has('versionTimeline')) return;
      const foodCount=((state.foods||[]).length+(state.customFoods||[]).length);
      const recipeCount=((state.recipes||[]).length+(state.customRecipes||[]).length);
      if(has('versionFoodCount')) qs('#versionFoodCount').textContent=foodCount.toLocaleString('cs-CZ');
      if(has('versionRecipeCount')) qs('#versionRecipeCount').textContent=recipeCount.toLocaleString('cs-CZ');
      if(has('versionExerciseCount')) qs('#versionExerciseCount').textContent=(state.exercisePresets||[]).length.toLocaleString('cs-CZ');
      if(has('versionModuleCount')) qs('#versionModuleCount').textContent=qsa('.view').length.toLocaleString('cs-CZ');
      qs('#versionTimeline').innerHTML=versionHistory().map((r,i)=>`<article class="release-card ${r.v==='v9'?'current':''}"><div class="release-index">${i+1}</div><div><div class="item-head"><div><span class="tag">${clean(r.tag)}</span><h3>${clean(r.v)} · ${clean(r.title)}</h3></div>${r.v==='v9'?'<span class="status-pill">current</span>':''}</div><ul>${r.items.map(x=>`<li>${clean(x)}</li>`).join('')}</ul></div></article>`).join('');
      if(has('currentPatchNotes')) qs('#currentPatchNotes').innerHTML=currentPatchNotes().map(x=>`<div class="coach-tip">${clean(x)}</div>`).join('');
      if(has('versionHostingSteps')){ const steps=[['1','GitHub repo','Nahraj V9 soubory do repa.'],['2','Vercel / Netlify','Deploy static appku s HTTPS.'],['3','Supabase','Spusť SQL, nastav Auth/RLS a vlož anon key.'],['4','Multi-device test','PC create vault → push → mobil pull.'],['5','V10 later','Po hostingu řešit serverless, Stripe/email/AI endpoint.']]; qs('#versionHostingSteps').innerHTML=steps.map(s=>`<div class="version-step"><strong>${s[0]}</strong><h4>${clean(s[1])}</h4><p>${clean(s[2])}</p></div>`).join(''); }
    };
    window.changelogText=function(){ return 'Training Arc OS v9 Ulti — changelog\n\n' + versionHistory().map(r=>`${r.v} — ${r.title} [${r.tag}]\n`+r.items.map(x=>' - '+x).join('\n')).join('\n\n') + '\n\nCurrent V9 notes\n' + currentPatchNotes().map(x=>' - '+x).join('\n'); };
    window.exportChangelog=function(){ download('training_arc_os_v9_changelog.txt', window.changelogText(), 'text/plain'); };
  }

  function migrateV9(){
    if(!state) return;
    state.meta=state.meta||{}; state.meta.version=9; state.meta.label='v9 Ulti';
    state.v9PainLogs=state.v9PainLogs||[]; state.v9SleepLogs=state.v9SleepLogs||[]; state.v9Pantry=state.v9Pantry||[]; state.v9SportEvents=state.v9SportEvents||[]; state.v9CoachReviews=state.v9CoachReviews||[]; state.v9ProgramBlocks=state.v9ProgramBlocks||[];
    state.v9Flags=state.v9Flags||{firstOpenedAt:new Date().toISOString()};
    mergeV9Foods(); mergeV9Recipes(); mergeV9ExerciseRunBoosts();
  }
  function mergeV9Foods(){
    if(typeof window.V9_FOOD_PACK!=='function') return;
    const existing=new Set((state.foods||[]).map(f=>String(f.name||'').toLowerCase()));
    const extra=window.V9_FOOD_PACK().filter(f=>!existing.has(String(f.name||'').toLowerCase()));
    if(extra.length){ state.foods=[...(state.foods||[]),...extra]; }
  }
  function mergeV9Recipes(){
    if(typeof window.V9_RECIPE_PACK!=='function') return;
    const existing=new Set([...(state.recipes||[]),...(state.customRecipes||[])].map(r=>String(r.title||r.name||'').toLowerCase()));
    const extra=window.V9_RECIPE_PACK().filter(r=>!existing.has(String(r.title||r.name||'').toLowerCase()));
    if(extra.length) state.recipes=[...(state.recipes||[]),...extra];
  }
  function mergeV9ExerciseRunBoosts(){
    const ex=['Weighted push-ups 20kg','Weighted push-ups 30kg','AMRAP strict push-ups','Push-up density block','Explosive pull-up high chest','Muscle-up transition low bar','False grip hang','Straight bar dip deep','Nordic curl progression','Tibialis raises weighted','Soleus raises bent knee','Hip airplane','Copenhagen plank progression','Pogo jumps low amplitude','Hill sprint 8s','Police shuttle drill','CMT practice circuit','Breathing reset walk','Post-race flush bike','Deload fullbody pump'];
    state.exercisePresets=[...new Set([...(state.exercisePresets||[]),...ex])];
    if(typeof RUN_TYPES!=='undefined'){
      const names=new Set(RUN_TYPES.map(r=>r.name));
      [['HR capped easy','easy with HR ceiling','Z2 / talk test'],['1 km race pace repeats','police/school speed','Z5 controlled'],['Long run fuel test','test gels/water','Z2–Z3'],['Run-walk recovery','low fatigue aerobic','easy'],['Windy day adjusted run','effort over pace','easy/steady'],['Sick mode walk-jog','keep streak, no ego','very easy']].forEach(r=>{ if(!names.has(r[0])) RUN_TYPES.push({name:r[0],goal:r[1],intensity:r[2]}); });
    }
    if(typeof COMMANDS!=='undefined') V9_VIEWS.forEach(([name,title])=>{ if(!COMMANDS.some(c=>c[0]===title)) COMMANDS.push([title,name]); });
  }

  function renderV9All(){
    if(!state) return;
    migrateV9();
    updateNavKpis(); renderCoachHub(); renderProgramBuilder(); renderSportEvents(); renderInjuryGuard(); renderSleepLab(); renderPantry(); renderOwnerLab(); renderVersionsV9Patch();
  }
  function updateNavKpis(){
    if(has('v9NavFoodKpi')) qs('#v9NavFoodKpi').textContent=((state.foods||[]).length+(state.customFoods||[]).length).toLocaleString('cs-CZ')+' foods';
    if(has('v9NavRecipeKpi')) qs('#v9NavRecipeKpi').textContent=((state.recipes||[]).length+(state.customRecipes||[]).length).toLocaleString('cs-CZ')+' rec';
    if(has('v9NavSyncKpi')) qs('#v9NavSyncKpi').textContent=(state.settings?.cloud?.url?'cloud':'local');
  }

  function readinessScore(){
    const d=state.days?.[selectedDate]||{}; let s=55;
    const sleep=n(d.sleep); if(sleep>=8) s+=16; else if(sleep>=7) s+=10; else if(sleep>=6) s+=3; else if(sleep) s-=12;
    const mood=n(d.mood); if(mood>=8)s+=8; else if(mood&&mood<=4)s-=8;
    const energy=n(d.energy); if(energy>=8)s+=10; else if(energy&&energy<=4)s-=10;
    const sore=n(d.soreness); if(sore>=7)s-=15; else if(sore>=5)s-=7; else if(sore>0)s+=3;
    const pain=(state.v9PainLogs||[]).filter(x=>x.date===selectedDate).reduce((a,x)=>Math.max(a,n(x.score)),0); if(pain>=7)s-=25; else if(pain>=4)s-=10;
    const weekKm=typeof weekRunKm==='function'?weekRunKm():0; if(weekKm>n(state.targets?.runKm,30)*1.2)s-=8;
    return Math.max(0,Math.min(100,Math.round(s)));
  }
  function renderCoachHub(){
    if(!has('v9ReadinessScore')) return;
    const score=readinessScore(); qs('#v9ReadinessScore').textContent=score; qs('#v9ReadinessLabel').textContent=score>=80?'go hard smart':score>=62?'normal training':score>=45?'keep it controlled':'recovery bias';
    const d=state.days?.[selectedDate]||{}; const tips=[];
    if(score>=80) tips.push(['Attack day','Můžeš dát kvalitní session, ale drž techniku a nerozbíjej se zbytečně.']);
    else if(score>=62) tips.push(['Normal day','Trénuj podle plánu. Dej jeden hlavní cíl, ne 6 ego PR najednou.']);
    else if(score>=45) tips.push(['Controlled day','Sniž objem/intenzitu o 15–30 %, dej mobilitu a výživu.']);
    else tips.push(['Recovery bias','Dnes spíš chůze, lehká mobilita, jídlo, spánek. Žádný hero mode.']);
    if(n(d.protein||0)<n(state.targets?.protein,175)*.75) tips.push(['Protein','Dnes zatím nízký protein — přidej skyr/tvaroh/whey/maso.']);
    if(n(d.sleep)<6 && d.sleep) tips.push(['Sleep debt','Spánek pod 6 h = drž RPE níž, hlavně nohy/běh.']);
    if((state.v9PainLogs||[]).some(x=>x.date===selectedDate && n(x.score)>=6)) tips.push(['Pain flag','Bolest 6+ dnes: neignoruj sharp/swelling/worse pattern.']);
    qs('#v9DailyCoach').innerHTML=tips.map(t=>`<div class="coach-tip"><strong>${clean(t[0])}</strong><br>${clean(t[1])}</div>`).join('');
    const recent=recentIso(7); const kcal=recent.reduce((a,iso)=>a+n(state.days?.[iso]?.kcal),0); const km=(state.runs||[]).filter(r=>recent.includes(r.date)).reduce((a,r)=>a+n(r.distance),0); const workouts=(state.workouts||[]).filter(w=>recent.includes(w.date)).length;
    qs('#v9WeeklyReview').innerHTML=`<div class="coach-tip"><strong>7d snapshot</strong><br>${Math.round(kcal/7)||0} kcal/day avg · ${Math.round(km*10)/10} km · ${workouts} gym sessions</div><div class="coach-tip"><strong>Next week rule</strong><br>${km>n(state.targets?.runKm,30)*1.15?'Nezvyšuj běžecký objem, radši quality/recovery.':'Můžeš držet nebo lehce přidat easy objem.'}</div>`;
    const flags=[]; if(score<45) flags.push(['Low readiness','Zvaž deload / recovery day.']); if(n(d.soreness)>=7) flags.push(['High soreness','Další hard lower/run není smart.']); if(n(d.sleep)<6 && d.sleep) flags.push(['Low sleep','Kofein cutoff + earlier winddown.']); if(!flags.length) flags.push(['Green','Žádný velký red flag z dnešních dat.']);
    qs('#v9RedFlags').innerHTML=flags.map(f=>`<div class="v9-card ${f[0]==='Green'?'v9-ok':'v9-warn'}"><h4>${clean(f[0])}</h4><p>${clean(f[1])}</p></div>`).join('');
  }
  window.v9GenerateDailyCoach=()=>{ renderCoachHub(); toast('V9 coach refresh hotový.'); };
  window.v9CopyCoachPrompt=async()=>{ const prompt=`Jsi můj hybrid athlete coach. Dnešní readiness ${readinessScore()}/100. Data: ${JSON.stringify(state.days?.[selectedDate]||{})}. Poslední běhy: ${JSON.stringify((state.runs||[]).slice(0,5))}. Poslední gym: ${JSON.stringify((state.workouts||[]).slice(0,3))}. Dej stručný plán na dnes, recovery rizika a jednu prioritu.`; await navigator.clipboard.writeText(prompt); toast('Coach prompt copied.'); };
  window.v9SaveCoachReview=()=>{ state.v9CoachReviews.unshift({id:uid9(),date:selectedDate,text:qs('#v9ReviewNote').value,score:readinessScore(),createdAt:new Date().toISOString()}); saveVault(); toast('Review uloženo.'); };

  function blockDays(goal,gym,run,recovery){
    const easy=recovery.includes('tired')||recovery.includes('rýma'); const race=recovery.includes('race');
    if(race) return [['Po','Upper pump + mobility','Easy 20–30 min'],['Út','Volno / activation','Strides only'],['St','Race / time trial','Warm-up + cooldown'],['Čt','Recovery','Walk + stretch'],['Pá','Upper easy','No ego'],['So','Easy run','Z2'],['Ne','Long easy short','Podle nohou']];
    const base=[['Po','Upper strength','Easy run'],['Út','Mobility / rest','Walk'],['St','Upper + speed','Intervals/tempo'],['Čt','Lower controlled','Easy run'],['Pá','Long run + upper pump','Fuel test'],['So','Rest','Steps'],['Ne','Lower + skill','Optional recovery jog']];
    if(easy) return base.map(x=>[x[0],x[1].replace('strength','technique').replace('speed','light'),x[2].replace('Intervals/tempo','Easy only').replace('Long run','Short easy')]);
    if(goal.includes('10 km')) return [['Po','Upper','Easy + strides'],['Út','Rest','Walk'],['St','Upper pump','Cruise intervals'],['Čt','Lower light','Easy'],['Pá','Rest/upper short','Long run'],['So','Rest','Walk'],['Ne','Lower mobility','Recovery jog']];
    return base.slice(0,7).map((x,i)=> i<Math.max(gym,run)?x:x);
  }
  window.v9GenerateBlock=()=>{ const goal=qs('#v9BlockGoal').value, gym=n(qs('#v9GymDays').value,5), run=n(qs('#v9RunDays').value,4), rec=qs('#v9RecoveryState').value; const days=blockDays(goal,gym,run,rec); qs('#v9BlockOutput').innerHTML=days.map(d=>`<div class="plan-day"><strong>${clean(d[0])}</strong><span>${clean(d[1])}</span><small>${clean(d[2])}</small></div>`).join('')+`<div class="coach-tip"><strong>Progression</strong><br>Week 1 base, week 2 +5–10 %, week 3 quality, week 4 deload/test podle recovery.</div>`; };
  window.v9SaveBlock=()=>{ const out=qs('#v9BlockOutput').textContent.trim(); if(!out){v9GenerateBlock();} state.v9ProgramBlocks.unshift({id:uid9(),date:selectedDate,goal:qs('#v9BlockGoal').value,recovery:qs('#v9RecoveryState').value,notes:qs('#v9BlockNotes').value,html:qs('#v9BlockOutput').innerHTML,createdAt:new Date().toISOString()}); saveVault(); };
  function renderProgramBuilder(){ if(!has('v9SavedBlocks')) return; qs('#v9BlockCount').textContent=(state.v9ProgramBlocks||[]).length; qs('#v9SavedBlocks').innerHTML=(state.v9ProgramBlocks||[]).slice(0,12).map(b=>`<div class="item"><div class="item-head"><div><strong>${clean(b.date)} · ${clean(b.goal)}</strong><small>${clean(b.recovery)} · ${clean(b.notes||'')}</small></div><button class="btn tiny ghost danger" onclick="v9DeleteBlock('${b.id}')">×</button></div></div>`).join('')||'<div class="item muted">Žádné saved blocks.</div>'; }
  window.v9DeleteBlock=id=>{ state.v9ProgramBlocks=state.v9ProgramBlocks.filter(x=>x.id!==id); saveVault(); };

  function renderSportEvents(){ if(!has('v9EventList')) return; const ev=(state.v9SportEvents||[]).sort((a,b)=>String(a.date).localeCompare(String(b.date))); const next=ev.find(e=>e.date>=today()); if(next){ const diff=Math.ceil((new Date(next.date)-new Date(today()))/86400000); qs('#v9NextEventDays').textContent=diff; } else qs('#v9NextEventDays').textContent='—'; qs('#v9EventCount').textContent=ev.length; qs('#v9EventList').innerHTML=ev.map(e=>`<div class="item"><div class="item-head"><div><strong>${clean(e.date)} · ${clean(e.name)}</strong><small>${clean(e.type)} · goal ${clean(e.goal||'—')}</small><p>${clean(e.notes||'')}</p></div><button class="btn tiny ghost danger" onclick="v9DeleteSportEvent('${e.id}')">×</button></div></div>`).join('')||'<div class="item muted">Zatím žádné eventy.</div>'; const prs=[['1 km',bestTxt(1)],['5 km',bestTxt(5)],['Week km',(typeof weekRunKm==='function'?Math.round(weekRunKm()*10)/10:'—')],['Gym sessions',(state.workouts||[]).length],['Push goal','50+'],['Muscle-up','technique']]; qs('#v9Benchmarks').innerHTML=prs.map(p=>`<div class="v9-card"><h4>${clean(p[0])}</h4><div class="v9-score">${clean(p[1]||'—')}</div></div>`).join(''); }
  function bestTxt(km){ try{return bestRace(km)||'—';}catch{return '—';} }
  window.v9AddSportEvent=()=>{ const name=qs('#v9EventName').value.trim(); if(!name) return toast('Název eventu.'); state.v9SportEvents.unshift({id:uid9(),name,date:qs('#v9EventDate').value||selectedDate,type:qs('#v9EventType').value,goal:qs('#v9EventGoal').value,notes:qs('#v9EventNotes').value,createdAt:new Date().toISOString()}); ['v9EventName','v9EventGoal','v9EventNotes'].forEach(id=>qs('#'+id).value=''); saveVault(); };
  window.v9DeleteSportEvent=id=>{ state.v9SportEvents=state.v9SportEvents.filter(x=>x.id!==id); saveVault(); };

  function renderInjuryGuard(){ if(!has('v9InjuryRisk')) return; const logs=(state.v9PainLogs||[]); const recent=logs.filter(x=>recentIso(7).includes(x.date)); const maxPain=recent.reduce((a,x)=>Math.max(a,n(x.score)),0); const worse=recent.some(x=>String(x.status).includes('worse')||String(x.status).includes('swelling')||String(x.status).includes('sharp')); const risk=Math.min(100,Math.round(maxPain*9 + (worse?25:0) + (n((state.days||{})[selectedDate]?.soreness)>=7?10:0))); qs('#v9InjuryRisk').textContent=risk; const advice=[]; if(worse) advice.push(['Red pattern','Sharp/worse/swelling pattern = nepřekrývat egem. Zvaž pauzu a odborníka, hlavně při otoku/dušnosti/hrudní bolesti.']); if(maxPain>=7) advice.push(['Pain 7+','Hard trénink přes bolest 7+ není toughness, ale gambling.']); if(maxPain>=4) advice.push(['Modify','Nahraď dopadový běh za chůzi/kolo, u gymu sniž ROM/load.']); if(!advice.length) advice.push(['OK scan','Zatím jen sleduj patterny, drž warm-up a progres postupně.']); qs('#v9InjuryAdvice').innerHTML=advice.map(a=>`<div class="coach-tip"><strong>${clean(a[0])}</strong><br>${clean(a[1])}</div>`).join(''); qs('#v9PainCount').textContent=logs.length; qs('#v9PainList').innerHTML=logs.slice(0,25).map(l=>`<div class="item ${n(l.score)>=6?'v9-danger':''}"><div class="item-head"><div><strong>${clean(l.date)} · ${clean(l.location)} · ${clean(l.score)}/10</strong><small>${clean(l.trigger)} · ${clean(l.status)}</small><p>${clean(l.notes||'')}</p></div><button class="btn tiny ghost danger" onclick="v9DeletePainLog('${l.id}')">×</button></div></div>`).join('')||'<div class="item muted">Žádný pain log.</div>'; }
  window.v9AddPainLog=()=>{ const location=qs('#v9PainLocation').value.trim(); if(!location) return toast('Zadej lokaci.'); state.v9PainLogs.unshift({id:uid9(),date:selectedDate,location,score:n(qs('#v9PainScore').value),trigger:qs('#v9PainTrigger').value,status:qs('#v9PainStatus').value,notes:qs('#v9PainNotes').value,createdAt:new Date().toISOString()}); ['v9PainLocation','v9PainTrigger','v9PainNotes'].forEach(id=>qs('#'+id).value=''); saveVault(); };
  window.v9DeletePainLog=id=>{ state.v9PainLogs=state.v9PainLogs.filter(x=>x.id!==id); saveVault(); };

  function renderSleepLab(){ if(!has('v9SleepAdvice')) return; const recent=recentIso(7); const vals=recent.map(d=>n(state.days?.[d]?.sleep,NaN)).filter(Number.isFinite); const logs=(state.v9SleepLogs||[]); const extra=logs.filter(l=>recent.includes(l.date)).map(l=>n(l.hours,NaN)).filter(Number.isFinite); const all=[...vals,...extra]; const avg=all.length?Math.round((all.reduce((a,b)=>a+b,0)/all.length)*10)/10:null; qs('#v9SleepAvg').textContent=avg||'—'; const advice=[]; if(avg && avg<7) advice.push(['Sleep debt','Cíl na další 3 dny: +30–60 min spánku, ne další stimulanty.']); else advice.push(['Good base','Spánek vypadá použitelně, drž rutinu.']); advice.push(['Caffeine cutoff','Kofein ideálně 8–10 h před spaním, hlavně když máš večer tep nahoře.']); advice.push(['Wind-down','10 min: sprcha, mobilita, ztlumit světlo, žádné doomscroll PR.']); qs('#v9SleepAdvice').innerHTML=advice.map(a=>`<div class="coach-tip"><strong>${clean(a[0])}</strong><br>${clean(a[1])}</div>`).join(''); qs('#v9SleepCount').textContent=logs.length; qs('#v9SleepList').innerHTML=logs.slice(0,25).map(l=>`<div class="item"><div class="item-head"><div><strong>${clean(l.date)} · ${clean(l.hours)} h · ${clean(l.quality||'—')}/10</strong><small>caffeine ${clean(l.caffeine||'—')} · wake ${clean(l.wake||'—')}</small><p>${clean(l.notes||'')}</p></div><button class="btn tiny ghost danger" onclick="v9DeleteSleepLog('${l.id}')">×</button></div></div>`).join('')||'<div class="item muted">Žádné sleep logs.</div>'; }
  window.v9SaveSleepLog=()=>{ const hours=n(qs('#v9SleepHours').value); if(!hours) return toast('Zadej hodiny spánku.'); state.v9SleepLogs.unshift({id:uid9(),date:selectedDate,hours,quality:qs('#v9SleepQuality').value,caffeine:qs('#v9CaffeineTime').value,wake:qs('#v9WakeTime').value,notes:qs('#v9SleepNotes').value,createdAt:new Date().toISOString()}); const d=state.days[selectedDate]||(state.days[selectedDate]={}); d.sleep=hours; ['v9SleepHours','v9SleepQuality','v9SleepNotes'].forEach(id=>qs('#'+id).value=''); saveVault(); };
  window.v9DeleteSleepLog=id=>{ state.v9SleepLogs=state.v9SleepLogs.filter(x=>x.id!==id); saveVault(); };

  function renderPantry(){ if(!has('v9PantryList')) return; const p=state.v9Pantry||[]; qs('#v9PantryCount').textContent=p.length; qs('#v9PantryCountOrb').textContent=p.length; qs('#v9PantryList').innerHTML=p.map(i=>`<div class="item"><div class="item-head"><div><strong>${clean(i.category)} · ${clean(i.name)}</strong><small>${clean(i.qty||'')} · alert ${clean(i.alert||'—')}</small></div><button class="btn tiny ghost danger" onclick="v9DeletePantryItem('${i.id}')">×</button></div></div>`).join('')||'<div class="item muted">Pantry je prázdná.</div>'; const base=['skyr/tvaroh/whey','kuřecí/tuňák/vejce','rýže/brambory/vločky','banány/džem/gely na běh','mražená zelenina','elektrolyty/sůl']; const low=p.filter(x=>String(x.qty||'').match(/0|low|málo/i)).map(x=>x.name); qs('#v9GroceryDraft').innerHTML=[...new Set([...low,...base])].map(x=>`<div class="coach-tip">□ ${clean(x)}</div>`).join(''); }
  window.v9AddPantryItem=()=>{ const name=qs('#v9PantryName').value.trim(); if(!name) return toast('Název itemu.'); state.v9Pantry.unshift({id:uid9(),name,qty:qs('#v9PantryQty').value,category:qs('#v9PantryCat').value,alert:qs('#v9PantryAlert').value,createdAt:new Date().toISOString()}); ['v9PantryName','v9PantryQty','v9PantryAlert'].forEach(id=>qs('#'+id).value=''); saveVault(); };
  window.v9DeletePantryItem=id=>{ state.v9Pantry=state.v9Pantry.filter(x=>x.id!==id); saveVault(); };
  window.v9CopyGroceryDraft=async()=>{ const txt=qsa('#v9GroceryDraft .coach-tip').map(x=>x.textContent).join('\n'); await navigator.clipboard.writeText(txt); toast('Grocery list copied.'); };

  function renderOwnerLab(){ if(!has('v9OwnerChecklist')) return; const tiers={v9FreeTier:['Local-first secure vault','Core tracking for solo user','Manual export/import','No backend required'],v9ProTier:['Cloud sync convenience','Advanced analytics','Email reports / automations','More coach templates'],v9EliteTier:['Coach/team sharing later','Server notifications','AI endpoint','Stripe/Paddle verified plan']}; Object.entries(tiers).forEach(([id,arr])=>{ qs('#'+id).innerHTML=arr.map(x=>`<div class="coach-tip">${clean(x)}</div>`).join(''); }); const checklist=[['1','Host static app','Vercel/Netlify/GitHub Pages.'],['2','Supabase Auth','Email login + encrypted vault rows + RLS.'],['3','Serverless API','Email, Stripe checkout, webhooks, AI endpoint.'],['4','Legal/basic safety','Privacy policy, terms, export/delete data.'],['5','Launch beta','Free personal first, paid later.']]; qs('#v9OwnerChecklist').innerHTML=checklist.map(x=>`<div class="v9-card"><h4>${x[0]}. ${clean(x[1])}</h4><p>${clean(x[2])}</p></div>`).join(''); }

  function renderVersionsV9Patch(){
    if(!has('versionTimeline')) return;
    const cur=qsa('.release-card.current'); cur.forEach(c=>c.classList.remove('current'));
    if(typeof renderVersionsPage==='function'){
      // original renderVersionsPage is called by core only if Versions is visible; this nudge fixes current tag after v9 override.
      qsa('.release-card').forEach(card=>{ if(card.textContent.includes('v9 ·')) card.classList.add('current'); });
    }
  }

  function bindGlobalUi(){
    document.addEventListener('click',e=>{ if(e.target.closest('.nav-btn') && qs('#v9Backdrop')){ qs('.sidebar')?.classList.remove('show'); qs('#v9Backdrop').classList.remove('show'); }});
    document.addEventListener('keydown',e=>{ if(e.key==='/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){ e.preventDefault(); qs('#v9NavSearch')?.focus(); }});
  }
  function recentIso(days){ const out=[]; for(let i=days-1;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); out.push(d.toISOString().slice(0,10)); } return out; }

  initV9();
})();
