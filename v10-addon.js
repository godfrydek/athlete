/* Training Arc OS v11 Clean Deploy — retained milestone layer. */
(function(){
  const V10_VERSION='v11 Clean Deploy';
  const V10_VIEWS=[
    ['v10-launchpad','V11 Launchpad'],
    ['v10-ai','AI Coach Studio'],
    ['v10-roadmap','Season Roadmap'],
    ['v10-library','Exercise Library'],
    ['v10-share','Coach Share'],
    ['v10-data','Data Doctor'],
    ['v10-market','Template Market'],
    ['v10-launch','Launch HQ']
  ];
  const V10_TITLES=Object.fromEntries(V10_VIEWS);
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const has=id=>!!document.getElementById(id);
  const clean=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const uid10=()=> 'v10_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const num=(v,d=0)=>{const x=Number(v); return Number.isFinite(x)?x:d;};
  const today=()=>new Date().toISOString().slice(0,10);

  function initV10(){
    patchBranding();
    injectNav();
    injectViews();
    patchCore();
    bindUi();
  }

  function patchBranding(){
    document.title='Training Arc OS v11 Clean Deploy';
    const meta=qs('meta[name="description"]'); if(meta) meta.content='Training Arc OS v11 Clean Deploy — private encrypted athlete OS, nutrition, training, recovery, planning, AI coach studio, cloud sync and launch pack.';
    qsa('.sidebar-top span').forEach(x=>x.textContent='v11 Clean Deploy');
    qsa('.lock-card h1 span').forEach(x=>x.textContent='v11');
    const side=qs('.lock-side .eyebrow'); if(side) side.textContent='v11 clean deploy';
    const h2=qs('.lock-side h2'); if(h2) h2.textContent='Historic Private Athlete OS';
    const lead=qs('.lock-card .lead'); if(lead) lead.textContent='All-in-one training arc: výživa, gym, běh, recovery, life OS, AI coach studio, cloud sync, launch pack a secure vault.';
    const badge=qs('.version-badge strong'); if(badge) badge.textContent='v11';
  }

  function injectNav(){
    const nav=qs('#nav'); if(!nav || has('nav-v10-launchpad')) return;
    const label=document.createElement('div'); label.className='v10-section-chip'; label.textContent='v11 Clean Deploy'; nav.appendChild(label);
    V10_VIEWS.forEach(([view,label])=>{
      const b=document.createElement('button'); b.className='nav-btn'; b.dataset.view=view; b.id='nav-'+view; b.textContent=label; b.addEventListener('click',()=>switchView(view)); nav.appendChild(b);
    });
    if(typeof COMMANDS!=='undefined') V10_VIEWS.forEach(([view,label])=>{ if(!COMMANDS.some(c=>c[0]===label)) COMMANDS.push([label,view]); });
  }

  function injectViews(){
    const anchor=qs('#analytics') || qs('#connections') || qs('.content');
    if(!anchor || has('v10-launchpad')) return;
    anchor.insertAdjacentHTML('beforebegin', `
<section id="v10-launchpad" class="view">
  <article class="v10-hero glass"><div><p class="eyebrow">v11 clean deploy</p><h1>Ultimate Athlete OS <span>one private command center for training, nutrition, life and launch</span></h1><p class="lead">V11 je clean deploy/root-fix release: víc dat, víc plánů, AI prompts, launch systém, data doctor, share pack a production checklist. Offline funguje hned, cloud přes Supabase.</p><div class="button-row wrap"><button class="btn primary" onclick="v10GenerateDailyCommand()">Generate daily command</button><button class="btn ghost" onclick="v10QuickWin()">Quick win</button><button class="btn ghost" data-jump="v10-roadmap">Plan season</button><button class="btn ghost" data-jump="v10-launch">Launch HQ</button></div></div><div class="v10-crown"><span>historic</span><strong>v11</strong><small id="v10CrownLabel">clean deploy</small></div></article>
  <div class="grid cards-4"><article class="metric-card glass"><span>Food atlas</span><strong id="v10FoodCount">0</strong><small>presetů + custom</small></article><article class="metric-card glass"><span>Recipes</span><strong id="v10RecipeCount">0</strong><small>templates</small></article><article class="metric-card glass"><span>Modules</span><strong id="v10ModuleCount">0</strong><small>sekcí</small></article><article class="metric-card glass"><span>Vault score</span><strong id="v10VaultScore">0</strong><small>security/readiness</small></article></div>
  <div class="grid two"><section class="panel glass accent-panel"><div class="panel-head"><h3>Daily command</h3><span class="tag">auto coach</span></div><div id="v10DailyCommand" class="coach-list"></div></section><section class="panel glass"><div class="panel-head"><h3>V11 stack</h3><span class="tag">new modules</span></div><div id="v10Stack" class="v10-grid"></div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Historic release scorecard</h3><span class="tag">project health</span></div><div id="v10Scorecard" class="v10-grid"></div></section>
</section>

<section id="v10-ai" class="view">
  <article class="v10-hero glass"><div><p class="eyebrow">v10 ai coach studio</p><h1>Prompt Engine <span>use ChatGPT without leaking your whole vault</span></h1><p class="lead">Vygeneruje safe prompt ze souhrnu dat. Můžeš ho zkopírovat sem do Chatu a nechat si navrhnout den/týden/plán.</p><div class="button-row wrap"><button class="btn primary" onclick="v10BuildPrompt()">Build prompt</button><button class="btn ghost" onclick="v10CopyPrompt()">Copy prompt</button><button class="btn ghost" onclick="v10SavePromptTemplate()">Save template</button></div></div><div class="v10-crown"><span>coach</span><strong>AI</strong><small>safe summary</small></div></article>
  <div class="grid two"><section class="panel glass"><div class="panel-head"><h3>Prompt builder</h3><span class="tag">privacy first</span></div><div class="form-grid compact"><label>Coach mode<select id="v10PromptMode"><option>Daily hybrid coach</option><option>Race week coach</option><option>Gym progression coach</option><option>Nutrition cut/bulk coach</option><option>Recovery/injury-risk coach</option><option>Business/product launch coach</option></select></label><label>Detail level<select id="v10PromptDetail"><option>brief</option><option>normal</option><option>detailed</option></select></label><label>Include last days<input id="v10PromptDays" type="number" value="7" min="1" max="30"></label><label>Privacy<select id="v10PromptPrivacy"><option>summary only</option><option>include recent logs</option><option>ultra private</option></select></label></div><textarea id="v10PromptNotes" placeholder="Extra context: závod, nemoc, škola, směny, soreness…"></textarea></section><section class="panel glass"><div class="panel-head"><h3>Generated prompt</h3><span class="tag">copy to ChatGPT</span></div><div id="v10PromptOutput" class="v10-terminal">Klikni Build prompt.</div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Saved prompt templates</h3><span class="tag" id="v10PromptTemplateCount">0</span></div><div id="v10PromptTemplates" class="list"></div></section>
</section>

<section id="v10-roadmap" class="view">
  <article class="v10-hero glass"><div><p class="eyebrow">v10 season planning</p><h1>Season Roadmap <span>12-week blocks, goals, milestones and deloads</span></h1><p class="lead">Naplánuj tréninkový arc po blocích: base/build/peak/deload, závody, testy, školu, směny a recovery.</p><div class="button-row wrap"><button class="btn primary" onclick="v10GenerateSeason()">Generate season</button><button class="btn ghost" onclick="v10SaveSeason()">Save season</button><button class="btn ghost" onclick="v10ExportSeasonICS()">Export .ics</button></div></div><div class="v10-crown"><span>roadmap</span><strong>12W</strong><small>arc</small></div></article>
  <div class="grid two"><section class="panel glass"><div class="panel-head"><h3>Season generator</h3><span class="tag">draft</span></div><div class="form-grid compact"><label>Main goal<select id="v10SeasonGoal"><option>Hybrid athlete</option><option>10 km faster</option><option>1 km sub 3:30</option><option>Muscle-up technique</option><option>Lean bulk performance</option><option>Cut without dying</option><option>Police/school test prep</option></select></label><label>Weeks<input id="v10SeasonWeeks" type="number" value="12" min="2" max="24"></label><label>Gym days<input id="v10SeasonGym" type="number" value="5" min="0" max="7"></label><label>Run days<input id="v10SeasonRun" type="number" value="4" min="0" max="7"></label></div><textarea id="v10SeasonNotes" placeholder="Závody, dovolená, práce, škola, zdravotní limit…"></textarea></section><section class="panel glass"><div class="panel-head"><h3>Season output</h3><span class="tag">editable</span></div><div id="v10SeasonOutput" class="v10-flow"></div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Saved seasons</h3><span class="tag" id="v10SeasonCount">0</span></div><div id="v10SeasonList" class="list"></div></section>
</section>

<section id="v10-library" class="view">
  <article class="v10-hero glass"><div><p class="eyebrow">v10 exercise encyclopedia</p><h1>Exercise Library <span>presets, cues, muscles and progression map</span></h1><p class="lead">Rychle hledej cviky, ukládej vlastní cues a generuj progresi podle cíle.</p><div class="button-row wrap"><button class="btn primary" onclick="v10AddCustomExercise()">Add exercise</button><button class="btn ghost" onclick="v10GenerateProgression()">Generate progression</button></div></div><div class="v10-crown"><span>library</span><strong id="v10ExerciseCountOrb">0</strong><small>presets</small></div></article>
  <div class="grid two"><section class="panel glass"><div class="panel-head"><h3>Search / add exercise</h3><span class="tag">library</span></div><div class="form-grid compact"><label>Search<input id="v10ExerciseSearch" placeholder="push-up, dip, row…"></label><label>Muscle group<select id="v10ExerciseGroup"><option>upper push</option><option>upper pull</option><option>legs</option><option>core</option><option>calisthenics</option><option>running prep</option><option>mobility</option></select></label><label>Name<input id="v10ExerciseName" placeholder="custom exercise"></label><label>Cue<input id="v10ExerciseCue" placeholder="hlavní cue"></label></div><textarea id="v10ExerciseNotes" placeholder="Technika, RIR, progres, kdy zařadit…"></textarea></section><section class="panel glass"><div class="panel-head"><h3>Progression generator</h3><span class="tag">goal based</span></div><div class="form-grid compact"><label>Goal<select id="v10ProgressionGoal"><option>50+ push-ups</option><option>Clean muscle-up</option><option>1 km sub 3:30</option><option>10 km sub 60</option><option>Stronger dips</option><option>Bigger lats</option><option>Safe legs rebuild</option></select></label><label>Level<select id="v10ProgressionLevel"><option>current</option><option>easy week</option><option>build week</option><option>deload</option></select></label></div><div id="v10ProgressionOutput" class="coach-list"></div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Exercise cards</h3><span class="tag" id="v10LibraryCount">0</span></div><div id="v10ExerciseLibrary" class="v10-grid"></div></section>
</section>

<section id="v10-share" class="view">
  <article class="v10-hero glass"><div><p class="eyebrow">v10 coach share</p><h1>Share Pack <span>export safe summaries without exposing raw vault</span></h1><p class="lead">Vygeneruj trenérovi/kámošovi přehled: týden, PR, cíle, readiness, bez citlivých detailů. Encrypted vault je pořád private.</p><div class="button-row wrap"><button class="btn primary" onclick="v10GenerateSharePack()">Generate share pack</button><button class="btn ghost" onclick="v10CopySharePack()">Copy</button><button class="btn ghost" onclick="v10DownloadSharePack()">Download .txt</button></div></div><div class="v10-crown"><span>share</span><strong>SAFE</strong><small>summary</small></div></article>
  <div class="grid two"><section class="panel glass"><div class="panel-head"><h3>Share settings</h3><span class="tag">privacy</span></div><div class="v10-matrix"><label><input id="v10ShareNutrition" type="checkbox" checked> Nutrition summary</label><label><input id="v10ShareTraining" type="checkbox" checked> Training summary</label><label><input id="v10ShareRecovery" type="checkbox" checked> Recovery summary</label><label><input id="v10ShareGoals" type="checkbox" checked> Goals</label><label><input id="v10SharePrivate" type="checkbox"> Include private notes</label></div><textarea id="v10ShareContext" placeholder="Komu to posíláš a co má řešit?"></textarea></section><section class="panel glass"><div class="panel-head"><h3>Share pack output</h3><span class="tag">safe summary</span></div><div id="v10ShareOutput" class="v10-terminal">Klikni Generate share pack.</div></section></div>
</section>

<section id="v10-data" class="view">
  <article class="v10-hero glass"><div><p class="eyebrow">v10 data doctor</p><h1>Data Doctor <span>backup, diagnostics, migrations, cleanup</span></h1><p class="lead">Zkontroluj vault, najdi rizika, exportni health report a připrav se na hosting/sync.</p><div class="button-row wrap"><button class="btn primary" onclick="v10RunDataDoctor()">Run diagnostics</button><button class="btn ghost" onclick="v10CopyDataReport()">Copy report</button><button class="btn ghost" onclick="v10DownloadDataReport()">Download report</button></div></div><div class="v10-crown"><span>data</span><strong id="v10DataScore">0</strong><small>/100</small></div></article>
  <div class="grid two"><section class="panel glass"><div class="panel-head"><h3>Diagnostics</h3><span class="tag">vault</span></div><div id="v10DataDiagnostics" class="v10-grid"></div></section><section class="panel glass"><div class="panel-head"><h3>Data report</h3><span class="tag">copy/export</span></div><div id="v10DataReport" class="v10-terminal">Spusť diagnostics.</div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Backup strategy</h3><span class="tag">3-2-1 lite</span></div><div id="v10BackupStrategy" class="v10-flow"></div></section>
</section>

<section id="v10-market" class="view">
  <article class="v10-hero glass"><div><p class="eyebrow">v10 template market</p><h1>Template Market <span>programs, protocols, recipes and premium packs</span></h1><p class="lead">Zatím lokální marketplace pro tebe. Později z toho může být free/pro/elite obsah.</p><div class="button-row wrap"><button class="btn primary" onclick="v10InstallTemplatePack('hybrid')">Install Hybrid Pack</button><button class="btn ghost" onclick="v10InstallTemplatePack('cut')">Install Cut Pack</button><button class="btn ghost" onclick="v10InstallTemplatePack('race')">Install Race Pack</button></div></div><div class="v10-crown"><span>market</span><strong id="v10TemplateCountOrb">0</strong><small>packs</small></div></article>
  <div id="v10TemplateMarket" class="v10-grid"></div>
  <section class="panel glass"><div class="panel-head"><h3>Installed templates</h3><span class="tag" id="v10InstalledTemplateCount">0</span></div><div id="v10InstalledTemplates" class="list"></div></section>
</section>

<section id="v10-launch" class="view">
  <article class="v10-hero glass"><div><p class="eyebrow">v10 production / launch hq</p><h1>Launch HQ <span>hosting, cloud, email, payments, safety, beta</span></h1><p class="lead">Checklist před tím, než to nahraješ na web a později uděláš free/pro/elite verze.</p><div class="button-row wrap"><button class="btn primary" onclick="v10CopyLaunchPlan()">Copy launch plan</button><button class="btn ghost" onclick="v10ToggleAllLaunch(false)">Reset checklist</button><button class="btn ghost" onclick="v10ToggleAllLaunch(true)">Mark all done</button></div></div><div class="v10-crown"><span>launch</span><strong id="v10LaunchPercent">0%</strong><small>ready</small></div></article>
  <div class="grid two"><section class="panel glass accent-panel"><div class="panel-head"><h3>Launch checklist</h3><span class="tag">hosting next</span></div><div id="v10LaunchChecklist" class="list"></div></section><section class="panel glass"><div class="panel-head"><h3>Architecture map</h3><span class="tag">safe stack</span></div><div id="v10ArchitectureMap" class="v10-flow"></div></section></div>
  <section class="panel glass"><div class="panel-head"><h3>Paid versions blueprint</h3><span class="tag">future</span></div><div id="v10PaidBlueprint" class="v10-grid"></div></section>
</section>`);
  }

  function patchCore(){
    if(typeof migrate==='function' && !migrate.__v10){
      const oldMigrate=migrate;
      migrate=function(){ oldMigrate(); migrateV10(); };
      migrate.__v10=true;
    }
    if(typeof renderAll==='function' && !renderAll.__v10){
      const oldRender=renderAll;
      renderAll=function(){ oldRender(); renderV10All(); };
      renderAll.__v10=true;
    }
    if(typeof switchView==='function' && !switchView.__v10){
      const oldSwitch=switchView;
      switchView=function(view){ oldSwitch(view); if(V10_TITLES[view] && has('viewTitle')) qs('#viewTitle').textContent=V10_TITLES[view]; };
      switchView.__v10=true;
    }
    patchVersions();
  }

  function migrateV10(){
    if(!state) return;
    state.meta=state.meta||{}; state.meta.version=10; state.meta.label='v11 Clean Deploy';
    state.v10={...(state.v10||{})};
    state.v10.promptTemplates=state.v10.promptTemplates||[];
    state.v10.seasons=state.v10.seasons||[];
    state.v10.customExercises=state.v10.customExercises||[];
    state.v10.sharePacks=state.v10.sharePacks||[];
    state.v10.installedTemplates=state.v10.installedTemplates||[];
    state.v10.launchChecklist=state.v10.launchChecklist||defaultLaunchChecklist().map(x=>({...x,done:false}));
    state.v10.flags=state.v10.flags||{firstOpenedAt:new Date().toISOString(),historic:true};
    if(!state.v10.flags.megaDataMerged){
      mergeV10Foods(); mergeV10Recipes(); mergeV10Exercises(); mergeV10Quotes();
      state.v10.flags.megaDataMerged=true;
    }
  }
  function mergeV10Foods(){
    if(typeof window.V10_FOOD_PACK!=='function') return;
    const existing=new Set((state.foods||[]).map(f=>String(f.name||'').toLowerCase()));
    const extra=window.V10_FOOD_PACK().filter(f=>!existing.has(String(f.name||'').toLowerCase()));
    if(extra.length) state.foods=[...(state.foods||[]),...extra];
  }
  function mergeV10Recipes(){
    if(typeof window.V10_RECIPE_PACK!=='function') return;
    const existing=new Set([...(state.recipes||[]),...(state.customRecipes||[])].map(r=>String(r.title||r.name||'').toLowerCase()));
    const extra=window.V10_RECIPE_PACK().filter(r=>!existing.has(String(r.title||r.name||'').toLowerCase()));
    if(extra.length) state.recipes=[...(state.recipes||[]),...extra];
  }
  function mergeV10Exercises(){
    if(typeof window.V10_EXERCISE_PACK==='function') state.exercisePresets=[...new Set([...(state.exercisePresets||[]),...window.V10_EXERCISE_PACK()])];
    if(typeof RUN_TYPES!=='undefined'){
      const names=new Set(RUN_TYPES.map(r=>r.name));
      [['VO2max 5×3 min','high aerobic power','Z5'],['Threshold cruise 3×8 min','race support','Z4'],['Long run progression','finish controlled faster','Z2-Z3'],['Recovery nasal jog','minimum fatigue','Z1-Z2'],['Police 1 km sharpening','pace control','Z5'],['Stride economy day','technique/speed','Z2 + strides']].forEach(r=>{ if(!names.has(r[0])) RUN_TYPES.push({name:r[0],goal:r[1],intensity:r[2]}); });
    }
    if(typeof COMMANDS!=='undefined') V10_VIEWS.forEach(([view,title])=>{ if(!COMMANDS.some(c=>c[0]===title)) COMMANDS.push([title,view]); });
  }
  function mergeV10Quotes(){
    if(typeof window.V10_QUOTE_PACK==='function'){
      state.motivationQuotes=[...new Set([...(state.motivationQuotes||[]),...window.V10_QUOTE_PACK()])];
    }
  }

  function renderV10All(){
    if(!state) return;
    migrateV10();
    renderLaunchpad(); renderAIStudio(); renderRoadmap(); renderLibrary(); renderShare(); renderDataDoctor(false); renderMarket(); renderLaunchHQ();
    updateVersionsV10Patch();
  }

  function renderLaunchpad(){
    if(!has('v10FoodCount')) return;
    const foods=(state.foods||[]).length+(state.customFoods||[]).length;
    const recipes=(state.recipes||[]).length+(state.customRecipes||[]).length;
    qs('#v10FoodCount').textContent=foods.toLocaleString('cs-CZ');
    qs('#v10RecipeCount').textContent=recipes.toLocaleString('cs-CZ');
    qs('#v10ModuleCount').textContent=qsa('.view').length.toLocaleString('cs-CZ');
    qs('#v10VaultScore').textContent=vaultScore();
    qs('#v10Stack').innerHTML=[
      ['AI Coach Studio','safe prompts, templates, privacy controls'],['Season Roadmap','12-week planning, deloads, event prep'],['Exercise Library','cues, progressions, search, personal presets'],['Coach Share','safe summaries for coach/friend'],['Data Doctor','diagnostics, backups, migration checks'],['Template Market','free/pro/elite content packs'],['Launch HQ','hosting, Supabase, payments, legal basics'],['Mega Data Packs','food, recipes, quotes, protocols']
    ].map(x=>`<div class="v10-card"><h3>${clean(x[0])}</h3><p>${clean(x[1])}</p></div>`).join('');
    qs('#v10Scorecard').innerHTML=scorecard().map(x=>`<div class="v10-card ${x.ok?'v10-ok':'v10-callout'}"><h4>${clean(x.title)}</h4><div class="v10-progress"><i style="width:${x.score}%"></i></div><p>${clean(x.text)}</p></div>`).join('');
    if(!qs('#v10DailyCommand').dataset.loaded){ v10GenerateDailyCommand(false); qs('#v10DailyCommand').dataset.loaded='1'; }
  }
  function scorecard(){
    const cloud=!!state.settings?.cloud?.url;
    return [
      {title:'Local-first core',score:100,ok:true,text:'Appka běží offline a ukládá vault lokálně.'},
      {title:'Secure vault',score:vaultScore(),ok:vaultScore()>70,text:'Šifrovaný vault + backup/export flow.'},
      {title:'Cloud readiness',score:cloud?90:55,ok:cloud,text:cloud?'Supabase config je uložený.':'Cloud config doplníš po hostingu.'},
      {title:'Production structure',score:88,ok:true,text:'V10 má docs, api examples, data packs a PWA cache.'}
    ];
  }
  function vaultScore(){
    let s=45; if(state.meta?.version>=10)s+=15; if(state.settings?.cloud?.url)s+=15; if((state.days&&Object.keys(state.days).length)>0)s+=10; if((state.foods||[]).length>1000)s+=10; if((state.v10?.launchChecklist||[]).some(x=>x.done))s+=5; return Math.min(100,s);
  }
  window.v10GenerateDailyCommand=function(show=true){
    const d=state.days?.[selectedDate]||{}; const tips=[]; const kcal=num(d.kcal), protein=num(d.protein), sleep=num(d.sleep), sore=num(d.soreness), mood=num(d.mood), energy=num(d.energy);
    const targetP=num(state.targets?.protein,175), targetK=num(state.targets?.kcal,2900);
    tips.push(['Priority','Vyber 1 hlavní win dne: training / nutrition / recovery. Ne všechno najednou.']);
    if(protein && protein<targetP*.75) tips.push(['Protein gap',`Doplň cca ${Math.max(0,Math.round(targetP-protein))} g proteinu. Nejrychleji skyr/tvaroh/whey/maso.`]);
    if(kcal && kcal<targetK*.75) tips.push(['Fuel warning','Jsi nízko na kcal. Pokud máš běh/gym, dej sachry kolem tréninku.']);
    if(sleep && sleep<6.5) tips.push(['Low sleep','Dnes žádné ego PR. RPE dolů, zkrať objem a vyhraj večer.`']);
    if(sore>=7) tips.push(['Soreness high','Žádné sprinty/plyo. Mobilita, easy nebo upper pump.']);
    if(mood>=8 && energy>=8 && sore<=4) tips.push(['Green light','Vypadá to na solidní den. Dej kvalitní session, ale nech 1–2 RIR.']);
    if(!tips.length) tips.push(['Start','Zapiš rychlý denní log a V10 ti dá přesnější command.']);
    const html=tips.map(t=>`<div class="coach-tip"><strong>${clean(t[0])}</strong><br>${clean(t[1])}</div>`).join('');
    if(has('v10DailyCommand')) qs('#v10DailyCommand').innerHTML=html;
    if(show) toast('V10 daily command generated.');
  };
  window.v10QuickWin=function(){
    const wins=['Zapiš dnešní váhu + spánek.','Dej 10 min mobilitu lýtka/kyčle/ramena.','Naplánuj protein do večera.','Vyber zítra jeden hlavní tréninkový cíl.','Exportni encrypted backup.'];
    toast(wins[Math.floor(Math.random()*wins.length)]);
  };

  function renderAIStudio(){
    if(!has('v10PromptTemplates')) return;
    qs('#v10PromptTemplateCount').textContent=(state.v10.promptTemplates||[]).length;
    qs('#v10PromptTemplates').innerHTML=(state.v10.promptTemplates||[]).map(t=>`<div class="item"><div class="item-head"><div><strong>${clean(t.mode)}</strong><small>${clean(t.createdAt?.slice(0,10)||'')}</small><p>${clean((t.notes||'').slice(0,160))}</p></div><div class="item-actions"><button class="btn tiny ghost" onclick="v10LoadPromptTemplate('${t.id}')">Load</button><button class="btn tiny ghost danger" onclick="v10DeletePromptTemplate('${t.id}')">×</button></div></div></div>`).join('')||'<div class="item muted">Žádné prompt templates.</div>';
  }
  window.v10BuildPrompt=function(){
    const days=Math.max(1,Math.min(30,num(qs('#v10PromptDays')?.value,7))); const mode=qs('#v10PromptMode')?.value||'Daily hybrid coach'; const detail=qs('#v10PromptDetail')?.value||'normal'; const privacy=qs('#v10PromptPrivacy')?.value||'summary only'; const notes=qs('#v10PromptNotes')?.value||'';
    const recentDays=Object.entries(state.days||{}).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,days).map(([date,d])=>({date,weight:d.weight,kcal:d.kcal,protein:d.protein,steps:d.steps,sleep:d.sleep,mood:d.mood,energy:d.energy,soreness:d.soreness}));
    const recentRuns=(state.runs||[]).slice(0,Math.min(8,days)); const recentGym=(state.workouts||[]).slice(0,Math.min(5,days));
    const body={mode,detail,privacy,date:selectedDate,targets:state.targets||{},recentDays, recentRuns: privacy==='ultra private'?[]:recentRuns, recentGym: privacy==='summary only'?recentGym.map(w=>({date:w.date,type:w.type,totalVolume:w.totalVolume||w.volume||0})):recentGym, notes};
    const prompt=`Jsi můj hybrid athlete coach. Chci stručnou, praktickou odpověď v češtině.\n\nMODE: ${mode}\nDETAIL: ${detail}\nPRIVACY: ${privacy}\n\nDATA SUMMARY:\n${JSON.stringify(body,null,2)}\n\nVýstup: 1) dnešní rozhodnutí, 2) training plán, 3) nutrition/recovery priorita, 4) red flags, 5) jedna věta future-self motivace.`;
    qs('#v10PromptOutput').textContent=prompt;
    return prompt;
  };
  window.v10CopyPrompt=async function(){ const p=qs('#v10PromptOutput')?.textContent||v10BuildPrompt(); await navigator.clipboard.writeText(p); toast('V10 prompt copied.'); };
  window.v10SavePromptTemplate=function(){ const mode=qs('#v10PromptMode')?.value||'Prompt'; state.v10.promptTemplates.unshift({id:uid10(),mode,notes:qs('#v10PromptNotes')?.value||'',createdAt:new Date().toISOString(),prompt:qs('#v10PromptOutput')?.textContent||''}); saveVault(); };
  window.v10LoadPromptTemplate=function(id){ const t=state.v10.promptTemplates.find(x=>x.id===id); if(!t)return; if(qs('#v10PromptMode')) qs('#v10PromptMode').value=t.mode; if(qs('#v10PromptNotes')) qs('#v10PromptNotes').value=t.notes||''; if(qs('#v10PromptOutput')) qs('#v10PromptOutput').textContent=t.prompt||''; };
  window.v10DeletePromptTemplate=function(id){ state.v10.promptTemplates=state.v10.promptTemplates.filter(x=>x.id!==id); saveVault(); };

  function renderRoadmap(){ if(!has('v10SeasonList')) return; qs('#v10SeasonCount').textContent=(state.v10.seasons||[]).length; qs('#v10SeasonList').innerHTML=(state.v10.seasons||[]).map(s=>`<div class="item"><div class="item-head"><div><strong>${clean(s.goal)} · ${s.weeks} weeks</strong><small>${clean(s.createdAt?.slice(0,10)||'')}</small><p>${clean((s.notes||'').slice(0,200))}</p></div><button class="btn tiny ghost danger" onclick="v10DeleteSeason('${s.id}')">×</button></div></div>`).join('')||'<div class="item muted">Žádné uložené sezóny.</div>'; }
  window.v10GenerateSeason=function(){
    const goal=qs('#v10SeasonGoal')?.value||'Hybrid athlete'; const weeks=Math.max(2,Math.min(24,num(qs('#v10SeasonWeeks')?.value,12))); const gym=num(qs('#v10SeasonGym')?.value,5); const run=num(qs('#v10SeasonRun')?.value,4); const notes=qs('#v10SeasonNotes')?.value||'';
    const blocks=[]; for(let w=1; w<=weeks; w++){ const phase=w%4===0?'deload':w<=Math.ceil(weeks*.35)?'base':w<=Math.ceil(weeks*.75)?'build':'peak'; const intensity=phase==='deload'?'60–70 % objem':phase==='base'?'easy volume + technique':phase==='build'?'1–2 hard sessions':'specific race/PR work'; blocks.push({w,phase,intensity,focus:phase==='base'?`${gym} gym + ${run} runs, skills easy`:phase==='build'?`${gym} gym, ${run} runs, 1 quality run`:phase==='peak'?'specificity, taper before test':'mobility, sleep, reset'}); }
    qs('#v10SeasonOutput').innerHTML=blocks.map(b=>`<div class="v10-step"><strong>${b.w}</strong><div><h4>${clean(b.phase)} · ${clean(b.intensity)}</h4><p>${clean(b.focus)}</p></div></div>`).join('')+`<div class="v10-callout"><strong>Notes</strong><p>${clean(notes||'Přidej závody, směny, školu a recovery limity.')}</p></div>`;
    qs('#v10SeasonOutput').dataset.payload=JSON.stringify({goal,weeks,gym,run,notes,blocks});
    toast('Season generated.');
  };
  window.v10SaveSeason=function(){ const payload=qs('#v10SeasonOutput')?.dataset.payload; if(!payload) return toast('Nejdřív Generate season.'); const obj=JSON.parse(payload); state.v10.seasons.unshift({id:uid10(),createdAt:new Date().toISOString(),...obj}); saveVault(); };
  window.v10DeleteSeason=function(id){ state.v10.seasons=state.v10.seasons.filter(x=>x.id!==id); saveVault(); };
  window.v10ExportSeasonICS=function(){
    const payload=qs('#v10SeasonOutput')?.dataset.payload; if(!payload)return toast('Nejdřív Generate season.');
    const obj=JSON.parse(payload); const now=new Date(); let lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Training Arc OS v10//Season//CS'];
    obj.blocks.forEach((b,i)=>{ const d=new Date(now); d.setDate(d.getDate()+i*7); const ds=d.toISOString().slice(0,10).replace(/-/g,''); lines.push('BEGIN:VEVENT',`DTSTART;VALUE=DATE:${ds}`,`SUMMARY:V10 Week ${b.w} - ${b.phase}`,`DESCRIPTION:${b.intensity} - ${b.focus}`,'END:VEVENT'); });
    lines.push('END:VCALENDAR'); download('training_arc_os_v10_season.ics',lines.join('\n'),'text/calendar');
  };

  function renderLibrary(){
    if(!has('v10ExerciseLibrary')) return;
    const search=(qs('#v10ExerciseSearch')?.value||'').toLowerCase();
    const base=[...(state.exercisePresets||[]),...(state.v10.customExercises||[]).map(x=>x.name)];
    const list=[...new Set(base)].filter(x=>!search || String(x).toLowerCase().includes(search)).slice(0,80);
    qs('#v10ExerciseCountOrb').textContent=(base.length||0).toLocaleString('cs-CZ'); qs('#v10LibraryCount').textContent=list.length.toLocaleString('cs-CZ');
    qs('#v10ExerciseLibrary').innerHTML=list.map(x=>`<div class="v10-card"><h4>${clean(x)}</h4><p>${clean(exerciseCue(x))}</p><div class="v10-badge-row"><span class="v10-badge">preset</span><button class="btn tiny ghost" onclick="v10CopyExerciseCue('${cleanAttr(x)}')">Copy cue</button></div></div>`).join('')||'<div class="item muted">Nic nenalezeno.</div>';
  }
  function exerciseCue(name){ const n=String(name).toLowerCase(); if(n.includes('push'))return 'Brace core, controlled depth, leave 1–2 RIR unless testing.'; if(n.includes('pull'))return 'Dead hang, scap set, pull high, no half reps.'; if(n.includes('dip'))return 'Shoulders packed, depth controlled, no ego bounce.'; if(n.includes('run')||n.includes('sprint'))return 'Effort over pace, warm up, stop if sharp pain.'; if(n.includes('rdl'))return 'Hinge, lats tight, hamstrings loaded, neutral spine.'; return 'Quality reps first. Log load/reps/RIR and progress slowly.'; }
  function cleanAttr(v){ return String(v??'').replace(/'/g,'&#39;').replace(/"/g,'&quot;'); }
  window.v10AddCustomExercise=function(){ const name=qs('#v10ExerciseName')?.value.trim(); if(!name)return toast('Zadej název cviku.'); state.v10.customExercises.unshift({id:uid10(),name,group:qs('#v10ExerciseGroup')?.value||'',cue:qs('#v10ExerciseCue')?.value||'',notes:qs('#v10ExerciseNotes')?.value||'',createdAt:new Date().toISOString()}); state.exercisePresets=[...new Set([...(state.exercisePresets||[]),name])]; ['v10ExerciseName','v10ExerciseCue','v10ExerciseNotes'].forEach(id=>{ if(has(id)) qs('#'+id).value=''; }); saveVault(); };
  window.v10GenerateProgression=function(){ const goal=qs('#v10ProgressionGoal')?.value||'50+ push-ups'; const level=qs('#v10ProgressionLevel')?.value||'current'; const map={
    '50+ push-ups':['Strict submax sets 4×15–25','Weighted push-ups 3×6–10','Density block 8 min easy reps','AMRAP test every 2–3 weeks'],
    'Clean muscle-up':['Explosive pull-ups high chest','Straight bar dips','Low bar transition drill','False grip/scap prep','Fresh attempts only'],
    '1 km sub 3:30':['200–400m repeats','Threshold support run','Strides 4–6×','Pacing practice first 400 controlled'],
    '10 km sub 60':['3 easy runs','1 tempo/cruise interval','1 long run','Strides after easy'],
    'Stronger dips':['Weighted dips low reps','Deep bodyweight dips','Lockout triceps','Shoulder prehab'],
    'Bigger lats':['MAG pulldown','Chest-supported row','Straight-arm pulldown','Pull-up power'],
    'Safe legs rebuild':['Leg press controlled','RDL light/moderate','Leg curl/extension','Calf/tib work','No sudden volume jumps']
  }; const arr=map[goal]||map['50+ push-ups']; qs('#v10ProgressionOutput').innerHTML=arr.map((x,i)=>`<div class="coach-tip"><strong>${i+1}.</strong> ${clean(x)} <small>${clean(level)}</small></div>`).join(''); };
  window.v10CopyExerciseCue=async function(name){ await navigator.clipboard.writeText(`${name}: ${exerciseCue(name)}`); toast('Exercise cue copied.'); };

  function renderShare(){ if(!has('v10ShareOutput')) return; }
  function shareText(){
    const d=state.days?.[selectedDate]||{}; const parts=['Training Arc OS v10 — safe share pack',`Date: ${selectedDate}`,`Context: ${qs('#v10ShareContext')?.value||'—'}`];
    if(qs('#v10ShareNutrition')?.checked) parts.push(`Nutrition: kcal ${d.kcal||'—'}, protein ${d.protein||'—'}g, weight ${d.weight||'—'}kg.`);
    if(qs('#v10ShareTraining')?.checked) parts.push(`Training: recent runs ${(state.runs||[]).slice(0,3).map(r=>`${r.distance||r.km||'?'}km ${r.type||''}`).join('; ')||'—'}; recent workouts ${(state.workouts||[]).slice(0,2).map(w=>w.type||'workout').join('; ')||'—'}.`);
    if(qs('#v10ShareRecovery')?.checked) parts.push(`Recovery: sleep ${d.sleep||'—'}h, mood ${d.mood||'—'}/10, energy ${d.energy||'—'}/10, soreness ${d.soreness||'—'}/10.`);
    if(qs('#v10ShareGoals')?.checked) parts.push(`Goals/targets: kcal ${state.targets?.kcal||'—'}, protein ${state.targets?.protein||'—'}g, weekly run ${state.targets?.runKm||'—'}km.`);
    if(qs('#v10SharePrivate')?.checked) parts.push(`Private note: ${d.note||'—'}`);
    parts.push('Ask: give practical coaching, red flags and next-step priority.'); return parts.join('\n');
  }
  window.v10GenerateSharePack=function(){ const txt=shareText(); qs('#v10ShareOutput').textContent=txt; state.v10.sharePacks.unshift({id:uid10(),date:selectedDate,text:txt,createdAt:new Date().toISOString()}); saveVault(false); toast('Share pack generated.'); };
  window.v10CopySharePack=async function(){ await navigator.clipboard.writeText(qs('#v10ShareOutput')?.textContent||shareText()); toast('Share pack copied.'); };
  window.v10DownloadSharePack=function(){ download('training_arc_os_v10_share_pack.txt',qs('#v10ShareOutput')?.textContent||shareText(),'text/plain'); };

  function renderDataDoctor(auto=false){ if(!has('v10DataDiagnostics')) return; if(!auto && !qs('#v10DataDiagnostics').dataset.ran){ renderBackupStrategy(); return; } const report=dataDoctorReport(); qs('#v10DataScore').textContent=report.score; qs('#v10DataDiagnostics').innerHTML=report.cards.map(c=>`<div class="v10-card ${c.ok?'v10-ok':'v10-danger'}"><h4>${clean(c.title)}</h4><p>${clean(c.text)}</p></div>`).join(''); qs('#v10DataReport').textContent=report.text; renderBackupStrategy(); }
  function dataDoctorReport(){
    const days=Object.keys(state.days||{}).length, foods=(state.foods||[]).length, customFoods=(state.customFoods||[]).length, workouts=(state.workouts||[]).length, runs=(state.runs||[]).length, cloud=!!state.settings?.cloud?.url, launchDone=(state.v10?.launchChecklist||[]).filter(x=>x.done).length;
    const cards=[{title:'Days logged',ok:days>0,text:`${days} denních záznamů.`},{title:'Training logs',ok:workouts+runs>0,text:`${workouts} workouts + ${runs} runs.`},{title:'Food database',ok:foods>1000,text:`${foods.toLocaleString('cs-CZ')} presets + ${customFoods} custom.`},{title:'Cloud config',ok:cloud,text:cloud?'Supabase config exists.':'Cloud nastavíš při hostingu.'},{title:'Launch checklist',ok:launchDone>0,text:`${launchDone}/${defaultLaunchChecklist().length} hotovo.`}];
    const score=Math.round(cards.reduce((a,c)=>a+(c.ok?20:8),0));
    const text=`Training Arc OS v10 Data Doctor\nDate: ${new Date().toLocaleString('cs-CZ')}\nScore: ${score}/100\nDays: ${days}\nFoods: ${foods}+${customFoods}\nWorkouts: ${workouts}\nRuns: ${runs}\nCloud configured: ${cloud}\nLaunch checklist done: ${launchDone}/${defaultLaunchChecklist().length}\nRecommendation: encrypted export before hosting, then Supabase push/pull test on PC + mobile.`;
    return {score,cards,text};
  }
  window.v10RunDataDoctor=function(){ if(has('v10DataDiagnostics')) qs('#v10DataDiagnostics').dataset.ran='1'; renderDataDoctor(true); toast('Diagnostics complete.'); };
  window.v10CopyDataReport=async function(){ const r=qs('#v10DataReport')?.textContent||dataDoctorReport().text; await navigator.clipboard.writeText(r); toast('Data report copied.'); };
  window.v10DownloadDataReport=function(){ download('training_arc_os_v10_data_doctor.txt',qs('#v10DataReport')?.textContent||dataDoctorReport().text,'text/plain'); };
  function renderBackupStrategy(){ if(!has('v10BackupStrategy')) return; const steps=[['1','Encrypted vault export','Stáhni encrypted backup po větších změnách.'],['2','Cloud push','Po Supabase loginu pushni vault na cloud.'],['3','Second device pull','Otevři mobil/tablet, login, pull, ověř data.'],['4','Plain JSON only debug','Decrypted export nepoužívej pro běžné sdílení.']]; qs('#v10BackupStrategy').innerHTML=steps.map(s=>`<div class="v10-step"><strong>${s[0]}</strong><div><h4>${clean(s[1])}</h4><p>${clean(s[2])}</p></div></div>`).join(''); }

  function renderMarket(){ if(!has('v10TemplateMarket')) return; const packs=templatePacks(); qs('#v10TemplateCountOrb').textContent=packs.length; qs('#v10TemplateMarket').innerHTML=packs.map(p=>`<div class="v10-card"><span class="v10-badge ${p.tier==='Pro'?'hot':''}">${clean(p.tier)}</span><h3>${clean(p.name)}</h3><p>${clean(p.desc)}</p><button class="btn tiny primary" onclick="v10InstallTemplatePack('${p.id}')">Install</button></div>`).join(''); qs('#v10InstalledTemplateCount').textContent=(state.v10.installedTemplates||[]).length; qs('#v10InstalledTemplates').innerHTML=(state.v10.installedTemplates||[]).map(t=>`<div class="item"><div class="item-head"><div><strong>${clean(t.name)}</strong><small>${clean(t.installedAt?.slice(0,10)||'')}</small><p>${clean(t.desc||'')}</p></div><button class="btn tiny ghost danger" onclick="v10DeleteTemplate('${t.id}')">×</button></div></div>`).join('')||'<div class="item muted">Žádné installed templates.</div>'; }
  function templatePacks(){ return [{id:'hybrid',tier:'Free',name:'Hybrid Summer Arc',desc:'Gym × run weekly structure, mobility and recovery rules.'},{id:'cut',tier:'Free',name:'Cut Performance Pack',desc:'High protein meal templates, low fatigue cardio, hunger protocols.'},{id:'race',tier:'Pro',name:'Race Week System',desc:'Taper, fuel checklist, pre-race protocol, pacing prompts.'},{id:'muscleup',tier:'Pro',name:'Muscle-up Skill Pack',desc:'Explosive pulls, dips, transitions, technique cues.'},{id:'police',tier:'Elite',name:'Police Test Prep',desc:'1 km, push-ups, shuttle/CMT, weekly benchmarks.'},{id:'launch',tier:'Elite',name:'App Launch Pack',desc:'Hosting, payments, privacy, beta feedback and changelog routines.'}]; }
  window.v10InstallTemplatePack=function(id){ const p=templatePacks().find(x=>x.id===id); if(!p)return; if(!state.v10.installedTemplates.some(x=>x.id===p.id)) state.v10.installedTemplates.unshift({...p,installedAt:new Date().toISOString()}); saveVault(); toast(`${p.name} installed.`); };
  window.v10DeleteTemplate=function(id){ state.v10.installedTemplates=state.v10.installedTemplates.filter(x=>x.id!==id); saveVault(); };

  function renderLaunchHQ(){ if(!has('v10LaunchChecklist')) return; const list=state.v10.launchChecklist||[]; const done=list.filter(x=>x.done).length; const pct=list.length?Math.round(done/list.length*100):0; qs('#v10LaunchPercent').textContent=pct+'%'; qs('#v10LaunchChecklist').innerHTML=list.map(x=>`<div class="item ${x.done?'doneish':''}"><div class="item-head"><div><strong>${clean(x.title)}</strong><small>${clean(x.group)}</small><p>${clean(x.note)}</p></div><button class="btn tiny ${x.done?'ghost':'primary'}" onclick="v10ToggleLaunch('${x.id}')">${x.done?'Undo':'Done'}</button></div></div>`).join(''); renderArchitectureMap(); renderPaidBlueprint(); }
  function defaultLaunchChecklist(){ return [
    {id:'repo',group:'hosting',title:'GitHub repo ready',note:'Upload v10 files, commit, clean README.'},{id:'deploy',group:'hosting',title:'Deploy static app',note:'Vercel/Netlify/GitHub Pages with HTTPS.'},{id:'supabase',group:'cloud',title:'Supabase SQL + Auth',note:'Run supabase.sql, use anon key only, test RLS.'},{id:'sync',group:'cloud',title:'PC/mobile sync test',note:'Create vault → push → pull on phone/tablet.'},{id:'backup',group:'security',title:'Encrypted backup exported',note:'Keep a backup before first public deploy.'},{id:'email',group:'serverless',title:'Email/webhook endpoint',note:'Use serverless function, not raw secrets in browser.'},{id:'payments',group:'paid',title:'Stripe/Paddle blueprint',note:'Checkout and webhooks via backend only.'},{id:'legal',group:'product',title:'Privacy/terms draft',note:'Explain data, export/delete, no medical claims.'},{id:'beta',group:'launch',title:'Beta test routine',note:'Test install, offline, sync, reset, backup, mobile UI.'},{id:'v10',group:'release',title:'V11 changelog published',note:'Versions page and docs updated.'}
  ]; }
  window.v10ToggleLaunch=function(id){ const item=state.v10.launchChecklist.find(x=>x.id===id); if(item)item.done=!item.done; saveVault(); };
  window.v10ToggleAllLaunch=function(done){ state.v10.launchChecklist.forEach(x=>x.done=done); saveVault(); };
  function renderArchitectureMap(){ if(!has('v10ArchitectureMap')) return; const steps=[['Frontend','Static app on Vercel/Netlify/GitHub Pages. No secret keys.'],['Vault','AES-GCM encrypted data in localStorage + encrypted cloud row.'],['Supabase','Auth + RLS table for encrypted vault per user.'],['Serverless later','Email reports, Stripe checkout, webhooks, AI endpoint.'],['Paid later','Plan stored after webhook; frontend gates are convenience only.']]; qs('#v10ArchitectureMap').innerHTML=steps.map((s,i)=>`<div class="v10-step"><strong>${i+1}</strong><div><h4>${clean(s[0])}</h4><p>${clean(s[1])}</p></div></div>`).join(''); }
  function renderPaidBlueprint(){ if(!has('v10PaidBlueprint')) return; const tiers=[['Free','Local vault, core logs, calculators, export/import.'],['Pro','Cloud sync, advanced analytics, template packs, email reports.'],['Elite','Coach share, team mode later, AI endpoint, premium programs.']]; qs('#v10PaidBlueprint').innerHTML=tiers.map(t=>`<div class="v10-card"><h3>${clean(t[0])}</h3><p>${clean(t[1])}</p></div>`).join(''); }
  window.v10CopyLaunchPlan=async function(){ const txt=['Training Arc OS v11 launch plan',...defaultLaunchChecklist().map((x,i)=>`${i+1}. ${x.title} — ${x.note}`),'Important: never put Supabase service_role or Stripe secret key in frontend.'].join('\n'); await navigator.clipboard.writeText(txt); toast('Launch plan copied.'); };

  function patchVersions(){
    if(typeof versionHistory==='function' && !versionHistory.__v10){
      const old=versionHistory;
      versionHistory=function(){ const hist=old().filter(x=>x.v!=='v10'); hist.forEach(x=>{ if(x.tag==='current') x.tag='legacy'; }); hist.push({v:'v10',title:'Historic Ultimate Athlete OS',tag:'current',items:['Major milestone release after V9 with new V11 Launchpad and production structure','Added AI Coach Studio, Season Roadmap, Exercise Library, Coach Share, Data Doctor, Template Market and Launch HQ','Expanded data packs: mega food atlas, recipe templates, exercise/protocol library and quote pack','Added docs folder and serverless API examples for email, Stripe and AI endpoint architecture','Prepared project for real hosting, Supabase sync tests and future Free/Pro/Elite versions']}); return hist; };
      versionHistory.__v10=true;
    }
    window.currentPatchNotes=function(){ return ['V11 Clean Deploy je největší milestone: z appky je private athlete OS + launch-ready projekt.','Nové moduly: Launchpad, AI Coach Studio, Season Roadmap, Exercise Library, Coach Share, Data Doctor, Template Market a Launch HQ.','Přidané data packy: V11 food atlas, recipe templates, exercise/protocol library a quote pack.','Přidané docs a api examples pro hosting, Supabase, security, payments, email a AI endpoint.','Reálné platby/email/AI secrets stále musí běžet přes backend/serverless — nikdy ne ve frontend souborech.']; };
    window.renderVersionsPage=function(){
      if(!has('versionTimeline')) return;
      const foodCount=((state.foods||[]).length+(state.customFoods||[]).length); const recipeCount=((state.recipes||[]).length+(state.customRecipes||[]).length);
      if(has('versionFoodCount')) qs('#versionFoodCount').textContent=foodCount.toLocaleString('cs-CZ');
      if(has('versionRecipeCount')) qs('#versionRecipeCount').textContent=recipeCount.toLocaleString('cs-CZ');
      if(has('versionExerciseCount')) qs('#versionExerciseCount').textContent=(state.exercisePresets||[]).length.toLocaleString('cs-CZ');
      if(has('versionModuleCount')) qs('#versionModuleCount').textContent=qsa('.view').length.toLocaleString('cs-CZ');
      qs('#versionTimeline').innerHTML=versionHistory().map((r,i)=>`<article class="release-card ${r.v==='v10'?'current':''}"><div class="release-index">${i+1}</div><div><div class="item-head"><div><span class="tag">${clean(r.tag)}</span><h3>${clean(r.v)} · ${clean(r.title)}</h3></div>${r.v==='v10'?'<span class="status-pill">current</span>':''}</div><ul>${r.items.map(x=>`<li>${clean(x)}</li>`).join('')}</ul></div></article>`).join('');
      if(has('currentPatchNotes')) qs('#currentPatchNotes').innerHTML=currentPatchNotes().map(x=>`<div class="coach-tip">${clean(x)}</div>`).join('');
      if(has('versionHostingSteps')){ const steps=[['1','Upload V10 to GitHub','Repo with docs, api examples and data packs.'],['2','Deploy static frontend','Vercel/Netlify/GitHub Pages, HTTPS and PWA.'],['3','Supabase project','Run SQL, Auth, RLS, anon key only.'],['4','Sync test','PC → push, mobile/tablet → pull, then backup.'],['5','Serverless later','Email reports, Stripe/Paddle and AI endpoint with secrets outside frontend.']]; qs('#versionHostingSteps').innerHTML=steps.map(s=>`<div class="version-step"><strong>${s[0]}</strong><h4>${clean(s[1])}</h4><p>${clean(s[2])}</p></div>`).join(''); }
    };
    window.changelogText=function(){ return 'Training Arc OS v11 Clean Deploy — changelog\n\n'+versionHistory().map(r=>`${r.v} — ${r.title} [${r.tag}]\n`+r.items.map(x=>' - '+x).join('\n')).join('\n\n')+'\n\nCurrent V11 notes\n'+currentPatchNotes().map(x=>' - '+x).join('\n'); };
    window.exportChangelog=function(){ download('training_arc_os_v11_changelog.txt',window.changelogText(),'text/plain'); };
  }
  function updateVersionsV10Patch(){ if(has('versionTimeline') && typeof renderVersionsPage==='function') renderVersionsPage(); }
  function bindUi(){ document.addEventListener('input',e=>{ if(e.target && e.target.id==='v10ExerciseSearch') renderLibrary(); }); }
  initV10();
})();
