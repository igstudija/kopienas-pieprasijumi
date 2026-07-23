export function contactLinks(email?: string | null, phone?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    && !normalizedEmail.endsWith("@migration.invalid");
  const normalizedPhone = phone?.trim() ?? "";
  const validPhone = /^\+[1-9]\d{7,14}$/.test(normalizedPhone);

  return {
    email: validEmail ? `mailto:${normalizedEmail}` : null,
    phone: validPhone ? `tel:${normalizedPhone}` : null,
    whatsapp: validPhone ? `https://wa.me/${normalizedPhone.slice(1)}` : null,
  };
}
