/* Training Arc OS v9 — recipe and protocol data pack. */
window.V9_RECIPE_PACK = function buildV9Recipes(){
  const templates = [
    ['Chicken rice power bowl','🍛',['kuřecí prsa','jasmínová rýže','mražená zelenina','sójová omáčka'],['Uvař rýži.','Orestuj maso na pánvi.','Přidej zeleninu a omáčku.','Zvaž porci a ulož jako meal.'],'post-workout'],
    ['Skyr oats pre-school','🥣',['skyr','ovesné vločky','banán','skořice'],['Smíchej vše do misky.','Nech 5–10 min změknout.','Přidej vodu/mléko podle textury.'],'breakfast'],
    ['Tuna pasta budget bulk','🍝',['těstoviny','tuňák','rajčatová passata','sýr light'],['Uvař těstoviny.','Smíchej passatu s tuňákem.','Přidej sýr a dochuť.'],'budget'],
    ['Long-run carb box','⚡',['banán','rice cakes','gel','ionťák'],['Připrav 30–60 g sacharidů/h.','Vezmi vodu/elektrolyty.','Otestuj v tréninku, ne až v závodě.'],'run fuel'],
    ['Lean burger plate','🍔',['mleté hovězí 5%','brambory','salát','jogurtový dressing'],['Vytvaruj patty.','Upeč brambory.','Přidej salát a light dressing.'],'dinner'],
    ['Cottage protein toast','🥪',['toast','cottage','šunka','rajče'],['Opeč toast.','Přidej cottage a šunku.','Doplň zeleninu.'],'snack'],
    ['Egg rice recovery','🍳',['vejce','rýže','zelenina','sůl'],['Udělej míchaná vejce.','Přidej rýži a zeleninu.','Doplň sůl po běhu/potu.'],'recovery'],
    ['Tvaroh night protein','🌙',['tvaroh','whey','borůvky','trocha medu'],['Smíchej tvaroh s whey.','Přidej ovoce.','Dej před spaním podle kalorií.'],'night']
  ];
  const goals=['cut','bulk','maintain','race week','school','work shift','cheap','premium','fast','meal prep','high protein','high carb','low fat','recovery','pre-run','post-run'];
  const recipes=[]; let id=0;
  templates.forEach(t=>{
    recipes.push({id:'v9_recipe_core_'+(id++),title:t[0],emoji:t[1],ingredients:t[2],steps:t[3],tag:t[4],source:'v9'});
    goals.forEach(g=>recipes.push({id:'v9_recipe_'+(id++),title:`${t[0]} · ${g}`,emoji:t[1],ingredients:[...t[2],g.includes('high carb')?'extra rýže':'',g.includes('high protein')?'extra protein':''].filter(Boolean),steps:[...t[3],`Varianta: ${g}. Uprav porci podle kcal cíle.`],tag:`${t[4]} ${g}`,source:'v9 generated'}));
  });
  return recipes;
};
