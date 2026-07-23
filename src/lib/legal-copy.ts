import type { Locale } from "./i18n";

type LegalCopy = {
  updated: string;
  notProvided: string;
  back: string;
  impressum: {
    eyebrow: string;
    title: string;
    intro: string;
    operator: string;
    entity: string;
    registration: string;
    address: string;
    country: string;
    email: string;
    phone: string;
    solution: string;
    solutionText: string;
    independence: string;
    independenceText: string;
    source: string;
    sourceText: string;
    license: string;
    licenseText: string;
    warranty: string;
    warrantyText: string;
  };
  privacy: {
    eyebrow: string;
    title: string;
    intro: string;
    controller: string;
    controllerText: string;
    privacyContact: string;
    data: string;
    dataText: string;
    purposes: string;
    purposesText: string;
    access: string;
    accessText: string;
    authentication: string;
    authenticationText: string;
    cookies: string;
    cookiesText: string;
    cookieSession: string;
    cookieLocale: string;
    localStorage: string;
    retention: string;
    retentionText: (months: number) => string;
    providers: string;
    providersText: string;
    rights: string;
    rightsText: string;
    complaints: string;
    complaintsText: string;
    security: string;
    securityText: string;
    changes: string;
    changesText: string;
    noAnalytics: string;
  };
};

