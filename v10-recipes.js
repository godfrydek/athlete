/* Training Arc OS v10 Historic — recipe and meal template expansion. */
window.V10_RECIPE_PACK = function buildV10RecipePack(){
  const bases = [
    ['Chicken rice power bowl','kuřecí prsa, rýže, zelenina, olivový olej','Uvař rýži, opeč maso, přidej zeleninu a dochuť.','post-gym'],
    ['Skyr protein bowl','skyr, vločky, banán, borůvky, whey','Smíchej, nech 5 min odstát, podle potřeby doslaď.','breakfast'],
    ['Tuna pasta cut meal','tuňák, těstoviny, rajčata, salát','Uvař těstoviny, smíchej s tuňákem a zeleninou.','cut'],
    ['Beef potato strength plate','hovězí, brambory, okurka, sůl','Opeč maso, uvař brambory, doplň sůl a zeleninu.','strength'],
    ['Long run carb stack','banán, datle, rice cakes, ionťák','Rozděl do 2–3 mini dávek před/during long run.','run fuel'],
    ['Tvaroh night recovery','tvaroh, ovoce, kakao, med','Smíchej jako večerní high-protein snack.','recovery'],
    ['Budget egg rice','vejce, rýže, mražená zelenina','Rýže + vejce + zelenina, jednoduchý levný meal prep.','budget'],
    ['Kebab style lean bowl','kuřecí, tortilla chips/rýže, zelenina, jogurt dip','Opeč maso, poskládej bowl, přidej jogurt dip.','fastfood alternative'],
    ['Upper day sandwich','chléb, šunka, sýr light, zelenina','Rychlý školní/work meal s proteinem.','school box'],
    ['Deload soup plate','vývar, brambory, zelenina, maso','Lehké jídlo, když nechceš těžký žaludek.','deload']
  ];
  const goals = ['cut','lean bulk','maintenance','race week','long run day','lower day','upper day','school/work','night recovery','low budget','premium','15 min','meal prep 3 days','high protein','high carb','low fat','high fiber','sick easy mode','summer','winter','breakfast','lunch','dinner','snack'];
  const recipes=[]; let id=0;
  for(const [title,ingredients,steps,tag] of bases){
    recipes.push({id:'v10_recipe_'+(id++),title:`${title} · core`,tag,ingredients,steps,source:'v10'});
    goals.forEach((g,gi)=>{
      recipes.push({
        id:'v10_recipe_'+(id++),
        title:`${title} · ${g}`,
        tag:`${tag} ${g}`,
        ingredients:ingredients + (gi%3===0?', extra zelenina':gi%3===1?', extra sacharidy':', extra protein'),
        steps:steps + ' Uprav porci podle dnešního cíle a zapiš přes food kalkulátor.',
        source:'v10 generated template'
      });
    });
  }
  return recipes;
};
