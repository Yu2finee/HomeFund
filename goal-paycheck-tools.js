(()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n)||0);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function installPaycheckOverride(){
    const btn=$('#addPaycheck');
    if(!btn||btn.dataset.hourlyBound==='1')return;
    btn.dataset.hourlyBound='1';
    btn.onclick=()=>openPaycheckPlanner();
  }

  function openPaycheckPlanner(){
    if(typeof modal!=='function')return;
    modal(`<p class="kicker">PAYCHECK PLANNER</p><h2>Plan a paycheck</h2><p class="card-note">Enter your hours and hourly rate. HomeFund calculates the estimated gross pay automatically.</p><form id="hourlyPaycheckForm" class="form"><label>Paycheck name<input name="name" value="Paycheck" required></label><div class="hf-two-col"><label>Hours worked<input id="hfHoursWorked" name="hours" type="number" min="0" step="0.01" placeholder="14" required></label><label>Hourly rate<input id="hfHourlyRate" name="rate" type="number" min="0" step="0.01" placeholder="14.00" required></label></div><div class="hf-pay-preview"><span>ESTIMATED GROSS PAY</span><strong id="hfPayGross">$0.00</strong><small id="hfPayFormula">0 hrs × $0.00/hr</small></div><label>Pay date<input name="date" type="date" required></label><div class="hf-two-col"><label>Plan for Spending<input name="spending" type="number" min="0" step="0.01" value="0"></label><label>Plan for Savings<input name="savings" type="number" min="0" step="0.01" value="0"></label><label>Plan for Bills<input name="bills" type="number" min="0" step="0.01" value="0"></label><label>Plan for Goals<input name="goals" type="number" min="0" step="0.01" value="0"></label></div><div class="hf-allocation-note" id="hfAllocationNote">Unallocated: $0.00</div><div class="form-actions"><button class="primary">Save paycheck plan</button></div></form>`);
    const hours=$('#hfHoursWorked'),rate=$('#hfHourlyRate'),gross=$('#hfPayGross'),formula=$('#hfPayFormula'),form=$('#hourlyPaycheckForm'),note=$('#hfAllocationNote');
    const recalc=()=>{const h=Number(hours.value)||0,r=Number(rate.value)||0,g=+(h*r).toFixed(2);gross.textContent=fmt(g);formula.textContent=`${h} hrs × ${fmt(r)}/hr`;const f=new FormData(form),allocated=['spending','savings','bills','goals'].reduce((a,k)=>a+(Number(f.get(k))||0),0),left=+(g-allocated).toFixed(2);note.textContent=`${left>=0?'Unallocated':'Over-allocated'}: ${fmt(Math.abs(left))}`;note.classList.toggle('over',left<0);};
    form.addEventListener('input',recalc);recalc();
    form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form),h=Number(f.get('hours')),r=Number(f.get('rate')),g=+(h*r).toFixed(2),allocated=['spending','savings','bills','goals'].reduce((a,k)=>a+(Number(f.get(k))||0),0);if(allocated>g+.001)return toast('Your planned allocations are more than the estimated paycheck.');const submit=form.querySelector('button');submit.disabled=true;submit.textContent='Saving…';const {error}=await sb.from('paycheck_plans').insert({household_id:profile.household_id,user_id:session.user.id,name:f.get('name'),hours_worked:h,hourly_rate:r,expected_amount:g,pay_date:f.get('date'),spending_amount:Number(f.get('spending'))||0,savings_amount:Number(f.get('savings'))||0,bills_amount:Number(f.get('bills'))||0,goals_amount:Number(f.get('goals'))||0});if(error){submit.disabled=false;submit.textContent='Save paycheck plan';return toast(error.message)}close();if(typeof load==='function')await load();toast(`Paycheck planned: ${fmt(g)}`);};
  }

  function goalFromTarget(target){
    const card=target.closest('#personalGoals .goal-card');
    if(card){const name=card.querySelector('h3')?.textContent?.trim();return goals.find(g=>!g.is_shared&&g.user_id===session?.user?.id&&g.name===name);}
    const row=target.closest('#familyGoals .goal-row');
    if(row){const name=row.querySelector('b')?.textContent?.trim();return goals.find(g=>g.is_shared&&g.name===name);}
    return null;
  }

  function openGoalManager(g){
    if(!g||typeof modal!=='function')return;
    const percent=Math.min(100,Number(g.current_amount||0)/Math.max(1,Number(g.target))*100);
    modal(`<p class="kicker">SAVINGS GOAL</p><h2>${esc(g.name)}</h2><div class="hf-goal-manager"><div class="hf-goal-balance"><span>SAVED SO FAR</span><strong>${fmt(g.current_amount)}</strong><small>Target ${fmt(g.target)} · ${Math.round(percent)}% complete</small><div class="progress"><i style="width:${percent}%"></i></div></div><div class="hf-goal-actions"><button class="primary" id="hfGoalAdd">＋ Add Money</button><button class="secondary" id="hfGoalEdit">Edit Goal</button><button class="secondary" id="hfGoalSet">Set Saved Amount</button><button class="hf-danger" id="hfGoalDelete">Delete Goal</button></div></div>`);
    $('#hfGoalAdd').onclick=()=>goalAdd(g);$('#hfGoalEdit').onclick=()=>goalEdit(g);$('#hfGoalSet').onclick=()=>goalSet(g);$('#hfGoalDelete').onclick=()=>goalDelete(g);
  }

  function goalAdd(g){modal(`<p class="kicker">${g.is_shared?'FAMILY FUND':'SAVINGS GOAL'}</p><h2>Add money to ${esc(g.name)}</h2><form id="hfGoalAddForm" class="form"><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required></label><div class="form-actions"><button class="primary">Add money</button></div></form>`);$('#hfGoalAddForm').onsubmit=async e=>{e.preventDefault();const amount=Number(new FormData(e.target).get('amount'));const {error}=await sb.rpc('add_to_homefund_goal',{p_goal_id:g.id,p_amount:amount});if(error)return toast(error.message);close();await loadData();if(typeof load==='function')await load();toast(`${fmt(amount)} added to ${g.name}.`);};}

  function goalEdit(g){modal(`<p class="kicker">SAVINGS GOAL</p><h2>Edit goal</h2><form id="hfGoalEditForm" class="form"><label>Name<input name="name" value="${esc(g.name)}" required></label><label>Target amount<input name="target" type="number" min="1" step="0.01" value="${Number(g.target)}" required></label><div class="form-actions"><button class="primary">Save changes</button></div></form>`);$('#hfGoalEditForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const {error}=await sb.rpc('manage_homefund_goal',{p_goal_id:g.id,p_action:'edit',p_amount:null,p_name:f.get('name'),p_target:Number(f.get('target'))});if(error)return toast(error.message);close();await loadData();toast('Savings goal updated.');};}

  function goalSet(g){modal(`<p class="kicker">SAVINGS GOAL</p><h2>Set saved amount</h2><p class="card-note">Use this if HomeFund needs to match how much you actually have saved toward this goal.</p><form id="hfGoalSetForm" class="form"><label>Current saved amount<input name="amount" type="number" min="0" step="0.01" value="${Number(g.current_amount||0)}" required></label><div class="form-actions"><button class="primary">Update amount</button></div></form>`);$('#hfGoalSetForm').onsubmit=async e=>{e.preventDefault();const amount=Number(new FormData(e.target).get('amount'));const {error}=await sb.from('goals').update({current_amount:amount}).eq('id',g.id);if(error)return toast(error.message);close();await loadData();toast('Saved amount updated.');};}

  async function goalDelete(g){if(!confirm(`Delete ${g.name}?`))return;const {error}=await sb.rpc('manage_homefund_goal',{p_goal_id:g.id,p_action:'delete',p_amount:null,p_name:null,p_target:null});if(error)return toast(error.message);close();await loadData();toast('Savings goal deleted.');}

  function wireGoalClicking(){
    ['#personalGoals','#familyGoals'].forEach(sel=>{const el=$(sel);if(!el||el.dataset.goalClickBound==='1')return;el.dataset.goalClickBound='1';el.addEventListener('click',e=>{if(e.target.closest('button,a,input,select'))return;const g=goalFromTarget(e.target);if(g)openGoalManager(g);});});
  }

  function refreshEnhancements(){installPaycheckOverride();wireGoalClicking();$$('#personalGoals .goal-card,#familyGoals .goal-row').forEach(el=>{el.classList.add('hf-clickable-goal');el.title='Click to manage this savings goal';});}
  const observer=new MutationObserver(refreshEnhancements);observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshEnhancements);else refreshEnhancements();
})();