import type { Locale } from "./i18n";

const copy = {
  lv: {
    subject: "Tava drošā ieejas saite",
    intro: "Saņēmām pieprasījumu ieiet sistēmā “{name}”.",
    button: "Ieiet sistēmā",
    expires: "Saite ir derīga 10 minūtes un izmantojama tikai vienu reizi.",
    ignore: "Ja tu šo saiti nepieprasīji, ignorē šo e-pastu.",
  },
  en: {
    subject: "Your secure sign-in link",
    intro: "We received a request to sign in to “{name}”.",
    button: "Sign in",
    expires: "The link is valid for 10 minutes and can be used only once.",
    ignore: "If you did not request this link, ignore this email.",
  },
  lt: {
    subject: "Jūsų saugi prisijungimo nuoroda",
    intro: "Gavome prašymą prisijungti prie „{name}“.",
    button: "Prisijungti",
    expires: "Nuoroda galioja 10 minučių ir gali būti panaudota tik vieną kartą.",
    ignore: "Jei šios nuorodos neprašėte, ignoruokite šį laišką.",
  },
  et: {
    subject: "Sinu turvaline sisselogimislink",
    intro: "Saime taotluse logida sisse süsteemi „{name}“.",
    button: "Logi sisse",
    expires: "Link kehtib 10 minutit ja seda saab kasutada ainult ühe korra.",
    ignore: "Kui sa seda linki ei taotlenud, eira seda kirja.",
  },
} satisfies Record<Locale, Record<string, string>>;

export function magicLinkEmail(locale: Locale, instanceName: string, link: string) {
  const value = copy[locale];
  const intro = value.intro.replace("{name}", instanceName);
  const safeName = escapeHtml(instanceName);
  const safeLink = escapeHtml(link);
  return {
    subject: `${value.subject} — ${instanceName}`,
    text: `${intro}\n\n${value.button}: ${link}\n\n${value.expires}\n${value.ignore}`,
    html: `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#fdf0d5;color:#003049;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffaf0;border:1px solid #b7c8d2;border-radius:18px;padding:36px"><tr><td><p style="margin:0 0 8px;color:#4d6d7e;font-size:14px">${safeName}</p><h1 style="margin:0 0 20px;font-size:30px;line-height:1.15">${escapeHtml(value.subject)}</h1><p style="margin:0 0 26px;font-size:16px;line-height:1.6">${escapeHtml(intro)}</p><p style="margin:0 0 26px"><a href="${safeLink}" style="display:inline-block;background:#c1121f;color:#fff;text-decoration:none;font-weight:700;padding:15px 24px;border-radius:999px">${escapeHtml(value.button)}</a></p><p style="margin:0 0 8px;color:#38596b;font-size:14px;line-height:1.55">${escapeHtml(value.expires)}</p><p style="margin:0;color:#38596b;font-size:14px;line-height:1.55">${escapeHtml(value.ignore)}</p></td></tr></table></td></tr></table></body></html>`,
  };
}

export function smtpTestEmail(locale: Locale, instanceName: string) {
  const values = {
    lv: ["SMTP pārbaude izdevās", `E-pasta savienojums sistēmai “${instanceName}” darbojas.`],
    en: ["SMTP test succeeded", `The email connection for “${instanceName}” works.`],
    lt: ["SMTP patikra sėkminga", `Sistemos „${instanceName}“ el. pašto ryšys veikia.`],
    et: ["SMTP-test õnnestus", `Süsteemi „${instanceName}“ e-postiühendus töötab.`],
  } satisfies Record<Locale, [string, string]>;
  const [subject, body] = values[locale];
  return {
    subject,
    text: body,
    html: `<p>${escapeHtml(body)}</p>`,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
