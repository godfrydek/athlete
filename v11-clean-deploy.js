/* Training Arc OS v11 Clean Deploy — final visible version + root cache cleanup */
(function(){
  'use strict';
  const VERSION='v11';
  const LABEL='v11 Clean Deploy';
  const TITLE='Training Arc OS v11 Clean Deploy';
  const CACHE='training-arc-os-v11-clean-deploy-2026-06-13';
  window.__TRAINING_ARC_OS_VERSION__=VERSION;
  window.__TRAINING_ARC_OS_TITLE__=TITLE;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const clean=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const set=(sel,txt)=>{const el=$(sel); if(el) el.textContent=txt;};
  const rep=(txt)=>String(txt||'')
    .replace(/Training Arc OS v10 Historic/g,TITLE)
    .replace(/Training Arc OS v10/g,TITLE)
    .replace(/v10 Historic/g,LABEL)
    .replace(/v10 historic/g,'v11 clean deploy')
    .replace(/V10 Historic/g,'V11 Clean Deploy')
    .replace(/V10 Launchpad/g,'V11 Launchpad')
    .replace(/V10 stack/g,'V11 stack')
    .replace(/V10 changelog/g,'V11 changelog')
    .replace(/v10 changelog/g,'v11 changelog')
    .replace(/current V10/gi,'current V11')
    .replace(/\bv10\b/g,'v11')
    .replace(/\bV10\b/g,'V11');

  async function clearCaches(){
    if(!('caches' in window)) return;
    try{ const keys=await caches.keys(); await Promise.all(keys.filter(k=>/training-arc-os/i.test(k) && k!==CACHE).map(k=>caches.delete(k))); }catch(e){}
  }

  async function resetServiceWorkers(reload=false){
    await clearCaches();
    if('serviceWorker' in navigator){
      try{
        const regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r=>r.update().catch(()=>{})));
      }catch(e){}
    }
    if(reload){
      const u=new URL(location.href); u.search=''; u.hash='';
      location.replace(u.href);
    }
  }

  function patchVisible(){
    document.title=TITLE;
    const meta=$('meta[name="description"]');
    if(meta) meta.content='Training Arc OS v11 Clean Deploy — secure private all-in-one athlete, nutrition, recovery, planning and life OS.';
    set('.lock-card .brand-row h1 span','v11');
    set('.lock-side .eyebrow','v11 clean deploy');
    set('.lock-side h2','Clean Deploy Athlete + Life OS');
    set('.sidebar-top span',LABEL);
    set('.version-badge strong','v11');
    set('.version-badge small','Clean Deploy · root fix');
    const hard=$('#v10HardRefreshBtn');
    if(hard){ hard.textContent='Fix V11 root cache'; hard.title='Smaže starou PWA cache a znovu načte root /athlete/ bez query parametru'; }
    $$('[data-jump="versions"],button').forEach(b=>{ if((b.textContent||'').match(/v10/i)) b.textContent=rep(b.textContent); });
    $$('.sidebar-top span,.version-badge,.lock-side,.lock-card h1 span,.v10-section-chip,.v10-crown,.version-hero,.panel-head,.release-card').forEach(el=>{
      if(el.id==='versionTimeline') return;
      // only shallow text nodes, avoid trashing inputs/buttons structure
      el.childNodes.forEach(n=>{ if(n.nodeType===3 && /v10|V10/.test(n.nodeValue)) n.nodeValue=rep(n.nodeValue); });
    });
    $$('.v10-section-chip').forEach(el=>el.textContent=LABEL);
    $$('.v10-crown strong').forEach(el=>{ if((el.textContent||'').trim().toLowerCase()==='v10') el.textContent='v11'; });
    $$('.eyebrow').forEach(el=>{ const t=(el.textContent||'').toLowerCase(); if(t.includes('v10')||t.includes('v9')||t.includes('v8')||t.includes('v7')) el.textContent='v11 clean deploy'; });
    if($('#versions')) patchVersionFunctions();
  }

  function history(){
    return [
      {v:'v1',title:'Core prototype',tag:'foundation',items:['Local-first dashboard','Basic calories, gym and run logs','Simple graphs, PR board, export/import','PIN lock starter']},
      {v:'v2',title:'Premium Life OS',tag:'secure vault',items:['AES-GCM encrypted vault concept','Life OS modules: journal, mood, chores, books','Better analytics and AI-style coach tips','Supabase cloud-ready architecture']},
      {v:'v3',title:'All-in-one training',tag:'calculators',items:['Food calculator per 100 g → portion grams','Custom food database','Gym presets based on your style','Running types + 1RM, VO2max, BMI, TDEE, pace tools']},
      {v:'v4',title:'Media + import',tag:'email backup',items:['Email/webhook reports','Custom foods with images','Expanded food presets','Workout history import for presets']},
      {v:'v5',title:'Supreme sync build',tag:'cloud/security',items:['Supabase login/sync hub','Security center and password change','1000+ generated food presets','Meal builder + hosting-ready PWA base']},
      {v:'v6',title:'Titan expansion',tag:'life planning',items:['Recipes and custom recipes','Planner/timeable events + ICS export','MyFutureSelf letters/goals','Stretching and recovery routines']},
      {v:'v7',title:'Lucky Number giga build',tag:'legacy',items:['4000+ food presets and performance meal templates','Weekly meal planner, grocery list and spending tracker','Body vault, progress photos, quests and achievements','Hosting Lab, Connection Hub and version/update subpage']},
      {v:'v8',title:'Fire Athlete OS',tag:'legacy',items:['Performance Lab, Motivation Vault and Athlete Toolkit','Plans & Monetization Lab for future paid versions','Expanded nutrition and recipe templates','Discipline contracts, protocols and sport checklists']},
      {v:'v9',title:'Ulti stability build',tag:'legacy',items:['Major sidebar and mobile drawer fix','Split into css/js/data packs','Coach Hub, Program Builder, Injury Guard and Sleep Lab','Owner Lab and hosting-ready polish']},
      {v:'v10',title:'Historic Ultimate Athlete OS',tag:'legacy',items:['Launchpad, AI Coach Studio, Season Roadmap and Exercise Library','Coach Share, Data Doctor, Template Market and Launch HQ','Docs folder, serverless API examples and production structure','First hard-fix attempt for visible version labels']},
      {v:'v11',title:'Clean Deploy Root Fix',tag:'current',items:['New service worker cache strategy for /athlete/ root','Deletes old training-arc-os caches and claims clients immediately','Visible branding forced to v11 across title, lock screen, sidebar, main page and history','Root reload helper no longer requires ?v10=force','Docs/manifest/cache names bumped to v11']}
    ];
  }
  function notes(){ return [
    'V11 Clean Deploy je hlavně release na opravu GitHub Pages/PWA cache problému: root /athlete/ už má načíst aktuální build bez ?v10=force.',
    'Nový service worker maže staré training-arc-os cache, používá network-first pro HTML a po aktivaci si vezme kontrolu nad stránkou.',
    'V UI je viditelně v11: browser tab, lock screen, sidebar, Versions page, changelog i export názvy.',
    'Vnitřní názvy některých souborů typu v9-addon/v10-addon zůstávají jako legacy vrstvy kvůli kompatibilitě, ale už nemají určovat aktuální viditelnou verzi.',
    'Po deployi nahraj celý ZIP obsah do repa a commitni hlavně index.html + sw.js; pokud jeden starý load ještě proběhne, V11 SW by ho měl sám přebít reloadem.'
  ]; }
  function patchVersionFunctions(){
    window.versionHistory=history;
    window.currentPatchNotes=notes;
    window.changelogText=function(){ return TITLE+' — changelog\n\n'+history().map(r=>`${r.v} — ${r.title} [${r.tag}]\n`+r.items.map(x=>' - '+x).join('\n')).join('\n\n')+'\n\nCurrent V11 notes\n'+notes().map(x=>' - '+x).join('\n'); };
    window.exportChangelog=function(){ if(typeof download==='function') download('training_arc_os_v11_changelog.txt',window.changelogText(),'text/plain'); };
    window.renderVersionsPage=function(){
      if(!$('#versionTimeline')) return;
      try{
        const allFoods=((window.state&&state.foods)||[]).length+((window.state&&state.customFoods)||[]).length;
        if($('#versionFoodCount')) $('#versionFoodCount').textContent=(typeof fmt==='function'?fmt(allFoods):allFoods);
        const recipes=typeof allRecipes==='function'?allRecipes():[];
        if($('#versionRecipeCount')) $('#versionRecipeCount').textContent=(typeof fmt==='function'?fmt(recipes.length):recipes.length);
        if($('#versionExerciseCount')) $('#versionExerciseCount').textContent=(typeof fmt==='function'?fmt((state.exercisePresets||[]).length):(state.exercisePresets||[]).length);
        if($('#versionModuleCount')) $('#versionModuleCount').textContent=(typeof fmt==='function'?fmt($$('.view').length):$$('.view').length);
      }catch(e){}
      $('#versionTimeline').innerHTML=history().map((r,i)=>`<article class="release-card ${r.v==='v11'?'current v11-release-glow':''}"><div class="release-index">${i+1}</div><div><div class="item-head"><div><span class="tag">${clean(r.tag)}</span><h3>${clean(r.v)} · ${clean(r.title)}</h3></div>${r.v==='v11'?'<span class="status-pill">current</span>':''}</div><ul>${r.items.map(x=>`<li>${clean(x)}</li>`).join('')}</ul></div></article>`).join('');
      if($('#currentPatchNotes')) $('#currentPatchNotes').innerHTML=notes().map(x=>`<div class="coach-tip">${clean(x)}</div>`).join('');
      if($('#versionHostingSteps')){ const steps=[['1','Upload V11 files','Nahraj aktuální v11 soubory do GitHub repa, hlavně index.html a sw.js.'],['2','GitHub Pages root test','Otevři https://godfrydek.github.io/athlete/ bez query parametru.'],['3','Service worker takeover','V11 SW smaže staré cache; případný jeden reload je normální.'],['4','Supabase sync','Create vault → sign in → push z PC → pull na mobil/tablet.'],['5','Next','Pak řešit doménu, email endpointy a paid tiers.']]; $('#versionHostingSteps').innerHTML=steps.map(s=>`<div class="version-step"><strong>${s[0]}</strong><h4>${clean(s[1])}</h4><p>${clean(s[2])}</p></div>`).join(''); }
      patchVisible();
    };
    if($('#versionTimeline')) window.renderVersionsPage();
    const vh=$('.version-hero h1 span'); if(vh) vh.textContent=LABEL;
    const lead=$('.version-hero .lead'); if(lead) lead.textContent='V11 Clean Deploy je aktuální root-fix build pro /athlete/. Tahle podstránka drží historii updatů, hosting checklist a quick changelog.';
    const tag=$('.version-stats')?.previousElementSibling; // no-op, keeps old layout safe
    const timelineTag=$('.panel-head .tag');
    $$('.panel-head .tag').forEach(el=>{ if((el.textContent||'').includes('v1')) el.textContent='v1 → v11'; if((el.textContent||'').toLowerCase().includes('after v10')) el.textContent='after v11'; });
    $$('.panel-head h3').forEach(el=>{ if((el.textContent||'').toLowerCase().includes('v10 current')) el.textContent='v11 current patch notes'; });
  }

  function showBanner(){
    if($('#v11CacheBanner') || localStorage.getItem('training_arc_os_v11_banner_seen')) return;
    const div=document.createElement('div'); div.id='v11CacheBanner'; div.className='v11-cache-banner';
    div.innerHTML=`<div><strong>V11 Clean Deploy aktivní</strong><p>Jestli root pořád ukazuje starou verzi, klikni fix — smaže PWA cache a vrátí tě na /athlete/ bez query.</p></div><div class="button-row wrap"><button id="v11FixNow" class="btn primary">Fix root</button><button id="v11BannerClose" class="btn ghost">OK</button></div>`;
    document.body.appendChild(div);
    $('#v11FixNow').addEventListener('click',()=>resetServiceWorkers(true));
    $('#v11BannerClose').addEventListener('click',()=>{ localStorage.setItem('training_arc_os_v11_banner_seen','1'); div.remove(); });
  }

  function boot(){
    patchVersionFunctions();
    patchVisible();
    clearCaches();
    const btn=$('#v10HardRefreshBtn');
    if(btn){ const clone=btn.cloneNode(true); btn.parentNode.replaceChild(clone,btn); clone.id='v11RootFixBtn'; clone.textContent='Fix V11 root cache'; clone.addEventListener('click',()=>resetServiceWorkers(true)); }
    document.addEventListener('click',()=>setTimeout(patchVisible,80),true);
    setTimeout(patchVisible,250); setTimeout(patchVisible,900); setTimeout(showBanner,1400);
  }
  window.trainingArcV11RootFix=()=>resetServiceWorkers(true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',()=>{ patchVersionFunctions(); patchVisible(); clearCaches(); });
})();
