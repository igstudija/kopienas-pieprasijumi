# Vercel + Supabase instalācija

Šī procedūra izveido pilnīgi neatkarīgu sistēmas instanci. Ja projekta izstrādātāja infrastruktūra pārstāj darboties, jau uzstādītās instances turpina strādāt savos Vercel un Supabase kontos.

## Kas pieder instances īpašniekam

- GitHub repozitorija kopija;
- Vercel projekts un domēns;
- Supabase organizācija, projekts un PostgreSQL datubāze;
- visi lietotāju un pieprasījumu dati;
- WhatsApp/Meta aplikācija un Business numurs;
- instances federācijas privātā atslēga.

## A. Ieteicamā instalācija ar Deploy pogu

Izplatītājs publiskā šablona URL ievieto `NEXT_PUBLIC_TEMPLATE_REPOSITORY_URL`. Aplikācijas `/help/install` lapa no tā automātiski uzbūvē Vercel Deploy saiti ar:

- GitHub repozitorija kopēšanu;
- obligātu `SETUP_SECRET` lauku;
- Supabase Marketplace produkta pieprasījumu;
- projekta un repozitorija noklusējuma nosaukumu.

Lietotāja darbības:

1. Nospied **Sākt ieteikto instalāciju**.
2. Pieslēdzies Vercel un atļauj izveidot GitHub repozitorija kopiju.
3. Laukā `SETUP_SECRET` izvēlies unikālu instalācijas paroli ar vismaz 12 rakstzīmēm. Tā nav Supabase parole.
4. Apstiprini Supabase produktu, Free plānu un Eiropai tuvāko pieejamo reģionu.
5. Nospied **Deploy**.
6. Kad deployment ir pabeigts, atver izveidoto aplikācijas adresi.
7. Aplikācija automātiski atvērs `/setup`.
8. Vednī ievadi grupu, WhatsApp Business numuru, Meta App Secret un pirmo administratoru.
9. Pēdējā solī nokopē Meta webhook Callback URL un Verify token.

Vercel build komanda pirms aplikācijas būvēšanas izpilda `pnpm db:migrate`, tāpēc tabulas izveidojas automātiski.

## B. Ja Supabase produkts Deploy logā neparādās

1. Pabeidz Vercel projekta izveidi no GitHub kopijas.
2. Vercel projekta panelī atver **Storage**.
3. Izvēlies **Create Database → Supabase → Install**.
4. Izvēlies plānu un reģionu, izveido resursu un savieno to ar tikko izveidoto Vercel projektu.
5. Atver **Project Settings → Environment Variables** un pievieno `SETUP_SECRET`.
6. Atver **Deployments**, pēdējam deployment izvēlies **Redeploy**.
7. Atver aplikāciju un pabeidz `/setup` vedni.

Savienojot Marketplace resursu, Supabase Vercel projektam sinhronizē `POSTGRES_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` un citus nepieciešamos mainīgos. Ja resurss pieslēgts pēc deployment, nepieciešams redeploy.

## C. Esošs Supabase projekts

Ja datubāze jau izveidota ārpus Vercel Marketplace:

1. Importē GitHub kopiju Vercel.
2. **Project Settings → Environment Variables** pievieno:
   - `DATABASE_URL` vai `POSTGRES_URL` — Supabase pooled PostgreSQL connection string;
   - `SUPABASE_SECRET_KEY` — servera slepenā atslēga, kuru neeksponē pārlūkam;
   - `SETUP_SECRET` — paša izvēlēta instalācijas parole.
3. Pārbaudi, ka mainīgie pieejami Production videi.
4. Veic redeploy.
5. Atver `/setup`.

`SUPABASE_SECRET_KEY`, `DATABASE_URL` un `POSTGRES_URL` nekad nedrīkst būt ar `NEXT_PUBLIC_` prefiksu.

## Pirmās palaišanas vednis

Vednis veic piecas darbības:

1. pārbauda datubāzes savienojumu un `SETUP_SECRET`;
2. saglabā grupas nosaukumu, valodu, laika zonu un instances adresi;
3. šifrēti saglabā WhatsApp App Secret un ģenerē webhook Verify token;
4. izveido pirmo aktīvo lietotāju ar `owner` lomu;
5. ģenerē Ed25519 federācijas atslēgu pāri un šifrē privāto atslēgu.

Kad `instance_settings` ieraksts ir izveidots, publiska atkārtota uzstādīšana tiek bloķēta. `SETUP_SECRET` pēc instalācijas drīkst izņemt no Vercel Environment Variables un veikt redeploy.

## Meta/WhatsApp sagatavošana

Pirms vedņa nepieciešams:

1. savs Meta Business konts;
2. Meta for Developers Business aplikācija ar WhatsApp produktu;
3. pieslēgts WhatsApp Business numurs;
4. aplikācijas **App Secret**.

Pēc vedņa:

1. Meta WhatsApp konfigurācijā atver webhook iestatījumus;
2. ievieto vedņa parādīto Callback URL;
3. ievieto vedņa parādīto Verify token;
4. abonē `messages` notikumus;
5. atver aplikācijas `/login` un pārbaudi QR/deep-link autorizāciju.

## Kur glabājas noslēpumi

| Vērtība | Glabāšanas vieta |
| --- | --- |
| PostgreSQL credentials | Vercel Environment Variables |
| Supabase servera atslēga | Vercel Environment Variables |
| `SETUP_SECRET` | Vercel Environment Variables, tikai pirmās palaišanas aizsardzībai |
| WhatsApp App Secret | šifrēts instances Supabase datubāzē |
| WhatsApp Verify token | šifrēts instances Supabase datubāzē |
| Federācijas privātā atslēga | šifrēta instances Supabase datubāzē |
| Grupas dati un lietotāji | instances Supabase datubāzē |

Šifrēšanas pamata atslēga tiek deterministiski iegūta no `INSTANCE_MASTER_KEY`, ja tas konfigurēts, citādi no Vercel Supabase integrācijas servera slepenās atslēgas vai datubāzes credential. Ja plānota šo credentials rotācija, vispirms jāpievieno stabils `INSTANCE_MASTER_KEY`; pēc datu saglabāšanas to nedrīkst nomainīt bez atslēgu migrācijas.

## Problēmu risināšana

### Vednis rāda, ka datubāze nav pieslēgta

- Vercel projektā pārbaudi, ka Supabase resurss ir savienots tieši ar šo projektu.
- Pārbaudi, ka ir `POSTGRES_URL`, `POSTGRES_PRISMA_URL` vai `DATABASE_URL`.
- Pēc integrācijas pievienošanas veic redeploy.

### Vednis rāda, ka nav instalācijas paroles

- Vercel **Project Settings → Environment Variables** pievieno `SETUP_SECRET` Production videi.
- Veic redeploy.

### Build neizdodas migrāciju solī

- Pārbaudi datubāzes connection string.
- Izmanto pooled Supabase connection string serverless videi.
- Pārbaudi, ka datubāzes lietotājam ir tiesības izveidot tabulas un enum tipus.

### WhatsApp webhook verifikācija neizdodas

- Callback URL jābūt precīzi tādam, kādu parādīja vednis.
- Verify token ir reģistrjutīgs.
- Meta aplikācijā ievadītajam App Secret jāatbilst vednī ievadītajam.
- Webhook abonementā jābūt ieslēgtam `messages` notikumam.
