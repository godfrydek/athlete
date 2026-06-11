/* Training Arc OS v4 - all-in-one encrypted training + life tracker */
const APP_KEY = "trainingArcOS.v4.vault";
const LEGACY_APP_KEYS = ["trainingArcOS.v3.vault", "trainingArcOS.v2.vault", "trainingArcOS.v1.vault"];
const CLOUD_CONFIG_KEY = "trainingArcOS.v4.cloudConfig";
const LEGACY_CLOUD_CONFIG_KEY = "trainingArcOS.v3.cloudConfig";
const EMAIL_CONFIG_KEY = "trainingArcOS.v4.emailConfig";
let state = null;
let vaultPassword = "";
let encryptedVaultCache = null;
let selectedDate = new Date().toISOString().slice(0,10);
let workoutDraft = [];
let lastFoodCalc = null;
let pendingFoodImage = "";
let supabaseClient = null;
let currentView = "dashboard";

const $ = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const clamp = (n,min,max) => Math.max(min, Math.min(max, n));
const round = (n,d=1) => Number.isFinite(n) ? Math.round(n * 10**d) / 10**d : 0;
const todayIso = () => new Date().toISOString().slice(0,10);
const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("cs-CZ", {day:"numeric", month:"short", year:"numeric"});
const toast = (msg) => { const el=$("toast"); el.textContent=msg; el.classList.remove("hidden"); setTimeout(()=>el.classList.add("hidden"), 3300); };
const num = (v, fallback=0) => { if(v === "" || v === null || v === undefined) return fallback; const n = Number(v); return Number.isFinite(n) ? n : fallback; };

const RUN_TYPES = [
  {name:"Easy / Zone 2", desc:"Lehký běh na objem a recovery. Měl bys být schopný mluvit.", target:"RPE 3–5, konverzační tempo"},
  {name:"Recovery jog", desc:"Ultra lehce po těžkém dni. Účel je regenerace, ne ego.", target:"RPE 2–3"},
  {name:"Steady run", desc:"Pohodlné stabilní tempo mezi easy a tempo. Dobrý aerobic base.", target:"RPE 5–6"},
  {name:"Tempo", desc:"Středně tvrdý běh kolem prahu. Super na 5–10 km výkon.", target:"RPE 7–8"},
  {name:"Threshold intervals", desc:"Delší kontrolované úseky. Např. 3×8 min nebo 4×1 km.", target:"RPE 7–8"},
  {name:"VO₂max intervals", desc:"Tvrdší intervaly 400–1000 m s pauzou. Rychlost bez totální smrti.", target:"RPE 8–9"},
  {name:"900 easy + 100 sprint", desc:"Tvůj nápad: 900 m lehce + 100 m sprint × 5–6. Good pro speed + form.", target:"5–6 km"},
  {name:"Strides", desc:"Krátká zrychlení po easy běhu. Technika, kadence, rychlost.", target:"6–10× 15–25 s"},
  {name:"Long run", desc:"Dlouhý běh pro základ. Klidně cyklostezka a kontrola tempa.", target:"RPE 4–6"},
  {name:"Progression", desc:"Začneš easy a postupně zrychluješ. Skvělý kompromis.", target:"negativní split"},
  {name:"Fartlek", desc:"Hra s rychlostí podle pocitu, terénu nebo hudby.", target:"volné úseky"},
  {name:"Hills", desc:"Kopce / sklony. Síla nohou, běžecká technika, power.", target:"krátké úseky"},
  {name:"Race / Time trial", desc:"Závod nebo test. Trackni podmínky, vítr, povrch, finish.", target:"PR attempt"},
  {name:"Treadmill incline", desc:"Pás, sklon, kontrola tempa. Dobré v horku nebo zimě.", target:"incline / pace"},
  {name:"Brick / gym + run", desc:"Krátký běh okolo gymu nebo po směně. Praktický hybrid arc.", target:"low stress"}
];

const WORKOUT_TYPES = ["Upper", "Lower", "Fullbody", "Push", "Pull", "Calisthenics", "Recovery", "Race prep", "Hybrid", "Arms", "Back focus", "Chest focus", "Legs rehab"];
const EXERCISE_PRESETS = [
  {name:"Strict push-ups", note:"kliky – striktní forma"},
  {name:"Push-up AMRAP", note:"max reps set"},
  {name:"Weighted push-ups +10 kg", note:"lehčí weighted varianta"},
  {name:"Weighted push-ups +20 kg", note:"tvoje častá těžší varianta"},
  {name:"Explosive push-ups", note:"power / calisthenics"},
  {name:"Deficit push-ups", note:"větší ROM"},
  {name:"Diamond push-ups", note:"triceps"},
  {name:"Archer push-ups", note:"unilateral control"},
  {name:"Pike push-ups", note:"ramena"},
  {name:"Handstand push-up progression", note:"skill"},
  {name:"Pull-ups", note:"strict reps"},
  {name:"Explosive pull-ups", note:"muscle-up carryover"},
  {name:"Chin-ups", note:"biceps/lats"},
  {name:"Muscle-up technique", note:"transition + dip"},
  {name:"Dips", note:"strict"},
  {name:"Explosive dips", note:"power dips"},
  {name:"Weighted dips +20 kg", note:"síla triceps/hrudník"},
  {name:"Incline bench press", note:"hlavní hrudník"},
  {name:"Bench press", note:"flat strength"},
  {name:"Chest press machine", note:"stable chest volume"},
  {name:"Pec deck", note:"isolation chest"},
  {name:"Lat pulldown MAG", note:"lats šířka"},
  {name:"V-bar row", note:"mid/lower back"},
  {name:"Chest-supported row", note:"upper back"},
  {name:"Cable row", note:"back volume"},
  {name:"Rear delt fly", note:"rear delts"},
  {name:"Lateral raises", note:"side delts"},
  {name:"Cable lateral raises", note:"side delt constant tension"},
  {name:"Biceps curl", note:"arms"},
  {name:"Hammer curl", note:"brachialis"},
  {name:"Triceps pushdown", note:"triceps"},
  {name:"Overhead triceps extension", note:"long head"},
  {name:"DB RDL", note:"posterior chain"},
  {name:"Leg press", note:"safe lower progress"},
  {name:"Leg extension", note:"quad isolation"},
  {name:"Leg curl", note:"hamstrings"},
  {name:"Calf raises", note:"běh + estetika"},
  {name:"Hyperextensions", note:"záda/glutes"},
  {name:"Plank", note:"core"},
  {name:"Hanging knee raises", note:"core"}
];

