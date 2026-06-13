# Training Arc OS v8 Fire

Private local-first all-in-one athlete web appka pro training arc: nutrition, gym, běh, recepty, planner, recovery, motivation, performance lab, athlete toolkit, paid-version planning, cloud sync a secure vault.

## Co je nové ve v8 Fire

- **Performance Lab**
  - readiness score podle spánku, mood, energie, soreness a tréninkové zátěže
  - weekly periodization generator podle cíle
  - race/event checklist
  - hybrid interference advisor pro gym × běh
  - pre-session intention log

- **Motivation Vault**
  - random quote engine
  - vlastní citáty
  - identity rules
  - discipline contracts
  - bad-day protocol

- **Athlete Toolkit**
  - protocol generator: calves/shins, sore upper, low sleep, cold/easy mode, pre-race, post-long-run
  - skill progressions: clean muscle-up, 50+ push-ups, 10 km sub 60, 1 km sub 3:30, pull-up power, running base
  - gear/supplement inventory
  - sport checklist templates

- **Plans & Monetization Lab**
  - Free / Pro Athlete / Elite OS plan architecture
  - pricing plan notes
  - Stripe/serverless rollout checklist
  - local plan simulation
  - reálné platby nejsou v čistém frontend buildu aktivní; musí se řešit přes backend/serverless kvůli secret keys

- **Nutrition expansion**
  - v8 food expansion navazuje na v7, cílí na cca 9000+ orientačních presetů podle migrace a de-dupu
  - 300+ generovaných recipe/performance templates
  - pořád platí: etiketa obalu a vlastní vážení mají přednost

- **Zachováno z v7**
  - secure AES-GCM vault
  - Supabase cloud sync
  - email/webhook backup
  - recipes, weekly meal planner, grocery list, spending tracker
  - planner/timeable, Future Self, recovery routines
  - body vault, progress photos, quests, achievements
  - versions/updates stránka
  - PWA základ

## Spuštění

Rozbal ZIP a otevři `index.html` v prohlížeči.

Pro nejlepší používání na PC/mobilu/tabletu nahraj složku na GitHub Pages, Netlify nebo Vercel a zapni Supabase sync.

## Security model

- Lokální vault je šifrovaný přes WebCrypto AES-GCM.
- Vault heslo/PIN se neposílá do cloudu.
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

## Paid versions later

V8 obsahuje **Plans & Monetization Lab**, ale skutečné platby je potřeba udělat až po hostingu přes bezpečný backend/serverless:

- Stripe/Paddle Checkout endpoint
- webhook, který ověří payment
- uložení planu k userovi v Supabase
- feature gates podle server-trusted planu
- nikdy nedávat Stripe secret key do browseru

## Event reminders

Static web app neumí garantovat background připomínky, když je zavřená. Appka má `.ics` export a browser notifications pro otevřenou appku; reálné push notifikace později potřebují server/service worker push setup.

## Poznámka k jídlu a coach tipům

Food databáze, recepty, readiness a coach tipy jsou orientační nástroje pro vlastní deník. U potravin používej hodnoty z etikety. U zdravotních problémů, bolesti, nemoci, trombózy apod. řeš rozhodnutí s lékařem.
