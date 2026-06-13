# Training Arc OS v6 Titan

Private local-first all-in-one web appka pro training arc: nutrition, gym, běh, recepty, planner, recovery, future-self, deník, grafy, cloud sync a secure vault.

## Co je nové ve v6

- Recipes sekce: preset recepty, custom recepty, ingredience, postup, přidání receptu do dne nebo meal builderu.
- Větší food databáze: 2000+ orientačních food presetů. Etiketa obalu má vždy přednost.
- Planner / timeable events: eventy s časem, typem, poznámkou, done stavem, quick plan dne a export do `.ics` pro kalendář.
- MyFutureSelf: dopisy do budoucna, goals/milestones, identity stack.
- Recovery: stretching/mobility routines pro běh, upper, lower, calisthenics, sleep a desk reset + stretch log.
- Vylepšené UI cards pro nové sekce.
- Zachovaný v5 secure vault, Supabase cloud sync, email/webhook backup, PWA základ.

## Spuštění

Rozbal ZIP a otevři `index.html` v prohlížeči. Pro nejlepší cloud/PWA používání nahraj složku na GitHub Pages, Netlify nebo Vercel.

## Security model

- Lokální vault je šifrovaný přes WebCrypto AES-GCM.
- Heslo/PIN se nepřenáší do cloudu.
- Supabase sync posílá jen encrypted vault blob.
- Do browseru patří pouze Supabase anon/publishable key, nikdy service_role key.
- Plain JSON export používej jen pro debug, protože není šifrovaný.

## Cloud sync

1. Vytvoř Supabase projekt.
2. Spusť `supabase.sql` v SQL editoru.
3. Nahraj appku na hosting.
4. V Connection Hubu zadej Supabase URL + anon/publishable key.
5. Udělej sign up / sign in.
6. Push vault z jednoho zařízení, pull vault na druhém.

## Event reminders

Static web app neumí garantovat background připomínky, když je zavřená. Proto v6 přidává:

- Browser notification permission pro otevřenou appku.
- `.ics` export, který si můžeš importovat do Google/Apple kalendáře.
- Webhook/email backup z Connection Hubu.

## Poznámka k jídlu

Food databáze a recepty jsou orientační pro rychlé logování. U balených potravin používej hodnoty z etikety.


## v7 patch — Versions / Updates page

Pomyslná verze pořád zůstává **v7 Lucky Number**. Tento patch jen přidává podstránku **Versions / Updates**, quick changelog export/copy, lepší topbar názvy nových modulů a rychlé odkazy na Hosting Lab / Connection Hub.

Další krok: hosting přes GitHub + Vercel/Netlify + Supabase Free.
