# Draudu modelis

## Aizsargājamie aktīvi

- biedru tālruņu numuri un profili;
- lokālo un koplietoto pieprasījumu saturs;
- WhatsApp API rekvizīti;
- sesiju un vienreizējo WhatsApp challenge noslēpumi;
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
| Admina konta pārņemšana | WhatsApp numura īpašumtiesību pārbaude ar parakstītu webhook; WebAuthn paredzēts kā papildu aizsardzība |

## Production vārti

Pirms sistēma glabā reālus biedru datus, obligāti jāizmanto HTTPS, jāiestata unikāls `SETUP_SECRET`, jāpārbauda Meta webhook paraksts un jāapsver WebAuthn Owner/Admin lomām.
