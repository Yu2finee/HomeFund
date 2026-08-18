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
function organize(){const nav=q('.sidebar nav');if(!nav)return;qa('[data-sidebar-divider]').forEach(x=>x.remove());const buttons=qa('.sidebar nav .nav');const byPage=new Map(buttons.map(b=>[b.dataset.page,b]));const used=new Set();groups.forEach((g,idx)=>{const found=g.items.map(id=>byPage.get(id)).filter(Boolean);if(!found.length)return;if(idx>0||g.label!=='MAIN')nav.appendChild(makeDivider(g.label));else nav.appendChild(makeDivider(g.label));found.forEach(b=>{nav.appendChild(b);used.add(b.dataset.page)})});const leftovers=buttons.filter(b=>!used.has(b.dataset.page));if(leftovers.length){nav.appendChild(makeDivider('MORE'));leftovers.forEach(b=>nav.appendChild(b))}
 const admin=byPage.get('admin');if(admin){const adminDivider=qa('[data-sidebar-divider]').find(d=>d.dataset.sidebarDivider==='ADMIN');if(adminDivider){nav.appendChild(adminDivider);nav.appendChild(admin)}}
}
const css=document.createElement('style');css.textContent=`
.sidebar nav{display:flex!important;flex-direction:column;gap:3px;overflow-y:auto;padding-right:3px}
.hf-nav-divider{display:flex;align-items:center;gap:8px;margin:13px 9px 5px;color:#7890a8;pointer-events:none;user-select:none}
.hf-nav-divider:after{content:'';height:1px;background:rgba(255,255,255,.11);flex:1}
.hf-nav-divider span{font-size:7px;font-weight:900;letter-spacing:.18em;white-space:nowrap}
.sidebar .nav{transition:background .16s ease,transform .16s ease,border-color .16s ease}
.sidebar .nav:hover{transform:translateX(2px)}
.sidebar .nav[data-page=bills],.sidebar .nav[data-page=subscriptions]{font-weight:800}
.sidebar .nav[data-page=bills] span,.sidebar .nav[data-page=subscriptions] span{letter-spacing:.01em}
@media(max-width:800px){.hf-nav-divider{margin-top:10px}.sidebar nav{overflow-y:visible}}
`;document.head.appendChild(css);
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;organize()})});observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',()=>setTimeout(organize,1400));setTimeout(organize,300);setInterval(organize,3000);
})();