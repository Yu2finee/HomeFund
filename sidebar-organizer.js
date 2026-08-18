(()=>{
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const groups=[
 {label:'MAIN',items:['overview','accounts','transactions']},
 {label:'BILLS & MONEY',items:['bills','subscriptions','planner','budgets','savings']},
 {label:'HOUSEHOLD',items:['family','requests','tasks']},
 {label:'PLANNING',items:['wishlist','pending','statements','insights']},
 {label:'ACCOUNT',items:['security']},
 {label:'ADMIN',items:['admin']}
];
function makeDivider(label){const d=document.createElement('div');d.className='hf-nav-divider';d.dataset.sidebarDivider=label;d.innerHTML=`<span>${label}</span>`;return d}
function organize(){const nav=q('.sidebar nav');if(!nav)return;qa('[data-sidebar-divider]').forEach(x=>x.remove());const buttons=qa('.sidebar nav .nav');const byPage=new Map(buttons.map(b=>[b.dataset.page,b]));const used=new Set();groups.forEach(g=>{const found=g.items.map(id=>byPage.get(id)).filter(Boolean);if(!found.length)return;nav.appendChild(makeDivider(g.label));found.forEach(b=>{nav.appendChild(b);used.add(b.dataset.page)})});const leftovers=buttons.filter(b=>!used.has(b.dataset.page));if(leftovers.length){nav.appendChild(makeDivider('MORE'));leftovers.forEach(b=>nav.appendChild(b))}}
function openPage(page,button){const target=document.getElementById(page);if(!target)return false;qa('.page').forEach(p=>p.classList.remove('active'));target.classList.add('active');qa('.sidebar .nav').forEach(b=>b.classList.remove('active'));button?.classList.add('active');const title=q('#pageTitle');if(title){const text=button?.querySelector('span')?.textContent?.trim()||page;title.textContent=text==='Requests'?'Purchase Requests':text}window.scrollTo({top:0,behavior:'smooth'});return true}
// Reliable delegated navigation. Dynamic sidebar buttons added by other feature scripts work too.
document.addEventListener('click',e=>{const btn=e.target.closest('.sidebar .nav[data-page]');if(!btn)return;const page=btn.dataset.page;if(!document.getElementById(page))return;e.preventDefault();e.stopPropagation();openPage(page,btn)},false);
const css=document.createElement('style');css.textContent=`
.sidebar nav{display:flex!important;flex-direction:column;gap:3px;overflow-y:auto;padding-right:3px}
.hf-nav-divider{display:flex;align-items:center;gap:8px;margin:13px 9px 5px;color:#7890a8;pointer-events:none;user-select:none}
.hf-nav-divider:after{content:'';height:1px;background:rgba(255,255,255,.11);flex:1}
.hf-nav-divider span{font-size:7px!important;font-weight:800!important;letter-spacing:.18em;white-space:nowrap}
/* Force every navigation item to use the same typography. Older feature CSS was making some dynamic items bold/different. */
.sidebar nav .nav,.sidebar nav .nav span{font-family:inherit!important;font-size:13px!important;font-weight:500!important;letter-spacing:0!important;font-style:normal!important;text-transform:none!important}
.sidebar nav .nav{transition:background .16s ease,transform .16s ease,border-color .16s ease;cursor:pointer!important;pointer-events:auto!important}
.sidebar nav .nav:hover{transform:translateX(2px)}
.sidebar nav .nav.active,.sidebar nav .nav.active span{font-weight:700!important}
.sidebar nav .nav:disabled{pointer-events:auto!important;opacity:1!important}
@media(max-width:800px){.hf-nav-divider{margin-top:10px}.sidebar nav{overflow-y:visible}}
`;document.head.appendChild(css);
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;organize()})});observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',()=>setTimeout(organize,1000));setTimeout(organize,250);
})();