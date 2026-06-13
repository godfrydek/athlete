/* Training Arc OS v10 Historic — visible version hard-fix + cache helper.
   Purpose: prevent old v7/v8/v9 labels from flashing in the UI after deploy. */
(function(){
  'use strict';
  const VERSION_LABEL = 'v10';
  const FULL_TITLE = 'Training Arc OS v10 Historic';
  const CACHE_NAME = 'training-arc-os-v10-historic-hardfix-2026-06-13';
  window.__TRAINING_ARC_OS_VERSION__ = VERSION_LABEL;
  window.__TRAINING_ARC_OS_TITLE__ = FULL_TITLE;

  function $(sel){ return document.querySelector(sel); }
  function $$(sel){ return Array.from(document.querySelectorAll(sel)); }
  function setText(sel, text){ const el=$(sel); if(el) el.textContent=text; }
  function enforceVisibleV10(){
    document.title = FULL_TITLE;
    const meta = $('meta[name="description"]');
    if(meta) meta.setAttribute('content','Training Arc OS v10 Historic — secure private all-in-one athlete, nutrition, recovery, planning and life OS.');

    // Lock screen / first page
    setText('.lock-card .brand-row h1 span', 'v10');
    setText('.lock-side .eyebrow', 'v10 historic upgrade');
    setText('.lock-side h2', 'Historic Athlete + Life OS');
    const sideItems = $$('.lock-side .feature-list li');
    if(sideItems[0]) sideItems[0].textContent = '12000+ food presetů + custom fotky';
    if(sideItems[1]) sideItems[1].textContent = 'Supabase login/sync pro mobil/tablet/PC';
    if(sideItems[2]) sideItems[2].textContent = 'Email/webhook reporty a encrypted backup';
    if(sideItems[5]) sideItems[5].textContent = 'V10 recipes, meal planner, future-self, quests a stretching routines';

    // Sidebar/topbar
    setText('.sidebar-top span', 'v10 Historic');
    setText('#viewTitle', $('#viewTitle')?.textContent || 'Dashboard');
    $$('.version-badge,.app-version,.current-version').forEach(el=>{ el.textContent='v10 Historic'; });

    // Replace old visible hero labels outside changelog timeline.
    $$('p.eyebrow').forEach(el=>{
      const t=(el.textContent||'').trim().toLowerCase();
      if(t.includes('v8 fire upgrade') || t.includes('v8 fire') || t.includes('v7 lucky') || t.includes('v9 ulti')) el.textContent='v10 historic upgrade';
    });

    // If an old addon rendered an outdated current card, force V10 card as current.
    $$('.release-card').forEach(card=>{
      const text=card.textContent||'';
      card.classList.toggle('current', text.includes('v10 ·'));
      const status=card.querySelector('.status-pill');
      if(status && !text.includes('v10 ·')) status.remove();
    });
  }

  async function clearOldCaches(){
    if(!('caches' in window)) return;
    try{
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => /training-arc-os/i.test(k) && k !== CACHE_NAME).map(k => caches.delete(k)));
    }catch(_){/* ignore */}
  }

  async function forceV10Refresh(){
    await clearOldCaches();
    try{
      if('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.update().catch(()=>{})));
      }
    }catch(_){/* ignore */}
    const url = new URL(location.href);
    url.searchParams.set('v10','force');
    url.searchParams.set('t', Date.now().toString());
    location.replace(url.toString());
  }

  document.addEventListener('DOMContentLoaded',()=>{
    enforceVisibleV10();
    clearOldCaches();
    const btn = $('#v10HardRefreshBtn');
    if(btn) btn.addEventListener('click', forceV10Refresh);
  });
  window.addEventListener('load',()=>{
    enforceVisibleV10();
    setTimeout(enforceVisibleV10, 250);
    setTimeout(enforceVisibleV10, 1000);
  });
  window.forceTrainingArcV10Refresh = forceV10Refresh;
})();