function defaultState(){
  return {
    version: 4,
    createdAt: new Date().toISOString(),
    profile: { name:"Filip", age:17, sex:"male", height:182, weight:80, activity:1.725, calorieTarget:2900, proteinTarget:175, carbsTarget:360, fatTarget:75, weeklyRunTarget:30 },
    days: {}, foods: seedFoods(), workouts: [], exercisePresets: [], runs: [], journal: [], tasks: [], habits: seedHabits(), books: [], settings: { theme:"dark" }
  };
}
function seedFoods(){
  const rows = [
    ["Kuřecí prsa",110,23,0,2,200,"protein lean meal", "🍗"],
    ["Krůtí prsa",105,23,0,1.5,200,"protein lean", "🦃"],
    ["Hovězí mleté 5%",137,21,0,5,200,"protein beef", "🥩"],
    ["Losos",208,20,0,13,150,"protein fat omega", "🐟"],
    ["Tuňák ve vlastní šťávě",116,26,0,1,120,"protein can", "🐟"],
    ["Vejce",143,13,1.1,10,60,"fat protein", "🥚"],
    ["Vaječné bílky",52,11,0.7,0.2,200,"protein", "🥚"],
    ["Skyr",62,11,4,0.2,150,"protein dairy", "🥣"],
    ["Řecký jogurt 0%",59,10,3.6,0.4,200,"protein dairy", "🥣"],
    ["Tvaroh odtučněný",67,12,4,0.5,250,"protein dairy", "🥣"],
    ["Protein prášek",390,78,8,6,30,"protein supplement", "🥤"],
    ["Mléko 1.5%",47,3.4,4.8,1.5,250,"dairy", "🥛"],
    ["Rýže vařená",130,2.7,28,0.3,250,"carbs meal", "🍚"],
    ["Jasmínová rýže suchá",365,7,80,1,90,"carbs dry", "🍚"],
    ["Těstoviny vařené",157,5.8,31,0.9,250,"carbs meal", "🍝"],
    ["Brambory vařené",87,1.9,20,0.1,300,"carbs", "🥔"],
    ["Batáty",86,1.6,20,0.1,250,"carbs", "🍠"],
    ["Ovesné vločky",370,13,60,7,80,"carbs breakfast", "🥣"],
    ["Pečivo / rohlík",286,9,57,3.5,50,"carbs bread", "🥖"],
    ["Toustový chléb",265,9,49,3.2,60,"carbs bread", "🍞"],
    ["Tortilla",310,8,52,8,60,"carbs wrap", "🌯"],
    ["Banán",89,1.1,23,0.3,120,"carbs fruit", "🍌"],
    ["Jablko",52,0.3,14,0.2,180,"fruit", "🍎"],
    ["Borůvky",57,0.7,14,0.3,100,"fruit", "🫐"],
    ["Mražená zelenina",45,2.5,7,0.5,250,"veg micronutrients", "🥦"],
    ["Rajčata",18,0.9,3.9,0.2,150,"veg", "🍅"],
    ["Okurka",15,0.7,3.6,0.1,150,"veg", "🥒"],
    ["Olivový olej",884,0,0,100,10,"fat", "🫒"],
    ["Arašídové máslo",588,25,20,50,20,"fat snack", "🥜"],
    ["Avokádo",160,2,9,15,100,"fat", "🥑"],
    ["Mandle",579,21,22,50,30,"fat snack", "🌰"],
    ["Hořká čokoláda",546,5,61,31,20,"snack", "🍫"],
    ["Cornflakes",357,8,84,0.4,60,"carbs breakfast", "🥣"],
    ["Müsli",380,10,65,8,70,"carbs breakfast", "🥣"],
    ["Protein pudink",76,10,6,1.5,200,"protein snack", "🍮"],
    ["Šunka kuřecí",105,20,2,2,100,"protein", "🥪"],
    ["Eidam 30%",263,27,0,16,50,"protein fat", "🧀"],
    ["Mozzarella light",160,20,2,8,125,"protein dairy", "🧀"],
    ["Pizza průměr",260,11,33,9,300,"cheat meal", "🍕"],
    ["Burger průměr",295,15,28,15,250,"meal", "🍔"],
    ["Hranolky",312,3.4,41,15,150,"snack", "🍟"],
    ["Kebab box odhad",190,12,17,8,450,"meal estimate", "🥙"],
    ["Gainer / recovery shake",380,25,58,5,100,"supplement carbs", "🥤"],
    ["Iontový nápoj",28,0,7,0,500,"run carbs", "🧃"],
    ["Energetický gel",280,0,70,0,40,"run carbs", "⚡"]
  ];
  return rows.map(([name,kcal100,protein100,carbs100,fat100,defaultGrams,tags,icon])=>({id:uid(), name, kcal100, protein100, carbs100, fat100, defaultGrams, tags, icon, image:""}));
}
function seedHabits(){
  return [
    {id:uid(), name:"Supplements", history:{}}, {id:uid(), name:"Mobility / foam roller", history:{}}, {id:uid(), name:"Reading", history:{}}, {id:uid(), name:"Skincare", history:{}}
  ];
}
function demoState(){
  const s = defaultState();
  const daysAgo = (d) => { const x = new Date(); x.setDate(x.getDate()-d); return x.toISOString().slice(0,10); };
  [6,5,4,3,2,1,0].forEach((d,i)=>{ const iso=daysAgo(d); s.days[iso]={ weight: round(80.6-i*0.12,1), kcal: 2700+i*40, protein:160+i*3, carbs:320+i*7, fat:70, steps:9000+i*900, sleep:6.8+i*.1, mood:7+(i%3), energy:7, notes:"Demo log", foodLogs:[] }; });
  s.runs.push({id:uid(), date:daysAgo(5), type:"Easy / Zone 2", distance:4.1, seconds:1318, hr:145, rpe:5, terrain:"Silnice/cyklostezka", notes:"Demo easy"});
  s.runs.push({id:uid(), date:daysAgo(2), type:"Race / Time trial", distance:5.1, seconds:1507, hr:168, rpe:8, terrain:"Silnice/cyklostezka", notes:"Demo strong finish"});
  s.workouts.push({id:uid(), date:daysAgo(4), type:"Upper", notes:"Demo", exercises:[{name:"Incline bench press", sets:[{kg:78,reps:7,rir:1},{kg:75,reps:8,rir:2}]},{name:"Weighted push-ups +20 kg", sets:[{kg:20,reps:12,rir:2}]}]});
  s.workouts.push({id:uid(), date:daysAgo(1), type:"Calisthenics", notes:"Demo", exercises:[{name:"Explosive pull-ups", sets:[{kg:0,reps:8,rir:1}]},{name:"Explosive dips", sets:[{kg:0,reps:12,rir:1}]}]});
  return s;
}

function ensureDay(iso=selectedDate){
  if(!state.days[iso]) state.days[iso] = { weight:"", kcal:0, protein:0, carbs:0, fat:0, steps:0, sleep:"", mood:"", energy:"", notes:"", foodLogs:[] };
  if(!state.days[iso].foodLogs) state.days[iso].foodLogs = [];
  return state.days[iso];
}

// Crypto helpers
const enc = new TextEncoder(); const dec = new TextDecoder();
function b64(buf){ return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function fromB64(str){ return Uint8Array.from(atob(str), c=>c.charCodeAt(0)); }
async function deriveKey(password, salt){
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2", salt, iterations:220000, hash:"SHA-256"}, base, {name:"AES-GCM", length:256}, false, ["encrypt","decrypt"]);
}
async function encryptState(payload, password){
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const data = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, enc.encode(JSON.stringify(payload)));
  return { app:"TrainingArcOS", version:4, kdf:"PBKDF2-SHA256-220k", cipher:"AES-GCM", salt:b64(salt), iv:b64(iv), data:b64(data), updatedAt:new Date().toISOString() };
}
async function decryptVault(vault, password){
  const key = await deriveKey(password, fromB64(vault.salt));
  const plain = await crypto.subtle.decrypt({name:"AES-GCM", iv:fromB64(vault.iv)}, key, fromB64(vault.data));
  return JSON.parse(dec.decode(plain));
}
async function saveVault(show=true){
  if(!state || !vaultPassword) return;
  encryptedVaultCache = await encryptState(state, vaultPassword);
  localStorage.setItem(APP_KEY, JSON.stringify(encryptedVaultCache));
  if(show) toast("Vault uložený a zašifrovaný.");
  renderAll();
}

function getStoredVault(){
  const primary = localStorage.getItem(APP_KEY);
  if(primary) return JSON.parse(primary);
  for(const key of LEGACY_APP_KEYS){
    const raw = localStorage.getItem(key);
    if(raw) return JSON.parse(raw);
  }
  return null;
}

async function init(){
  selectedDate = todayIso();
  $("datePicker").value = selectedDate;
  $("todayLabel").textContent = new Date().toLocaleDateString("cs-CZ", {weekday:"long", day:"numeric", month:"long", year:"numeric"});
  encryptedVaultCache = getStoredVault();
  $("vaultStatus").textContent = encryptedVaultCache ? "Vault nalezen – zadej PIN/heslo" : "Nový vault – nastav PIN/heslo";
  bindEvents();
  initCloudConfigFields();
  initEmailConfigFields();
}
function openApp(){
  $("lockScreen").classList.add("hidden"); $("appShell").classList.remove("hidden");
  applyTheme(); hydrateStaticControls(); renderAll();
}
function applyTheme(){ document.body.classList.toggle("light", state?.settings?.theme === "light"); }
function hydrateStaticControls(){
  $("workoutType").innerHTML = WORKOUT_TYPES.map(x=>`<option>${x}</option>`).join("");
  $("runType").innerHTML = RUN_TYPES.map(x=>`<option>${x.name}</option>`).join("");
  renderExercisePresets(); renderRunTypeCards();
}

