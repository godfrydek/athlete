# Training Arc OS v3 PREMIUM

Private all-in-one tracker pro fitness + life: kalorie, custom jídla, gym, běh, kalkulačky, deník, knihy, habits, chorey, grafy, AI-style tipy a secure cloud sync.

## Rychlé spuštění

1. Rozbal ZIP.
2. Otevři `index.html` v prohlížeči.
3. Nastav si vault PIN/heslo.
4. Začni zapisovat data.

Appka funguje local-first: bez serveru, bez registrace, bez předplatného.

## Co je nové ve v3

### Food / kalorie
- kalkulátor jídla z údajů na 100 g a gramáže porce
- výpočet kcal, proteinů, sacharidů a tuků pro konkrétní porci
- ukládání custom jídel
- rychlé přidání uloženého jídla do dne
- denní food log + celkové makro součty

### Gym
- workout log podle cviků, sérií, reps, kg a RIR
- auto volume
- PR / e1RM board
- next-lift tipy
- rychlé presety podle tebe:
  - strict push-ups
  - weighted push-ups +10 kg
  - weighted push-ups +20 kg
  - push-up AMRAP
  - explosive push-ups
  - deficit push-ups
  - explosive pull-ups
  - explosive dips
  - weighted dips +20 kg
  - incline bench
  - MAG lat pulldown
  - V-bar row
  - DB RDL
  - leg press
  - leg extension/curl
  - calves
  - hyperextensions

### Běh
- typy běhů:
  - Easy / Zone 2
  - Tempo
  - Intervals
  - 900 m easy + 100 m sprint
  - Long run
  - Progression
  - Recovery jog
  - Hills
  - Race / Time trial
  - Treadmill incline
- pace auto výpočet
- weekly km target
- PR pro 1 km / 5 km / 6 km podle logů

### Kalkulačky
- 1RM Epley
- 1RM Brzycki
- RPE-adjusted estimated 1RM
- VO2max Cooper test
- VO2max z race odhadu
- BMI
- BMR/TDEE
- pace converter
- race predictor
- macro calculator

### Life OS
- deník
- nálada / energie
- chorey / tasky
- habits + streak
- čtení knih, strany, progress, poznámky

### Secure + cloud
- lokální data jsou šifrovaná přes WebCrypto AES-GCM
- klíč se odvozuje z tvého PINu/hesla přes PBKDF2
- export/import backupu
- cloud-ready Supabase sync
- do cloudu se posílá jen zašifrovaný vault

## Secure poznámka

PIN/heslo si zapamatuj. Bez něj vault nejde dešifrovat. Reset smaže lokální data.

Pro lepší bezpečnost použij delší heslo než jen 4 čísla, třeba `fryk-arc-2026` nebo něco podobného.

## Multi-device sync přes Supabase

Toto je volitelné. Bez Supabase appka funguje lokálně.

### 1. Vytvoř Supabase projekt

Na Supabase vytvoř nový projekt. V nastavení projektu najdi:
- Project URL
- anon public key

Tyto hodnoty vlož v appce do `Sync & secure`.

### 2. V Supabase spusť SQL

V SQL editoru spusť:

```sql
create table if not exists public.training_arc_vaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  vault jsonb not null,
  updated_at timestamptz default now()
);

alter table public.training_arc_vaults enable row level security;

create policy "Users can read own vault"
on public.training_arc_vaults for select
using (auth.uid() = user_id);

create policy "Users can upsert own vault"
on public.training_arc_vaults for insert
with check (auth.uid() = user_id);

create policy "Users can update own vault"
on public.training_arc_vaults for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### 3. Přihlášení na zařízeních

Na PC:
1. otevři appku
2. odemkni vault
3. vlož Supabase URL + anon key
4. sign up / sign in
5. klikni `Push vault`

Na mobilu/tabletu:
1. otevři stejnou appku
2. vlož Supabase URL + anon key
3. sign in stejným e-mailem
4. klikni `Pull vault`
5. znovu odemkni stejným vault PINem/heslem

## Doporučené použití

- Každý den: rychlý log váhy, kcal, proteinu, kroků, spánku, nálady.
- U jídla: ukládej custom potraviny podle etiket, pak je přidávej jedním klikem.
- Gym: loguj top série a hlavní cviky; appka dopočítá volume/e1RM.
- Běh: zapisuj typ běhu, km, čas, tep/RPE a poznámky k podmínkám.
- Jednou týdně: koukni na grafy, PR board a AI coach tipy.

## Hosting jako appka

Pro PWA instalaci na mobil je nejlepší to hodit na:
- GitHub Pages
- Netlify
- Vercel
- vlastní webhosting

Pak půjde stránka připnout na plochu jako appka.
