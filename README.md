# Specifiskie prasījumi

Pašhostējama PWA slēgtām uzņēmēju kopienām. Biedri publicē konkrētus biznesa kontaktu pieprasījumus, bet atsevišķas instances var savstarpēji koplietot tikai skaidri atļautos ierakstus.

Katrai grupai ir sava GitHub kopija, savs Vercel projekts un sava Supabase datubāze. Sistēmai nav centrālas SaaS datubāzes vai kopīga autorizācijas servera.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Figstudija%2Fkopienas-pieprasijumi&project-name=kopienas-pieprasijumi&repository-name=kopienas-pieprasijumi&env=SETUP_SECRET&envDescription=Izv%C4%93lies+vismaz+12+rakstz%C4%ABmju+instal%C4%81cijas+paroli.+T%C4%81+b%C5%ABs+vajadz%C4%ABga+tikai+pirm%C4%81s+palai%C5%A1anas+vedn%C4%AB.&envLink=https%3A%2F%2Fgithub.com%2Figstudija%2Fkopienas-pieprasijumi%2Fblob%2Fmain%2Fdocs%2FINSTALLATION.md&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22supabase%22%2C%22productSlug%22%3A%22supabase%22%7D%5D)

## Ieteicamā instalācija

Pilna Vercel + Supabase procedūra, alternatīvas un problēmu risināšana ir aprakstīta [instalācijas instrukcijā](./docs/INSTALLATION.md).

Īsā plūsma:

1. atver **Deploy to Vercel** saiti no publiskā projekta šablona;
2. izvēlies `SETUP_SECRET` instalācijas paroli;
3. apstiprini Supabase Marketplace produktu un Free plānu;
4. Vercel izpilda migrācijas un publicē aplikāciju;
5. atver aplikāciju un pabeidz `/setup` vedni.

Datubāzes credentials glabājas Vercel Environment Variables un netiek ievadīti aplikācijas vednī.

## Autorizācija

- Pieprasījumu autori un citi biedri ieiet tikai ar WhatsApp autorizāciju.
- Datorā tiek rādīts vienreizējs QR kods.
- Telefonā tā pati saite tiek rādīta kā poga **Ieiet ar WhatsApp**.
- WhatsApp atver jau sagatavotu vienreizēju ziņu; lietotājs nospiež **Sūtīt**.
- Cloud API webhook dod sistēmai sūtītāja numuru. Ja tas atbilst aktīvam biedram, sākotnējā pārlūka sesija tiek autorizēta.
- Sistēma nesūta maksas OTP vai SMS ziņas.
- `owner` un `admin` lomas var ieiet `/admin` ar reģistrēto tālruņa numuru un paroli.
- Adminu paroles tiek glabātas tikai kā scrypt hash; biedriem paroles netiek veidotas.
- Administrators var biedram mainīt tālruņa numuru, deaktivizēt/aktivizēt piekļuvi vai dzēst konta personas datus. Vēsturiskie pieprasījumi pēc dzēšanas paliek anonimizēti.

## Instalāciju savienošana

- Katras instalācijas administrators izveido vienreizēju kodu konkrētajai otrai grupai.
- Kodā jau ir iekļauts izdevējas instalācijas domēns un identitāte; domēns nav jāievada atsevišķi.
- Ievadot otras grupas kodu, šī instalācija saņem viņu kopīgotos pieprasījumus.
- Otra grupa šīs instalācijas pieprasījumus neredz, kamēr tā savā pusē nav ievadījusi pretējo kodu.
- Ja abas puses ievada viena otras kodus, koplietošana darbojas abos virzienos.
- Katrs kods ir derīgs 24 stundas un izmantojams vienu reizi.

## Lokālā palaišana

Prasības: Node.js 22+, pnpm 10+ un Docker.

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Atver `http://localhost:3020`.

Ja datubāze ir tukša, aplikācija automātiski atvērs `/setup`. Lokālās izstrādes instalācijas parole pēc noklusējuma ir `development-setup`; ieteicams to aizstāt `.env` failā.

`pnpm db:seed` izveidotā lokālā Owner ieeja:

- tālrunis: `SEED_OWNER_PHONE` no `.env`;
- parole: `SEED_OWNER_PASSWORD`, vai `development-admin`, ja lokāli lauks atstāts tukšs;
- adrese: `http://localhost:3020/admin`.

Production vidē `SEED_OWNER_PASSWORD` noklusējuma vērtības nav, un pirmās palaišanas vednis pieprasa vismaz 12 rakstzīmju admina paroli.

## WhatsApp Cloud API

Production instalācijā pirmās palaišanas vednis saglabā:

- `WHATSAPP_BUSINESS_NUMBER` — instances WhatsApp Business numurs E.164 formātā;
- `WHATSAPP_APP_SECRET` — Meta App Secret webhook paraksta pārbaudei;
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` — vedņa ģenerēts webhook verifikācijas tokens;
- `WHATSAPP_PHONE_NUMBER_ID` un `WHATSAPP_ACCESS_TOKEN` ir rezervēti nākotnes izejošajām ziņām, bet QR login plūsmai tie nav vajadzīgi.

Meta konfigurācijā norādi callback:

`https://tavs-domens.lv/api/v1/whatsapp/webhook`

Abonē `messages` webhook notikumus. Production webhook jābūt publiski sasniedzamam ar HTTPS.

## Federācijas atslēgas

Production vednis ģenerē katrai instancei unikālu Ed25519 atslēgu pāri un privāto atslēgu saglabā šifrētu. Manuālai vai lokālai seed instalācijai atslēgas var izveidot arī ar:

```bash
pnpm exec tsx scripts/generate-federation-keys.ts
```

Ievieto izdrukātās vērtības `.env`. Privāto atslēgu nekopē uz citu instanci.

## Pārbaudes

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Arhitektūra: [ARCHITECTURE.md](./ARCHITECTURE.md). Draudu modelis: [docs/THREAT_MODEL.md](./docs/THREAT_MODEL.md).
