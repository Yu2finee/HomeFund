(()=>{
  const FAMILY_LOGIN_FUNCTION='homefund-family-login';

  async function familySignIn(e){
    e.preventDefault();
    const form=e.currentTarget;
    const f=new FormData(form);
    const username=String(f.get('username')||'').trim();
    const password=String(f.get('password')||'');
    const msg=document.getElementById('authMessage');
    const btn=form.querySelector('button[type="submit"],button.primary');
    if(msg) msg.textContent='Checking your HomeFund access…';
    if(btn){btn.disabled=true;btn.textContent='Signing in…';}
    try{
      const res=await fetch(`${SUPABASE_URL}/functions/v1/${FAMILY_LOGIN_FUNCTION}`,{
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},
        body:JSON.stringify({username,password})
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!data.email) throw new Error(data.error||'Invalid username or password');
      const {error}=await sb.auth.signInWithPassword({email:data.email,password});
      if(error) throw error;
      if(msg) msg.textContent='Signed in.';
    }catch(err){
      if(msg) msg.textContent=err?.message||'Could not sign in.';
    }finally{
      if(btn){btn.disabled=false;btn.textContent='Sign in';}
    }
  }

  function lockAuthScreen(){
    const gate=document.getElementById('authGate');
    if(!gate) return false;
    const card=gate.querySelector('.auth-card');
    if(!card) return false;
    card.innerHTML=`
      <p class="kicker">PRIVATE FAMILY ACCESS</p>
      <h1>Welcome to HomeFund</h1>
      <p>This HomeFund is limited to approved household members. Enter your family username and password.</p>
      <form id="signinForm" class="form auth-form">
        <label>Username<input name="username" required autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Username"></label>
        <label>Password<input type="password" name="password" required autocomplete="current-password" placeholder="Password"></label>
        <button type="submit" class="primary">Sign in</button>
      </form>
      <p id="authMessage" class="auth-message"></p>
      <div class="family-login-note"><b>HomeFund Family Access</b><span>Account creation is disabled. Only household-approved logins can access this site.</span></div>`;
    const form=document.getElementById('signinForm');
    if(form) form.onsubmit=familySignIn;
    return true;
  }

  // app.js builds the auth gate during boot. Patch it as soon as it appears.
  if(!lockAuthScreen()){
    const observer=new MutationObserver(()=>{
      if(lockAuthScreen()) observer.disconnect();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();