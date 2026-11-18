/* ---------- Schedule & Helpers ---------- */
const slotMin=s=>mins(s.t)+(state.shift||0);
function slotNow(){
  const n=nowMin();let idx=-1;
  SLOTS.forEach((s,i)=>{if(slotMin(s)<=n)idx=i;});
  return {cur:SLOTS[idx<0?0:idx],next:SLOTS[idx+1]||null,idx:idx,before:idx<0};
}
function getBig3(k){const b=state.big3[k];return b&&b.length===3?b:[{t:'',done:false},{t:'',done:false},{t:'',done:false}];}
function ensureBig3(k){if(!state.big3[k]||state.big3[k].length!==3)state.big3[k]=[{t:'',done:false},{t:'',done:false},{t:'',done:false}];return state.big3[k];}
function week(){const k=wkey();return state.week[k]||{convos:0,shipped:0,flipsListed:0};}

/* ---------- Toast & Notifications ---------- */
let toastT=null;
function toast(m){
  const el=$('#toast');if(!el)return;
  el.textContent=m;el.classList.add('on');
  clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),3400);
}
function notifyUser(title,body){
  toast(title+': '+body);
  if('Notification' in window && Notification.permission==='granted'){
    try{new Notification(title,{body:body});}catch(e){}
  }
}

/* ---------- Focus Timer ---------- */
let focus=null,focusTimer=null;
function startFocus(min,label){
  if(focus)return;
  focus={end:Date.now()+min*60000,total:min,label:label||'Deep Focus'};
  focusTimer=setInterval(tickFocus,1000);tickFocus();renderIfIdle(true);
}
function tickFocus(){
  if(!focus)return;
  const rem=focus.end-Date.now(),el=$('#clock'),pill=$('#fpill');
  if(rem<=0){finishFocus(true);return;}
  if(el)el.textContent=fmtClock(rem);
  if(pill){pill.textContent='Focus '+fmtClock(rem);pill.classList.add('on');}
}
function finishFocus(done){
  if(!focus)return;
  clearInterval(focusTimer);
  const spent=done?focus.total:Math.floor((Date.now()-(focus.end-focus.total*60000))/60000);
  focus=null;
  const pill=$('#fpill');if(pill)pill.classList.remove('on');
  if(spent>=1){const k=dkey();state.focus[k]=(state.focus[k]||0)+spent;save();}
  notifyUser('Anchor Focus',done?'Focus block complete! Stand up, hydrate, and log your win.':(spent>=1?spent+' focus minutes logged.':'Timer stopped.'));
  renderIfIdle(true);
}

/* ---------- Calendar (.ics & CSV) Export ---------- */
function exportIcs(){
  const d=new Date(),ymd=d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate());
  let ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Steady//Chief of Staff OS//EN'];
  SLOTS.forEach((s,i)=>{
    const st=slotMin(s),en=i<SLOTS.length-1?slotMin(SLOTS[i+1]):st+30;
    const sh=pad(Math.floor(st/60)),sm=pad(st%60),eh=pad(Math.floor(en/60)),em=pad(en%60);
    ics.push('BEGIN:VEVENT','DTSTART:'+ymd+'T'+sh+sm+'00','DTEND:'+ymd+'T'+eh+em+'00','SUMMARY:['+AG[s.agent].name+'] '+s.title,'DESCRIPTION:'+s.detail.replace(/\n/g,' '),'END:VEVENT');
  });
  ics.push('END:VCALENDAR');
  const blob=new Blob([ics.join('\r\n')],{type:'text/calendar;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='steady-schedule-'+dkey()+'.ics';
  a.click();
  toast('Downloaded .ics file — opens directly in iPhone/Mac Calendar or Google Calendar.');
}

/* ---------- External App Integrations & Agent Read/Write/Modify Engine ---------- */
const getSvc=id=>INTEGRATIONS.find(x=>x.id===id);
const getConn=id=>state.connections[id]||(state.connections[id]={linked:false,account:'',read:true,write:true,modify:true,lastSync:0});

function logSync(agent,svc,op,detail){
  state.syncLog.push({id:rid(),ts:Date.now(),agent,svc,op,detail});
  state.syncLog=state.syncLog.slice(-45);
  const c=getConn(svc);
  c.lastSync=Date.now();
  save();
}

function openConnectModal(svcId,reqAgent,reqOp,pendingAction){
  const svc=getSvc(svcId);if(!svc)return;
  const c=getConn(svcId);
  const agName=reqAgent&&AG[reqAgent]?AG[reqAgent].name:'Chief of Staff';
  const root=$('#modalRoot');
  root.innerHTML=`
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cModalTitle">
        <div class="hd">
          <div>
            <p class="eyebrow">${esc(svc.cat)} · Agent Permission Request</p>
            <h2 id="cModalTitle">Link ${esc(svc.name)}</h2>
          </div>
          <button class="btn sm" data-act="close-modal">Close</button>
        </div>
        ${reqOp?`<div class="card sun">
          <p class="small"><b>${esc(agName)} Agent</b> needs <b>${esc(reqOp.toUpperCase())}</b> permission on <b>${esc(svc.name)}</b> to run this action for your domain.</p>
        </div>`:''}
        <p class="hint">${esc(svc.desc)}</p>
        <div>
          <label class="lab" for="cAccInput">Account / Target Handle / Sheet or Doc URL</label>
          <input type="text" id="cAccInput" value="${esc(c.account||'')}" placeholder="${esc(svc.placeholder)}">
        </div>
        <div class="card soft">
          <span class="lab">Granular Agent Permissions (${svc.agents.map(a=>AG[a].name).join(', ')})</span>
          <label class="row" style="cursor:pointer">
            <input type="checkbox" id="cPermRead" ${c.read?'checked':''} style="width:18px;height:18px;accent-color:var(--accent)">
            <span><b>READ:</b> ${esc(svc.readDesc)}</span>
          </label>
          <label class="row" style="cursor:pointer">
            <input type="checkbox" id="cPermWrite" ${c.write?'checked':''} style="width:18px;height:18px;accent-color:var(--accent)">
            <span><b>WRITE:</b> ${esc(svc.writeDesc)}</span>
          </label>
          <label class="row" style="cursor:pointer">
            <input type="checkbox" id="cPermMod" ${c.modify?'checked':''} style="width:18px;height:18px;accent-color:var(--accent)">
            <span><b>MODIFY:</b> ${esc(svc.modDesc)}</span>
          </label>
        </div>
        <div class="row" style="justify-content:space-between">
          ${c.linked?`<button class="btn sm" type="button" id="cUnlinkBtn">Disconnect Service</button>`:'<span></span>'}
          <div class="row">
            <button class="btn" type="button" data-act="close-modal">Cancel</button>
            <button class="btn solid" type="button" id="cSaveBtn">${pendingAction?'Authorize & Run Agent Action':'Authorize & Link Service'}</button>
          </div>
        </div>
      </div>
    </div>`;

  const unBtn=$('#cUnlinkBtn');
  if(unBtn){
    unBtn.onclick=()=>{
      c.linked=false;
      logSync(reqAgent||'chief',svcId,'MODIFY',`Disconnected ${svc.name} integration.`);
      root.innerHTML='';
      toast(svc.name+' disconnected.');
      render();
    };
  }
  $('#cSaveBtn').onclick=()=>{
    c.linked=true;
    c.account=$('#cAccInput').value.trim()||svc.placeholder.split('(')[0].trim();
    c.read=$('#cPermRead').checked;
    c.write=$('#cPermWrite').checked;
    c.modify=$('#cPermMod').checked;
    if(reqOp&&!c[reqOp.toLowerCase()])c[reqOp.toLowerCase()]=true;
    const scopes=['read','write','modify'].filter(k=>c[k]).map(k=>k.toUpperCase()).join('/');
    logSync(reqAgent||'chief',svcId,'AUTH',`Linked ${svc.name} (${c.account}) with [${scopes}] permissions for ${svc.agents.map(a=>AG[a].name).join(', ')}.`);
    root.innerHTML='';
    toast(`${svc.name} linked with ${scopes} access!`);
    if(pendingAction)executeAgentAction(svcId,reqAgent,reqOp,pendingAction);
    else render();
  };
}

function runAgentIntegration(svcId,agentId,op,actionKey){
  const c=getConn(svcId);
  const permKey=op.toLowerCase();
  if(!c.linked||!c[permKey]){
    openConnectModal(svcId,agentId,op,actionKey);
    return;
  }
  executeAgentAction(svcId,agentId,op,actionKey);
}

function copyText(txt,msg){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>toast(msg)).catch(()=>toast(msg));
  } else {
    toast(msg);
  }
}

