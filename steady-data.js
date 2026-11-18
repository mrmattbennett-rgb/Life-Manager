/* ---------- Helpers ---------- */
const $=(s,r)=>(r||document).querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const pad=n=>String(n).padStart(2,'0');
const dkey=d=>{d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
const wkey=d=>{d=d||new Date();const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return dkey(x);};
const mins=t=>{const p=t.split(':');return (+p[0])*60+(+p[1]);};
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes();};
const fmtMin=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60);return (h%12||12)+':'+pad(m%60)+(h>=12?' pm':' am');};
const fmtClock=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return pad(Math.floor(s/60))+':'+pad(s%60);};
const clip=(s,n)=>s.length>n?s.slice(0,n-1).trimEnd()+'…':s;
const timeAgo=ts=>{const m=Math.round((Date.now()-ts)/60000);if(m<1)return 'just now';if(m<60)return m+'m ago';const h=Math.round(m/60);if(h<24)return h+'h ago';return new Date(ts).toLocaleDateString('en-US',{month:'short',day:'numeric'});};
const clockOf=ts=>new Date(ts).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});

/* ---------- Agent Network Definition ---------- */
const ORDER=['anchor','spark','body','ticker','scout','wrench','launch','circle'];
const AG={
  chief:{name:'Chief',role:'Chief of Staff & Orchestrator'},
  anchor:{
    name:'Anchor',role:'Structure, Calendar & Focus Shield',
    owns:'Wake-to-bed Palm Springs schedule, Big 3, Focus Timer, Social Media Budget, and distraction Parking Lot.',
    watches:'Steps skipped, social media drift, unscheduled rabbit holes, and evening wind-down.',
    style:'Calm, firm executive assistant. Break blocks into a 2-minute start.'
  },
  spark:{
    name:'Spark',role:'Morning Motivation, Reflection & Reaffirmation',
    owns:'Forced morning wake-up ritual, daily reaffirmations, self-reflection journal, and ADHD ignition triggers.',
    watches:'Morning resistance, negative self-talk, task paralysis, and daily wins.',
    style:'Grounded, energizing coach. Remind him of his kids, his Latvian wife, and his mission to build and help others.'
  },
  body:{
    name:'Body',role:'Workouts, High-Protein Meals & Grocery List',
    owns:'Forced wellbeing exercises, desert workouts, protein-focused recipes, weekly meal plan, and aisle-sorted grocery list.',
    watches:'Protein intake (180g+ target), hydration in Palm Springs heat, daily workout completion, and sleep.',
    style:'Practical trainer & nutritionist. High-protein early, zero friction recipes, family-friendly dinners.'
  },
  ticker:{
    name:'Ticker',role:'Morning Stock Market Insights & Trade Discipline',
    owns:'West Coast morning market window (6:30–8:30 AM PT), watchlist catalysts, pre-trade ADHD impulse checklist, and trade journal.',
    watches:'Overtrading past 8:30 AM PT, revenge/dopamine trades, position sizing, and daily P&L discipline.',
    style:'Disciplined risk manager. Protect capital, enforce the 8:30 AM hard stop, demand a clear thesis before entry.'
  },
  scout:{
    name:'Scout',role:'Deal Hunter, Reseller & Affiliate Engine',
    owns:'Hunting Facebook Marketplace, OfferUp, eBay, wholesale liquidators, and Slickdeals; reseller ROI calculator and flip inventory.',
    watches:'Target buy prices, profit margins after fees, unlisted inventory sitting in the garage, and time-box limits on deal hunting.',
    style:'Sharp arbitrageur. Turn deal-hunting into structured profit with your reseller license—never mindless scrolling.'
  },
  wrench:{
    name:'Wrench',role:'Home & Auto DIY Project Guide',
    owns:'Home and car maintenance projects, AI + YouTube step-by-step repair guides, tool/part lists, and sweat-equity savings.',
    watches:'Half-finished house projects, missing parts before starting, and safety steps.',
    style:'Master DIY mechanic & contractor. Verify tools and parts first, link the exact YouTube search, finish one project before starting another.'
  },
  launch:{
    name:'Launch',role:'Business Execution & Partnerships',
    owns:'One active venture rule, leveraging Google BD/Sales/Partnerships network, weekly outreach, and reseller/consulting cashflow.',
    watches:'Idea-hopping, outreach conversations completed, deliverables shipped, and monthly income.',
    style:'VP of Business Development. Turn relationships into offers, pilot customers, and revenue.'
  },
  circle:{
    name:'Circle',role:'Family Bonding & Sports Planner',
    owns:'Quality time with your wife (from Latvia), son (12), and daughter (7); sports (golf, pickleball, tennis, football, bowling, basketball).',
    watches:'Phone-free family dinners, daughter’s bedtime story, sports with your son, and weekly date night.',
    style:'Warm family architect. Suggest specific Palm Springs activities, sports games, and meaningful questions.'
  }
};