function bindEvents(){
  $("unlockBtn").onclick = async()=>{ const pass=$("vaultPassword").value; if(!pass || pass.length<4) return toast("Zadej aspoň 4 znaky."); try{ encryptedVaultCache = getStoredVault(); if(!encryptedVaultCache) return toast("Vault zatím neexistuje. Klikni na Vytvořit nový vault."); state = await decryptVault(encryptedVaultCache, pass); vaultPassword=pass; openApp(); toast("Odemčeno."); } catch(e){ toast("Špatný PIN/heslo nebo poškozený vault."); }};
  $("createVaultBtn").onclick = async()=>{ const pass=$("vaultPassword").value; if(!pass || pass.length<4) return toast("Nastav PIN/heslo aspoň 4 znaky."); if(getStoredVault() && !confirm("Přepsat existující lokální vault?")) return; state=defaultState(); vaultPassword=pass; await saveVault(false); openApp(); toast("Nový secure vault vytvořen."); };
  $("demoVaultBtn").onclick = async()=>{ const pass=$("vaultPassword").value || "demo1234"; state=demoState(); vaultPassword=pass; await saveVault(false); openApp(); toast("Demo vault vytvořený. Heslo je to, co jsi zadal; pokud nic, demo1234."); };
  $("resetVaultBtn").onclick = ()=>{ if(confirm("Smazat lokální vault? Nejde vrátit zpět.")){ localStorage.removeItem(APP_KEY); LEGACY_APP_KEYS.forEach(k=>localStorage.removeItem(k)); location.reload(); }};
  $("quickSaveBtn").onclick = ()=>saveVault(); $("lockBtn").onclick=()=>location.reload();
  $("themeToggle").onclick=()=>{ state.settings.theme = state.settings.theme === "light" ? "dark" : "light"; applyTheme(); saveVault(false); };
  $("datePicker").onchange=(e)=>{ selectedDate=e.target.value || todayIso(); renderAll(); };
  $$(".nav-btn").forEach(btn=>btn.onclick=()=>switchView(btn.dataset.view));
  $("saveDayBtn").onclick = saveQuickDay;
  $("calcFoodBtn").onclick = calculateFood; $("saveFoodBtn").onclick=saveCustomFood; $("addFoodToDayBtn").onclick=addCalculatedFoodToDay; $("foodSearch").oninput=renderFoods; $("clearFoodSearch").onclick=()=>{$("foodSearch").value=""; renderFoods();}; $("foodImageInput").onchange=handleFoodImage; $("clearFoodImageBtn").onclick=clearFoodImage;
  ["foodGrams","foodKcal100","foodProtein100","foodCarbs100","foodFat100","foodName","foodIcon","foodTags"].forEach(id=>$(id).oninput=calculateFood);
  $("saveTargetsBtn").onclick=saveTargets;
  $("addSetBtn").onclick=addSetToDraft; $("saveWorkoutBtn").onclick=saveWorkout; $("clearWorkoutDraftBtn").onclick=()=>{workoutDraft=[]; renderWorkoutDraft();}; $("addCustomExerciseBtn").onclick=addCustomExercisePreset; $("workoutImportInput").onchange=importWorkoutHistory;
  $("saveRunBtn").onclick=saveRun;
  $("calc1rmBtn").onclick=calc1rm; $("calcVo2Btn").onclick=calcVo2; $("calcTdeeBtn").onclick=calcTdee; $("calcPaceBtn").onclick=calcPace; $("calcPredBtn").onclick=calcPrediction; $("calcMacroBtn").onclick=calcMacros;
  $("saveJournalBtn").onclick=saveJournal; $("addTaskBtn").onclick=addTask; $("saveBookBtn").onclick=saveBook; $("addHabitBtn").onclick=addHabit;
  $("exportBtn").onclick=exportBackup; $("importInput").onchange=importBackup; $("changePasswordBtn").onclick=changePassword;
  $("saveCloudConfigBtn").onclick=saveCloudConfig; $("cloudSignupBtn").onclick=cloudSignup; $("cloudSigninBtn").onclick=cloudSignin; $("cloudPushBtn").onclick=cloudPush; $("cloudPullBtn").onclick=cloudPull; $("cloudSignoutBtn").onclick=cloudSignout; $("saveEmailConfigBtn").onclick=saveEmailConfig; $("mailtoDailyBtn").onclick=openDailyEmail; $("webhookDailyBtn").onclick=sendDailyWebhook; $("webhookVaultBtn").onclick=sendVaultWebhook;
}
function switchView(view){ currentView=view; $$(".nav-btn").forEach(b=>b.classList.toggle("active", b.dataset.view===view)); $$(".view").forEach(v=>v.classList.toggle("active", v.id===view)); const titleMap={dashboard:"Dashboard", nutrition:"Kalorie & food database", gym:"Gym workouts", running:"Running arc", calculators:"Kalkulačky", life:"Life OS", analytics:"Grafy & staty", settings:"Sync & secure"}; $("viewTitle").textContent=titleMap[view]||view; if(view==="analytics") setTimeout(renderCharts,30); }

function migrateState(){ if(!state.exercisePresets) state.exercisePresets=[]; if(!state.foods?.length) state.foods=seedFoods(); if(!state.version || state.version<4) state.version=4; }
function renderAll(){
  if(!state) return; migrateState(); ensureDay(); renderDashboard(); renderDayInputs(); renderFoodImagePreview(); renderFoods(); renderFoodLog(); renderTargets(); renderWorkoutDraft(); renderWorkoutHistory(); renderGymInsights(); renderRunHistory(); renderRunInsights(); renderJournal(); renderTasks(); renderBooks(); renderHabits(); renderPrBoard(); renderEmailStatus(); if(currentView==="analytics") renderCharts();
}
function dayTotals(iso=selectedDate){
  const d=ensureDay(iso); const food = (d.foodLogs||[]).reduce((a,f)=>({kcal:a.kcal+num(f.kcal), protein:a.protein+num(f.protein), carbs:a.carbs+num(f.carbs), fat:a.fat+num(f.fat)}), {kcal:0,protein:0,carbs:0,fat:0});
  return { kcal:num(d.kcal)+food.kcal, protein:num(d.protein)+food.protein, carbs:num(d.carbs)+food.carbs, fat:num(d.fat)+food.fat, food };
}
function renderDayInputs(){ const d=ensureDay(); $("quickWeight").value=d.weight||""; $("quickKcal").value=d.kcal||""; $("quickProtein").value=d.protein||""; $("quickSteps").value=d.steps||""; $("quickSleep").value=d.sleep||""; $("quickMood").value=d.mood||""; $("quickNote").value=d.notes||""; }
function saveQuickDay(){ const d=ensureDay(); d.weight=num($("quickWeight").value,""); d.kcal=num($("quickKcal").value,0); d.protein=num($("quickProtein").value,0); d.steps=num($("quickSteps").value,0); d.sleep=num($("quickSleep").value,""); d.mood=num($("quickMood").value,""); d.notes=$("quickNote").value.trim(); saveVault(); }
function renderDashboard(){
  const d=ensureDay(); const totals=dayTotals(); const p=state.profile; const kcalScore = p.calorieTarget ? 100 - Math.min(100, Math.abs(totals.kcal-p.calorieTarget)/p.calorieTarget*130) : 0; const proteinScore = p.proteinTarget ? Math.min(100, totals.protein/p.proteinTarget*100) : 0; const stepsScore = Math.min(100, num(d.steps)/10000*100); const sleepScore = Math.min(100, num(d.sleep)/8*100); const moodScore = num(d.mood)*10; const workoutToday = state.workouts.some(w=>w.date===selectedDate) ? 100 : 0; const runToday = state.runs.some(r=>r.date===selectedDate) ? 100 : 0; const score = Math.round((kcalScore*.18)+(proteinScore*.22)+(stepsScore*.15)+(sleepScore*.15)+(moodScore*.12)+(Math.max(workoutToday,runToday)*.18));
  $("arcScore").textContent=score; $("scoreRingText").textContent=score+"%"; drawRing($("scoreRing"), score);
  $("dashKcal").textContent=Math.round(totals.kcal); $("dashProtein").textContent=Math.round(totals.protein)+" g"; $("dashKcalTarget").textContent="cíl "+p.calorieTarget; $("dashProteinTarget").textContent="cíl "+p.proteinTarget+" g"; $("dashWeight").textContent=d.weight?d.weight+" kg":"—"; $("dashAvgWeight").textContent=avgWeight(7)||"—";
  $("dashLoad").textContent=Math.round(getWeekGymVolume(new Date(selectedDate)) / 1000)+"k / "+round(getWeekRunKm(new Date(selectedDate)),1)+" km";
  const tips = getCoachTips(); $("coachOneLiner").textContent=tips[0] || "Zapiš dnešní data a coach ti dá tip."; $("coachTips").innerHTML=tips.map(t=>`<div class="item"><strong>${t}</strong></div>`).join("");
}
function avgWeight(days){ const arr = Object.entries(state.days).sort(([a],[b])=>a.localeCompare(b)).slice(-days).map(([_,d])=>num(d.weight,NaN)).filter(Number.isFinite); if(!arr.length) return null; return round(arr.reduce((a,b)=>a+b,0)/arr.length,1)+" kg"; }
function getCoachTips(){
  const d=ensureDay(); const totals=dayTotals(); const p=state.profile; const tips=[];
  if(totals.protein < p.proteinTarget*.85) tips.push(`Protein je nízko: ${Math.round(totals.protein)} g / ${p.proteinTarget} g. Dej skyr/kuře/protein a zachraň recovery.`);
  if(totals.kcal && Math.abs(totals.kcal-p.calorieTarget)>350) tips.push(`Kcal jsou mimo cíl o ${Math.round(totals.kcal-p.calorieTarget)} kcal. Dnes drž plán podle cíle, ne podle náhody.`);
  if(num(d.sleep) && num(d.sleep)<7) tips.push("Spánek pod 7 h → dnes nejezdi ego max, spíš technika/RIR a easy běh.");
  const weekKm=getWeekRunKm(new Date(selectedDate)); if(weekKm>p.weeklyRunTarget*1.15) tips.push(`Běžecký objem už je ${round(weekKm,1)} km. Další běh drž easy, ať se nezrakvíš.`);
  const lastRun=[...state.runs].sort((a,b)=>b.date.localeCompare(a.date))[0]; if(lastRun && lastRun.rpe>=8) tips.push("Poslední běh byl tvrdý. Další den dej easy/recovery nebo upper bez nohou.");
  if(!state.runs.some(r=>r.date===selectedDate) && !state.workouts.some(w=>w.date===selectedDate)) tips.push("Dnes zatím žádný training log. Aspoň 20–30 min easy nebo rychlý upper/cali udrží streak.");
  if(!tips.length) tips.push("Dnes to vypadá clean. Drž protein, hydrataci a zapiš večer mood/sleep.");
  return tips.slice(0,5);
}

