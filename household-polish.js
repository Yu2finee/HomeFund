(()=>{
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n)||0),safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let subCache=[];

async function getSubscriptions(){
  if(!profile?.household_id)return [];
  const {data,error}=await sb.from('subscriptions').select('*').eq('household_id',profile.household_id).order('next_charge_date',{ascending:true,nullsFirst:false});
  if(error){console.error('Subscription load',error);return []}
  subCache=data||[];return subCache;
}
function memberName(id){return members?.find(m=>m.id===id)?.display_name||'Unassigned'}

async function pointsStats(){
  const hero=q('#tasks .points-hero');
  if(!hero||!profile?.household_id)return;
  let box=q('#pointsPeriodStats');
  if(!box){box=document.createElement('div');box.id='pointsPeriodStats';box.className='points-period-stats';hero.insertAdjacentElement('afterend',box)}
  const now=new Date(),thisStart=new Date(now.getFullYear(),now.getMonth(),1),nextStart=new Date(now.getFullYear(),now.getMonth()+1,1),lastStart=new Date(now.getFullYear(),now.getMonth()-1,1);
  const {data,error}=await sb.from('family_tasks').select('points,status,reviewed_at').eq('household_id',profile.household_id).eq('status','approved').gte('reviewed_at',lastStart.toISOString()).lt('reviewed_at',nextStart.toISOString());
  if(error){box.innerHTML='<small>Point issue history unavailable.</small>';return}
  const rows=data||[],thisPts=rows.filter(x=>new Date(x.reviewed_at)>=thisStart).reduce((a,x)=>a+Number(x.points||0),0),lastPts=rows.filter(x=>{const d=new Date(x.reviewed_at);return d>=lastStart&&d<thisStart}).reduce((a,x)=>a+Number(x.points||0),0);
  box.innerHTML=`<article><small>POINTS ISSUED THIS MONTH</small><strong>★ ${thisPts.toLocaleString()}</strong></article><article><small>POINTS ISSUED LAST MONTH</small><strong>★ ${lastPts.toLocaleString()}</strong></article>`;
}

function payerOptions(selected){return `<option value="">Unassigned</option>${(members||[]).map(m=>`<option value="${m.id}" ${m.id===selected?'selected':''}>${safe(m.display_name)}</option>`).join('')}`}
async function subscriptionEditor(id=null){
  await getSubscriptions();const x=subCache.find(v=>v.id===id);
  modal(`<p class="kicker">RECURRING SUBSCRIPTION</p><h2>${x?'Edit subscription':'Add subscription'}</h2><form class="form" id="payerSubscriptionForm"><label>Name<input name="name" required value="${safe(x?.name||'')}" placeholder="Hulu"></label><label>Amount<input name="amount" type="number" min="0" step=".01" required value="${x?.amount??''}" placeholder="9.99"></label><label>Who pays this?<select name="payer">${payerOptions(x?.payer_user_id||'')}</select></label><label>Billing cycle<select name="cycle"><option value="monthly" ${x?.billing_cycle==='monthly'?'selected':''}>Monthly</option><option value="weekly" ${x?.billing_cycle==='weekly'?'selected':''}>Weekly</option><option value="yearly" ${x?.billing_cycle==='yearly'?'selected':''}>Yearly</option></select></label><label>Next charge date<input name="date" type="date" value="${x?.next_charge_date||''}"></label><label>Category<select name="category"><option>Streaming</option><option>Music</option><option>Gaming</option><option>Cloud Storage</option><option>Membership</option><option>Software</option><option>Other</option></select></label><label>Notes<input name="notes" maxlength="160" value="${safe(x?.notes||'')}" placeholder="Optional"></label><div class="form-actions"><button class="primary">${x?'Save Changes':'Add Subscription'}</button></div></form>`);
  const f=q('#payerSubscriptionForm');f.category.value=x?.category||'Streaming';
  f.onsubmit=async e=>{e.preventDefault();const d=new FormData(f),payload={household_id:profile.household_id,user_id:x?.user_id||session.user.id,payer_user_id:d.get('payer')||null,name:d.get('name').trim(),amount:Number(d.get('amount')),billing_cycle:d.get('cycle'),next_charge_date:d.get('date')||null,category:d.get('category'),notes:d.get('notes')||null,updated_at:new Date().toISOString()};const r=x?await sb.from('subscriptions').update(payload).eq('id',x.id):await sb.from('subscriptions').insert(payload);if(r.error)return toast(r.error.message);close();await getSubscriptions();toast(x?'Subscription updated.':'Subscription added.');q('.nav[data-page="subscriptions"]')?.click()};
}
function annotateSubscriptionPayers(){
  const rows=qa('#subscriptionList .subscription-row');if(!rows.length||!subCache.length)return;
  rows.forEach((row,i)=>{const x=subCache[i];if(!x)return;const main=row.querySelector('.sub-main small');if(main&&!main.dataset.payer){main.dataset.payer='1';main.insertAdjacentHTML('beforeend',` · <b class="sub-payer">Paid by ${safe(memberName(x.payer_user_id))}</b>`)} });
}