/* ---------- Daily Schedule (Palm Springs Rhythm) ---------- */
const SLOTS=[
  {id:'wake',t:'06:00',title:'Wake up, hydration & Morning Ignition Gate',detail:'No social feeds. Drink 16oz water + electrolytes. Complete Spark reaffirmation, reflection & 2-min breathing.',agent:'spark'},
  {id:'market',t:'06:30',title:'Morning Market Open & Structured Trade Window',detail:'US Market opens 6:30 AM PT. Check Ticker watchlist, run pre-trade checklist, max 2 A+ setups. Hard stop at 8:00 AM.',agent:'ticker',deep:true},
  {id:'workout',t:'07:45',title:'Forced Workout & Desert Morning Light',detail:'40-min strength, conditioning, or court movement before the Palm Springs heat rises.',agent:'body'},
  {id:'breakfast',t:'08:30',title:'High-Protein Breakfast (50g+ protein) & Big 3',detail:'Eggs, cottage cheese, or protein shake. Lock in today’s Big 3 outcomes with Anchor.',agent:'body'},
  {id:'deep1',t:'09:00',title:'Deep Block 1: Business Execution & Google BD Outreach',detail:'Phone out of reach. 5 high-value outreach messages or ship the next piece of your active venture.',agent:'launch',deep:true},
  {id:'reset1',t:'10:45',title:'10-Minute Dopamine Reset & Mobility',detail:'Pushups, stretch, cold water, empty stray thoughts into the Parking Lot.',agent:'anchor'},
  {id:'deals',t:'11:00',title:'Time-Boxed Deal Hunt / Reseller & Flip Ops',detail:'45-min cap: check Scout targets on FB Marketplace, OfferUp, eBay, Slickdeals, or list 2 items with your reseller license.',agent:'scout',deep:true},
  {id:'lunch',t:'12:00',title:'High-Protein Lunch (55g protein) — Screen-Free',detail:'Chicken, steak, or salmon bowl. Eat away from the desk.',agent:'body'},
  {id:'deep2',t:'13:00',title:'Deep Block 2: Build, Partnership Calls or Client Work',detail:'Move your primary venture or consulting pipeline one stage forward.',agent:'launch',deep:true},
  {id:'diy',t:'14:30',title:'Home / Auto DIY Maintenance or Admin Sprint',detail:'Tackle 1 Wrench checklist step (using AI + YouTube guide) or clear household admin.',agent:'wrench'},
  {id:'scroll',t:'15:30',title:'Scheduled Social Media Window (Inside Budget)',detail:'Guilt-free scroll or sports highlights inside your Shield timer budget.',agent:'anchor'},
  {id:'family_sport',t:'16:00',title:'Kids Pickup & Sports / Family Bonding',detail:'Golf, pickleball, basketball, football, or tennis with your 12yo son & 7yo daughter.',agent:'circle'},
  {id:'dinner_prep',t:'17:45',title:'High-Protein Family Dinner Prep',detail:'Cook today’s Body recipe with your wife and kids. Phones go in the basket.',agent:'body'},
  {id:'dinner',t:'18:30',title:'Family Dinner — Highs, Lows & Laughs',detail:'Ask everyone for one win and one funny moment from today.',agent:'circle'},
  {id:'bed_daughter',t:'19:45',title:'7yo Daughter Bedtime & Story',detail:'Full presence—bath, reading, lights down.',agent:'circle'},
  {id:'wife_son',t:'20:15',title:'Check-in with 12yo Son & Tea with Your Wife',detail:'1-on-1 chat with your son, then unwind and connect with your wife.',agent:'circle'},
  {id:'debrief',t:'21:00',title:'Chief Evening Debrief & Tomorrow’s Lock',detail:'Log wins, review trade/deal discipline, clear Parking Lot, set tomorrow’s Big 3.',agent:'anchor'},
  {id:'lights',t:'21:45',title:'Phone on Charger Outside Bedroom & Lights Out',detail:'Protect sleep so tomorrow’s 6:00 AM wake-up is automatic.',agent:'body'}
];

