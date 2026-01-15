export function openWhatsAppShare(text: string, phone?: string) {
  // 1. Nettoyage approfondi des caractères problématiques
  const safeText = text
    .replace(/\u202F/g, " ")      // Narrow non-breaking space
    .replace(/\u00A0/g, " ")      // Non-breaking space
    .replace(/\uFFFD/g, "");      // Caractère de remplacement

  const encodedText = encodeURIComponent(safeText);

  // 2. Formatage du numéro (Gabon : +241)
  let cleanPhone = (phone || "").replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
  if (cleanPhone && cleanPhone.length <= 9) cleanPhone = "241" + cleanPhone;

  // 3. Utilisation de l'URL directe api.whatsapp.com (plus robuste que wa.me)
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  // 4. LA CORRECTION : Forcer la sortie de l'iFrame (Lovable preview)
  // On essaie d'abord d'ouvrir dans un nouvel onglet
  const win = window.open(url, "_blank", "noopener,noreferrer");

  // Si le popup est bloqué ou si on est dans une iframe restrictive
  if (!win || win.closed || typeof win.closed === "undefined") {
    // window.top.location.href est la clé pour sortir de la prévisualisation Lovable
    try {
      if (window.top) {
        window.top.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch {
      // Repli si l'accès au 'top' est interdit par le navigateur (cross-origin)
      window.location.href = url;
    }
  }

  return url;
}
