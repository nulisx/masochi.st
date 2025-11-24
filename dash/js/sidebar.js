// Modular Sidebar JS (ES module)
export function initSidebar({sidebarSelector = '#cb-sidebar', collapseBtn = '#cb-collapse-btn'} = {}){
  const sidebar = document.querySelector(sidebarSelector);
  const btn = document.querySelector(collapseBtn);
  if(!sidebar || !btn) return;

  // restore collapsed state from localStorage
  if(window.localStorage.getItem('cb_sidebar_collapsed') === 'true'){
    sidebar.classList.add('collapsed');
    btn.setAttribute('aria-expanded','false');
  }

  btn.addEventListener('click', ()=>{
    const collapsed = sidebar.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', String(!collapsed));
    window.localStorage.setItem('cb_sidebar_collapsed', String(collapsed));
  });

  // navigation clicks -> dispatch custom event
  sidebar.querySelectorAll('.cb-menu-item').forEach(item=>{
    item.addEventListener('click', ()=>{
      sidebar.querySelectorAll('.cb-menu-item').forEach(i=>i.classList.remove('active'));
      item.classList.add('active');
      const view = item.dataset.view || null;
      const ev = new CustomEvent('cb:navigate', {detail:{view}});
      window.dispatchEvent(ev);
    });
  });
}

// Convenience auto-init for pages that directly include this module
if(typeof window !== 'undefined'){
  window.addEventListener('DOMContentLoaded', ()=>{
    try{ initSidebar(); }catch(e){console.warn('Sidebar init failed',e)}
  });
}
