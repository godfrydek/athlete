/* Training Arc OS v9 — extra food data pack.
   Values are rough per-100g estimates. Food labels and your own weighing win. */
window.V9_FOOD_PACK = function buildV9FoodPack(){
  const core = [
    ['Kuřecí prsa raw',110,23,0,2,'protein raw','🍗'],['Kuřecí prsa cooked',165,31,0,4,'protein cooked','🍗'],['Kuřecí stehna bez kůže',185,24,0,9,'protein','🍗'],['Krůtí prsa',112,24,0,1,'protein','🦃'],['Hovězí zadní',160,22,0,7,'protein','🥩'],['Mleté hovězí 5%',137,21,0,5,'protein','🥩'],['Mleté hovězí 10%',176,20,0,10,'protein','🥩'],['Vepřová panenka',143,22,0,5,'protein','🥩'],['Šunka kuřecí',105,18,2,3,'protein deli','🥓'],['Šunka vepřová',145,19,1,6,'protein deli','🥓'],
    ['Losos',208,20,0,13,'fish','🐟'],['Tuňák ve vlastní šťávě',116,26,0,1,'fish','🐟'],['Tuňák v oleji',190,24,0,9,'fish','🐟'],['Treska',82,18,0,1,'fish','🐟'],['Sardinky',208,25,0,11,'fish','🐟'],['Krevety',99,24,0,0,'fish','🦐'],
    ['Vejce celé',143,13,1,10,'egg','🥚'],['Vaječné bílky',52,11,1,0,'egg','🥚'],['Tvaroh odtučněný',67,12,4,0,'dairy','🥛'],['Tvaroh polotučný',105,12,4,4,'dairy','🥛'],['Skyr bílý',63,11,4,0,'dairy','🥛'],['Řecký jogurt 0%',59,10,4,0,'dairy','🥛'],['Cottage',98,12,3,4,'dairy','🧀'],['Mozzarella light',160,20,2,8,'dairy','🧀'],['Eidam 30%',263,27,2,16,'dairy','🧀'],
    ['Rýže jasmínová vařená',130,3,28,0,'carbs cooked','🍚'],['Rýže basmati vařená',121,3,25,0,'carbs cooked','🍚'],['Těstoviny vařené',155,6,31,1,'carbs cooked','🍝'],['Brambory vařené',77,2,17,0,'carbs cooked','🥔'],['Batáty pečené',105,2,21,2,'carbs cooked','🍠'],['Ovesné vločky',370,13,60,7,'carbs dry','🥣'],['Celozrnný chléb',247,9,41,4,'carbs bread','🍞'],['Rohlík',286,8,56,4,'carbs bread','🥖'],['Tortilla pšeničná',310,8,52,8,'carbs bread','🌯'],['Kuskus vařený',112,4,23,0,'carbs cooked','🍛'],['Bulgur vařený',83,3,19,0,'carbs cooked','🍛'],
    ['Banán',89,1,23,0,'fruit','🍌'],['Jablko',52,0,14,0,'fruit','🍎'],['Pomeranč',47,1,12,0,'fruit','🍊'],['Borůvky',57,1,14,0,'fruit','🫐'],['Jahody',32,1,8,0,'fruit','🍓'],['Hrozny',69,1,18,0,'fruit','🍇'],['Datle',282,2,75,0,'run fuel','🌴'],
    ['Brokolice',34,3,7,0,'veg','🥦'],['Mrkev',41,1,10,0,'veg','🥕'],['Okurka',16,1,4,0,'veg','🥒'],['Rajče',18,1,4,0,'veg','🍅'],['Paprika',31,1,6,0,'veg','🫑'],['Mražená zelenina mix',45,3,8,0,'veg','🥦'],['Salát mix',18,1,3,0,'veg','🥗'],['Cibule',40,1,9,0,'veg','🧅'],
    ['Olivový olej',884,0,0,100,'fat','🫒'],['Arašídové máslo',588,25,20,50,'fat','🥜'],['Mandle',579,21,22,50,'fat','🥜'],['Kešu',553,18,30,44,'fat','🥜'],['Avokádo',160,2,9,15,'fat','🥑'],
    ['Whey concentrate',400,76,8,6,'supplement','🥤'],['Whey isolate',370,84,4,2,'supplement','🥤'],['Protein tyčinka',365,32,35,10,'snack','🍫'],['Gel 25g sacharidů',100,0,25,0,'run fuel','⚡'],['Iontový nápoj',24,0,6,0,'run fuel','🥤'],['Rice cakes',387,8,82,3,'run fuel','🍘'],
    ['Svíčková odhad',150,8,18,6,'czech estimate','🍽️'],['Guláš odhad',180,12,12,10,'czech estimate','🍲'],['Rizoto školní',145,8,23,3,'czech estimate','🍚'],['Rajská s hovězím',145,10,15,5,'czech estimate','🍅'],['Koprovka s vejcem',135,8,13,6,'czech estimate','🍲'],['Špagety bolognese',175,11,24,6,'meal','🍝'],['Pizza slice šunka',260,13,31,9,'fastfood estimate','🍕'],['Kebab bowl',185,18,18,6,'fastfood estimate','🥙'],['Burger lean',220,18,22,7,'fastfood estimate','🍔'],['Sushi losos',155,7,25,3,'fastfood estimate','🍣']
  ];
  const variants = ['classic','cut','bulk','lean','extra protein','low fat','high carb','pre-run','post-run','post-workout','school box','work shift','meal prep','budget','premium','fast','airfryer','home','restaurant estimate','large portion','small portion','summer','winter','race week','deload','upper day','lower day','long run day','rest day','night','spicy','sweet','salty','with veg','with rice','with potatoes','wrap','bowl','sandwich','snack','breakfast','dinner','recovery','high fiber','low fiber','low salt','electrolytes'];
  const pack=[]; let id=0;
  core.forEach(([name,kcal,p,c,f,cat,emoji])=>{
    pack.push({id:'v9_core_'+(id++),name,kcal,protein:p,carbs:c,fat:f,grams:100,category:cat,emoji,preset:true,source:'v9'});
    variants.forEach((v,vi)=>{
      const kcal2=Math.max(0,Math.round(kcal*(0.82+(vi%9)*0.045)));
      const p2=Math.max(0,Math.round(p*(0.9+(vi%5)*0.05)));
      const c2=Math.max(0,Math.round(c*(0.86+(vi%7)*0.04)));
      const f2=Math.max(0,Math.round(f*(0.82+(vi%6)*0.045)));
      pack.push({id:'v9_food_'+(id++),name:`${name} · ${v}`,kcal:kcal2,protein:p2,carbs:c2,fat:f2,grams:100,category:`${cat} ${v}`,emoji,preset:true,source:'v9 generated'});
    });
  });
  return pack;
};