function escapeHtml(str){ return String(str ?? "").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m])); }
function foodThumb(food){
  if(food?.image) return `<span class="food-thumb"><img src="${food.image}" alt=""></span>`;
  return `<span class="food-thumb">${escapeHtml(food?.icon || "🍽️")}</span>`;
}
function renderFoodImagePreview(){
  const el=$("foodImagePreview");
  if(!el) return;
  el.innerHTML = pendingFoodImage ? `<img src="${pendingFoodImage}" alt="food preview"><span>Obrázek připravený</span>` : "Bez obrázku";
}
function fileToDataUrl(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
async function handleFoodImage(e){
  const file=e.target.files?.[0]; if(!file) return;
  if(file.size > 1_500_000) return toast("Obrázek je moc velký. Dej radši pod 1.5 MB, ať vault nenabobtná.");
  pendingFoodImage = await fileToDataUrl(file);
  renderFoodImagePreview();
  toast("Obrázek jídla přidán.");
}
function clearFoodImage(){ pendingFoodImage=""; if($("foodImageInput")) $("foodImageInput").value=""; renderFoodImagePreview(); }
function calculateFood(){
  const grams=num($("foodGrams").value); const factor=grams/100; const kcal=num($("foodKcal100").value)*factor; const protein=num($("foodProtein100").value)*factor; const carbs=num($("foodCarbs100").value)*factor; const fat=num($("foodFat100").value)*factor;
  lastFoodCalc={ id:uid(), name:$("foodName").value.trim()||"Custom food", grams, kcal:round(kcal,0), protein:round(protein,1), carbs:round(carbs,1), fat:round(fat,1), kcal100:num($("foodKcal100").value), protein100:num($("foodProtein100").value), carbs100:num($("foodCarbs100").value), fat100:num($("foodFat100").value), tags:$("foodTags").value.trim()||"custom", icon:$("foodIcon").value.trim()||"🍽️", image:pendingFoodImage };
  $("foodCalcResult").innerHTML = `${foodThumb(lastFoodCalc)} <b>${escapeHtml(lastFoodCalc.name)}</b> (${grams||0} g): <b>${lastFoodCalc.kcal} kcal</b>, P ${lastFoodCalc.protein} g / C ${lastFoodCalc.carbs} g / F ${lastFoodCalc.fat} g`;
  return lastFoodCalc;
}
function saveCustomFood(){ const f=calculateFood(); if(!f.name || !f.kcal100) return toast("Zadej aspoň název a kcal/100g."); state.foods.unshift({id:uid(), name:f.name, kcal100:f.kcal100, protein100:f.protein100, carbs100:f.carbs100, fat100:f.fat100, defaultGrams:f.grams||100, tags:f.tags||"custom", icon:f.icon||"🍽️", image:f.image||""}); clearFoodImage(); saveVault(); toast("Custom jídlo uloženo."); }
function addCalculatedFoodToDay(){ const f=calculateFood(); if(!f.grams || !f.kcal) return toast("Zadej gramáž a kcal."); ensureDay().foodLogs.push(f); saveVault(); }
function quickAddFood(food){ const grams = Number(prompt(`Gramáž pro ${food.name}:`, food.defaultGrams||100)); if(!grams) return; const factor=grams/100; ensureDay().foodLogs.push({id:uid(), name:food.name, grams, kcal:round(food.kcal100*factor,0), protein:round(food.protein100*factor,1), carbs:round(food.carbs100*factor,1), fat:round(food.fat100*factor,1), icon:food.icon||"🍽️", image:food.image||""}); saveVault(); }
function fillFoodForm(food){ $("foodName").value=food.name; $("foodGrams").value=food.defaultGrams||100; $("foodKcal100").value=food.kcal100; $("foodProtein100").value=food.protein100; $("foodCarbs100").value=food.carbs100; $("foodFat100").value=food.fat100; $("foodTags").value=food.tags||""; $("foodIcon").value=food.icon||""; pendingFoodImage=food.image||""; renderFoodImagePreview(); calculateFood(); toast("Jídlo vyplněné v kalkulátoru."); }
function deleteFoodPreset(id){ if(!confirm("Smazat toto jídlo z databáze?")) return; state.foods=state.foods.filter(f=>f.id!==id); saveVault(); }
function renderFoods(){ const q=($("foodSearch")?.value||"").toLowerCase(); const foods=state.foods.filter(f=>f.name.toLowerCase().includes(q)||String(f.tags||"").toLowerCase().includes(q)); $("customFoodsList").innerHTML=foods.map(f=>`<div class="item"><div class="item-head"><div class="food-card-main">${foodThumb(f)}<div><strong>${escapeHtml(f.name)}</strong><p>${f.kcal100} kcal/100g • P ${f.protein100} C ${f.carbs100} F ${f.fat100}</p><div class="micro">${String(f.tags||"").split(/[, ]+/).filter(Boolean).slice(0,4).map(t=>`<span class="pill">${escapeHtml(t)}</span>`).join("")}</div></div></div><div class="item-actions"><button class="tiny-btn primary" data-food="${f.id}">Přidat</button><button class="tiny-btn ghost" data-fill-food="${f.id}">Vyplnit</button><button class="tiny-btn ghost danger" data-delete-food="${f.id}">Smazat</button></div></div></div>`).join("") || `<div class="item muted">Žádné jídlo.</div>`; $$('[data-food]').forEach(b=>b.onclick=()=>quickAddFood(state.foods.find(f=>f.id===b.dataset.food))); $$('[data-fill-food]').forEach(b=>b.onclick=()=>fillFoodForm(state.foods.find(f=>f.id===b.dataset.fillFood))); $$('[data-delete-food]').forEach(b=>b.onclick=()=>deleteFoodPreset(b.dataset.deleteFood)); }
function renderFoodLog(){ const d=ensureDay(); const totals=dayTotals(); $("todayFoodTag").textContent=`${Math.round(totals.kcal)} kcal`; $("foodLogList").innerHTML=(d.foodLogs||[]).map(f=>`<div class="item"><div class="item-head"><div class="food-card-main">${foodThumb(f)}<div><strong>${escapeHtml(f.name)}</strong><p>${f.grams} g • ${f.kcal} kcal • P ${f.protein} C ${f.carbs} F ${f.fat}</p></div></div><button class="tiny-btn ghost danger" data-del-food="${f.id}">Smazat</button></div></div>`).join("") || `<div class="item muted">Zatím nic.</div>`; $$('[data-del-food]').forEach(b=>b.onclick=()=>{ const d=ensureDay(); d.foodLogs=d.foodLogs.filter(f=>f.id!==b.dataset.delFood); saveVault(); }); }
function renderTargets(){ const p=state.profile; $("targetKcal").value=p.calorieTarget; $("targetProtein").value=p.proteinTarget; $("targetCarbs").value=p.carbsTarget; $("targetFat").value=p.fatTarget; }
function saveTargets(){ const p=state.profile; p.calorieTarget=num($("targetKcal").value); p.proteinTarget=num($("targetProtein").value); p.carbsTarget=num($("targetCarbs").value); p.fatTarget=num($("targetFat").value); saveVault(); }

function allExercisePresets(){
  const custom = state?.exercisePresets || [];
  const seen = new Set();
  return [...custom, ...EXERCISE_PRESETS].filter(p=>{ const k=p.name.toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; });
}
function renderExercisePresets(){
  $("exercisePresets").innerHTML=allExercisePresets().map(p=>`<button class="preset" data-preset-ex="${escapeHtml(p.name)}"><b>${escapeHtml(p.name)}</b><span>${escapeHtml(p.note||"")}</span></button>`).join("");
  $$('[data-preset-ex]').forEach(b=>b.onclick=()=>{ $("exerciseName").value=b.dataset.presetEx; if(b.dataset.presetEx.includes("+20")) $("setKg").value=20; });
}
function addCustomExercisePreset(){
  const name=$("customExerciseName").value.trim(); if(!name) return toast("Zadej název cviku.");
  const note=$("customExerciseNote").value.trim()||"custom";
  state.exercisePresets = state.exercisePresets || [];
  if(!allExercisePresets().some(p=>p.name.toLowerCase()===name.toLowerCase())) state.exercisePresets.unshift({id:uid(), name, note});
  $("customExerciseName").value=""; $("customExerciseNote").value=""; saveVault(); toast("Cvik přidaný do presetů.");
}
function parseCsvLike(text){
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean); if(!lines.length) return [];
  const delim = [";",",","\t"].sort((a,b)=>lines[0].split(b).length-lines[0].split(a).length)[0];
  const headers=lines[0].split(delim).map(h=>h.trim().toLowerCase());
  const idx=headers.findIndex(h=>/exercise|cvik|name|název|title|movement/.test(h));
  if(idx<0) return lines.flatMap(l=>extractExerciseNames(l));
  return lines.slice(1).map(l=>l.split(delim)[idx]?.trim()).filter(Boolean);
}
function extractExerciseNames(text){
  const names=[];
  const patterns=[/exercise\s*[:=]\s*([^,;\n]+)/gi,/cvik\s*[:=]\s*([^,;\n]+)/gi,/name\s*[:=]\s*([^,;\n]+)/gi];
  patterns.forEach(re=>{ let m; while((m=re.exec(text))) names.push(m[1].trim()); });
  EXERCISE_PRESETS.forEach(p=>{ if(text.toLowerCase().includes(p.name.toLowerCase())) names.push(p.name); });
  return names;
}
function collectNamesFromJson(obj, out=[]){
  if(Array.isArray(obj)) obj.forEach(x=>collectNamesFromJson(x,out));
  else if(obj && typeof obj === "object"){
    for(const [k,v] of Object.entries(obj)){
      if(typeof v === "string" && /exercise|cvik|name|title|movement/i.test(k) && v.length>1 && v.length<80) out.push(v);
      collectNamesFromJson(v,out);
    }
  }
  return out;
}
async function importWorkoutHistory(e){
  const file=e.target.files?.[0]; if(!file) return;
  const text=await file.text(); let names=[];
  try{ names=collectNamesFromJson(JSON.parse(text)); } catch(_){ names=parseCsvLike(text); }
  const counts={}; names.map(n=>String(n).replace(/^"|"$/g,"").trim()).filter(n=>n.length>1&&n.length<70).forEach(n=>{ counts[n]=(counts[n]||0)+1; });
  const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  state.exercisePresets = state.exercisePresets || [];
  let added=0;
  sorted.forEach(([name,count])=>{ if(!allExercisePresets().some(p=>p.name.toLowerCase()===name.toLowerCase())){ state.exercisePresets.push({id:uid(), name, note:`import z ${file.name} • ${count}×`}); added++; }});
  const report = sorted.slice(0,12).map(([n,c])=>`${escapeHtml(n)} (${c}×)`).join(" • ");
  $("workoutImportReport").innerHTML = sorted.length ? `<span class="import-good">Nalezeno ${sorted.length} cviků, přidáno ${added} nových presetů.</span><br>${report}` : `<span class="import-warn">Nic jsem nenašel. Pošli mi export sem do chatu a upravím parser podle formátu Lyftu.</span>`;
  saveVault();
}
function addSetToDraft(){ const name=$("exerciseName").value.trim(); if(!name) return toast("Zadej cvik."); const kg=num($("setKg").value); const reps=num($("setReps").value); const rir=num($("setRir").value); const count=Math.max(1,num($("setCount").value,1)); let ex=workoutDraft.find(e=>e.name.toLowerCase()===name.toLowerCase()); if(!ex){ ex={name, sets:[]}; workoutDraft.push(ex); } for(let i=0;i<count;i++) ex.sets.push({kg,reps,rir}); renderWorkoutDraft(); }
function renderWorkoutDraft(){ $("workoutDraft").innerHTML=workoutDraft.map((e,ei)=>`<div class="item"><div class="item-head"><strong>${e.name}</strong><button class="tiny-btn ghost danger" data-del-ex="${ei}">Smazat</button></div><p>${e.sets.map(s=>`${s.kg}kg×${s.reps} @RIR${s.rir}`).join(" • ")}</p></div>`).join("") || `<div class="item muted">Draft je prázdný.</div>`; $$('[data-del-ex]').forEach(b=>b.onclick=()=>{workoutDraft.splice(Number(b.dataset.delEx),1); renderWorkoutDraft();}); }
function saveWorkout(){ if(!workoutDraft.length) return toast("Přidej aspoň jednu sérii."); state.workouts.unshift({id:uid(), date:selectedDate, type:$("workoutType").value, notes:"", exercises:JSON.parse(JSON.stringify(workoutDraft))}); workoutDraft=[]; saveVault(); toast("Workout uložený."); }
function workoutVolume(w){ return (w.exercises||[]).reduce((a,e)=>a+e.sets.reduce((s,x)=>s+num(x.kg)*num(x.reps),0),0); }
function renderWorkoutHistory(){ $("workoutHistoryCount").textContent=state.workouts.length; $("workoutHistory").innerHTML=state.workouts.slice(0,30).map(w=>`<div class="item"><div class="item-head"><div><strong>${fmtDate(w.date)} • ${w.type}</strong><p>${w.exercises.map(e=>`${e.name}: ${e.sets.length}s`).join(" • ")}</p><p>Volume: ${Math.round(workoutVolume(w))} kg</p></div><button class="tiny-btn ghost danger" data-del-workout="${w.id}">Smazat</button></div></div>`).join("") || `<div class="item muted">Žádné workouty.</div>`; $$('[data-del-workout]').forEach(b=>b.onclick=()=>{state.workouts=state.workouts.filter(w=>w.id!==b.dataset.delWorkout); saveVault();}); }
function renderGymInsights(){ const prs = getGymPRs().slice(0,8); const tips = prs.map(p=>`<div class="item"><strong>${p.name}</strong><p>Best set: ${p.kg}kg × ${p.reps}, e1RM ${p.e1rm} kg. Next: zkus +1 rep nebo +2.5 kg při stejném RIR.</p></div>`).join(""); $("gymInsights").innerHTML=tips || `<div class="item muted">Zapiš workouty a PR board se naplní.</div>`; }
function getGymPRs(){ const map={}; state.workouts.forEach(w=>w.exercises.forEach(e=>e.sets.forEach(s=>{ const e1=epley(num(s.kg), num(s.reps)); if(!map[e.name] || e1>map[e.name].e1rm) map[e.name]={name:e.name, kg:num(s.kg), reps:num(s.reps), e1rm:round(e1,1)}; }))); return Object.values(map).sort((a,b)=>b.e1rm-a.e1rm); }

