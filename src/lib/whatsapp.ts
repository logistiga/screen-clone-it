export function openWhatsAppShare(text: string, phone?: string) {
  const encodedText = encodeURIComponent(text);

  let cleanPhone = (phone || "").replace(/[^0-9]/g, "");

  // Option Gabon
  if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
  if (cleanPhone && cleanPhone.length <= 9) cleanPhone = "241" + cleanPhone;

  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) window.location.href = url;

  return url;
}
