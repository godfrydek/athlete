/* Training Arc OS v5 — local-first encrypted all-in-one tracker */
const APP_KEY = "training_arc_os_v5_vault";
const SETTINGS_KEY = "training_arc_os_v5_settings";
const LEGACY_KEYS = ["training_arc_os_v4_vault","training_arc_os_v3_vault","training_arc_os_v2_vault"];
const $ = id => document.getElementById(id);
const $$ = sel => [...document.querySelectorAll(sel)];
const todayIso = () => new Date().toISOString().slice(0,10);
const uid = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-5);
const num = (v, fallback=0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; };
const round = (n,d=1) => Math.round((num(n))*10**d)/10**d;
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const fmt = n => Number.isFinite(+n) ? new Intl.NumberFormat("cs-CZ").format(+n) : "—";
let state = null;
let vaultPassword = "";
let selectedDate = todayIso();
let currentView = "dashboard";
let encryptedVaultCache = null;
let calculatedFood = null;
let selectedFoodImage = "";
let workoutDraft = [];
let mealDraft = [];
let supabaseClient = null;
let cloudUser = null;
let unsafeMode = false;

const DEFAULT_TARGETS = { kcal: 2900, protein: 175, carbs: 360, fat: 70, steps: 10000, runKm: 30, sleep: 7.5 };
const WORKOUT_TYPES = ["Upper", "Lower", "Push", "Pull", "Fullbody", "Calisthenics", "Run + Upper", "Deload", "Technique", "Mobility", "Custom"];
const EXERCISE_PRESETS = [
  "Strict push-ups", "Weighted push-ups +10 kg", "Weighted push-ups +20 kg", "Deficit push-ups", "Explosive push-ups", "AMRAP push-ups", "Diamond push-ups", "Pseudo planche push-ups",
  "Explosive pull-ups", "Pull-ups", "Chin-ups", "Chest-to-bar pull-ups", "Weighted pull-ups", "Muscle-up technique", "Band muscle-ups", "Negative muscle-ups",
  "Explosive dips", "Dips", "Weighted dips +10 kg", "Weighted dips +20 kg", "Ring dips", "Straight bar dips",
  "Incline bench press", "Bench press", "DB bench press", "Machine chest press", "Cable fly", "Pec deck", "Overhead press", "DB shoulder press",
  "MAG lat pulldown", "Lat pulldown", "Single-arm pulldown", "V-bar row", "Chest-supported row", "Seated cable row", "T-bar row", "Machine row", "Face pulls", "Rear delt fly",
  "Lateral raises", "Cable lateral raises", "Rear delt machine", "EZ bar curls", "DB curls", "Hammer curls", "Preacher curls", "Cable curls", "Triceps pushdown", "Overhead triceps extension", "Skull crushers",
  "Leg press", "Leg extension", "Leg curl", "DB RDL", "Romanian deadlift", "Hyperextensions", "Calf raises", "Adductor", "Abductor", "Split squat", "Goblet squat",
  "Plank", "Hanging knee raises", "Cable crunch", "Pallof press", "Farmer walk", "Mobility flow"
];
const RUN_TYPES = [
  {name:"Recovery jog", goal:"extra easy, flush nohy", intensity:"Z1–low Z2"}, {name:"Easy / Zone 2", goal:"aerobní base bez ničení", intensity:"Z2"},
  {name:"Steady", goal:"kontrolované tempo mezi easy a tempo", intensity:"Z2–Z3"}, {name:"Tempo", goal:"držet rychlejší komfortně těžké tempo", intensity:"Z3–Z4"},
  {name:"Threshold", goal:"posun laktátového prahu", intensity:"Z4"}, {name:"VO2max intervals", goal:"rychlost a kapacita", intensity:"Z4–Z5"},
  {name:"900m easy + 100m sprint", goal:"tvůj speed endurance mix", intensity:"mixed"}, {name:"Strides", goal:"technika + rychlost bez velké únavy", intensity:"short fast"},
  {name:"Fartlek", goal:"rychlé úseky podle pocitu", intensity:"mixed"}, {name:"Long run", goal:"objem, mentální síla, economy", intensity:"Z2–Z3"},
  {name:"Progression run", goal:"každý blok rychleji", intensity:"build"}, {name:"Hills", goal:"síla, technika, cadence", intensity:"hard"},
  {name:"Race / Time trial", goal:"výkon / test", intensity:"max controlled"}, {name:"Treadmill incline", goal:"low-impact conditioning", intensity:"custom"},
  {name:"Brick / Gym + Run", goal:"hybrid den", intensity:"mixed"}
];
const COMMANDS = [
  ["Přidat jídlo", "nutrition"], ["Log workout", "gym"], ["Log běh", "running"], ["Kalkulačky", "calculators"], ["Deník", "life"], ["Cloud sync", "connections"], ["Analytics", "analytics"]
];

function seedState(){
  return {
    meta:{app:"Training Arc OS", version:5, createdAt:new Date().toISOString(), deviceId: uid()},
    profile:{name:"Filip", height:182, weight:80, age:17, sex:"male"},
    targets:{...DEFAULT_TARGETS},
    days:{}, foods: generateFoodDatabase(), customFoods:[], workouts:[], runs:[], journals:[], tasks:[], habits:[], books:[], exercisePresets:[...EXERCISE_PRESETS],
    settings:{theme:"dark", cloud:{url:"", key:"", lastPush:"", lastPull:""}, email:{reportEmail:"", webhookUrl:""}, security:{kdfIterations:300000}}
  };
}
function demoState(){
  const s=seedState(); const daysAgo=d=>{const x=new Date();x.setDate(x.getDate()-d);return x.toISOString().slice(0,10)};
  for(let i=13;i>=0;i--){const iso=daysAgo(i); s.days[iso]={weight:round(81-i*.09,1),kcal:2500+Math.round(Math.random()*520),protein:150+Math.round(Math.random()*45),carbs:280+Math.round(Math.random()*120),fat:55+Math.round(Math.random()*30),steps:8000+Math.round(Math.random()*8500),sleep:round(6.4+Math.random()*1.8,1),mood:6+Math.round(Math.random()*4),energy:6+Math.round(Math.random()*3),soreness:2+Math.round(Math.random()*4),notes:"Demo log",foodLogs:[]};}
  s.runs.push({id:uid(),date:daysAgo(8),type:"Easy / Zone 2",distance:4.1,seconds:1318,hr:145,rpe:5,terrain:"cyklostezka",notes:"easy"});
  s.runs.push({id:uid(),date:daysAgo(4),type:"Tempo",distance:6.02,seconds:1993,hr:166,rpe:7,terrain:"silnice",notes:"strong finish"});
  s.runs.push({id:uid(),date:daysAgo(1),type:"Long run",distance:7.8,seconds:3110,hr:167,rpe:6,terrain:"vítr + kopečky",notes:"rýma, mikina"});
  s.workouts.push({id:uid(),date:daysAgo(6),type:"Upper",notes:"demo",exercises:[{name:"Incline bench press",sets:[{kg:78,reps:7,rir:1},{kg:75,reps:8,rir:2}]},{name:"MAG lat pulldown",sets:[{kg:80,reps:8,rir:1}]}]});
  s.workouts.push({id:uid(),date:daysAgo(2),type:"Calisthenics",notes:"demo",exercises:[{name:"Weighted push-ups +20 kg",sets:[{kg:20,reps:12,rir:2}]},{name:"Explosive pull-ups",sets:[{kg:0,reps:8,rir:1}]},{name:"Explosive dips",sets:[{kg:0,reps:12,rir:1}]}]});
  s.journals.push({id:uid(),date:todayIso(),mood:"🔥 locked in",score:8,text:"V5 demo: všechno logovat, nic neplatit."});
  s.books.push({id:uid(),title:"Atomic Habits",author:"James Clear",total:320,current:84,note:"Systems > goals"});
  return s;
}
function ensureDay(iso=selectedDate){
  if(!state.days[iso]) state.days[iso]={weight:"",kcal:0,protein:0,carbs:0,fat:0,fiber:0,salt:0,steps:0,sleep:"",mood:"",energy:"",soreness:"",notes:"",foodLogs:[]};
  if(!Array.isArray(state.days[iso].foodLogs)) state.days[iso].foodLogs=[];
  return state.days[iso];
}
function migrate(){
  if(!state.meta) state.meta={app:"Training Arc OS", version:5, createdAt:new Date().toISOString(), deviceId:uid()};
  state.meta.version=5;
  state.targets={...DEFAULT_TARGETS,...(state.targets||{})};
  state.settings={theme:"dark",cloud:{url:"",key:"",lastPush:"",lastPull:""},email:{reportEmail:"",webhookUrl:""},security:{kdfIterations:300000},...(state.settings||{})};
  state.settings.cloud={url:"",key:"",lastPush:"",lastPull:"",...(state.settings.cloud||{})};
  state.settings.email={reportEmail:"",webhookUrl:"",...(state.settings.email||{})};
  state.settings.security={kdfIterations:300000,...(state.settings.security||{})};
  state.days=state.days||{}; state.foods=Array.isArray(state.foods)&&state.foods.length>900?state.foods:generateFoodDatabase();
  state.customFoods=state.customFoods||[]; state.workouts=state.workouts||[]; state.runs=state.runs||[]; state.journals=state.journals||[]; state.tasks=state.tasks||[]; state.habits=state.habits||[]; state.books=state.books||[];
  state.exercisePresets=[...new Set([...(state.exercisePresets||[]),...EXERCISE_PRESETS])];
}

