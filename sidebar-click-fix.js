(()=>{
const qa=s=>[...document.querySelectorAll(s)],q=s=>document.querySelector(s);
function go(btn){if(!btn)return;const page=btn.dataset.page,target=document.getElementById(page);if(!target)return;qa('.page').forEach(p=>p.classList.toggle('active',p===target));qa('.sidebar .nav').forEach(b=>b.classList.toggle('active',b===btn));const title=q('#pageTitle');if(title){let name=btn.querySelector('span')?.textContent?.trim()||page;if(name==='Requests')name='Purchase Requests';title.textContent=name}
 // Let feature pages refresh themselves after they become visible.
 try{btn.dispatchEvent(new CustomEvent('homefund:navigate',{bubbles:false}))}catch{}
 window.scrollTo(0,0);
}
function bind(){qa('.sidebar .nav[data-page]').forEach(btn=>{btn.disabled=false;btn.style.pointerEvents='auto';btn.style.cursor='pointer';btn.onpointerup=function(e){if(e.button!==undefined&&e.button!==0)return;e.preventDefault();go(this)};btn.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go(this)}}})}
// pointerup avoids the older click handlers that have been conflicting with the sidebar.
document.addEventListener('pointerup',e=>{const btn=e.target.closest?.('.sidebar .nav[data-page]');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();go(btn)},true);
const css=document.createElement('style');css.textContent=`.sidebar{pointer-events:auto!important;z-index:50!important}.sidebar nav,.sidebar nav *{pointer-events:auto!important}.sidebar nav .nav,.sidebar nav .nav span{font-family:Arial,Helvetica,sans-serif!important;font-size:13px!important;font-weight:500!important;letter-spacing:0!important;line-height:1.2!important}.sidebar nav .nav.active,.sidebar nav .nav.active span{font-weight:700!important}.hf-nav-divider,.hf-nav-divider *{pointer-events:none!important}.sidebar nav .nav{position:relative!important;z-index:2!important}`;document.head.appendChild(css);
new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});window.addEventListener('load',()=>setTimeout(bind,500));setTimeout(bind,100);
})();