/* ---------- High-Protein Recipes & Meal Plan Data ---------- */
const RECIPES=[
  {
    id:'r1',name:'Desert Power Steak & Egg Skillet',slot:'Breakfast / Post-Workout',protein:58,cals:610,prep:'12 min',
    ingredients:[
      {item:'Top sirloin or flank steak (6 oz)',cat:'Meat & Seafood'},
      {item:'Whole pasture-raised eggs (3 large)',cat:'Dairy & Eggs'},
      {item:'Low-fat cottage cheese (1/2 cup)',cat:'Dairy & Eggs'},
      {item:'Baby spinach (2 cups)',cat:'Produce'},
      {item:'Cherry tomatoes (1/2 cup)',cat:'Produce'},
      {item:'Avocado (1/2 medium)',cat:'Produce'}
    ],
    steps:'Sear seasoned steak cubes in cast iron 4 min. Toss in spinach & tomatoes for 1 min, crack 3 eggs alongside, serve with cold cottage cheese and sliced avocado.'
  },
  {
    id:'r2',name:'Latvian-Style High-Protein Biezpiena Plācenīši (Cottage Cheese Pancakes)',slot:'Family Breakfast',protein:46,cals:520,prep:'15 min',
    ingredients:[
      {item:'Farmer’s cheese or dry-curd cottage cheese (1.5 cups)',cat:'Dairy & Eggs'},
      {item:'Eggs (2 large)',cat:'Dairy & Eggs'},
      {item:'Vanilla whey or casein protein powder (1 scoop)',cat:'Pantry'},
      {item:'Oat flour (1/3 cup)',cat:'Pantry'},
      {item:'Plain Greek yogurt 0% (1/2 cup topping)',cat:'Dairy & Eggs'},
      {item:'Fresh berries (1 cup)',cat:'Produce'}
    ],
    steps:'Mash cottage cheese with eggs, protein powder, and oat flour. Pan-fry golden patties in a light brush of butter/oil 3 min per side. Top with Greek yogurt and berries—a hit with your wife and kids.'
  },
  {
    id:'r3',name:'Chipotle Lime Grilled Chicken & Quinoa Power Bowl',slot:'Lunch',protein:62,cals:640,prep:'18 min',
    ingredients:[
      {item:'Chicken breast (8 oz raw)',cat:'Meat & Seafood'},
      {item:'Cooked quinoa or jasmine rice (3/4 cup)',cat:'Pantry'},
      {item:'Black beans (1/2 cup rinsed)',cat:'Pantry'},
      {item:'Greek yogurt chipotle crema (2 tbsp)',cat:'Dairy & Eggs'},
      {item:'Romaine lettuce & cilantro (2 cups)',cat:'Produce'},
      {item:'Bell peppers & red onion (1 cup sliced)',cat:'Produce'}
    ],
    steps:'Grill diced chipotle-lime chicken breast with peppers and onions. Layer over warm quinoa and black beans, top with crisp romaine and Greek yogurt crema.'
  },
  {
    id:'r4',name:'Wild Salmon, Crispy Potatoes & Lemon-Dill Asparagus',slot:'Family Dinner',protein:54,cals:630,prep:'22 min',
    ingredients:[
      {item:'Wild salmon fillets (4 x 6 oz for family)',cat:'Meat & Seafood'},
      {item:'Baby gold potatoes (1.5 lbs halved)',cat:'Produce'},
      {item:'Fresh asparagus spears (2 bunches)',cat:'Produce'},
      {item:'Fresh dill & lemons (1 bunch / 2 lemons)',cat:'Produce'},
      {item:'Extra virgin olive oil & garlic',cat:'Pantry'}
    ],
    steps:'Roast halved baby potatoes at 425°F for 15 min, add salmon and asparagus seasoned with lemon, garlic, and plenty of fresh dill for 10–12 min until flaky.'
  },
  {
    id:'r5',name:'Baltic Herb Chicken Shashlik Skewers & Cucumber Salad',slot:'Family Grill Dinner',protein:64,cals:580,prep:'25 min',
    ingredients:[
      {item:'Chicken breast & thigh chunks (2 lbs family pack)',cat:'Meat & Seafood'},
      {item:'Kefir or Greek yogurt marinade (1 cup)',cat:'Dairy & Eggs'},
      {item:'English cucumbers (2 large)',cat:'Produce'},
      {item:'Fresh dill & green onions (1 bunch each)',cat:'Produce'},
      {item:'Pita flatbreads or rice (4 count)',cat:'Pantry'}
    ],
    steps:'Marinate chicken in kefir/yogurt, garlic, onion, and black pepper. Grill skewers outdoors in the evening, serve with creamy dill-cucumber salad.'
  },
  {
    id:'r6',name:'Double-Protein Smash Burger Bowls',slot:'Quick Dinner / Post-Sports',protein:60,cals:660,prep:'15 min',
    ingredients:[
      {item:'93/7 Lean ground beef (2 lbs family pack)',cat:'Meat & Seafood'},
      {item:'Reduced-fat sharp cheddar slices (4 slices)',cat:'Dairy & Eggs'},
      {item:'Shredded iceberg lettuce & pickles (1 bag / 1 jar)',cat:'Produce'},
      {item:'Sweet potato fries (1 frozen bag)',cat:'Produce'},
      {item:'Sugar-free burger sauce / mustard',cat:'Pantry'}
    ],
    steps:'Crisp lean beef patties on hot griddle, melt cheddar, serve over chopped lettuce, tomatoes, and pickles with air-fried sweet potato wedges.'
  }
];

