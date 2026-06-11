# Training Arc OS v4 ALL-IN-ONE

Private all-in-one tracker pro training arc: kalorie, custom jídla s obrázky, gym, běh, kalkulačky, deník, knihy, habits, chorey, grafy, AI-style tipy, secure vault, cloud sync a email reporty/backupy.

## Rychlé spuštění

1. Rozbal ZIP.
2. Otevři `index.html` v prohlížeči.
3. Nastav vault PIN/heslo.
4. Začni zapisovat data.

Appka je local-first: bez serveru, bez registrace, bez předplatného. Pro sync mezi mobilem/tabletem/PC použij Supabase sekci v appce.

## Nové ve v4

### Food databáze + obrázky
- mnohem víc základních food presetů: kuře, rýže, skyr, tvaroh, vejce, vločky, ovoce, zelenina, oleje, snacky, běžecký gel, recovery shake atd.
- kalkulátor: kcal/makra na 100 g → tvoje gramáž → porce
- custom jídla s tagy, emoji ikonou a obrázkem
- možnost vyplnit uložené jídlo zpět do kalkulátoru
- rychlé přidání jídla do dne

Poznámka: obrázky se ukládají do šifrovaného vaultu. Dávej radši menší fotky, protože velké obrázky zvětšují backup i cloud sync.

### Gym upgrade
- rozšířené presety cviků: kliky, weighted push-ups +10/+20 kg, explosive push-ups, dips, pull-ups, muscle-up technique, incline bench, MAG pulldown, V-bar row, delts, arms, legs, core atd.
- vlastní custom cvik/preset přímo z appky
- import workout historie z CSV/JSON/TXT: appka zkusí najít názvy cviků a přidat je jako presety
- PR/e1RM board + next-lift tipy

Když mi nahraješ export z Lyftu sem do chatu, můžu podle skutečného formátu doladit parser a doplnit ti přesné presety podle historie.

### Běh upgrade
- typy běhů: Easy/Zone 2, Recovery jog, Steady, Tempo, Threshold intervals, VO2max intervals, 900 easy + 100 sprint, Strides, Long run, Progression, Fartlek, Hills, Race/Time trial, Treadmill incline, Brick/gym+run
- auto pace
- weekly km target
- PR pro 1 km / 5 km / 6 km podle logů

### Email reporty / backup
Statický HTML soubor nemůže sám odesílat email bez externí služby. Ve v4 jsou proto tři režimy:

1. **Mailto fallback** – otevře email klienta s hotovým daily reportem, ručně odešleš.
2. **Webhook/Formspree** – vložíš endpoint a appka pošle daily report přes POST request.
3. **Encrypted vault webhook** – pošle šifrovaný vault jako backup. Bez vault hesla/PINu nejde přečíst.

Pro automatické emaily je nejlepší použít Formspree, Make/Zapier webhook, nebo Supabase Edge Function napojenou na email provider. Nejdůležitější pravidlo: nikdy neposílej plaintext data, pokud nechceš. Vault backup je encrypted.

### Secure + cloud
- lokální data jsou šifrovaná přes WebCrypto AES-GCM
- klíč se odvozuje z vault hesla přes PBKDF2
- export/import backupu
- Supabase sync pro mobil/tablet/PC
- do cloudu se posílá jen zašifrovaný vault

## Multi-device sync přes Supabase

Toto je volitelné. Bez Supabase appka funguje lokálně.

### 1. Vytvoř Supabase projekt

V Supabase vytvoř nový projekt. V nastavení projektu najdi:
- Project URL
- anon public key

Tyto hodnoty vlož v appce do `Sync & secure`.

### 2. V Supabase spusť SQL

V SQL editoru spusť obsah souboru `supabase.sql`.

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
5. znovu odemkni stejným vault heslem/PINem

## Import z Lyftu / workout historie

V appce otevři `Gym` → `Lyftu / workout historie import`.

Podporované pokusy:
- CSV
- TSV
- JSON
- TXT

Parser hledá sloupce / klíče jako `exercise`, `cvik`, `name`, `title`, `movement`. Když export bude mít jiný formát, pošli mi ho a upravím parser přesně pro něj.

## Hosting jako appka

Pro PWA instalaci na mobil je nejlepší to hodit na:
- GitHub Pages
- Netlify
- Vercel
- vlastní hosting

Pak půjde stránka připnout na plochu jako normální appka.
