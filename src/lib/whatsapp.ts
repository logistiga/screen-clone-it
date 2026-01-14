export function openWhatsAppShare(text: string, phone?: string) {
  // Ouvrir immédiatement pour éviter popup blocked
  const win = window.open("", "_blank", "noopener,noreferrer");

  // Nettoyage caractères spéciaux invisibles
  const safeText = text.replace(/\u202F/g, " ").replace(/\u00A0/g, " ");
  const encodedText = encodeURIComponent(safeText);

  // Nettoyage numéro
  let cleanPhone = (phone || "").replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
  if (cleanPhone && cleanPhone.length <= 9) cleanPhone = "241" + cleanPhone;

  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  if (win) win.location.href = url;
  else window.location.href = url;

  return url;
}