function generateFoodDatabase(){
  const bases = [
    ["Kuřecí prsa",110,23,0,2,"protein","🍗"],["Kuřecí stehno",170,19,0,10,"protein","🍗"],["Krůtí prsa",105,24,0,1,"protein","🦃"],["Hovězí libové",170,21,0,9,"protein","🥩"],["Losos",208,20,0,13,"protein","🐟"],["Tuňák ve vlastní šťávě",116,26,0,1,"protein","🐟"],["Treska",82,18,0,1,"protein","🐟"],["Vejce",143,13,1,10,"protein","🥚"],["Bílky",52,11,1,0,"protein","🥚"],["Šunka vysokoprocentní",110,20,2,3,"protein","🥓"],
    ["Skyr bílý",63,11,4,0,"protein dairy","🥣"],["Tvaroh odtučněný",68,12,4,1,"protein dairy","🥣"],["Tvaroh polotučný",110,12,4,5,"protein dairy","🥣"],["Řecký jogurt 0%",59,10,4,0,"protein dairy","🥣"],["Cottage",98,12,3,4,"protein dairy","🧀"],["Mozzarella light",160,24,2,7,"protein dairy","🧀"],["Eidam 30%",263,27,1,16,"protein dairy","🧀"],["Whey protein",390,78,8,6,"protein supplement","🥤"],
    ["Rýže vařená",130,3,28,0,"carbs","🍚"],["Rýže basmati vařená",121,3,25,0,"carbs","🍚"],["Brambory vařené",77,2,17,0,"carbs","🥔"],["Batáty",86,2,20,0,"carbs","🍠"],["Těstoviny vařené",155,6,31,1,"carbs","🍝"],["Kuskus vařený",112,4,23,0,"carbs","🍛"],["Ovesné vločky",370,13,60,7,"carbs","🥣"],["Chléb žitný",240,8,45,2,"carbs","🍞"],["Tortilla pšeničná",310,8,52,8,"carbs","🌯"],["Banán",89,1,23,0,"fruit","🍌"],["Jablko",52,0,14,0,"fruit","🍎"],["Borůvky",57,1,14,0,"fruit","🫐"],["Jahody",32,1,8,0,"fruit","🍓"],
    ["Brokolice",34,3,7,0,"veg","🥦"],["Okurka",15,1,4,0,"veg","🥒"],["Rajče",18,1,4,0,"veg","🍅"],["Paprika",31,1,6,0,"veg","🫑"],["Mrkev",41,1,10,0,"veg","🥕"],["Špenát",23,3,4,0,"veg","🥬"],["Salát mix",18,1,3,0,"veg","🥗"],
    ["Olivový olej",884,0,0,100,"fats","🫒"],["Avokádo",160,2,9,15,"fats","🥑"],["Arašídové máslo",590,25,20,50,"fats","🥜"],["Mandle",579,21,22,50,"fats","🥜"],["Kešu",553,18,30,44,"fats","🥜"],
    ["Protein bar",370,32,35,12,"snack protein","🍫"],["Corny/protein tyčinka",400,20,50,12,"snack","🍫"],["Energetický gel",260,0,65,0,"run fuel","⚡"],["Iontový nápoj",120,0,30,0,"run fuel","🥤"],["Hořká čokoláda",550,8,45,35,"snack","🍫"],["Piškoty",390,8,80,5,"snack","🍪"],
    ["Svíčková s knedlíkem",165,7,18,7,"czech meal","🍽️"],["Kuřecí řízek",260,18,18,13,"czech meal","🍗"],["Vepřový řízek",310,17,18,20,"czech meal","🍖"],["Guláš",140,10,8,8,"czech meal","🍲"],["Knedlík houskový",220,7,45,1,"czech meal","🥖"],["Bramborový salát",170,3,18,9,"czech meal","🥔"]
  ];
  const variants = [
    ["",1,0,0,0,"basic"],["light",.88,0,0,-2,"light"],["high protein",1.04,5,-2,-1,"protein"],["low fat",.86,1,0,-4,"cut"],["bulk portion",1.15,2,6,2,"bulk"],["meal prep",1,0,0,0,"mealprep"],["s kořením",1.02,0,1,0,"seasoned"],["bez oleje",.9,0,0,-3,"cut"],["s olejem",1.22,0,0,8,"fats"],["fitness",.96,2,-1,-1,"fitness"],["gym day",1.08,2,4,1,"gym"],["rest day",.92,1,-3,0,"rest"],["quick snack",1,0,0,0,"snack"],["running fuel",1.06,0,8,0,"run"],["school box",1,0,3,0,"school"],["work shift",1.03,1,4,1,"work"],["breakfast",1,0,6,1,"breakfast"],["dinner",1.02,2,0,1,"dinner"],["budget",.98,0,0,0,"budget"],["premium",1.05,1,1,2,"premium"]
  ];
  const foods=[];
  for(const b of bases){
    for(const v of variants){
      const name = v[0] ? `${b[0]} · ${v[0]}` : b[0];
      foods.push({id:"preset_"+uid(),preset:true,name,icon:b[6],category:b[5].split(" ")[0],tags:(b[5]+" "+v[5]).split(" "),kcal100:Math.max(0,round(b[1]*v[1],0)),protein100:Math.max(0,round(b[2]+v[2],1)),carbs100:Math.max(0,round(b[3]+v[3],1)),fat100:Math.max(0,round(b[4]+v[4],1)),fiber100:b[5].includes("veg")?3:b[5].includes("fruit")?2:0,salt100:0.1});
    }
  }
  return foods.slice(0,1100);
}
// Crypto helpers
const enc = new TextEncoder(); const dec = new TextDecoder();
function bytesToB64(buf){ let bin=""; const bytes=new Uint8Array(buf); for(let i=0;i<bytes.byteLength;i++) bin+=String.fromCharCode(bytes[i]); return btoa(bin); }
function b64ToBytes(str){ return Uint8Array.from(atob(str), c=>c.charCodeAt(0)); }
async function deriveKey(password, salt, iterations=300000){
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2", salt, iterations, hash:"SHA-256"}, base, {name:"AES-GCM", length:256}, false, ["encrypt","decrypt"]);
}
async function encryptState(payload, password){
  const salt=crypto.getRandomValues(new Uint8Array(16)); const iv=crypto.getRandomValues(new Uint8Array(12)); const iterations=state?.settings?.security?.kdfIterations||300000;
  const key=await deriveKey(password,salt,iterations);
  const data=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(JSON.stringify(payload)));
  return {app:"TrainingArcOS",version:5,kdf:"PBKDF2-SHA256",iterations,cipher:"AES-GCM-256",salt:bytesToB64(salt),iv:bytesToB64(iv),data:bytesToB64(data),updatedAt:new Date().toISOString(),deviceId:payload?.meta?.deviceId||"unknown"};
}
async function decryptVault(vault,password){
  const key=await deriveKey(password,b64ToBytes(vault.salt),vault.iterations||220000);
  const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64ToBytes(vault.iv)},key,b64ToBytes(vault.data));
  return JSON.parse(dec.decode(plain));
}
function getStoredVault(){
  const primary=localStorage.getItem(APP_KEY); if(primary) return JSON.parse(primary);
  for(const k of LEGACY_KEYS){ const raw=localStorage.getItem(k); if(raw) return JSON.parse(raw); }
  return null;
}
async function saveVault(show=true){
  if(!state) return;
  migrate();
  if(unsafeMode || !vaultPassword){ localStorage.setItem(APP_KEY+"_unsafe", JSON.stringify(state)); if(show) toast("Uloženo v dočasném nešifrovaném režimu."); renderAll(); return; }
  encryptedVaultCache=await encryptState(state,vaultPassword);
  localStorage.setItem(APP_KEY,JSON.stringify(encryptedVaultCache));
  if(show) toast("Vault uložený a zašifrovaný.");
  renderAll();
}
function passwordScore(pass){
  let score=0; if(pass.length>=6)score+=20; if(pass.length>=10)score+=20; if(/[A-Z]/.test(pass))score+=15; if(/[0-9]/.test(pass))score+=15; if(/[^A-Za-z0-9]/.test(pass))score+=15; if(pass.length>=16)score+=15; return clamp(score,0,100);
}
function updatePasswordMeter(){ const pass=$("vaultPassword").value||""; const score=passwordScore(pass); $("passwordMeter").querySelector("i").style.width=Math.max(8,score)+"%"; $("passwordMeter").querySelector("span").textContent=score<35?"slabší":score<70?"ok":"silné"; }

