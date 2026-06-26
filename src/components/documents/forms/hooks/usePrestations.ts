import { useCallback, useState } from "react";
import {
  LignePrestationEtendue,
  getInitialPrestationEtendue,
  calculateDaysBetween,
} from "@/types/documents";

interface UsePrestationsOptions {
  /** Callback déclenché quand `lieuDepart` change (Devis). */
  onLieuDepartChange?: (value: string) => void;
  /** Callback déclenché quand `lieuArrivee` change (Devis). */
  onLieuArriveeChange?: (value: string) => void;
}

/**
 * Gestion centralisée d'une liste de prestations (Devis / Ordre / Facture
 * Indépendants). Inclut l'ajout, la suppression, le recalcul automatique
 * de la quantité (jours) et du montant HT, et le forwarding optionnel des
 * lieux pour le mode Devis.
 */
export function usePrestations(
  initial?: LignePrestationEtendue[],
  options: UsePrestationsOptions = {},
) {
  const [prestations, setPrestations] = useState<LignePrestationEtendue[]>(
    initial?.length ? initial : [getInitialPrestationEtendue()],
  );

  const add = useCallback(() => {
    setPrestations((curr) => [
      ...curr,
      { ...getInitialPrestationEtendue(), id: String(Date.now()) },
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    setPrestations((curr) => (curr.length > 1 ? curr.filter((p) => p.id !== id) : curr));
  }, []);

  const change = useCallback(
    (id: string, field: keyof LignePrestationEtendue, value: string | number) => {
      setPrestations((curr) =>
        curr.map((p) => {
          if (p.id !== id) return p;
          const updated: LignePrestationEtendue = {
            ...p,
            [field]: value,
          } as LignePrestationEtendue;
          if (field === "dateDebut" || field === "dateFin") {
            const d = field === "dateDebut" ? String(value) : updated.dateDebut || "";
            const f = field === "dateFin" ? String(value) : updated.dateFin || "";
            if (d && f) {
              updated.quantite = calculateDaysBetween(d, f);
              updated.montantHT = updated.quantite * updated.prixUnitaire;
            }
          }
          if (field === "quantite" || field === "prixUnitaire") {
            updated.montantHT = updated.quantite * updated.prixUnitaire;
          }
          if (field === "lieuDepart") options.onLieuDepartChange?.(String(value));
          if (field === "lieuArrivee") options.onLieuArriveeChange?.(String(value));
          return updated;
        }),
      );
    },
    [options],
  );

  const totalHT = prestations.reduce((s, p) => s + (p.montantHT || 0), 0);

  return { prestations, setPrestations, add, remove, change, totalHT };
}
