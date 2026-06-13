# Hosting Guide — Training Arc OS v11

## Cheapest setup

- Frontend: Vercel Free / Netlify Free / GitHub Pages
- Backend: Supabase Free
- Cost to start: 0 Kč/month

## Folder to upload

Upload the entire `training_arc_os_v11` folder contents. Keep relative paths unchanged.

## Vercel quick path

1. Create GitHub repo.
2. Upload all files.
3. Vercel → New Project → Import repo.
4. Framework preset: Other / Static.
5. Build command: empty.
6. Output directory: empty or root.
7. Deploy.

## Netlify quick path

1. Drag/drop folder or connect GitHub repo.
2. Publish directory: root.
3. Build command: empty.
4. Deploy.

## After deploy

- Test desktop/mobile/tablet.
- Open devtools console; check no JS errors.
- Create encrypted backup.
- Configure Supabase sync.
- Test PWA install.