async function init(){
  selectedDate=todayIso(); $("datePicker").value=selectedDate;
  $("todayLabel").textContent=new Date().toLocaleDateString("cs-CZ",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  encryptedVaultCache=getStoredVault();
  $("vaultStatus").textContent=encryptedVaultCache?"Vault nalezen — zadej heslo/PIN":"Nový vault — nastav heslo/PIN";
  bindEvents();
  if("serviceWorker" in navigator){ navigator.serviceWorker.register("sw.js").catch(()=>{}); }
}
function openApp(){ $("lockScreen").classList.add("hidden"); $("appShell").classList.remove("hidden"); migrate(); applyTheme(); hydrateControls(); renderAll(); initSupabaseFromSettings(); }
function applyTheme(){ document.body.classList.toggle("light", state?.settings?.theme==="light"); }
function hydrateControls(){
  $("workoutType").innerHTML=WORKOUT_TYPES.map(x=>`<option>${x}</option>`).join("");
  $("runType").innerHTML=RUN_TYPES.map(x=>`<option>${x.name}</option>`).join("");
  const cats=[...new Set(state.foods.map(f=>f.category).filter(Boolean))].sort(); $("foodCategoryFilter").innerHTML='<option value="">Všechny kategorie</option>'+cats.map(c=>`<option>${c}</option>`).join("");
}
function bindEvents(){
  $("vaultPassword").addEventListener("input",updatePasswordMeter);
  $("unlockBtn").onclick=async()=>{ const pass=$("vaultPassword").value; if(!pass||pass.length<4)return toast("Zadej heslo/PIN."); try{ const vault=getStoredVault(); if(!vault)return toast("Vault neexistuje. Vytvoř nový."); state=await decryptVault(vault,pass); vaultPassword=pass; unsafeMode=false; openApp(); toast("Odemčeno."); }catch(e){ toast("Špatné heslo/PIN nebo poškozený vault."); }};
  $("createVaultBtn").onclick=async()=>{ const pass=$("vaultPassword").value; if(!pass||pass.length<6)return toast("Pro v5 dej aspoň 6 znaků."); if(getStoredVault()&&!confirm("Přepsat existující vault?"))return; state=seedState(); vaultPassword=pass; unsafeMode=false; await saveVault(false); openApp(); toast("V5 secure vault vytvořen."); };
  $("demoVaultBtn").onclick=async()=>{ const pass=$("vaultPassword").value||"demo1234"; state=demoState(); vaultPassword=pass; unsafeMode=false; await saveVault(false); openApp(); toast("Demo vault vytvořen. Heslo: co jsi zadal, nebo demo1234."); };
  $("offlineUnsafeBtn").onclick=()=>{ if(!confirm("Dočasný režim bez šifrování? Jen na test."))return; const raw=localStorage.getItem(APP_KEY+"_unsafe"); state=raw?JSON.parse(raw):seedState(); unsafeMode=true; vaultPassword=""; openApp(); toast("Dočasný nešifrovaný režim."); };
  $("resetVaultBtn").onclick=()=>{ if(confirm("Smazat lokální data v5 + legacy keys?")){ localStorage.removeItem(APP_KEY); localStorage.removeItem(APP_KEY+"_unsafe"); LEGACY_KEYS.forEach(k=>localStorage.removeItem(k)); location.reload(); }};
  $("quickSaveBtn").onclick=()=>saveVault(); $("lockBtn").onclick=()=>location.reload();
  $("themeToggle").onclick=()=>{ state.settings.theme=state.settings.theme==="light"?"dark":"light"; applyTheme(); saveVault(false); };
  $("datePicker").onchange=e=>{ selectedDate=e.target.value||todayIso(); renderAll(); };
  $$(".nav-btn").forEach(btn=>btn.onclick=()=>switchView(btn.dataset.view)); $$("[data-jump]").forEach(btn=>btn.onclick=()=>switchView(btn.dataset.jump));
  $("commandBtn").onclick=openCommandPalette; $("commandPalette").onclick=e=>{ if(e.target.id==="commandPalette") closeCommandPalette(); }; $("commandSearch").oninput=renderCommands; document.addEventListener("keydown",e=>{ if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommandPalette()} if(e.key==="Escape") closeCommandPalette(); });
  $("saveDayBtn").onclick=saveQuickDay;
  ["foodGrams","foodKcal100","foodProtein100","foodCarbs100","foodFat100","foodFiber100","foodSalt100","foodName","foodTags","foodIcon"].forEach(id=>$(id).oninput=calculateFood);
  $("calcFoodBtn").onclick=calculateFood; $("saveFoodBtn").onclick=saveCustomFood; $("addFoodToDayBtn").onclick=addCalculatedFoodToDay; $("foodImageInput").onchange=handleFoodImage; $("clearFoodImageBtn").onclick=clearFoodImage;
  $("foodSearch").oninput=renderFoods; $("foodCategoryFilter").onchange=renderFoods; $("clearFoodSearch").onclick=()=>{$("foodSearch").value="";$("foodCategoryFilter").value="";renderFoods();}; $("randomFoodBtn").onclick=randomFood; $("mealBuilderBtn").onclick=()=>toast("Klikni u presetů na + meal."); $("addMealToDayBtn").onclick=addMealToDay; $("clearMealBtn").onclick=()=>{mealDraft=[];renderMealBuilder();};
  $("saveTargetsBtn").onclick=saveTargets;
  $("addSetBtn").onclick=addSetToDraft; $("saveWorkoutBtn").onclick=saveWorkout; $("clearWorkoutDraftBtn").onclick=()=>{workoutDraft=[];renderWorkoutDraft();}; $("exerciseSearch").oninput=renderExercisePresets; $("clearExerciseSearch").onclick=()=>{$("exerciseSearch").value="";renderExercisePresets();}; $("workoutImportInput").onchange=importWorkoutHistory;
  $("saveRunBtn").onclick=saveRun;
  $("calc1rmBtn").onclick=calc1rm; $("calcVo2Btn").onclick=calcVo2; $("calcTdeeBtn").onclick=calcTdee; $("calcPaceBtn").onclick=calcPace; $("calcMacroBtn").onclick=calcMacros; $("calcFuelBtn").onclick=calcFuel;
  $("saveJournalBtn").onclick=saveJournal; $("addTaskBtn").onclick=addTask; $("addHabitBtn").onclick=addHabit; $("saveBookBtn").onclick=saveBook;
  $("saveCloudConfigBtn").onclick=saveCloudConfig; $("cloudSignupBtn").onclick=cloudSignup; $("cloudSigninBtn").onclick=cloudSignin; $("cloudPushBtn").onclick=cloudPush; $("cloudPullBtn").onclick=cloudPull; $("cloudSignoutBtn").onclick=cloudSignout;
  $("saveEmailConfigBtn").onclick=saveEmailConfig; $("mailtoDailyBtn").onclick=openDailyEmail; $("webhookDailyBtn").onclick=sendDailyWebhook; $("webhookVaultBtn").onclick=sendVaultWebhook;
  $("changePasswordBtn").onclick=changePassword; $("exportEncryptedBtn").onclick=exportEncrypted; $("exportPlainBtn").onclick=exportPlain; $("importInput").onchange=importBackup; $("copyBackupBtn").onclick=copyEncrypted;
}
function switchView(view){
  currentView=view; $$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===view)); $$(".view").forEach(v=>v.classList.toggle("active",v.id===view));
  const map={dashboard:"Dashboard",nutrition:"Nutrition",gym:"Gym",running:"Běh",calculators:"Kalkulačky",life:"Life OS",analytics:"Analytics",connections:"Connection Hub"}; $("viewTitle").textContent=map[view]||view;
  if(view==="analytics") setTimeout(renderCharts,80);
}
function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.remove("hidden"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.add("hidden"),2800); }
function renderAll(){ if(!state)return; migrate(); ensureDay(); hydrateSettingsFields(); renderDashboard(); renderDayInputs(); renderFoods(); renderFoodLog(); renderTargets(); renderMealBuilder(); renderExercisePresets(); renderWorkoutDraft(); renderWorkoutHistory(); renderGymInsights(); renderRunTypeCards(); renderRunHistory(); renderRunInsights(); renderCalculatorsDefaults(); renderJournal(); renderTasks(); renderHabits(); renderBooks(); renderSecurityStats(); renderConnectionStatus(); renderPrBoard(); if(currentView==="analytics") renderCharts(); }
function dayTotals(iso=selectedDate){
  const d=ensureDay(iso); const food=(d.foodLogs||[]).reduce((a,f)=>({kcal:a.kcal+num(f.kcal),protein:a.protein+num(f.protein),carbs:a.carbs+num(f.carbs),fat:a.fat+num(f.fat),fiber:a.fiber+num(f.fiber),salt:a.salt+num(f.salt)}),{kcal:0,protein:0,carbs:0,fat:0,fiber:0,salt:0});
  return {kcal:num(d.kcal)+food.kcal,protein:num(d.protein)+food.protein,carbs:num(d.carbs)+food.carbs,fat:num(d.fat)+food.fat,fiber:num(d.fiber)+food.fiber,salt:num(d.salt)+food.salt,food};
}
function recentDays(n=30){ const arr=[]; for(let i=n-1;i>=0;i--){const x=new Date();x.setDate(x.getDate()-i);arr.push(x.toISOString().slice(0,10));} return arr; }
function rollingAvgWeight(){ const vals=recentDays(7).map(d=>num(state.days[d]?.weight,NaN)).filter(Number.isFinite); return vals.length?round(vals.reduce((a,b)=>a+b,0)/vals.length,1):"—"; }
function trainingLoad(iso=selectedDate){
  const gym=state.workouts.filter(w=>w.date===iso).reduce((a,w)=>a+workoutVolume(w)/1000,0);
  const run=state.runs.filter(r=>r.date===iso).reduce((a,r)=>a+num(r.distance)*num(r.rpe,5),0);
  return Math.round(gym+run);
}
function arcScore(){
  const d=ensureDay(); const totals=dayTotals(); const t=state.targets; let score=0;
  score += clamp((totals.protein/(t.protein||175))*24,0,24);
  score += clamp((num(d.steps)/(t.steps||10000))*14,0,14);
  score += clamp((num(d.sleep)/(t.sleep||7.5))*16,0,16);
  score += num(d.weight)?10:0; score += (d.notes||"").trim()?8:0; score += (d.mood?8:0); score += state.workouts.some(w=>w.date===selectedDate)?10:0; score += state.runs.some(r=>r.date===selectedDate)?10:0;
  return Math.round(clamp(score,0,100));
}
function renderDashboard(){
  const d=ensureDay(); const totals=dayTotals(); const score=arcScore();
  $("arcScore").textContent=score; $("scoreRingText").textContent=score+"%"; drawRing("scoreRing",score);
  $("dashKcal").textContent=Math.round(totals.kcal); $("dashKcalTarget").textContent="cíl "+fmt(state.targets.kcal);
  $("dashProtein").textContent=Math.round(totals.protein)+" g"; $("dashProteinTarget").textContent="cíl "+fmt(state.targets.protein)+" g";
  $("dashWeight").textContent=d.weight?d.weight+" kg":"—"; $("dashAvgWeight").textContent=rollingAvgWeight()==="—"?"—":rollingAvgWeight()+" kg";
  $("dashSteps").textContent=fmt(d.steps||0); $("dashStepsTarget").textContent=fmt(state.targets.steps); $("dashSleep").textContent=d.sleep?d.sleep+" h":"—"; $("dashLoad").textContent=trainingLoad();
  const tips=coachTips(); $("coachOneLiner").textContent=tips[0]||"Zapiš dnešní data a coach ti dá tip."; $("coachTips").innerHTML=tips.map(t=>`<div class="coach-tip">${escapeHtml(t)}</div>`).join("");
  renderTimeline(); renderSyncMini();
}
function coachTips(){
  const d=ensureDay(); const totals=dayTotals(); const t=state.targets; const tips=[];
  if(totals.protein<t.protein*.75) tips.push(`Protein je zatím nízko (${Math.round(totals.protein)}/${t.protein} g). Dej skyr/tvaroh/whey/kuře a dorovnej recovery.`);
  if(totals.kcal && totals.kcal<t.kcal-500) tips.push("Jsi dost pod kcal cílem. Při gym + běh arc nechceš dlouhodobě jezdit low fuel.");
  if(num(d.sleep)&&num(d.sleep)<6.5) tips.push("Spánek pod 6.5 h = uber intenzitu, drž easy běh nebo techniku. Recovery first.");
  if(num(d.soreness)>7) tips.push("Soreness vysoká. Dej mobilitu, lehčí pump, chůzi nebo recovery jog, ne ego PR.");
  const weekKm=weekRunKm(); if(weekKm>state.targets.runKm*1.25) tips.push(`Týdenní km už ${round(weekKm,1)} km — hlídej nohy a nepřidávej objem moc rychle.`);
  const lastRun=state.runs.at(-1); if(lastRun&&lastRun.hr>165&&lastRun.type.includes("Easy")) tips.push("Easy běh s HR 165+ už není moc easy. Vítr/kopečky/rýma to zvednou, ale další easy klidně zpomal.");
  if(!state.workouts.some(w=>w.date===selectedDate)&&!state.runs.some(r=>r.date===selectedDate)) tips.push("Dnes bez tréninku? Fine, ale zapiš aspoň kroky, jídlo a deník, ať držíš streak.");
  if(tips.length<3) tips.push("Solidní den. Největší páka: konzistentní protein, spánek, a postupný progress bez zrakvení.");
  return tips.slice(0,5);
}
function renderTimeline(){
  const entries=[]; const d=ensureDay(); const totals=dayTotals();
  if(totals.kcal) entries.push(["Nutrition",`${Math.round(totals.kcal)} kcal · ${Math.round(totals.protein)} g protein`]);
  state.workouts.filter(w=>w.date===selectedDate).forEach(w=>entries.push(["Gym",`${w.type} · ${Math.round(workoutVolume(w))} kg volume`]));
  state.runs.filter(r=>r.date===selectedDate).forEach(r=>entries.push(["Run",`${r.type} · ${r.distance} km · ${pace(r.seconds,r.distance)}`]));
  state.journals.filter(j=>j.date===selectedDate).forEach(j=>entries.push(["Journal",`${j.mood} · ${j.score||"—"}/10`]));
  if(d.notes) entries.push(["Note",d.notes]);
  $("todayTimelineTag").textContent=entries.length+" entries";
  $("todayTimeline").innerHTML=entries.length?entries.map(e=>`<div class="item"><span class="dot"></span><div><strong>${escapeHtml(e[0])}</strong><small>${escapeHtml(e[1])}</small></div></div>`).join(""):`<div class="item muted">Dnes zatím nic. Přidej jídlo, workout nebo běh.</div>`;
}
function renderDayInputs(){ const d=ensureDay(); ["Weight","Kcal","Protein","Steps","Sleep","Mood","Energy","Soreness"].forEach(k=>{ const id="quick"+k; const prop=k.toLowerCase(); if($(id)) $(id).value=d[prop]??""; }); $("quickNote").value=d.notes||""; }
function saveQuickDay(){ const d=ensureDay(); d.weight=num($("quickWeight").value,""); d.kcal=num($("quickKcal").value,0); d.protein=num($("quickProtein").value,0); d.steps=num($("quickSteps").value,0); d.sleep=num($("quickSleep").value,""); d.mood=num($("quickMood").value,""); d.energy=num($("quickEnergy").value,""); d.soreness=num($("quickSoreness").value,""); d.notes=$("quickNote").value.trim(); saveVault(); }
function drawRing(id,pct){ const c=$(id); if(!c)return; const ctx=c.getContext("2d"), w=c.width,h=c.height,r=w/2-12; ctx.clearRect(0,0,w,h); ctx.lineWidth=13; ctx.lineCap="round"; ctx.strokeStyle="rgba(148,163,184,.18)"; ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);ctx.stroke(); const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#8b5cf6");g.addColorStop(.55,"#22d3ee");g.addColorStop(1,"#34d399"); ctx.strokeStyle=g; ctx.beginPath();ctx.arc(w/2,h/2,r,-Math.PI/2,-Math.PI/2+Math.PI*2*pct/100);ctx.stroke(); }