const WORKOUTS=[
  {id:'w1',name:'Desert Morning Strength & Core (40 min)',focus:'Compound lifts + ADHD dopamine primer',blocks:['5 min brisk outdoor walk + arm circles','4x10 Dumbbell Goblet Squats + Pushups superset','4x10 Dumbbell Rows + Overhead Press','3x45s Plank + Farmer Carries','2 min cold water face splash / shower finish']},
  {id:'w2',name:'Court Agility & Pickleball / Tennis Footwork (35 min)',focus:'Lateral speed, shoulder health, cardio',blocks:['5 min jump rope or light jog','6x20 yd lateral court shuffles + split-step drills','3x12 Resistance band external rotations (shoulder saver)','3x15 Walking lunges + medicine ball twists','10 min shadow serves or wall volleys']},
  {id:'w3',name:'10-Minute ADHD Emergency Reset',focus:'Instant blood-flow when stuck or pulled into phone',blocks:['Drink 12oz water immediately','30 Air squats + 20 Pushups','60-second dead hang or doorway chest stretch','Box breathing (4-4-4-4) for 4 cycles']}
];

const AFFIRMATIONS=[
  'I am a builder, a present father and husband, and I finish what I start today.',
  'My Google partnerships experience is an unfair advantage—every conversation creates momentum.',
  'Structure is not a cage; structure is what gives me freedom to enjoy my family and sports.',
  'I do not chase dopamine in bad trades or endless feeds; I earn it by shipping real value.',
  'My 12-year-old son and 7-year-old daughter learn resilience by watching how I show up today.'
];

const REFLECTIONS=[
  'What is the ONE outcome today that would make tonight’s family dinner feel completely earned?',
  'Where did my attention leak yesterday, and what rule will Anchor & Shield enforce today?',
  'Who is one person from my network I can genuinely help or reconnect with before noon?',
  'If I try to do 10 things today I will do zero. What am I consciously saying NO to today?'
];

const TRIGGERS=[
  'Set a 2-minute timer and only open the document. Starting is 80% of the battle.',
  'Stand up, drink a full glass of water, do 15 pushups, then do the smallest next step.',
  'Put your phone on the kitchen counter and bring only your laptop for 25 minutes.',
  'Tell your son or wife what you are finishing in the next 45 minutes so you have accountability.',
  'Write the rough, ugly version in 10 minutes. You can polish it after it exists.'
];