function parseTime(str){ if(!str) return 0; const parts=String(str).trim().split(":").map(Number); if(parts.some(n=>!Number.isFinite(n))) return 0; if(parts.length===2) return parts[0]*60+parts[1]; if(parts.length===3) return parts[0]*3600+parts[1]*60+parts[2]; return Number(str)||0; }
function fmtSeconds(sec){ sec=Math.round(sec); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60; return h ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${m}:${String(s).padStart(2,"0")}`; }
function saveRun(){ const distance=num($("runDistance").value); const seconds=parseTime($("runTime").value); if(!distance || !seconds) return toast("Zadej vzdálenost a čas."); state.runs.unshift({id:uid(), date:selectedDate, type:$("runType").value, distance, seconds, hr:num($("runHr").value), rpe:num($("runRpe").value), terrain:$("runTerrain").value, notes:$("runNotes").value.trim()}); saveVault(); toast("Běh uložený."); }
function renderRunTypeCards(){ $("runTypeCards").innerHTML=RUN_TYPES.map(r=>`<div class="item"><strong>${r.name}</strong><p>${r.desc}</p><p><b>Target:</b> ${r.target}</p></div>`).join(""); }
function renderRunHistory(){ $("runHistoryCount").textContent=state.runs.length; $("runHistory").innerHTML=state.runs.slice(0,30).map(r=>`<div class="item"><div class="item-head"><div><strong>${fmtDate(r.date)} • ${r.type}</strong><p>${r.distance} km za ${fmtSeconds(r.seconds)} • ${fmtSeconds(r.seconds/r.distance)}/km • HR ${r.hr||"—"} • RPE ${r.rpe||"—"}</p><p>${r.notes||""}</p></div><button class="tiny-btn ghost danger" data-del-run="${r.id}">Smazat</button></div></div>`).join("") || `<div class="item muted">Žádné běhy.</div>`; $$('[data-del-run]').forEach(b=>b.onclick=()=>{state.runs=state.runs.filter(r=>r.id!==b.dataset.delRun); saveVault();}); }
function renderRunInsights(){ const best5=bestRace(5), best1=bestRace(1), best6=bestRace(6); const week=getWeekRunKm(new Date(selectedDate)); const html=[`<div class="item"><strong>Týdenní objem</strong><p>${round(week,1)} km / cíl ${state.profile.weeklyRunTarget} km</p></div>`, best1?`<div class="item"><strong>Best ~1 km</strong><p>${fmtSeconds(best1.seconds)} pace ${fmtSeconds(best1.seconds/best1.distance)}/km</p></div>`:"", best5?`<div class="item"><strong>Best ~5 km</strong><p>${fmtSeconds(best5.seconds)} pace ${fmtSeconds(best5.seconds/best5.distance)}/km</p></div>`:"", best6?`<div class="item"><strong>Best ~6 km</strong><p>${fmtSeconds(best6.seconds)} pace ${fmtSeconds(best6.seconds/best6.distance)}/km</p></div>`:""]; $("runInsights").innerHTML=html.join("") || `<div class="item muted">Zapiš běhy.</div>`; }
function bestRace(target){ const close=state.runs.filter(r=>Math.abs(r.distance-target)<=target*.12); if(!close.length) return null; return close.sort((a,b)=>(a.seconds/a.distance)-(b.seconds/b.distance))[0]; }
function getWeekRange(date){ const d=new Date(date); const day=(d.getDay()+6)%7; const start=new Date(d); start.setDate(d.getDate()-day); start.setHours(0,0,0,0); const end=new Date(start); end.setDate(start.getDate()+7); return {start,end}; }
function getWeekRunKm(date){ const {start,end}=getWeekRange(date); return state.runs.filter(r=>{const d=new Date(r.date+"T12:00:00"); return d>=start&&d<end;}).reduce((a,r)=>a+num(r.distance),0); }
function getWeekGymVolume(date){ const {start,end}=getWeekRange(date); return state.workouts.filter(w=>{const d=new Date(w.date+"T12:00:00"); return d>=start&&d<end;}).reduce((a,w)=>a+workoutVolume(w),0); }

function epley(w,r){ return w*(1+r/30); }
function brzycki(w,r){ return r>=37 ? 0 : w*36/(37-r); }
function calc1rm(){ const w=num($("calc1rmWeight").value), reps=num($("calc1rmReps").value), rpe=num($("calc1rmRpe").value,10); const rir=clamp(10-rpe,0,10); const e1=epley(w,reps), b=brzycki(w,reps), rpeAdj=epley(w,reps+rir); $("calc1rmOut").innerHTML=`Epley: <b>${round(e1,1)} kg</b><br>Brzycki: <b>${round(b,1)} kg</b><br>RPE-adjusted e1RM: <b>${round(rpeAdj,1)} kg</b> (${reps} reps @RPE ${rpe}, cca RIR ${round(rir,1)})`; }
function calcVo2(){ const meters=num($("cooperMeters").value); const dist=num($("vo2Distance").value); const sec=parseTime($("vo2Time").value); let lines=[]; if(meters) lines.push(`Cooper VO₂max: <b>${round((meters-504.9)/44.73,1)}</b> ml/kg/min`); if(dist&&sec){ const min=sec/60; const v=dist*1000/min; const vo2 = -4.6 + 0.182258*v + 0.000104*v*v; lines.push(`Race estimate: <b>${round(vo2,1)}</b> ml/kg/min (${dist} km za ${fmtSeconds(sec)})`); } $("calcVo2Out").innerHTML=lines.join("<br>")||"Zadej Cooper metry nebo závod."; }
function calcTdee(){ const age=num($("tdeeAge").value), h=num($("tdeeHeight").value), w=num($("tdeeWeight").value), act=num($("tdeeActivity").value); const bmr=10*w+6.25*h-5*age+5; const tdee=bmr*act; const bmi=w/((h/100)**2); $("calcTdeeOut").innerHTML=`BMI: <b>${round(bmi,1)}</b><br>BMR: <b>${Math.round(bmr)}</b> kcal<br>TDEE odhad: <b>${Math.round(tdee)}</b> kcal<br>Cut: ${Math.round(tdee-350)}–${Math.round(tdee-500)} kcal • Lean bulk: ${Math.round(tdee+150)}–${Math.round(tdee+300)} kcal`; }
function calcPace(){ const d=num($("paceDistance").value), s=parseTime($("paceTime").value); if(!d||!s) return; const pace=s/d; $("calcPaceOut").innerHTML=`Pace: <b>${fmtSeconds(pace)}/km</b><br>Speed: <b>${round(3600/pace,2)} km/h</b>`; }
function calcPrediction(){ const d1=num($("predD1").value), t1=parseTime($("predT1").value), d2=num($("predD2").value); if(!d1||!t1||!d2) return; const pred=t1*Math.pow(d2/d1,1.06); $("calcPredOut").innerHTML=`Predikce na ${d2} km: <b>${fmtSeconds(pred)}</b><br>Pace: ${fmtSeconds(pred/d2)}/km`; }
function calcMacros(){ const kcal=num($("macroKcal").value), w=num($("macroWeight").value), pk=num($("macroProteinKg").value), fk=num($("macroFatKg").value); const p=Math.round(w*pk), f=Math.round(w*fk), c=Math.round((kcal-p*4-f*9)/4); $("calcMacroOut").innerHTML=`Protein: <b>${p} g</b><br>Tuky: <b>${f} g</b><br>Sacharidy: <b>${c} g</b>`; }

function saveJournal(){ state.journal.unshift({id:uid(), date:selectedDate, mood:num($("journalMood").value), energy:num($("journalEnergy").value), text:$("journalText").value.trim()}); $("journalText").value=""; saveVault(); }
function renderJournal(){ $("journalList").innerHTML=state.journal.slice(0,20).map(j=>`<div class="item"><strong>${fmtDate(j.date)} • mood ${j.mood||"—"} • energy ${j.energy||"—"}</strong><p>${j.text||""}</p></div>`).join("") || `<div class="item muted">Žádný deník.</div>`; }
function addTask(){ const text=$("taskText").value.trim(); if(!text) return; state.tasks.unshift({id:uid(), text, done:false, date:selectedDate}); $("taskText").value=""; saveVault(); }
function renderTasks(){ $("taskList").innerHTML=state.tasks.map(t=>`<div class="item"><div class="item-head"><strong class="${t.done?'done':''}">${t.text}</strong><button class="tiny-btn ghost" data-task="${t.id}">${t.done?'Undo':'Done'}</button></div><p>${fmtDate(t.date)}</p></div>`).join("") || `<div class="item muted">Žádné tasky.</div>`; $$('[data-task]').forEach(b=>b.onclick=()=>{const t=state.tasks.find(x=>x.id===b.dataset.task); t.done=!t.done; saveVault();}); }
function saveBook(){ const title=$("bookTitle").value.trim(); if(!title) return; state.books.unshift({id:uid(), date:selectedDate, title, pages:num($("bookPages").value), current:num($("bookCurrent").value), total:num($("bookTotal").value), note:$("bookNote").value.trim()}); saveVault(); }
function renderBooks(){ $("bookList").innerHTML=state.books.slice(0,20).map(b=>`<div class="item"><strong>${b.title}</strong><p>${fmtDate(b.date)} • dnes ${b.pages||0} stran • ${b.total?Math.round((b.current/b.total)*100):0}%</p><p>${b.note||""}</p></div>`).join("") || `<div class="item muted">Žádné čtení.</div>`; }
function addHabit(){ const name=$("habitName").value.trim(); if(!name) return; state.habits.unshift({id:uid(), name, history:{}}); $("habitName").value=""; saveVault(); }
function renderHabits(){ $("habitList").innerHTML=state.habits.map(h=>`<div class="item"><div class="item-head"><strong>${h.name}</strong><button class="tiny-btn ${h.history[selectedDate]?'primary':'ghost'}" data-habit="${h.id}">${h.history[selectedDate]?'Done':'Mark'}</button></div><p>Streak: ${habitStreak(h)} dní</p></div>`).join(""); $$('[data-habit]').forEach(b=>b.onclick=()=>{const h=state.habits.find(x=>x.id===b.dataset.habit); h.history[selectedDate]=!h.history[selectedDate]; saveVault();}); }
function habitStreak(h){ let streak=0; const d=new Date(selectedDate+"T12:00:00"); for(let i=0;i<365;i++){ const iso=d.toISOString().slice(0,10); if(h.history[iso]) streak++; else break; d.setDate(d.getDate()-1); } return streak; }

function renderPrBoard(){
  const gym=getGymPRs()[0]; const one=bestRace(1), five=bestRace(5); const totalKm=state.runs.reduce((a,r)=>a+num(r.distance),0); const totalVol=state.workouts.reduce((a,w)=>a+workoutVolume(w),0);
  const stats=[
    ["Best gym e1RM", gym?`${gym.name}: ${gym.e1rm} kg`:"—"], ["Best 1 km", one?fmtSeconds(one.seconds):"—"], ["Best 5 km", five?fmtSeconds(five.seconds):"—"], ["Total run", `${round(totalKm,1)} km`], ["Gym volume", `${Math.round(totalVol/1000)}k kg`], ["Custom foods", state.foods.length], ["Journal logs", state.journal.length], ["Books logs", state.books.length]
  ];
  $("prBoard").innerHTML=stats.map(s=>`<div class="stat"><span>${s[0]}</span><strong>${s[1]}</strong></div>`).join("");
}
function drawRing(canvas, pct){ const ctx=canvas.getContext("2d"); const w=canvas.width,h=canvas.height,r=62; ctx.clearRect(0,0,w,h); ctx.lineWidth=14; ctx.strokeStyle="rgba(255,255,255,.12)"; ctx.beginPath(); ctx.arc(w/2,h/2,r,0,Math.PI*2); ctx.stroke(); const grad=ctx.createLinearGradient(0,0,w,h); grad.addColorStop(0,"#7c5cff"); grad.addColorStop(1,"#00e0ff"); ctx.strokeStyle=grad; ctx.lineCap="round"; ctx.beginPath(); ctx.arc(w/2,h/2,r,-Math.PI/2,-Math.PI/2+Math.PI*2*(pct/100)); ctx.stroke(); }
function renderCharts(){ drawLineChart($("weightChart"), Object.entries(state.days).sort(([a],[b])=>a.localeCompare(b)).slice(-30).map(([date,d])=>({label:date.slice(5), value:num(d.weight,NaN)})).filter(x=>Number.isFinite(x.value)), "kg"); drawMultiBar($("nutritionChart"), Object.entries(state.days).sort(([a],[b])=>a.localeCompare(b)).slice(-14).map(([date])=>({label:date.slice(5), kcal:dayTotals(date).kcal, protein:dayTotals(date).protein}))); drawLineChart($("runChart"), weeklySeries("run"), "km"); drawLineChart($("gymChart"), weeklySeries("gym"), "kg"); }
function weeklySeries(type){ const res=[]; for(let i=7;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i*7); const {start}=getWeekRange(d); res.push({label:start.toISOString().slice(5,10), value:type==="run"?getWeekRunKm(start):Math.round(getWeekGymVolume(start))}); } return res; }
function clearCanvas(c){ const ctx=c.getContext("2d"); const rect=c.getBoundingClientRect(); const ratio=devicePixelRatio||1; c.width=rect.width*ratio; c.height=Number(c.getAttribute("height"))*ratio; ctx.scale(ratio,ratio); ctx.clearRect(0,0,rect.width,Number(c.getAttribute("height"))); return {ctx,w:rect.width,h:Number(c.getAttribute("height"))}; }
function drawLineChart(canvas,data,suffix){ const {ctx,w,h}=clearCanvas(canvas); if(!data.length){ctx.fillStyle="#8b97ad";ctx.fillText("Zatím málo dat",20,40);return;} const vals=data.map(d=>d.value); const min=Math.min(...vals), max=Math.max(...vals); const pad=34; ctx.strokeStyle="rgba(255,255,255,.12)"; ctx.beginPath(); ctx.moveTo(pad,10); ctx.lineTo(pad,h-pad); ctx.lineTo(w-10,h-pad); ctx.stroke(); const grad=ctx.createLinearGradient(0,0,w,0); grad.addColorStop(0,"#7c5cff"); grad.addColorStop(1,"#00e0ff"); ctx.strokeStyle=grad; ctx.lineWidth=3; ctx.beginPath(); data.forEach((d,i)=>{ const x=pad+(w-pad-18)*(i/(Math.max(1,data.length-1))); const y=(h-pad)-((d.value-min)/(max-min||1))*(h-pad-22); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke(); ctx.fillStyle="#9aa7bd"; ctx.font="11px sans-serif"; data.forEach((d,i)=>{ if(i%Math.ceil(data.length/6)===0) ctx.fillText(d.label, pad+(w-pad-18)*(i/(Math.max(1,data.length-1)))-10,h-10); }); ctx.fillText(`${round(min,1)}${suffix}`,4,h-pad); ctx.fillText(`${round(max,1)}${suffix}`,4,18); }
function drawMultiBar(canvas,data){ const {ctx,w,h}=clearCanvas(canvas); if(!data.length){ctx.fillStyle="#8b97ad";ctx.fillText("Zatím málo dat",20,40);return;} const max=Math.max(...data.map(d=>d.kcal)); const pad=34; const bw=(w-pad-18)/data.length*.55; data.forEach((d,i)=>{ const x=pad+(w-pad-18)*(i/data.length)+bw*.3; const kh=(d.kcal/(max||1))*(h-pad-24); const ph=(d.protein*8/(max||1))*(h-pad-24); const g=ctx.createLinearGradient(0,h-pad-kh,0,h-pad); g.addColorStop(0,"#7c5cff"); g.addColorStop(1,"#00e0ff"); ctx.fillStyle=g; roundRect(ctx,x,h-pad-kh,bw,kh,7); ctx.fill(); ctx.fillStyle="rgba(35,209,139,.75)"; roundRect(ctx,x+bw*.62,h-pad-ph,bw*.32,ph,6); ctx.fill(); }); ctx.fillStyle="#9aa7bd"; ctx.font="11px sans-serif"; ctx.fillText("kcal + protein×8",12,18); }
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

function exportBackup(){ const blob = new Blob([JSON.stringify({encryptedVault: encryptedVaultCache, plaintextWarning:"This export contains encrypted vault, not plaintext."}, null, 2)], {type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`training-arc-backup-${todayIso()}.json`; a.click(); URL.revokeObjectURL(a.href); }
async function importBackup(e){ const file=e.target.files[0]; if(!file) return; const obj=JSON.parse(await file.text()); const vault=obj.encryptedVault || obj; localStorage.setItem(APP_KEY, JSON.stringify(vault)); toast("Backup importnutý. Appka se znovu načte, pak zadej heslo k vaultu."); setTimeout(()=>location.reload(),1000); }
async function changePassword(){ const old=prompt("Staré vault heslo/PIN:"); if(!old) return; try{ await decryptVault(encryptedVaultCache, old); const nw=prompt("Nové vault heslo/PIN min 4 znaky:"); if(!nw||nw.length<4) return toast("Moc krátké."); vaultPassword=nw; await saveVault(); toast("Heslo změněno."); }catch(e){ toast("Staré heslo nesedí."); } }

function initEmailConfigFields(){
  const cfg=JSON.parse(localStorage.getItem(EMAIL_CONFIG_KEY)||"{}");
  if($("reportEmail")) $("reportEmail").value=cfg.email||"";
  if($("emailWebhook")) $("emailWebhook").value=cfg.webhook||"";
}
function saveEmailConfig(){
  const cfg={email:$("reportEmail").value.trim(), webhook:$("emailWebhook").value.trim()};
  localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(cfg));
  renderEmailStatus(); toast("Email config uložený.");
}
function getEmailConfig(){ return JSON.parse(localStorage.getItem(EMAIL_CONFIG_KEY)||"{}"); }
function dailyReportText(){
  const d=ensureDay(); const totals=dayTotals(); const runs=state.runs.filter(r=>r.date===selectedDate); const workouts=state.workouts.filter(w=>w.date===selectedDate);
  return [`Training Arc OS daily report - ${fmtDate(selectedDate)}`,`Arc score: ${$("arcScore")?.textContent || "—"}/100`,`Kcal: ${Math.round(totals.kcal)} / ${state.profile.calorieTarget}`,`Protein: ${Math.round(totals.protein)} g / ${state.profile.proteinTarget} g`,`Weight: ${d.weight || "—"} kg`,`Steps: ${d.steps || 0}`,`Sleep: ${d.sleep || "—"} h`,`Mood: ${d.mood || "—"}/10`,`Runs: ${runs.map(r=>`${r.type} ${r.distance} km ${fmtSeconds(r.seconds)}`).join("; ") || "none"}`,`Workouts: ${workouts.map(w=>`${w.type} (${w.exercises.length} exercises)`).join("; ") || "none"}`,`Notes: ${d.notes || "—"}`,"", "Coach tips:", ...getCoachTips().map(t=>`- ${t}`)].join("\n");
}
function openDailyEmail(){
  const cfg=getEmailConfig(); const to=$("reportEmail").value.trim()||cfg.email||""; const subject=`Training Arc OS report ${selectedDate}`; const body=dailyReportText();
  location.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  $("emailStatus").textContent="Otevřel jsem mail klienta s reportem. Ručně odešli.";
}
async function sendDailyWebhook(){
  const cfg={email:$("reportEmail").value.trim(), webhook:$("emailWebhook").value.trim()}; if(!cfg.webhook) return toast("Vlož webhook/Formspree endpoint.");
  const payload={to:cfg.email, subject:`Training Arc OS report ${selectedDate}`, message:dailyReportText(), date:selectedDate, type:"daily_report"};
  await sendWebhookPayload(cfg.webhook, payload, "Daily report odeslaný webhookem.");
}
async function sendVaultWebhook(){
  const cfg={email:$("reportEmail").value.trim(), webhook:$("emailWebhook").value.trim()}; if(!cfg.webhook) return toast("Vlož webhook/Formspree endpoint.");
  if(!confirm("Opravdu poslat zašifrovaný vault na webhook? Je encrypted, ale pořád je to tvůj backup.")) return;
  await saveVault(false);
  const payload={to:cfg.email, subject:`Training Arc OS encrypted vault ${selectedDate}`, message:"Encrypted vault backup attached as JSON payload.", encryptedVault:encryptedVaultCache, date:selectedDate, type:"encrypted_vault"};
  await sendWebhookPayload(cfg.webhook, payload, "Encrypted vault odeslaný webhookem.");
}
async function sendWebhookPayload(url, payload, okMsg){
  try{
    const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    $("emailStatus").textContent=okMsg; toast(okMsg);
  }catch(e){ $("emailStatus").textContent=`Webhook fail: ${e.message}. Zkus mailto fallback nebo jiný endpoint.`; toast("Webhook se nepovedl."); }
}
function renderEmailStatus(){
  const el=$("emailStatus"); if(!el) return; const cfg=getEmailConfig();
  el.textContent = cfg.email || cfg.webhook ? `Email: ${cfg.email||"—"} • webhook: ${cfg.webhook?"nastaven":"—"}` : "Email není nastavený.";
}

function initCloudConfigFields(){ const cfg=JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY)||localStorage.getItem(LEGACY_CLOUD_CONFIG_KEY)||"{}"); if($("supabaseUrl")){ $("supabaseUrl").value=cfg.url||""; $("supabaseAnon").value=cfg.anon||""; } }
function saveCloudConfig(){ const cfg={url:$("supabaseUrl").value.trim(), anon:$("supabaseAnon").value.trim()}; localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(cfg)); setupSupabase(); toast("Cloud config uložený."); }
function setupSupabase(){ const cfg=JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY)||localStorage.getItem(LEGACY_CLOUD_CONFIG_KEY)||"{}"); if(!cfg.url||!cfg.anon) return null; if(!window.supabase) { $("cloudStatus").textContent="Supabase knihovna není načtená. Připoj internet nebo otevři přes server."; return null; } supabaseClient = window.supabase.createClient(cfg.url, cfg.anon); return supabaseClient; }
async function cloudSignup(){ const sb=setupSupabase(); if(!sb) return toast("Nejdřív vlož Supabase config."); const {error}=await sb.auth.signUp({email:$("cloudEmail").value, password:$("cloudPassword").value}); $("cloudStatus").textContent=error?error.message:"Sign up hotový. Možná potvrď email podle nastavení Supabase."; }
async function cloudSignin(){ const sb=setupSupabase(); if(!sb) return toast("Nejdřív vlož Supabase config."); const {data,error}=await sb.auth.signInWithPassword({email:$("cloudEmail").value, password:$("cloudPassword").value}); $("cloudStatus").textContent=error?error.message:`Přihlášen: ${data.user.email}`; }
async function cloudPush(){ const sb=setupSupabase(); if(!sb) return; await saveVault(false); const {data:{user}}=await sb.auth.getUser(); if(!user) return toast("Nejdřív se přihlas do cloudu."); const {error}=await sb.from("training_arc_vaults").upsert({user_id:user.id, vault:encryptedVaultCache, updated_at:new Date().toISOString()}); $("cloudStatus").textContent=error?error.message:"Cloud push hotový – zašifrovaný vault je online."; }
async function cloudPull(){ const sb=setupSupabase(); if(!sb) return; const {data:{user}}=await sb.auth.getUser(); if(!user) return toast("Nejdřív se přihlas do cloudu."); const {data,error}=await sb.from("training_arc_vaults").select("vault,updated_at").eq("user_id",user.id).single(); if(error) { $("cloudStatus").textContent=error.message; return; } localStorage.setItem(APP_KEY, JSON.stringify(data.vault)); $("cloudStatus").textContent=`Cloud pull hotový (${data.updated_at}). Znovu odemkni vault.`; toast("Staženo z cloudu. Appka se načte znovu."); setTimeout(()=>location.reload(),1200); }
async function cloudSignout(){ const sb=setupSupabase(); if(!sb) return; await sb.auth.signOut(); $("cloudStatus").textContent="Odhlášeno."; }

if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{})); }
init();
