/* ---------- Helpers ---------- */
const $=(s,r)=>(r||document).querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const pad=n=>String(n).padStart(2,'0');
const dkey=d=>{d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
const wkey=d=>{d=d||new Date();const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return dkey(x);};
const mins=t=>{const p=String(t||'06:00').split(':');return (+p[0])*60+(+p[1]||0);};
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes();};
const fmtMin=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60);return (h%12||12)+':'+pad(m%60)+(h>=12?' pm':' am');};
const fmtClock=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return pad(Math.floor(s/60))+':'+pad(s%60);};
const clip=(s,n)=>String(s||'').length>n?String(s||'').slice(0,n-1).trimEnd()+'…':String(s||'');
const timeAgo=ts=>{const m=Math.round((Date.now()-ts)/60000);if(m<1)return 'just now';if(m<60)return m+'m ago';const h=Math.round(m/60);if(h<24)return h+'h ago';return new Date(ts).toLocaleDateString('en-US',{month:'short',day:'numeric'});};
const clockOf=ts=>new Date(ts).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});

/* ---------- Agent Network Definition ---------- */
const ORDER=['anchor','spark','body','ticker','scout','wrench','launch','circle'];
const AG={
  chief:{name:'Chief',role:'Chief of Staff & Orchestrator'},
  anchor:{
    name:'Anchor',role:'Structure, Calendar & Focus Shield',
    owns:'Wake-to-bed daily schedule, Big 3, Focus Timer, Social Media Budget, and distraction Parking Lot.',
    watches:'Steps skipped, social media drift, unscheduled rabbit holes, and evening wind-down.',
    style:'Calm, firm executive assistant. Break blocks into a 2-minute start.'
  },
  spark:{
    name:'Spark',role:'Morning Motivation, Reflection & Reaffirmation',
    owns:'Forced morning wake-up ritual, daily reaffirmations, self-reflection journal, and focus ignition triggers.',
    watches:'Morning resistance, negative self-talk, task paralysis, and daily wins.',
    style:'Grounded, energizing coach. Remind the user of their family, core values, and mission.'
  },
  body:{
    name:'Body',role:'Workouts, High-Protein Meals & Grocery List',
    owns:'Forced wellbeing exercises, tailored workouts, protein-focused recipes, weekly meal plan, and aisle-sorted grocery list.',
    watches:'Daily protein target, hydration, workout completion, and sleep window.',
    style:'Practical trainer & nutritionist. High-protein early, zero-friction recipes, family-friendly dinners.'
  },
  ticker:{
    name:'Ticker',role:'Morning Stock Market Insights & Trade Discipline',
    owns:'Morning market window, watchlist catalysts, pre-trade impulse checklist, and trade P&L journal.',
    watches:'Overtrading past the morning stop time, impulse trades, position sizing, and daily risk limits.',
    style:'Disciplined risk manager. Protect capital, enforce the hard stop time, demand a clear thesis before entry.'
  },
  scout:{
    name:'Scout',role:'Deal Hunter, Reseller & Affiliate Engine',
    owns:'Hunting Facebook Marketplace, OfferUp, eBay, wholesale liquidators, and Slickdeals; ROI calculator and flip inventory.',
    watches:'Target buy prices, profit margins after fees, unlisted inventory, and time-box limits on deal hunting.',
    style:'Sharp arbitrageur. Turn deal-hunting into structured savings or profit—never mindless scrolling.'
  },
  wrench:{
    name:'Wrench',role:'Home & Auto DIY Project Guide',
    owns:'Home and car maintenance projects, AI + YouTube step-by-step repair guides, tool/part lists, and sweat-equity savings.',
    watches:'Half-finished projects, missing parts before starting, and safety steps.',
    style:'Master DIY mechanic & contractor. Verify tools and parts first, link the exact YouTube search, finish one project before starting another.'
  },
  launch:{
    name:'Launch',role:'Business Execution & Career Momentum',
    owns:'One active venture rule, professional outreach, weekly deliverables shipped, and consulting/side income.',
    watches:'Idea-hopping, outreach conversations completed, deliverables shipped, and monthly cashflow.',
    style:'VP of Business Development. Turn relationships and ideas into offers, pilot customers, and revenue.'
  },
  circle:{
    name:'Circle',role:'Family Bonding, Relationships & Sports Planner',
    owns:'Quality time with partner, kids, friends, and favorite sports & bonding activities.',
    watches:'Phone-free family dinners, bedtime routines, outdoor sports, and weekly connection rituals.',
    style:'Warm family architect. Suggest specific activities, sports games, and meaningful conversations.'
  },
  personal:{
    name:'Blocked Time',role:'Personal Obligation (Outside App)',
    owns:'External appointments, kids school events, errands, doctor visits, and off-grid personal commitments.',
    watches:'Protecting blocked personal obligations from work or agent interruptions.',
    style:'Strict calendar guardian.'
  }
};

