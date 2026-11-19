/* ---------- Multi-User Auth Gate & Session Controller ---------- */
let authMode='login';
let resetState={email:'',code:'',sent:false};

function updateUserChip(){
  const nm=$('#userNameDisp'),em=$('#userEmailDisp');
  if(nm&&currentUser)nm.textContent=(state.profile&&state.profile.name)||currentUser.name||'User';
  if(em&&currentUser)em.textContent=currentUser.email;
}

function loginUser(user,isNewAccount){
  currentUser=user;
  try{localStorage.setItem(SESS_KEY,user.email);}catch(e){}
  loadUserData(user);
  $('#authRoot').hidden=true;
  $('#appShell').hidden=false;
  updateUserChip();
  setSync();
  route();
  if(isNewAccount||!state.profile.onboarded){
    openOnboardingModal(1);
  }
}

function logoutUser(){
  if(focus)finishFocus(false);
  currentUser=null;
  try{localStorage.removeItem(SESS_KEY);}catch(e){}
  $('#modalRoot').innerHTML='';
  $('#appShell').hidden=true;
  $('#authRoot').hidden=false;
  authMode='login';
  renderAuthScreen();
  toast('Logged out. Your data is safely stored in your private account.');
}

function renderAuthScreen(){
  const root=$('#authRoot');if(!root)return;
  const accs=Object.values(loadAccounts());
  let formHtml='';

  if(authMode==='login'){
    formHtml=`
      <div>
        <p class="eyebrow">Private Multi-User Life OS</p>
        <h1 style="margin-top:4px">Sign in to Life Lock In</h1>
        <p class="hint">Each account keeps its own private data, app integrations, meal plan, ventures, and preferences.</p>
      </div>
      <form class="stack" id="loginForm" style="gap:12px">
        <div>
          <label class="lab" for="authEmail">Username (Email Address)</label>
          <input type="email" id="authEmail" placeholder="you@example.com" required autocomplete="username">
        </div>
        <div>
          <div class="hd">
            <label class="lab" for="authPass">Password</label>
            <button class="btn sm link" type="button" id="goResetBtn">Forgot password?</button>
          </div>
          <input type="password" id="authPass" placeholder="Enter your password" required autocomplete="current-password">
        </div>
        <button class="btn solid" type="submit">Sign In to My Experience</button>
      </form>
      <div class="sec">
        <div class="hd">
          <span class="hint small">New to Life Lock In? Start fresh with guided setup:</span>
          <button class="btn sm sun" type="button" id="goSignupBtn">Create New Account</button>
        </div>
      </div>
      ${accs.length?`
        <div class="sec">
          <span class="lab">Saved Profiles on This Device (Isolated Data)</span>
          <div class="stack" style="gap:6px">
            ${accs.map(a=>`
              <div class="card soft" style="padding:10px 12px">
                <div class="hd">
                  <div>
                    <b>${esc(a.name)}</b> ${a.isFounder?'<span class="tag sun">Founder Preset</span>':'<span class="tag">Personal</span>'}
                    <p class="hint small mono">${esc(a.email)}</p>
                  </div>
                  <button class="btn sm" type="button" data-quick-email="${esc(a.email)}">${a.isFounder?'1-Click Founder Login':'Select'}</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `:''}`;
  } else if(authMode==='signup'){
    formHtml=`
      <div>
        <p class="eyebrow">Start From Scratch · Guided Personalization</p>
        <h1 style="margin-top:4px">Create Your Account</h1>
        <p class="hint">Your new account starts completely fresh with unlinked app connectors and launches a 6-module wizard to customize your dishes, workouts, business ideas, and activities.</p>
      </div>
      <form class="stack" id="signupForm" style="gap:12px">
        <div>
          <label class="lab" for="regName">Your First Name</label>
          <input type="text" id="regName" placeholder="e.g., Alex" required>
        </div>
        <div>
          <label class="lab" for="regEmail">Username (Email Address)</label>
          <input type="email" id="regEmail" placeholder="alex@example.com" required autocomplete="username">
        </div>
        <div>
          <label class="lab" for="regPass">Create Password (min 4 chars)</label>
          <input type="password" id="regPass" placeholder="Create a password" required autocomplete="new-password">
        </div>
        <button class="btn solid" type="submit">Create Account &amp; Start Personalization →</button>
      </form>
      <div class="sec">
        <button class="btn sm link" type="button" id="backLoginBtn">← Already have an account? Sign In</button>
      </div>`;
  } else {
    formHtml=`
      <div>
        <p class="eyebrow">Account Recovery</p>
        <h1 style="margin-top:4px">Reset Password via Email</h1>
        <p class="hint">Enter your account email address to send a 6-digit recovery code to your email and set a new password.</p>
      </div>
      <form class="stack" id="resetReqForm" style="gap:10px">
        <div>
          <label class="lab" for="rstEmail">Account Email Address</label>
          <div class="inline">
            <input type="email" id="rstEmail" value="${esc(resetState.email)}" placeholder="you@example.com" required>
            <button class="btn sm solid" type="submit">Send Reset Code</button>
          </div>
        </div>
      </form>
      ${resetState.sent?`
        <div class="card sun">
          <p class="small"><b>Recovery Email Prepared for ${esc(resetState.email)}</b></p>
          <p class="hint small">In this browser-hosted app, your 6-digit recovery token is <b class="mono">${esc(resetState.code)}</b>. You can also dispatch it to your inbox below:</p>
          <div class="row">
            <a class="btn sm" href="mailto:${encodeURIComponent(resetState.email)}?subject=${encodeURIComponent('Life Lock In Password Reset Code: '+resetState.code)}&body=${encodeURIComponent('Your Life Lock In OS 6-digit password reset code is: '+resetState.code)}">Open in Apple Mail ↗</a>
            <a class="btn sm" href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(resetState.email)}&su=${encodeURIComponent('Life Lock In Password Reset Code: '+resetState.code)}&body=${encodeURIComponent('Your Life Lock In OS 6-digit password reset code is: '+resetState.code)}" target="_blank" rel="noopener">Send via Gmail ↗</a>
          </div>
        </div>
        <form class="stack" id="resetConfirmForm" style="gap:10px">
          <div>
            <label class="lab" for="rstCodeIn">Enter 6-Digit Recovery Code</label>
            <input type="text" id="rstCodeIn" value="${esc(resetState.code)}" placeholder="6-digit code" required>
          </div>
          <div>
            <label class="lab" for="rstNewPass">New Password</label>
            <input type="password" id="rstNewPass" placeholder="Enter new password" required>
          </div>
          <button class="btn solid" type="submit">Verify Code &amp; Update Password</button>
        </form>
      `:''}
      <div class="sec">
        <button class="btn sm link" type="button" id="backLoginBtn">← Back to Sign In</button>
      </div>`;
  }

  root.innerHTML=`
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-lockup">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <linearGradient id="authCoralSlate" x1="20%" y1="10%" x2="85%" y2="85%">
                <stop offset="0%" stop-color="#F08B6D"/>
                <stop offset="55%" stop-color="#E87A5D"/>
                <stop offset="100%" stop-color="#5B677A"/>
              </linearGradient>
              <linearGradient id="authWarmCoral" x1="15%" y1="0%" x2="80%" y2="95%">
                <stop offset="0%" stop-color="#F28E71"/>
                <stop offset="65%" stop-color="#E87A5D"/>
                <stop offset="100%" stop-color="#B56A63"/>
              </linearGradient>
              <linearGradient id="authSlateBlue" x1="25%" y1="15%" x2="85%" y2="95%">
                <stop offset="0%" stop-color="#8C6D68"/>
                <stop offset="45%" stop-color="#58677B"/>
                <stop offset="100%" stop-color="#4A607A"/>
              </linearGradient>
            </defs>
            <path d="M126 39 C139 43 151 48 161 53 C162 72 160 91 154 108" fill="none" stroke="url(#authSlateBlue)" stroke-width="11.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M62 46 C53 49 45 51 39 54 C38 86 45 117 65 137 C83 153 113 149 126 128 C135 114 132 94 118 83" fill="none" stroke="url(#authCoralSlate)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M124 72 C124 47 121 25 100 25 C79 25 75 48 75 72 C75 96 61 112 76 129" fill="none" stroke="url(#authWarmCoral)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M68 96 C73 74 97 64 119 72 C141 80 151 106 141 131 C134 147 121 159 106 167" fill="none" stroke="url(#authSlateBlue)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M63 151 C72 162 82 171 93 178" fill="none" stroke="#4A607A" stroke-width="11" stroke-linecap="round"/>
            <path d="M104 159 L104 185 M104 175 L116 175 M118 175 C127 169 136 160 143 150" fill="none" stroke="#4A607A" stroke-width="10.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="100" cy="98" r="8.5" fill="#E87A5D"/>
            <path d="M95.5 103 L92.5 121 C92.2 122.8 93.6 124.5 95.5 124.5 L104.5 124.5 C106.4 124.5 107.8 122.8 107.5 121 L104.5 103 Z" fill="#E87A5D"/>
          </svg>
          <div>
            <b class="wordmark">LIFE LOCK IN</b>
            <small>The Adaptive Path · Chief of Staff &amp; Life OS</small>
          </div>
        </div>
        ${formHtml}
      </div>
    </div>`;

  const goSignup=$('#goSignupBtn');
  if(goSignup)goSignup.onclick=()=>{authMode='signup';renderAuthScreen();};
  const goReset=$('#goResetBtn');
  if(goReset)goReset.onclick=()=>{
    const emEl=$('#authEmail');
    if(emEl&&emEl.value)resetState.email=emEl.value.trim().toLowerCase();
    authMode='reset';renderAuthScreen();
  };
  const backLogin=$('#backLoginBtn');
  if(backLogin)backLogin.onclick=()=>{authMode='login';resetState.sent=false;renderAuthScreen();};

  root.querySelectorAll('[data-quick-email]').forEach(btn=>{
    btn.onclick=()=>{
      const em=btn.dataset.quickEmail;
      const acc=loadAccounts()[em];
      if(!acc)return;
      if(acc.isFounder){
        loginUser(acc,false);
        toast('Signed in to Matt’s Palm Springs Founder Account.');
      } else {
        const emIn=$('#authEmail'),pIn=$('#authPass');
        if(emIn)emIn.value=em;
        if(pIn)pIn.focus();
        toast('Enter password for '+em+' (or click Forgot password).');
      }
    };
  });

  const loginForm=$('#loginForm');
  if(loginForm)loginForm.onsubmit=e=>{
    e.preventDefault();
    const em=$('#authEmail').value.trim().toLowerCase();
    const pw=$('#authPass').value;
    const accs=loadAccounts();
    const acc=accs[em];
    if(!acc){toast('No account found for '+em+'. Click "Create New Account" below.');return;}
    if(acc.passHash!==simpleHash(pw)&&!(acc.isFounder&&pw==='steady')){
      toast('Incorrect password. Try again or click "Forgot password?".');
      return;
    }
    loginUser(acc,false);
    toast('Welcome back, '+acc.name+'!');
  };

  const signupForm=$('#signupForm');
  if(signupForm)signupForm.onsubmit=e=>{
    e.preventDefault();
    const nm=$('#regName').value.trim();
    const em=$('#regEmail').value.trim().toLowerCase();
    const pw=$('#regPass').value;
    if(pw.length<4){toast('Please choose a password with at least 4 characters.');return;}
    const accs=loadAccounts();
    if(accs[em]){toast('An account with '+em+' already exists. Please sign in.');authMode='login';renderAuthScreen();return;}
    const newUser={email:em,name:nm||em.split('@')[0],passHash:simpleHash(pw),isFounder:false,createdAt:Date.now()};
    accs[em]=newUser;
    saveAccounts(accs);
    // Initialize fresh state for this user
    const fresh=freshUserDefaults(em,newUser.name);
    localStorage.setItem('steady.user.'+em,JSON.stringify(fresh));
    loginUser(newUser,true);
    toast('Account created! Complete the 6 modules to personalize your Life Lock In OS.');
  };

  const resetReqForm=$('#resetReqForm');
  if(resetReqForm)resetReqForm.onsubmit=e=>{
    e.preventDefault();
    const em=$('#rstEmail').value.trim().toLowerCase();
    const accs=loadAccounts();
    if(!accs[em]){toast('No account registered under '+em+'.');return;}
    resetState.email=em;
    resetState.code=String(Math.floor(100000+Math.random()*900000));
    resetState.sent=true;
    renderAuthScreen();
    toast('Recovery code generated for '+em+'.');
  };

  const resetConfirmForm=$('#resetConfirmForm');
  if(resetConfirmForm)resetConfirmForm.onsubmit=e=>{
    e.preventDefault();
    const code=$('#rstCodeIn').value.trim();
    const newPw=$('#rstNewPass').value;
    if(code!==resetState.code){toast('Invalid 6-digit recovery code.');return;}
    if(newPw.length<4){toast('New password must be at least 4 characters.');return;}
    const accs=loadAccounts();
    const acc=accs[resetState.email];
    if(!acc)return;
    acc.passHash=simpleHash(newPw);
    saveAccounts(accs);
    resetState={email:'',code:'',sent:false};
    loginUser(acc,false);
    toast('Password updated! You are now signed in.');
  };
}

/* ---------- Views ---------- */
let VIEW='today';

function viewToday(){
  const k=dkey(),ck=state.checks[k]||{};
  const todayDayIdx=new Date().getDay();
  const dayList=buildDaySchedule(selectedDayIdx);
  const doneN=dayList.filter(s=>ck[s.id]).length,pct=dayList.length?Math.round(doneN/dayList.length*100):0;
  const n=slotNow(),cur=n.cur,b=getBig3(k),mDone=(state.morningDone[k]||{}).done;
  const prof=state.profile||{},pTarget=prof.proteinTarget||180,wTarget=prof.waterTarget||10;
  const prot=state.protein[k]||0,wat=state.water[k]||0,soc=state.social[k]||0;
  const lastMsg=state.messages.slice().reverse().find(m=>m.from!=='you');
  const ds=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});

  const guideBanner=prof.showGuide?`
    <div class="card" style="margin-bottom:18px;border-color:var(--accent)">
      <div class="hd">
        <div>
          <p class="eyebrow">App Guidance · Getting Started with Life Lock In</p>
          <h2>Welcome to your personal Chief of Staff${prof.name?', '+esc(prof.name):''}</h2>
        </div>
        <div class="row">
          <button class="btn sm solid" data-act="open-wizard">Customize Modules (1–6)</button>
          <button class="btn sm" data-act="dismiss-guide">Got It ✓</button>
        </div>
      </div>
      <div class="grid-3" style="gap:10px">
        <div class="card soft" style="padding:10px"><b>1. Morning Ignition</b><p class="hint small">Tap "Morning Ignition" every morning for your reaffirmation, 60s breathing, reflection &amp; #1 priority.</p></div>
        <div class="card soft" style="padding:10px"><b>2. 3-Dot (⋯) Block Menu</b><p class="hint small">Click <b>⋯</b> on any activity block to edit content, change days/frequency (e.g. no weekend stock trading), share events, or block personal obligations.</p></div>
        <div class="card soft" style="padding:10px"><b>3. Edit Preferences</b><p class="hint small">Visit <b>Preferences</b> anytime to update your favorite dishes, workouts, ventures, or sports.</p></div>
      </div>
    </div>`:'';

  const morningGateBanner=!mDone?`
    <div class="card sun" style="margin-bottom:18px">
      <div class="hd">
        <div>
          <p class="eyebrow">Spark · Morning Gate Required</p>
          <h2>Start with your 3-Minute Morning Ignition</h2>
          <p class="hint">Reaffirmation, self-reflection, 60s breathing, and your #1 priority before markets or feeds.</p>
        </div>
        <button class="btn sun" data-act="open-morning">Start Morning Ritual</button>
      </div>
    </div>`:'';

  const curAgName=(AG[cur.agent]&&AG[cur.agent].name)||'Life Lock In';
  const nowCard=`
    <section class="card accent">
      <div class="hd">
        <p class="eyebrow">${n.before?'Starts at ':'Right Now · '}${fmtMin(slotMin(cur))}</p>
        <div class="row">
          <span class="agent-pill">${esc(curAgName)}</span>
          <button class="btn sm ghost-accent" type="button" data-act="slot-menu" data-id="${cur.id}" title="Edit, Frequency &amp; Share">⋯ Options</button>
        </div>
      </div>
      <h2>${esc(cur.title)}</h2>
      <p>${esc(cur.detail)}</p>
      <div class="row">
        <button class="btn on-accent" data-act="slot" data-id="${cur.id}">${ck[cur.id]?'Completed ✓ (Undo)':'Mark Step Done'}</button>
        <button class="btn ghost-accent" data-act="focus-start" data-min="25">Start 25m Focus</button>
        <button class="btn ghost-accent" data-act="focus-start" data-min="50">50m Deep Block</button>
      </div>
      ${n.next?`<p class="small" style="opacity:.88">Up next at ${fmtMin(slotMin(n.next))}: <b>${esc(n.next.title)}</b></p>`:''}
    </section>`;

  const big3Card=`
    <section class="card">
      <div class="hd"><h3>Today’s Big 3 Outcomes</h3><span class="tag">Anchor + Launch</span></div>
      <ul class="big3">
        ${b.map((x,i)=>`<li class="${x.done?'done':''}"><label class="chk"><input type="checkbox" data-field="big3d" data-i="${i}" ${x.done?'checked':''}></label><input type="text" data-field="big3" data-i="${i}" value="${esc(x.t)}" placeholder="${i===0?'#1 Revenue / Venture / Career move':'Outcome #'+(i+1)}"></li>`).join('')}
      </ul>
    </section>`;

  const focusAndParking=`
    <section class="card">
      <div class="hd"><h3>Focus Timer &amp; Distraction Parking Lot</h3><span class="tag">Shield</span></div>
      ${focus?`
        <div class="clock" id="clock">${fmtClock(focus.end-Date.now())}</div>
        <p class="hint">Single-task mode. Do not switch tabs—park stray thoughts below.</p>
        <div class="row"><button class="btn" data-act="focus-end">Finish / Log Minutes</button></div>
      `:`
        <div class="row">
          <button class="btn solid sm" data-act="focus-start" data-min="25">25m Sprint</button>
          <button class="btn sm" data-act="focus-start" data-min="45">45m Deep</button>
          <button class="btn sm" data-act="focus-start" data-min="15">15m Ignition</button>
          <span class="hint">Focused today: <b class="mono">${state.focus[k]||0} min</b></span>
        </div>
      `}
      <form class="inline" data-form="park" style="margin-top:6px">
        <input type="text" id="parkIn" placeholder="Brain dump a distraction, deal idea, or errand for later…" autocomplete="off">
        <button class="btn sm" type="submit">Park It</button>
      </form>
      ${state.parking.length?`<ul class="list">${state.parking.slice(-5).reverse().map(p=>`<li><div>${esc(p.t)}</div><button class="btn sm link" data-act="park-del" data-id="${p.id}">Clear</button></li>`).join('')}</ul>`:'<p class="hint small">Parking lot is clear.</p>'}
    </section>`;

  const pulseMetrics=`
    <section class="card">
      <div class="hd"><h3>Daily Discipline Pulse</h3><button class="btn sm link" data-act="open-morning">${mDone?'Morning Ritual ✓':'Morning Ritual'}</button></div>
      <div class="grid-3" style="gap:12px">
        <div class="card soft" style="padding:12px">
          <span class="lab">Protein (Goal ${pTarget}g)</span>
          <p class="stat">${prot}g</p>
          <div class="row"><button class="btn sm" data-act="prot" data-n="30">+30g</button><button class="btn sm" data-act="prot" data-n="50">+50g</button></div>
        </div>
        <div class="card soft" style="padding:12px">
          <span class="lab">Hydration (Glasses)</span>
          <p class="stat">${wat} <small>/ ${wTarget}</small></p>
          <div class="row"><button class="btn sm" data-act="water" data-n="1">+1 Glass</button><button class="btn sm" data-act="water" data-n="-1">−1</button></div>
        </div>
        <div class="card soft" style="padding:12px">
          <span class="lab">Social Media (${state.budget}m cap)</span>
          <p class="stat">${soc}m</p>
          <div class="row"><button class="btn sm" data-act="social" data-n="5">+5m</button><button class="btn sm" data-act="social" data-n="15">+15m</button></div>
        </div>
      </div>
    </section>`;

  const chiefCard=`
    <section class="card">
      <div class="hd">
        <div><p class="eyebrow">Chief of Staff</p><h2>Executive Summary &amp; Quick Commands</h2></div>
        <a class="btn sm" href="#chief">Full Chat</a>
      </div>
      <p style="white-space:pre-wrap" class="hint">${esc(clip(lastMsg?lastMsg.t:'Tap any command below and Chief will coordinate your 8 agents.',360))}</p>
      <div class="row">
        <button class="btn solid sm" data-act="quick" data-q="morning">Morning Brief</button>
        <button class="btn sm" data-act="quick" data-q="stuck">I’m Stuck</button>
        <button class="btn sm" data-act="quick" data-q="trade">Market Check</button>
        <button class="btn sm" data-act="quick" data-q="evening">Evening Debrief</button>
      </div>
    </section>`;

  const timelineCard=`
    <section class="card">
      <div class="hd">
        <div>
          <h3>${DAY_NAMES[selectedDayIdx]}${selectedDayIdx===todayDayIdx?' (Today)':''} Wake-to-Bed Schedule (${doneN}/${dayList.length})</h3>
          <p class="hint small">Tap <b>⋯</b> on any block to edit, change frequency/days, move (auto-fills gaps), or share.</p>
        </div>
        <div class="row">
          <button class="btn sm sun" type="button" data-act="block-time">+ Block Personal Obligation</button>
          <button class="btn sm link" data-act="shift" data-n="-15">−15m</button>
          <button class="btn sm link" data-act="shift" data-n="15">+15m</button>
          <button class="btn sm" data-act="export-ics">Sync (.ics)</button>
        </div>
      </div>
      <div class="day-bar" role="tablist" aria-label="View schedule by day of week">
        ${DAY_NAMES.map((dn,i)=>`<button type="button" class="${i===selectedDayIdx?'on':''}" data-act="select-day" data-day="${i}">${dn}${i===todayDayIdx?' •':''}</button>`).join('')}
      </div>
      <div class="bar good"><i style="width:${pct}%"></i></div>
      <ol class="tl">
        ${dayList.map(s=>{
          const isCur=(selectedDayIdx===todayDayIdx)&&!n.before&&s.id===cur.id;
          const agName=(AG[s.agent]&&AG[s.agent].name)||'Life Lock In';
          const freqStr=fmtFreq(s.days,s.specificDate);
          const rowCls=[ck[s.id]?'done':'',isCur?'cur':'',s.isObligation?'ob':'',s.isAutoFill?'autofill':''].filter(Boolean).join(' ');
          return `<li class="${rowCls}">
            <span class="t">${fmtMin(slotMin(s)).replace(' am','a').replace(' pm','p')}${s.dur?`<br><small class="hint" style="font-size:10px">${s.dur}m</small>`:''}</span>
            <div>
              <div class="ttl">
                <span>${esc(s.title)}</span>
                ${s.isObligation?'<span class="tag sun">Personal Obligation</span>':`<span class="tag">${esc(agName)}</span>`}
                ${s.isAutoFill?'<span class="tag good">Auto-Filled Gap</span>':''}
                ${freqStr!=='Daily' && !s.isAutoFill?`<span class="freq-pill">${esc(freqStr)}</span>`:''}
                ${isCur?'<span class="flag">NOW</span>':''}
              </div>
              <p class="det">${esc(s.detail)}</p>
            </div>
            <div class="tl-ctrl">
              <label class="chk"><input type="checkbox" data-field="slot" data-id="${s.id}" ${ck[s.id]?'checked':''}></label>
              <button class="dots-btn" type="button" data-act="slot-menu" data-id="${s.id}" title="Edit content, modify day/frequency, or share event" aria-label="Options for ${esc(s.title)}">⋯</button>
            </div>
          </li>`;
        }).join('')}
      </ol>
      <div class="hd" style="padding-top:6px">
        <button class="btn sm" type="button" data-act="add-custom-slot">+ Add Activity Block</button>
        <button class="btn sm link" type="button" data-act="reset-slots">Reset Default Schedule</button>
      </div>
    </section>`;

  const tasksAndWins=`
    <section class="card">
      <div class="hd"><h3>Active Agent Tasks (${state.tasks.filter(t=>!t.done).length})</h3><button class="btn sm link" data-act="tasks-clear">Clear Done</button></div>
      ${state.tasks.length?`<ul class="list">${state.tasks.slice(-7).reverse().map(t=>`<li><label class="chk"><input type="checkbox" data-field="task" data-id="${t.id}" ${t.done?'checked':''}></label><div style="${t.done?'text-decoration:line-through;color:var(--ink-2)':''}"><span class="tag">${esc((AG[t.agent]||AG.chief).name)}</span> ${esc(t.title)}</div></li>`).join('')}</ul>`:'<p class="hint small">Tap "Morning Brief" above to have Chief issue today’s agent tasks.</p>'}
      <div class="sec">
        <h3>Win Log &amp; Momentum</h3>
        <form class="inline" data-form="win">
          <input type="text" placeholder="Log a win (shipped an offer, hit workout, great family moment)…" autocomplete="off">
          <button class="btn sm solid" type="submit">Log Win</button>
        </form>
        ${state.wins.length?`<ul class="list" style="margin-top:6px">${state.wins.slice(-4).reverse().map(w=>`<li><div>✓ ${esc(w.t)}</div><span class="hint small mono">${esc(w.d.slice(5))}</span></li>`).join('')}</ul>`:''}
      </div>
    </section>`;

  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">${esc(ds)}${prof.city?' · '+esc(prof.city):''} · ${esc(prof.programPack||'Life Lock In OS')}</p>
        <h1>${esc(prof.name?prof.name+'’s ':'')}Life Lock In Command Center</h1>
      </div>
      <div class="row">
        <button class="btn sun" data-act="open-morning">Morning Ignition</button>
        <button class="btn" data-act="block-time">+ Block Obligation</button>
        <button class="btn" data-act="open-wizard">Personalize</button>
        <button class="btn" data-act="export-ics">Add to Calendar</button>
      </div>
    </header>
    ${guideBanner}
    ${morningGateBanner}
    <div class="grid-2">
      <div class="stack">${nowCard}${big3Card}${pulseMetrics}${timelineCard}</div>
      <div class="stack">${chiefCard}${focusAndParking}${tasksAndWins}</div>
    </div>`;
}

function viewChief(){
  const chips=Object.keys(QUICK).map(k=>`<button class="chip" data-act="quick" data-q="${k}">${esc(QUICK[k].label)}</button>`).join('');
  const msgs=state.messages,prof=state.profile||{};
  return `
    <header class="page-head">
      <div><p class="eyebrow">Chief of Staff · Central Orchestrator</p><h1>Command &amp; Daily Briefings</h1></div>
      <button class="btn sm" data-act="clear-chat">Clear History</button>
    </header>
    <div class="chips">${chips}</div>
    <div class="thread" id="thread">
      ${!msgs.length?`<div class="msg bot"><p class="meta">Chief · Ready</p><p class="body">Hello ${esc(prof.name||'friend')}. I am your Chief of Staff (${esc(prof.programPack||'Life Lock In OS')}). I coordinate your 8 specialist agents:\n• Anchor (Structure & Shield) · Spark (Morning Mindset) · Body (Workouts & ${prof.proteinTarget||180}g Protein Meals)\n• Ticker (Morning Stock Trades) · Scout (Deals & Reseller Flips) · Wrench (Home & Auto DIY)\n• Launch (Ventures & Outreach) · Circle (Family & ${(prof.favoriteSports||[]).slice(0,3).join(', ')||'Sports'})\n\nTap a command chip above or tell me what’s on your mind.</p></div>`:''}
      ${msgs.map(m=>{
        const you=m.from==='you',who=you?'You':'Chief of Staff';
        return `<div class="msg ${you?'you':'bot'}"><p class="meta">${esc(who)} · ${esc(clockOf(m.ts))}</p><div class="body">${esc(m.t)}</div>${m.tasks&&m.tasks.length?`<div class="issued"><b>Tasks Issued:</b> ${m.tasks.map(t=>`<span class="tag">${esc(AG[t.agent].name)}</span> ${esc(t.title)}`).join(' · ')}</div>`:''}</div>`;
      }).join('')}
    </div>
    <form class="card" data-form="chat" style="max-width:820px">
      <label class="lab" for="chatIn">Message Chief of Staff</label>
      <textarea id="chatIn" rows="2" placeholder="Ask Chief to plan your next 90 minutes, evaluate a trade/flip, or adjust your schedule…"></textarea>
      <div class="hd">
        <span class="hint small">Chief automatically issues tasks to the right specialist agents.</span>
        <button class="btn solid" type="submit">Send to Chief</button>
      </div>
    </form>`;
}

function viewBody(){
  const k=dkey(),prof=state.profile||{},pTarget=prof.proteinTarget||180;
  const prot=state.protein[k]||0,wDone=state.workoutDone[k]||{};
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const recs=activeRecipes();
  const shopMap={'Meat & Seafood':[],'Dairy & Eggs':[],'Produce':[],'Pantry':[]};
  const seen={};
  days.forEach(d=>{
    const r=recs.find(x=>x.id===state.mealPlan[d])||RECIPES.find(x=>x.id===state.mealPlan[d])||recs[0];
    if(r&&r.ingredients){
      r.ingredients.forEach(ing=>{
        if(!seen[ing.item]){
          seen[ing.item]=true;
          (shopMap[ing.cat]=shopMap[ing.cat]||[]).push(ing.item);
        }
      });
    }
  });
  state.customGroceries.forEach(g=>{
    if(!seen[g]){seen[g]=true;shopMap['Pantry'].push(g);}
  });

  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">Body Agent · ${esc(prof.workoutStyle||'Fitness')} &amp; ${esc(prof.dietStyle||'High-Protein Nutrition')}</p>
        <h1>Workouts, High-Protein Meals &amp; Shopping List</h1>
      </div>
      <div class="row">
        <span class="tag good">Today’s Protein: ${prot}g / ${pTarget}g</span>
        <button class="btn sm solid" data-act="prot" data-n="40">+40g Protein Shake/Meal</button>
        <a class="btn sm" href="#prefs">Edit Favorite Dishes</a>
      </div>
    </header>
    ${domainIntegrationsBar('body',[
      {svc:'gsheets',op:'WRITE',key:'gsheets_grocery',label:'Google Sheets: Sync Weekly Grocery List'},
      {svc:'youtube_ios',op:'WRITE',key:'ios_reminders_push',label:'Apple Reminders: Push Grocery Checklist'},
      {svc:'imessage',op:'WRITE',key:'imessage_wife',label:'Apple Messages: Text Partner Tonight’s Recipe'}
    ])}
    <div class="grid-2">
      <div class="stack">
        <section class="card">
          <div class="hd"><h3>Forced Daily Workouts &amp; Wellbeing Resets</h3><span class="tag">${esc(prof.workoutStyle||'Body')}</span></div>
          ${WORKOUTS.map(w=>`
            <div class="card soft">
              <div class="hd">
                <div><b>${esc(w.name)}</b><p class="hint small">${esc(w.focus)}</p></div>
                <button class="btn sm ${wDone[w.id]?'solid':''}" data-act="workout-toggle" data-id="${w.id}">${wDone[w.id]?'Completed ✓':'Mark Done'}</button>
              </div>
              <ul class="list">${w.blocks.map(b=>`<li><div>• ${esc(b)}</div></li>`).join('')}</ul>
            </div>
          `).join('')}
        </section>

        <section class="card">
          <div class="hd"><h3>Weekly High-Protein Meal Plan</h3><span class="hint small">Populated from your Favorite Dishes</span></div>
          <table class="tbl">
            <thead><tr><th>Day</th><th>Selected High-Protein Recipe</th><th>Protein</th></tr></thead>
            <tbody>
              ${days.map(d=>{
                const curR=recs.find(r=>r.id===state.mealPlan[d])||RECIPES.find(r=>r.id===state.mealPlan[d])||recs[0];
                return `<tr>
                  <td><b>${d}</b></td>
                  <td>
                    <select data-field="meal-day" data-day="${d}">
                      ${recs.map(r=>`<option value="${r.id}" ${r.id===curR.id?'selected':''}>${esc(r.name)} (${r.protein}g)</option>`).join('')}
                    </select>
                  </td>
                  <td class="mono"><b>${curR.protein}g</b></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </section>

        <section class="card">
          <div class="hd"><h3>Your Active High-Protein Recipes (${recs.length})</h3><a class="btn sm link" href="#prefs">+ Add/Manage Favorites</a></div>
          ${recs.map(r=>`
            <details class="sec" style="padding-top:10px">
              <summary style="cursor:pointer;font-weight:600">${esc(r.name)} — <span class="tag good">${r.protein}g protein</span> <span class="hint small">(${r.cals||550} kcal · ${r.prep||'15 min'})</span></summary>
              <p class="hint" style="margin:8px 0">${esc(r.steps||'')}</p>
              <p class="small"><b>Ingredients:</b> ${(r.ingredients||[]).map(i=>esc(i.item)).join(' · ')}</p>
            </details>
          `).join('')}
        </section>
      </div>

      <div class="stack">
        <section class="card">
          <div class="hd">
            <div><h3>Weekly Grocery Shopping List</h3><p class="hint small">Auto-built from your Weekly Meal Plan above</p></div>
            <button class="btn sm" data-act="copy-grocery">Copy List</button>
          </div>
          <form class="inline" data-form="grocery">
            <input type="text" placeholder="Add extra grocery item (e.g., Sparkling water, kids snacks)…" autocomplete="off">
            <button class="btn sm" type="submit">Add</button>
          </form>
          ${Object.keys(shopMap).map(cat=>`
            <div>
              <span class="lab">${esc(cat)}</span>
              <ul class="list">
                ${shopMap[cat].map(item=>{
                  const ck=!!state.groceryChecked[item];
                  return `<li>
                    <label class="chk" style="min-height:30px;min-width:30px"><input type="checkbox" data-field="groc-chk" data-item="${esc(item)}" ${ck?'checked':''}></label>
                    <div style="${ck?'text-decoration:line-through;color:var(--ink-2)':''}">${esc(item)}</div>
                  </li>`;
                }).join('')}
              </ul>
            </div>
          `).join('')}
          <button class="btn sm link" data-act="clear-grocery-checks">Uncheck All for Next Week</button>
        </section>
      </div>
    </div>`;
}

function viewMarkets(){
  const k=dkey(),rules=state.tradeRules;
  const todayTrades=state.trades.filter(t=>t.date===k);
  const todayPnl=todayTrades.reduce((a,t)=>a+(+t.pnl||0),0);
  const totalPnl=state.trades.reduce((a,t)=>a+(+t.pnl||0),0);
  const allChecked=rules.checklist.every(Boolean);

  return `
    <header class="page-head">
      <div><p class="eyebrow">Ticker Agent · Morning Trading Desk (Hard Stop: ${esc(rules.stopTime)} AM)</p><h1>Stock Market Insights &amp; Trade Discipline</h1></div>
      <div class="row">
        <span class="tag ${todayPnl>=0?'good':'crit'}">Today P&amp;L: $${todayPnl}</span>
        <span class="tag">Total Logged: $${totalPnl}</span>
      </div>
    </header>
    ${domainIntegrationsBar('ticker',[
      {svc:'gsheets',op:'WRITE',key:'gsheets_trades',label:'Google Sheets: Sync Morning Trade Journal & P&L'},
      {svc:'gcalendar',op:'WRITE',key:'gcal_push_now',label:'Google Calendar: Lock Morning Market Window'}
    ])}
    <div class="grid-2">
      <div class="stack">
        <section class="card sun">
          <div class="hd"><h3>Pre-Trade Impulse Gate</h3><span class="tag sun">Hard Stop: ${esc(rules.stopTime)} AM</span></div>
          <p class="hint">Check all 3 boxes before entering any morning trade so you trade setups—not dopamine:</p>
          <label class="row" style="cursor:pointer"><input type="checkbox" data-field="tr-chk" data-i="0" ${rules.checklist[0]?'checked':''}> <span><b>1. Setup &amp; Catalyst:</b> Clear support/resistance level + volume (not chasing green candles).</span></label>
          <label class="row" style="cursor:pointer"><input type="checkbox" data-field="tr-chk" data-i="1" ${rules.checklist[1]?'checked':''}> <span><b>2. Defined Risk:</b> Hard stop-loss is set inside my $${rules.maxLoss} daily max loss limit.</span></label>
          <label class="row" style="cursor:pointer"><input type="checkbox" data-field="tr-chk" data-i="2" ${rules.checklist[2]?'checked':''}> <span><b>3. Time Window:</b> It is before ${esc(rules.stopTime)} AM and I have taken fewer than ${rules.maxTrades} trades today (${todayTrades.length}/${rules.maxTrades} used).</span></label>
          <p class="small"><b>Status:</b> ${allChecked?'<span class="tag good">Cleared to Execute A+ Setup</span>':'<span class="tag crit">DO NOT TRADE YET — Complete Checklist</span>'}</p>
        </section>

        <section class="card">
          <div class="hd"><h3>Morning Watchlist &amp; Catalysts</h3></div>
          <ul class="list">
            ${state.watchlist.map(w=>`
              <li>
                <div>
                  <b>${esc(w.sym)}</b> <span class="tag">${esc(w.bias)}</span> · <span class="mono small">${esc(w.level)}</span>
                  <p class="hint small">${esc(w.note)}</p>
                </div>
                <div class="row">
                  <a class="btn sm link" href="https://www.tradingview.com/chart/?symbol=${ encodeURIComponent(w.sym) }" target="_blank" rel="noopener">Chart ↗</a>
                  <button class="btn sm link" data-act="watch-del" data-id="${w.id}">×</button>
                </div>
              </li>
            `).join('')}
          </ul>
          <form class="grid-3" data-form="watch" style="gap:8px;margin-top:8px">
            <input type="text" name="sym" placeholder="Ticker (e.g. AAPL)" required>
            <input type="text" name="level" placeholder="Key level / trigger" required>
            <div class="inline"><input type="text" name="note" placeholder="Catalyst / thesis"><button class="btn sm solid" type="submit">Add</button></div>
          </form>
        </section>
      </div>

      <div class="stack">
        <section class="card">
          <h3>Log a Morning Trade</h3>
          <form class="grid-3" data-form="trade" style="gap:8px">
            <input type="text" name="sym" placeholder="Ticker (e.g. NVDA)" required>
            <input type="number" name="pnl" placeholder="Net P&L $ (e.g. 150 or -80)" required>
            <div class="inline"><input type="text" name="setup" placeholder="Setup / lesson learned" required><button class="btn sm solid" type="submit">Log</button></div>
          </form>
          <table class="tbl" style="margin-top:10px">
            <thead><tr><th>Date</th><th>Ticker</th><th>Setup &amp; Notes</th><th>P&amp;L</th></tr></thead>
            <tbody>
              ${state.trades.slice().reverse().map(t=>`
                <tr>
                  <td class="mono small">${esc(t.date.slice(5))}</td>
                  <td><b>${esc(t.sym)}</b></td>
                  <td class="small">${esc(t.setup)}</td>
                  <td class="mono"><span class="tag ${(+t.pnl)>=0?'good':'crit'}">${(+t.pnl)>=0?'+$'+t.pnl:'-$'+Math.abs(t.pnl)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
      </div>
    </div>`;
}

function viewDeals(){
  const totalProfit=state.flips.reduce((a,f)=>a+((+f.sell||0)-(+f.buy||0)-(+f.fees||0)),0);
  const city=(state.profile&&state.profile.city)||'Local';
  return `
    <header class="page-head">
      <div><p class="eyebrow">Scout Agent · Deal Hunter, Arbitrage &amp; Reseller Engine</p><h1>Marketplaces, Liquidators &amp; Flip Tracker</h1></div>
      <div class="row">
        <span class="tag good">Pipeline Net Profit: $${totalProfit}</span>
        <button class="btn sm solid" data-act="focus-start" data-min="30">Start 30m Deal-Hunt Timer</button>
      </div>
    </header>
    ${domainIntegrationsBar('scout',[
      {svc:'facebook',op:'READ',key:'fb_marketplace_read',label:'Facebook Marketplace: Scan Local Deals'},
      {svc:'facebook',op:'WRITE',key:'fb_listing_write',label:'Facebook Marketplace: Generate & Copy Listing'},
      {svc:'gsheets',op:'MODIFY',key:'gsheets_flips',label:'Google Sheets: Sync Reseller Flip Ledger'},
      {svc:'gmail',op:'READ',key:'gmail_read_deals',label:'Gmail: Scan Slickdeals & Liquidator Alerts'}
    ])}
    <div class="grid-2">
      <div class="stack">
        <section class="card">
          <div class="hd"><h3>Target Deal Watchlist &amp; 1-Click Marketplace Launchers</h3><span class="tag">${esc(city)} + Online</span></div>
          <p class="hint small">Click any marketplace below a target item to search live listings immediately without mindless browsing.</p>
          ${state.hunts.length?`<ul class="list">
            ${state.hunts.map(h=>{
              const q=encodeURIComponent(h.item);
              const estMargin=h.estSell>0?(h.estSell-h.maxBuy):0;
              return `<li>
                <div>
                  <b>${esc(h.item)}</b> <span class="tag">${esc(h.purpose)}</span>
                  <p class="hint small">Max Buy: <b class="mono">$${h.maxBuy}</b> ${h.estSell?`· Target Resale: <b class="mono">$${h.estSell}</b> (Est. +$${estMargin})`:''}</p>
                  <div class="row" style="margin-top:6px">
                    <a class="btn sm" href="https://www.facebook.com/marketplace/search/?query=${q}" target="_blank" rel="noopener">FB Marketplace ↗</a>
                    <a class="btn sm" href="https://offerup.com/search?q=${q}" target="_blank" rel="noopener">OfferUp ↗</a>
                    <a class="btn sm" href="https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener">eBay Sold Comps ↗</a>
                    <a class="btn sm" href="https://slickdeals.net/newsearch.php?q=${q}" target="_blank" rel="noopener">Slickdeals ↗</a>
                    <button class="btn sm link" data-act="hunt-del" data-id="${h.id}">Remove</button>
                  </div>
                </div>
              </li>`;
            }).join('')}
          </ul>`:'<p class="hint small">Add your first product to hunt below.</p>'}
          <form class="grid-3" data-form="hunt" style="gap:8px;margin-top:8px">
            <input type="text" name="item" placeholder="Product to hunt (e.g. Espresso Machine, Golf Cart)" required>
            <input type="number" name="maxBuy" placeholder="Max buy price ($)" required>
            <div class="inline"><input type="number" name="estSell" placeholder="Est resale $ (0 if personal)"><button class="btn sm solid" type="submit">Add Target</button></div>
          </form>
        </section>

        <section class="card">
          <h3>Quick Wholesale Liquidators &amp; Arbitrage Portals</h3>
          <div class="row">
            <a class="btn sm" href="https://bstock.com/" target="_blank" rel="noopener">B-Stock Supply (Reseller Lots) ↗</a>
            <a class="btn sm" href="https://www.liquidation.com/" target="_blank" rel="noopener">Liquidation.com ↗</a>
            <a class="btn sm" href="https://slickdeals.net/" target="_blank" rel="noopener">Slickdeals Frontpage ↗</a>
            <a class="btn sm" href="https://www.bulq.com/" target="_blank" rel="noopener">BULQ Wholesale ↗</a>
          </div>
        </section>
      </div>

      <div class="stack">
        <section class="card">
          <h3>Reseller Flip &amp; Affiliate ROI Calculator + Inventory</h3>
          <form class="grid-3" data-form="flip" style="gap:8px">
            <input type="text" name="item" placeholder="Item / Affiliate Product" required>
            <input type="number" name="buy" placeholder="Buy Cost ($)" required>
            <input type="number" name="fees" placeholder="Fees/Ship ($)" value="25" required>
            <input type="number" name="sell" placeholder="Target Sell ($)" required>
            <select name="status"><option>Sourced / Prep</option><option>Listed (FB + eBay)</option><option>Sold</option></select>
            <button class="btn sm solid" type="submit">Add Flip</button>
          </form>
          <table class="tbl" style="margin-top:10px">
            <thead><tr><th>Item</th><th>Buy+Fees</th><th>Sell</th><th>Net / ROI</th><th>Status</th></tr></thead>
            <tbody>
              ${state.flips.map(f=>{
                const cost=(+f.buy||0)+(+f.fees||0),net=(+f.sell||0)-cost,roi=cost>0?Math.round(net/cost*100):100;
                return `<tr>
                  <td><b>${esc(f.item)}</b></td>
                  <td class="mono">$${cost}</td>
                  <td class="mono">$${f.sell}</td>
                  <td class="mono"><span class="tag ${net>0?'good':'crit'}">+$${net} (${roi}%)</span></td>
                  <td><button class="btn sm link" data-act="flip-cycle" data-id="${f.id}">${esc(f.status)}</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </section>
      </div>
    </div>`;
}

function viewDiy(){
  const totalSaved=state.projects.reduce((a,p)=>a+(+p.estSave||0),0);
  return `
    <header class="page-head">
      <div><p class="eyebrow">Wrench Agent · Home &amp; Auto Maintenance Guides</p><h1>DIY Projects (AI + YouTube Step-by-Step)</h1></div>
      <span class="tag good">Sweat Equity Saved: $${totalSaved}</span>
    </header>
    ${domainIntegrationsBar('wrench',[
      {svc:'gdocs',op:'MODIFY',key:'gdocs_diy_sop',label:'Google Docs: Export DIY Repair SOP & Parts List'},
      {svc:'youtube_ios',op:'WRITE',key:'ios_reminders_push',label:'iOS Reminders: Push Hardware/Auto Store Parts List'}
    ])}
    <div class="grid-2">
      <div class="stack">
        ${state.projects.length?state.projects.map(p=>`
          <section class="card">
            <div class="hd">
              <div><span class="tag">${esc(p.cat)}</span> <span class="tag good">Saves ~$${p.estSave}</span><h2 style="margin-top:6px">${esc(p.title)}</h2></div>
              <a class="btn sm solid" href="https://www.youtube.com/results?search_query=${encodeURIComponent(p.ytQuery||p.title)}" target="_blank" rel="noopener">Watch YouTube Guide ↗</a>
            </div>
            <p class="hint small"><b>Tools &amp; Parts Needed:</b> ${esc(p.parts)}</p>
            <ul class="list">
              ${p.steps.map((s,idx)=>`
                <li>
                  <label class="chk" style="min-height:32px;min-width:32px"><input type="checkbox" data-field="diy-step" data-pid="${p.id}" data-idx="${idx}" ${s.done?'checked':''}></label>
                  <div style="${s.done?'text-decoration:line-through;color:var(--ink-2)':''}">${esc(s.t)}</div>
                </li>
              `).join('')}
            </ul>
            <form class="inline" data-form="diy-step-add" data-pid="${p.id}">
              <input type="text" placeholder="Add next repair/maintenance step…" autocomplete="off">
              <button class="btn sm" type="submit">Add Step</button>
            </form>
          </section>`).join(''):'<section class="card"><p class="hint">No DIY projects yet. Create your first home or car maintenance guide on the right.</p></section>'}
      </div>
      <div class="stack">
        <section class="card">
          <h3>Create New Home or Car DIY Project</h3>
          <p class="hint small">Wrench structures your project with a parts checklist and direct YouTube video search so you never stall mid-repair.</p>
          <form class="stack" data-form="diy-new" style="gap:10px">
            <div><label class="lab">Project Title</label><input type="text" name="title" placeholder="e.g., Replace Kitchen Disposal or Brake Pads" required></div>
            <div class="grid-2 equal" style="gap:10px">
              <div><label class="lab">Category</label><select name="cat"><option>Home Maintenance</option><option>Auto Maintenance</option><option>Yard / Pool</option><option>Garage / Build</option></select></div>
              <div><label class="lab">Est. Savings vs. Pro ($)</label><input type="number" name="save" placeholder="200" required></div>
            </div>
            <div><label class="lab">Tools &amp; Parts Required</label><input type="text" name="parts" placeholder="List sockets, replacement parts, sealant…" required></div>
            <div><label class="lab">First 3 Steps (comma-separated)</label><input type="text" name="steps" placeholder="Turn off breaker/water, remove mounting ring, install new unit" required></div>
            <button class="btn solid" type="submit">Create DIY Guide</button>
          </form>
        </section>
      </div>
    </div>`;
}

function viewLaunch(){
  const w=week(),g=+state.bridge.goal||0,e=+state.bridge.earned||0,pct=g?Math.min(100,Math.round(e/g*100)):0;
  const stages=['Idea','Validate','Offer','Launch','Revenue'];
  const prof=state.profile||{};
  return `
    <header class="page-head">
      <div><p class="eyebrow">Launch Agent · Business Execution${prof.careerBackground?' ('+esc(prof.careerBackground)+')':''}</p><h1>Ventures, Partnerships &amp; Income Scoreboard</h1></div>
    </header>
    ${domainIntegrationsBar('launch',[
      {svc:'gmail',op:'WRITE',key:'gmail_bd_outreach',label:'Gmail: Draft Warm Partnership / BD Outreach Email'},
      {svc:'gdocs',op:'WRITE',key:'gdocs_venture_pitch',label:'Google Docs: Draft Venture Partnership 1-Pager'},
      {svc:'whatsapp',op:'WRITE',key:'whatsapp_bd',label:'WhatsApp: Message Partner / Founder Contact'}
    ])}
    <div class="card sun" style="margin-bottom:20px">
      <b>The Founder Focus Rule: One Active Venture at a Time.</b> Park secondary business ideas below so you can drive your active venture all the way to revenue.
    </div>
    <div class="grid-2">
      <div class="stack">
        ${state.ventures.map(v=>`
          <section class="card" style="${v.active?'border:2px solid var(--accent)':''}">
            <div class="hd">
              <span class="tag ${v.active?'good':''}">${v.active?'ACTIVE VENTURE':'PARKED / SECONDARY'}</span>
              <div class="row">
                <button class="btn sm ${v.active?'solid':''}" data-act="v-active" data-id="${v.id}">${v.active?'Active':'Make Active'}</button>
                <button class="btn sm link" data-act="v-del" data-id="${v.id}">Delete</button>
              </div>
            </div>
            <input type="text" data-field="v-name" data-id="${v.id}" value="${esc(v.name)}" style="font-weight:700">
            <div class="stages">
              ${stages.map((s,i)=>`<button type="button" data-act="v-stage" data-id="${v.id}" data-n="${i}" aria-pressed="${v.stage===i}">${s}</button>`).join('')}
            </div>
            <div>
              <label class="lab">Next Shippable Action (Under 60 Mins)</label>
              <input type="text" data-field="v-next" data-id="${v.id}" value="${esc(v.next)}">
            </div>
          </section>
        `).join('')}
        <form class="inline" data-form="venture">
          <input type="text" placeholder="Add new business idea (parks automatically until activated)…" autocomplete="off">
          <button class="btn" type="submit">Add Idea</button>
        </form>
      </div>

      <div class="stack">
        <section class="card">
          <h3>Weekly Execution Scoreboard</h3>
          <div class="grid-3" style="gap:12px">
            <div class="card soft">
              <span class="lab">Partner / Lead Convos</span>
              <p class="stat">${w.convos||0} <small>/ ${state.targets.convos}</small></p>
              <div class="row"><button class="btn sm" data-act="wk" data-k="convos" data-n="1">+1</button><button class="btn sm" data-act="wk" data-k="convos" data-n="-1">−1</button></div>
            </div>
            <div class="card soft">
              <span class="lab">Offers / Demos Shipped</span>
              <p class="stat">${w.shipped||0} <small>/ ${state.targets.shipped}</small></p>
              <div class="row"><button class="btn sm" data-act="wk" data-k="shipped" data-n="1">+1</button><button class="btn sm" data-act="wk" data-k="shipped" data-n="-1">−1</button></div>
            </div>
            <div class="card soft">
              <span class="lab">Deals / Flips Listed</span>
              <p class="stat">${w.flipsListed||0} <small>/ ${state.targets.flipsListed||5}</small></p>
              <div class="row"><button class="btn sm" data-act="wk" data-k="flipsListed" data-n="1">+1</button><button class="btn sm" data-act="wk" data-k="flipsListed" data-n="-1">−1</button></div>
            </div>
          </div>
        </section>

        <section class="card">
          <h3>Monthly Cashflow Tracker (Consulting + Reselling + Ventures)</h3>
          <div class="grid-2 equal" style="gap:10px">
            <div><label class="lab">Monthly Target ($)</label><input type="text" data-field="bridge-goal" value="${esc(state.bridge.goal)}"></div>
            <div><label class="lab">Earned So Far ($)</label><input type="text" data-field="bridge-earned" value="${esc(state.bridge.earned)}"></div>
          </div>
          <div class="bar good"><i style="width:${pct}%"></i></div>
          <p class="hint small"><b class="mono">$${e.toLocaleString()}</b> of <b class="mono">$${g.toLocaleString()}</b> (${pct}%)</p>
        </section>
      </div>
    </div>`;
}

function viewFamily(){
  const prof=state.profile||{},ideas=activeFamilyIdeas();
  const famHeader=[prof.spouseName,prof.kidsDesc].filter(Boolean).join(' · ')||'Family & Friends';
  return `
    <header class="page-head">
      <div><p class="eyebrow">Circle Agent · ${esc(famHeader)}</p><h1>Family Bonding &amp; Favorite Sports Planner</h1></div>
      <a class="btn sm" href="#prefs">Edit Favorite Sports</a>
    </header>
    ${domainIntegrationsBar('circle',[
      {svc:'imessage',op:'WRITE',key:'imessage_wife',label:'Apple Messages: Text Partner Dinner & Family Plan'},
      {svc:'imessage',op:'WRITE',key:'imessage_sports',label:'Apple Messages: Send Sports Invite'},
      {svc:'whatsapp',op:'WRITE',key:'whatsapp_family',label:'WhatsApp: Send Family Update'},
      {svc:'gcalendar',op:'WRITE',key:'gcal_family_sport',label:'Google Calendar: Lock 4:00 PM Family Block'}
    ])}
    <div class="grid-2">
      <div class="stack">
        <section class="card">
          <div class="hd"><h3>Tailored Family &amp; Sports Activities</h3><span class="hint small">${esc((prof.favoriteSports||[]).join(', '))}</span></div>
          <ul class="list">
            ${ideas.map(f=>`
              <li>
                <div>
                  <span class="tag">${esc(f.sport)}</span> <span class="tag sun">${esc(f.who)}</span> · <span class="mono small">${esc(f.time)}</span>
                  <div style="font-weight:600;margin-top:4px">${esc(f.title)}</div>
                  <p class="hint small">${esc(f.note)}</p>
                </div>
                <button class="btn sm solid" data-act="fam-schedule" data-id="${f.id}">Log / Play</button>
              </li>
            `).join('')}
          </ul>
        </section>
      </div>
      <div class="stack">
        <section class="card">
          <h3>Family Connection &amp; Sports Memory Log</h3>
          <form class="stack" data-form="family-log" style="gap:8px">
            <div class="grid-2 equal" style="gap:8px">
              <input type="text" name="who" placeholder="Who (e.g. Partner, Kids, Friends)" required>
              <input type="text" name="activity" placeholder="Sport or activity (e.g. Pickleball, Golf, Dinner)" required>
            </div>
            <div class="inline"><input type="text" name="note" placeholder="Highlight or memory from today…" required><button class="btn sm solid" type="submit">Save</button></div>
          </form>
          <ul class="list" style="margin-top:8px">
            ${state.familyLog.slice().reverse().map(l=>`
              <li>
                <div>
                  <b>${esc(l.activity)}</b> <span class="tag">${esc(l.who)}</span> <span class="mono small">${esc(l.date.slice(5))}</span>
                  <p class="hint small">${esc(l.note)}</p>
                </div>
              </li>
            `).join('')}
          </ul>
        </section>
      </div>
    </div>`;
}

function viewConnect(){
  const linkedCount=INTEGRATIONS.filter(x=>getConn(x.id).linked).length;
  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">Connected Ecosystem · Google Workspace, Apple, WhatsApp &amp; Marketplaces</p>
        <h1>App Integrations &amp; Agent Permissions (${linkedCount}/${INTEGRATIONS.length} Linked)</h1>
      </div>
      <div class="row">
        <button class="btn sm solid" data-act="link-all-demo">Quick-Link All Services</button>
      </div>
    </header>
    <p class="lede">Grant or revoke granular <b>READ</b>, <b>WRITE</b>, and <b>MODIFY</b> permissions per app so your Chief of Staff and 8 specialist agents can read schedules/alerts, write docs/sheets/messages, and modify calendars or inventory on your behalf.</p>
    ${domainIntegrationsBar('anchor',[
      {svc:'gcalendar',op:'WRITE',key:'gcal_push_now',label:'Google Calendar: Push Current Block'},
      {svc:'gcalendar',op:'MODIFY',key:'gcal_modify_shift',label:'Google Calendar: Sync Shifted Schedule'},
      {svc:'gdocs',op:'WRITE',key:'gdocs_reflection',label:'Google Docs: Append Morning Reflection'},
      {svc:'imessage',op:'WRITE',key:'imessage_wife',label:'Apple Messages: Partner & Dinner Check-In'}
    ])}
    <div class="grid-2">
      <div class="stack">
        ${INTEGRATIONS.map(svc=>{
          const c=getConn(svc.id);
          const scopes=['read','write','modify'].filter(k=>c[k]).map(k=>k.toUpperCase());
          return `<section class="card" style="${c.linked?'border-color:var(--accent)':''}">
            <div class="hd">
              <div>
                <span class="tag ${c.linked?'good':'sun'}">${c.linked?'LINKED ✓':'NOT LINKED'}</span>
                <span class="tag">${esc(svc.cat)}</span>
                <h2 style="margin-top:6px">${esc(svc.name)}</h2>
              </div>
              <button class="btn sm ${c.linked?'':'solid'}" data-act="open-connect" data-svc="${svc.id}">${c.linked?'Permissions / Account':'Link Service'}</button>
            </div>
            <p class="hint">${esc(svc.desc)}</p>
            <div class="row">
              <span class="small"><b>Agents:</b> ${svc.agents.map(a=>`<span class="tag">${esc(AG[a].name)}</span>`).join(' ')}</span>
            </div>
            <div class="card soft" style="padding:10px 12px">
              <div class="hd">
                <span class="mono small"><b>Scopes:</b> ${c.linked?(scopes.length?scopes.join(' · '):'NONE'):'Awaiting user authorization'}</span>
                ${c.account?`<span class="hint small mono">${esc(clip(c.account,36))}</span>`:''}
              </div>
              <div class="small" style="display:grid;gap:3px;margin-top:4px;color:var(--ink-2)">
                <div>• <b>READ:</b> ${esc(svc.readDesc)}</div>
                <div>• <b>WRITE:</b> ${esc(svc.writeDesc)}</div>
                <div>• <b>MODIFY:</b> ${esc(svc.modDesc)}</div>
              </div>
            </div>
          </section>`;
        }).join('')}
      </div>
      <div class="stack">
        <section class="card">
          <div class="hd">
            <h3>Live Agent Read / Write / Modify Audit Log</h3>
            <button class="btn sm link" data-act="clear-synclog">Clear Log</button>
          </div>
          <p class="hint small">Every time an agent reads, writes, or modifies a connected service, Chief records the operation below.</p>
          <ul class="list">
            ${state.syncLog.slice().reverse().map(l=>{
              const svc=getSvc(l.svc);
              return `<li>
                <div>
                  <span class="tag">${esc((AG[l.agent]||AG.chief).name)}</span>
                  <span class="tag ${l.op==='WRITE'||l.op==='AUTH'?'good':l.op==='MODIFY'?'sun':''}">${esc(l.op)}</span>
                  <b>${esc(svc?svc.name:l.svc)}</b> · <span class="mono small">${esc(timeAgo(l.ts))}</span>
                  <p class="hint small" style="margin-top:2px">${esc(l.detail)}</p>
                </div>
              </li>`;
            }).join('')}
          </ul>
        </section>
      </div>
    </div>`;
}

function viewPrefs(){
  const p=state.profile||{};
  const allRecs=RECIPES.concat(p.customDishes||[]);
  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">Personalization &amp; Account Settings · ${esc(currentUser?currentUser.email:'')}</p>
        <h1>Preferences &amp; Custom Modules</h1>
      </div>
      <div class="row">
        <button class="btn sun" data-act="open-wizard">Launch 6-Module Setup Wizard</button>
        <button class="btn" data-act="export-json">Export My Private Data</button>
      </div>
    </header>
    <div class="grid-2">
      <div class="stack">
        <section class="card">
          <h3>Module 1 · Demographics, Location &amp; Daily Rhythm</h3>
          <div class="grid-2 equal" style="gap:10px">
            <div><label class="lab">Display Name</label><input type="text" data-field="prof" data-k="name" value="${esc(p.name||'')}"></div>
            <div><label class="lab">City / Location</label><input type="text" data-field="prof" data-k="city" value="${esc(p.city||'')}"></div>
          </div>
          <div class="grid-2 equal" style="gap:10px">
            <div><label class="lab">Age</label><input type="number" data-field="prof" data-k="age" value="${esc(p.age||'')}"></div>
            <div><label class="lab">Gender</label><input type="text" data-field="prof" data-k="gender" value="${esc(p.gender||'')}"></div>
          </div>
          <div class="grid-2 equal" style="gap:10px">
            <div><label class="lab">Wake Time</label><input type="time" data-field="prof" data-k="wakeTime" value="${esc(p.wakeTime||'06:00')}"></div>
            <div><label class="lab">Bedtime</label><input type="time" data-field="prof" data-k="bedTime" value="${esc(p.bedTime||'22:00')}"></div>
          </div>
          <div>
            <label class="lab">Active Mental Health &amp; Life-Ops Program Pack</label>
            <select data-field="prof" data-k="programPack">
              ${PROGRAM_PACKS.map(pk=>`<option value="${esc(pk.id)}" ${p.programPack===pk.id?'selected':''}>${esc(pk.id)}</option>`).join('')}
            </select>
          </div>
        </section>

        <section class="card">
          <h3>Module 2 &amp; 3 · Exercise, Nutrition &amp; Favorite Dishes</h3>
          <div class="grid-2 equal" style="gap:10px">
            <div><label class="lab">Current Weight (lbs)</label><input type="number" data-field="prof" data-k="weightLbs" value="${esc(p.weightLbs||'')}"></div>
            <div><label class="lab">Goal Weight (lbs)</label><input type="number" data-field="prof" data-k="goalWeightLbs" value="${esc(p.goalWeightLbs||'')}"></div>
          </div>
          <div class="grid-2 equal" style="gap:10px">
            <div><label class="lab">Daily Protein Target (g)</label><input type="number" data-field="prof-num" data-k="proteinTarget" value="${esc(p.proteinTarget||180)}"></div>
            <div><label class="lab">Daily Water Target (Glasses)</label><input type="number" data-field="prof-num" data-k="waterTarget" value="${esc(p.waterTarget||10)}"></div>
          </div>
          <div class="grid-2 equal" style="gap:10px">
            <div><label class="lab">Workout Style</label><input type="text" data-field="prof" data-k="workoutStyle" value="${esc(p.workoutStyle||'')}"></div>
            <div><label class="lab">Dietary Approach</label><input type="text" data-field="prof" data-k="dietStyle" value="${esc(p.dietStyle||'')}"></div>
          </div>
          <div>
            <label class="lab">Favorite High-Protein Dishes (Tap to toggle in your Meal Plan)</label>
            <div class="chips">
              ${allRecs.map(r=>{
                const sel=(p.favoriteDishes||[]).indexOf(r.id)>=0;
                return `<button type="button" class="chip ${sel?'sel':''}" data-act="pref-dish" data-id="${r.id}">${sel?'✓ ':''}${esc(r.name)} (${r.protein}g)</button>`;
              }).join('')}
            </div>
          </div>
          <form class="card soft" data-form="pref-custom-dish">
            <span class="lab">Add a New Custom Favorite Dish</span>
            <div class="grid-2 equal" style="gap:8px">
              <input type="text" name="name" placeholder="Dish name (e.g., Grilled Salmon &amp; Rice)" required>
              <input type="number" name="protein" placeholder="Protein (g)" required>
            </div>
            <div class="inline">
              <input type="text" name="ings" placeholder="Ingredients (comma-separated for shopping list)" required>
              <button class="btn sm solid" type="submit">Add Dish</button>
            </div>
          </form>
        </section>
      </div>

      <div class="stack">
        <section class="card">
          <h3>Module 4 &amp; 5 · Career, Family &amp; Favorite Activities</h3>
          <div>
            <label class="lab">Career Background / Superpower</label>
            <input type="text" data-field="prof" data-k="careerBackground" value="${esc(p.careerBackground||'')}">
          </div>
          <div class="grid-2 equal" style="gap:10px">
            <div><label class="lab">Partner / Spouse</label><input type="text" data-field="prof" data-k="spouseName" value="${esc(p.spouseName||'')}"></div>
            <div><label class="lab">Kids / Family Members</label><input type="text" data-field="prof" data-k="kidsDesc" value="${esc(p.kidsDesc||'')}"></div>
          </div>
          <div>
            <label class="lab">Favorite Sports &amp; Bonding Activities (Tap to toggle)</label>
            <div class="chips">
              ${ALL_SPORTS.map(sp=>{
                const sel=(p.favoriteSports||[]).indexOf(sp)>=0;
                return `<button type="button" class="chip ${sel?'sel':''}" data-act="pref-sport" data-sport="${esc(sp)}">${sel?'✓ ':''}${esc(sp)}</button>`;
              }).join('')}
            </div>
          </div>
          <div>
            <label class="lab">Personal Morning Reaffirmation</label>
            <input type="text" data-field="prof" data-k="affirmation" value="${esc(p.affirmation||'')}">
          </div>
        </section>

        <section class="card">
          <h3>Account Security &amp; Session (${esc(currentUser?currentUser.email:'')})</h3>
          <form class="inline" data-form="change-pass">
            <input type="password" name="newpass" placeholder="Enter new password to update…" required>
            <button class="btn sm solid" type="submit">Update Password</button>
          </form>
          <div class="row" style="justify-content:space-between;margin-top:8px">
            <button class="btn sm" type="button" data-act="show-guide">Show App Guidance Banner</button>
            <button class="btn sm" type="button" data-act="logout">Log Out / Switch User</button>
          </div>
        </section>
      </div>
    </div>`;
}

function hubSvg(){
  const cx=190,cy=165,R=118,r=28,open={};
  state.tasks.forEach(t=>{if(!t.done)open[t.agent]=(open[t.agent]||0)+1;});
  let lines='',nodes='';
  ORDER.forEach((id,i)=>{
    const a=(-90+i*(360/ORDER.length))*Math.PI/180,x=(cx+R*Math.cos(a)).toFixed(1),y=(cy+R*Math.sin(a)).toFixed(1);
    lines+=`<line class="hub-line" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
    nodes+=`<circle class="hub-node" cx="${x}" cy="${y}" r="${r}"/><text class="hub-t" x="${x}" y="${y}">${AG[id].name}</text>`;
    if(open[id]){const bx=(+x+r*0.75).toFixed(1),by=(+y-r*0.75).toFixed(1);nodes+=`<circle class="hub-badge" cx="${bx}" cy="${by}" r="9"/><text class="hub-bt" x="${bx}" y="${by}">${open[id]}</text>`;}
  });
  return `<svg viewBox="0 0 380 330" role="img" aria-label="Chief of Staff connected to 8 specialist agents">${lines}${nodes}<circle class="hub-chief" cx="${cx}" cy="${cy}" r="36"/><text class="hub-ct" x="${cx}" y="${cy}">Chief</text></svg>`;
}

function viewTeam(){
  return `
    <header class="page-head">
      <div><p class="eyebrow">Multi-Agent Backbone &amp; Public SaaS Architecture</p><h1>Chief of Staff + 8 Specialist Agents</h1></div>
      <div class="row">
        <button class="btn sm" data-act="export-json">Backup Data (.json)</button>
      </div>
    </header>
    <div class="grid-2">
      <div class="stack">
        <section class="card">
          <h3>Brand Identity · LIFE LOCK IN — The Adaptive Path</h3>
          <p class="hint"><b>The Adaptive Path</b> intertwines a protective outer shield with a fluid, continuous padlock shackle and central keyhole—balancing emotional warmth and personal agency in a safe, grounded space where users unlock stability and take control of their daily lives.</p>
          <div class="grid-2 equal" style="gap:8px;margin-top:4px">
            <div class="card soft" style="padding:10px;border-left:4px solid #E87A5D"><b>Warm Coral</b><span class="mono small">#E87A5D · Primary Accent</span></div>
            <div class="card soft" style="padding:10px;border-left:4px solid #4A607A"><b>Calming Slate Blue</b><span class="mono small">#4A607A · Secondary Accent</span></div>
            <div class="card soft" style="padding:10px;border-left:4px solid #EDF2EB"><b>Soft Off-White</b><span class="mono small">#EDF2EB · Wordmark &amp; Ink</span></div>
            <div class="card soft" style="padding:10px;border-left:4px solid #2B2B2B"><b>Deep Charcoal</b><span class="mono small">#2B2B2B · Canvas Backdrop</span></div>
          </div>
        </section>
        <section class="card">
          <h3>Live Agent Topology</h3>
          <div class="hub">${hubSvg()}</div>
          <p class="hint small">iOS &amp; Desktop Install Tip: On iPhone Safari, tap <b>Share → Add to Home Screen</b> to run Life Lock In full-screen like a native iOS app.</p>
        </section>
        <section class="card">
          <h3>Multi-User Privacy &amp; Program Packs</h3>
          <p class="hint">Every user who creates an account gets their own isolated data store, custom 6-module onboarding, and selectable Program Pack:</p>
          <ul class="list">
            ${PROGRAM_PACKS.map(pk=>`<li><div><b>${esc(pk.id)}</b><p class="hint small">${esc(pk.desc)}</p></div></li>`).join('')}
          </ul>
        </section>
      </div>
      <div class="stack">
        ${ORDER.map(id=>{
          const a=AG[id],nu=state.nudges[id];
          return `<section class="card">
            <div class="hd">
              <div><h2>${esc(a.name)}</h2><p class="eyebrow">${esc(a.role)}</p></div>
              <button class="btn sm solid" data-act="nudge" data-agent="${id}">Get Nudge</button>
            </div>
            <p class="hint">${esc(a.owns)}</p>
            ${nu?`<div class="nudge"><small>Latest Nudge · ${esc(timeAgo(nu.ts))}</small>${esc(nu.t)}</div>`:''}
          </section>`;
        }).join('')}
      </div>
    </div>`;
}

function foot(){
  const prof=state.profile||{};
  return `<footer class="foot">
    <span><b>LIFE LOCK IN — The Adaptive Path</b> · Private Account: ${esc(currentUser?currentUser.email:'Guest')}${prof.city?' · '+esc(prof.city):''} · Coaching &amp; productivity architecture (not medical or financial advice; in a US crisis call/text 988).</span>
    <span>lifelockin.com · iOS &amp; Desktop Ready</span>
  </footer>`;
}

/* ---------- Render & Routing ---------- */
const main=$('#main');
function isTyping(){const a=document.activeElement;return !!a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=='checkbox';}
function render(){
  if(!currentUser){
    $('#appShell').hidden=true;
    $('#authRoot').hidden=false;
    renderAuthScreen();
    return;
  }
  $('#authRoot').hidden=true;
  $('#appShell').hidden=false;
  updateUserChip();
  const fn={today:viewToday,chief:viewChief,body:viewBody,markets:viewMarkets,deals:viewDeals,diy:viewDiy,launch:viewLaunch,family:viewFamily,connect:viewConnect,prefs:viewPrefs,team:viewTeam}[VIEW]||viewToday;
  main.innerHTML=fn()+foot();
  const openTasks=state.tasks.filter(t=>!t.done).length;
  const linkedCount=INTEGRATIONS.filter(x=>getConn(x.id).linked).length;
  $('#nav').innerHTML=VIEWS.map(v=>`<a href="#${v.id}"${v.id===VIEW?' aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${v.icon}</svg><span>${esc(v.label)}</span>${v.id==='today'&&openTasks?`<span class="badge">${openTasks}</span>`:v.id==='connect'?`<span class="badge">${linkedCount}/${INTEGRATIONS.length}</span>`:''}</a>`).join('');
  if(VIEW==='chief'){const t=$('#thread');if(t&&t.lastElementChild)t.lastElementChild.scrollIntoView({block:'nearest'});}
}
function renderIfIdle(force){if(force||!isTyping())render();}
function route(){
  if(!currentUser){render();return;}
  const h=location.hash.replace('#','');
  const v=VIEWS.some(x=>x.id===h)?h:'today';
  const changed=v!==VIEW;VIEW=v;render();
  if(changed)window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);
$('#wakeBtn').addEventListener('click',openMorningModal);
const lBtn=$('#logoutBtn');
if(lBtn)lBtn.addEventListener('click',logoutUser);

/* ---------- Interactive Events ---------- */
function act(a,el){
  const d=el.dataset,k=dkey();
  switch(a){
    case 'logout':logoutUser();break;
    case 'open-morning':openMorningModal();break;
    case 'open-wizard':openOnboardingModal(1);break;
    case 'dismiss-guide':state.profile.showGuide=false;save();render();break;
    case 'show-guide':state.profile.showGuide=true;save();location.hash='today';render();break;
    case 'close-modal':clearInterval(breathInterval);$('#modalRoot').innerHTML='';break;
    case 'slot-menu':openSlotMenuModal(d.id);break;
    case 'block-time':openBlockTimeModal();break;
    case 'select-day':selectedDayIdx=+d.day;render();break;
    case 'add-custom-slot':{
      const newId='slot_'+rid();
      state.customSlots.push({
        id:newId,t:'15:00',dur:45,days:[0,1,2,3,4,5,6],
        title:'New Custom Activity Block',
        detail:'Added to your schedule — customize time, days, and agent.',
        agent:'anchor'
      });
      state.customSlots.sort((a,b)=>mins(a.t)-mins(b.t));
      save();render();
      openSlotMenuModal(newId);
      break;
    }
    case 'reset-slots':{
      state.customSlots=JSON.parse(JSON.stringify(SLOTS));
      save();render();
      toast('Schedule reset to default wake-to-bed template.');
      break;
    }
    case 'slot':{const c=state.checks[k]=state.checks[k]||{};c[d.id]=!c[d.id];save();render();break;}
    case 'focus-start':startFocus(+d.min);break;
    case 'focus-end':finishFocus(false);break;
    case 'park-del':state.parking=state.parking.filter(p=>p.id!==d.id);save();render();break;
    case 'prot':state.protein[k]=Math.max(0,(state.protein[k]||0)+(+d.n));save();render();toast('Protein updated: '+state.protein[k]+'g');break;
    case 'water':state.water[k]=Math.max(0,(state.water[k]||0)+(+d.n));save();render();break;
    case 'social':state.social[k]=Math.max(0,(state.social[k]||0)+(+d.n));save();render();break;
    case 'shift':state.shift=Math.max(-90,Math.min(180,(state.shift||0)+(+d.n)));save();render();toast('Schedule shifted to start at '+fmtMin(mins(SLOTS[0].t)+state.shift));break;
    case 'export-ics':exportIcs();break;
    case 'enable-notif':
      if(!('Notification' in window))toast('Browser notifications not supported in this view.');
      else Notification.requestPermission().then(p=>toast(p==='granted'?'Chief notifications enabled!':'Notification permission: '+p));
      break;
    case 'tasks-clear':state.tasks=state.tasks.filter(t=>!t.done);save();render();break;
    case 'quick':{const q=QUICK[d.q];if(!q)break;location.hash='chief';sendChief(q.text);break;}
    case 'clear-chat':state.messages=[];save();render();break;
    case 'workout-toggle':{const w=state.workoutDone[k]=state.workoutDone[k]||{};w[d.id]=!w[d.id];if(w[d.id])(state.checks[k]=state.checks[k]||{})['workout']=true;save();render();toast('Workout logged!');break;}
    case 'copy-grocery':{
      const items=Array.from(document.querySelectorAll('[data-field="groc-chk"]')).map(x=>(x.checked?'[x] ':'[ ] ')+x.dataset.item).join('\n');
      if(navigator.clipboard)navigator.clipboard.writeText(items).then(()=>toast('Weekly grocery list copied to clipboard!'));
      else toast('Grocery list ready.');
      break;
    }
    case 'clear-grocery-checks':state.groceryChecked={};save();render();break;
    case 'watch-del':state.watchlist=state.watchlist.filter(w=>w.id!==d.id);save();render();break;
    case 'hunt-del':state.hunts=state.hunts.filter(h=>h.id!==d.id);save();render();break;
    case 'flip-cycle':{
      const order=['Sourced / Prep','Listed (FB + eBay)','Sold'];
      const f=state.flips.find(x=>x.id===d.id);
      if(f){f.status=order[(order.indexOf(f.status)+1)%order.length];save();render();}
      break;
    }
    case 'v-stage':{const v=state.ventures.find(x=>x.id===d.id);if(v){v.stage=+d.n;save();render();}break;}
    case 'v-active':state.ventures.forEach(x=>{x.active=x.id===d.id;});save();render();toast('Active venture updated.');break;
    case 'v-del':state.ventures=state.ventures.filter(x=>x.id!==d.id);save();render();break;
    case 'wk':{const wk=wkey(),w=state.week[wk]=state.week[wk]||{convos:0,shipped:0,flipsListed:0};w[d.k]=Math.max(0,(w[d.k]||0)+(+d.n));save();render();break;}
    case 'fam-schedule':{
      const f=FAMILY_IDEAS.find(x=>x.id===d.id);
      if(f){
        state.familyLog.push({id:rid(),date:k,who:f.who,activity:f.title,note:f.note});
        (state.checks[k]=state.checks[k]||{})['family_sport']=true;
        save();render();toast('Logged family bonding: '+f.title);
      }
      break;
    }
    case 'nudge':triggerAgentNudge(d.agent);break;
    case 'open-connect':openConnectModal(d.svc,d.agent||'chief');break;
    case 'agent-int':runAgentIntegration(d.svc,d.agent,d.op,d.key);break;
    case 'link-all-demo':{
      INTEGRATIONS.forEach(it=>{
        const c=getConn(it.id);
        c.linked=true;c.read=true;c.write=true;c.modify=true;
        if(!c.account)c.account=it.placeholder.split('(')[0].trim();
      });
      logSync('chief','gcalendar','AUTH','Authorized all 8 external app integrations with READ/WRITE/MODIFY permissions.');
      render();
      toast('All 8 services linked with Read/Write/Modify permissions!');
      break;
    }
    case 'clear-synclog':state.syncLog=[];save();render();break;
    case 'pref-dish':{
      const list=state.profile.favoriteDishes=state.profile.favoriteDishes||[];
      const idx=list.indexOf(d.id);
      if(idx>=0){if(list.length>1)list.splice(idx,1);else toast('Keep at least 1 favorite dish selected.');}
      else list.push(d.id);
      save();render();
      break;
    }
    case 'pref-sport':{
      const list=state.profile.favoriteSports=state.profile.favoriteSports||[];
      const idx=list.indexOf(d.sport);
      if(idx>=0)list.splice(idx,1);
      else list.push(d.sport);
      save();render();
      break;
    }
    case 'export-json':{
      const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='lifelockin-'+(currentUser?currentUser.email.split('@')[0]:'backup')+'-'+dkey()+'.json';a.click();
      toast('Private account backup downloaded.');
      break;
    }
  }
}

function field(f,el){
  const d=el.dataset,k=dkey();
  switch(f){
    case 'slot':{const c=state.checks[k]=state.checks[k]||{};c[d.id]=el.checked;save();render();break;}
    case 'big3':ensureBig3(k)[+d.i].t=el.value.trim();save();break;
    case 'big3d':ensureBig3(k)[+d.i].done=el.checked;save();render();break;
    case 'task':{const t=state.tasks.find(x=>x.id===d.id);if(t){t.done=el.checked;save();render();}break;}
    case 'meal-day':state.mealPlan[d.day]=el.value;save();render();break;
    case 'groc-chk':state.groceryChecked[d.item]=el.checked;save();render();break;
    case 'tr-chk':state.tradeRules.checklist[+d.i]=el.checked;save();render();break;
    case 'diy-step':{const p=state.projects.find(x=>x.id===d.pid);if(p&&p.steps[+d.idx]){p.steps[+d.idx].done=el.checked;save();render();}break;}
    case 'v-name':{const v=state.ventures.find(x=>x.id===d.id);if(v){v.name=el.value.trim();save();}break;}
    case 'v-next':{const v=state.ventures.find(x=>x.id===d.id);if(v){v.next=el.value.trim();save();}break;}
    case 'bridge-goal':state.bridge.goal=el.value.replace(/[^\d]/g,'');save();render();break;
    case 'bridge-earned':state.bridge.earned=el.value.replace(/[^\d]/g,'');save();render();break;
    case 'prof':{
      state.profile[d.k]=el.value.trim();
      if(d.k==='wakeTime')state.shift=Math.max(-90,Math.min(180,mins(el.value)-mins('06:00')));
      if(d.k==='name'&&currentUser){
        currentUser.name=state.profile.name;
        const accs=loadAccounts();
        if(accs[currentUser.email]){accs[currentUser.email].name=state.profile.name;saveAccounts(accs);}
        updateUserChip();
      }
      save();
      toast('Preference saved.');
      break;
    }
    case 'prof-num':{
      state.profile[d.k]=+el.value||0;
      save();render();
      toast('Target updated.');
      break;
    }
  }
}

function form(f,el){
  const k=dkey();
  switch(f){
    case 'park':{const inp=el.querySelector('input'),v=inp.value.trim();if(v){state.parking.push({id:rid(),t:v,d:k});save();render();toast('Parked for later—stay on your current block.');}break;}
    case 'win':{const inp=el.querySelector('input'),v=inp.value.trim();if(v){state.wins.push({id:rid(),t:v,d:k});save();render();toast('Win logged!');}break;}
    case 'chat':{const inp=el.querySelector('textarea'),v=inp.value.trim();if(v){inp.value='';sendChief(v);}break;}
    case 'grocery':{const inp=el.querySelector('input'),v=inp.value.trim();if(v){state.customGroceries.push(v);save();render();}break;}
    case 'watch':{
      const sym=el.sym.value.trim().toUpperCase(),level=el.level.value.trim(),note=el.note.value.trim();
      if(sym){state.watchlist.push({id:rid(),sym,bias:'Watch',level,note});save();render();}
      break;
    }
    case 'trade':{
      const sym=el.sym.value.trim().toUpperCase(),pnl=+el.pnl.value,setup=el.setup.value.trim();
      if(sym){state.trades.push({id:rid(),date:k,sym,pnl,setup});save();render();toast('Trade logged.');}
      break;
    }
    case 'hunt':{
      const item=el.item.value.trim(),maxBuy=+el.maxBuy.value,estSell=+el.estSell.value||0;
      if(item){state.hunts.push({id:rid(),item,maxBuy,estSell,purpose:estSell>0?'Resell Flip':'Personal / Family'});save();render();}
      break;
    }
    case 'flip':{
      const item=el.item.value.trim(),buy=+el.buy.value,fees=+el.fees.value,sell=+el.sell.value,status=el.status.value;
      if(item){state.flips.push({id:rid(),item,buy,fees,sell,status});save();render();toast('Added to Reseller Inventory.');}
      break;
    }
    case 'diy-step-add':{
      const pid=el.dataset.pid,inp=el.querySelector('input'),v=inp.value.trim();
      const p=state.projects.find(x=>x.id===pid);
      if(p&&v){p.steps.push({t:v,done:false});save();render();}
      break;
    }
    case 'diy-new':{
      const title=el.title.value.trim(),cat=el.cat.value,estSave=+el.save.value||100,parts=el.parts.value.trim();
      const steps=el.steps.value.split(',').map(s=>s.trim()).filter(Boolean).map(t=>({t,done:false}));
      if(title){state.projects.unshift({id:rid(),title,cat,ytQuery:title+' DIY step by step',estSave,parts,steps:steps.length?steps:[{t:'Verify parts and tools',done:false}]});save();render();toast('DIY Guide created!');}
      break;
    }
    case 'venture':{
      const inp=el.querySelector('input'),v=inp.value.trim();
      if(v){state.ventures.push({id:rid(),name:v,stage:0,next:'Define first validation conversation',active:!state.ventures.length});save();render();}
      break;
    }
    case 'family-log':{
      const who=el.who.value.trim(),activity=el.activity.value.trim(),note=el.note.value.trim();
      if(activity){state.familyLog.push({id:rid(),date:k,who,activity,note});save();render();toast('Family moment saved!');}
      break;
    }
    case 'pref-custom-dish':{
      const nm=el.name.value.trim(),pr=+el.protein.value||45,ings=el.ings.value.split(',').map(x=>({item:x.trim(),cat:'Meat & Seafood'})).filter(x=>x.item);
      if(nm){
        const id='cust_'+rid();
        state.profile.customDishes=state.profile.customDishes||[];
        state.profile.customDishes.push({id,name:nm,slot:'Custom Favorite',protein:pr,cals:pr*10,prep:'15 min',ingredients:ings,steps:'Custom favorite high-protein recipe.'});
        state.profile.favoriteDishes=state.profile.favoriteDishes||[];
        state.profile.favoriteDishes.push(id);
        save();render();
        toast('Added '+nm+' to your favorite dishes!');
      }
      break;
    }
    case 'change-pass':{
      const pw=el.newpass.value;
      if(pw.length<4){toast('Password must be at least 4 characters.');return;}
      if(currentUser){
        const accs=loadAccounts();
        if(accs[currentUser.email]){
          accs[currentUser.email].passHash=simpleHash(pw);
          saveAccounts(accs);
          el.reset();
          toast('Password updated for '+currentUser.email+'!');
        }
      }
      break;
    }
  }
}

document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&main.contains(b)){if(b.tagName==='A')return;act(b.dataset.act,b);}else if(b&&$('#modalRoot').contains(b)){act(b.dataset.act,b);}});
document.addEventListener('change',e=>{const f=e.target.closest('[data-field]');if(f&&main.contains(f))field(f.dataset.field,f);});
document.addEventListener('submit',e=>{const f=e.target.closest('form[data-form]');if(f&&main.contains(f)){e.preventDefault();form(f.dataset.form,f);}});

/* ---------- Boot Session or Prompt Login ---------- */
(function initApp(){
  const sessUser=loadSessionUser();
  if(sessUser){
    loginUser(sessUser,false);
  } else {
    render();
  }
})();
