/** Retire la référence recopiée en fin de description (affichage seul, données inchangées). */
export function descriptionSansReference(description: string | null | undefined, reference: string | null | undefined): string {
  const texte = (description ?? "").trim();
  const ref = (reference ?? "").trim();
  if (!ref) return texte;
  for (const suffixe of [` - ${ref}`, ` (N°${ref})`]) {
    if (texte.endsWith(suffixe)) return texte.slice(0, -suffixe.length).trim();
  }
  return texte;
}