/* ---------- Program Packs for Public / Multi-User Personalization ---------- */
const PROGRAM_PACKS=[
  {id:'ADHD Focus & Structure',desc:'High-structure wake-to-bed timeline, Morning Ignition Gate, 2-minute task triggers, social media shield, and single-venture focus.'},
  {id:'Anxiety & Overwhelm Reset',desc:'Box breathing & grounding rituals, cognitive-offload parking lot, gentle micro-steps, and evening screen wind-down.'},
  {id:'Career & Entrepreneur Launch',desc:'Daily outreach blocks, venture stage tracker, morning market/deal discipline, and monthly cashflow scoreboard.'},
  {id:'Health, High-Protein & Family Balance',desc:'Automated high-protein meal planning, aisle-sorted weekly grocery list, daily workouts, and family sports scheduling.'}
];

const DAY_NAMES=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* ---------- Logical Gap-Filler Pool (Auto-Fills Vacated or Off-Day Time Slots) ---------- */
const GAP_POOL=[
  {id:'gf_weekend_morn',minStart:360,minEnd:510,title:'Weekend Morning Mobility, Coffee & Family Slow Start',detail:'Markets are closed—enjoy a screen-free morning walk, stretch, and coffee with your partner and kids.',agent:'circle'},
  {id:'gf_morn_strategy',minStart:360,minEnd:540,title:'Venture Strategy, Weekly Review & Deep Reading',detail:'Use this open morning window for high-leverage thinking, book/industry reading, or refining your #1 venture offer.',agent:'launch'},
  {id:'gf_mid_outreach',minStart:540,minEnd:750,title:'Warm Network Follow-Ups & Pipeline Builder',detail:'Send 3 quick voice notes or messages to partners, founders, or clients and log them on the Ventures tab.',agent:'launch'},
  {id:'gf_aft_recovery',minStart:750,minEnd:990,title:'Active Recovery, Practice Drill or Parking Lot Sprint',detail:'No DIY scheduled today—get 30 mins of pickleball/golf/court practice or clear 3 items from your distraction Parking Lot.',agent:'body'},
  {id:'gf_eve_connect',minStart:990,minEnd:1350,title:'Unplugged Family & Personal Recharge Window',detail:'Phones away—board games, evening walk, or 1-on-1 conversation at home.',agent:'circle'}
];