function executeAgentAction(svcId,agentId,op,actionKey){
  const k=dkey(),n=slotNow(),c=getConn(svcId),actV=state.ventures.find(v=>v.active)||state.ventures[0];
  const prof=state.profile||{},city=prof.city||'your city',recs=activeRecipes();
  switch(actionKey){
    case 'gcal_push_now':{
      const cur=n.cur,st=slotMin(cur),en=st+45;
      const d=new Date(),ymd=d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate());
      const dates=`${ymd}T${pad(Math.floor(st/60))}${pad(st%60)}00/${ymd}T${pad(Math.floor(en/60))}${pad(en%60)}00`;
      const url=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('['+AG[cur.agent].name+'] '+cur.title)}&details=${encodeURIComponent(cur.detail)}&dates=${dates}`;
      logSync(agentId,'gcalendar','WRITE',`Anchor wrote block "${cur.title}" (${fmtMin(st)}) to Google Calendar (${c.account}).`);
      window.open(url,'_blank','noopener');
      render();
      break;
    }
    case 'gcal_modify_shift':{
      logSync(agentId,'gcalendar','MODIFY',`Anchor modified downstream Google Calendar blocks by ${state.shift>=0?'+'+state.shift:state.shift} min & synced conflict check.`);
      exportIcs();
      render();
      break;
    }
    case 'gcal_family_sport':{
      const f=activeFamilyIdeas()[0]||FAMILY_IDEAS[0];
      const d=new Date(),ymd=d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate());
      const url=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('[Circle] '+f.title)}&details=${encodeURIComponent(f.note+' ('+f.who+')')}&dates=${ymd}T160000/${ymd}T171500`;
      logSync('circle','gcalendar','WRITE',`Circle scheduled "${f.title}" at 4:00 PM on Google Calendar.`);
      window.open(url,'_blank','noopener');
      render();
      break;
    }
    case 'gsheets_grocery':{
      const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const rows=[['Category','Ingredient','Status','Meal Plan Week']];
      const seen={};
      days.forEach(d=>{
        const r=recs.find(x=>x.id===state.mealPlan[d])||RECIPES.find(x=>x.id===state.mealPlan[d])||recs[0];
        if(r&&r.ingredients){
          r.ingredients.forEach(i=>{
            if(!seen[i.item]){seen[i.item]=true;rows.push([i.cat,i.item,state.groceryChecked[i.item]?'Checked':'Need',wkey()]);}
          });
        }
      });
      state.customGroceries.forEach(g=>rows.push(['Custom',g,state.groceryChecked[g]?'Checked':'Need',wkey()]));
      const tsv=rows.map(r=>r.join('\t')).join('\n');
      copyText(tsv,'Body wrote Weekly Grocery rows to clipboard for Google Sheets!');
      logSync('body','gsheets','WRITE',`Body wrote ${rows.length-1} high-protein grocery items to Google Sheets (${c.account}).`);
      if(c.account&&c.account.startsWith('http'))window.open(c.account,'_blank','noopener');
      render();
      break;
    }
    case 'gsheets_trades':{
      const rows=[['Date','Ticker','P&L ($)','Setup & Notes']];
      state.trades.forEach(t=>rows.push([t.date,t.sym,t.pnl,t.setup]));
      const tsv=rows.map(r=>r.join('\t')).join('\n');
      copyText(tsv,'Ticker synced Trade P&L rows to clipboard for Google Sheets!');
      logSync('ticker','gsheets','WRITE',`Ticker synced ${state.trades.length} morning trades & P&L journal to Google Sheets.`);
      if(c.account&&c.account.startsWith('http'))window.open(c.account,'_blank','noopener');
      render();
      break;
    }
    case 'gsheets_flips':{
      const rows=[['Item','Buy ($)','Fees ($)','Target Sell ($)','Net Profit ($)','Status']];
      state.flips.forEach(f=>rows.push([f.item,f.buy,f.fees,f.sell,(+f.sell||0)-(+f.buy||0)-(+f.fees||0),f.status]));
      const tsv=rows.map(r=>r.join('\t')).join('\n');
      copyText(tsv,'Scout modified Reseller Flip Inventory & ROI rows for Google Sheets!');
      logSync('scout','gsheets','MODIFY',`Scout modified ${state.flips.length} reseller inventory rows & ROI ledger in Google Sheets.`);
      if(c.account&&c.account.startsWith('http'))window.open(c.account,'_blank','noopener');
      render();
      break;
    }
    case 'gdocs_reflection':{
      const m=state.morningDone[k]||{},b=getBig3(k);
      const doc=`# Steady Daily Reflection & Executive Brief (${k} · ${prof.name||'Owner'})\n`+
        `Reaffirmation Completed: ${m.aff?'Yes':'Pending'}\n`+
        `Morning Self-Reflection: ${m.ref||'(Not entered yet)'}\n`+
        `Big 3 Outcomes:\n1. ${b[0].t||'Unset'}\n2. ${b[1].t||'Unset'}\n3. ${b[2].t||'Unset'}\n`+
        `Wins Logged Today: ${state.wins.filter(w=>w.d===k).map(w=>w.t).join('; ')||'None yet'}`;
      copyText(doc,'Spark wrote your Daily Reflection & Brief to clipboard for Google Docs!');
      logSync('spark','gdocs','WRITE',`Spark appended ${k} Morning Reflection & Big 3 to Google Docs journal.`);
      if(c.account&&c.account.startsWith('http'))window.open(c.account,'_blank','noopener');
      render();
      break;
    }
    case 'gdocs_venture_pitch':{
      const doc=`# Partnership & Venture Brief: ${actV?actV.name:'Primary Venture'}\n`+
        `Founder: ${prof.name||'Founder'} (${prof.careerBackground||'Entrepreneur'} · ${city})\n`+
        `Current Stage: ${['Idea','Validate','Offer','Launch','Revenue'][actV?actV.stage:1]}\n`+
        `Immediate Next Milestone: ${actV?actV.next:''}\n`+
        `Weekly Scoreboard: ${week().convos} partner convos · ${week().shipped} deliverables shipped.\n`;
      copyText(doc,'Launch drafted your Venture One-Pager to clipboard for Google Docs!');
      logSync('launch','gdocs','WRITE',`Launch generated Venture One-Pager for "${actV?actV.name:'Primary Venture'}" in Google Docs.`);
      if(c.account&&c.account.startsWith('http'))window.open(c.account,'_blank','noopener');
      render();
      break;
    }
    case 'gdocs_diy_sop':{
      const p=state.projects[0];
      const doc=`# Wrench DIY Project SOP: ${p?p.title:'Home/Auto Service'}\n`+
        `Estimated Savings vs. Pro Shop: $${p?p.estSave:0}\n`+
        `Tools & Parts: ${p?p.parts:''}\n`+
        `Checklist:\n${p?p.steps.map((s,i)=>`${i+1}. [${s.done?'x':' '}] ${s.t}`).join('\n'):''}`;
      copyText(doc,'Wrench exported your DIY Project SOP for Google Docs!');
      logSync('wrench','gdocs','MODIFY',`Wrench updated DIY SOP "${p?p.title:''}" in Google Docs.`);
      render();
      break;
    }
    case 'gmail_bd_outreach':{
      const subj=`Quick Partnership / Venture question — ${actV?actV.name:'New Venture'}`;
      const body=`Hi [Name],\n\nHope you're doing well! ${prof.careerBackground?'Coming from my background in '+prof.careerBackground+', ':''}I'm currently building ${actV?actV.name:'a new venture'}${prof.city?' here in '+prof.city:''}.\n\nNext milestone I'm executing this week: ${actV?actV.next:'validating with 5 leaders'}.\n\nWould love 12 minutes this week to get your perspective or explore a partnership angle.\n\nBest,\n${prof.name||'[Your Name]'}`;
      const url=`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      logSync('launch','gmail','WRITE',`Launch drafted warm outreach email in Gmail for "${actV?actV.name:'Active Venture'}".`);
      window.open(url,'_blank','noopener');
      render();
      break;
    }
    case 'gmail_read_deals':{
      logSync('scout','gmail','READ',`Scout scanned Gmail (${c.account}) for Slickdeals price alerts, liquidator manifests & eBay sold receipts.`);
      state.tasks.push({id:rid(),agent:'scout',title:'Review Gmail Slickdeals & Liquidator manifest digest',done:false,ts:Date.now()});
      save();render();
      toast('Scout scanned Gmail alerts and added a task.');
      break;
    }
    case 'imessage_wife':{
      const phone=(c.account||'').replace(/[^\d+]/g,'');
      const r=recs.find(x=>x.id===state.mealPlan[['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]])||recs[0];
      const txt=`Hey ❤️ Checking in from my Steady dashboard — planning ${r.name} (${r.protein}g protein) for dinner tonight and 4:00 PM family time. Need anything while I'm out?`;
      logSync('circle','imessage','WRITE',`Circle prepared iMessage check-in to ${prof.spouseName||'partner'} with tonight's dinner (${r.name}).`);
      window.location.href=`sms:${phone}?&body=${encodeURIComponent(txt)}`;
      render();
      break;
    }
    case 'imessage_sports':{
      const phone=(c.account||'').replace(/[^\d+]/g,'');
      const sp=(prof.favoriteSports&&prof.favoriteSports[0])||'Pickleball / Golf';
      const txt=`Hey! Up for ${sp}${prof.city?' in '+prof.city:''} at 4:00 PM today?`;
      logSync('circle','imessage','WRITE',`Circle launched Apple Messages sports invite (${sp}).`);
      window.location.href=`sms:${phone}?&body=${encodeURIComponent(txt)}`;
      render();
      break;
    }
    case 'whatsapp_family':{
      const phone=(c.account||'').replace(/[^\d]/g,'');
      const txt=`Family update${prof.city?' from '+prof.city:''}! Cooking a high-protein dinner together tonight and getting outdoors at 4pm!`;
      logSync('circle','whatsapp','WRITE',`Circle launched WhatsApp message for family thread.`);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(txt)}`,'_blank','noopener');
      render();
      break;
    }
    case 'whatsapp_bd':{
      const phone=(c.account||'').replace(/[^\d]/g,'');
      const txt=`Hey! Following up on our partnership chat — moving ${actV?actV.name:'our project'} forward today. Free for a quick 10-min call?`;
      logSync('launch','whatsapp','WRITE',`Launch opened WhatsApp partner follow-up thread.`);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(txt)}`,'_blank','noopener');
      render();
      break;
    }
    case 'fb_listing_write':{
      const f=state.flips[0]||{item:'Open Box Gear',sell:350};
      const copy=`LOCAL PICKUP OR FAST SHIP (${city.toUpperCase()})\nItem: ${f.item}\nPrice: $${f.sell}\nCondition: Tested & ready. Message for quick pickup.`;
      copyText(copy,'Scout copied Facebook Marketplace listing & seller script to clipboard!');
      logSync('scout','facebook','WRITE',`Scout generated & copied FB Marketplace listing for "${f.item}" ($${f.sell}).`);
      render();
      break;
    }
    case 'fb_marketplace_read':{
      const h=state.hunts[0]||{item:'Espresso Machine',maxBuy:400};
      logSync('scout','facebook','READ',`Scout scanned Facebook Marketplace (${c.account}) for "${h.item}" under $${h.maxBuy}.`);
      window.open(`https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(h.item)}`,'_blank','noopener');
      render();
      break;
    }
    case 'ios_reminders_push':{
      logSync('body','youtube_ios','WRITE',`Body & Wrench synced weekly grocery checklist and DIY parts to "${c.account}".`);
      toast('Synced checklist to '+c.account+'!');
      render();
      break;
    }
  }
}

