# Supabase Setup — Training Arc OS v11

1. Create a Supabase project.
2. Open SQL Editor.
3. Paste and run `supabase.sql` from this project.
4. Go to Project Settings → API.
5. Copy Project URL.
6. Copy anon/publishable key.
7. Paste both into the app → Connections.
8. Sign up/sign in with email + password.
9. Push encrypted vault.
10. On phone/tablet, sign in and pull encrypted vault.

## Important

Use anon/publishable key only. Never use service_role in browser code.
RLS policies in `supabase.sql` restrict each vault row to the logged-in user.