const FAMILY_IDEAS=[
  {id:'f1',title:'Sunset Pickleball Doubles at Demuth or Ruth Hardy Park',who:'Whole Family',sport:'Pickleball',time:'60 min',note:'You + 12yo son vs. Wife + 7yo daughter (with fun handicap rules for your 7yo).'},
  {id:'f2',title:'9-Hole Twilight Executive Golf / Driving Range Challenge',who:'Son (12)',sport:'Golf',time:'90 min',note:'Closest-to-the-pin chipping contest + talk about his week, school, and friends.'},
  {id:'f3',title:'Backyard / Park Football Route Tree & Catch',who:'Son (12) & Daughter (7)',sport:'Football',time:'45 min',note:'Draw 3 plays in the dirt, run routes, and keep track of consecutive catches.'},
  {id:'f4',title:'Palm Springs Family Bowling Night (Spare Time)',who:'Whole Family',sport:'Bowling',time:'90 min',note:'Beat the desert heat indoors; winner picks the music on the drive home.'},
  {id:'f5',title:'Driveway / Park Basketball HORSE & Free-Throw Streak',who:'Son (12) & Daughter (7)',sport:'Basketball',time:'40 min',note:'Lower hoop or close spots for your 7yo daughter; team goal of 25 made shots.'},
  {id:'f6',title:'Morning Tennis Rally & Serve Target Game',who:'Wife / Son (12)',sport:'Tennis',time:'60 min',note:'Set cones or towels in the service box and play first to 21 points.'},
  {id:'f7',title:'Latvian Pancake & Board Game Evening',who:'Whole Family',sport:'Family Bonding',time:'75 min',note:'Cook Biezpiena Plācenīši together, put all phones in a basket, and play a fast board/card game.'}
];

/* ---------- External App Integrations & Agent Permissions Catalog ---------- */
const INTEGRATIONS=[
  {
    id:'gcalendar',name:'Google Calendar',cat:'Google Workspace',
    agents:['chief','anchor','circle','body'],
    desc:'Read schedule conflicts, write wake-to-bed blocks, workouts & family sports, and modify block times when your day shifts.',
    placeholder:'Primary Google Calendar email (e.g. you@gmail.com)',
    readDesc:'Read existing meetings, kids school events & conflicts',
    writeDesc:'Create Deep Work blocks, Morning Workouts & Family Sports events',
    modDesc:'Auto-shift downstream calendar blocks when schedule shifts ±15m'
  },
  {
    id:'gsheets',name:'Google Sheets',cat:'Google Workspace',
    agents:['ticker','scout','body','launch'],
    desc:'Read stock watchlists & reseller cost basis; write morning trade P&L, flip inventory, monthly BD income, and grocery rows.',
    placeholder:'Google Sheet URL or Account Email',
    readDesc:'Read watchlist levels, inventory cost basis & monthly targets',
    writeDesc:'Append trade journal rows, reseller flips & weekly grocery list',
    modDesc:'Modify flip status (Sourced → Listed → Sold) & update ROI totals'
  },
  {
    id:'gdocs',name:'Google Docs',cat:'Google Workspace',
    agents:['launch','spark','wrench','chief'],
    desc:'Read venture playbooks; write ex-Google BD partnership proposals, morning self-reflections, and DIY project guides.',
    placeholder:'Google Docs Workspace Email or Folder URL',
    readDesc:'Read venture notes, partner templates & DIY repair checklists',
    writeDesc:'Create partnership 1-pagers, reflection logs & Chief summaries',
    modDesc:'Append daily reflection entries & update venture stage milestones'
  },
  {
    id:'gmail',name:'Gmail',cat:'Google Workspace',
    agents:['launch','scout','chief'],
    desc:'Read partner replies, Slickdeals/liquidator alerts & eBay receipts; draft and send warm BD outreach emails.',
    placeholder:'Connected Gmail address (e.g. founder@gmail.com)',
    readDesc:'Scan partner replies, deal alerts & reseller purchase receipts',
    writeDesc:'Draft & send warm outreach emails to ex-Google BD contacts',
    modDesc:'Tag, archive processed deal alerts & schedule follow-up nudges'
  },
  {
    id:'imessage',name:'Apple Messages (iMessage / SMS)',cat:'Apple & Messaging',
    agents:['chief','circle','anchor','launch'],
    desc:'Send morning wake-up nudges, quick texts to your wife and 12yo son, sports invites to friends, and partner follow-ups on iPhone & Mac.',
    placeholder:'Wife / Primary Contact Phone (e.g. +17605550199)',
    readDesc:'Read quick check-in replies via iOS Shortcuts bridge',
    writeDesc:'Launch pre-filled iMessages to wife, family, friends & partners',
    modDesc:'Update task & habit status from quick SMS/iMessage responses'
  },
  {
    id:'whatsapp',name:'WhatsApp',cat:'Messaging & Social',
    agents:['circle','launch','scout'],
    desc:'Message family (including your wife’s family in Latvia), coordinate Palm Springs pickleball/golf groups, and chat with international founders.',
    placeholder:'WhatsApp phone number with country code (e.g. 17605550199)',
    readDesc:'Read family thread updates & local sports group times',
    writeDesc:'Send WhatsApp messages to wife, Latvian family & sports groups',
    modDesc:'Confirm reseller pickup times & update family activity plans'
  },
  {
    id:'facebook',name:'Facebook & Marketplace',cat:'Marketplaces & Social',
    agents:['scout','anchor'],
    desc:'Hunt Palm Springs / Coachella Valley Marketplace deals, message sellers with cash/reseller offers, cross-post inventory, and cap scroll time.',
    placeholder:'Marketplace Zip / Radius (e.g. Palm Springs 92262 · 25 mi)',
    readDesc:'Read local Marketplace listings matching Scout max-buy targets',
    writeDesc:'Publish reseller flip listings & send instant buyer offer messages',
    modDesc:'Mark items Sold, adjust listing prices & enforce Shield scroll cap'
  },
  {
    id:'youtube_ios',name:'YouTube & iOS Reminders',cat:'DIY & Apple Ecosystem',
    agents:['wrench','body'],
    desc:'Pull step-by-step home/auto repair tutorials for Wrench and sync aisle-sorted weekly grocery lists to Apple Reminders.',
    placeholder:'iOS Reminders List Name (e.g. Steady Groceries & DIY)',
    readDesc:'Read saved DIY repair videos & completed reminder items',
    writeDesc:'Push weekly grocery list & DIY parts list to iOS Reminders',
    modDesc:'Check off completed repair steps and shopping items'
  }
];

