/* Training Arc OS v11.1 BarFix — sidebar/mobile nav patch */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const CORE=[['dashboard','🏠','Home'],['nutrition','🍽️','Food'],['gym','🏋️','Gym'],['running','🏃','Run'],['planner','🗓️','Plan']];
  function appActive(){ return $('#appShell') && !$('#appShell').classList.contains('hidden'); }
  function setActiveChrome(){
    const active=$('.nav-btn.active')?.dataset.view || 'dashboard';
    $$('.v11-bottomnav button').forEach(b=>b.classList.toggle('active',b.dataset.view===active));
    document.body.classList.toggle('v11-app-active',appActive());
  }
  function closeNav(){ document.body.classList.remove('v11-nav-open'); $('.sidebar')?.classList.remove('show'); $('#v9Backdrop')?.classList.remove('show'); }
  function openNav(){ document.body.classList.add('v11-nav-open'); $('.sidebar')?.classList.add('show'); }
  function go(view){
    if(typeof window.switchView==='function') window.switchView(view);
    else $(`.nav-btn[data-view="${view}"]`)?.click();
    closeNav(); setTimeout(setActiveChrome,40);
  }
  function inject(){
    if(!$('#v11DrawerBackdrop')){ const bd=document.createElement('div'); bd.id='v11DrawerBackdrop'; bd.className='v11-drawer-backdrop'; bd.addEventListener('click',closeNav); document.body.appendChild(bd); }
    if(!$('#v11MobileBar')){
      const bar=document.createElement('div'); bar.id='v11MobileBar'; bar.className='v11-mobilebar';
      bar.innerHTML='<button id="v11MenuOpen" class="v11-icon-btn" aria-label="Open modules">☰</button><div class="v11-mobile-title"><strong>Training Arc OS</strong><span>v11 BarFix</span></div><button id="v11QuickSave" class="v11-icon-btn" aria-label="Save vault">↻</button>';
      document.body.appendChild(bar);
      $('#v11MenuOpen').addEventListener('click',openNav);
      $('#v11QuickSave').addEventListener('click',()=>$('#quickSaveBtn')?.click());
    }
    if(!$('#v11BottomNav')){
      const nav=document.createElement('div'); nav.id='v11BottomNav'; nav.className='v11-bottomnav';
      nav.innerHTML=CORE.map(x=>`<button data-view="${x[0]}"><span>${x[1]}</span>${x[2]}</button>`).join('');
      nav.addEventListener('click',e=>{ const b=e.target.closest('button[data-view]'); if(b) go(b.dataset.view); });
      document.body.appendChild(nav);
    }
    const sideTop=$('.sidebar-top');
    if(sideTop && !$('#v11SidebarClose')){
      const btn=document.createElement('button'); btn.id='v11SidebarClose'; btn.className='v11-sidebar-close v11-icon-btn'; btn.type='button'; btn.textContent='×'; btn.title='Zavřít menu'; btn.addEventListener('click',closeNav); sideTop.appendChild(btn);
    }
    $('#v9MobileToggle')?.remove();
  }
  function patchLabels(){
    document.title='Training Arc OS v11 BarFix';
    const meta=$('meta[name="description"]'); if(meta) meta.content='Training Arc OS v11 BarFix — clean root deploy with fixed sidebar/mobile navigation.';
    $$('.sidebar-top span').forEach(x=>x.textContent='v11 BarFix');
    $$('.lock-card h1 span').forEach(x=>x.textContent='v11');
    $$('.lock-side .eyebrow').forEach(x=>x.textContent='v11 barfix');
    $$('.lock-side h2').forEach(x=>x.textContent='Clean Deploy + Fixed Navigation');
    const btn=$('#v10HardRefreshBtn,#v11RootFixBtn'); if(btn) btn.textContent='Fix V11 cache';
  }
  function wire(){
    document.addEventListener('click',e=>{
      if(e.target.closest('.nav-btn')) setTimeout(()=>{ closeNav(); setActiveChrome(); },60);
      if(e.target.closest('[data-jump]')) setTimeout(setActiveChrome,80);
    },true);
    document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeNav(); });
    const shell=$('#appShell'); if(shell && !shell.__v11barObserver){
      new MutationObserver(()=>setActiveChrome()).observe(shell,{attributes:true,attributeFilter:['class']}); shell.__v11barObserver=true;
    }
    window.addEventListener('resize',()=>{ if(innerWidth>960) closeNav(); setActiveChrome(); },{passive:true});
  }
  function boot(){ inject(); patchLabels(); wire(); setActiveChrome(); setTimeout(()=>{ inject(); patchLabels(); setActiveChrome(); },500); setTimeout(setActiveChrome,1500); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
