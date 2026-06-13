# Training Arc OS v9 Ulti

Private all-in-one athlete + life operating system. V9 is the big pre-hosting refactor/update.

## What is inside

- `index.html` — app shell and all original modules
- `style.css` — base UI from previous builds
- `app.js` — core local-first app logic
- `css/v9-ulti.css` — V9 premium polish + fixed sidebar/responsive layout
- `js/v9-addon.js` — V9 modules and patch layer
- `data/v9-foods.js` — extra food pack generator
- `data/v9-recipes.js` — extra recipe pack generator
- `manifest.json` + `sw.js` — PWA/cache base
- `supabase.sql` — cloud sync table/RLS setup

## V9 headline changes

### Fixed sidebar

The old left bar was too crowded and broke especially on narrower screens. V9 adds:

- sticky desktop sidebar with real internal scrolling
- nav search with `/` keyboard shortcut
- compact sidebar mode
- mobile drawer with backdrop
- fixed media query conflicts from older versions
- better topbar and module spacing

### New V9 modules

- Coach Hub — readiness, weekly review, red flags, AI prompt copy
- Program Builder — hybrid gym/run training block generator
- Sport Events — races, time trials, school/police tests, benchmarks
- Injury Guard — pain/symptom log and risk rules
- Sleep Lab — sleep logs, caffeine cutoff, recovery advice
- Pantry — stock tracking and grocery draft
- Owner Lab — free/pro/elite architecture and hosting-to-paid checklist

### Expanded data

- Existing V8 data stays included
- V9 adds another generated performance food pack
- V9 adds more recipe/performance templates
- More exercise/run presets are added during migration

## Running locally

Unzip and open:

```txt
index.html
```

For best testing, run a tiny local server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Hosting plan

Recommended cheapest stack:

1. GitHub repo
2. Vercel or Netlify for static hosting
3. Supabase Free for Auth + encrypted vault sync
4. Later: serverless function for Stripe/email/AI endpoint

## Security notes

- Local vault uses browser WebCrypto through the core app.
- Cloud sync is designed to send encrypted vault data.
- Use only Supabase anon/publishable key in the browser.
- Never put Supabase service role key, Stripe secret key, or any private backend secret inside frontend files.

## Version

Branding: **Training Arc OS v9 Ulti**.

Next big milestone can be V10 after hosting/cloud is working on PC + mobile + tablet.