export const legalCopy: Record<Locale, LegalCopy> = {
  lv: {
    updated: "Pēdējoreiz atjaunināts: 2026. gada 23. jūlijā",
    notProvided: "Nav norādīts",
    back: "Atpakaļ uz sistēmu",
    impressum: {
      eyebrow: "Juridiskā informācija",
      title: "Par risinājumu.",
      intro: "Informācija par šīs neatkarīgās instalācijas operatoru, risinājuma autoru, pirmkodu un licenci.",
      operator: "Instalācijas operators",
      entity: "Juridiskā persona",
      registration: "Reģistrācijas numurs",
      address: "Juridiskā adrese",
      country: "Valsts",
      email: "E-pasts",
      phone: "Tālrunis",
      solution: "Par risinājumu",
      solutionText: "“Specifiskie prasījumi” ir pašhostējama kopienas pieprasījumu sistēma. Katra instalācija darbojas neatkarīgi, glabā savus lietotāju un pieprasījumu datus un pati nosaka, ar kurām citām instalācijām apmainīties ar konkrēti kopīgotu saturu.",
      independence: "Atbildības nošķīrums",
      independenceText: "Instalācijas operators ir atbildīgs par tās konfigurāciju, piekļuves tiesībām, hostingu un personas datu apstrādi. Risinājuma autors nesaņem instalācijas telemetriju vai lietotāju datus, ja vien operators nav atsevišķi pasūtījis uzturēšanas pakalpojumu ar atbilstošu vienošanos.",
      source: "Pirmkods",
      sourceText: "Pilns projekta pirmkods ir publiski pieejams GitHub. To drīkst pārbaudīt, kopēt, izvietot savā infrastruktūrā un pielāgot tikai licences atļautajiem nekomerciālajiem mērķiem.",
      license: "Licence un cena",
      licenseText: "Pirmkods ir pieejams saskaņā ar PolyForm Noncommercial License 1.0.0. To drīkst lietot, kopēt, modificēt un izplatīt tikai licences atļautajiem nekomerciālajiem mērķiem, saglabājot licenci un obligātos autortiesību paziņojumus. Izmantošanai komercdarbībā ir vajadzīga atsevišķa rakstiska komerciālā licence no Arta Čodara, Codars Design.",
      warranty: "Garantija",
      warrantyText: "Programmatūra tiek nodrošināta tāda, kāda tā ir, bez garantijām. Operators pirms izmantošanas ir atbildīgs par drošības, juridiskās atbilstības, rezerves kopiju un datu glabāšanas konfigurācijas izvērtēšanu.",
    },
    privacy: {
      eyebrow: "Privātums un sīkdatnes",
      title: "Kā tiek apstrādāti dati.",
      intro: "Šis ir instalācijas noklusējuma privātuma paziņojums. Operators to piemēro savai faktiskajai darbībai un ir atbildīgs par tā precizitāti.",
      controller: "1. Datu pārzinis",
      controllerText: "Šīs instalācijas datu pārzinis ir zemāk norādītais operators. Jautājumiem par personas datiem izmanto privātuma kontaktu.",
      privacyContact: "Privātuma kontakts",
      data: "2. Apstrādāto datu kategorijas",
      dataText: "Sistēma var apstrādāt biedra vārdu, uzvārdu, uzņēmumu, nozari, e-pastu, šifrētu kontakttālruņa numuru un tehnisku tālruņa meklēšanas identifikatoru; lietotāja veidotos pieprasījumus; lomu un konta statusu; autorizācijas sesiju, IP adresi, pārlūka informāciju, drošības žurnālu un vienreizējo e-pasta saišu tehniskos ierakstus. Sistēmā nevajadzētu ievadīt sensitīvus datus vai trešo personu datus bez piemērota tiesiskā pamata.",
      purposes: "3. Nolūki un tiesiskais pamats",
      purposesText: "Dati tiek apstrādāti, lai pārvaldītu kopienas dalībniekus, autentificētu lietotājus, publicētu un atrastu profesionālus pieprasījumus, uzturētu sistēmas drošību un pierādītu administratīvās darbības. Atkarībā no operatora attiecībām ar biedru pamats var būt līguma izpilde, juridisks pienākums un/vai operatora leģitīmās intereses uzturēt drošu profesionālo kopienu. Operators pirms sistēmas lietošanas dokumentē piemērojamo pamatu un interešu līdzsvarošanas izvērtējumu.",
      access: "4. Kas redz datus",
      accessText: "Profila vārds, uzņēmums, nozare un publicētā pieprasījuma saturs ir redzams autorizētiem šīs instalācijas biedriem. Pieprasījums nonāk savienotā instalācijā tikai tad, ja autors izvēlas atbilstošu kopīgošanas redzamību. Administratoriem ir piekļuve konta pārvaldības datiem. Dati var būt pieejami operatora izvēlētiem hostinga, datubāzes un ziņojumapmaiņas pakalpojumu sniedzējiem to pakalpojuma nodrošināšanai.",
      authentication: "5. Autorizācija ar e-pastu",
      authenticationText: "Lietotājs ievada administratora reģistrēto e-pasta adresi un saņem vienreizēju autorizācijas saiti. Saites noslēpums datubāzē tiek glabāts tikai neatgriezeniska kopsavilkuma veidā, ir derīgs 10 minūtes un pēc izmantošanas vairs nav lietojams. Operators izvēlas SMTP pakalpojumu; šis pakalpojums apstrādā adresi, ziņojumu un piegādes tehniskos datus saskaņā ar saviem noteikumiem.",
      cookies: "6. Sīkdatnes un lokālā krātuve",
      cookiesText: "Instalācija pati neizmanto reklāmas vai analītikas sīkdatnes. Tā izmanto tikai funkcionalitātei nepieciešamu autentifikācijas sīkdatni un lietotāja tieši izvēlētu valodas iestatījumu.",
      cookieSession: "community_session — HttpOnly autentifikācijas sīkdatne; uztur drošu pieslēguma sesiju līdz 30 dienām vai līdz iziešanai/anulēšanai.",
      cookieLocale: "community_locale — saglabā lietotāja izvēlēto valodu līdz vienam gadam.",
      localStorage: "community_cookie_consent_v1 — pārlūka lokālajā krātuvē saglabā obligāto, preferenču un analītikas kategoriju izvēli; to var mainīt footerī.",
      retention: "7. Glabāšanas termiņi",
      retentionText: (months) => `Aktīva konta dati tiek glabāti dalības un sistēmas lietošanas laikā. Dzēsts konts tiek anonimizēts. Lietotājs var dzēst savus pieprasījumus; to saturs tiek noņemts, bet minimāls tehnisks dzēšanas marķieris un audita pierādījums var saglabāties federācijas sinhronizācijai un drošībai. Operators ir konfigurējis ${months} mēnešu drošības un audita ierakstu glabāšanas termiņu un ir atbildīgs par tā tehnisku ievērošanu, ja vien nav dokumentētas vajadzības vai juridiska pienākuma glabāt datus citādi. Sesija ir derīga ne ilgāk kā 30 dienas.`,
      providers: "8. Apstrādātāji un starptautiska nodošana",
      providersText: "Operators izvēlas un konfigurē hostinga, datubāzes, rezerves kopiju un e-pasta/SMTP pakalpojumus. Operators uztur faktisko apstrādātāju sarakstu, noslēdz vajadzīgos datu apstrādes līgumus un, ja dati tiek nodoti ārpus EEZ, nodrošina piemērotu nodošanas mehānismu un informāciju datu subjektiem.",
      rights: "9. Tavas tiesības",
      rightsText: "Atbilstoši piemērojamajiem noteikumiem vari lūgt piekļuvi, labošanu, dzēšanu, apstrādes ierobežošanu un datu pārnesamību, kā arī iebilst pret apstrādi, kas balstīta leģitīmajās interesēs. Ja apstrāde balstīta piekrišanā, to var atsaukt, neietekmējot iepriekšējās apstrādes likumību. Pieprasījumu nosūti privātuma kontaktam; pirms atbildes operators var pārbaudīt identitāti.",
      complaints: "10. Sūdzības",
      complaintsText: "Vispirms aicinām sazināties ar operatoru. Tev ir arī tiesības iesniegt sūdzību kompetentajā datu aizsardzības uzraudzības iestādē, īpaši savas pastāvīgās dzīvesvietas, darba vietas vai iespējamā pārkāpuma valstī.",
      security: "11. Drošība",
      securityText: "Sistēma izmanto piekļuves lomas, HttpOnly sesiju sīkdatnes, šifrētu tālruņu glabāšanu, audita žurnālu, ievades validāciju un parakstītu federācijas apmaiņu. Operators atbild par drošiem noslēpumiem, atjauninājumiem, rezerves kopijām, piegādātāju iestatījumiem un incidentu pārvaldību.",
      changes: "12. Izmaiņas",
      changesText: "Operators atjaunina šo paziņojumu, ja mainās apstrādes nolūki, dati, pakalpojumu sniedzēji vai juridiskās prasības. Būtiskas izmaiņas biedriem jāpaziņo saprotamā veidā.",
      noAnalytics: "Šajā noklusējuma instalācijā nav analītikas vai reklāmas izsekošanas. Ja operators to pievieno, tam pirms aktivizēšanas jāpapildina šis paziņojums un jāievieš atbilstoša piekrišanas izvēle.",
    },
  },
  en: {
    updated: "Last updated: 23 July 2026",
    notProvided: "Not provided",
    back: "Back to the system",
    impressum: {
      eyebrow: "Legal information",
      title: "About the solution.",
      intro: "Information about the operator of this independent installation, the author of the solution, its source code and licence.",
      operator: "Installation operator",
      entity: "Legal entity",
      registration: "Registration number",
      address: "Registered address",
      country: "Country",
      email: "Email",
      phone: "Phone",
      solution: "About the solution",
      solutionText: "“Specific Requests” is a self-hosted community request system. Each installation operates independently, stores its own user and request data, and decides which specifically shared content is exchanged with other installations.",
      independence: "Separation of responsibilities",
      independenceText: "The installation operator is responsible for configuration, access rights, hosting and personal-data processing. The author receives no installation telemetry or user data unless the operator separately commissions a maintenance service under an appropriate agreement.",
      source: "Source code",
      sourceText: "The complete project source code is publicly available on GitHub. It may be inspected, copied, deployed on an operator's own infrastructure and adapted only for noncommercial purposes permitted by the licence.",
      license: "Licence and price",
      licenseText: "The source code is available under the PolyForm Noncommercial License 1.0.0. It may be used, copied, modified and distributed only for noncommercial purposes permitted by the licence, with the licence and required copyright notices retained. Commercial use requires a separate written commercial licence from Artis Čodars, Codars Design.",
      warranty: "Warranty",
      warrantyText: "The software is provided as is, without warranties. Before use, the operator is responsible for assessing security, legal compliance, backups and data-retention configuration.",
    },
    privacy: {
      eyebrow: "Privacy and cookies",
      title: "How data is processed.",
      intro: "This is the installation's default privacy notice. The operator must adapt it to its actual operations and remains responsible for its accuracy.",
      controller: "1. Controller",
      controllerText: "The operator identified below is the controller for this installation. Use the privacy contact for questions about personal data.",
      privacyContact: "Privacy contact",
      data: "2. Categories of data",
      dataText: "The system may process a member's first and last name, company, industry, email, encrypted contact phone number and a technical phone lookup identifier; user-created requests; role and account status; authentication sessions, IP address, browser information, security logs and technical records for one-time email links. Sensitive data or third-party personal data should not be entered without an appropriate legal basis.",
      purposes: "3. Purposes and legal bases",
      purposesText: "Data is processed to manage community membership, authenticate users, publish and find professional requests, maintain security and evidence administrative actions. Depending on the operator's relationship with a member, the basis may be performance of a contract, a legal obligation and/or the operator's legitimate interests in running a secure professional community. The operator must document the applicable basis and any legitimate-interest balancing assessment before use.",
      access: "4. Who can access data",
      accessText: "A profile name, company, industry and published request content are visible to authorised members of this installation. A request reaches a connected installation only when the author selects the corresponding sharing visibility. Administrators can access account-management data. Data may be available to hosting, database and messaging providers selected by the operator where necessary to provide their services.",
      authentication: "5. Email authentication",
      authenticationText: "The user enters the email address registered by an administrator and receives a one-time sign-in link. The link secret is stored only as a one-way digest, expires after 10 minutes and cannot be reused. The operator selects the SMTP provider; that provider processes the address, message and delivery metadata under its own terms.",
      cookies: "6. Cookies and local storage",
      cookiesText: "The installation itself uses no advertising or analytics cookies. It uses only a functional authentication cookie and a language setting directly requested by the user.",
      cookieSession: "community_session — an HttpOnly authentication cookie that maintains a secure login for up to 30 days or until logout/revocation.",
      cookieLocale: "community_locale — remembers the selected language for up to one year.",
      localStorage: "community_cookie_consent_v1 — stores the necessary, preference and analytics category choice in browser local storage; it can be changed from the footer.",
      retention: "7. Retention",
      retentionText: (months) => `Active account data is retained while membership and system use continue. A deleted account is anonymised. Users can delete their own requests; the content is erased, while a minimal technical deletion marker and audit evidence may remain for federation synchronisation and security. The operator has configured a ${months}-month retention period for security and audit records and is responsible for enforcing it technically unless a documented need or legal duty requires different retention. A session remains valid for no more than 30 days.`,
      providers: "8. Processors and international transfers",
      providersText: "The operator selects and configures hosting, database, backup and email/SMTP services. The operator maintains the actual processor list, enters into required data-processing agreements and, where data is transferred outside the EEA, ensures an appropriate transfer mechanism and information for data subjects.",
      rights: "9. Your rights",
      rightsText: "Subject to applicable law, you may request access, rectification, erasure, restriction and portability, and object to processing based on legitimate interests. Where processing relies on consent, it may be withdrawn without affecting prior lawful processing. Send requests to the privacy contact; the operator may verify identity before responding.",
      complaints: "10. Complaints",
      complaintsText: "We encourage you to contact the operator first. You also have the right to lodge a complaint with the competent data-protection authority, particularly in the country of your habitual residence, place of work or the alleged infringement.",
      security: "11. Security",
      securityText: "The system uses access roles, HttpOnly session cookies, encrypted phone storage, audit logging, input validation and signed federation exchange. The operator is responsible for secure secrets, updates, backups, provider configuration and incident response.",
      changes: "12. Changes",
      changesText: "The operator updates this notice when purposes, data, providers or legal requirements change. Material changes should be communicated to members in an understandable manner.",
      noAnalytics: "This default installation has no analytics or advertising tracking. If the operator adds either, this notice and an appropriate consent choice must be implemented before activation.",
    },
  },
  lt: {
    updated: "Paskutinį kartą atnaujinta: 2026 m. liepos 23 d.",
    notProvided: "Nenurodyta",
    back: "Grįžti į sistemą",
    impressum: {
      eyebrow: "Teisinė informacija",
      title: "Apie sprendimą.",
      intro: "Informacija apie šio nepriklausomo diegimo operatorių, sprendimo autorių, pirminį kodą ir licenciją.",
      operator: "Diegimo operatorius",
      entity: "Juridinis asmuo",
      registration: "Registracijos numeris",
      address: "Registruotas adresas",
      country: "Valstybė",
      email: "El. paštas",
      phone: "Telefonas",
      solution: "Apie sprendimą",
      solutionText: "„Specifiniai prašymai“ yra savarankiškai talpinama bendruomenės prašymų sistema. Kiekvienas diegimas veikia nepriklausomai, saugo savo naudotojų ir prašymų duomenis bei pats sprendžia, kokiu aiškiai bendrinamu turiniu keistis su kitais diegimais.",
      independence: "Atsakomybės atskyrimas",
      independenceText: "Diegimo operatorius atsako už konfigūraciją, prieigos teises, talpinimą ir asmens duomenų tvarkymą. Autorius negauna diegimo telemetrijos ar naudotojų duomenų, nebent operatorius atskirai užsako priežiūros paslaugą pagal tinkamą susitarimą.",
      source: "Pirminis kodas",
      sourceText: "Visas projekto pirminis kodas viešai prieinamas „GitHub“. Jį galima tikrinti, kopijuoti, diegti savo infrastruktūroje ir pritaikyti tik licencijoje leidžiamais nekomerciniais tikslais.",
      license: "Licencija ir kaina",
      licenseText: "Pirminis kodas prieinamas pagal „PolyForm Noncommercial License 1.0.0“. Jį galima naudoti, kopijuoti, keisti ir platinti tik licencijoje leidžiamais nekomerciniais tikslais, išsaugant licenciją ir privalomus autorių teisių pranešimus. Komerciniam naudojimui būtina atskira rašytinė komercinė Artis Čodars, „Codars Design“, licencija.",
      warranty: "Garantija",
      warrantyText: "Programinė įranga teikiama tokia, kokia yra, be garantijų. Prieš naudojimą operatorius atsako už saugumo, teisinės atitikties, atsarginių kopijų ir duomenų saugojimo nustatymų įvertinimą.",
    },
    privacy: {
      eyebrow: "Privatumas ir slapukai",
      title: "Kaip tvarkomi duomenys.",
      intro: "Tai numatytasis diegimo privatumo pranešimas. Operatorius privalo jį pritaikyti faktinei veiklai ir atsako už jo tikslumą.",
      controller: "1. Duomenų valdytojas",
      controllerText: "Toliau nurodytas operatorius yra šio diegimo duomenų valdytojas. Klausimams apie asmens duomenis naudokite privatumo kontaktą.",
      privacyContact: "Privatumo kontaktas",
      data: "2. Duomenų kategorijos",
      dataText: "Sistema gali tvarkyti nario vardą, pavardę, įmonę, veiklos sritį, el. paštą, šifruotą kontaktinį telefono numerį ir techninį telefono paieškos identifikatorių; naudotojo sukurtus prašymus; vaidmenį ir paskyros būseną; autentifikavimo sesijas, IP adresą, naršyklės informaciją, saugumo žurnalus ir vienkartinių el. pašto nuorodų techninius įrašus. Jautrūs ar trečiųjų asmenų duomenys neturėtų būti įvedami be tinkamo teisinio pagrindo.",
      purposes: "3. Tikslai ir teisiniai pagrindai",
      purposesText: "Duomenys tvarkomi bendruomenės narystei valdyti, naudotojams autentifikuoti, profesiniams prašymams skelbti ir rasti, saugumui užtikrinti bei administraciniams veiksmams pagrįsti. Priklausomai nuo operatoriaus santykio su nariu, pagrindas gali būti sutarties vykdymas, teisinė prievolė ir (arba) teisėti operatoriaus interesai valdyti saugią profesinę bendruomenę. Operatorius prieš naudojimą dokumentuoja taikomą pagrindą ir teisėtų interesų pusiausvyros vertinimą.",
      access: "4. Kas gali matyti duomenis",
      accessText: "Profilio vardas, įmonė, veiklos sritis ir paskelbto prašymo turinys matomi autorizuotiems šio diegimo nariams. Prašymas pasiekia susietą diegimą tik autoriui pasirinkus atitinkamą bendrinimo matomumą. Administratoriai turi prieigą prie paskyros valdymo duomenų. Duomenys gali būti prieinami operatoriaus pasirinktiems talpinimo, duomenų bazės ir pranešimų paslaugų teikėjams, kai tai būtina jų paslaugoms.",
      authentication: "5. Autentifikavimas el. paštu",
      authenticationText: "Naudotojas įveda administratoriaus užregistruotą el. pašto adresą ir gauna vienkartinę prisijungimo nuorodą. Nuorodos paslaptis saugoma tik kaip vienkryptė santrauka, galioja 10 minučių ir negali būti naudojama pakartotinai. Operatorius pasirenka SMTP paslaugą, kuri pagal savo taisykles tvarko adresą, laišką ir pristatymo techninius duomenis.",
      cookies: "6. Slapukai ir vietinė saugykla",
      cookiesText: "Pats diegimas nenaudoja reklamos ar analitikos slapukų. Naudojamas tik funkcinis autentifikavimo slapukas ir paties naudotojo pasirinktas kalbos nustatymas.",
      cookieSession: "community_session — HttpOnly autentifikavimo slapukas, palaikantis saugų prisijungimą iki 30 dienų arba iki atsijungimo / panaikinimo.",
      cookieLocale: "community_locale — iki vienų metų įsimena pasirinktą kalbą.",
      localStorage: "community_cookie_consent_v1 — naršyklės vietinėje saugykloje išsaugo būtinųjų, nuostatų ir analitikos kategorijų pasirinkimą; jį galima pakeisti poraštėje.",
      retention: "7. Saugojimo laikotarpiai",
      retentionText: (months) => `Aktyvios paskyros duomenys saugomi narystės ir sistemos naudojimo laikotarpiu. Ištrinta paskyra anonimizuojama. Naudotojai gali ištrinti savo prašymus; turinys pašalinamas, tačiau minimalus techninis ištrynimo žymuo ir audito įrodymas gali likti federacijos sinchronizavimui bei saugumui. Operatorius nustatė ${months} mėn. saugumo ir audito įrašų saugojimo terminą ir atsako už jo techninį įgyvendinimą, nebent dokumentuotas poreikis ar teisinė prievolė reikalauja kitokio termino. Sesija galioja ne ilgiau kaip 30 dienų.`,
      providers: "8. Duomenų tvarkytojai ir tarptautinis perdavimas",
      providersText: "Operatorius pasirenka ir konfigūruoja talpinimo, duomenų bazės, atsarginių kopijų ir el. pašto / SMTP paslaugas. Operatorius tvarko faktinį duomenų tvarkytojų sąrašą, sudaro reikiamas duomenų tvarkymo sutartis ir, perduodant duomenis už EEE ribų, užtikrina tinkamą perdavimo mechanizmą bei informaciją duomenų subjektams.",
      rights: "9. Jūsų teisės",
      rightsText: "Pagal taikomą teisę galite prašyti prieigos, ištaisymo, ištrynimo, tvarkymo apribojimo ir duomenų perkeliamumo bei prieštarauti tvarkymui, grindžiamam teisėtais interesais. Kai tvarkymas grindžiamas sutikimu, jį galima atšaukti nepaveikiant ankstesnio teisėto tvarkymo. Prašymus siųskite privatumo kontaktui; prieš atsakydamas operatorius gali patikrinti tapatybę.",
      complaints: "10. Skundai",
      complaintsText: "Pirmiausia raginame kreiptis į operatorių. Taip pat turite teisę pateikti skundą kompetentingai duomenų apsaugos priežiūros institucijai, ypač savo nuolatinės gyvenamosios vietos, darbo vietos ar galimo pažeidimo valstybėje.",
      security: "11. Saugumas",
      securityText: "Sistema naudoja prieigos vaidmenis, HttpOnly sesijos slapukus, šifruotą telefono saugojimą, audito žurnalus, įvesties validavimą ir pasirašytą federacinį apsikeitimą. Operatorius atsako už saugias paslaptis, atnaujinimus, atsargines kopijas, tiekėjų konfigūraciją ir incidentų valdymą.",
      changes: "12. Pakeitimai",
      changesText: "Operatorius atnaujina šį pranešimą pasikeitus tikslams, duomenims, teikėjams ar teisiniams reikalavimams. Apie esminius pakeitimus nariams turi būti pranešta suprantamai.",
      noAnalytics: "Šiame numatytajame diegime nėra analitikos ar reklamos sekimo. Jei operatorius tai pridės, prieš aktyvavimą turi būti papildytas šis pranešimas ir įdiegta tinkama sutikimo pasirinkimo galimybė.",
    },
  },
  et: {
    updated: "Viimati uuendatud: 23. juulil 2026",
    notProvided: "Pole esitatud",
    back: "Tagasi süsteemi",
    impressum: {
      eyebrow: "Juriidiline teave",
      title: "Lahendusest.",
      intro: "Teave selle sõltumatu installatsiooni käitaja, lahenduse autori, lähtekoodi ja litsentsi kohta.",
      operator: "Installatsiooni käitaja",
      entity: "Juriidiline isik",
      registration: "Registrikood",
      address: "Registrijärgne aadress",
      country: "Riik",
      email: "E-post",
      phone: "Telefon",
      solution: "Lahendusest",
      solutionText: "„Konkreetsed taotlused“ on isemajutatav kogukonna taotluste süsteem. Iga installatsioon töötab sõltumatult, säilitab oma kasutajate ja taotluste andmeid ning otsustab ise, millist selgelt jagatud sisu teiste installatsioonidega vahetada.",
      independence: "Vastutuse jaotus",
      independenceText: "Installatsiooni käitaja vastutab seadistuse, juurdepääsuõiguste, majutuse ja isikuandmete töötlemise eest. Autor ei saa installatsiooni telemeetriat ega kasutajaandmeid, välja arvatud juhul, kui käitaja tellib eraldi hooldusteenuse asjakohase lepingu alusel.",
      source: "Lähtekood",
      sourceText: "Projekti täielik lähtekood on avalikult kättesaadav GitHubis. Seda võib kontrollida, kopeerida, oma taristus juurutada ja kohandada ainult litsentsiga lubatud mitteärilistel eesmärkidel.",
      license: "Litsents ja hind",
      licenseText: "Lähtekood on saadaval litsentsi „PolyForm Noncommercial License 1.0.0“ alusel. Seda võib kasutada, kopeerida, muuta ja levitada ainult litsentsiga lubatud mitteärilistel eesmärkidel, säilitades litsentsi ning nõutud autoriõiguse teated. Äriliseks kasutamiseks on vaja Artis Čodarsi, Codars Designi, eraldi kirjalikku kommertslitsentsi.",
      warranty: "Garantii",
      warrantyText: "Tarkvara antakse sellisena, nagu see on, ilma garantiideta. Enne kasutamist vastutab käitaja turvalisuse, õigusnõuetele vastavuse, varukoopiate ja andmete säilitamise seadistuse hindamise eest.",
    },
    privacy: {
      eyebrow: "Privaatsus ja küpsised",
      title: "Kuidas andmeid töödeldakse.",
      intro: "See on installatsiooni vaikimisi privaatsusteade. Käitaja peab selle kohandama oma tegeliku tegevusega ja vastutab selle täpsuse eest.",
      controller: "1. Vastutav töötleja",
      controllerText: "Allpool nimetatud käitaja on selle installatsiooni vastutav töötleja. Isikuandmetega seotud küsimuste korral kasutage privaatsuskontakti.",
      privacyContact: "Privaatsuskontakt",
      data: "2. Andmekategooriad",
      dataText: "Süsteem võib töödelda liikme ees- ja perekonnanime, ettevõtet, tegevusala, e-posti, krüpteeritud kontakttelefoninumbrit ja tehnilist telefoniotsingu identifikaatorit; kasutaja loodud taotlusi; rolli ja konto olekut; autentimisseansse, IP-aadressi, brauseriteavet, turvalogisid ning ühekordsete e-posti linkide tehnilisi kirjeid. Tundlikke või kolmandate isikute andmeid ei tohiks sisestada ilma sobiva õigusliku aluseta.",
      purposes: "3. Eesmärgid ja õiguslikud alused",
      purposesText: "Andmeid töödeldakse kogukonna liikmesuse haldamiseks, kasutajate autentimiseks, professionaalsete taotluste avaldamiseks ja leidmiseks, turvalisuse tagamiseks ning haldustoimingute tõendamiseks. Sõltuvalt käitaja ja liikme suhtest võib aluseks olla lepingu täitmine, juriidiline kohustus ja/või käitaja õigustatud huvi turvalise professionaalse kogukonna haldamiseks. Käitaja dokumenteerib enne kasutamist kohaldatava aluse ja õigustatud huvi kaalumise.",
      access: "4. Kes andmeid näeb",
      accessText: "Profiilinimi, ettevõte, tegevusala ja avaldatud taotluse sisu on nähtavad selle installatsiooni volitatud liikmetele. Taotlus jõuab ühendatud installatsiooni ainult siis, kui autor valib vastava jagamisnähtavuse. Administraatoritel on juurdepääs konto haldamise andmetele. Andmed võivad olla kättesaadavad käitaja valitud majutus-, andmebaasi- ja sõnumiteenuse pakkujatele nende teenuse osutamiseks vajalikus ulatuses.",
      authentication: "5. E-postiga autentimine",
      authenticationText: "Kasutaja sisestab administraatori registreeritud e-posti aadressi ja saab ühekordse sisselogimislingi. Lingi saladust hoitakse ainult ühesuunalise räsina, see aegub 10 minutiga ja seda ei saa uuesti kasutada. Käitaja valib SMTP-teenuse; teenus töötleb aadressi, sõnumit ja tarne tehnilisi andmeid oma tingimuste alusel.",
      cookies: "6. Küpsised ja kohalik salvestus",
      cookiesText: "Installatsioon ise ei kasuta reklaami- ega analüütikaküpsiseid. Kasutatakse ainult funktsionaalset autentimisküpsist ja kasutaja enda valitud keeleseadet.",
      cookieSession: "community_session — HttpOnly autentimisküpsis, mis hoiab turvalist sisselogimist kuni 30 päeva või väljalogimise/tühistamiseni.",
      cookieLocale: "community_locale — mäletab valitud keelt kuni ühe aasta.",
      localStorage: "community_cookie_consent_v1 — salvestab brauseri kohalikus salvestusruumis vajalike, eelistuste ja analüütika kategooriate valiku; seda saab jaluses muuta.",
      retention: "7. Säilitamine",
      retentionText: (months) => `Aktiivse konto andmeid säilitatakse liikmesuse ja süsteemi kasutamise ajal. Kustutatud konto anonüümitakse. Kasutajad saavad oma taotlused kustutada; sisu eemaldatakse, kuid minimaalne tehniline kustutamismärge ja auditi tõend võivad jääda föderatsiooni sünkroonimiseks ning turvalisuse tagamiseks. Käitaja on määranud turva- ja auditikirjete säilitamisajaks ${months} kuud ning vastutab selle tehnilise jõustamise eest, välja arvatud juhul, kui dokumenteeritud vajadus või juriidiline kohustus nõuab teistsugust tähtaega. Seanss kehtib kuni 30 päeva.`,
      providers: "8. Volitatud töötlejad ja rahvusvaheline edastamine",
      providersText: "Käitaja valib ja seadistab majutus-, andmebaasi-, varundus- ning e-posti/SMTP-teenused. Käitaja peab tegelikku volitatud töötlejate nimekirja, sõlmib vajalikud andmetöötluslepingud ja tagab väljapoole EMP-d edastamisel sobiva edastusmehhanismi ning teabe andmesubjektidele.",
      rights: "9. Teie õigused",
      rightsText: "Kohaldatava õiguse alusel võite taotleda juurdepääsu, parandamist, kustutamist, töötlemise piiramist ja andmete ülekandmist ning esitada vastuväite õigustatud huvil põhinevale töötlemisele. Kui töötlemine põhineb nõusolekul, saab selle tagasi võtta, ilma et see mõjutaks varasema töötlemise seaduslikkust. Saatke taotlus privaatsuskontaktile; käitaja võib enne vastamist isikusamasust kontrollida.",
      complaints: "10. Kaebused",
      complaintsText: "Soovitame esmalt käitajaga ühendust võtta. Teil on ka õigus esitada kaebus pädevale andmekaitse järelevalveasutusele, eelkõige oma alalise elukoha, töökoha või väidetava rikkumise riigis.",
      security: "11. Turvalisus",
      securityText: "Süsteem kasutab juurdepääsurolle, HttpOnly seansiküpsiseid, krüpteeritud telefonisalvestust, auditilogisid, sisendi valideerimist ja allkirjastatud föderatsioonivahetust. Käitaja vastutab turvaliste saladuste, uuenduste, varukoopiate, pakkujate seadistuse ja intsidentidele reageerimise eest.",
      changes: "12. Muudatused",
      changesText: "Käitaja ajakohastab teadet, kui eesmärgid, andmed, teenusepakkujad või õigusnõuded muutuvad. Olulistest muudatustest tuleb liikmetele arusaadavalt teada anda.",
      noAnalytics: "Selles vaikimisi installatsioonis puudub analüütika- ja reklaamijälgimine. Kui käitaja need lisab, tuleb enne aktiveerimist täiendada teadet ja rakendada sobiv nõusoleku valik.",
    },
  },
};