/* ---------- Daily Schedule Template ---------- */
const SLOTS=[
  {id:'wake',t:'06:00',dur:30,days:[0,1,2,3,4,5,6],title:'Wake up, hydration & Morning Ignition Gate',detail:'No social feeds. Drink 16oz water. Complete Spark reaffirmation, reflection & 60s breathing.',agent:'spark'},
  {
    id:'market',t:'06:30',dur:75,days:[1,2,3,4,5],
    title:'Morning Market Open & Structured Trade Window',
    detail:'Weekdays only (Mon–Fri). Check Ticker watchlist, run pre-trade checklist, max 2 A+ setups. Hard stop at 8:00 AM.',
    agent:'ticker',deep:true,
    fallback:{title:'Weekend Morning Mobility, Coffee & Family Slow Start',detail:'Stock market is closed on weekends—enjoy morning light, mobility, and coffee with family.',agent:'circle'}
  },
  {id:'workout',t:'07:45',dur:45,days:[0,1,2,3,4,5,6],title:'Forced Workout & Morning Sunlight',detail:'40-min strength, conditioning, or court movement to prime energy and focus.',agent:'body'},
  {id:'breakfast',t:'08:30',dur:30,days:[0,1,2,3,4,5,6],title:'High-Protein Breakfast (50g+ protein) & Big 3',detail:'Eggs, cottage cheese, Greek yogurt, or shake. Lock in today’s Big 3 outcomes with Anchor.',agent:'body'},
  {id:'deep1',t:'09:00',dur:105,days:[0,1,2,3,4,5,6],title:'Deep Block 1: #1 Venture / Career Revenue Action',detail:'Phone out of reach. Send 5 high-value outreach messages or ship the next piece of your active venture.',agent:'launch',deep:true},
  {id:'reset1',t:'10:45',dur:15,days:[0,1,2,3,4,5,6],title:'10-Minute Movement & Dopamine Reset',detail:'Pushups, walk, cold water, empty stray thoughts into the Parking Lot.',agent:'anchor'},
  {
    id:'deals',t:'11:00',dur:60,days:[1,2,3,4,5,6],
    title:'Time-Boxed Deal Hunt / Reseller & Flip Ops',
    detail:'45-min cap: check Scout targets on FB Marketplace, OfferUp, eBay, Slickdeals, or list inventory.',
    agent:'scout',deep:true,
    fallback:{title:'Sunday Family Outing Prep & Weekly Meal/Grocery Lock',detail:'Review Body weekly meal plan and prep for an unplugged Sunday afternoon with family.',agent:'body'}
  },
  {id:'lunch',t:'12:00',dur:60,days:[0,1,2,3,4,5,6],title:'High-Protein Lunch (55g protein) — Screen-Free',detail:'Chicken, steak, salmon, or tuna bowl. Eat away from the desk.',agent:'body'},
  {id:'deep2',t:'13:00',dur:90,days:[1,2,3,4,5],title:'Deep Block 2: Build, Partnership Calls or Execution',detail:'Move your primary venture or project one tangible stage forward.',agent:'launch',deep:true,
    fallback:{title:'Weekend Family Adventure / Sports Match',detail:'Extended weekend window for golf, pickleball, desert hike, or pool time with the family.',agent:'circle'}
  },
  {
    id:'diy',t:'14:30',dur:60,days:[2,4,6],
    title:'Home / Auto DIY Project or Household Sprint',
    detail:'Scheduled Tue / Thu / Sat: tackle 1 Wrench checklist step (using AI + YouTube guide).',
    agent:'wrench',
    fallback:{title:'Active Recovery, Sports Practice or Pipeline Follow-Up',detail:'Non-DIY day: hit the pickleball/tennis court, practice golf chipping, or clear 3 items from your Parking Lot.',agent:'body'}
  },
  {id:'scroll',t:'15:30',dur:30,days:[0,1,2,3,4,5,6],title:'Scheduled Social Media Window (Inside Budget)',detail:'Guilt-free scroll or sports highlights inside your daily social budget.',agent:'anchor'},
  {id:'family_sport',t:'16:00',dur:105,days:[0,1,2,3,4,5,6],title:'Family Bonding & Sports Block',detail:'Play your favorite sports or outdoor activities with family and kids.',agent:'circle'},
  {id:'dinner_prep',t:'17:45',dur:45,days:[0,1,2,3,4,5,6],title:'High-Protein Dinner Prep Together',detail:'Cook tonight’s selected Body recipe. Phones go in the basket.',agent:'body'},
  {id:'dinner',t:'18:30',dur:75,days:[0,1,2,3,4,5,6],title:'Family Dinner — Highs, Lows & Gratitude',detail:'Ask everyone for one win and one highlight from today.',agent:'circle'},
  {id:'bed_daughter',t:'19:45',dur:30,days:[0,1,2,3,4,5,6],title:'Kids Evening Routine & Story / Family Wind-Down',detail:'Full presence—reading, conversation, lights down.',agent:'circle'},
  {id:'wife_son',t:'20:15',dur:45,days:[0,1,2,3,4,5,6],title:'Partner Connection & Evening Tea',detail:'Unwind and connect 1-on-1 without screens.',agent:'circle'},
  {id:'debrief',t:'21:00',dur:45,days:[0,1,2,3,4,5,6],title:'Chief Evening Debrief & Tomorrow’s Lock',detail:'Log wins, review discipline, clear Parking Lot, set tomorrow’s Big 3.',agent:'anchor'},
  {id:'lights',t:'21:45',dur:30,days:[0,1,2,3,4,5,6],title:'Phone on Charger Outside Bedroom & Lights Out',detail:'Protect sleep so tomorrow’s wake-up is automatic.',agent:'body'}
];

