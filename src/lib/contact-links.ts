export function contactLinks(email?: string | null, phone?: string | null, website?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    && !normalizedEmail.endsWith("@migration.invalid");
  const normalizedPhone = phone?.trim() ?? "";
  const validPhone = /^\+[1-9]\d{7,14}$/.test(normalizedPhone);

  return {
    email: validEmail ? `mailto:${normalizedEmail}` : null,
    phone: validPhone ? `tel:${normalizedPhone}` : null,
    whatsapp: validPhone ? `https://wa.me/${normalizedPhone.slice(1)}` : null,
    website: normalizeWebsiteUrl(website),
  };
}

export function normalizeWebsiteUrl(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}