function calculateFood(){
  const grams=num($("foodGrams").value,0), factor=grams/100;
  calculatedFood={id:uid(),name:$("foodName").value.trim()||"Custom food",grams,kcal:round(num($("foodKcal100").value)*factor,0),protein:round(num($("foodProtein100").value)*factor,1),carbs:round(num($("foodCarbs100").value)*factor,1),fat:round(num($("foodFat100").value)*factor,1),fiber:round(num($("foodFiber100").value)*factor,1),salt:round(num($("foodSalt100").value)*factor,2),kcal100:num($("foodKcal100").value),protein100:num($("foodProtein100").value),carbs100:num($("foodCarbs100").value),fat100:num($("foodFat100").value),fiber100:num($("foodFiber100").value),salt100:num($("foodSalt100").value),tags:$("foodTags").value.split(/[ ,]+/).filter(Boolean),icon:$("foodIcon").value||"🍽️",image:selectedFoodImage,preset:false};
  $("foodCalcResult").innerHTML=`<strong>${escapeHtml(calculatedFood.name)} · ${grams||0} g</strong><br>${calculatedFood.kcal} kcal · P ${calculatedFood.protein} g · C ${calculatedFood.carbs} g · F ${calculatedFood.fat} g · fiber ${calculatedFood.fiber} g`;
  return calculatedFood;
}
async function handleFoodImage(e){ const file=e.target.files?.[0]; if(!file)return; selectedFoodImage=await compressImage(file,560,0.78); renderFoodImagePreview(); calculateFood(); }
function clearFoodImage(){ selectedFoodImage=""; $("foodImageInput").value=""; renderFoodImagePreview(); calculateFood(); }
function renderFoodImagePreview(){ const el=$("foodImagePreview"); if(!selectedFoodImage){el.textContent="Bez obrázku";return;} el.innerHTML=`<img alt="food image" src="${selectedFoodImage}">`; }
function compressImage(file,max=560,quality=.76){ return new Promise((resolve,reject)=>{ const img=new Image(); const reader=new FileReader(); reader.onload=()=>{ img.onload=()=>{ const scale=Math.min(1,max/Math.max(img.width,img.height)); const canvas=document.createElement("canvas"); canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale); const ctx=canvas.getContext("2d"); ctx.drawImage(img,0,0,canvas.width,canvas.height); resolve(canvas.toDataURL("image/jpeg",quality)); }; img.onerror=reject; img.src=reader.result; }; reader.onerror=reject; reader.readAsDataURL(file); }); }
function saveCustomFood(){ const f=calculateFood(); if(!f.name||!f.grams)return toast("Zadej název a gramáž."); const base={...f,id:uid(),savedAt:new Date().toISOString()}; state.customFoods.unshift(base); state.foods.unshift({...base,preset:false,category:"custom"}); saveVault(); toast("Custom jídlo uloženo."); }
function addCalculatedFoodToDay(){ const f=calculateFood(); if(!f.grams)return toast("Zadej gramáž."); addFoodLog(f); }
function addFoodLog(f){ const d=ensureDay(); d.foodLogs.unshift({...f,id:uid(),date:selectedDate,addedAt:new Date().toISOString()}); saveVault(); toast("Jídlo přidáno do dne."); }
function renderFoods(){
  const q=($("foodSearch").value||"").toLowerCase(); const cat=$("foodCategoryFilter").value; let foods=[...state.customFoods,...state.foods];
  if(cat) foods=foods.filter(f=>f.category===cat); if(q) foods=foods.filter(f=>(f.name+" "+(f.tags||[]).join(" ")+" "+(f.category||"")).toLowerCase().includes(q));
  const shown=foods.slice(0,120); $("foodDbCount").textContent=`${state.foods.length}+ presetů · ${state.customFoods.length} custom`;
  $("foodDbList").innerHTML=shown.map(f=>foodCard(f)).join("") || `<div class="item muted">Nic nenalezeno.</div>`;
  $("foodDbList").querySelectorAll("[data-addfood]").forEach(btn=>btn.onclick=()=>quickAddFood(btn.dataset.addfood));
  $("foodDbList").querySelectorAll("[data-editfood]").forEach(btn=>btn.onclick=()=>loadFoodToCalc(btn.dataset.editfood));
  $("foodDbList").querySelectorAll("[data-mealfood]").forEach(btn=>btn.onclick=()=>addToMeal(btn.dataset.mealfood));
}
function foodCard(f){ const img=f.image?`<img alt="${escapeAttr(f.name)}" src="${f.image}">`:escapeHtml(f.icon||"🍽️"); return `<article class="food-card"><div class="media">${img}</div><div><h4>${escapeHtml(f.name)}</h4><div class="macro-line"><span>${Math.round(f.kcal100||0)} kcal</span><span>P ${round(f.protein100||0,1)}</span><span>C ${round(f.carbs100||0,1)}</span><span>F ${round(f.fat100||0,1)}</span></div><small class="muted">${escapeHtml((f.tags||[]).slice(0,4).join(" · "))}</small></div><div class="button-row wrap"><button class="btn tiny primary" data-addfood="${f.id}">+ day</button><button class="btn tiny ghost" data-mealfood="${f.id}">+ meal</button><button class="btn tiny ghost" data-editfood="${f.id}">edit</button></div></article>`; }
function findFood(id){ return [...state.customFoods,...state.foods].find(f=>f.id===id); }
function quickAddFood(id){ const f=findFood(id); if(!f)return; const grams=parseFloat(prompt(`Kolik gramů: ${f.name}?`,"100")||"0"); if(!grams)return; addFoodLog(foodFromPreset(f,grams)); }
function foodFromPreset(f,grams){ const factor=grams/100; return {id:uid(),name:f.name,icon:f.icon||"🍽️",image:f.image||"",grams,kcal:round(num(f.kcal100)*factor,0),protein:round(num(f.protein100)*factor,1),carbs:round(num(f.carbs100)*factor,1),fat:round(num(f.fat100)*factor,1),fiber:round(num(f.fiber100)*factor,1),salt:round(num(f.salt100)*factor,2),kcal100:f.kcal100,protein100:f.protein100,carbs100:f.carbs100,fat100:f.fat100,fiber100:f.fiber100,salt100:f.salt100,tags:f.tags||[],preset:!!f.preset}; }
function loadFoodToCalc(id){ const f=findFood(id); if(!f)return; $("foodName").value=f.name; $("foodGrams").value=100; $("foodKcal100").value=f.kcal100||0; $("foodProtein100").value=f.protein100||0; $("foodCarbs100").value=f.carbs100||0; $("foodFat100").value=f.fat100||0; $("foodFiber100").value=f.fiber100||0; $("foodSalt100").value=f.salt100||0; $("foodTags").value=(f.tags||[]).join(" "); $("foodIcon").value=f.icon||""; selectedFoodImage=f.image||""; renderFoodImagePreview(); calculateFood(); toast("Jídlo načteno do kalkulátoru."); }
function randomFood(){ const arr=state.foods; loadFoodToCalc(arr[Math.floor(Math.random()*arr.length)].id); }
function addToMeal(id){ const f=findFood(id); if(!f)return; const grams=parseFloat(prompt(`Gramáž do meal builderu: ${f.name}`,"100")||"0"); if(!grams)return; mealDraft.push(foodFromPreset(f,grams)); renderMealBuilder(); }
function renderMealBuilder(){ const totals=mealDraft.reduce((a,f)=>({kcal:a.kcal+num(f.kcal),protein:a.protein+num(f.protein),carbs:a.carbs+num(f.carbs),fat:a.fat+num(f.fat)}),{kcal:0,protein:0,carbs:0,fat:0}); $("mealBuilder").innerHTML=mealDraft.length?`<div class="item"><strong>Meal total: ${Math.round(totals.kcal)} kcal</strong><small>P ${round(totals.protein,1)} · C ${round(totals.carbs,1)} · F ${round(totals.fat,1)}</small></div>`+mealDraft.map((f,i)=>`<div class="item"><div class="item-head"><div><strong>${escapeHtml(f.name)}</strong><small>${f.grams} g · ${f.kcal} kcal</small></div><button class="btn tiny ghost danger" onclick="removeMealItem(${i})">×</button></div></div>`).join(""):`<div class="item muted">Vyber jídla z databáze přes + meal.</div>`; }
window.removeMealItem=i=>{mealDraft.splice(i,1);renderMealBuilder();};
function addMealToDay(){ if(!mealDraft.length)return toast("Meal je prázdný."); mealDraft.forEach(addFoodLogNoSave); mealDraft=[]; saveVault(); }
function addFoodLogNoSave(f){ ensureDay().foodLogs.unshift({...f,id:uid(),date:selectedDate,addedAt:new Date().toISOString()}); }
function renderFoodLog(){
  const d=ensureDay(); const totals=dayTotals(); $("todayFoodTag").textContent=`${Math.round(totals.kcal)} kcal`; renderMacroBars(totals);
  $("foodLogList").innerHTML=(d.foodLogs||[]).map(f=>`<div class="item"><div class="item-head"><div><strong>${escapeHtml(f.icon||"🍽️")} ${escapeHtml(f.name)}</strong><small>${f.grams} g · ${f.kcal} kcal · P ${f.protein} C ${f.carbs} F ${f.fat}</small></div><button class="btn tiny ghost danger" onclick="deleteFoodLog('${f.id}')">Smazat</button></div></div>`).join("")||`<div class="item muted">Dnes zatím žádné jídlo.</div>`;
}
window.deleteFoodLog=id=>{ const d=ensureDay(); d.foodLogs=d.foodLogs.filter(f=>f.id!==id); saveVault(); };
function renderMacroBars(totals){ const t=state.targets; const rows=[["Kcal",totals.kcal,t.kcal,""],["Protein",totals.protein,t.protein,"g"],["Sachry",totals.carbs,t.carbs,"g"],["Tuky",totals.fat,t.fat,"g"]]; $("macroBars").innerHTML=rows.map(r=>`<div class="macro-bar"><header><span>${r[0]}</span><span>${Math.round(r[1])}/${r[2]} ${r[3]}</span></header><div class="bar"><i style="width:${clamp(r[1]/(r[2]||1)*100,0,130)}%"></i></div></div>`).join(""); }
function renderTargets(){ const t=state.targets; $("targetKcal").value=t.kcal; $("targetProtein").value=t.protein; $("targetCarbs").value=t.carbs; $("targetFat").value=t.fat; $("targetSteps").value=t.steps; $("targetRunKm").value=t.runKm; }
function saveTargets(){ state.targets={...state.targets,kcal:num($("targetKcal").value),protein:num($("targetProtein").value),carbs:num($("targetCarbs").value),fat:num($("targetFat").value),steps:num($("targetSteps").value),runKm:num($("targetRunKm").value)}; saveVault(); }
function renderExercisePresets(){ const q=($("exerciseSearch")?.value||"").toLowerCase(); const presets=[...new Set(state.exercisePresets)].filter(x=>x.toLowerCase().includes(q)).slice(0,120); $("exercisePresets").innerHTML=presets.map(p=>`<button class="chip" data-ex="${escapeAttr(p)}">${escapeHtml(p)}</button>`).join(""); $("exercisePresets").querySelectorAll("[data-ex]").forEach(b=>b.onclick=()=>{$("exerciseName").value=b.dataset.ex;}); }
function addSetToDraft(){
  const name=$("exerciseName").value.trim(); if(!name)return toast("Zadej cvik."); const kg=num($("setKg").value,0), reps=num($("setReps").value,0), rir=num($("setRir").value,0), count=Math.max(1,parseInt($("setCount").value||"1")); if(!reps)return toast("Zadej reps.");
  let ex=workoutDraft.find(e=>e.name.toLowerCase()===name.toLowerCase()); if(!ex){ex={name,sets:[]}; workoutDraft.push(ex);} for(let i=0;i<count;i++) ex.sets.push({kg,reps,rir});
  if(!state.exercisePresets.includes(name)) state.exercisePresets.unshift(name); renderWorkoutDraft(); renderExercisePresets();
}
function renderWorkoutDraft(){ $("workoutDraft").innerHTML=workoutDraft.length?workoutDraft.map((e,i)=>`<div class="item"><div class="item-head"><div><strong>${escapeHtml(e.name)}</strong><small>${e.sets.map(s=>`${s.kg}×${s.reps} RIR${s.rir}`).join(" · ")}</small></div><button class="btn tiny ghost danger" onclick="removeDraftExercise(${i})">×</button></div></div>`).join(""):`<div class="item muted">Draft prázdný.</div>`; }
window.removeDraftExercise=i=>{workoutDraft.splice(i,1);renderWorkoutDraft();};
function saveWorkout(){ if(!workoutDraft.length)return toast("Přidej aspoň jednu sérii."); const w={id:uid(),date:selectedDate,type:$("workoutType").value,notes:"",exercises:JSON.parse(JSON.stringify(workoutDraft)),createdAt:new Date().toISOString()}; state.workouts.unshift(w); workoutDraft=[]; saveVault(); toast("Workout uložen."); }
function workoutVolume(w){ return (w.exercises||[]).reduce((a,e)=>a+(e.sets||[]).reduce((b,s)=>b+num(s.kg)*num(s.reps),0),0); }
function renderWorkoutHistory(){ $("workoutCountTag").textContent=state.workouts.length; $("workoutHistory").innerHTML=state.workouts.slice(0,60).map(w=>`<div class="item"><div class="item-head"><div><strong>${w.date} · ${escapeHtml(w.type)}</strong><small>${(w.exercises||[]).map(e=>`${e.name} (${e.sets.length})`).join(" · ")}<br>Volume ${Math.round(workoutVolume(w))} kg</small></div><button class="btn tiny ghost danger" onclick="deleteWorkout('${w.id}')">Smazat</button></div></div>`).join("")||`<div class="item muted">Žádné workouty.</div>`; }
window.deleteWorkout=id=>{state.workouts=state.workouts.filter(w=>w.id!==id);saveVault();};
function renderGymInsights(){
  const map={}; state.workouts.forEach(w=>(w.exercises||[]).forEach(e=>(e.sets||[]).forEach(s=>{ const e1=epley(num(s.kg),num(s.reps)+num(s.rir)); if(!map[e.name]||e1>map[e.name].e1) map[e.name]={e1,kg:s.kg,reps:s.reps,rir:s.rir,date:w.date}; })));
  const rows=Object.entries(map).sort((a,b)=>b[1].e1-a[1].e1).slice(0,12);
  $("gymInsights").innerHTML=rows.map(([name,v])=>`<div class="item"><strong>${escapeHtml(name)}</strong><small>Best e1RM ${round(v.e1,1)} kg · from ${v.kg}×${v.reps} RIR${v.rir} · ${v.date}<br>Next tip: ${nextLift(v.kg,v.reps,v.rir)}</small></div>`).join("")||`<div class="item muted">Logni workout a uvidíš PR/next lift.</div>`;
}
function nextLift(kg,reps,rir){ if(rir>=2) return `zkus ${kg} kg × ${reps+1} nebo ${round(kg+2.5,1)} kg × ${Math.max(1,reps-1)}`; if(reps>=8) return `zkus ${round(kg+2.5,1)} kg × ${reps-2}`; return `opakuj ${kg} kg a získej čistší reps`; }
function importWorkoutHistory(e){ const file=e.target.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{ const text=reader.result; const names=extractExercises(text); let added=0; names.forEach(n=>{ if(n.length>2&&!state.exercisePresets.some(x=>x.toLowerCase()===n.toLowerCase())){ state.exercisePresets.unshift(n); added++; }}); saveVault(false); renderExercisePresets(); toast(`Import hotový: ${added} nových presetů.`); }; reader.readAsText(file); }
function extractExercises(text){ const out=new Set(); try{ const json=JSON.parse(text); JSON.stringify(json).split(/[\n,{}\[\]"]/).forEach(x=>maybeExercise(x,out)); }catch{ text.split(/[\n;,\t]/).forEach(x=>maybeExercise(x,out)); } return [...out].slice(0,200); }
function maybeExercise(raw,out){ const s=String(raw).trim().replace(/\s+/g," "); if(!s||s.length<3||s.length>42)return; if(/^[0-9.: -]+$/.test(s))return; if(/date|time|kg|reps|rir|sets|volume|note|id|workout/i.test(s))return; if(/[a-zA-ZÁ-ž]/.test(s))out.add(s); }

function parseTime(str){ if(!str)return 0; const parts=String(str).trim().split(":").map(Number); if(parts.some(n=>!Number.isFinite(n)))return 0; if(parts.length===3)return parts[0]*3600+parts[1]*60+parts[2]; if(parts.length===2)return parts[0]*60+parts[1]; return parts[0]; }
function formatTime(sec){ sec=Math.round(sec||0); const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60; return h?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${m}:${String(s).padStart(2,"0")}`; }
function pace(sec,km){ if(!sec||!km)return "—"; return formatTime(sec/km)+"/km"; }
function saveRun(){ const r={id:uid(),date:selectedDate,type:$("runType").value,distance:num($("runDistance").value),seconds:parseTime($("runTime").value),hr:num($("runHr").value,""),rpe:num($("runRpe").value,""),terrain:$("runTerrain").value.trim(),notes:$("runNotes").value.trim(),createdAt:new Date().toISOString()}; if(!r.distance||!r.seconds)return toast("Zadej km a čas."); state.runs.unshift(r); saveVault(); toast("Běh uložen."); }
function renderRunTypeCards(){ $("runTypeCards").innerHTML=RUN_TYPES.map(r=>`<div class="run-card"><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.goal)}<br>${escapeHtml(r.intensity)}</small><button class="btn tiny ghost" onclick="selectRunType('${escapeAttr(r.name)}')">Vybrat</button></div>`).join(""); }
window.selectRunType=name=>{$("runType").value=name;};
function renderRunHistory(){ $("runCountTag").textContent=state.runs.length; $("runHistory").innerHTML=state.runs.slice(0,60).map(r=>`<div class="item"><div class="item-head"><div><strong>${r.date} · ${escapeHtml(r.type)}</strong><small>${r.distance} km · ${formatTime(r.seconds)} · ${pace(r.seconds,r.distance)} · HR ${r.hr||"—"} · RPE ${r.rpe||"—"}<br>${escapeHtml(r.terrain||"")} ${escapeHtml(r.notes||"")}</small></div><button class="btn tiny ghost danger" onclick="deleteRun('${r.id}')">Smazat</button></div></div>`).join("")||`<div class="item muted">Žádné běhy.</div>`; }
window.deleteRun=id=>{state.runs=state.runs.filter(r=>r.id!==id);saveVault();};
function weekRunKm(){ const start=new Date(); start.setDate(start.getDate()-6); const min=start.toISOString().slice(0,10); return state.runs.filter(r=>r.date>=min).reduce((a,r)=>a+num(r.distance),0); }
function renderRunInsights(){ const fastest5=bestRace(5), fastest1=bestRace(1), week=weekRunKm(); $("runInsights").innerHTML=`<div class="item"><strong>Tento týden</strong><small>${round(week,1)} / ${state.targets.runKm} km</small></div><div class="item"><strong>Best 1 km estimate</strong><small>${fastest1||"zatím málo dat"}</small></div><div class="item"><strong>Best 5 km estimate</strong><small>${fastest5||"zatím málo dat"}</small></div><div class="item"><strong>Tip</strong><small>${week<state.targets.runKm*.6?"Je prostor přidat easy objem.":week>state.targets.runKm*1.15?"Objem už je vysoko, drž recovery.":"Objem sedí, dej kvalitní jeden tempo/interval den."}</small></div>`; }
function bestRace(km){ const candidates=state.runs.filter(r=>r.distance>=km*.95).map(r=>r.seconds*Math.pow(km/r.distance,1.06)).filter(Number.isFinite); if(!candidates.length)return null; return formatTime(Math.min(...candidates)); }

function renderCalculatorsDefaults(){ const d=ensureDay(); if(!$('tdeeWeight').dataset.touched){$('tdeeWeight').value=d.weight||state.profile.weight||80;} }
function epley(kg,reps){ return num(kg)*(1+num(reps)/30); }
function calc1rm(){ const kg=num($("oneRmKg").value), reps=num($("oneRmReps").value), rir=num($("oneRmRir").value); const est=epley(kg,reps+rir); $("oneRmResult").innerHTML=`Odhad e1RM: <strong>${round(est,1)} kg</strong><br>RIR-adjusted reps: ${reps+rir}`; }
function calcVo2(){ const km=num($("vo2Dist").value), sec=parseTime($("vo2Time").value); if(!km||!sec)return toast("Zadej vzdálenost a čas."); const m=km*1000, min=sec/60, v=m/min; const vo2=-4.60+0.182258*v+0.000104*v*v; $("vo2Result").innerHTML=`VO₂max estimate: <strong>${round(vo2,1)}</strong><br>Pace ${pace(sec,km)}`; }
function calcTdee(){ const w=num($("tdeeWeight").value), h=num($("tdeeHeight").value), age=num($("tdeeAge").value), act=num($("tdeeActivity").value); const bmr=10*w+6.25*h-5*age+5; const tdee=bmr*act; const bmi=w/((h/100)**2); $("tdeeResult").innerHTML=`BMI: <strong>${round(bmi,1)}</strong><br>BMR: ${Math.round(bmr)} kcal<br>TDEE: <strong>${Math.round(tdee)} kcal</strong>`; }
function calcPace(){ const km=num($("paceDist").value), sec=parseTime($("paceTime").value), pred=num($("predDist").value); if(!km||!sec)return toast("Zadej km a čas."); const predSec=sec*Math.pow(pred/km,1.06); $("paceResult").innerHTML=`Pace: <strong>${pace(sec,km)}</strong><br>${pred} km predictor: <strong>${formatTime(predSec)}</strong>`; }
function calcMacros(){ const kcal=num($("macroKcal").value), p=num($("macroProtein").value), f=num($("macroFat").value); const carbs=(kcal-p*4-f*9)/4; $("macroResult").innerHTML=`Sachry: <strong>${Math.max(0,Math.round(carbs))} g</strong><br>P ${p} g · F ${f} g · kcal ${kcal}`; }
function calcFuel(){ const min=num($("fuelMinutes").value), w=num($("fuelWeight").value); const water=round(w*(min/60)*8,0); const carbs=min>=75?Math.round((min/60)*35):0; $("fuelResult").innerHTML=`Voda orientačně: <strong>${water} ml</strong><br>Sacharidy při long run: <strong>${carbs} g</strong> (${Math.ceil(carbs/25)} gelů po 25 g)`; }

function saveJournal(){ const text=$("journalText").value.trim(); if(!text)return toast("Napiš něco do deníku."); state.journals.unshift({id:uid(),date:selectedDate,mood:$("journalMood").value,score:num($("journalScore").value,""),text,createdAt:new Date().toISOString()}); $("journalText").value=""; saveVault(); }
function renderJournal(){ $("journalList").innerHTML=state.journals.slice(0,30).map(j=>`<div class="item"><div class="item-head"><div><strong>${j.date} · ${escapeHtml(j.mood)}</strong><small>${j.score||"—"}/10</small><p>${escapeHtml(j.text)}</p></div><button class="btn tiny ghost danger" onclick="deleteJournal('${j.id}')">×</button></div></div>`).join("")||`<div class="item muted">Žádný deník.</div>`; }
window.deleteJournal=id=>{state.journals=state.journals.filter(j=>j.id!==id);saveVault();};
function addTask(){ const text=$("taskText").value.trim(); if(!text)return; state.tasks.unshift({id:uid(),text,done:false,date:selectedDate,createdAt:new Date().toISOString()}); $("taskText").value=""; saveVault(); }
function renderTasks(){ $("taskList").innerHTML=state.tasks.slice(0,25).map(t=>`<div class="item"><div class="item-head"><label style="display:flex;align-items:center;gap:9px"><input style="width:auto" type="checkbox" ${t.done?"checked":""} onchange="toggleTask('${t.id}')"><span>${escapeHtml(t.text)}</span></label><button class="btn tiny ghost danger" onclick="deleteTask('${t.id}')">×</button></div></div>`).join("")||`<div class="item muted">Žádné tasky.</div>`; }
window.toggleTask=id=>{const t=state.tasks.find(x=>x.id===id); if(t)t.done=!t.done; saveVault();}; window.deleteTask=id=>{state.tasks=state.tasks.filter(t=>t.id!==id);saveVault();};
function addHabit(){ const text=$("habitText").value.trim(); if(!text)return; state.habits.unshift({id:uid(),text,dates:[],createdAt:new Date().toISOString()}); $("habitText").value=""; saveVault(); }
function renderHabits(){ $("habitList").innerHTML=state.habits.map(h=>`<button class="chip" onclick="toggleHabit('${h.id}')">${h.dates?.includes(selectedDate)?"✅":"⬜"} ${escapeHtml(h.text)} · ${habitStreak(h)}d</button>`).join("")||`<span class="chip">Žádné habits</span>`; }
window.toggleHabit=id=>{const h=state.habits.find(x=>x.id===id); if(!h)return; h.dates=h.dates||[]; h.dates.includes(selectedDate)?h.dates=h.dates.filter(d=>d!==selectedDate):h.dates.push(selectedDate); saveVault();};
function habitStreak(h){ let streak=0; for(const iso of recentDays(365).reverse()){ if(h.dates?.includes(iso))streak++; else if(iso<todayIso())break; } return streak; }
function saveBook(){ const title=$("bookTitle").value.trim(); if(!title)return toast("Zadej knihu."); state.books.unshift({id:uid(),title,author:$("bookAuthor").value.trim(),total:num($("bookTotal").value),current:num($("bookCurrent").value),note:$("bookNote").value.trim(),updatedAt:new Date().toISOString()}); ["bookTitle","bookAuthor","bookTotal","bookCurrent","bookNote"].forEach(id=>$(id).value=""); saveVault(); }
function renderBooks(){ $("bookList").innerHTML=state.books.map(b=>{ const pct=b.total?clamp(b.current/b.total*100,0,100):0; return `<div class="book"><div class="item-head"><div><strong>${escapeHtml(b.title)}</strong><small>${escapeHtml(b.author||"")} · ${b.current||0}/${b.total||"?"} stran</small></div><button class="btn tiny ghost danger" onclick="deleteBook('${b.id}')">×</button></div><div class="progress"><i style="width:${pct}%"></i></div><p class="small muted">${escapeHtml(b.note||"")}</p></div>`; }).join("")||`<div class="item muted">Žádné knihy.</div>`; }
window.deleteBook=id=>{state.books=state.books.filter(b=>b.id!==id);saveVault();};
function hydrateSettingsFields(){ if(!state)return; const c=state.settings.cloud||{}, e=state.settings.email||{}; if($("supabaseUrl")){$("supabaseUrl").value=c.url||""; $("supabaseKey").value=c.key||""; $("reportEmail").value=e.reportEmail||""; $("webhookUrl").value=e.webhookUrl||"";} }
function initSupabaseFromSettings(){ const c=state?.settings?.cloud||{}; if(c.url&&c.key&&window.supabase){ try{supabaseClient=window.supabase.createClient(c.url,c.key); logCloud("Supabase client ready.");}catch(e){logCloud("Supabase init error: "+e.message);} } }
function saveCloudConfig(){ state.settings.cloud.url=$("supabaseUrl").value.trim(); state.settings.cloud.key=$("supabaseKey").value.trim(); initSupabaseFromSettings(); saveVault(false); renderConnectionStatus(); toast("Cloud config uložen."); }
async function requireSupabase(){ if(!supabaseClient) initSupabaseFromSettings(); if(!supabaseClient) throw new Error("Supabase není nastavený nebo se nenačetla knihovna."); return supabaseClient; }
async function cloudSignup(){ try{ const sb=await requireSupabase(); const email=$("cloudEmail").value.trim(), password=$("cloudPassword").value; const {data,error}=await sb.auth.signUp({email,password}); if(error)throw error; cloudUser=data.user; logCloud("Sign up OK. Zkontroluj email, pokud je potvrzení zapnuté."); renderConnectionStatus(); }catch(e){logCloud("Sign up error: "+e.message);} }
async function cloudSignin(){ try{ const sb=await requireSupabase(); const email=$("cloudEmail").value.trim(), password=$("cloudPassword").value; const {data,error}=await sb.auth.signInWithPassword({email,password}); if(error)throw error; cloudUser=data.user; logCloud("Signed in: "+(cloudUser?.email||email)); renderConnectionStatus(); }catch(e){logCloud("Sign in error: "+e.message);} }
async function cloudSignout(){ try{ const sb=await requireSupabase(); await sb.auth.signOut(); cloudUser=null; logCloud("Signed out."); renderConnectionStatus(); }catch(e){logCloud("Signout error: "+e.message);} }
async function cloudPush(){ try{ const sb=await requireSupabase(); const {data:{user}}=await sb.auth.getUser(); if(!user)throw new Error("Nejsi přihlášený."); if(!encryptedVaultCache) encryptedVaultCache=await encryptState(state,vaultPassword||prompt("Vault heslo pro encrypted push:")||""); const payload={user_id:user.id,vault:encryptedVaultCache,updated_at:new Date().toISOString(),device_id:state.meta.deviceId}; const {error}=await sb.from("training_arc_vaults").upsert(payload,{onConflict:"user_id"}); if(error)throw error; state.settings.cloud.lastPush=new Date().toISOString(); await saveVault(false); logCloud("Push OK: encrypted vault uploaded."); }catch(e){logCloud("Push error: "+e.message);} }
async function cloudPull(){ try{ const sb=await requireSupabase(); const {data:{user}}=await sb.auth.getUser(); if(!user)throw new Error("Nejsi přihlášený."); const {data,error}=await sb.from("training_arc_vaults").select("vault,updated_at,device_id").eq("user_id",user.id).single(); if(error)throw error; if(!data?.vault)throw new Error("Remote vault nenalezen."); const pass=vaultPassword||prompt("Vault heslo pro decrypt remote vault:"); const remote=await decryptVault(data.vault,pass); if(!confirm(`Načíst cloud vault z ${data.updated_at}? Lokální data budou přepsána.`))return; state=remote; vaultPassword=pass; encryptedVaultCache=data.vault; localStorage.setItem(APP_KEY,JSON.stringify(data.vault)); state.settings.cloud.lastPull=new Date().toISOString(); await saveVault(false); logCloud("Pull OK: remote vault loaded."); }catch(e){logCloud("Pull error: "+e.message);} }
function logCloud(msg){ const el=$("cloudLog"); if(el)el.textContent=`[${new Date().toLocaleTimeString("cs-CZ")}] ${msg}\n`+(el.textContent||""); }
function renderConnectionStatus(){ if(!state)return; const cloud=state.settings.cloud||{}, email=state.settings.email||{}; $("cloudStatusTag").textContent=supabaseClient?"configured":"offline"; $("syncMini").textContent=supabaseClient?"Cloud ready":"Local vault"; $("emailStatus").textContent=`Email: ${email.reportEmail||"nenastaven"}\nWebhook: ${email.webhookUrl?"nastaven":"nenastaven"}`; }
function renderSyncMini(){ $("syncMini").textContent=unsafeMode?"Unsafe local":supabaseClient?"Cloud ready":"Encrypted local"; }
function saveEmailConfig(){ state.settings.email.reportEmail=$("reportEmail").value.trim(); state.settings.email.webhookUrl=$("webhookUrl").value.trim(); saveVault(false); renderConnectionStatus(); toast("Email/webhook config uložen."); }
function dailyReportText(){ const d=ensureDay(), totals=dayTotals(); const runs=state.runs.filter(r=>r.date===selectedDate), gyms=state.workouts.filter(w=>w.date===selectedDate); return `Training Arc OS daily report ${selectedDate}\n\nScore: ${arcScore()}/100\nWeight: ${d.weight||"—"} kg\nNutrition: ${Math.round(totals.kcal)} kcal · P ${round(totals.protein,1)} C ${round(totals.carbs,1)} F ${round(totals.fat,1)}\nSteps: ${d.steps||0}\nSleep: ${d.sleep||"—"} h\nMood/Energy/Soreness: ${d.mood||"—"}/${d.energy||"—"}/${d.soreness||"—"}\nGym: ${gyms.map(w=>w.type+" "+Math.round(workoutVolume(w))+"kg").join(", ")||"—"}\nRuns: ${runs.map(r=>r.type+" "+r.distance+"km "+pace(r.seconds,r.distance)).join(", ")||"—"}\nNotes: ${d.notes||"—"}\n\nCoach:\n- ${coachTips().join("\n- ")}`; }
function openDailyEmail(){ const to=state.settings.email.reportEmail||$("reportEmail").value.trim(); const subject=encodeURIComponent("Training Arc OS report "+selectedDate); const body=encodeURIComponent(dailyReportText()); location.href=`mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`; }
async function sendDailyWebhook(){ const url=state.settings.email.webhookUrl||$("webhookUrl").value.trim(); if(!url)return toast("Nastav webhook URL."); try{ await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"daily_report",date:selectedDate,report:dailyReportText(),summary:dayTotals()})}); $("emailStatus").textContent="Daily webhook sent."; }catch(e){$("emailStatus").textContent="Webhook error: "+e.message;} }
async function sendVaultWebhook(){ const url=state.settings.email.webhookUrl||$("webhookUrl").value.trim(); if(!url)return toast("Nastav webhook URL."); try{ if(!encryptedVaultCache)encryptedVaultCache=await encryptState(state,vaultPassword); await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"encrypted_vault",vault:encryptedVaultCache})}); $("emailStatus").textContent="Encrypted vault webhook sent."; }catch(e){$("emailStatus").textContent="Vault webhook error: "+e.message;} }
function renderSecurityStats(){ const raw=localStorage.getItem(APP_KEY); const size=raw?Math.round(raw.length/1024):0; $("securityStats").innerHTML=`<div class="item"><strong>Vault mode</strong><small>${unsafeMode?"UNSAFE plaintext test mode":"AES-GCM encrypted local vault"}</small></div><div class="item"><strong>KDF</strong><small>PBKDF2-SHA256 · ${state.settings.security.kdfIterations.toLocaleString("cs-CZ")} iterations</small></div><div class="item"><strong>Local size</strong><small>${size} KB encrypted JSON</small></div><div class="item"><strong>Device ID</strong><small>${escapeHtml(state.meta.deviceId)}</small></div>`; }
async function changePassword(){ const a=$("newVaultPassword").value, b=$("newVaultPassword2").value; if(!a||a.length<6)return toast("Nové heslo aspoň 6 znaků."); if(a!==b)return toast("Hesla nesedí."); vaultPassword=a; unsafeMode=false; await saveVault(false); toast("Vault heslo změněno a vault přešifrován."); }
function download(filename,text){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:"application/json"})); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
async function exportEncrypted(){ if(!encryptedVaultCache) encryptedVaultCache=await encryptState(state,vaultPassword); download(`training_arc_v5_encrypted_${todayIso()}.json`,JSON.stringify(encryptedVaultCache,null,2)); }
function exportPlain(){ if(!confirm("Plain export není šifrovaný. Fakt stáhnout?"))return; download(`training_arc_v5_plain_${todayIso()}.json`,JSON.stringify(state,null,2)); }
async function copyEncrypted(){ if(!encryptedVaultCache) encryptedVaultCache=await encryptState(state,vaultPassword); await navigator.clipboard.writeText(JSON.stringify(encryptedVaultCache)); toast("Encrypted vault zkopírován."); }
function importBackup(e){ const file=e.target.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=async()=>{ try{ const obj=JSON.parse(reader.result); if(obj.cipher&&obj.data){ const pass=prompt("Heslo k importovanému encrypted vaultu:"); state=await decryptVault(obj,pass); vaultPassword=pass; encryptedVaultCache=obj; localStorage.setItem(APP_KEY,JSON.stringify(obj)); } else { if(!confirm("Import plain JSON přepíše aktuální data."))return; state=obj; } migrate(); await saveVault(false); openApp(); toast("Import hotový."); }catch(err){toast("Import error: "+err.message);} }; reader.readAsText(file); }

function renderPrBoard(){
  const prs=[]; const run1=bestRace(1), run5=bestRace(5), run10=bestRace(10); if(run1)prs.push(["1 km",run1,"run estimate"]); if(run5)prs.push(["5 km",run5,"run estimate"]); if(run10)prs.push(["10 km",run10,"run estimate"]);
  const ex={}; state.workouts.forEach(w=>(w.exercises||[]).forEach(e=>(e.sets||[]).forEach(s=>{ const val=epley(s.kg,s.reps+s.rir); if(!ex[e.name]||val>ex[e.name]) ex[e.name]=val; }))); Object.entries(ex).sort((a,b)=>b[1]-a[1]).slice(0,9).forEach(([k,v])=>prs.push([k,round(v,1)+" kg","e1RM"]));
  $("prBoard").innerHTML=prs.map(p=>`<div class="pr-card"><small>${escapeHtml(p[2])}</small><strong>${escapeHtml(p[1])}</strong><span>${escapeHtml(p[0])}</span></div>`).join("")||`<div class="item muted">PR board se naplní po lozích.</div>`;
}
function renderCharts(){ drawLineChart("chartWeight",recentDays(30).map(d=>({x:d.slice(5),y:num(state.days[d]?.weight,NaN)})).filter(p=>Number.isFinite(p.y)),"kg"); drawMultiLine("chartNutrition",recentDays(14).map(d=>({x:d.slice(5),kcal:dayTotals(d).kcal,protein:dayTotals(d).protein*15})),["kcal","protein"]); drawBars("chartRuns",weeklyBuckets(state.runs,r=>num(r.distance)),"km"); drawBars("chartGym",weeklyBuckets(state.workouts,w=>workoutVolume(w)/1000),"k kg"); }
function weeklyBuckets(items,valFn){ const buckets={}; items.forEach(it=>{ const d=new Date(it.date); const monday=new Date(d); monday.setDate(d.getDate()-((d.getDay()+6)%7)); const key=monday.toISOString().slice(5,10); buckets[key]=(buckets[key]||0)+valFn(it); }); return Object.entries(buckets).slice(-8).map(([x,y])=>({x,y:round(y,1)})); }
function chartBase(id){ const c=$(id), ctx=c.getContext("2d"), w=c.width=c.clientWidth*devicePixelRatio, h=c.height=(c.getAttribute("height")||220)*devicePixelRatio; ctx.clearRect(0,0,w,h); ctx.scale(devicePixelRatio,devicePixelRatio); return {ctx,w:c.clientWidth,h:h/devicePixelRatio}; }
function drawAxes(ctx,w,h){ ctx.strokeStyle="rgba(148,163,184,.18)"; ctx.lineWidth=1; for(let i=0;i<4;i++){ const y=20+i*(h-45)/3; ctx.beginPath(); ctx.moveTo(35,y); ctx.lineTo(w-10,y); ctx.stroke(); } }
function drawLineChart(id,data,label){ const {ctx,w,h}=chartBase(id); drawAxes(ctx,w,h); if(data.length<2){ctx.fillStyle="#94a3b8";ctx.fillText("málo dat",40,80);return;} const min=Math.min(...data.map(d=>d.y)), max=Math.max(...data.map(d=>d.y)), range=max-min||1; ctx.strokeStyle="#22d3ee"; ctx.lineWidth=3; ctx.beginPath(); data.forEach((d,i)=>{const x=35+i*(w-55)/(data.length-1), y=20+(max-d.y)/range*(h-55); i?ctx.lineTo(x,y):ctx.moveTo(x,y);}); ctx.stroke(); ctx.fillStyle="#94a3b8"; ctx.fillText(`${round(min,1)}–${round(max,1)} ${label}`,38,h-12); }
function drawMultiLine(id,data,keys){ const {ctx,w,h}=chartBase(id); drawAxes(ctx,w,h); const vals=data.flatMap(d=>keys.map(k=>d[k])).filter(v=>v>0); if(vals.length<2){ctx.fillStyle="#94a3b8";ctx.fillText("málo dat",40,80);return;} const max=Math.max(...vals), min=0, colors=["#8b5cf6","#34d399"]; keys.forEach((k,ki)=>{ctx.strokeStyle=colors[ki];ctx.lineWidth=3;ctx.beginPath(); data.forEach((d,i)=>{const x=35+i*(w-55)/(data.length-1), y=20+(max-d[k])/(max-min||1)*(h-55); i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}); ctx.fillStyle="#94a3b8";ctx.fillText("protein scaled ×15",38,h-12); }
function drawBars(id,data,label){ const {ctx,w,h}=chartBase(id); drawAxes(ctx,w,h); if(!data.length){ctx.fillStyle="#94a3b8";ctx.fillText("málo dat",40,80);return;} const max=Math.max(...data.map(d=>d.y),1); const bw=(w-55)/data.length*.65; data.forEach((d,i)=>{const x=35+i*(w-55)/data.length, bh=d.y/max*(h-55); const g=ctx.createLinearGradient(0,h-bh,0,h-20); g.addColorStop(0,"#8b5cf6");g.addColorStop(1,"#22d3ee"); ctx.fillStyle=g; ctx.fillRect(x,h-25-bh,bw,bh); ctx.fillStyle="#94a3b8"; ctx.font="11px sans-serif"; ctx.fillText(d.x,x,h-8);}); ctx.fillText(label,38,18); }

function openCommandPalette(){ $("commandPalette").classList.remove("hidden"); $("commandSearch").value=""; renderCommands(); setTimeout(()=>$("commandSearch").focus(),30); }
function closeCommandPalette(){ $("commandPalette").classList.add("hidden"); }
function renderCommands(){ const q=($("commandSearch").value||"").toLowerCase(); const rows=COMMANDS.filter(c=>c[0].toLowerCase().includes(q)); $("commandResults").innerHTML=rows.map(c=>`<div class="item" data-cmd="${c[1]}"><strong>${c[0]}</strong><small>Přejít do sekce</small></div>`).join(""); $("commandResults").querySelectorAll("[data-cmd]").forEach(el=>el.onclick=()=>{switchView(el.dataset.cmd);closeCommandPalette();}); }
function escapeHtml(str){ return String(str??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function escapeAttr(str){ return escapeHtml(str).replace(/`/g,"&#96;"); }

init();