/* ---------- Master Catalog of High-Protein Recipes ---------- */
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
    steps:'Mash cottage cheese with eggs, protein powder, and oat flour. Pan-fry golden patties 3 min per side. Top with Greek yogurt and berries.'
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
      {item:'Wild salmon fillets (4 x 6 oz)',cat:'Meat & Seafood'},
      {item:'Baby gold potatoes (1.5 lbs halved)',cat:'Produce'},
      {item:'Fresh asparagus spears (2 bunches)',cat:'Produce'},
      {item:'Fresh dill & lemons (1 bunch / 2 lemons)',cat:'Produce'},
      {item:'Extra virgin olive oil & garlic',cat:'Pantry'}
    ],
    steps:'Roast halved baby potatoes at 425°F for 15 min, add salmon and asparagus seasoned with lemon, garlic, and fresh dill for 10–12 min until flaky.'
  },
  {
    id:'r5',name:'Baltic Herb Chicken Shashlik Skewers & Cucumber Salad',slot:'Family Grill Dinner',protein:64,cals:580,prep:'25 min',
    ingredients:[
      {item:'Chicken breast & thigh chunks (2 lbs)',cat:'Meat & Seafood'},
      {item:'Kefir or Greek yogurt marinade (1 cup)',cat:'Dairy & Eggs'},
      {item:'English cucumbers (2 large)',cat:'Produce'},
      {item:'Fresh dill & green onions (1 bunch each)',cat:'Produce'},
      {item:'Pita flatbreads or rice (4 count)',cat:'Pantry'}
    ],
    steps:'Marinate chicken in kefir/yogurt, garlic, onion, and black pepper. Grill skewers outdoors, serve with creamy dill-cucumber salad.'
  },
  {
    id:'r6',name:'Double-Protein Smash Burger Bowls',slot:'Quick Dinner / Post-Sports',protein:60,cals:660,prep:'15 min',
    ingredients:[
      {item:'93/7 Lean ground beef (2 lbs)',cat:'Meat & Seafood'},
      {item:'Reduced-fat sharp cheddar slices (4 slices)',cat:'Dairy & Eggs'},
      {item:'Shredded iceberg lettuce & pickles (1 bag / 1 jar)',cat:'Produce'},
      {item:'Sweet potato fries (1 frozen bag)',cat:'Produce'},
      {item:'Sugar-free burger sauce / mustard',cat:'Pantry'}
    ],
    steps:'Crisp lean beef patties on hot griddle, melt cheddar, serve over chopped lettuce, tomatoes, and pickles with air-fried sweet potato wedges.'
  },
  {
    id:'r7',name:'Mediterranean Grilled Shrimp & Feta Orzo Skillet',slot:'Light Dinner',protein:52,cals:540,prep:'16 min',
    ingredients:[
      {item:'Jumbo peeled shrimp (1.5 lbs)',cat:'Meat & Seafood'},
      {item:'Chickpea or high-protein orzo pasta (1 box)',cat:'Pantry'},
      {item:'Crumbled feta cheese (1/2 cup)',cat:'Dairy & Eggs'},
      {item:'Baby spinach, cherry tomatoes & cucumber',cat:'Produce'}
    ],
    steps:'Sauté garlic shrimp 4 min with lemon and oregano, toss with cooked high-protein chickpea orzo, spinach, tomatoes, and feta.'
  },
  {
    id:'r8',name:'Turkey Taco Lettuce Boats & Guacamole Fiesta',slot:'Family Taco Night',protein:56,cals:570,prep:'15 min',
    ingredients:[
      {item:'99% Lean ground turkey breast (2 lbs)',cat:'Meat & Seafood'},
      {item:'Romaine hearts & taco shells (2 heads / 1 box)',cat:'Produce'},
      {item:'Avocados, salsa & lime (3 avocados)',cat:'Produce'},
      {item:'Shredded Mexican cheese & 0% Greek yogurt',cat:'Dairy & Eggs'}
    ],
    steps:'Brown ground turkey with taco seasoning, spoon into crisp romaine boats or shells, top with fresh guacamole, salsa, and Greek yogurt.'
  }
];

