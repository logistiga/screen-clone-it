export function openWhatsAppShare(text: string, phone?: string) {
  // 1. Nettoyage approfondi des caractères
  const safeText = text
    .replace(/\u202F/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\uFFFD/g, ""); // Supprime le caractère  visible dans votre capture

  const encodedText = encodeURIComponent(safeText);

  // 2. Formatage du numéro (Gabon)
  let cleanPhone = (phone || "").replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
  if (cleanPhone && cleanPhone.length === 8) cleanPhone = "241" + cleanPhone;
  if (cleanPhone && cleanPhone.length === 9 && cleanPhone.startsWith("241")) {
    // Déjà au bon format
  }

  // 3. Utilisation de l'URL "api.whatsapp.com" pour une meilleure compatibilité Desktop
  // ou "wa.me" pour mobile. api.whatsapp.com est parfois plus stable pour les redirections.
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  // 4. LA FIX : Forcer l'ouverture hors de l'iFrame
  try {
    // On essaie d'ouvrir dans une nouvelle fenêtre
    const win = window.open(url, "_blank", "noopener,noreferrer");

    // Si le bloqueur de popup bloque 'win', ou si on est dans une iframe restrictive
    if (!win || win.closed || typeof win.closed === "undefined") {
      // On utilise top.location pour sortir de l'éventuelle iFrame de Lovable/Preview
      if (window.top) {
        window.top.location.href = url;
      } else {
        window.location.href = url;
      }
    }
  } catch (e) {
    // Repli sécurisé : redirection directe
    window.location.href = url;
  }

  return url;
}
