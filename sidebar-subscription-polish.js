(()=>{
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

function installStyles(){
 if(q('#hfSidebarSubPolishStyles'))return;
 const s=document.createElement('style');
 s.id='hfSidebarSubPolishStyles';
 s.textContent=`
 /* HomeFund sidebar scrollbar */
 .sidebar{scrollbar-width:thin;scrollbar-color:#6f87a1 #081a2f}
 .sidebar::-webkit-scrollbar{width:8px}
 .sidebar::-webkit-scrollbar-track{background:#081a2f;border-radius:999px;margin:8px 0}
 .sidebar::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#8ca2ba,#4e6a86);border-radius:999px;border:2px solid #081a2f}
 .sidebar::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#a5b8ca,#66829e)}
 .sidebar nav{scrollbar-width:thin;scrollbar-color:#6f87a1 transparent}
 .sidebar nav::-webkit-scrollbar{width:7px}
 .sidebar nav::-webkit-scrollbar-track{background:transparent}
 .sidebar nav::-webkit-scrollbar-thumb{background:#617994;border-radius:999px}

 /* Subscription filter bar */
 .hf-sub-filterbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 14px;padding:11px 12px;border:1px solid #dce3eb;border-radius:11px;background:#f8fafc}
 .hf-sub-filterbar .hf-filter-label{display:flex;align-items:center;gap:8px;font-size:9px;font-weight:800;color:#657489;letter-spacing:.04em}
 .hf-sub-filterbar select{min-width:165px;border:1px solid #ccd6e1;border-radius:8px;background:#fff;color:#172033;padding:8px 10px;font-size:10px;cursor:pointer}
 .hf-sub-filterbar .hf-sub-count{font-size:9px;color:#778397;margin-left:auto}
 @media(max-width:700px){.hf-sub-filterbar{align-items:stretch}.hf-sub-filterbar .hf-filter-label{width:100%;justify-content:space-between}.hf-sub-filterbar select{min-width:0;flex:1}.hf-sub-filterbar .hf-sub-count{width:100%;margin-left:0}}
 `;
 document.head.appendChild(s);
}

function memberList(){
 try{return Array.isArray(members)?members:[]}catch{return []}
}
function payerName(id){return memberList().find(m=>m.id===id)?.display_name||'Unassigned'}

function ensurePayerFilter(){
 const page=q('#subscriptions');
 const list=q('#subscriptionList');
 if(!page||!list)return;
 let bar=q('#hfSubFilterBar');
 if(!bar){
   bar=document.createElement('div');
   bar.id='hfSubFilterBar';
   bar.className='hf-sub-filterbar';
   bar.innerHTML=`<div class="hf-filter-label"><span>FILTER BY PAYER</span><select id="hfSubPayerSort"><option value="all">Everyone</option></select></div><span class="hf-sub-count" id="hfSubVisibleCount"></span>`;
   list.parentElement?.insertBefore(bar,list);
 }
 const sel=q('#hfSubPayerSort');
 if(!sel)return;
 const old=sel.value||'all';
 sel.innerHTML='<option value="all">Everyone</option>'+memberList().map(m=>`<option value="${m.id}">${safe(m.display_name)}</option>`).join('')+'<option value="unassigned">Unassigned</option>';
 sel.value=[...sel.options].some(o=>o.value===old)?old:'all';
 if(!sel.dataset.bound){sel.dataset.bound='1';sel.addEventListener('change',applyPayerFilter)}
 applyPayerFilter();
}

function applyPayerFilter(){
 const sel=q('#hfSubPayerSort');
 const host=q('#subscriptionList');
 if(!sel||!host)return;
 const who=sel.value;
 const rows=qa('#subscriptionList .subscription-row');
 let shown=0;
 rows.forEach(row=>{
   let payerId=row.dataset.payerId||'';
   if(!payerId){
     const text=row.querySelector('.sub-main small')?.textContent||'';
     const match=memberList().find(m=>text.includes(`Paid by ${m.display_name}`));
     if(match)payerId=match.id;
   }
   const show=who==='all'||(who==='unassigned'&&!payerId)||payerId===who;
   row.style.display=show?'':'none';
   if(show)shown++;
 });
 const count=q('#hfSubVisibleCount');
 if(count)count.textContent=`${shown} subscription${shown===1?'':'s'} shown`;
}

function tagSubscriptionRows(){
 const rows=qa('#subscriptionList .subscription-row');
 rows.forEach(row=>{
   if(row.dataset.payerId)return;
   const text=row.querySelector('.sub-main small')?.textContent||'';
   const m=memberList().find(x=>text.includes(`Paid by ${x.display_name}`));
   if(m)row.dataset.payerId=m.id;
 });
 applyPayerFilter();
}

function refresh(){installStyles();ensurePayerFilter();tagSubscriptionRows()}

window.addEventListener('load',()=>setTimeout(refresh,1200));
[500,1500,3000].forEach(ms=>setTimeout(refresh,ms));
document.addEventListener('click',e=>{if(e.target.closest?.('.nav[data-page="subscriptions"]'))setTimeout(refresh,250)},true);
document.addEventListener('change',e=>{if(e.target?.id==='subFilter')setTimeout(refresh,100)},true);
const obs=new MutationObserver(m=>{if(m.some(x=>[...x.addedNodes].some(n=>n.nodeType===1&&(n.id==='subscriptionList'||n.querySelector?.('#subscriptionList')||n.matches?.('.subscription-row')))))setTimeout(refresh,50)});
obs.observe(document.documentElement,{childList:true,subtree:true});
})();