/* Training Arc OS v7 — local-first encrypted all-in-one tracker */
const APP_KEY = "training_arc_os_v7_vault";
const SETTINGS_KEY = "training_arc_os_v7_settings";
const LEGACY_KEYS = ["training_arc_os_v6_vault","training_arc_os_v5_vault","training_arc_os_v4_vault","training_arc_os_v3_vault","training_arc_os_v2_vault"];
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
  ["Přidat jídlo", "nutrition"], ["Log workout", "gym"], ["Log běh", "running"], ["Kalkulačky", "calculators"], ["Deník", "life"], ["Meal planner", "mealplan"], ["Body recovery", "body"], ["Quests", "quests"], ["Hosting lab", "hosting"], ["Cloud sync", "connections"], ["Versions / Updates", "versions"], ["Analytics", "analytics"]
];

function seedState(){
  return {
    meta:{app:"Training Arc OS", version:7, createdAt:new Date().toISOString(), deviceId: uid()},
    profile:{name:"Filip", height:182, weight:80, age:17, sex:"male"},
    targets:{...DEFAULT_TARGETS},
    days:{}, foods: generateFoodDatabase(), customFoods:[], recipes:defaultRecipes(), customRecipes:[], events:[], stretchLogs:[], futureLetters:[], goals:[], mealPlans:[], groceryItems:[], spendLogs:[], measurements:[], bodyRecovery:[], progressPhotos:[], quests:[], weeklyReviews:[], workouts:[], runs:[], journals:[], tasks:[], habits:[], books:[], exercisePresets:[...EXERCISE_PRESETS],
    settings:{theme:"dark", cloud:{url:"", key:"", lastPush:"", lastPull:""}, email:{reportEmail:"", webhookUrl:""}, security:{kdfIterations:300000}, planner:{notify:false}}
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
  s.journals.push({id:uid(),date:todayIso(),mood:"🔥 locked in",score:8,text:"V7 demo: všechno logovat, nic neplatit."});
  s.books.push({id:uid(),title:"Atomic Habits",author:"James Clear",total:320,current:84,note:"Systems > goals"});
  s.events.push({id:uid(),date:todayIso(),time:"20:30",type:"Recovery",title:"10 min mobility",notes:"hips + calves",done:false});
  s.futureLetters.push({id:uid(),title:"Summer arc",unlockDate:daysAgo(-30),text:"Budeš rád, že jsi začal logovat všechno. Keep stacking days.",createdAt:new Date().toISOString(),opened:false});
  s.goals.push({id:uid(),area:"Running",title:"10 km sub 60",deadline:daysAgo(-45),status:"active",why:"base + závody"});
  return s;
}
function ensureDay(iso=selectedDate){
  if(!state.days[iso]) state.days[iso]={weight:"",kcal:0,protein:0,carbs:0,fat:0,fiber:0,salt:0,steps:0,sleep:"",mood:"",energy:"",soreness:"",notes:"",foodLogs:[]};
  if(!Array.isArray(state.days[iso].foodLogs)) state.days[iso].foodLogs=[];
  return state.days[iso];
}
function migrate(){
  if(!state.meta) state.meta={app:"Training Arc OS", version:7, createdAt:new Date().toISOString(), deviceId:uid()};
  state.meta.version=7;
  state.targets={...DEFAULT_TARGETS,...(state.targets||{})};
  state.settings={theme:"dark",cloud:{url:"",key:"",lastPush:"",lastPull:""},email:{reportEmail:"",webhookUrl:""},security:{kdfIterations:300000},planner:{notify:false},...(state.settings||{})};
  state.settings.cloud={url:"",key:"",lastPush:"",lastPull:"",...(state.settings.cloud||{})};
  state.settings.email={reportEmail:"",webhookUrl:"",...(state.settings.email||{})};
  state.settings.security={kdfIterations:300000,...(state.settings.security||{})};
  state.settings.planner={notify:false,...(state.settings.planner||{})};
  state.days=state.days||{};
  state.foods=mergeFoodDb(Array.isArray(state.foods)?state.foods:[], generateFoodDatabase());
  state.customFoods=state.customFoods||[]; state.recipes=mergeRecipes(mergeRecipes(state.recipes||[], defaultRecipes()), v7Recipes()); state.customRecipes=state.customRecipes||[];
  state.events=state.events||[]; state.stretchLogs=state.stretchLogs||[]; state.futureLetters=state.futureLetters||[]; state.goals=state.goals||[];
  state.mealPlans=state.mealPlans||[]; state.groceryItems=state.groceryItems||[]; state.spendLogs=state.spendLogs||[]; state.measurements=state.measurements||[]; state.bodyRecovery=state.bodyRecovery||[]; state.progressPhotos=state.progressPhotos||[]; state.quests=state.quests||[]; state.weeklyReviews=state.weeklyReviews||[];
  state.workouts=state.workouts||[]; state.runs=state.runs||[]; state.journals=state.journals||[]; state.tasks=state.tasks||[]; state.habits=state.habits||[]; state.books=state.books||[];
  state.exercisePresets=[...new Set([...(state.exercisePresets||[]),...EXERCISE_PRESETS,...V6_EXERCISE_BOOST,...V7_EXERCISE_BOOST])];
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
  return mergeFoodDb(mergeFoodDb(foods, v6FoodBoost()), v7FoodExpansion()).slice(0,7777);
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
  return {app:"TrainingArcOS",version:7,kdf:"PBKDF2-SHA256",iterations,cipher:"AES-GCM-256",salt:bytesToB64(salt),iv:bytesToB64(iv),data:bytesToB64(data),updatedAt:new Date().toISOString(),deviceId:payload?.meta?.deviceId||"unknown"};
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
  $("createVaultBtn").onclick=async()=>{ const pass=$("vaultPassword").value; if(!pass||pass.length<6)return toast("Pro v7 dej aspoň 6 znaků."); if(getStoredVault()&&!confirm("Přepsat existující vault?"))return; state=seedState(); vaultPassword=pass; unsafeMode=false; await saveVault(false); openApp(); toast("V7 secure vault vytvořen."); };
  $("demoVaultBtn").onclick=async()=>{ const pass=$("vaultPassword").value||"demo1234"; state=demoState(); vaultPassword=pass; unsafeMode=false; await saveVault(false); openApp(); toast("Demo vault vytvořen. Heslo: co jsi zadal, nebo demo1234."); };
  $("offlineUnsafeBtn").onclick=()=>{ if(!confirm("Dočasný režim bez šifrování? Jen na test."))return; const raw=localStorage.getItem(APP_KEY+"_unsafe"); state=raw?JSON.parse(raw):seedState(); unsafeMode=true; vaultPassword=""; openApp(); toast("Dočasný nešifrovaný režim."); };
  $("resetVaultBtn").onclick=()=>{ if(confirm("Smazat lokální data v7 + legacy keys?")){ localStorage.removeItem(APP_KEY); localStorage.removeItem(APP_KEY+"_unsafe"); LEGACY_KEYS.forEach(k=>localStorage.removeItem(k)); location.reload(); }};
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
  $("saveRecipeBtn").onclick=saveCustomRecipe; $("recipeSearch").oninput=renderRecipes; $("recipeFilter").onchange=renderRecipes; $("randomRecipeBtn").onclick=randomRecipe; $("clearRecipeSearch").onclick=()=>{$("recipeSearch").value="";$("recipeFilter").value="";renderRecipes();};
  $("saveEventBtn").onclick=saveEvent; $("exportIcsBtn").onclick=exportIcs; $("requestNotifyBtn").onclick=requestNotifications; $("quickPlanBtn").onclick=quickPlanToday;
  $("stretchFilter").onchange=renderRecovery; $("stretchSearch").oninput=renderRecovery; $("logStretchBtn").onclick=logSelectedStretch;
  $("saveFutureBtn").onclick=saveFutureLetter; $("saveGoalBtn").onclick=saveGoal; $("futureFilter").onchange=renderFutureSelf;
  if($("copyChangelogBtn")) $("copyChangelogBtn").onclick=copyChangelog;
  if($("exportChangelogBtn")) $("exportChangelogBtn").onclick=exportChangelog;
  $("changePasswordBtn").onclick=changePassword; $("exportEncryptedBtn").onclick=exportEncrypted; $("exportPlainBtn").onclick=exportPlain; $("importInput").onchange=importBackup; $("copyBackupBtn").onclick=copyEncrypted;
}
function switchView(view){
  currentView=view; $$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===view)); $$(".view").forEach(v=>v.classList.toggle("active",v.id===view));
  const map={dashboard:"Dashboard",nutrition:"Nutrition",gym:"Gym",running:"Běh",calculators:"Kalkulačky",life:"Life OS",recipes:"Recipes",planner:"Planner",recovery:"Recovery",future:"Future Self",mealplan:"Meal Plan",body:"Body & Recovery",quests:"Quests",hosting:"Hosting Lab",analytics:"Analytics",connections:"Connection Hub",versions:"Versions / Updates"}; $("viewTitle").textContent=map[view]||view;
  if(view==="analytics") setTimeout(renderCharts,80);
}
function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.remove("hidden"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.add("hidden"),2800); }
function renderAll(){ if(!state)return; migrate(); ensureDay(); hydrateSettingsFields(); renderDashboard(); renderDayInputs(); renderFoods(); renderFoodLog(); renderTargets(); renderMealBuilder(); renderExercisePresets(); renderWorkoutDraft(); renderWorkoutHistory(); renderGymInsights(); renderRunTypeCards(); renderRunHistory(); renderRunInsights(); renderCalculatorsDefaults(); renderJournal(); renderTasks(); renderHabits(); renderBooks(); renderRecipes(); renderEvents(); renderRecovery(); renderFutureSelf(); renderSecurityStats(); renderConnectionStatus(); renderPrBoard(); if(currentView==="analytics") renderCharts(); }
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
function download(filename,text,type="application/json"){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
async function exportEncrypted(){ if(!encryptedVaultCache) encryptedVaultCache=await encryptState(state,vaultPassword); download(`training_arc_v7_encrypted_${todayIso()}.json`,JSON.stringify(encryptedVaultCache,null,2)); }
function exportPlain(){ if(!confirm("Plain export není šifrovaný. Fakt stáhnout?"))return; download(`training_arc_v7_plain_${todayIso()}.json`,JSON.stringify(state,null,2)); }
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



/* =========================
   V7 retains V6 TITAN EXPANSION PACK
   Recipes · Planner · Future Self · Recovery · Bigger food library
========================= */
const V6_EXERCISE_BOOST = [
  "Skin-the-cat prep", "Scapula pull-ups", "Dead hang", "Arch hang", "Hollow body hold", "L-sit tuck", "Toes to bar", "Ab wheel", "Copenhagen plank",
  "Sled push", "Treadmill walk 16% incline", "Zone 2 bike", "Jump rope", "Pogo jumps", "Box jumps", "Broad jumps", "Hill sprints", "Sprint drills A-skips"
];
const STRETCH_ROUTINES = [
  {id:"runner_10",name:"Runner 10 min",focus:"běh",minutes:10,tags:["calves","hips","hamstrings"],steps:["90 s calf wall stretch každá noha","60 s couch stretch každá noha","10× ankle rocks","10× deep squat pry","60 s hamstring floss každá noha","60 s easy breathing"]},
  {id:"post_run_8",name:"Post-run cooldown",focus:"běh",minutes:8,tags:["cooldown","easy"],steps:["3 min chůze","30 s quad stretch každá noha","45 s calf stretch každá noha","45 s glute figure-4 každá strana","1 min legs up breathing"]},
  {id:"upper_unlock",name:"Upper body unlock",focus:"upper",minutes:12,tags:["shoulders","lats","chest"],steps:["10× scap push-ups","60 s doorway pec stretch","8× thoracic rotations každá strana","60 s lat prayer stretch","12× band pull-aparts","60 s dead hang nebo towel hang"]},
  {id:"lower_safe",name:"Lower safe mobility",focus:"lower",minutes:14,tags:["hips","knees","ankles"],steps:["8× hip airplanes assisted","12× glute bridges","10× ankle rocks každá noha","60 s hamstring floss","60 s couch stretch","8× bodyweight good mornings"]},
  {id:"desk_reset",name:"Desk reset",focus:"škola/práce",minutes:6,tags:["neck","back"],steps:["10× chin tucks","8× thoracic extensions","45 s pec stretch","10× hip flexor pulses","1 min nasal breathing"]},
  {id:"sleep_downshift",name:"Sleep downshift",focus:"večer",minutes:9,tags:["sleep","recovery"],steps:["2 min box breathing","60 s child pose","60 s legs up wall","60 s figure-4 each side","2 min slow nasal breathing"]},
  {id:"calisthenics_pre",name:"Cali wrist + shoulder prep",focus:"calisthenics",minutes:11,tags:["wrists","shoulders"],steps:["2 min wrist circles + rocks","10× scap pull-ups","10× scap push-ups","20 s hollow hold","8× controlled dips ROM","60 s lat stretch"]},
  {id:"shin_calf",name:"Shin/calf armor",focus:"běh",minutes:13,tags:["shins","calves"],steps:["15× tibialis raises","15× calf raises straight knee","15× calf raises bent knee","10× ankle CARs each side","60 s soleus stretch each side","easy foot rolling"]}
];

function mergeFoodDb(a=[],b=[]){
  const map=new Map();
  [...a,...b].forEach(f=>{ if(!f||!f.name)return; const key=(f.name+"|"+(f.category||"")).toLowerCase(); if(!map.has(key)) map.set(key,{...f,id:f.id||("preset_"+uid())}); });
  return [...map.values()];
}
function mergeRecipes(a=[],b=[]){
  const map=new Map();
  [...a,...b].forEach(r=>{ if(!r||!r.name)return; const key=r.name.toLowerCase(); if(!map.has(key)) map.set(key,{...r,id:r.id||("recipe_"+uid())}); });
  return [...map.values()];
}
function v6FoodBoost(){
  const bases = [
    ["Kuřecí prsa syrová",120,23,0,2,"protein","🍗"],["Kuřecí prsa pečená",165,31,0,4,"protein","🍗"],["Kuřecí mleté",170,21,0,9,"protein","🍗"],["Krůtí mleté",150,22,0,7,"protein","🦃"],["Hovězí 5%",137,21,0,5,"protein","🥩"],["Hovězí 10%",176,20,0,10,"protein","🥩"],["Šmakoun",110,15,8,1,"protein","🍽️"],["Tofu natural",144,15,2,9,"vegan protein","🌱"],["Tempeh",193,19,9,11,"vegan protein","🌱"],["Seitan",370,75,14,2,"vegan protein","🌱"],
    ["Makrela",205,19,0,14,"fish","🐟"],["Sardinky",208,25,0,11,"fish","🐟"],["Krevety",99,24,0,0,"fish","🦐"],["Pstruh",148,21,0,7,"fish","🐟"],["Surimi",95,8,14,1,"fish","🍥"],
    ["Kefír nízkotučný",45,3,5,1,"dairy","🥛"],["Mléko polotučné",47,3,5,2,"dairy","🥛"],["Mléko plnotučné",64,3,5,4,"dairy","🥛"],["Hermelín light",230,28,1,12,"dairy","🧀"],["Parmazán",431,38,4,29,"dairy","🧀"],["Olomoucké tvarůžky",130,28,2,1,"dairy","🧀"],
    ["Rýže jasmínová vařená",129,3,28,0,"carbs","🍚"],["Rýžové chlebíčky",385,8,80,3,"carbs","🍘"],["Pečivo bílé",270,9,55,2,"carbs","🥖"],["Bageta",280,9,58,2,"carbs","🥖"],["Toastový chléb",260,9,49,4,"carbs","🍞"],["Celozrnný toast",240,10,42,4,"carbs","🍞"],["Bulghur vařený",83,3,19,0,"carbs","🍛"],["Quinoa vařená",120,4,21,2,"carbs","🍛"],["Pohanka vařená",92,3,20,1,"carbs","🍛"],["Cereálie cornflakes",370,8,84,1,"carbs","🥣"],["Granola",450,10,62,16,"carbs","🥣"],
    ["Mango",60,1,15,0,"fruit","🥭"],["Hrozny",69,1,18,0,"fruit","🍇"],["Pomeranč",47,1,12,0,"fruit","🍊"],["Kiwi",61,1,15,1,"fruit","🥝"],["Ananas",50,1,13,0,"fruit","🍍"],["Meloun",30,1,8,0,"fruit","🍉"],["Maliny",52,1,12,1,"fruit","🍓"],
    ["Cuketa",17,1,3,0,"veg","🥒"],["Květák",25,2,5,0,"veg","🥦"],["Hrášek",81,5,14,0,"veg","🟢"],["Kukuřice",96,3,21,1,"veg","🌽"],["Červená řepa",43,2,10,0,"veg","🧃"],["Houby",22,3,3,0,"veg","🍄"],["Cibule",40,1,9,0,"veg","🧅"],["Česnek",149,6,33,1,"veg","🧄"],
    ["Vlašské ořechy",654,15,14,65,"fats","🥜"],["Lískové ořechy",628,15,17,61,"fats","🥜"],["Chia semínka",486,17,42,31,"fats","🌱"],["Lněné semínko",534,18,29,42,"fats","🌱"],["Máslo",717,1,1,81,"fats","🧈"],["Ghí",900,0,0,100,"fats","🧈"],
    ["Med",304,0,82,0,"sweet","🍯"],["Džem",250,0,62,0,"sweet","🍓"],["Nutella",539,6,57,31,"sweet","🍫"],["Zmrzlina",207,4,24,11,"sweet","🍦"],["Müsli tyčinka",410,8,65,12,"snack","🍫"],["Studentská pečeť",520,8,55,30,"snack","🍫"],["Popcorn",387,12,78,4,"snack","🍿"],
    ["Pizza Margherita",266,11,33,10,"meal","🍕"],["Pizza šunková",250,13,31,9,"meal","🍕"],["Burger hovězí",295,16,28,15,"meal","🍔"],["Sushi maki",145,6,28,2,"meal","🍣"],["Pho bo",75,6,9,2,"meal","🍜"],["Ramen",90,5,12,3,"meal","🍜"],["Wrap kuřecí",210,14,25,7,"meal","🌯"],["Salát Caesar",180,12,8,11,"meal","🥗"],
    ["Protein milkshake",82,10,6,2,"supplement","🥤"],["Gainer",390,20,65,6,"supplement","🥤"],["Kreatin",0,0,0,0,"supplement","⚗️"],["Elektrolyty drink",20,0,5,0,"run fuel","🥤"],["Datle",282,2,75,0,"run fuel","🌴"],["Rozinky",299,3,79,0,"run fuel","🍇"],
    ["Kebab kuřecí",240,16,22,10,"fastfood","🥙"],["Hranolky",312,3,41,15,"fastfood","🍟"],["Tortilla chips",500,7,64,25,"snack","🌮"],["Instantní nudle",448,10,60,18,"meal","🍜"],
    ["Smažený sýr",320,18,18,21,"czech meal","🧀"],["Koprovka",110,4,10,6,"czech meal","🍲"],["Rajská omáčka",95,4,12,3,"czech meal","🍅"],["Vepřo knedlo zelo",230,11,22,12,"czech meal","🍖"],["Bramboráky",220,5,28,10,"czech meal","🥔"],["Palačinky",227,6,30,9,"czech meal","🥞"]
  ];
  const variants = [
    ["",1,0,0,0,"base"],["cut",.86,1,-4,-3,"cut"],["lean",.9,2,-2,-2,"lean"],["high protein",1.04,6,-3,-1,"protein"],["bulk",1.18,2,8,3,"bulk"],["meal prep",1,1,2,0,"mealprep"],["school box",1.02,1,4,1,"school"],["work shift",1.05,1,5,1,"work"],["post-workout",1.1,5,8,0,"postworkout"],["pre-run",1.06,0,10,-1,"prerun"],["low fat",.85,1,0,-5,"lowfat"],["s olejem",1.2,0,0,8,"oil"],["extra carbs",1.12,0,12,0,"carbs"],["budget",.97,0,0,0,"budget"],["premium",1.06,1,2,2,"premium"],["quick",1,0,0,0,"quick"]
  ];
  const foods=[];
  for(const b of bases){
    for(const v of variants){
      foods.push({id:"v6_"+uid(),preset:true,name:v[0]?`${b[0]} · ${v[0]}`:b[0],icon:b[6],category:b[5].split(" ")[0],tags:(b[5]+" v6 "+v[5]).split(" "),kcal100:Math.max(0,round(b[1]*v[1],0)),protein100:Math.max(0,round(b[2]+v[2],1)),carbs100:Math.max(0,round(b[3]+v[3],1)),fat100:Math.max(0,round(b[4]+v[4],1)),fiber100:b[5].includes("veg")?3:b[5].includes("fruit")?2:b[5].includes("carbs")?2:0,salt100:b[5].includes("fastfood")?1.1:0.1});
    }
  }
  return foods;
}
function defaultRecipes(){
  return [
    recipe("Skyr bowl bulk/cut", "breakfast", 520, 48, 68, 8, ["300 g skyr", "60 g vločky", "banán", "borůvky", "med podle kcal"], ["Smíchej skyr + vločky.", "Přidej ovoce.", "Na cut uber vločky/med, na bulk přidej peanut butter."], "🥣"),
    recipe("Chicken rice meal prep", "meal prep", 690, 55, 86, 12, ["200 g kuřecí", "250 g vařená rýže", "zelenina", "10 g olej"], ["Kuře osol/okořeň.", "Uvař rýži.", "Rozděl do boxů, zeleninu nech křupavou."], "🍗"),
    recipe("Tvaroh protein dessert", "snack", 360, 45, 30, 5, ["250 g tvaroh", "whey", "ovoce", "sladidlo/kakao"], ["Rozmíchej tvaroh s whey.", "Přidej ovoce a nech vychladit."], "🍮"),
    recipe("Pre-run banana toast", "run fuel", 430, 15, 78, 7, ["toast", "banán", "med", "trocha arašídového másla"], ["Dej 60–120 min před během.", "U rýmy/žaludku uber tuk."], "🍌"),
    recipe("Post-run recovery shake", "run fuel", 480, 38, 70, 6, ["whey", "mléko/kefír", "banán", "vločky"], ["Rozmixuj.", "Ideál po long runu nebo gym + běh dni."], "🥤"),
    recipe("Lean beef pasta", "dinner", 760, 52, 92, 18, ["libové hovězí", "těstoviny", "rajčatová omáčka", "parmazán"], ["Orestuj maso.", "Přidej omáčku.", "Smíchej s těstovinami."], "🍝"),
    recipe("Egg rice power bowl", "breakfast", 610, 31, 72, 20, ["rýže", "3 vejce", "zelenina", "sojová omáčka"], ["Ohřej rýži.", "Udělej vejce.", "Přidej zeleninu a omáčku."], "🍳"),
    recipe("Budget tuna rice", "budget", 540, 38, 76, 6, ["tuňák", "rýže", "kukuřice", "okurka"], ["Smíchej všechno v misce.", "Dochut citronem/pepřem."], "🐟"),
    recipe("Cottage wrap", "school", 510, 42, 55, 13, ["tortilla", "cottage", "šunka/kuře", "salát"], ["Namaž cottage.", "Přidej protein a salát.", "Zabal do alobalu."], "🌯"),
    recipe("Long run carb box", "run fuel", 620, 16, 128, 4, ["rýžové chlebíčky", "banán", "datle", "ionťák"], ["Použij před/during long run.", "Netestuj poprvé v závodě."], "⚡"),
    recipe("Greek yogurt cereal bowl", "breakfast", 470, 34, 67, 7, ["řecký jogurt", "cornflakes/granola", "jahody"], ["Všechno smíchej.", "Na cut dej cornflakes, na bulk granolu."], "🍓"),
    recipe("Salmon potatoes", "dinner", 720, 44, 62, 30, ["losos", "brambory", "zelenina", "citron"], ["Upeč lososa.", "Uvař brambory.", "Přidej zeleninu."], "🐟"),
    recipe("Protein pancakes", "breakfast", 590, 45, 70, 14, ["vločky", "vejce", "whey", "banán"], ["Rozmixuj těsto.", "Smaž na nepřilnavé pánvi.", "Top ovoce/skyr."], "🥞"),
    recipe("Kebab bowl fitness", "meal", 760, 55, 90, 18, ["kuře", "rýže", "salát", "jogurt dip"], ["Maso okořeň jako kebab.", "Dej do bowl bez smažených věcí."], "🥙"),
    recipe("Czech řízek damage control", "czech", 820, 48, 70, 35, ["řízek", "brambory", "salát", "citron"], ["Zapiš realisticky.", "Dorovnej protein a kroky, nepanikař."], "🍽️")
  ];
}
function recipe(name,category,kcal,protein,carbs,fat,ingredients,steps,icon="🍽️"){
  return {id:"recipe_"+uid(),preset:true,name,category,kcal,protein,carbs,fat,ingredients,steps,icon,tags:[category,"recipe","v6"]};
}
function allRecipes(){ return mergeRecipes(mergeRecipes([...(state.recipes||[]),...(state.customRecipes||[])], defaultRecipes()), v7Recipes()); }
function renderRecipes(){
  if(!$('recipeList')||!state)return;
  const cats=[...new Set(allRecipes().map(r=>r.category).filter(Boolean))].sort();
  $('recipeFilter').innerHTML='<option value="">Všechny typy</option>'+cats.map(c=>`<option>${escapeHtml(c)}</option>`).join('');
  const q=($('recipeSearch').value||'').toLowerCase(), f=$('recipeFilter').value;
  const rows=allRecipes().filter(r=>(!f||r.category===f)&&[r.name,r.category,(r.ingredients||[]).join(' '),(r.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)).slice(0,80);
  $('recipeCount').textContent=allRecipes().length+" recipes";
  $('recipeList').innerHTML=rows.map(r=>`<div class="recipe-card"><div class="recipe-icon">${escapeHtml(r.icon||'🍽️')}</div><div class="item-head"><div><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.category)} · ${Math.round(r.kcal)} kcal · P ${round(r.protein,1)} C ${round(r.carbs,1)} F ${round(r.fat,1)}</small></div><div class="item-actions"><button class="btn tiny primary" onclick="addRecipeToDay('${r.id}')">+ den</button><button class="btn tiny ghost" onclick="recipeToMeal('${r.id}')">+ meal</button></div></div><details><summary>Ingredience + postup</summary><ul>${(r.ingredients||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><ol>${(r.steps||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol></details></div>`).join('')||'<div class="item muted">Nic nenalezeno.</div>';
}
window.addRecipeToDay=id=>{ const r=allRecipes().find(x=>x.id===id); if(!r)return; const d=ensureDay(); d.foodLogs.unshift({id:uid(),name:"Recipe: "+r.name,grams:1,kcal:r.kcal,protein:r.protein,carbs:r.carbs,fat:r.fat,fiber:0,salt:0,createdAt:new Date().toISOString()}); saveVault(); toast("Recept přidán do dne."); };
window.recipeToMeal=id=>{ const r=allRecipes().find(x=>x.id===id); if(!r)return; mealDraft.push({id:uid(),name:"Recipe: "+r.name,grams:1,kcal:r.kcal,protein:r.protein,carbs:r.carbs,fat:r.fat}); renderMealBuilder(); toast("Recept přidán do meal builderu."); };
function saveCustomRecipe(){
  const name=$('recipeName').value.trim(); if(!name)return toast('Zadej název receptu.');
  const ingredients=$('recipeIngredients').value.split('\n').map(x=>x.trim()).filter(Boolean);
  const steps=$('recipeSteps').value.split('\n').map(x=>x.trim()).filter(Boolean);
  state.customRecipes.unshift({id:'custom_recipe_'+uid(),preset:false,name,category:$('recipeCategory').value.trim()||'custom',kcal:num($('recipeKcal').value),protein:num($('recipeProtein').value),carbs:num($('recipeCarbs').value),fat:num($('recipeFat').value),ingredients,steps,icon:$('recipeIcon').value.trim()||'🍽️',tags:['custom','recipe']});
  ['recipeName','recipeCategory','recipeKcal','recipeProtein','recipeCarbs','recipeFat','recipeIngredients','recipeSteps','recipeIcon'].forEach(id=>$(id).value='');
  saveVault();
}
function randomRecipe(){ const rs=allRecipes(); const r=rs[Math.floor(Math.random()*rs.length)]; if(r){$('recipeSearch').value=r.name;renderRecipes();} }

function renderEvents(){
  if(!$('eventList')||!state)return;
  $('eventDate').value ||= selectedDate;
  const rows=[...state.events].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const upcoming=rows.filter(e=>e.date>=selectedDate).slice(0,80);
  $('eventCount').textContent=upcoming.length+' upcoming';
  $('eventToday').innerHTML=rows.filter(e=>e.date===selectedDate).sort((a,b)=>(a.time||'').localeCompare(b.time||'')).map(eventCard).join('')||'<div class="item muted">Dnes nic v plánu.</div>';
  $('eventList').innerHTML=upcoming.map(eventCard).join('')||'<div class="item muted">Žádné eventy.</div>';
}
function eventCard(e){ const due=e.date===selectedDate; return `<div class="item event ${e.done?'done':''}"><div class="item-head"><div><strong>${e.date} ${e.time||''} · ${escapeHtml(e.title)}</strong><small>${escapeHtml(e.type||'event')} · ${escapeHtml(e.notes||'')}</small></div><div class="item-actions"><button class="btn tiny ghost" onclick="toggleEventDone('${e.id}')">${e.done?'Undo':'Done'}</button><button class="btn tiny ghost danger" onclick="deleteEvent('${e.id}')">×</button></div></div></div>`; }
function saveEvent(){ const title=$('eventTitle').value.trim(); if(!title)return toast('Zadej event.'); state.events.push({id:uid(),date:$('eventDate').value||selectedDate,time:$('eventTime').value||'',type:$('eventType').value,title,notes:$('eventNotes').value.trim(),done:false,createdAt:new Date().toISOString()}); ['eventTitle','eventNotes'].forEach(id=>$(id).value=''); saveVault(); }
window.toggleEventDone=id=>{const e=state.events.find(x=>x.id===id); if(e)e.done=!e.done; saveVault();};
window.deleteEvent=id=>{state.events=state.events.filter(e=>e.id!==id);saveVault();};
function quickPlanToday(){
  const suggestions=[['07:30','Health','Váha + voda + rychlý check'],['16:30','Training','Workout / run podle plánu'],['20:30','Recovery','10 min stretching'],['21:00','Life','Deník + plán na zítra']];
  suggestions.forEach(([time,type,title])=>state.events.push({id:uid(),date:selectedDate,time,type,title,notes:'v7 quick plan',done:false,createdAt:new Date().toISOString()}));
  saveVault();
}
async function requestNotifications(){
  if(!('Notification' in window)) return toast('Prohlížeč neumí notifications.');
  const res=await Notification.requestPermission(); state.settings.planner.notify=res==='granted'; await saveVault(false); toast(res==='granted'?'Notifications povoleny.':'Notifications nepovoleny.');
}
function exportIcs(){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Training Arc OS v7//CZ'];
  state.events.forEach(e=>{ const dt=(e.date||todayIso()).replaceAll('-','')+'T'+((e.time||'09:00').replace(':','')+'00'); lines.push('BEGIN:VEVENT','UID:'+e.id+'@training-arc-os','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z','DTSTART:'+dt,'SUMMARY:'+icsEscape(e.title),'DESCRIPTION:'+icsEscape((e.type||'')+' '+(e.notes||'')),'END:VEVENT'); });
  lines.push('END:VCALENDAR'); download('training_arc_events_'+todayIso()+'.ics',lines.join('\r\n'));
}
function icsEscape(s){return String(s||'').replace(/[\\,;]/g,'\\$&').replace(/\n/g,'\\n');}

function renderRecovery(){
  if(!$('stretchList')||!state)return;
  const q=($('stretchSearch').value||'').toLowerCase(), f=$('stretchFilter').value;
  const routines=STRETCH_ROUTINES.filter(r=>(!f||r.focus===f)&&[r.name,r.focus,(r.tags||[]).join(' '),(r.steps||[]).join(' ')].join(' ').toLowerCase().includes(q));
  const focuses=[...new Set(STRETCH_ROUTINES.map(r=>r.focus))]; $('stretchFilter').innerHTML='<option value="">Všechny routines</option>'+focuses.map(x=>`<option>${escapeHtml(x)}</option>`).join('');
  $('stretchList').innerHTML=routines.map(r=>`<div class="routine-card"><div class="item-head"><div><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.focus)} · ${r.minutes} min · ${(r.tags||[]).join(', ')}</small></div><button class="btn tiny primary" onclick="selectStretch('${r.id}')">Vybrat</button></div><ol>${r.steps.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ol></div>`).join('');
  const selected=STRETCH_ROUTINES.find(r=>r.id===$('selectedStretchId').value)||STRETCH_ROUTINES[0]; if(selected){$('selectedStretchId').value=selected.id; $('selectedStretchBox').innerHTML=`<strong>${escapeHtml(selected.name)}</strong><small>${selected.minutes} min · ${escapeHtml(selected.focus)}</small><ol>${selected.steps.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ol>`;}
  $('stretchLogList').innerHTML=state.stretchLogs.slice(0,30).map(l=>`<div class="item"><div class="item-head"><div><strong>${l.date} · ${escapeHtml(l.name)}</strong><small>${l.minutes} min · soreness ${l.sorenessBefore||'—'}→${l.sorenessAfter||'—'}</small></div><button class="btn tiny ghost danger" onclick="deleteStretchLog('${l.id}')">×</button></div></div>`).join('')||'<div class="item muted">Zatím žádná mobilita.</div>';
  $('recoveryProtocol').innerHTML=recoveryProtocol().map(x=>`<div class="coach-tip">${escapeHtml(x)}</div>`).join('');
}
window.selectStretch=id=>{$('selectedStretchId').value=id;renderRecovery();};
function logSelectedStretch(){ const r=STRETCH_ROUTINES.find(x=>x.id===$('selectedStretchId').value); if(!r)return; state.stretchLogs.unshift({id:uid(),date:selectedDate,routineId:r.id,name:r.name,minutes:r.minutes,sorenessBefore:ensureDay().soreness||'',sorenessAfter:$('stretchSorenessAfter').value||'',createdAt:new Date().toISOString()}); saveVault(); }
window.deleteStretchLog=id=>{state.stretchLogs=state.stretchLogs.filter(x=>x.id!==id);saveVault();};
function recoveryProtocol(){ const d=ensureDay(), tips=[]; if(num(d.soreness)>7) tips.push('Soreness 8+/10: no ego PR, dej easy walk, mobility a protein.'); if(num(d.sleep)&&num(d.sleep)<6.5) tips.push('Spánek nízko: tempo/intervaly přesuň, drž easy nebo techniku.'); if(state.runs.some(r=>r.date===selectedDate&&r.rpe>=8)) tips.push('Po hard runu dej calves/hips routine a doplň sachry + sůl.'); if(state.workouts.some(w=>w.date===selectedDate)) tips.push('Po gymu zapiš RIR a zítra koukni na výkon/soreness trend.'); if(!tips.length) tips.push('Recovery vypadá ok. Dej 6–10 min mobility jako minimum viable recovery.'); return tips; }

function renderFutureSelf(){
  if(!$('futureList')||!state)return;
  const f=$('futureFilter').value;
  const letters=state.futureLetters.filter(l=>f==='locked'?l.unlockDate>todayIso():f==='open'?l.unlockDate<=todayIso():true).sort((a,b)=>a.unlockDate.localeCompare(b.unlockDate));
  $('futureList').innerHTML=letters.map(l=>`<div class="future-card ${l.unlockDate<=todayIso()?'open':'locked'}"><div class="item-head"><div><strong>${escapeHtml(l.title)}</strong><small>unlock ${l.unlockDate} · ${l.unlockDate<=todayIso()?'otevřeno':'locked'}</small></div><div class="item-actions"><button class="btn tiny ghost" onclick="toggleFutureOpen('${l.id}')">${l.opened?'Mark unread':'Open'}</button><button class="btn tiny ghost danger" onclick="deleteFuture('${l.id}')">×</button></div></div><p>${l.unlockDate<=todayIso()||l.opened?escapeHtml(l.text):'🔒 Dopis je zamčený do budoucna.'}</p></div>`).join('')||'<div class="item muted">Žádné future-self dopisy.</div>';
  $('goalList').innerHTML=state.goals.map(g=>`<div class="item"><div class="item-head"><div><strong>${escapeHtml(g.area)} · ${escapeHtml(g.title)}</strong><small>deadline ${g.deadline||'—'} · ${escapeHtml(g.status||'active')}</small><p>${escapeHtml(g.why||'')}</p></div><div class="item-actions"><button class="btn tiny ghost" onclick="toggleGoal('${g.id}')">${g.status==='done'?'Active':'Done'}</button><button class="btn tiny ghost danger" onclick="deleteGoal('${g.id}')">×</button></div></div></div>`).join('')||'<div class="item muted">Žádné cíle.</div>';
  $('identityStack').innerHTML=identityStack().map(x=>`<div class="coach-tip">${escapeHtml(x)}</div>`).join('');
}
function saveFutureLetter(){ const title=$('futureTitle').value.trim(); if(!title)return toast('Zadej title.'); state.futureLetters.unshift({id:uid(),title,unlockDate:$('futureDate').value||todayIso(),text:$('futureText').value.trim(),createdAt:new Date().toISOString(),opened:false}); ['futureTitle','futureText'].forEach(id=>$(id).value=''); saveVault(); }
function saveGoal(){ const title=$('goalTitle').value.trim(); if(!title)return toast('Zadej goal.'); state.goals.unshift({id:uid(),area:$('goalArea').value.trim()||'Arc',title,deadline:$('goalDeadline').value,why:$('goalWhy').value.trim(),status:'active',createdAt:new Date().toISOString()}); ['goalArea','goalTitle','goalDeadline','goalWhy'].forEach(id=>$(id).value=''); saveVault(); }
window.toggleFutureOpen=id=>{const l=state.futureLetters.find(x=>x.id===id); if(l)l.opened=!l.opened; saveVault();};
window.deleteFuture=id=>{state.futureLetters=state.futureLetters.filter(x=>x.id!==id);saveVault();};
window.toggleGoal=id=>{const g=state.goals.find(x=>x.id===id); if(g)g.status=g.status==='done'?'active':'done'; saveVault();};
window.deleteGoal=id=>{state.goals=state.goals.filter(x=>x.id!==id);saveVault();};
function identityStack(){ const tips=[]; const score=arcScore(); tips.push(score>=80?'Dnešní identity vote: athlete/organized demon.':'Dnes stačí vyhrát minimum: log + kroky + protein.'); if(weekRunKm()<state.targets.runKm*.5) tips.push('Future runner potřebuje easy km, ne jen hard runs.'); if(state.journals.length<3) tips.push('Future self bude mít value až z honest deníku — piš krátce, ale často.'); tips.push('Rule: data > guilt. Zapiš realitu, potom uprav plán.'); return tips; }


/* =========================
   V7 LUCKY NUMBER GIGA EXPANSION
   Meal planner · body vault · quests · hosting lab · larger food/recipe libraries
========================= */
const V7_EXERCISE_BOOST = [
  "Paused push-ups", "Tempo push-ups 3-1-1", "Feet elevated weighted push-ups", "Ring push-ups", "Archer push-ups", "Decline push-ups", "Handstand push-up prep",
  "False grip hang", "High pull-ups", "Kipping muscle-up drill", "Transition drill low bar", "Straight bar support hold", "Explosive dip to lockout",
  "Cable Y-raise", "Lean-away lateral raise", "Machine lateral raise", "Incline DB curl", "Bayesian cable curl", "JM press", "Cable overhead rope extension",
  "Hack squat", "Bulgarian split squat", "Walking lunges", "Single-leg RDL", "Seated leg curl", "Standing calf raise", "Tibialis raise",
  "Easy spin bike", "Row erg easy", "Stairmaster Z2", "Cooldown walk", "Breathing reset", "Box breathing", "Neck mobility"
];
RUN_TYPES.push(
  {name:"Race week shakeout", goal:"lehké proběhnutí před závodem", intensity:"Z1–Z2 + strides"},
  {name:"Cold/sick easy only", goal:"když je rýma, drž ego off", intensity:"talk test"},
  {name:"Negative split", goal:"druhá půlka rychlejší", intensity:"controlled build"},
  {name:"Cadence drill", goal:"technika, kratší kontakt se zemí", intensity:"easy + drills"}
);

function v7FoodExpansion(){
  const bases=[
    ["Kuřecí gyros",165,24,2,6,"protein meal","🥙"],["Kuřecí strips airfryer",190,24,13,5,"protein meal","🍗"],["Krůtí šunka",95,20,2,1,"protein","🥓"],["Vepřová panenka",145,22,0,6,"protein","🥩"],["Hovězí steak",210,27,0,11,"protein","🥩"],["Mleté hovězí 15%",250,18,0,19,"protein","🥩"],["Kuřecí játra",135,20,1,5,"protein","🍽️"],["Cizrna vařená",164,9,27,3,"vegan","🫘"],["Čočka vařená",116,9,20,0,"vegan","🫘"],["Fazole červené",127,9,23,1,"vegan","🫘"],
    ["Protein pudink",78,10,6,2,"dairy protein","🍮"],["High protein jogurt",75,12,5,1,"dairy protein","🥣"],["Actimel",76,3,12,2,"dairy","🥛"],["Kefírové mléko",50,3,5,2,"dairy","🥛"],["Ricotta",174,11,3,13,"dairy","🧀"],["Feta",264,14,4,21,"dairy","🧀"],["Sýr cottage light",72,12,3,1,"dairy protein","🧀"],
    ["Rýže sushi vařená",130,2,29,0,"carbs","🍚"],["Rýže natural vařená",111,3,23,1,"carbs","🍚"],["Noky",150,4,31,1,"carbs","🥔"],["Halušky",190,5,39,2,"carbs","🥔"],["Celozrnné těstoviny",150,6,28,1,"carbs","🍝"],["Špagety",158,6,31,1,"carbs","🍝"],["Protein pasta",340,25,50,3,"carbs protein","🍝"],["Bagel",275,10,55,2,"carbs","🥯"],["Croissant",406,8,45,21,"bakery","🥐"],["Rohlík",286,9,57,3,"bakery","🥖"],["Kaiserka",275,9,53,4,"bakery","🥖"],["Langoš",330,8,42,15,"fastfood","🍽️"],
    ["Hruška",57,0,15,0,"fruit","🍐"],["Meruňky",48,1,11,0,"fruit","🍑"],["Broskev",39,1,10,0,"fruit","🍑"],["Švestky",46,1,11,0,"fruit","🟣"],["Třešně",63,1,16,0,"fruit","🍒"],["Grapefruit",42,1,11,0,"fruit","🍊"],["Avokádo toast",230,6,22,14,"meal","🥑"],
    ["Ledový salát",14,1,3,0,"veg","🥬"],["Rukola",25,3,4,1,"veg","🥬"],["Zelí kysané",19,1,4,0,"veg","🥬"],["Okurky kyselé",12,1,2,0,"veg","🥒"],["Fazole zelené",31,2,7,0,"veg","🫛"],["Chilli",40,2,9,0,"veg","🌶️"],
    ["McChicken",430,17,45,21,"fastfood","🍔"],["Big Mac",508,26,42,26,"fastfood","🍔"],["Cheeseburger",300,15,32,13,"fastfood","🍔"],["McWrap",520,25,55,20,"fastfood","🌯"],["KFC Twister",560,28,58,23,"fastfood","🌯"],["KFC strips",260,24,18,11,"fastfood","🍗"],["Subway kuře",210,16,30,5,"fastfood","🥪"],["Pizza kebab",285,14,32,11,"fastfood meal","🍕"],
    ["Rohlík se šunkou",220,12,34,5,"school snack","🥪"],["Bageta kuřecí",245,13,34,8,"school snack","🥖"],["Wrap z benzinky",260,13,30,11,"travel","🌯"],["Protein drink Lidl",75,11,5,1,"protein","🥤"],["Skyr drink",65,9,6,1,"protein","🥤"],
    ["Energy drink sugarfree",4,0,0,0,"drink","⚡"],["Kofola",33,0,8,0,"drink","🥤"],["Džus pomeranč",45,1,10,0,"drink","🧃"],["Ionťák prášek",250,0,60,0,"run fuel","🥤"],["Maltodextrin",380,0,95,0,"run fuel","⚡"],["Rice cakes honey",390,7,82,3,"run fuel","🍘"],
    ["Svíčková light",125,8,16,4,"czech","🍽️"],["Moravský vrabec",290,13,20,17,"czech","🍖"],["Špagety s kečupem",170,5,33,2,"budget","🍝"],["Lečo",75,4,8,3,"czech","🍳"],["Zapečené těstoviny",190,10,23,7,"meal","🍝"],["Rizoto kuřecí",150,9,23,3,"meal","🍚"],["Čína s rýží",170,12,23,5,"meal","🍛"],["Burrito bowl",170,12,22,4,"meal","🌯"]
  ];
  const variants=["base","cut","lean","high protein","bulk","meal prep","school","work shift","pre-run","post-workout","low fat","budget","premium","quick","large portion","small portion","with oil","no oil","extra carbs","extra veg","spicy","simple","restaurant estimate","homemade","airfryer","gym day","rest day","race week","summer cut","winter bulk","low fiber pre-run","high fiber","salted","sweet","savory"];
  const foods=[];
  for(const b of bases){
    variants.forEach((v)=>{
      const mult = v.includes('bulk')||v.includes('large') ? 1.18 : v.includes('cut')||v.includes('small')||v.includes('low fat') ? .88 : v.includes('premium') ? 1.08 : 1;
      const p = v.includes('high protein')||v.includes('post') ? 6 : v.includes('lean') ? 2 : 0;
      const c = v.includes('extra carbs')||v.includes('pre-run') ? 12 : v.includes('cut') ? -4 : 0;
      const f = v.includes('with oil') ? 8 : v.includes('no oil')||v.includes('low fat') ? -4 : 0;
      foods.push({id:'v7_'+uid(),preset:true,name:v==='base'?b[0]:`${b[0]} · ${v}`,icon:b[6],category:b[5].split(' ')[0],tags:(b[5]+' v7 '+v).split(' '),kcal100:Math.max(0,round(b[1]*mult,0)),protein100:Math.max(0,round(b[2]+p,1)),carbs100:Math.max(0,round(b[3]+c,1)),fat100:Math.max(0,round(b[4]+f,1)),fiber100:b[5].includes('veg')?3:b[5].includes('fruit')?2:b[5].includes('carbs')?2:0,salt100:b[5].includes('fastfood')?1.2:.12});
    });
  }
  return foods;
}
function v7Recipes(){
  return [
    recipe("Hybrid athlete rice bowl", "meal prep", 790, 58, 98, 16, ["200 g kuřecí", "300 g rýže vařená", "zelenina", "jogurt dip"], ["Udělej kuře na pánvi/airfryer.", "Rýži rozděl do boxu.", "Dip dej bokem, ať to není mokré."], "🍚"),
    recipe("Police race breakfast", "race week", 520, 28, 88, 7, ["vločky", "banán", "skyr", "med"], ["Sněz 2–3 h před výkonem.", "V den závodu netestuj nové jídlo."], "🏁"),
    recipe("Cheap protein pasta", "budget", 680, 48, 92, 10, ["těstoviny", "tuňák/šunka", "rajčatová omáčka", "eidam light"], ["Uvař těstoviny.", "Smíchej s omáčkou a proteinem.", "Dochut chilli/česnek."], "🍝"),
    recipe("No appetite sick day bowl", "recovery", 560, 35, 85, 8, ["rýže", "vejce", "vývar", "sůl"], ["Drž jednoduché a stravitelné.", "Doplň tekutiny a sůl."], "🍲"),
    recipe("Shift snack box", "work", 740, 55, 95, 14, ["wrap", "cottage", "šunka/kuře", "banán", "protein drink"], ["Zabal wrap.", "Dej ovoce + drink bokem.", "Cíl: nezabít protein během směny."], "🎒"),
    recipe("Long run gel plan", "run fuel", 360, 0, 90, 0, ["2 gely", "ionťák", "voda"], ["Nad 75–90 min testuj 30–60 g sachrů/h.", "Zapij vodou."], "⚡"),
    recipe("Evening recovery tvaroh", "before sleep", 430, 52, 34, 8, ["tvaroh", "whey", "ovoce", "kakao"], ["Smíchej.", "Vhodné, když protein za den chybí."], "🌙"),
    recipe("Summer cut kebab bowl", "cut", 640, 55, 72, 14, ["kuřecí gyros", "rýže/brambory", "salát", "jogurt dip"], ["Bez hranolek, bez mayo.", "Vypadá jako cheat, makra jako win."], "🥙")
  ];
}
function v7Migrate(){
  state.mealPlans=state.mealPlans||[]; state.groceryItems=state.groceryItems||[]; state.spendLogs=state.spendLogs||[]; state.measurements=state.measurements||[]; state.bodyRecovery=state.bodyRecovery||[]; state.progressPhotos=state.progressPhotos||[]; state.quests=state.quests||[]; state.weeklyReviews=state.weeklyReviews||[];
  state.meta.version=7;
  state.recipes=mergeRecipes(mergeRecipes(state.recipes||[], defaultRecipes()), v7Recipes());
  state.foods=mergeFoodDb(state.foods||[], v7FoodExpansion()).slice(0,7777);
  state.exercisePresets=[...new Set([...(state.exercisePresets||[]),...V7_EXERCISE_BOOST])];
}
const __baseMigrate=migrate; migrate=function(){__baseMigrate(); v7Migrate();};
const __baseRenderAll=renderAll; renderAll=function(){ __baseRenderAll(); renderV7All(); };
function renderV7All(){ if(!state)return; renderMealPlan(); renderBodyVault(); renderQuests(); renderHostingLab(); renderVersionsPage(); }
const __baseBindEvents=bindEvents; bindEvents=function(){ __baseBindEvents(); bindV7Events(); };
function bindV7Events(){ const safe=(id,fn)=>{const el=$(id); if(el) fn(el);}; safe('saveMealPlanBtn',el=>el.onclick=saveMealPlan); safe('generateGroceryBtn',el=>el.onclick=generateGrocery); safe('quickMealWeekBtn',el=>el.onclick=quickMealWeek); safe('addGroceryBtn',el=>el.onclick=addGroceryItem); safe('saveSpendBtn',el=>el.onclick=saveSpend); safe('saveMeasureBtn',el=>el.onclick=saveMeasurement); safe('saveBodyRecoveryBtn',el=>el.onclick=saveBodyRecovery); safe('progressPhotoInput',el=>el.onchange=handleProgressPhoto); safe('saveQuestBtn',el=>el.onclick=saveQuest); safe('saveReviewBtn',el=>el.onclick=saveWeeklyReview); safe('runSelfTestBtn',el=>el.onclick=runSelfTest); safe('copyDeployPlanBtn',el=>el.onclick=copyDeployPlan); }
function weekDates(start=selectedDate){ const d=new Date(start); d.setDate(d.getDate()-((d.getDay()+6)%7)); return Array.from({length:7},(_,i)=>{const x=new Date(d); x.setDate(d.getDate()+i); return x.toISOString().slice(0,10);}); }
function renderMealPlan(){ if(!$('mealPlanBoard'))return; $('mealPlanDate').value ||= selectedDate; const days=weekDates(selectedDate); const names=['Po','Út','St','Čt','Pá','So','Ne']; $('mealPlanBoard').innerHTML=days.map((d,i)=>{ const meals=state.mealPlans.filter(m=>m.date===d).sort((a,b)=>a.slot.localeCompare(b.slot)); return `<div class="day-col"><h4>${names[i]} <small>${d.slice(5)}</small></h4>${meals.map(m=>`<div class="day-meal"><strong>${escapeHtml(m.slot)} · ${escapeHtml(m.name)}</strong><small>${m.kcal||0} kcal</small><div class="item-actions"><button class="btn tiny ghost" onclick="addMealPlanToDay('${m.id}')">do dne</button><button class="btn tiny ghost danger" onclick="deleteMealPlan('${m.id}')">×</button></div></div>`).join('')||'<small class="muted">empty</small>'}</div>`; }).join(''); $('groceryList').innerHTML=(state.groceryItems||[]).map(g=>`<div class="item ${g.done?'doneish':''}"><div class="item-head"><label><input style="width:auto" type="checkbox" ${g.done?'checked':''} onchange="toggleGrocery('${g.id}')"> ${escapeHtml(g.text)}</label><button class="btn tiny ghost danger" onclick="deleteGrocery('${g.id}')">×</button></div></div>`).join('')||'<div class="item muted">Nákupní list prázdný.</div>'; $('spendList').innerHTML=(state.spendLogs||[]).slice(0,20).map(s=>`<div class="item"><div class="item-head"><div><strong>${escapeHtml(s.name)}</strong><small>${s.date} · ${fmt(s.amount)} Kč</small></div><button class="btn tiny ghost danger" onclick="deleteSpend('${s.id}')">×</button></div></div>`).join('')||'<div class="item muted">Žádné výdaje.</div>'; }
function saveMealPlan(){ const name=$('mealPlanName').value.trim(); if(!name)return toast('Zadej meal.'); state.mealPlans.push({id:uid(),date:$('mealPlanDate').value||selectedDate,slot:$('mealPlanSlot').value,name,kcal:num($('mealPlanKcal').value),notes:$('mealPlanNotes').value.trim(),createdAt:new Date().toISOString()}); ['mealPlanName','mealPlanKcal','mealPlanNotes'].forEach(id=>$(id).value=''); saveVault(); }
window.deleteMealPlan=id=>{state.mealPlans=state.mealPlans.filter(m=>m.id!==id);saveVault();}; window.addMealPlanToDay=id=>{const m=state.mealPlans.find(x=>x.id===id); if(!m)return; ensureDay(m.date).foodLogs.push({id:uid(),name:m.name,grams:1,kcal:m.kcal||0,protein:0,carbs:0,fat:0,icon:'🍽️',createdAt:new Date().toISOString()}); saveVault();};
function quickMealWeek(){ const templates=['Skyr bowl','Chicken rice meal prep','Tvaroh protein dessert','Cottage wrap','Lean beef pasta','Long run carb box','Evening recovery tvaroh']; weekDates(selectedDate).forEach((d,i)=>state.mealPlans.push({id:uid(),date:d,slot:i===5?'Long run fuel':'Lunch',name:templates[i%templates.length],kcal:[520,690,360,510,760,620,430][i%7],notes:'v7 quick week template',createdAt:new Date().toISOString()})); saveVault(); }
function generateGrocery(){ const text=(state.mealPlans||[]).filter(m=>weekDates(selectedDate).includes(m.date)).map(m=>m.notes||m.name).join(' ').toLowerCase(); const items=['kuřecí','rýže','skyr','tvaroh','vločky','banány','zelenina','vejce','tortilly','tuňák','brambory','gely','ionťák','protein']; items.filter(x=>text.includes(x)||Math.random()<.18).forEach(x=>state.groceryItems.push({id:uid(),text:x,done:false,createdAt:new Date().toISOString()})); saveVault(); }
function addGroceryItem(){ const text=$('groceryText').value.trim(); if(!text)return; state.groceryItems.unshift({id:uid(),text,done:false,createdAt:new Date().toISOString()}); $('groceryText').value=''; saveVault(); } window.toggleGrocery=id=>{const g=state.groceryItems.find(x=>x.id===id); if(g)g.done=!g.done; saveVault();}; window.deleteGrocery=id=>{state.groceryItems=state.groceryItems.filter(x=>x.id!==id);saveVault();};
function saveSpend(){ const name=$('spendName').value.trim(); if(!name)return; state.spendLogs.unshift({id:uid(),date:selectedDate,name,amount:num($('spendAmount').value),createdAt:new Date().toISOString()}); ['spendName','spendAmount'].forEach(id=>$(id).value=''); saveVault(); } window.deleteSpend=id=>{state.spendLogs=state.spendLogs.filter(x=>x.id!==id);saveVault();};
function renderBodyVault(){ if(!$('measureList'))return; $('measureList').innerHTML=(state.measurements||[]).slice(0,25).map(m=>`<div class="item"><div class="item-head"><div><strong>${m.date} · waist ${m.waist||'—'} cm</strong><small>chest ${m.chest||'—'} · arm ${m.arm||'—'} · thigh ${m.thigh||'—'} · BF ${m.bf||'—'}%</small><p>${escapeHtml(m.notes||'')}</p></div><button class="btn tiny ghost danger" onclick="deleteMeasure('${m.id}')">×</button></div></div>`).join('')||'<div class="item muted">Žádná měření.</div>'; $('bodyRecoveryList').innerHTML=(state.bodyRecovery||[]).slice(0,25).map(r=>`<div class="item"><div class="item-head"><div><strong>${r.date} · ${r.water||0} L vody</strong><small>elektrolyty ${escapeHtml(r.electrolytes)} · supps ${escapeHtml(r.supps||'—')} · symptomy ${escapeHtml(r.symptoms||'—')}</small><p>${escapeHtml(r.notes||'')}</p></div><button class="btn tiny ghost danger" onclick="deleteBodyRecovery('${r.id}')">×</button></div></div>`).join('')||'<div class="item muted">Žádný recovery check.</div>'; $('progressPhotoGrid').innerHTML=(state.progressPhotos||[]).map(p=>`<div class="photo-card"><img src="${p.data}" alt="progress"><div><strong>${p.date}</strong><small>${escapeHtml(p.note||'')}</small><button class="btn tiny ghost danger" onclick="deleteProgressPhoto('${p.id}')">Smazat</button></div></div>`).join('')||'<div class="item muted">Žádné progress fotky.</div>'; }
function saveMeasurement(){ state.measurements.unshift({id:uid(),date:selectedDate,waist:num($('measureWaist').value,''),chest:num($('measureChest').value,''),arm:num($('measureArm').value,''),thigh:num($('measureThigh').value,''),calf:num($('measureCalf').value,''),bf:num($('measureBf').value,''),notes:$('measureNotes').value.trim(),createdAt:new Date().toISOString()}); ['measureWaist','measureChest','measureArm','measureThigh','measureCalf','measureBf','measureNotes'].forEach(id=>$(id).value=''); saveVault(); } window.deleteMeasure=id=>{state.measurements=state.measurements.filter(x=>x.id!==id);saveVault();};
function saveBodyRecovery(){ state.bodyRecovery.unshift({id:uid(),date:selectedDate,water:num($('hydrationLiters').value),electrolytes:$('hydrationElectrolytes').value,supps:$('supplementsTaken').value.trim(),symptoms:$('symptomsText').value.trim(),notes:$('bodyRecoveryNotes').value.trim(),createdAt:new Date().toISOString()}); ['hydrationLiters','supplementsTaken','symptomsText','bodyRecoveryNotes'].forEach(id=>$(id).value=''); saveVault(); } window.deleteBodyRecovery=id=>{state.bodyRecovery=state.bodyRecovery.filter(x=>x.id!==id);saveVault();};
function handleProgressPhoto(e){ const file=e.target.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{ const img=new Image(); img.onload=()=>{ const c=document.createElement('canvas'); const max=900; const sc=Math.min(1,max/Math.max(img.width,img.height)); c.width=Math.round(img.width*sc); c.height=Math.round(img.height*sc); c.getContext('2d').drawImage(img,0,0,c.width,c.height); state.progressPhotos.unshift({id:uid(),date:selectedDate,note:$('progressPhotoNote').value.trim(),data:c.toDataURL('image/jpeg',.72),createdAt:new Date().toISOString()}); $('progressPhotoNote').value=''; saveVault();}; img.src=reader.result;}; reader.readAsDataURL(file); } window.deleteProgressPhoto=id=>{state.progressPhotos=state.progressPhotos.filter(x=>x.id!==id);saveVault();};
function renderQuests(){ if(!$('questList'))return; $('questList').innerHTML=(state.quests||[]).map(q=>`<div class="item"><div class="item-head"><div><strong>${escapeHtml(q.type)} · ${escapeHtml(q.title)}</strong><small>${q.progress||0}/${q.target||'?'} ${escapeHtml(q.unit||'')} · ${escapeHtml(q.status||'active')}</small><p>${escapeHtml(q.notes||'')}</p></div><div class="item-actions"><button class="btn tiny ghost" onclick="incrementQuest('${q.id}')">+1</button><button class="btn tiny ghost" onclick="toggleQuest('${q.id}')">${q.status==='done'?'Active':'Done'}</button><button class="btn tiny ghost danger" onclick="deleteQuest('${q.id}')">×</button></div></div></div>`).join('')||'<div class="item muted">Žádné questy.</div>'; $('reviewList').innerHTML=(state.weeklyReviews||[]).slice(0,12).map(r=>`<div class="item"><strong>${r.date} · ${r.score}/10 · ${escapeHtml(r.focus)}</strong><p>${escapeHtml(r.text)}</p><button class="btn tiny ghost danger" onclick="deleteReview('${r.id}')">×</button></div>`).join('')||'<div class="item muted">Žádné weekly reviews.</div>'; renderAchievements(); }
function saveQuest(){ const title=$('questTitle').value.trim(); if(!title)return toast('Zadej quest.'); state.quests.unshift({id:uid(),title,type:$('questType').value,target:num($('questTarget').value),unit:$('questUnit').value.trim(),progress:0,notes:$('questNotes').value.trim(),status:'active',createdAt:new Date().toISOString()}); ['questTitle','questTarget','questUnit','questNotes'].forEach(id=>$(id).value=''); saveVault(); } window.incrementQuest=id=>{const q=state.quests.find(x=>x.id===id); if(q){q.progress=num(q.progress)+1;if(q.target&&q.progress>=q.target)q.status='done';} saveVault();}; window.toggleQuest=id=>{const q=state.quests.find(x=>x.id===id); if(q)q.status=q.status==='done'?'active':'done'; saveVault();}; window.deleteQuest=id=>{state.quests=state.quests.filter(x=>x.id!==id);saveVault();};
function saveWeeklyReview(){ state.weeklyReviews.unshift({id:uid(),date:selectedDate,score:num($('reviewScore').value),focus:$('reviewFocus').value.trim(),text:$('reviewText').value.trim(),createdAt:new Date().toISOString()}); ['reviewScore','reviewFocus','reviewText'].forEach(id=>$(id).value=''); saveVault(); } window.deleteReview=id=>{state.weeklyReviews=state.weeklyReviews.filter(x=>x.id!==id);saveVault();};
function renderAchievements(){ const badges=[['🔥','7 food logs',(Object.values(state.days).filter(d=>(d.foodLogs||[]).length).length>=7)],['🏃','30 km week',weekRunKm()>=30],['💪','10 workouts',state.workouts.length>=10],['📚','Reading arc',state.books.some(b=>num(b.current)>50)],['🧘','Stretch stack',state.stretchLogs.length>=7],['🔐','Secure vault',!unsafeMode&&!!vaultPassword],['☁️','Cloud ready',!!supabaseClient],['🏆','Quest finisher',state.quests.some(q=>q.status==='done')],['🥗','Meal prepper',state.mealPlans.length>=7],['🧠','Future self',state.futureLetters.length>=3]]; $('achievementGrid').innerHTML=badges.map(b=>`<div class="badge ${b[2]?'unlocked':''}"><span class="emoji">${b[0]}</span><strong>${escapeHtml(b[1])}</strong><small>${b[2]?'Unlocked':'Locked'}</small></div>`).join(''); }
function renderHostingLab(){ if(!$('hostingChecklist'))return; const checks=[['Local vault exists',!!localStorage.getItem(APP_KEY)],['HTTPS ready after deploy',location.protocol==='https:'||location.hostname==='localhost'],['Service worker registered','serviceWorker' in navigator],['Supabase config saved',!!(state.settings.cloud?.url&&state.settings.cloud?.key)],['Not using service_role key',!(state.settings.cloud?.key||'').includes('service_role')],['Manifest present',true],['Export backup available',true]]; $('hostingChecklist').innerHTML=checks.map(c=>`<div class="item"><strong><span class="health-dot ${c[1]?'':'warn'}"></span>${escapeHtml(c[0])}</strong><small>${c[1]?'OK':'Needs setup'}</small></div>`).join(''); $('hostingNotes').innerHTML=['Deploy frontend na Vercel/Netlify/GitHub Pages.','Supabase: zapnout Auth + spustit supabase.sql + RLS.','Do browseru jen anon/publishable key, nikdy service_role.','Po deployi otestuj: create vault → cloud sign in → push → mobile pull.'].map(x=>`<div class="coach-tip">${escapeHtml(x)}</div>`).join(''); }
function runSelfTest(){ const out=[]; out.push('Training Arc OS v7 self-test'); out.push('Date: '+new Date().toISOString()); out.push('LocalStorage: '+(typeof localStorage!=='undefined'?'OK':'missing')); out.push('WebCrypto: '+(crypto?.subtle?'OK':'missing')); out.push('ServiceWorker: '+('serviceWorker' in navigator?'OK':'missing')); out.push('Vault mode: '+(unsafeMode?'unsafe':'encrypted/local-ready')); out.push('Foods loaded: '+(state.foods?.length||0)); out.push('Recipes loaded: '+(allRecipes().length||0)); out.push('Cloud config: '+(state.settings.cloud?.url?'saved':'not set')); $('selfTestResult').textContent=out.join('\n'); }
async function copyDeployPlan(){ const txt=`Training Arc OS v7 deploy plan\n1) Upload files to GitHub repo.\n2) Import repo in Vercel/Netlify.\n3) Create Supabase project.\n4) Run supabase.sql.\n5) In app Connection Hub, paste URL + anon key.\n6) Sign up/sign in, create encrypted vault, push from PC, pull on mobile/tablet.\n7) Keep service_role key private.`; await navigator.clipboard.writeText(txt); toast('Deploy plan zkopírován.'); }


/* =========================
   V7 Versions / Updates page
   Version label stays v7; this is a patch/polish layer before hosting.
========================= */
function versionHistory(){
  return [
    {v:'v1',title:'Core prototype',tag:'foundation',items:['Local-first dashboard','Basic calories, gym and run logs','Simple graphs, PR board, export/import','PIN lock starter']},
    {v:'v2',title:'Premium Life OS',tag:'secure vault',items:['AES-GCM encrypted vault concept','Life OS modules: journal, mood, chores, books','Better analytics and AI-style coach tips','Supabase cloud-ready architecture']},
    {v:'v3',title:'All-in-one training',tag:'calculators',items:['Food calculator per 100 g → portion grams','Custom food database','Gym presets based on your style','Running types + 1RM, VO2max, BMI, TDEE, pace tools']},
    {v:'v4',title:'Media + import',tag:'email backup',items:['Email/webhook reports','Custom foods with images','Expanded food presets','Workout history import for presets']},
    {v:'v5',title:'Supreme sync build',tag:'cloud/security',items:['Supabase login/sync hub','Security center and password change','1000+ generated food presets','Meal builder + hosting-ready PWA base']},
    {v:'v6',title:'Titan expansion',tag:'life planning',items:['Recipes and custom recipes','Planner/timeable events + ICS export','MyFutureSelf letters/goals','Stretching and recovery routines']},
    {v:'v7',title:'Lucky Number giga build',tag:'current',items:['4000+ food presets and performance meal templates','Weekly meal planner, grocery list and spending tracker','Body vault, progress photos, quests and achievements','Hosting Lab, Connection Hub and version/update subpage']}
  ];
}
function currentPatchNotes(){
  return [
    'Přidaná samostatná podstránka Versions / Updates bez zvýšení verze — pořád zůstává v7 Lucky.',
    'Dashboard dostal rychlý proklik na changelog, aby šlo před hostingem zkontrolovat, co je uvnitř.',
    'Command palette nově umí skočit do Versions / Updates a názvy nových v7 modulů se správně zobrazují v topbaru.',
    'Hosting readiness je víc propojený s changelogem: můžeš copy/exportovat release notes a pak řešit deploy.',
    'Balíček je pořád static/local-first: žádné nové backend požadavky před hostingem.'
  ];
}
function renderVersionsPage(){
  if(!$('versionTimeline')) return;
  const allFoods=(state.foods||[]).length+(state.customFoods||[]).length;
  const allRecipes=typeof window.allRecipes==='function'?window.allRecipes():((state.recipes||[]).concat(state.customRecipes||[]));
  if($('versionFoodCount')) $('versionFoodCount').textContent=fmt(allFoods);
  if($('versionRecipeCount')) $('versionRecipeCount').textContent=fmt(allRecipes.length||0);
  if($('versionExerciseCount')) $('versionExerciseCount').textContent=fmt((state.exercisePresets||[]).length);
  if($('versionModuleCount')) $('versionModuleCount').textContent=fmt($$('.view').length);
  $('versionTimeline').innerHTML=versionHistory().map((r,i)=>`<article class="release-card ${r.v==='v7'?'current':''}"><div class="release-index">${i+1}</div><div><div class="item-head"><div><span class="tag">${escapeHtml(r.tag)}</span><h3>${escapeHtml(r.v)} · ${escapeHtml(r.title)}</h3></div>${r.v==='v7'?'<span class="status-pill">current</span>':''}</div><ul>${r.items.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div></article>`).join('');
  $('currentPatchNotes').innerHTML=currentPatchNotes().map(x=>`<div class="coach-tip">${escapeHtml(x)}</div>`).join('');
  const steps=[
    ['1','GitHub repo','Nahraj aktuální v7 soubory do repa.'],
    ['2','Vercel / Netlify','Deploy static appku, automatické HTTPS.'],
    ['3','Supabase','Spusť supabase.sql, zapni Auth/RLS, zkopíruj URL + anon key.'],
    ['4','PC → mobile test','Create vault → sign in → push → otevřít na mobilu → pull.'],
    ['5','Backup ritual','Nastav email/webhook backup a jednou za čas export encrypted vault.']
  ];
  $('versionHostingSteps').innerHTML=steps.map(s=>`<div class="version-step"><strong>${s[0]}</strong><h4>${escapeHtml(s[1])}</h4><p>${escapeHtml(s[2])}</p></div>`).join('');
}
function changelogText(){
  return 'Training Arc OS v7 Lucky — changelog\n\n' + versionHistory().map(r=>`${r.v} — ${r.title} [${r.tag}]\n`+r.items.map(x=>' - '+x).join('\n')).join('\n\n') + '\n\nCurrent v7 patch notes\n' + currentPatchNotes().map(x=>' - '+x).join('\n');
}
async function copyChangelog(){
  await navigator.clipboard.writeText(changelogText());
  toast('Changelog zkopírován.');
}
function exportChangelog(){
  download('training_arc_os_v7_changelog.txt', changelogText(), 'text/plain');
}

init();
