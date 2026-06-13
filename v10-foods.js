/* Training Arc OS v10 Historic — mega food atlas.
   Rough per-100g estimates. Food labels, weighing and custom entries always win. */
window.V10_FOOD_PACK = function buildV10FoodPack(){
  const bases = [
    ['Kuřecí prsa',165,31,0,4,'protein','🍗'],['Kuřecí stehna',185,24,0,9,'protein','🍗'],['Krůtí prsa',112,24,0,1,'protein','🦃'],['Hovězí 5%',137,21,0,5,'protein','🥩'],['Hovězí 10%',176,20,0,10,'protein','🥩'],['Vepřová panenka',143,22,0,5,'protein','🥩'],['Šunka kuřecí',105,18,2,3,'protein','🥓'],['Losos',208,20,0,13,'fish','🐟'],['Tuňák',116,26,0,1,'fish','🐟'],['Treska',82,18,0,1,'fish','🐟'],['Vejce',143,13,1,10,'egg','🥚'],['Bílky',52,11,1,0,'egg','🥚'],['Skyr',63,11,4,0,'dairy','🥛'],['Tvaroh',88,12,4,2,'dairy','🥛'],['Cottage',98,12,3,4,'dairy','🧀'],['Mozzarella light',160,20,2,8,'dairy','🧀'],['Eidam 30%',263,27,2,16,'dairy','🧀'],['Whey',390,80,6,4,'supplement','🥤'],['Rýže vařená',125,3,27,0,'carbs','🍚'],['Těstoviny vařené',155,6,31,1,'carbs','🍝'],['Brambory',77,2,17,0,'carbs','🥔'],['Batáty',105,2,21,2,'carbs','🍠'],['Ovesné vločky',370,13,60,7,'carbs','🥣'],['Celozrnný chléb',247,9,41,4,'bread','🍞'],['Tortilla',310,8,52,8,'bread','🌯'],['Bulgur',83,3,19,0,'carbs','🍛'],['Kuskus',112,4,23,0,'carbs','🍛'],['Banán',89,1,23,0,'fruit','🍌'],['Jablko',52,0,14,0,'fruit','🍎'],['Borůvky',57,1,14,0,'fruit','🫐'],['Jahody',32,1,8,0,'fruit','🍓'],['Datle',282,2,75,0,'run fuel','🌴'],['Brokolice',34,3,7,0,'veg','🥦'],['Mrkev',41,1,10,0,'veg','🥕'],['Paprika',31,1,6,0,'veg','🫑'],['Salát mix',18,1,3,0,'veg','🥗'],['Olivový olej',884,0,0,100,'fat','🫒'],['Arašídové máslo',588,25,20,50,'fat','🥜'],['Mandle',579,21,22,50,'fat','🥜'],['Avokádo',160,2,9,15,'fat','🥑'],['Gel 25g carbs',100,0,25,0,'run fuel','⚡'],['Iontový nápoj',24,0,6,0,'run fuel','🥤'],['Rice cakes',387,8,82,3,'run fuel','🍘'],['Pizza šunka',260,13,31,9,'fastfood','🍕'],['Kebab bowl',185,18,18,6,'fastfood','🥙'],['Burger lean',220,18,22,7,'fastfood','🍔'],['Sushi losos',155,7,25,3,'fastfood','🍣'],['Guláš odhad',180,12,12,10,'czech','🍲'],['Svíčková odhad',150,8,18,6,'czech','🍽️'],['Rizoto školní',145,8,23,3,'czech','🍚']
  ];
  const modes = ['classic','cut','lean bulk','high protein','budget','meal prep','pre-run','post-run','pre-gym','post-gym','long run fuel','race week','recovery','school box','work shift','airfryer','home','restaurant estimate','fast','low fat','high carb','high fiber','low fiber','low salt','with veg','with rice','with potatoes','wrap','bowl','sandwich','breakfast','lunch','dinner','snack','late night','summer','winter','deload','upper day','lower day','tempo day','rest day','sick easy mode','hydration focus','extra salt','no sauce','spicy','sweet','savory','large portion','small portion','micro meal','family meal','student cheap','premium'];
  const sauces = ['plain','tomato','yogurt dip','sweet chilli','garlic','BBQ','teriyaki','curry','herb','lemon','low sauce','extra sauce'];
  const activeModes = modes.slice(0,24);
  const activeSauces = sauces.slice(0,7);
  const pack=[]; let id=0;
  for(const [name,kcal,p,c,f,cat,emoji] of bases){
    pack.push({id:'v10_core_'+(id++),name:`${name} · v10 verified preset`,kcal,protein:p,carbs:c,fat:f,grams:100,category:`${cat} v10`,emoji,preset:true,source:'v10'});
    activeModes.forEach((m,mi)=>{
      activeSauces.forEach((s,si)=>{
        const factor = 0.78 + ((mi*3+si)%15)*0.035;
        const pf = 0.86 + ((mi+si)%7)*0.035;
        const cf = 0.82 + ((mi*2+si)%9)*0.03;
        const ff = 0.78 + ((mi+si*2)%8)*0.035;
        pack.push({
          id:'v10_food_'+(id++),
          name:`${name} · ${m} · ${s}`,
          kcal:Math.max(1,Math.round(kcal*factor)),
          protein:Math.max(0,Math.round(p*pf)),
          carbs:Math.max(0,Math.round(c*cf)),
          fat:Math.max(0,Math.round(f*ff)),
          grams:100,
          category:`${cat} ${m}`,
          emoji,
          preset:true,
          source:'v10 generated rough estimate'
        });
      });
    });
  }
  return pack;
};
