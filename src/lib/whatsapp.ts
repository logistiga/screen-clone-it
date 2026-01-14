export type WhatsAppShareParams = {
  /** Message brut (non encodé) */
  text: string;
  /** Téléphone (peut contenir +, espaces, etc.) */
  phone?: string;
};

export function normalizeWhatsAppPhone(phone?: string) {
  // WhatsApp attend le numéro au format international sans "+" ni espaces.
  return (phone ?? "").replace(/[^0-9]/g, "");
}

function isMobileUA() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}

/**
 * Construit une URL de partage WhatsApp.
 * - Desktop: utilise web.whatsapp.com pour éviter la redirection vers api.whatsapp.com (souvent bloquée)
 * - Mobile: utilise wa.me (lien universel)
 */
export function buildWhatsAppShareUrl({ text, phone }: WhatsAppShareParams) {
  const encodedText = encodeURIComponent(text);
  const cleanPhone = normalizeWhatsAppPhone(phone);

  if (!isMobileUA()) {
    return cleanPhone
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`;
  }

  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
}

export function openWhatsAppShare(params: WhatsAppShareParams) {
  const url = buildWhatsAppShareUrl(params);
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
}