const WORKOUTS=[
  {id:'w1',name:'Morning Strength & Core Conditioning (40 min)',focus:'Compound lifts + focus dopamine primer',blocks:['5 min brisk outdoor walk + arm circles','4x10 Dumbbell Goblet Squats + Pushups superset','4x10 Dumbbell Rows + Overhead Press','3x45s Plank + Farmer Carries','2 min cold water face splash / shower finish']},
  {id:'w2',name:'Court Agility & Pickleball / Tennis Footwork (35 min)',focus:'Lateral speed, shoulder health, cardio',blocks:['5 min jump rope or light jog','6x20 yd lateral court shuffles + split-step drills','3x12 Resistance band external rotations (shoulder saver)','3x15 Walking lunges + torso twists','10 min shadow serves or wall volleys']},
  {id:'w3',name:'10-Minute Focus & Dopamine Emergency Reset',focus:'Instant blood-flow when stuck or pulled into phone',blocks:['Drink 12oz water immediately','30 Air squats + 20 Pushups','60-second dead hang or doorway chest stretch','Box breathing (4-4-4-4) for 4 cycles']}
];

const AFFIRMATIONS=[
  'I am a builder, a present partner and parent, and I finish what I start today.',
  'My experience and relationships are an unfair advantage—every conversation creates momentum.',
  'Structure is not a cage; structure is what gives me freedom to enjoy my family and sports.',
  'I do not chase cheap dopamine in impulse trades or endless feeds; I earn it by shipping real value.',
  'The people I love learn resilience by watching how I show up today.'
];

const REFLECTIONS=[
  'What is the ONE outcome today that would make tonight’s dinner feel completely earned?',
  'Where did my attention leak yesterday, and what boundary will Anchor & Shield enforce today?',
  'Who is one person from my network I can genuinely help or reconnect with before noon?',
  'If I try to do 10 things today I will do zero. What am I consciously saying NO to today?'
];

const TRIGGERS=[
  'Set a 2-minute timer and only open the document. Starting is 80% of the battle.',
  'Stand up, drink a full glass of water, do 15 pushups, then do the smallest next step.',
  'Put your phone on the counter in another room and bring only your laptop for 25 minutes.',
  'Tell your partner or family what you are finishing in the next 45 minutes for instant accountability.',
  'Write the rough, ugly version in 10 minutes. You can polish it after it exists.'
];

const ALL_SPORTS=['Pickleball','Golf','Tennis','Football','Bowling','Basketball','Hiking & Outdoors','Board Games & Cooking','Swimming & Pool','Cycling'];

