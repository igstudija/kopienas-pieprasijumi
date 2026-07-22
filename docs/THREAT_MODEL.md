# Draudu modelis

## Aizsargājamie aktīvi

- biedru tālruņu numuri un profili;
- lokālo un koplietoto pieprasījumu saturs;
- WhatsApp API rekvizīti;
- sesiju un vienreizējo WhatsApp challenge noslēpumi;
- administratoru paroļu hash;
- federācijas privātā atslēga;
- auditācijas pierādījumi.

## Galvenie draudi un kontroles

| Drauds | Kontrole |
| --- | --- |
| Reģistrētu numuru uzskaitīšana | Vienāda publiskā atbilde visiem numuriem |
| Login saites minēšana vai atkārtota izmantošana | Augstas entropijas tokens, 2 minūšu TTL, HMAC digest un vienreizēja izmantošana; sūtītājam jābūt aktīvam reģistrētam numuram |
| Datubāzes noplūde | Challenge un sesiju HMAC digest; tālrunis šifrēts + HMAC lookup |
| Sesijas zādzība | HttpOnly/Secure/SameSite cookie, servera revokācija |
| Invite token atkārtota lietošana | 256 bitu secrets, hash glabāšana, expiry, single use |
| Viltots federācijas event | Ed25519 paraksts un uzticamo peer saraksts |
| Replay | Timestamp, unikāls nonce un event ID |
| Datu izplatīšanās pa ķēdi | Tikai home instances ieraksti drīkst tikt sūtīti tālāk |
| SSRF handshake laikā | HTTPS, redirect aizliegums, IP/DNS validācija pirms production |
| Admina paroles noplūde | scrypt ar unikālu salt; datubāzē netiek glabāta atjaunojama parole |
| Admina paroles minēšana | Vienāda kļūda nepareizam numuram/parolei, dummy scrypt pārbaude un 5 mēģinājumu limits 15 minūtēs vienai tālruņa/IP kombinācijai |
| Admina konta pārņemšana | Paroles ieeja tikai aktīvām Owner/Admin lomām; WebAuthn paredzēts kā papildu aizsardzība |

## Production vārti

Pirms sistēma glabā reālus biedru datus, obligāti jāizmanto HTTPS, jāiestata unikāls `SETUP_SECRET`, jāpārbauda Meta webhook paraksts un jāapsver WebAuthn Owner/Admin lomām.