const VIEWS=[
  {id:'today',label:'Today',icon:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'},
  {id:'chief',label:'Chief',icon:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'},
  {id:'body',label:'Body & Meals',icon:'<path d="M6.5 6.5L17.5 17.5"/><path d="M3 10l7-7M14 21l7-7"/><path d="M2 6l4-4M18 22l4-4"/>'},
  {id:'markets',label:'Markets',icon:'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'},
  {id:'deals',label:'Deals & Flip',icon:'<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'},
  {id:'diy',label:'Home & Auto',icon:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'},
  {id:'launch',label:'Ventures',icon:'<path d="M7 17L17 7M9 7h8v8"/>'},
  {id:'family',label:'Family & Sports',icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'},
  {id:'connect',label:'Integrations',icon:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'},
  {id:'team',label:'Agents & App',icon:'<circle cx="12" cy="6.5" r="3"/><circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/>'}
];

const QUICK={
  morning:{label:'Morning Brief',text:'Give me my Palm Springs morning brief across schedule, markets, workout, and my #1 revenue move.'},
  trade:{label:'Pre-Trade Check',text:'Market is open. Keep me disciplined—review my watchlist and remind me of my trading rules.'},
  stuck:{label:'I’m Stuck (ADHD Reset)',text:'I’m stuck in task paralysis right now. Give me a 2-minute physical + action reset.'},
  phone:{label:'Phone Pulled Me In',text:'I got sucked into scrolling/deal-hunting. Interrupt the loop and put me back on rail.'},
  deals:{label:'Deal / Flip Idea',text:'Help me evaluate a marketplace flip or affiliate product fast without losing my afternoon.'},
  diy:{label:'Home/Car DIY Guide',text:'Break down my active home/auto DIY project into safe, fast steps.'},
  family:{label:'Family & Sports Tonight',text:'Suggest a great activity or sport for my wife, 12yo son, and 7yo daughter this afternoon.'},
  evening:{label:'Evening Debrief',text:'Review my day across all 8 agents, log what worked, and lock tomorrow’s Big 3.'}
};

/* ---------- State Management ---------- */
function defaults(){
  return {
    v:2,updatedAt:0,shift:0,budget:30,
    morningDone:{},
    big3:{},checks:{},social:{},focus:{},week:{},nudges:{},
    wins:[],parking:[],messages:[],tasks:[],
    whys:[
      {id:'w1',t:'My 12yo son and 7yo daughter are watching how I build and handle setbacks.'},
      {id:'w2',t:'Turn my Google BD & Partnerships mastery into my own thriving business.'},
      {id:'w3',t:'Build Steady for myself first, then open it to help millions living with ADHD.'},
      {id:'w4',t:'Financial independence for my wife and family in Palm Springs.'}
    ],whyIdx:0,
    water:{},protein:{},workoutDone:{},
    mealPlan:{
      Mon:'r1',Tue:'r3',Wed:'r4',Thu:'r5',Fri:'r6',Sat:'r2',Sun:'r4'
    },
    groceryChecked:{},
    customGroceries:[],
    tradeRules:{maxTrades:2,maxLoss:250,stopTime:'08:00',checklist:[false,false,false]},
    watchlist:[
      {id:'tk1',sym:'GOOGL',bias:'Long',level:'Break above pre-market high',note:'Cloud & AI partnership momentum; wait for 5-min opening range.'},
      {id:'tk2',sym:'NVDA',bias:'Watch',level:'Key VWAP hold after open',note:'High beta—strict stop loss, half size only.'},
      {id:'tk3',sym:'SPY',bias:'Macro',level:'Opening 15-min range',note:'Gauge broad market trend before taking any individual setup.'}
    ],
    trades:[
      {id:'tr1',date:dkey(),sym:'GOOGL',side:'Long',pnl:185,setup:'Opening range breakout + volume, closed before 7:30 AM PT'}
    ],
    hunts:[
      {id:'h1',item:'Commercial Espresso Machine / Breville Dual Boiler',maxBuy:450,estSell:850,purpose:'Resell Flip',source:'FB Marketplace / OfferUp'},
      {id:'h2',item:'Junior Golf Iron Set (Age 12) + Pickleball Paddles',maxBuy:120,estSell:0,purpose:'Family Gear',source:'OfferUp / eBay'},
      {id:'h3',item:'Return Pallet — Smart Home / Garage Tools',maxBuy:350,estSell:900,purpose:'Reseller License Lot',source:'Wholesale Liquidator'}
    ],
    flips:[
      {id:'fl1',item:'Sonos Arc Soundbar (Open Box Deal)',buy:420,fees:55,sell:680,status:'Listed (FB + eBay)'},
      {id:'fl2',item:'DeWalt Brushless Combo Kit (Slickdeals Arbitrage)',buy:199,fees:28,sell:320,status:'Sold'}
    ],
    projects:[
      {
        id:'p1',title:'SUV 5,000-Mile Synthetic Oil, Cabin & Engine Air Filter Service',cat:'Auto Maintenance',
        ytQuery:'SUV synthetic oil change and cabin air filter DIY step by step',estSave:145,
        parts:'6 qt 0W-20 Full Synthetic Oil, OEM Oil Filter + Crush Washer, Engine & Cabin Air Filters, 14mm socket & torque wrench',
        steps:[
          {t:'Warm engine 3 min, park level, chock rear wheels & set jack stands safely',done:true},
          {t:'Loosen oil fill cap first, drain pan under plug, remove 14mm drain bolt',done:true},
          {t:'Swap oil filter (lubricate gasket), torque drain plug to spec, pour 6 qt oil',done:false},
          {t:'Swap glovebox cabin filter & under-hood air filter (5 min)',done:false}
        ]
      },
      {
        id:'p2',title:'Palm Springs Desert AC Capacitor & Condenser Coil Rinse',cat:'Home HVAC',
        ytQuery:'How to test and replace AC run capacitor and clean condenser coils safely',estSave:280,
        parts:'Dual run capacitor (match uF rating), multimeter, coil cleaner spray, garden hose nozzle, 1/4" nut driver',
        steps:[
          {t:'Pull outdoor disconnect breaker & verify 0 volts with multimeter',done:true},
          {t:'Discharge capacitor terminals safely, photograph wiring before removal',done:false},
          {t:'Install new USA-made capacitor & rinse dust from condenser fins inside-out',done:false}
        ]
      },
      {
        id:'p3',title:'Garage Reseller Inventory Shelving & Photo Station',cat:'Home / Business',
        ytQuery:'Garage heavy duty shelving setup and eBay reselling photo booth DIY',estSave:220,
        parts:'Heavy-duty steel rack (OfferUp deal), LED shop light, white foam board backdrop, label printer shelf',
        steps:[
          {t:'Clear 8ft garage wall and assemble steel rack at waist-high packing level',done:false},
          {t:'Mount 5000K LED light + white backdrop for 2-minute product listing photos',done:false}
        ]
      }
    ],
    ventures:[
      {id:'v1',name:'Steady — AI Chief of Staff for ADHD & Mental Health',stage:1,next:'Run 14-day self-dogfooding in Palm Springs + interview 5 ADHD founders.',active:true},
      {id:'v2',name:'Fractional BD & Strategic Partnerships Advisory (Ex-Google)',stage:2,next:'Send 5 warm outreach messages to Series A/B founders needing tech partnerships.',active:false},
      {id:'v3',name:'Desert Curated Reseller & Deal Affiliate Brand',stage:1,next:'Post 3 high-margin items from this week’s deal hunt + affiliate links.',active:false}
    ],
    targets:{convos:10,shipped:3,flipsListed:5},
    bridge:{goal:'8000',earned:'2450'},
    familyLog:[
      {id:'fl_1',date:dkey(),who:'Son (12) & Daughter (7)',activity:'Twilight Pickleball + Ice Cream',note:'Son hit 12 rally shots in a row; daughter loved keeping score.'}
    ],
    connections:{
      gcalendar:{linked:false,account:'',read:true,write:true,modify:true,lastSync:0},
      gsheets:{linked:false,account:'',read:true,write:true,modify:true,lastSync:0},
      gdocs:{linked:false,account:'',read:true,write:true,modify:true,lastSync:0},
      gmail:{linked:false,account:'',read:true,write:true,modify:false,lastSync:0},
      imessage:{linked:false,account:'',read:true,write:true,modify:true,lastSync:0},
      whatsapp:{linked:false,account:'',read:true,write:true,modify:true,lastSync:0},
      facebook:{linked:false,account:'Palm Springs, CA 92262 (25 mi)',read:true,write:true,modify:true,lastSync:0},
      youtube_ios:{linked:false,account:'Steady Groceries & DIY',read:true,write:true,modify:true,lastSync:0}
    },
    syncLog:[
      {id:'sl1',ts:Date.now()-3600000,agent:'chief',svc:'gcalendar',op:'READ',detail:'Ready to link Google Workspace, Apple Messages, WhatsApp & Facebook so agents can read/write/modify across your apps.'}
    ]
  };
}

function normalize(s){
  const d=defaults(),o=Object.assign({},d,s||{});
  ['morningDone','big3','checks','social','focus','week','nudges','water','protein','workoutDone','mealPlan','groceryChecked','tradeRules','targets','bridge','connections'].forEach(k=>{
    if(!o[k]||typeof o[k]!=='object'||Array.isArray(o[k]))o[k]=d[k];
  });
  INTEGRATIONS.forEach(it=>{
    if(!o.connections[it.id]||typeof o.connections[it.id]!=='object'){
      o.connections[it.id]=Object.assign({},d.connections[it.id]||{linked:false,account:'',read:true,write:true,modify:true,lastSync:0});
    }
  });
  ['wins','parking','messages','tasks','whys','customGroceries','watchlist','trades','hunts','flips','projects','ventures','familyLog','syncLog'].forEach(k=>{
    if(!Array.isArray(o[k]))o[k]=d[k];
  });
  if(!Array.isArray(o.tradeRules.checklist))o.tradeRules.checklist=[false,false,false];
  return o;
}

let state=normalize(loadLocal());
function loadLocal(){try{const r=localStorage.getItem('steady.v2')||localStorage.getItem('steady.v1');return r?JSON.parse(r):null;}catch(e){return null;}}
function saveLocal(){try{localStorage.setItem('steady.v2',JSON.stringify(state));}catch(e){}}
function save(){state.updatedAt=Date.now();saveLocal();setSync();}
function setSync(){const el=$('#sync');if(el)el.textContent='Saved · '+new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});}
