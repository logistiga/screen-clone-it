export function openWhatsAppShare(text: string, phone?: string) {
  // Nettoyage caractères spéciaux invisibles
  const safeText = text.replace(/\u202F/g, " ").replace(/\u00A0/g, " ");
  const encodedText = encodeURIComponent(safeText);

  // Nettoyage numéro + préfixe Gabon
  let cleanPhone = (phone || "").replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
  if (cleanPhone && cleanPhone.length <= 9) cleanPhone = "241" + cleanPhone;

  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  // Essaye d'ouvrir un nouvel onglet; si bloqué (iframe/popup), bascule sur la navigation
  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) window.location.href = url;
  } catch {
    window.location.href = url;
  }

  return url;
}

