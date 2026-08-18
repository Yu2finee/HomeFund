(()=>{
const qa=s=>[...document.querySelectorAll(s)],q=s=>document.querySelector(s);
function go(btn){if(!btn)return;const page=btn.dataset.page,target=document.getElementById(page);if(!target)return;qa('.page').forEach(p=>p.classList.toggle('active',p===target));qa('.sidebar .nav').forEach(b=>b.classList.toggle('active',b===btn));const title=q('#pageTitle');if(title){let name=btn.querySelector('span')?.textContent?.trim()||page;if(name==='Requests')name='Purchase Requests';title.textContent=name}
 try{btn.dispatchEvent(new CustomEvent('homefund:navigate',{bubbles:false}))}catch{}
 const main=document.querySelector('main');if(main&&typeof main.scrollTo==='function')main.scrollTo({top:0,behavior:'auto'});
}
function prep(){qa('.sidebar .nav[data-page]').forEach(btn=>{btn.disabled=false;btn.style.pointerEvents='auto';btn.style.cursor='pointer'})}
// One delegated handler is enough for both existing and dynamically-added sidebar buttons.
document.addEventListener('pointerup',e=>{const btn=e.target.closest?.('.sidebar .nav[data-page]');if(!btn)return;if(e.button!==undefined&&e.button!==0)return;e.preventDefault();e.stopPropagation();go(btn)},true);
document.addEventListener('keydown',e=>{const btn=e.target.closest?.('.sidebar .nav[data-page]');if(!btn)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();go(btn)}},true);
const css=document.createElement('style');css.textContent=`.sidebar{pointer-events:auto!important;z-index:50!important}.sidebar nav,.sidebar nav *{pointer-events:auto!important}.sidebar nav .nav,.sidebar nav .nav span{font-family:Arial,Helvetica,sans-serif!important;font-size:13px!important;font-weight:500!important;letter-spacing:0!important;line-height:1.2!important}.sidebar nav .nav.active,.sidebar nav .nav.active span{font-weight:700!important}.hf-nav-divider,.hf-nav-divider *{pointer-events:none!important}.sidebar nav .nav{position:relative!important;z-index:2!important}`;document.head.appendChild(css);
[100,600,1400,2800].forEach(ms=>setTimeout(prep,ms));window.addEventListener('load',()=>setTimeout(prep,500));
})();