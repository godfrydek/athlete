# Training Arc OS v11 BarFix

Private all-in-one athlete + life operating system. This is the V11 clean deploy build with an extra hard sidebar/mobile navigation fix.

## What this patch fixes

- Left sidebar is now a stable sticky desktop nav with internal scroll.
- The old mobile drawer conflicts are overridden.
- Mobile/tablet gets a clean top bar + bottom quick nav.
- Sidebar closes correctly after clicking a module.
- Root `/athlete/` still uses the V11 service-worker cache reset strategy.
- Cache query bumped to `v=11.1.0`.

## Deploy

Upload the full ZIP content to the GitHub Pages repo/path used for `/athlete/`. Commit at least:

- `index.html`
- `sw.js`
- `manifest.json`
- `css/v11-barfix.css`
- `js/v11-barfix.js`
- all existing `css/`, `js/`, `data/` files

Then open:

```text
https://godfrydek.github.io/athlete/
```

If your browser still shows a stale build one time, reload once. The service worker deletes old `training-arc-os-*` caches and serves HTML network-first.

## Security

The vault stays local-first and encrypted. For cloud sync, use only Supabase anon/publishable key in the browser. Never put service-role or payment/email/AI secret keys into frontend files.
