
export async function loadView(viewName = 'dashboard', {containerSelector = '#cb-main'} = {}){
  const container = document.querySelector(containerSelector);
  if(!container) return;
  const url = `/dash/views/${viewName}.html`;
  try{
    const res = await fetch(url, {cache: 'no-store'});
    if(!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const html = await res.text();
    container.innerHTML = html;

    window.dispatchEvent(new CustomEvent('cb:view:loaded', {detail:{view:viewName}}));
  }catch(err){
    console.error('View loader error', err);
    container.innerHTML = `<div class="card"><div class="card-title">Load error</div><div class="card-content">Could not load view: ${viewName}</div></div>`;
  }
}

if(typeof window !== 'undefined'){
  window.addEventListener('cb:navigate', (e)=>{
    const view = e.detail && e.detail.view ? e.detail.view : 'dashboard';
    loadView(view);
  });

  window.addEventListener('DOMContentLoaded', ()=>{
    const main = document.querySelector('#cb-main');
    if(main && main.innerHTML.trim()==='') loadView('dashboard');
  });
}
