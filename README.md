# Training Arc OS v5 Supreme

Soukromá all-in-one web appka pro fitness + life tracking. Funguje jako obyčejný statický web: otevři `index.html`, nastav vault heslo a jedeš.

## Co je ve v5 nové

- Premium redesign: lepší dashboard, glass UI, Command palette, responsive mobile/tablet/PC layout.
- Secure vault: WebCrypto AES-GCM + PBKDF2, lokální data nejsou v localStorage čitelná jako plain text.
- Supabase cloud sync: login přes email/password a push/pull šifrovaného vaultu mezi mobilem, tabletem a PC.
- 1000+ food presetů generovaných z kategorií jídel + variant. Ber jako orientační databázi, etiketa má vždy přednost.
- Food calculator: údaje na 100 g → vlastní porce, custom food databáze, fotky jídel, meal builder.
- Gym: presety podle tebe, weighted/explosive kliky, pull-ups, dips, rows, legs, import z Lyfto/CSV/JSON/TXT.
- Běh: typy běhů, run log, weekly km, PR estimates, pace.
- Kalkulačky: e1RM/RIR, VO2max estimate, BMI/TDEE, pace/race predictor, makra, long-run fuel.
- Life OS: deník, mood, habits/streak, chorey/tasky, knihy/reading arc.
- Email/webhook reports: daily report přes mailto, webhook backup/report, encrypted vault export.
- PWA základ: `manifest.json` + `sw.js`.

## Rychlé spuštění

1. Rozbal ZIP.
2. Otevři `index.html` v prohlížeči.
3. Nastav vault heslo / PIN. Doporučení: raději věta než 4 čísla.
4. Začni logovat.

Pro mobil/tablet/PC sync je nejlepší to hodit na GitHub Pages, Netlify nebo Vercel a nastavit Supabase níže.

## Supabase cloud sync

V5 ukládá do cloudu jen šifrovaný vault. Supabase neuvidí tvoje jídla, deník ani tréninky v plain textu, pokud je sám nevyexportuješ jako plain JSON.

### 1. Vytvoř Supabase projekt

- V Supabase vytvoř nový projekt.
- Zapni Auth → Email provider.
- Vezmi Project URL a anon/publishable key.

### 2. Spusť SQL

V Supabase SQL editoru spusť obsah souboru `supabase.sql`.

Tabulka:

```sql
public.training_arc_vaults
```

RLS policies dovolí číst/zapisovat jen řádek, kde `auth.uid() = user_id`.

### 3. Nastav v appce

V appce otevři **Connection Hub**:

- vlož Supabase URL
- vlož anon/publishable key
- zadej email + cloud password
- Sign up / Sign in
- Push vault

Na druhém zařízení:

- otevři hosted appku
- vytvoř/odemkni vault stejným vault heslem
- Sign in
- Pull vault

## Security poznámky

- Vault heslo je klíč k dešifrování. Když ho zapomeneš, data nejdou obnovit.
- Pro cloud nepoužívej service_role key v prohlížeči. Používej jen anon/publishable key a RLS.
- Plain export používej jen pro debug, ne jako běžný backup.
- Email backup raději posílej encrypted vault, ne plain JSON.
- Obrázky jídel se komprimují a ukládají do vaultu jako base64; hodně fotek zvětší localStorage/cloud payload.

## Email/webhook

Bez backendu nejde přímo a bezpečně posílat email z čistého HTML. V5 proto nabízí:

- `mailto:` daily report — otevře email klienta s hotovým textem.
- Webhook URL — použij Formspree, Make, n8n, Zapier nebo vlastní endpoint.
- Encrypted vault webhook — pošle JSON se šifrovaným vaultem.

## Import Lyfto/workout historie

V sekci Gym nahraj CSV/JSON/TXT/TSV. Appka zkusí vytáhnout názvy cviků a přidat je do presetů.

Pro nejlepší presety mi klidně pošli export sem do chatu a já ti vytvořím přesnější `exercisePresets` podle reálné historie.

## Limitace v5

- Food presety jsou orientační, ne certifikovaná databáze potravin.
- Cloud konflikty zatím řeší ručně přes Push/Pull, ne automatický merge.
- AI coach je pravidlový, ne skutečný online AI model.
- Supabase CDN musí být dostupné pro cloud funkce. Offline appka bez cloudu funguje dál.

## Doporučený další v6 směr

- Full hosted deployment na Vercel/Netlify.
- Automatický conflict-safe sync.
- Supabase Storage pro fotky jídel.
- Reálná AI přes serverless endpoint.
- OCR etikety jídla z fotky.
- Strava/Google Fit import, pokud se rozhodneš pro API napojení.
