(()=>{
  const qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
  const esc2=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt2=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n)||0);
  let enhancing=false;

  async function ensureJsPDF(){
    if(window.jspdf?.jsPDF)return window.jspdf.jsPDF;
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
    return window.jspdf.jsPDF;
  }

  async function downloadTransactionsPDF(){
    try{
      const jsPDF=await ensureJsPDF(), doc=new jsPDF({unit:'pt',format:'letter'});
      const me=(typeof myTx==='function'?myTx():[]).filter(t=>{const d=new Date(t.created_at),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()});
      const spend=typeof myAccount==='function'?myAccount('spending'):null;
      const income=me.filter(t=>t.type==='income').reduce((a,t)=>a+Number(t.amount),0);
      const purchases=me.filter(t=>t.type==='expense').reduce((a,t)=>a+Number(t.amount),0);
      const transfers=me.filter(t=>String(t.type).startsWith('transfer')).reduce((a,t)=>a+Number(t.amount),0);
      const member=(typeof profile!=='undefined'&&profile?.display_name)||'HomeFund Member';
      const month=new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'});
      const W=612, margin=42;
      const header=()=>{
        doc.setFillColor(7,27,51);doc.rect(0,0,W,82,'F');
        doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('HOMEFUND',margin,35);
        doc.setFontSize(9);doc.text('FAMILY FINANCIAL HUB',margin,52);
        doc.setFont('times','bold');doc.setFontSize(18);doc.text('Transaction Statement',W-margin,34,{align:'right'});
        doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(`${month} · Household Tracking Statement`,W-margin,52,{align:'right'});
      };
      header();
      doc.setTextColor(24,32,51);doc.setFont('helvetica','normal');doc.setFontSize(9);
      doc.text('STATEMENT FOR',margin,110);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(member,margin,126);
      doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(105,118,136);doc.text(`HomeFund Spending ••${spend?.last4||'----'}`,margin,141);
      const boxes=[['CURRENT BALANCE',fmt2(spend?.balance)],['INCOME',fmt2(income)],['PURCHASES',fmt2(purchases)],['TRANSFERS',fmt2(transfers)]];
      let x=margin;boxes.forEach(([label,value])=>{doc.setFillColor(247,249,252);doc.roundedRect(x,162,123,54,6,6,'F');doc.setTextColor(112,125,143);doc.setFontSize(7);doc.text(label,x+10,178);doc.setTextColor(7,27,51);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text(value,x+10,198);doc.setFont('helvetica','normal');x+=132});
      let y=248;doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(7,27,51);doc.text('DATE',margin,y);doc.text('DESCRIPTION',110,y);doc.text('CATEGORY',345,y);doc.text('AMOUNT',W-margin,y,{align:'right'});y+=10;doc.setDrawColor(7,27,51);doc.line(margin,y,W-margin,y);y+=16;
      doc.setFont('helvetica','normal');doc.setFontSize(8);
      for(const t of me){
        if(y>724){doc.addPage();header();y=112;doc.setFontSize(8)}
        const positive=t.type==='income';doc.setTextColor(50,60,76);doc.text(new Date(t.created_at).toLocaleDateString(),margin,y);doc.text(String(t.merchant||'').slice(0,34),110,y);doc.setTextColor(105,118,136);doc.text(String(t.category||'Other').slice(0,22),345,y);doc.setTextColor(positive?8:40,positive?122:48,positive?85:62);doc.text(`${positive?'+':'-'}${fmt2(t.amount)}`,W-margin,y,{align:'right'});y+=19;doc.setDrawColor(233,237,242);doc.line(margin,y-8,W-margin,y-8);
      }
      doc.setFontSize(7);doc.setTextColor(112,125,143);doc.text('HomeFund is a private household budgeting and savings tracker. This is not a bank statement and no real funds are held or transferred.',margin,760,{maxWidth:W-margin*2});
      doc.save(`HomeFund-Transactions-${new Date().toISOString().slice(0,10)}.pdf`);
      if(typeof toast==='function')toast('Transaction statement downloaded.');
    }catch(e){console.error(e);alert('Could not create the statement. Please refresh and try again.');}
  }

  function newManagedGoal(){
    if(typeof modal!=='function')return;
    modal(`<p class="kicker">SAVINGS</p><h2>Create a savings goal</h2><form class="form" id="managedGoalForm"><label>Goal name<input name="name" required maxlength="80"></label><label>Target amount<input name="target" type="number" step="0.01" min="1" required></label><label>Type<select name="shared"><option value="false">Personal goal</option>${typeof isAdmin==='function'&&isAdmin()?'<option value="true">Shared family goal</option>':''}</select></label><div class="form-actions"><button class="primary">Create goal</button></div></form>`);
    qs('#managedGoalForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),shared=f.get('shared')==='true';const btn=e.target.querySelector('button');btn.disabled=true;btn.textContent='Creating…';const {error}=await sb.from('goals').insert({household_id:profile.household_id,user_id:shared?null:session.user.id,name:f.get('name'),target:Number(f.get('target')),current_amount:0,is_shared:shared});if(error){btn.disabled=false;btn.textContent='Create goal';return toast(error.message)}close();await loadData();if(typeof toast==='function')toast('Savings goal created.');};
  }

  function renderManagedGoals(){
    if(typeof goals==='undefined'||!session)return;
    const el=qs('#personalGoals');if(el){const list=goals.filter(g=>!g.is_shared&&g.user_id===session.user.id);el.innerHTML=list.length?list.map(goalCard2).join(''):'<p class="card-note">No personal savings goals yet.</p>';}
    const fam=qs('#familyGoals');if(fam&&typeof isAdmin==='function'&&isAdmin()){const list=goals.filter(g=>g.is_shared);fam.innerHTML=list.length?list.map(g=>goalRow2(g,true)).join(''):'<p class="card-note">No shared goals.</p>';}
    wireGoalButtons();
  }
  function goalCard2(g){const p=Math.min(100,Number(g.current_amount)/Math.max(1,Number(g.target))*100);return `<article class="goal-card"><p class="kicker">SAVINGS GOAL</p><h3>${esc2(g.name)}</h3><div class="goal-amount">${fmt2(g.current_amount)}</div><div class="goal-sub"><small>${fmt2(g.target)} target</small><small>${Math.round(p)}% complete</small></div><div class="progress"><i style="width:${p}%"></i></div><div class="goal-manage-actions"><button data-goal-action="contribute" data-goal-id="${g.id}">Contribute</button><button data-goal-action="edit" data-goal-id="${g.id}">Edit</button><button data-goal-action="delete" data-goal-id="${g.id}">Delete</button></div></article>`}
  function goalRow2(g,shared){const p=Math.min(100,Number(g.current_amount)/Math.max(1,Number(g.target))*100);return `<div class="goal-row"><div class="goal-top"><b>${esc2(g.name)}</b><span>${Math.round(p)}%</span></div><div class="progress"><i style="width:${p}%"></i></div><small>${fmt2(g.current_amount)} of ${fmt2(g.target)}</small>${shared?`<div class="goal-manage-actions"><button data-goal-action="contribute" data-goal-id="${g.id}">Contribute</button><button data-goal-action="edit" data-goal-id="${g.id}">Edit</button></div>`:''}</div>`}
  function wireGoalButtons(){qsa('[data-goal-action]').forEach(b=>b.onclick=async()=>{const g=goals.find(x=>x.id===b.dataset.goalId);if(!g)return;const action=b.dataset.goalAction;if(action==='delete'){if(!confirm(`Delete ${g.name}?`))return;const {error}=await sb.rpc('manage_homefund_goal',{p_goal_id:g.id,p_action:'delete',p_amount:null,p_name:null,p_target:null});if(error)return toast(error.message);await loadData();return toast('Goal deleted.');}if(action==='contribute'){const amount=prompt(`How much tracked savings do you want to contribute to ${g.name}?`);if(amount===null)return;const n=Number(amount);if(!n||n<=0)return toast('Enter a valid amount.');const {error}=await sb.rpc('manage_homefund_goal',{p_goal_id:g.id,p_action:'contribute',p_amount:n,p_name:null,p_target:null});if(error)return toast(error.message);await loadData();return toast('Contribution added.');}if(action==='edit'){modal(`<p class="kicker">SAVINGS GOAL</p><h2>Edit goal</h2><form id="editGoalForm" class="form"><label>Name<input name="name" required value="${esc2(g.name)}"></label><label>Target<input name="target" type="number" step=".01" min="1" required value="${Number(g.target)}"></label><div class="form-actions"><button class="primary">Save changes</button></div></form>`);qs('#editGoalForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const {error}=await sb.rpc('manage_homefund_goal',{p_goal_id:g.id,p_action:'edit',p_amount:null,p_name:f.get('name'),p_target:Number(f.get('target'))});if(error)return toast(error.message);close();await loadData();toast('Goal updated.');}}})}

  function renderBills2(){const el=qs('#billList');if(!el||typeof bills==='undefined')return;el.innerHTML=bills.length?bills.map(b=>`<div class="bill-upgraded"><div><b>${esc2(b.name)}</b><small>${esc2(b.frequency||'monthly')}</small><div class="bill-meta">${b.tag?`<span class="bill-tag">${esc2(b.tag)}</span>`:''}<span class="hf-status ${esc2(b.payment_status||'unpaid')}">${String(b.payment_status||'unpaid').replace('_',' ')}</span></div></div><div class="bill-right"><strong>${fmt2(b.amount)}</strong><div class="bill-manage-actions"><button data-edit-bill="${b.id}">Edit</button></div></div></div>`).join(''):'<p class="card-note">No bills yet.</p>';qsa('[data-edit-bill]').forEach(btn=>btn.onclick=()=>editBill(btn.dataset.editBill));}
  function addBill2(){modal(`<p class="kicker">BILLS & SUBSCRIPTIONS</p><h2>Add bill</h2><form id="bill2Form" class="form"><label>Name<input name="name" required></label><label>Amount<input name="amount" type="number" step=".01" min=".01" required></label><label>Frequency<select name="frequency"><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="yearly">Yearly</option></select></label><label>Tag<input name="tag" placeholder="Phone, Streaming, Utilities..."></label><label>Status<select name="status"><option value="unpaid">Unpaid</option><option value="half_paid">Half paid</option><option value="paid">Paid</option></select></label><div class="form-actions"><button class="primary">Save bill</button></div></form>`);qs('#bill2Form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const {error}=await sb.from('bills').insert({household_id:profile.household_id,user_id:session.user.id,name:f.get('name'),amount:Number(f.get('amount')),frequency:f.get('frequency'),tag:f.get('tag')||null,payment_status:f.get('status')||'unpaid'});if(error)return toast(error.message);close();await loadData();toast('Bill added.');}}
  function editBill(id){const b=bills.find(x=>x.id===id);if(!b)return;modal(`<p class="kicker">BILLS & SUBSCRIPTIONS</p><h2>Edit bill</h2><form id="editBillForm" class="form"><label>Name<input name="name" required value="${esc2(b.name)}"></label><label>Amount<input name="amount" type="number" step=".01" min=".01" required value="${Number(b.amount)}"></label><label>Frequency<select name="frequency"><option value="monthly" ${b.frequency==='monthly'?'selected':''}>Monthly</option><option value="weekly" ${b.frequency==='weekly'?'selected':''}>Weekly</option><option value="yearly" ${b.frequency==='yearly'?'selected':''}>Yearly</option></select></label><label>Tag<input name="tag" value="${esc2(b.tag||'')}"></label><label>Status<select name="status"><option value="unpaid" ${b.payment_status==='unpaid'?'selected':''}>Unpaid</option><option value="half_paid" ${b.payment_status==='half_paid'?'selected':''}>Half paid</option><option value="paid" ${b.payment_status==='paid'?'selected':''}>Paid</option></select></label><div class="form-actions"><button class="primary">Save changes</button></div></form>`);qs('#editBillForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const {error}=await sb.from('bills').update({name:f.get('name'),amount:Number(f.get('amount')),frequency:f.get('frequency'),tag:f.get('tag')||null,payment_status:f.get('status')}).eq('id',id).eq('user_id',session.user.id);if(error)return toast(error.message);close();await loadData();toast('Bill updated.');}}

  function paycheckPlanner2(){modal(`<p class="kicker">PAYCHECK PLANNER</p><h2>Plan a paycheck</h2><form id="payCalcForm" class="form"><label>Name<input name="name" value="Paycheck" required></label><label>Hours worked<input id="hfHours" name="hours" type="number" min="0" step=".01" required placeholder="14"></label><label>Hourly rate<input id="hfRate" name="rate" type="number" min="0" step=".01" required placeholder="14.00"></label><div class="pay-calc"><span>ESTIMATED GROSS PAY</span><strong id="hfGross">$0.00</strong></div><label>Pay date<input name="date" type="date" required></label><label>To Spending<input name="spending" type="number" step=".01" value="0"></label><label>To Savings<input name="savings" type="number" step=".01" value="0"></label><label>For Bills<input name="bills" type="number" step=".01" value="0"></label><label>For Goals<input name="goals" type="number" step=".01" value="0"></label><div class="form-actions"><button class="primary">Save paycheck plan</button></div></form>`);const calc=()=>qs('#hfGross').textContent=fmt2((Number(qs('#hfHours').value)||0)*(Number(qs('#hfRate').value)||0));qs('#hfHours').oninput=calc;qs('#hfRate').oninput=calc;qs('#payCalcForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),hours=Number(f.get('hours')),rate=Number(f.get('rate')),gross=+(hours*rate).toFixed(2);const {error}=await sb.from('paycheck_plans').insert({household_id:profile.household_id,user_id:session.user.id,name:f.get('name'),hours_worked:hours,hourly_rate:rate,expected_amount:gross,pay_date:f.get('date'),spending_amount:Number(f.get('spending'))||0,savings_amount:Number(f.get('savings'))||0,bills_amount:Number(f.get('bills'))||0,goals_amount:Number(f.get('goals'))||0});if(error)return toast(error.message);close();if(typeof load==='function')await load();toast(`Paycheck estimated at ${fmt2(gross)}.`);}}

  function enforceNationButtons(){const nation=typeof profile!=='undefined'&&profile?.display_name==='Nation'&&profile?.role==='owner';qsa('[data-review]').forEach(b=>{if(!nation)b.remove()});}

  function install(){
    if(typeof window.renderGoals==='function'&&!window.renderGoals.__hf2){const old=window.renderGoals;window.renderGoals=function(){old();setTimeout(renderManagedGoals,0)};window.renderGoals.__hf2=true;}
    if(typeof window.renderBills==='function'&&!window.renderBills.__hf2){window.renderBills=function(){renderBills2()};window.renderBills.__hf2=true;}
    const observer=new MutationObserver(()=>{if(enhancing)return;enhancing=true;queueMicrotask(()=>{renderManagedGoals();renderBills2();enforceNationButtons();enhancing=false})});observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',e=>{
      const action=e.target.closest('[data-action]');
      if(action&&['purchase','income'].includes(action.dataset.action)){e.preventDefault();e.stopImmediatePropagation();if(action.dataset.action==='purchase'&&typeof purchaseModal==='function')purchaseModal();if(action.dataset.action==='income'&&typeof incomeModal==='function')incomeModal();return;}
      if(e.target.closest('#newGoalBtn')){e.preventDefault();e.stopImmediatePropagation();newManagedGoal();return;}
      if(e.target.closest('#addBillBtn')){e.preventDefault();e.stopImmediatePropagation();addBill2();return;}
      if(e.target.closest('#addPaycheck')){e.preventDefault();e.stopImmediatePropagation();paycheckPlanner2();return;}
      if(e.target.closest('#printTransactionsBtn')){e.preventDefault();e.stopImmediatePropagation();downloadTransactionsPDF();return;}
      const review=e.target.closest('[data-review]');if(review){const nation=profile?.display_name==='Nation'&&profile?.role==='owner';if(!nation){e.preventDefault();e.stopImmediatePropagation();return toast('Only Nation can review purchase requests.')}e.preventDefault();e.stopImmediatePropagation();sb.rpc('review_homefund_purchase_request',{p_request_id:review.dataset.id,p_status:review.dataset.review}).then(async({error})=>{if(error)return toast(error.message);if(typeof load==='function')await load();toast(`Request ${review.dataset.review}.`)});}
    },true);
    setTimeout(()=>{renderManagedGoals();renderBills2();enforceNationButtons()},500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();