async function setupBillsToggle(){
  const header=q('#bills .section-title.row');if(!header||q('#includeSubsInBills'))return;
  const wrap=document.createElement('label');wrap.className='bill-sub-toggle';wrap.innerHTML='<input id="includeSubsInBills" type="checkbox"> <span>Include subscriptions</span>';
  const btn=q('#addBillBtn');btn?.parentNode?.insertBefore(wrap,btn);
  const cb=q('#includeSubsInBills');cb.checked=localStorage.getItem('hfIncludeSubsInBills')==='true';cb.onchange=()=>{localStorage.setItem('hfIncludeSubsInBills',cb.checked);renderBillSubscriptions()};renderBillSubscriptions();
}
async function renderBillSubscriptions(){
  const list=q('#billList');if(!list)return;let block=q('#billSubscriptionBlock');if(block)block.remove();const cb=q('#includeSubsInBills');if(!cb?.checked)return;
  await getSubscriptions();block=document.createElement('div');block.id='billSubscriptionBlock';block.className='bill-sub-block';block.innerHTML=`<div class="bill-sub-heading"><div><p class="kicker">OPTIONAL VIEW</p><h3>Subscriptions</h3></div><span>${subCache.filter(x=>x.active).length} active</span></div>${subCache.length?subCache.map(x=>`<div class="bill-sub-row ${x.active?'':'paused'}"><div><b>${safe(x.name)}</b><small>${safe(x.billing_cycle)} · Paid by ${safe(memberName(x.payer_user_id))}${x.next_charge_date?' · Next '+new Date(x.next_charge_date+'T12:00:00').toLocaleDateString():''}</small></div><strong>${money(x.amount)}</strong></div>`).join(''):'<p class="card-note">No subscriptions added.</p>'}`;list.insertAdjacentElement('afterend',block);
}

function moveAdminLast(){const nav=q('.sidebar nav'),admin=q('.nav[data-page="admin"]');if(nav&&admin&&nav.lastElementChild!==admin)nav.appendChild(admin)}

// Override subscription Add/Edit clicks so payer selection is always available.
document.addEventListener('click',e=>{
  const add=e.target.closest('#addSubscription');if(add){e.preventDefault();e.stopImmediatePropagation();subscriptionEditor();return}
  const edit=e.target.closest('[data-sub-edit]');if(edit){e.preventDefault();e.stopImmediatePropagation();subscriptionEditor(edit.dataset.subEdit);return}
},true);

const css=document.createElement('style');css.textContent=`.points-period-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:-5px 0 15px}.points-period-stats article{background:#fff;border:1px solid #dce3eb;border-radius:12px;padding:14px}.points-period-stats small{display:block;font-size:8px;font-weight:800;letter-spacing:.08em;color:#778397}.points-period-stats strong{display:block;font-size:20px;margin-top:7px;color:#172033}.sub-payer{font-weight:700;color:#42556d}.bill-sub-toggle{display:inline-flex;align-items:center;gap:6px;font-size:9px;font-weight:800;color:#536277;margin-left:auto;margin-right:8px}.bill-sub-toggle input{accent-color:#0b3158}.bill-sub-block{margin-top:12px;background:#fff;border:1px solid #dce3eb;border-radius:13px;padding:15px}.bill-sub-heading{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #edf0f4;padding-bottom:10px;margin-bottom:2px}.bill-sub-heading h3{margin:2px 0}.bill-sub-heading span{font-size:8px;background:#edf3fb;color:#235b93;padding:5px 8px;border-radius:999px;font-weight:800}.bill-sub-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid #edf0f4}.bill-sub-row:last-child{border-bottom:0}.bill-sub-row.paused{opacity:.5}.bill-sub-row b,.bill-sub-row small{display:block}.bill-sub-row b{font-size:10px}.bill-sub-row small{font-size:8px;color:#6c7889;margin-top:3px}.bill-sub-row strong{font-size:11px}@media(max-width:650px){.points-period-stats{grid-template-columns:1fr}.bill-sub-toggle{width:100%;order:3;margin:8px 0 0}.bill-sub-row{align-items:flex-start}}`;document.head.appendChild(css);

window.addEventListener('load',()=>setTimeout(async()=>{moveAdminLast();await getSubscriptions();annotateSubscriptionPayers();setupBillsToggle();pointsStats()},1300));
setInterval(async()=>{moveAdminLast();if(q('#tasks.active'))pointsStats();if(q('#subscriptions.active')){await getSubscriptions();annotateSubscriptionPayers()}if(q('#bills.active'))setupBillsToggle()},2200);
})();