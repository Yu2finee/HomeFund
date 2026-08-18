(()=>{
  const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n)||0);
  const dateFmt=d=>new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const monthName=()=>new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'});

  function memberName(){return (typeof profile!=='undefined'&&profile?.display_name)||'HomeFund Member'}
  function accountLast4(){try{return (typeof myAccount==='function'&&myAccount('spending')?.last4)||'----'}catch{return '----'}}

  function buildStatement({title,subtitle,summary,rows,columns}){
    const generated=new Date().toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
    const tableHead=columns.map(c=>`<th class="${c.align||''}">${escapeHtml(c.label)}</th>`).join('');
    const tableRows=rows.length?rows.map(r=>`<tr>${columns.map(c=>`<td class="${c.align||''}">${c.render(r)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${columns.length}" class="empty">No records available for this statement.</td></tr>`;
    const summaryHtml=summary.map(x=>`<div class="summary-box"><span>${escapeHtml(x.label)}</span><strong>${escapeHtml(x.value)}</strong></div>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)} - HomeFund</title><style>
      @page{size:letter;margin:.45in}*{box-sizing:border-box}body{margin:0;background:#eef2f6;color:#172033;font-family:Arial,Helvetica,sans-serif}.sheet{width:100%;max-width:8.5in;margin:20px auto;background:#fff;min-height:10in;padding:34px 38px;box-shadow:0 12px 35px #071b3320}.top{display:flex;justify-content:space-between;gap:24px;padding-bottom:24px;border-bottom:3px solid #071b33}.logo{font-size:20px;font-weight:800;letter-spacing:.13em;color:#071b33}.logo small{display:block;font-size:8px;letter-spacing:.14em;color:#778397;margin-top:5px}.statement-title{text-align:right}.statement-title h1{font-family:Georgia,serif;margin:0;font-size:25px}.statement-title p{margin:6px 0 0;color:#6c7889;font-size:10px}.identity{display:flex;justify-content:space-between;gap:25px;padding:20px 0}.identity b{display:block;font-size:12px}.identity span{font-size:9px;color:#778397;line-height:1.5}.summary{display:grid;grid-template-columns:repeat(${Math.min(summary.length,4)},1fr);gap:9px;margin:6px 0 24px}.summary-box{border:1px solid #dce3eb;background:#f8fafc;border-radius:8px;padding:12px}.summary-box span{display:block;color:#778397;font-size:8px;font-weight:700;letter-spacing:.08em}.summary-box strong{display:block;margin-top:7px;font-size:15px;color:#071b33}h2{font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 10px;color:#071b33}table{width:100%;border-collapse:collapse;font-size:9px}th{text-align:left;padding:9px 8px;background:#071b33;color:#fff;font-size:8px;letter-spacing:.05em}td{padding:9px 8px;border-bottom:1px solid #e7ebf0;vertical-align:top}.right{text-align:right}.muted{color:#758195;font-size:8px}.amount-pos{color:#087a55;font-weight:700}.amount-neg{color:#172033;font-weight:700}.empty{text-align:center;color:#778397;padding:26px}.footer{margin-top:28px;padding-top:14px;border-top:1px solid #dce3eb;display:flex;justify-content:space-between;gap:20px;color:#778397;font-size:7.5px;line-height:1.5}.badge{display:inline-block;border:1px solid #c9d5e2;border-radius:999px;padding:4px 7px;font-size:7px;color:#516175;background:#f8fafc}.actions{position:fixed;right:20px;top:20px;display:flex;gap:8px}.actions button{border:0;border-radius:8px;padding:10px 13px;font-weight:700;cursor:pointer}.print{background:#071b33;color:white}.download{background:white;color:#071b33;border:1px solid #cbd6e1!important}@media print{body{background:#fff}.sheet{box-shadow:none;margin:0;max-width:none;min-height:auto;padding:0}.actions{display:none}}
    </style></head><body><div class="actions"><button class="download" onclick="downloadCopy()">Download copy</button><button class="print" onclick="window.print()">Print / Save PDF</button></div><main class="sheet"><div class="top"><div class="logo">HOMEFUND<small>FAMILY FINANCIAL HUB</small></div><div class="statement-title"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div></div><div class="identity"><div><span>STATEMENT FOR</span><b>${escapeHtml(memberName())}</b><span>HomeFund Spending ••${escapeHtml(accountLast4())}</span></div><div style="text-align:right"><span>STATEMENT PERIOD</span><b>${escapeHtml(monthName())}</b><span>Generated ${escapeHtml(generated)}</span></div></div><div class="summary">${summaryHtml}</div><h2>Statement Detail</h2><table><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table><div class="footer"><div><b>HOMEFUND</b><br>Private household finance tracking</div><div style="text-align:right">This document is generated from manually tracked HomeFund records.<br><span class="badge">NOT A BANK STATEMENT • NO REAL FUNDS HELD</span></div></div></main><script>function downloadCopy(){const b=new Blob([document.documentElement.outerHTML],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='${title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${new Date().toISOString().slice(0,10)}.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}</script></body></html>`;
  }

  function openDoc(html){const w=window.open('','_blank');if(!w){alert('Please allow pop-ups for HomeFund to open the statement.');return}w.document.open();w.document.write(html);w.document.close();}

  function transactionStatement(){
    const list=(typeof myTx==='function'?myTx():[]).filter(t=>{const d=new Date(t.created_at);const n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()});
    const income=list.filter(t=>t.type==='income').reduce((a,t)=>a+Number(t.amount),0);
    const purchases=list.filter(t=>t.type==='expense').reduce((a,t)=>a+Number(t.amount),0);
    const transfers=list.filter(t=>String(t.type).startsWith('transfer')).reduce((a,t)=>a+Number(t.amount),0);
    const spend=typeof myAccount==='function'?myAccount('spending'):null;
    openDoc(buildStatement({title:'Transaction Statement',subtitle:'Monthly account activity',summary:[{label:'CURRENT BALANCE',value:fmt(spend?.balance)},{label:'INCOME',value:fmt(income)},{label:'PURCHASES',value:fmt(purchases)},{label:'TRANSFERS',value:fmt(transfers)}],rows:list,columns:[{label:'Date',render:r=>dateFmt(r.created_at)},{label:'Description',render:r=>`<b>${escapeHtml(r.merchant)}</b><div class="muted">${escapeHtml(r.category||'Other')}${r.note?' • '+escapeHtml(r.note):''}</div>`},{label:'Type',render:r=>escapeHtml(String(r.type||'').replaceAll('_',' '))},{label:'Amount',align:'right',render:r=>`<span class="${r.type==='income'?'amount-pos':'amount-neg'}">${r.type==='income'?'+':'−'}${fmt(r.amount)}</span>`}]}));
  }

  function billsStatement(){
    const list=(typeof bills!=='undefined'?bills:[]).slice();
    const monthly=list.reduce((a,b)=>{const amount=Number(b.amount)||0;const f=String(b.frequency||'monthly').toLowerCase();return a+(f==='yearly'?amount/12:f==='weekly'?amount*52/12:amount)},0);
    const annual=monthly*12;
    openDoc(buildStatement({title:'Bills & Subscriptions Statement',subtitle:'Recurring expense overview',summary:[{label:'ACTIVE ITEMS',value:String(list.length)},{label:'EST. MONTHLY',value:fmt(monthly)},{label:'EST. ANNUAL',value:fmt(annual)}],rows:list,columns:[{label:'Bill / Subscription',render:r=>`<b>${escapeHtml(r.name)}</b>`},{label:'Frequency',render:r=>escapeHtml(r.frequency||'Monthly')},{label:'Amount',align:'right',render:r=>`<span class="amount-neg">${fmt(r.amount)}</span>`},{label:'Estimated Annual',align:'right',render:r=>{const a=Number(r.amount)||0,f=String(r.frequency||'monthly').toLowerCase();return fmt(f==='yearly'?a:f==='weekly'?a*52:a*12)}}]}));
  }

  function addButtons(){
    const tx=$('#transactions .section-title.row>div:last-child');
    if(tx&&!document.getElementById('printTransactionsBtn')) tx.insertAdjacentHTML('afterbegin','<button class="secondary" id="printTransactionsBtn">▤ Print / Download Statement</button> ');
    const billsTitle=$('#bills .section-title.row>div:last-child')||$('#bills .section-title.row');
    if(billsTitle&&!document.getElementById('printBillsBtn')){
      const btn=document.createElement('button');btn.className='secondary';btn.id='printBillsBtn';btn.textContent='▤ Print / Download Statement';
      if(billsTitle.matches('.section-title.row')) billsTitle.appendChild(btn); else billsTitle.prepend(btn);
    }
    $('#printTransactionsBtn')?.addEventListener('click',transactionStatement);
    $('#printBillsBtn')?.addEventListener('click',billsStatement);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addButtons);else addButtons();
})();