/* Compatibility shim: older cached V10 index may still request this file.
   In V11 it deliberately enforces V11 labels and clears old caches. */
(function(){
  const TITLE='Training Arc OS v11 Clean Deploy';
  const LABEL='v11 Clean Deploy';
  function $(s){return document.querySelector(s)}
  function $$(s){return Array.from(document.querySelectorAll(s))}
  function set(s,t){const e=$(s); if(e)e.textContent=t}
  async function clear(){
    if('caches' in window){try{const keys=await caches.keys(); await Promise.all(keys.filter(k=>/training-arc-os/i.test(k)).map(k=>caches.delete(k)));}catch(e){}}
    if('serviceWorker' in navigator){try{const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.update().catch(()=>{})));}catch(e){}}
  }
  function enforce(){
    document.title=TITLE;
    const meta=$('meta[name="description"]'); if(meta) meta.content='Training Arc OS v11 Clean Deploy — private encrypted athlete life OS.';
    set('.lock-card h1 span','v11'); set('.lock-side .eyebrow','v11 clean deploy'); set('.sidebar-top span',LABEL); set('.version-badge strong','v11');
    $$('.eyebrow').forEach(e=>{if(/v7|v8|v9|v10/i.test(e.textContent||'')) e.textContent='v11 clean deploy'});
    const btn=$('#v10HardRefreshBtn'); if(btn){btn.textContent='Fix V11 root cache'; btn.onclick=async()=>{await clear(); const u=new URL(location.href); u.search=''; u.hash=''; location.replace(u.href);};}
  }
  document.addEventListener('DOMContentLoaded',()=>{enforce();clear();});
  window.addEventListener('load',()=>{enforce();setTimeout(enforce,500);});
})();