function domainIntegrationsBar(agentId,items){
  return `<div class="card soft" style="margin-bottom:18px;padding:12px 14px">
    <div class="hd">
      <div class="row">
        <span class="tag">${esc(AG[agentId].name)} App Integrations</span>
        <span class="hint small">Agents prompt to link &amp; verify Read/Write/Modify permissions on first use:</span>
      </div>
      <a class="btn sm link" href="#connect">Manage All Apps →</a>
    </div>
    <div class="row" style="margin-top:4px">
      ${items.map(x=>{
        const c=getConn(x.svc);
        return `<button class="btn sm ${c.linked?'':'sun'}" type="button" data-act="agent-int" data-svc="${x.svc}" data-agent="${agentId}" data-op="${x.op}" data-key="${x.key}">
          ${c.linked?'✓':'⚡ Link &'} ${esc(x.label)} <span class="mono small" style="opacity:.75">[${esc(x.op)}]</span>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

/* ---------- Chief of Staff Intelligence Engine ---------- */
function buildChiefReply(qText){
  const k=dkey(),n=slotNow(),b=getBig3(k);
  const prof=state.profile||{},pTarget=prof.proteinTarget||180;
  const actV=state.ventures.find(v=>v.active)||state.ventures[0];
  const prot=state.protein[k]||0,soc=state.social[k]||0;
  const todayPnl=state.trades.filter(t=>t.date===k).reduce((a,x)=>a+(+x.pnl||0),0);
  const netFlip=state.flips.reduce((a,f)=>a+((+f.sell||0)-(+f.buy||0)-(+f.fees||0)),0);
  const s=qText.toLowerCase();

  let reply='',issued=[];
  if(s.includes('morning')||s.includes('brief')){
    reply=`Good morning${prof.name?', '+prof.name:''}${prof.city?' in '+prof.city:''}. Here is your Chief of Staff gameplan (${prof.programPack||'Steady OS'}):\n\n`+
      `1. **Mindset & Body (Spark + Body):** Complete your Morning Ignition Gate if you haven't yet. Target **${pTarget}g+ protein** today (currently ${prot}g) and complete your **${prof.workoutStyle||'daily workout'}**.\n`+
      `2. **Morning Market Window (Ticker):** You have a hard stop at **${state.tradeRules.stopTime} AM** and a max of ${state.tradeRules.maxTrades} setups. Protect your focus for your 9:00 AM revenue block.\n`+
      `3. **Income & Ventures (Launch + Scout):** Active venture is **${actV?actV.name:'your primary project'}**. Your #1 move at 9:00 AM: *${actV?actV.next:'Complete 3 high-value outreach conversations'}*.\n`+
      `4. **Family & Sports (Circle):** 4:00 PM is locked for ${prof.kidsDesc||prof.spouseName||'family bonding'} (${(prof.favoriteSports||[]).slice(0,3).join(', ')||'sports & outdoor play'}), followed by a phone-free dinner.`;
    issued=[
      {agent:'spark',title:'Complete Morning Reaffirmation & 60s Breathing Gate'},
      {agent:'body',title:'Hit '+pTarget+'g protein target & '+clip(prof.workoutStyle||'Morning Workout',35)},
      {agent:'launch',title:clip(actV&&actV.next?actV.next:'Send 3 high-value outreach messages',65)}
    ];
  } else if(s.includes('trade')||s.includes('market')||s.includes('stock')){
    reply=`**Ticker Risk Desk Check-In:**\n`+
      `• Today's Net P&L: **$${todayPnl}** (Max daily loss guardrail: -$${state.tradeRules.maxLoss}).\n`+
      `• Watchlist focus: ${state.watchlist.length?state.watchlist.map(w=>w.sym+' ('+w.bias+')').join(', '):'No tickers added yet'}.\n`+
      `• **Trading Discipline Rule:** Boredom is not a signal. Verify all 3 Pre-Trade Checklist boxes on the Markets tab before entry, and close your charts at **${state.tradeRules.stopTime} AM** sharp.`;
    issued=[{agent:'ticker',title:'Log opening setup thesis and close charts at '+state.tradeRules.stopTime+' AM'}];
  } else if(s.includes('stuck')||s.includes('paralysis')||s.includes('phone')||s.includes('scroll')){
    const trig=TRIGGERS[Math.floor(Math.random()*TRIGGERS.length)];
    reply=`**Pattern Interrupt (Anchor + Shield + Spark):**\n`+
      `Zero guilt—your brain is just looking for quick dopamine. Let's flip the switch in 90 seconds:\n\n`+
      `1. **Physical Reset:** Stand up right now, drink a glass of water, and do 15 pushups or air squats.\n`+
      `2. **Action Trigger:** ${trig}\n`+
      `3. **Right Now Block:** *${n.cur.title}*. Start a 25-minute Focus Timer on the Today tab and park every stray idea in the Parking Lot.`;
    issued=[{agent:'anchor',title:'Run a 25-minute single-task Focus Timer right now'}];
  } else if(s.includes('deal')||s.includes('flip')||s.includes('resell')||s.includes('marketplace')){
    reply=`**Scout Arbitrage & Deal Brief:**\n`+
      `Your active flip pipeline has **$${netFlip} in projected net profit** across ${state.flips.length} items.\n\n`+
      `• **Rule #1:** Deal hunting on FB Marketplace, OfferUp, eBay, and Slickdeals happens inside a **45-minute timer**.\n`+
      `• **Rule #2:** Plug Buy Price + Fees into the Scout ROI Calculator and aim for **40%+ ROI** or **$75+ net profit**.`;
    issued=[{agent:'scout',title:'List 1 item in inventory or run a 25-min timed deal sweep'}];
  } else if(s.includes('diy')||s.includes('home')||s.includes('car')||s.includes('project')){
    const p=state.projects[0];
    reply=`**Wrench DIY Project Guide:**\n`+
      `Active Project: **${p?p.title:'Home & Auto Maintenance'}** (Estimated savings vs. pro quote: **$${p?p.estSave:150}**).\n\n`+
      `• Confirm every item in the Parts & Tools list is ready before starting, and use the 1-click YouTube walkthrough on the Home & Auto tab.`;
    issued=[{agent:'wrench',title:'Complete next step on '+(p?p.title:'active DIY project')}];
  } else if(s.includes('family')||s.includes('sport')||s.includes('kid')||s.includes('wife')){
    const ideas=activeFamilyIdeas();
    const idea=ideas[Math.floor(Math.random()*ideas.length)];
    reply=`**Circle Family & Sports Plan:**\n`+
      `Tonight's recommended bonding activity: **${idea.title}** (${idea.sport} · ${idea.time}).\n`+
      `• *How to run it:* ${idea.note}\n`+
      `• Put all phones in a basket at 6:30 PM dinner.`;
    issued=[{agent:'circle',title:idea.title+' at 4:00 PM'}];
  } else {
    const doneSteps=SLOTS.filter(x=>(state.checks[k]||{})[x.id]).length;
    reply=`**Chief Status Check (${fmtMin(nowMin())}):**\n`+
      `• **Schedule:** ${doneSteps} of ${SLOTS.length} daily blocks completed. Current block: **${n.cur.title}**.\n`+
      `• **Big 3:** ${b.filter(x=>x.t).length?b.map((x,i)=>`#${i+1} ${x.t||'unset'}${x.done?' (Done)':''}`).join(' · '):'Not locked yet—fill in your Big 3 on Today.'}\n`+
      `• **Discipline:** ${state.focus[k]||0} focus mins logged · ${soc}/${state.budget}m social budget · ${prot}g/${pTarget}g protein.\n`+
      `• **Next 10 Minutes:** Do the first 5 minutes of *${n.cur.title}* right now.`;
    issued=[{agent:n.cur.agent,title:'Complete current block: '+clip(n.cur.title,55)}];
  }
  return {reply,tasks:issued};
}

function sendChief(text){
  text=String(text||'').trim();
  if(!text)return;
  const ts=Date.now();
  state.messages.push({id:rid(),from:'you',t:text,ts:ts});
  const res=buildChiefReply(text);
  const botMsg={id:rid(),from:'chief',t:res.reply,ts:ts+10,tasks:res.tasks};
  res.tasks.forEach(t=>state.tasks.push({id:rid(),agent:t.agent,title:t.title,done:false,ts:ts+10}));
  state.messages.push(botMsg);
  save();
  render();
}

function triggerAgentNudge(id){
  const k=dkey(),prot=state.protein[k]||0,prof=state.profile||{},pTarget=prof.proteinTarget||180;
  const nudges={
    anchor:`Right now is "${slotNow().cur.title}". Set a 25-minute timer, close extra browser tabs, and put your phone face-down across the room.`,
    spark:`Read your reaffirmation out loud: "${prof.affirmation||AFFIRMATIONS[0]}" Now take 3 deep breaths and start for just 120 seconds.`,
    body:`You are at ${prot}g of your ${pTarget}g protein goal today. Grab 40g of protein (Greek yogurt, cottage cheese, eggs, or shake) and 16oz of water right now.`,
    ticker:`Check the clock: if it's past ${state.tradeRules.stopTime} AM, your morning trade window is closed. Log your setups and shift to building your venture.`,
    scout:`Stick to high-margin deals (40%+ ROI). Spend 15 minutes photographing and listing 1 item before browsing new deals.`,
    wrench:`Check your active DIY project parts list first. Watch the 5-minute YouTube walkthrough before turning the first wrench.`,
    launch:`Leverage your background (${prof.careerBackground||'your network'}). Message 2 contacts or leads right now with a specific, helpful offer.`,
    circle:`Lock in 4:00 PM (${(prof.favoriteSports||['sports'])[0]}) with ${prof.kidsDesc||prof.spouseName||'your family'}, and prep tonight's high-protein dinner early.`
  };
  state.nudges[id]={t:nudges[id]||'Stay locked on your next 10-minute action.',ts:Date.now()};
  save();render();
  toast(AG[id].name+' sent a nudge.');
}

/* ---------- Morning Ignition Modal (Forced Wake-up Ritual) ---------- */
let breathInterval=null;
function openMorningModal(){
  const k=dkey(),m=state.morningDone[k]||{aff:false,ref:'',breath:false};
  const prof=state.profile||{};
  const aff=prof.affirmation||AFFIRMATIONS[new Date().getDate()%AFFIRMATIONS.length];
  const refQ=REFLECTIONS[new Date().getDate()%REFLECTIONS.length];
  const b=getBig3(k);
  const root=$('#modalRoot');
  root.innerHTML=`
    <div class="modal-backdrop" id="mBackdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle">
        <div class="hd">
          <div>
            <p class="eyebrow">Spark · Forced Morning Ritual</p>
            <h2 id="mTitle">${esc(prof.name?prof.name+'’s ':'')}Morning Ignition</h2>
          </div>
          <button class="btn sm" data-act="close-modal">Close</button>
        </div>
        <p class="hint">Before checking feeds or placing a trade, anchor your mind, body, and #1 priority for the day.</p>
        <div class="card sun">
          <p class="eyebrow">Step 1 · Daily Reaffirmation (Read Aloud)</p>
          <p style="font:600 18px/1.3 var(--font-display)">“${esc(aff)}”</p>
          <label class="row" style="cursor:pointer;margin-top:4px">
            <input type="checkbox" id="mAff" ${m.aff?'checked':''} style="width:18px;height:18px;accent-color:var(--accent)">
            <span><b>I said this out loud and drank my morning water.</b></span>
          </label>
        </div>
        <div class="card">
          <div class="hd">
            <div>
              <p class="eyebrow">Step 2 · 60-Second Box Breathing &amp; Posture Reset</p>
              <p class="hint small">Inhale 4s · Hold 4s · Exhale 4s — calm the nervous system.</p>
            </div>
            <button class="btn sm solid" type="button" id="startBreathBtn">${m.breath?'Completed ✓':'Start 60s Breath'}</button>
          </div>
          <div class="breath-circle" id="breathCircle">${m.breath?'Ready':'4-4-4'}</div>
        </div>
        <div class="card">
          <label class="lab" for="mRef">Step 3 · Morning Self-Reflection</label>
          <p class="hint small" style="margin-bottom:6px">${esc(refQ)}</p>
          <input type="text" id="mRef" value="${esc(m.ref||'')}" placeholder="Write one honest sentence…">
        </div>
        <div class="card">
          <label class="lab" for="mB1">Step 4 · Today’s #1 Income / Venture Priority (Big 3 #1)</label>
          <input type="text" id="mB1" value="${esc(b[0].t)}" placeholder="e.g., Message 5 partners &amp; ship next milestone">
        </div>
        <div class="row" style="justify-content:flex-end">
          <button class="btn solid" type="button" id="lockMorningBtn">Lock In My Morning &amp; Start Day</button>
        </div>
      </div>
    </div>`;

  $('#startBreathBtn').onclick=()=>{
    clearInterval(breathInterval);
    const c=$('#breathCircle'),btn=$('#startBreathBtn');
    let sec=16;
    btn.textContent='Breathing…';
    c.classList.add('inhale');c.textContent='Inhale';
    breathInterval=setInterval(()=>{
      sec--;
      if(sec<=0){
        clearInterval(breathInterval);
        c.classList.remove('inhale');c.textContent='Done ✓';
        btn.textContent='Completed ✓';
        const cur=state.morningDone[k]=state.morningDone[k]||{};
        cur.breath=true;save();
        return;
      }
      const phase=sec%8;
      if(phase>=4){c.classList.add('inhale');c.textContent='Inhale '+sec+'s';}
      else{c.classList.remove('inhale');c.textContent='Exhale '+sec+'s';}
    },1000);
  };

  $('#lockMorningBtn').onclick=()=>{
    clearInterval(breathInterval);
    const cur=state.morningDone[k]=state.morningDone[k]||{};
    cur.aff=$('#mAff').checked;
    cur.ref=$('#mRef').value.trim();
    cur.breath=true;
    cur.done=true;
    const b1=$('#mB1').value.trim();
    if(b1)ensureBig3(k)[0].t=b1;
    (state.checks[k]=state.checks[k]||{})['wake']=true;
    save();
    root.innerHTML='';
    toast('Morning Ignition locked! Chief updated your Today dashboard.');
    render();
  };
}

/* ---------- 6-Module Onboarding & Personalization Wizard ---------- */
let wizStep=1;
let wizDraft=null;

function openOnboardingModal(startAt){
  wizStep=startAt||1;
  const p=state.profile||{};
  wizDraft={
    name:p.name||'',
    age:p.age||'',
    gender:p.gender||'',
    city:p.city||'',
    wakeTime:p.wakeTime||'06:30',
    bedTime:p.bedTime||'22:00',
    programPack:p.programPack||'ADHD Focus & Structure',
    weightLbs:p.weightLbs||'',
    goalWeightLbs:p.goalWeightLbs||'',
    proteinTarget:p.proteinTarget||160,
    waterTarget:p.waterTarget||10,
    workoutStyle:p.workoutStyle||'Strength & Conditioning',
    dietStyle:p.dietStyle||'High-Protein Whole Foods',
    favoriteDishes:Array.isArray(p.favoriteDishes)?p.favoriteDishes.slice():['r1','r3','r4','r6'],
    customDishes:Array.isArray(p.customDishes)?JSON.parse(JSON.stringify(p.customDishes)):[],
    careerBackground:p.careerBackground||'',
    venture1:(state.ventures[0]&&state.ventures[0].name)||'',
    venture1Next:(state.ventures[0]&&state.ventures[0].next)||'',
    venture2:(state.ventures[1]&&state.ventures[1].name)||'',
    morningTrader:p.morningTrader!==false,
    tickers:state.watchlist.map(w=>w.sym).join(', ')||'SPY, NVDA, GOOGL',
    resellerLicense:!!p.resellerLicense,
    hunt1:(state.hunts[0]&&state.hunts[0].item)||'',
    hunt1Max:(state.hunts[0]&&state.hunts[0].maxBuy)||'',
    spouseName:p.spouseName||'',
    kidsDesc:p.kidsDesc||'',
    favoriteSports:Array.isArray(p.favoriteSports)?p.favoriteSports.slice():['Pickleball','Golf'],
    diyTitle:(state.projects[0]&&state.projects[0].title)||'',
    diyParts:(state.projects[0]&&state.projects[0].parts)||'',
    affirmation:p.affirmation||AFFIRMATIONS[0]
  };
  paintOnboardingModal();
}

function captureWizInputs(){
  if(!wizDraft)return;
  const root=$('#modalRoot');if(!root)return;
  root.querySelectorAll('[data-wiz]').forEach(el=>{
    const k=el.dataset.wiz;
    if(el.type==='checkbox')wizDraft[k]=el.checked;
    else wizDraft[k]=el.value;
  });
}

function paintOnboardingModal(){
  const d=wizDraft,root=$('#modalRoot');
  const stepsBar=[1,2,3,4,5,6].map(i=>`<i class="${i<wizStep?'done':i===wizStep?'on':''}"></i>`).join('');
  let body='';

  if(wizStep===1){
    body=`
      <p class="eyebrow">Module 1 of 6 · Demographics &amp; Focus Program</p>
      <h2>Welcome! Let’s tailor Steady to your life</h2>
      <p class="hint">Your answers configure your Chief of Staff, daily schedule, workouts, and agent guardrails. All data stays private to your account (${esc(currentUser?currentUser.email:'')}).</p>
      <div class="grid-2 equal" style="gap:10px">
        <div><label class="lab">Your First Name</label><input type="text" data-wiz="name" value="${esc(d.name)}" placeholder="e.g., Matt"></div>
        <div><label class="lab">City / Location</label><input type="text" data-wiz="city" value="${esc(d.city)}" placeholder="e.g., Palm Springs, CA"></div>
      </div>
      <div class="grid-2 equal" style="gap:10px">
        <div><label class="lab">Age</label><input type="number" data-wiz="age" value="${esc(d.age)}" placeholder="e.g., 41"></div>
        <div><label class="lab">Gender</label><input type="text" data-wiz="gender" value="${esc(d.gender)}" placeholder="e.g., Male / Female"></div>
      </div>
      <div class="grid-2 equal" style="gap:10px">
        <div><label class="lab">Target Wake Time</label><input type="time" data-wiz="wakeTime" value="${esc(d.wakeTime)}"></div>
        <div><label class="lab">Target Bedtime</label><input type="time" data-wiz="bedTime" value="${esc(d.bedTime)}"></div>
      </div>
      <div>
        <label class="lab">Primary Mental Health &amp; Life-Ops Program Pack</label>
        <select data-wiz="programPack">
          ${PROGRAM_PACKS.map(pk=>`<option value="${esc(pk.id)}" ${d.programPack===pk.id?'selected':''}>${esc(pk.id)} — ${esc(clip(pk.desc,65))}</option>`).join('')}
        </select>
      </div>`;
  } else if(wizStep===2){
    body=`
      <p class="eyebrow">Module 2 of 6 · Body, Exercise &amp; Nutrition Targets</p>
      <h2>Configure Your Body Agent</h2>
      <p class="hint">Body uses your demographics to set your daily protein target, hydration goal, and daily forced workout routine.</p>
      <div class="grid-2 equal" style="gap:10px">
        <div><label class="lab">Current Weight (lbs)</label><input type="number" id="wizWeight" data-wiz="weightLbs" value="${esc(d.weightLbs)}" placeholder="e.g., 190"></div>
        <div><label class="lab">Goal Weight (lbs)</label><input type="number" id="wizGoalWeight" data-wiz="goalWeightLbs" value="${esc(d.goalWeightLbs)}" placeholder="e.g., 180"></div>
      </div>
      <div class="grid-2 equal" style="gap:10px">
        <div>
          <label class="lab">Daily Protein Target (grams)</label>
          <div class="inline">
            <input type="number" id="wizProt" data-wiz="proteinTarget" value="${esc(d.proteinTarget)}">
            <button class="btn sm" type="button" id="calcProtBtn">1g / lb Goal</button>
          </div>
        </div>
        <div><label class="lab">Daily Water Target (Glasses)</label><input type="number" data-wiz="waterTarget" value="${esc(d.waterTarget)}"></div>
      </div>
      <div class="grid-2 equal" style="gap:10px">
        <div>
          <label class="lab">Preferred Workout Style</label>
          <select data-wiz="workoutStyle">
            ${['Desert Strength & Court Conditioning','Strength & Lifting (Gym / Dumbbells)','Court Sports & Cardio Agility','HIIT & Bodyweight Conditioning','Low-Impact Mobility & Walking'].map(s=>`<option ${d.workoutStyle===s?'selected':''}>${esc(s)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="lab">Dietary Approach</label>
          <select data-wiz="dietStyle">
            ${['High-Protein Whole Foods','High-Protein Mediterranean','Low-Carb / Keto High-Protein','Dairy-Light High-Protein','Family-Friendly High-Protein'].map(s=>`<option ${d.dietStyle===s?'selected':''}>${esc(s)}</option>`).join('')}
          </select>
        </div>
      </div>`;
  } else if(wizStep===3){
    const allRecs=RECIPES.concat(d.customDishes||[]);
    body=`
      <p class="eyebrow">Module 3 of 6 · Favorite High-Protein Dishes &amp; Recipes</p>
      <h2>Pick Your Favorite Dishes for Weekly Meal Plans</h2>
      <p class="hint">Tap the dishes you love (or add your own below). Body will build your weekly meal plan and aisle-sorted grocery shopping list from these.</p>
      <div class="chips">
        ${allRecs.map(r=>{
          const sel=d.favoriteDishes.indexOf(r.id)>=0;
          return `<button type="button" class="chip ${sel?'sel':''}" data-wiz-dish="${r.id}">${sel?'✓ ':''}${esc(r.name)} (${r.protein}g)</button>`;
        }).join('')}
      </div>
      <div class="card soft">
        <span class="lab">Add Your Own Favorite Dish / Family Recipe</span>
        <div class="grid-2 equal" style="gap:8px">
          <input type="text" id="custDishName" placeholder="Dish name (e.g., Grilled Ribeye &amp; Asparagus)">
          <input type="number" id="custDishProt" placeholder="Protein grams (e.g., 55)">
        </div>
        <div class="inline">
          <input type="text" id="custDishIngs" placeholder="Ingredients (comma-separated: Ribeye steak, Asparagus, Garlic)">
          <button class="btn sm solid" type="button" id="addCustDishBtn">Add Dish</button>
        </div>
      </div>`;
  } else if(wizStep===4){
    body=`
      <p class="eyebrow">Module 4 of 6 · Business Ideas, Career, Markets &amp; Deals</p>
      <h2>Configure Launch, Ticker &amp; Scout Agents</h2>
      <div>
        <label class="lab">Your Career Background / Unfair Advantage</label>
        <input type="text" data-wiz="careerBackground" value="${esc(d.careerBackground)}" placeholder="e.g., Ex-Google Business Development, Sales &amp; Partnerships">
      </div>
      <div class="grid-2 equal" style="gap:10px">
        <div><label class="lab">#1 Active Business Idea / Venture</label><input type="text" data-wiz="venture1" value="${esc(d.venture1)}" placeholder="e.g., AI Life-Ops App / Consulting"></div>
        <div><label class="lab">First Next Action for #1 Venture</label><input type="text" data-wiz="venture1Next" value="${esc(d.venture1Next)}" placeholder="e.g., Message 5 warm contacts this week"></div>
      </div>
      <div>
        <label class="lab">Secondary Business Idea (Parked until #1 launches)</label>
        <input type="text" data-wiz="venture2" value="${esc(d.venture2)}" placeholder="e.g., Fractional BD Advisory or Reseller Brand">
      </div>
      <div class="grid-2 equal" style="gap:10px">
        <div class="card soft">
          <label class="row" style="cursor:pointer">
            <input type="checkbox" data-wiz="morningTrader" ${d.morningTrader?'checked':''} style="width:18px;height:18px;accent-color:var(--accent)">
            <span><b>I trade stocks in the morning</b></span>
          </label>
          <label class="lab">Watchlist Tickers (comma-separated)</label>
          <input type="text" data-wiz="tickers" value="${esc(d.tickers)}" placeholder="GOOGL, NVDA, SPY">
        </div>
        <div class="card soft">
          <label class="row" style="cursor:pointer">
            <input type="checkbox" data-wiz="resellerLicense" ${d.resellerLicense?'checked':''} style="width:18px;height:18px;accent-color:var(--accent)">
            <span><b>I hunt deals / resell products</b></span>
          </label>
          <label class="lab">First Product to Hunt on Marketplaces</label>
          <div class="inline">
            <input type="text" data-wiz="hunt1" value="${esc(d.hunt1)}" placeholder="e.g., Espresso Machine">
            <input type="number" data-wiz="hunt1Max" value="${esc(d.hunt1Max)}" placeholder="Max $" style="max-width:95px">
          </div>
        </div>
      </div>`;
  } else if(wizStep===5){
    body=`
      <p class="eyebrow">Module 5 of 6 · Family, Relationships &amp; Favorite Activities</p>
      <h2>Configure Your Circle Agent</h2>
      <p class="hint">Circle helps you plan meaningful family bonding, partner connection, and sports sessions every afternoon and weekend.</p>
      <div class="grid-2 equal" style="gap:10px">
        <div><label class="lab">Partner / Spouse (Optional)</label><input type="text" data-wiz="spouseName" value="${esc(d.spouseName)}" placeholder="e.g., Wife (from Latvia)"></div>
        <div><label class="lab">Kids / Family Members (Optional)</label><input type="text" data-wiz="kidsDesc" value="${esc(d.kidsDesc)}" placeholder="e.g., Son (12) &amp; Daughter (7)"></div>
      </div>
      <div>
        <label class="lab">Tap Your Favorite Sports &amp; Bonding Activities</label>
        <div class="chips">
          ${ALL_SPORTS.map(sp=>{
            const sel=d.favoriteSports.indexOf(sp)>=0;
            return `<button type="button" class="chip ${sel?'sel':''}" data-wiz-sport="${esc(sp)}">${sel?'✓ ':''}${esc(sp)}</button>`;
          }).join('')}
        </div>
      </div>`;
  } else {
    body=`
      <p class="eyebrow">Module 6 of 6 · Home/Auto DIY, Reaffirmation &amp; App Connectors</p>
      <h2>Final Touches: Wrench, Spark &amp; Connected Apps</h2>
      <div class="grid-2 equal" style="gap:10px">
        <div><label class="lab">Current Home or Auto DIY Project</label><input type="text" data-wiz="diyTitle" value="${esc(d.diyTitle)}" placeholder="e.g., SUV Oil &amp; Filter Service or AC Tune-Up"></div>
        <div><label class="lab">Tools / Parts Needed</label><input type="text" data-wiz="diyParts" value="${esc(d.diyParts)}" placeholder="e.g., 6qt 0W-20 oil, filter, 14mm socket"></div>
      </div>
      <div>
        <label class="lab">Your Personal Morning Reaffirmation (Read Aloud at Wake-Up)</label>
        <input type="text" data-wiz="affirmation" value="${esc(d.affirmation)}" placeholder="I am a builder, a present parent and partner, and I finish what I start today.">
      </div>
      <div class="card soft">
        <span class="lab">App Connectors (Google Calendar, Sheets, Docs, Gmail, Apple Messages, WhatsApp, Facebook)</span>
        <p class="hint small">As a new user, your app connectors start clean and unlinked. Whenever an agent needs to read, write, or modify an external service—or inside the <b>Integrations</b> tab—you’ll be prompted to link your own account.</p>
      </div>`;
  }

  root.innerHTML=`
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="wiz-steps">${stepsBar}</div>
        ${body}
        <div class="row" style="justify-content:space-between;margin-top:6px">
          <div>
            ${wizStep>1?`<button class="btn" type="button" id="wizPrevBtn">← Back</button>`:`<button class="btn link" type="button" data-act="close-modal">Skip for now</button>`}
          </div>
          <div class="row">
            ${wizStep<6?`<button class="btn solid" type="button" id="wizNextBtn">Next Module (${wizStep}/6) →</button>`:`<button class="btn solid" type="button" id="wizFinishBtn">Finish &amp; Launch My Steady OS ✓</button>`}
          </div>
        </div>
      </div>
    </div>`;

  const prev=$('#wizPrevBtn');
  if(prev)prev.onclick=()=>{captureWizInputs();wizStep--;paintOnboardingModal();};
  const next=$('#wizNextBtn');
  if(next)next.onclick=()=>{captureWizInputs();wizStep++;paintOnboardingModal();};
  const fin=$('#wizFinishBtn');
  if(fin)fin.onclick=()=>{captureWizInputs();applyOnboardingWizard();};

  const calcBtn=$('#calcProtBtn');
  if(calcBtn)calcBtn.onclick=()=>{
    captureWizInputs();
    const w=+(wizDraft.goalWeightLbs||wizDraft.weightLbs||175);
    wizDraft.proteinTarget=Math.max(100,Math.min(300,Math.round(w)));
    paintOnboardingModal();
  };

  root.querySelectorAll('[data-wiz-dish]').forEach(btn=>{
    btn.onclick=()=>{
      captureWizInputs();
      const id=btn.dataset.wizDish;
      const idx=wizDraft.favoriteDishes.indexOf(id);
      if(idx>=0)wizDraft.favoriteDishes.splice(idx,1);
      else wizDraft.favoriteDishes.push(id);
      paintOnboardingModal();
    };
  });

  const addDishBtn=$('#addCustDishBtn');
  if(addDishBtn)addDishBtn.onclick=()=>{
    captureWizInputs();
    const nm=$('#custDishName').value.trim();
    const pr=+$('#custDishProt').value||45;
    const ingStr=$('#custDishIngs').value.trim();
    if(!nm){toast('Enter a dish name first.');return;}
    const id='cust_'+rid();
    const ings=(ingStr?ingStr.split(','):[nm]).map(x=>({item:x.trim(),cat:'Meat & Seafood'})).filter(x=>x.item);
    const dish={id,name:nm,slot:'Custom Favorite',protein:pr,cals:pr*10,prep:'15 min',ingredients:ings,steps:'Custom favorite high-protein recipe.'};
    wizDraft.customDishes.push(dish);
    wizDraft.favoriteDishes.push(id);
    paintOnboardingModal();
    toast('Added '+nm+' to your favorite dishes!');
  };

  root.querySelectorAll('[data-wiz-sport]').forEach(btn=>{
    btn.onclick=()=>{
      captureWizInputs();
      const sp=btn.dataset.wizSport;
      const idx=wizDraft.favoriteSports.indexOf(sp);
      if(idx>=0)wizDraft.favoriteSports.splice(idx,1);
      else wizDraft.favoriteSports.push(sp);
      paintOnboardingModal();
    };
  });
}

function applyOnboardingWizard(){
  const d=wizDraft;if(!d)return;
  const p=state.profile;
  p.name=d.name.trim()||(currentUser?currentUser.name:'Friend');
  p.age=d.age;
  p.gender=d.gender.trim();
  p.city=d.city.trim();
  p.wakeTime=d.wakeTime||'06:30';
  p.bedTime=d.bedTime||'22:00';
  p.programPack=d.programPack;
  p.weightLbs=d.weightLbs;
  p.goalWeightLbs=d.goalWeightLbs;
  p.proteinTarget=+d.proteinTarget||160;
  p.waterTarget=+d.waterTarget||8;
  p.workoutStyle=d.workoutStyle;
  p.dietStyle=d.dietStyle;
  p.favoriteDishes=d.favoriteDishes.length?d.favoriteDishes:['r1','r3','r4'];
  p.customDishes=d.customDishes||[];
  p.careerBackground=d.careerBackground.trim();
  p.morningTrader=!!d.morningTrader;
  p.resellerLicense=!!d.resellerLicense;
  p.spouseName=d.spouseName.trim();
  p.kidsDesc=d.kidsDesc.trim();
  p.favoriteSports=d.favoriteSports.length?d.favoriteSports:['Pickleball'];
  p.affirmation=d.affirmation.trim()||AFFIRMATIONS[0];
  p.onboarded=true;

  state.shift=Math.max(-90,Math.min(180,mins(p.wakeTime)-mins('06:00')));

  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  days.forEach((day,i)=>{
    state.mealPlan[day]=p.favoriteDishes[i%p.favoriteDishes.length];
  });

  if(d.venture1.trim()){
    if(state.ventures.length){
      state.ventures[0].name=d.venture1.trim();
      state.ventures[0].next=d.venture1Next.trim()||'Complete 3 validation conversations this week';
      state.ventures[0].active=true;
    } else {
      state.ventures.push({id:rid(),name:d.venture1.trim(),stage:1,next:d.venture1Next.trim()||'Complete 3 validation conversations this week',active:true});
    }
  }
  if(d.venture2.trim()&&state.ventures.length<2){
    state.ventures.push({id:rid(),name:d.venture2.trim(),stage:0,next:'Parked until active venture reaches revenue',active:false});
  }

  if(d.tickers.trim()){
    const syms=d.tickers.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
    if(syms.length){
      state.watchlist=syms.map(sym=>({id:rid(),sym,bias:'Watch',level:'Opening 15-min range',note:'Added during personalization setup.'}));
    }
  }

  if(d.hunt1.trim()&&!state.hunts.length){
    state.hunts.push({id:rid(),item:d.hunt1.trim(),maxBuy:+d.hunt1Max||250,estSell:(+d.hunt1Max||250)*1.8,purpose:p.resellerLicense?'Resell Flip':'Personal Deal'});
  }

  if(d.diyTitle.trim()&&!state.projects.length){
    state.projects.push({
      id:rid(),title:d.diyTitle.trim(),cat:'Home / Auto DIY',
      ytQuery:d.diyTitle.trim()+' DIY step by step',estSave:175,
      parts:d.diyParts.trim()||'Basic hand tools & replacement part',
      steps:[
        {t:'Verify all tools and replacement parts before starting',done:false},
        {t:'Watch 5-minute YouTube tutorial walkthrough',done:false},
        {t:'Complete installation & test operation',done:false}
      ]
    });
  }

  if(currentUser){
    currentUser.name=p.name;
    const accs=loadAccounts();
    if(accs[currentUser.email]){accs[currentUser.email].name=p.name;saveAccounts(accs);}
  }

  save();
  $('#modalRoot').innerHTML='';
  updateUserChip();
  render();
  toast('Your Steady OS is personalized and ready!');
}
