# Training Arc OS v10 Historic

Private all-in-one athlete + life operating system. V10 is the historic milestone build: secure vault, cloud-ready sync, training/nutrition/recovery/life modules, AI Coach Studio, launch docs and future monetization architecture.

## Run locally

Open `index.html` in your browser. Create a vault passphrase and use the app offline.

## What is new in V10

- V10 Launchpad with daily command, release scorecard and project health.
- AI Coach Studio for safe prompts you can paste into ChatGPT without dumping your full vault.
- Season Roadmap for 2–24 week hybrid athlete blocks.
- Exercise Library with personal cues, search and progression generator.
- Coach Share for privacy-safe weekly summaries.
- Data Doctor for diagnostics, backup strategy and migration readiness.
- Template Market for future Free/Pro/Elite content packs.
- Launch HQ for hosting, cloud, payments, email and beta checklist.
- V10 data packs: food atlas, recipes, exercise/protocol library and quote pack.
- Project split into more folders: `css/`, `js/`, `data/`, `docs/`, `api/`, `assets/`.

## Recommended hosting path

1. Upload the full `training_arc_os_v10` folder to a GitHub repo.
2. Deploy to Vercel, Netlify or GitHub Pages.
3. Create a Supabase project.
4. Run `supabase.sql` in Supabase SQL editor.
5. In the app, open Connections and paste Supabase Project URL + anon/public key.
6. Create a cloud account, push encrypted vault on PC, then pull it on mobile/tablet.

## Security rules

- The vault is designed local-first and encrypted before cloud sync.
- Only use Supabase anon/publishable key in the browser.
- Never put Supabase `service_role`, Stripe secret key, email API secret or AI API key into frontend files.
- Real email reports, Stripe/Paddle checkout and AI endpoints belong in serverless/backend functions.

## Notes

Nutrition presets are rough estimates. Food labels, weighing and your own custom entries win.
This app is for personal tracking and planning, not medical diagnosis.

## V10 hard refresh after deploy

Pokud browser po deployi pořád ukazuje staré `v7/v8/v9`, je to skoro určitě stará PWA/service-worker cache. Otevři jednou appku s parametrem:

```text
https://tvoje-url.cz/athlete/?v10=force
```

Nebo v lock screenu klikni **Force V10 refresh**. Tento build má network-first HTML service worker a maže staré `training-arc-os-*` cache.
