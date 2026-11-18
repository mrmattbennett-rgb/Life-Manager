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
      const f=FAMILY_IDEAS[0];
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
        const r=RECIPES.find(x=>x.id===state.mealPlan[d])||RECIPES[0];
        r.ingredients.forEach(i=>{
          if(!seen[i.item]){seen[i.item]=true;rows.push([i.cat,i.item,state.groceryChecked[i.item]?'Checked':'Need',wkey()]);}
        });
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
      const doc=`# Steady Daily Reflection & Executive Brief (${k})\n`+
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
      const doc=`# Partnership & Venture Brief: ${actV?actV.name:'Steady'}\n`+
        `Founder Background: Ex-Google Business Development, Sales & Strategic Partnerships (Palm Springs, CA)\n`+
        `Current Stage: ${['Idea','Validate','Offer','Launch','Revenue'][actV?actV.stage:1]}\n`+
        `Immediate Next Milestone: ${actV?actV.next:''}\n`+
        `Weekly Scoreboard: ${week().convos} partner convos · ${week().shipped} deliverables shipped.\n`;
      copyText(doc,'Launch drafted your Venture One-Pager to clipboard for Google Docs!');
      logSync('launch','gdocs','WRITE',`Launch generated ex-Google BD One-Pager for "${actV?actV.name:'Steady'}" in Google Docs.`);
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
      const subj=`Quick BD / Partnership question — ${actV?actV.name:'Steady'}`;
      const body=`Hi [Name],\n\nHope you're doing well! Coming from my time in Business Development & Partnerships at Google, I'm currently building ${actV?actV.name:'a new venture'} here in Palm Springs.\n\nNext milestone I'm executing this week: ${actV?actV.next:'validating with 5 leaders'}.\n\nWould love 12 minutes this week to get your perspective or explore a partnership angle.\n\nBest,\n[Your Name]`;
      const url=`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      logSync('launch','gmail','WRITE',`Launch drafted warm ex-Google BD outreach email in Gmail for "${actV?actV.name:'Steady'}".`);
      window.open(url,'_blank','noopener');
      render();
      break;
    }
    case 'gmail_read_deals':{
      logSync('scout','gmail','READ',`Scout scanned Gmail (${c.account}) for Slickdeals price alerts, B-Stock liquidator manifests & eBay sold receipts.`);
      state.tasks.push({id:rid(),agent:'scout',title:'Review Gmail Slickdeals & Liquidator manifest digest (2 high-ROI matches)',done:false,ts:Date.now()});
      save();render();
      toast('Scout scanned Gmail alerts and added a task.');
      break;
    }
    case 'imessage_wife':{
      const phone=(c.account||'').replace(/[^\d+]/g,'');
      const r=RECIPES.find(x=>x.id===state.mealPlan[['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]])||RECIPES[0];
      const txt=`Hey love ❤️ Checking in from my Steady dashboard — planning ${r.name} (${r.protein}g protein) for dinner tonight and 4:00 PM sports with the kids. Need anything while I'm out?`;
      logSync('circle','imessage','WRITE',`Circle prepared iMessage check-in to your wife with tonight's dinner (${r.name}) & 4pm kids plan.`);
      window.location.href=`sms:${phone}?&body=${encodeURIComponent(txt)}`;
      render();
      break;
    }
    case 'imessage_sports':{
      const phone=(c.account||'').replace(/[^\d+]/g,'');
      const txt=`Hey! Up for 9 holes of twilight golf or pickleball in Palm Springs at 4:00 PM today? Bringing my 12yo son too.`;
      logSync('circle','imessage','WRITE',`Circle launched Apple Messages sports invite (Golf / Pickleball).`);
      window.location.href=`sms:${phone}?&body=${encodeURIComponent(txt)}`;
      render();
      break;
    }
    case 'whatsapp_family':{
      const phone=(c.account||'').replace(/[^\d]/g,'');
      const txt=`Sveiki! Family update from Palm Springs 🌴 Making Biezpiena Plācenīši with the kids (12 and 7) and playing pickleball at 4pm!`;
      logSync('circle','whatsapp','WRITE',`Circle launched WhatsApp message for wife & family in Latvia.`);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(txt)}`,'_blank','noopener');
      render();
      break;
    }
    case 'whatsapp_bd':{
      const phone=(c.account||'').replace(/[^\d]/g,'');
      const txt=`Hey! Following up on our partnership chat — moving ${actV?actV.name:'our pilot'} forward today. Free for a quick 10-min call?`;
      logSync('launch','whatsapp','WRITE',`Launch opened WhatsApp partner follow-up thread.`);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(txt)}`,'_blank','noopener');
      render();
      break;
    }
    case 'fb_listing_write':{
      const f=state.flips[0]||{item:'Brand New / Open Box Gear',sell:350};
      const copy=`🌴 PALM SPRINGS LOCAL PICKUP OR FAST SHIP 🌴\nItem: ${f.item}\nPrice: $${f.sell} (Cash / Venmo / Verified Reseller)\nCondition: Tested & ready. Message for quick pickup in Palm Springs (92262).`;
      copyText(copy,'Scout copied Facebook Marketplace listing & seller script to clipboard!');
      logSync('scout','facebook','WRITE',`Scout generated & copied FB Marketplace listing for "${f.item}" ($${f.sell}).`);
      render();
      break;
    }
    case 'fb_marketplace_read':{
      const h=state.hunts[0]||{item:'Breville Espresso',maxBuy:400};
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
        const c=getConn(x.svc),svc=getSvc(x.svc);
        return `<button class="btn sm ${c.linked?'':'sun'}" type="button" data-act="agent-int" data-svc="${x.svc}" data-agent="${agentId}" data-op="${x.op}" data-key="${x.key}">
          ${c.linked?'✓':'⚡ Link &'} ${esc(x.label)} <span class="mono small" style="opacity:.75">[${esc(x.op)}]</span>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

/* ---------- Chief of Staff Intelligence Engine ---------- */
function buildChiefReply(qText){
  const k=dkey(),n=slotNow(),b=getBig3(k),w=week();
  const actV=state.ventures.find(v=>v.active)||state.ventures[0];
  const prot=state.protein[k]||0,soc=state.social[k]||0;
  const todayPnl=state.trades.filter(t=>t.date===k).reduce((a,x)=>a+(+x.pnl||0),0);
  const netFlip=state.flips.reduce((a,f)=>a+((+f.sell||0)-(+f.buy||0)-(+f.fees||0)),0);
  const s=qText.toLowerCase();

  let reply='',issued=[];
  if(s.includes('morning')||s.includes('brief')){
    reply=`Good morning in Palm Springs. Here is your Chief of Staff gameplan:\n\n`+
      `1. **Mindset & Body (Spark + Body):** Complete your Morning Ignition Gate if you haven't yet. Target **180g+ protein** today (currently ${prot}g) and get your workout done before the desert heat climbs.\n`+
      `2. **Morning Market Window (Ticker):** Market opens at 6:30 AM PT. You have a hard stop at **${state.tradeRules.stopTime} AM** and a max of ${state.tradeRules.maxTrades} A+ setups. Do not let chart-watching bleed into your 9:00 AM revenue block.\n`+
      `3. **Income & Partnerships (Launch + Scout):** Active venture is **${actV?actV.name:'Steady'}**. Your #1 move at 9:00 AM: *${actV?actV.next:'Reach out to 3 Google BD contacts'}*. At 11:00 AM, Scout has a strict 45-min cap for reseller deal hunting.\n`+
      `4. **Family & Sports (Circle):** 4:00 PM is locked for your 12yo son and 7yo daughter, followed by a phone-free family dinner with your wife.`;
    issued=[
      {agent:'spark',title:'Complete Morning Reaffirmation & 2-min Breathing Gate'},
      {agent:'ticker',title:'Enforce 8:00 AM PT hard stop after morning trade window'},
      {agent:'launch',title:'Send 3 warm outreach messages using Google BD background'}
    ];
  } else if(s.includes('trade')||s.includes('market')||s.includes('stock')){
    reply=`**Ticker Risk Desk Check-In:**\n`+
      `• Today's Net P&L: **$${todayPnl}** (Max daily loss guardrail: -$${state.tradeRules.maxLoss}).\n`+
      `• Watchlist focus: ${state.watchlist.map(w=>w.sym+' ('+w.bias+')').join(', ')}.\n`+
      `• **ADHD Trading Rule:** Boredom is not a signal. Verify all 3 Pre-Trade Checklist boxes on the Markets tab before clicking buy, and close your brokerage tab at **${state.tradeRules.stopTime} AM PT** sharp so you can build your business.`;
    issued=[{agent:'ticker',title:'Log opening setup thesis and close brokerage at 8:00 AM PT'}];
  } else if(s.includes('stuck')||s.includes('paralysis')||s.includes('phone')||s.includes('scroll')){
    const trig=TRIGGERS[Math.floor(Math.random()*TRIGGERS.length)];
    reply=`**Pattern Interrupt (Anchor + Shield + Spark):**\n`+
      `Zero guilt—your ADHD brain is just looking for cheap dopamine. Let's flip the switch in 90 seconds:\n\n`+
      `1. **Physical Reset:** Stand up right now, drink a glass of water, and do 15 pushups or air squats.\n`+
      `2. **Action Trigger:** ${trig}\n`+
      `3. **Right Now Block:** *${n.cur.title}*. Start a 25-minute Focus Timer on the Today tab and park every stray idea in the Parking Lot.`;
    issued=[{agent:'anchor',title:'Run a 25-minute single-task Focus Timer right now'}];
  } else if(s.includes('deal')||s.includes('flip')||s.includes('resell')||s.includes('marketplace')){
    reply=`**Scout Arbitrage & Reseller Brief:**\n`+
      `Your active flip pipeline has **$${netFlip} in projected net profit** across ${state.flips.length} items.\n\n`+
      `• **Rule #1:** Deal hunting on FB Marketplace, OfferUp, eBay, and Slickdeals happens inside a **45-minute timer** so it stays a profit center, not a 3-hour distraction.\n`+
      `• **Rule #2:** Before buying anything with your reseller license, plug the Buy Price + Fees into the Scout ROI Calculator and aim for **40%+ ROI** or **$75+ net profit per item**.\n`+
      `• **Next Step:** Photograph and list any item sitting in your garage before hunting for new inventory.`;
    issued=[{agent:'scout',title:'List 1 item in inventory or run a 25-min timed deal sweep'}];
  } else if(s.includes('diy')||s.includes('home')||s.includes('car')||s.includes('project')){
    const p=state.projects[0];
    reply=`**Wrench DIY Project Guide:**\n`+
      `Active Project: **${p?p.title:'Home & Auto Maintenance'}** (Estimated savings vs. shop quote: **$${p?p.estSave:150}**).\n\n`+
      `• **Before picking up a tool:** Confirm every item in the Parts & Tools list is on the workbench so you don't lose 2 hours driving to the hardware/auto store mid-job.\n`+
      `• Open the Home & Auto tab to launch the exact YouTube tutorial and check off the next step.`;
    issued=[{agent:'wrench',title:'Verify parts/tools and complete the next step on '+(p?p.title:'active DIY project')}];
  } else if(s.includes('family')||s.includes('sport')||s.includes('kid')||s.includes('wife')){
    const idea=FAMILY_IDEAS[Math.floor(Math.random()*FAMILY_IDEAS.length)];
    reply=`**Circle Family & Sports Plan:**\n`+
      `Tonight's recommended bonding activity: **${idea.title}** (${idea.sport} · ${idea.time}).\n`+
      `• *How to run it:* ${idea.note}\n`+
      `• *With your wife:* Ask her what she's most looking forward to this week over evening tea, and put all phones in the basket at 6:30 PM dinner.`;
    issued=[{agent:'circle',title:idea.title+' at 4:00 PM'}];
  } else {
    const doneSteps=SLOTS.filter(x=>(state.checks[k]||{})[x.id]).length;
    reply=`**Chief Status Check (${fmtMin(nowMin())}):**\n`+
      `• **Schedule:** ${doneSteps} of ${SLOTS.length} daily blocks completed. Current block: **${n.cur.title}**.\n`+
      `• **Big 3:** ${b.filter(x=>x.t).length?b.map((x,i)=>`#${i+1} ${x.t||'unset'}${x.done?' (Done)':''}`).join(' · '):'Not locked yet—fill in your Big 3 on Today.'}\n`+
      `• **Discipline:** ${state.focus[k]||0} focus mins logged · ${soc}/${state.budget}m social media budget · ${prot}g protein logged.\n`+
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
  const k=dkey(),prot=state.protein[k]||0,actV=state.ventures.find(v=>v.active)||state.ventures[0];
  const nudges={
    anchor:`Right now is "${slotNow().cur.title}". Set a 25-minute timer, close extra browser tabs, and put your phone face-down across the room.`,
    spark:`Read this out loud: "${AFFIRMATIONS[Math.floor(Math.random()*AFFIRMATIONS.length)]}" Now take 3 deep breaths and start for just 120 seconds.`,
    body:`You are at ${prot}g of your 180g protein goal today. Grab 40g of protein (Greek yogurt, cottage cheese, eggs, or shake) and 16oz of water right now.`,
    ticker:`Check the clock: if it's past ${state.tradeRules.stopTime} AM PT, your edge is gone for the day. Log your morning setups and shift to building your business.`,
    scout:`Stick to high-margin flips (40%+ ROI). Spend 15 minutes photographing and cross-posting 1 item to FB Marketplace, OfferUp, and eBay before browsing new deals.`,
    wrench:`Check your active DIY project parts list first. Watch the 5-minute YouTube walkthrough before turning the first wrench so the job finishes clean.`,
    launch:`Your Google BD superpower is relationship velocity. Message 2 former partners or founders right now with a specific, helpful question.`,
    circle:`Lock in 4:00 PM sports with your 12yo son and 7yo daughter, and surprise your wife by prepping tonight's high-protein dinner early.`
  };
  state.nudges[id]={t:nudges[id]||'Stay locked on your next 10-minute action.',ts:Date.now()};
  save();render();
  toast(AG[id].name+' sent a nudge.');
}

/* ---------- Morning Ignition Modal (Forced Wake-up Ritual) ---------- */
let breathInterval=null;
function openMorningModal(){
  const k=dkey(),m=state.morningDone[k]||{aff:false,ref:'',breath:false};
  const aff=AFFIRMATIONS[new Date().getDate()%AFFIRMATIONS.length];
  const refQ=REFLECTIONS[new Date().getDate()%REFLECTIONS.length];
  const b=getBig3(k);
  const root=$('#modalRoot');
  root.innerHTML=`
    <div class="modal-backdrop" id="mBackdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle">
        <div class="hd">
          <div>
            <p class="eyebrow">Spark · Forced Morning Ritual</p>
            <h2 id="mTitle">Palm Springs Morning Ignition</h2>
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
              <p class="hint small">Inhale 4s · Hold 4s · Exhale 4s — calm the ADHD nervous system.</p>
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
          <input type="text" id="mB1" value="${esc(b[0].t)}" placeholder="e.g., Message 5 Google BD contacts &amp; list 2 reseller flips">
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
