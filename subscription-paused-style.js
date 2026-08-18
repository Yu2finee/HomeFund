(()=>{
const style=document.createElement('style');
style.textContent=`
#subscriptionList .subscription-row.hf-sub.paused,
#subscriptionList .subscription-row.paused{
  position:relative!important;
  overflow:hidden!important;
  opacity:1!important;
  background:linear-gradient(135deg,#fff5f5 0%,#ffe2e5 100%)!important;
  border:2px solid #dc3545!important;
  border-radius:14px!important;
  box-shadow:0 8px 22px rgba(220,53,69,.13)!important;
  padding:18px 14px!important;
  margin:10px 0!important;
}
#subscriptionList .subscription-row.paused .sub-logo{
  background:#dc3545!important;
  color:#fff!important;
}
#subscriptionList .subscription-row.paused .sub-main b,
#subscriptionList .subscription-row.paused .sub-price strong{
  color:#8f1f2c!important;
}
#subscriptionList .subscription-row.paused .sub-main small,
#subscriptionList .subscription-row.paused .sub-price small{
  color:#a0444f!important;
}
#subscriptionList .subscription-row.paused .paused-stamp{
  display:block!important;
  position:absolute!important;
  right:20px!important;
  top:50%!important;
  transform:translateY(-50%) rotate(-9deg)!important;
  z-index:1!important;
  font-size:32px!important;
  line-height:1!important;
  font-weight:1000!important;
  letter-spacing:.12em!important;
  color:rgba(190,25,42,.16)!important;
  border:4px solid rgba(190,25,42,.16)!important;
  border-radius:8px!important;
  padding:7px 12px!important;
  pointer-events:none!important;
  user-select:none!important;
  text-transform:uppercase!important;
}
#subscriptionList .subscription-row.paused .sub-logo,
#subscriptionList .subscription-row.paused .sub-main,
#subscriptionList .subscription-row.paused .sub-price,
#subscriptionList .subscription-row.paused .row-actions{
  position:relative!important;
  z-index:2!important;
}
#subscriptionList .subscription-row.paused [data-repair-sub-toggle],
#subscriptionList .subscription-row.paused [data-sub-toggle]{
  background:#dc3545!important;
  border-color:#dc3545!important;
  color:#fff!important;
  font-weight:800!important;
}
@media(max-width:700px){
  #subscriptionList .subscription-row.paused .paused-stamp{
    font-size:23px!important;
    right:10px!important;
    top:24px!important;
    transform:rotate(-8deg)!important;
  }
}
`;
document.head.appendChild(style);
function ensureStamps(){document.querySelectorAll('#subscriptionList .subscription-row.paused').forEach(row=>{if(!row.querySelector('.paused-stamp')){const stamp=document.createElement('div');stamp.className='paused-stamp';stamp.textContent='PAUSED';row.prepend(stamp)}})}
const obs=new MutationObserver(ensureStamps);obs.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('load',()=>setTimeout(ensureStamps,1000));
})();