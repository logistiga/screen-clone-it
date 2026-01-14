export function openWhatsAppShare(text: string, phone?: string) {
  const encodedText = encodeURIComponent(text);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  let cleanPhone = (phone || "").replace(/[^0-9]/g, "");

  // Option Gabon
  if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
  if (cleanPhone && cleanPhone.length <= 9) cleanPhone = "241" + cleanPhone;

  const url = cleanPhone
    ? isMobile
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : isMobile
      ? `https://wa.me/?text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`;

  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) window.location.href = url;

  return url;
}
