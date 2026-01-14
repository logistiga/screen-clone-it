/**
 * Ouvre WhatsApp avec un message pré-rempli.
 * L'utilisateur choisit le contact lui-même.
 */
export function openWhatsAppShare(text: string) {
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/?text=${encodedText}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
}
