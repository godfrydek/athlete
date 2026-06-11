# Training Arc OS

Soukromá all-in-one fitness web appka: deník, kalorie, gym workouts, běh, grafy, staty a jednoduché AI tipy.

## Jak spustit

1. Rozbal ZIP.
2. Otevři `index.html` v prohlížeči.
3. Nastav PIN nebo používej bez PINu.
4. Pro denní používání si stránku připni na plochu / mobil jako PWA.

## Co funguje ve verzi 1

- PIN lock přes hash v prohlížeči.
- Data se ukládají lokálně do `localStorage`.
- Dashboard s daily score.
- Rychlý zápis váhy, kcal, proteinu a kroků.
- Kalorie, makra, voda, poznámky.
- Editovatelné cíle kcal/protein/carbs/fat.
- Gym log: workout, cvik, série, reps, váha, RIR, poznámka.
- Running log: typ běhu, km, čas, tep, RPE, elevation.
- PR board pro 1 km, 5 km, 10 km odhad a longest run.
- Grafy váhy, kcal, běhu a gym volume.
- Export/import JSON zálohy.
- Demo data tlačítko.

## Secure poznámka

PIN chrání appku proti náhodnému otevření v jednom prohlížeči. Data nejsou šifrovaná. Na osobní použití je to v pohodě, ale není to bankovní security.

## Další možný update

- Food databáze a oblíbená jídla.
- Workout templates.
- Editace existujících zápisů.
- Lepší weekly analytics.
- Cloud sync přes Supabase.
- Skutečný AI coach přes API.