const FAMILY_IDEAS=[
  {id:'f1',title:'Sunset Pickleball Doubles Match',who:'Whole Family',sport:'Pickleball',time:'60 min',note:'Fun doubles match with handicap rules for younger kids.'},
  {id:'f2',title:'9-Hole Twilight Executive Golf / Driving Range Challenge',who:'Family / Kids',sport:'Golf',time:'90 min',note:'Closest-to-the-pin chipping contest + catch up on life and school.'},
  {id:'f3',title:'Park Football Route Tree & Catch Streak',who:'Kids & Family',sport:'Football',time:'45 min',note:'Draw 3 plays, run routes, and track consecutive catches.'},
  {id:'f4',title:'Family Bowling Night Challenge',who:'Whole Family',sport:'Bowling',time:'90 min',note:'Beat the heat indoors; winner picks the music on the drive home.'},
  {id:'f5',title:'Driveway / Park Basketball HORSE & Free-Throw Streak',who:'Kids & Family',sport:'Basketball',time:'40 min',note:'Team goal of 25 made shots + friendly game of HORSE.'},
  {id:'f6',title:'Morning or Twilight Tennis Rally & Serve Target Game',who:'Partner / Kids',sport:'Tennis',time:'60 min',note:'Set targets in the service box and play first to 21 points.'},
  {id:'f7',title:'High-Protein Pancake & Board Game Evening',who:'Whole Family',sport:'Board Games & Cooking',time:'75 min',note:'Cook together, put all phones in a basket, and play a fast board or card game.'},
  {id:'f8',title:'Morning Trail Hike & Smoothie Stop',who:'Whole Family',sport:'Hiking & Outdoors',time:'75 min',note:'Early outdoor trail walk before the heat + high-protein smoothies.'}
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
    desc:'Read venture playbooks; write partnership proposals, morning self-reflections, and DIY project guides.',
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
    writeDesc:'Draft & send warm outreach emails to partners and leads',
    modDesc:'Tag, archive processed deal alerts & schedule follow-up nudges'
  },
  {
    id:'imessage',name:'Apple Messages (iMessage / SMS)',cat:'Apple & Messaging',
    agents:['chief','circle','anchor','launch'],
    desc:'Send morning wake-up nudges, quick texts to your partner and kids, sports invites to friends, and partner follow-ups on iPhone & Mac.',
    placeholder:'Partner / Primary Contact Phone (e.g. +17605550199)',
    readDesc:'Read quick check-in replies via iOS Shortcuts bridge',
    writeDesc:'Launch pre-filled iMessages to partner, family, friends & leads',
    modDesc:'Update task & habit status from quick SMS/iMessage responses'
  },
  {
    id:'whatsapp',name:'WhatsApp',cat:'Messaging & Social',
    agents:['circle','launch','scout'],
    desc:'Message family abroad, coordinate local pickleball/golf/tennis groups, and chat with international contacts.',
    placeholder:'WhatsApp phone number with country code (e.g. 17605550199)',
    readDesc:'Read family thread updates & local sports group times',
    writeDesc:'Send WhatsApp messages to family & sports groups',
    modDesc:'Confirm reseller pickup times & update family activity plans'
  },
  {
    id:'facebook',name:'Facebook & Marketplace',cat:'Marketplaces & Social',
    agents:['scout','anchor'],
    desc:'Hunt local Marketplace deals, message sellers with cash/reseller offers, cross-post inventory, and cap scroll time.',
    placeholder:'Marketplace City / Zip & Radius (e.g. 92262 · 25 mi)',
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
  {id:'prefs',label:'Preferences',icon:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'},
  {id:'team',label:'Agents & App',icon:'<circle cx="12" cy="6.5" r="3"/><circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/>'}
];

const QUICK={
  morning:{label:'Morning Brief',text:'Give me my personalized morning brief across schedule, markets, workout, and my #1 revenue move.'},
  trade:{label:'Pre-Trade Check',text:'Market is open. Keep me disciplined—review my watchlist and remind me of my trading rules.'},
  stuck:{label:'I’m Stuck (Focus Reset)',text:'I’m stuck in task paralysis right now. Give me a 2-minute physical + action reset.'},
  phone:{label:'Phone Pulled Me In',text:'I got sucked into scrolling/deal-hunting. Interrupt the loop and put me back on rail.'},
  deals:{label:'Deal / Flip Idea',text:'Help me evaluate a marketplace flip or deal fast without losing my afternoon.'},
  diy:{label:'Home/Car DIY Guide',text:'Break down my active home/auto DIY project into safe, fast steps.'},
  family:{label:'Family & Sports Tonight',text:'Suggest a great activity or sport for my family this afternoon.'},
  evening:{label:'Evening Debrief',text:'Review my day across all 8 agents, log what worked, and lock tomorrow’s Big 3.'}
};

/* ---------- State Factories (Founder Preset vs. Fresh New User Account) ---------- */
function founderPreset(email,name){
  return {
    v:3,updatedAt:0,shift:0,budget:30,
    profile:{
      name:name||'Matt',
      email:email||'mrmattbennett@gmail.com',
      age:41,
      gender:'Male',
      city:'Palm Springs, CA',
      wakeTime:'06:00',
      bedTime:'21:45',
      programPack:'ADHD Focus & Structure',
      weightLbs:190,
      goalWeightLbs:180,
      proteinTarget:180,
      waterTarget:10,
      workoutStyle:'Desert Strength & Court Conditioning',
      dietStyle:'High-Protein Whole Foods',
      favoriteDishes:['r1','r2','r3','r4','r5','r6'],
      customDishes:[],
      careerBackground:'Ex-Google Business Development, Sales & Strategic Partnerships',
      resellerLicense:true,
      morningTrader:true,
      spouseName:'Wife (from Latvia)',
      kidsDesc:'Son (12) & Daughter (7)',
      favoriteSports:['Golf','Pickleball','Tennis','Football','Bowling','Basketball'],
      affirmation:'I am a builder, a present father and husband, and I finish what I start today.',
      onboarded:true,
      showGuide:false
    },
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
    mealPlan:{Mon:'r1',Tue:'r3',Wed:'r4',Thu:'r5',Fri:'r6',Sat:'r2',Sun:'r4'},
    groceryChecked:{},customGroceries:[],
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
    customSlots:JSON.parse(JSON.stringify(SLOTS)),
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

function freshUserDefaults(email,name){
  return {
    v:3,updatedAt:Date.now(),shift:0,budget:30,
    profile:{
      name:name||(email?email.split('@')[0]:'Friend'),
      email:email||'',
      age:'',
      gender:'',
      city:'',
      wakeTime:'06:30',
      bedTime:'22:00',
      programPack:'ADHD Focus & Structure',
      weightLbs:'',
      goalWeightLbs:'',
      proteinTarget:150,
      waterTarget:8,
      workoutStyle:'Strength & Conditioning',
      dietStyle:'High-Protein Balanced',
      favoriteDishes:['r1','r3','r4','r6'],
      customDishes:[],
      careerBackground:'',
      resellerLicense:false,
      morningTrader:true,
      spouseName:'',
      kidsDesc:'',
      favoriteSports:['Pickleball','Golf','Hiking & Outdoors'],
      affirmation:'I focus on one meaningful action at a time and build momentum every day.',
      onboarded:false,
      showGuide:true
    },
    morningDone:{},
    big3:{},checks:{},social:{},focus:{},week:{},nudges:{},
    wins:[],parking:[],messages:[],tasks:[],
    whys:[
      {id:'w1',t:'Show up with focus, energy, and presence for the people I love.'},
      {id:'w2',t:'Turn my ideas into real, shipped outcomes one block at a time.'}
    ],whyIdx:0,
    water:{},protein:{},workoutDone:{},
    mealPlan:{Mon:'r1',Tue:'r3',Wed:'r4',Thu:'r6',Fri:'r3',Sat:'r1',Sun:'r4'},
    groceryChecked:{},customGroceries:[],
    tradeRules:{maxTrades:2,maxLoss:200,stopTime:'08:00',checklist:[false,false,false]},
    watchlist:[
      {id:'tk1',sym:'SPY',bias:'Watch',level:'Opening 15-min range',note:'Check market trend before any trade.'}
    ],
    trades:[],
    hunts:[],
    flips:[],
    projects:[],
    ventures:[],
    targets:{convos:5,shipped:2,flipsListed:3},
    bridge:{goal:'5000',earned:'0'},
    familyLog:[],
    customSlots:JSON.parse(JSON.stringify(SLOTS)),
    connections:{
      gcalendar:{linked:false,account:email||'',read:true,write:true,modify:true,lastSync:0},
      gsheets:{linked:false,account:email||'',read:true,write:true,modify:true,lastSync:0},
      gdocs:{linked:false,account:email||'',read:true,write:true,modify:true,lastSync:0},
      gmail:{linked:false,account:email||'',read:true,write:true,modify:false,lastSync:0},
      imessage:{linked:false,account:'',read:true,write:true,modify:true,lastSync:0},
      whatsapp:{linked:false,account:'',read:true,write:true,modify:true,lastSync:0},
      facebook:{linked:false,account:'',read:true,write:true,modify:true,lastSync:0},
      youtube_ios:{linked:false,account:'Steady Groceries & DIY',read:true,write:true,modify:true,lastSync:0}
    },
    syncLog:[
      {id:'sl1',ts:Date.now(),agent:'chief',svc:'gcalendar',op:'READ',detail:'New account initialized. Link your services anytime in the Integrations tab.'}
    ]
  };
}

function normalize(s,isFresh,email,name){
  const d=isFresh?freshUserDefaults(email,name):founderPreset(email,name);
  const o=Object.assign({},d,s||{});
  o.profile=Object.assign({},d.profile,(s&&s.profile)||{});
  if(!Array.isArray(o.profile.favoriteDishes))o.profile.favoriteDishes=d.profile.favoriteDishes;
  if(!Array.isArray(o.profile.customDishes))o.profile.customDishes=[];
  if(!Array.isArray(o.profile.favoriteSports))o.profile.favoriteSports=d.profile.favoriteSports;
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
  if(!Array.isArray(o.customSlots)||!o.customSlots.length){
    o.customSlots=JSON.parse(JSON.stringify(SLOTS));
  } else {
    o.customSlots=o.customSlots.map(sl=>{
      const def=SLOTS.find(x=>x.id===sl.id)||{};
      return Object.assign({dur:def.dur||45,days:def.days||[0,1,2,3,4,5,6],fallback:def.fallback||null},sl);
    });
  }
  if(!Array.isArray(o.tradeRules.checklist))o.tradeRules.checklist=[false,false,false];
  return o;
}

/* ---------- Multi-User Auth & Per-User Isolated Storage ---------- */
const ACC_KEY='steady.accounts.v1';
const SESS_KEY='steady.session.v1';
const RESET_KEY='steady.resets.v1';

function simpleHash(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return 'h_'+h.toString(16);
}

function loadAccounts(){
  try{
    const r=localStorage.getItem(ACC_KEY);
    const accs=r?JSON.parse(r):{};
    if(!accs['mrmattbennett@gmail.com']){
      accs['mrmattbennett@gmail.com']={
        email:'mrmattbennett@gmail.com',
        name:'Matt (Palm Springs Founder)',
        passHash:simpleHash('steady2026'),
        isFounder:true,
        createdAt:Date.now()
      };
      localStorage.setItem(ACC_KEY,JSON.stringify(accs));
      const legacy=localStorage.getItem('steady.v2')||localStorage.getItem('steady.v1');
      if(legacy&&!localStorage.getItem('steady.user.mrmattbennett@gmail.com')){
        localStorage.setItem('steady.user.mrmattbennett@gmail.com',legacy);
      }
    }
    return accs;
  }catch(e){return {};}
}

function saveAccounts(accs){
  try{localStorage.setItem(ACC_KEY,JSON.stringify(accs));}catch(e){}
}

let currentUser=null;
let state=founderPreset('mrmattbennett@gmail.com','Matt');

function loadSessionUser(){
  try{
    const email=localStorage.getItem(SESS_KEY);
    if(!email)return null;
    const accs=loadAccounts();
    return accs[email]||null;
  }catch(e){return null;}
}

function loadUserData(user){
  const key='steady.user.'+user.email;
  try{
    const raw=localStorage.getItem(key);
    const parsed=raw?JSON.parse(raw):null;
    state=normalize(parsed,!user.isFounder,user.email,user.name);
  }catch(e){
    state=normalize(null,!user.isFounder,user.email,user.name);
  }
}

function saveLocal(){
  if(!currentUser)return;
  try{
    localStorage.setItem('steady.user.'+currentUser.email,JSON.stringify(state));
  }catch(e){}
}

function save(){
  state.updatedAt=Date.now();
  saveLocal();
  setSync();
}

function setSync(){
  const el=$('#sync');
  if(el&&currentUser){
    el.textContent='Private ('+currentUser.email.split('@')[0]+') · '+new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  }
}

function activeRecipes(){
  const p=state.profile||{};
  const favIds=Array.isArray(p.favoriteDishes)&&p.favoriteDishes.length?p.favoriteDishes:RECIPES.map(r=>r.id);
  const base=RECIPES.filter(r=>favIds.indexOf(r.id)>=0);
  const custom=Array.isArray(p.customDishes)?p.customDishes:[];
  const combined=base.concat(custom);
  return combined.length?combined:RECIPES.slice(0,4);
}

function activeFamilyIdeas(){
  const p=state.profile||{};
  const sports=Array.isArray(p.favoriteSports)&&p.favoriteSports.length?p.favoriteSports:ALL_SPORTS;
  const filtered=FAMILY_IDEAS.filter(f=>sports.indexOf(f.sport)>=0);
  return filtered.length?filtered:FAMILY_IDEAS;
}
