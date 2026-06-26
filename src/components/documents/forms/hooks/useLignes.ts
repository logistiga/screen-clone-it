import { useCallback, useState } from "react";
import type { DocumentLigne } from "../types";

/**
 * Gestion partagée des lignes Devis / Ordre / Facture pour les pages
 * parentes. Recalcule automatiquement le montant à partir de
 * `quantite * prix*`.
 */
export function useLignes<T extends DocumentLigne>(
  initial: T[],
  createBlank: () => T,
  amountField: keyof T = "montant" as keyof T,
  priceField: keyof T = "prix_unitaire" as keyof T,
) {
  const [lignes, setLignes] = useState<T[]>(
    initial.length ? initial : [createBlank()],
  );

  const add = useCallback(() => {
    setLignes((curr) => [...curr, { ...createBlank(), id: String(Date.now()) }]);
  }, [createBlank]);

  const remove = useCallback((id: string) => {
    setLignes((curr) => (curr.length > 1 ? curr.filter((l) => l.id !== id) : curr));
  }, []);

  const change = useCallback(
    (id: string, field: keyof T, value: string | number) => {
      setLignes((curr) =>
        curr.map((l) => {
          if (l.id !== id) return l;
          const updated = { ...l, [field]: value } as T;
          const qty = Number((updated as unknown as Record<string, unknown>).quantite) || 0;
          const price = Number((updated as unknown as Record<string, unknown>)[priceField as string]) || 0;
          (updated as unknown as Record<string, unknown>)[amountField as string] = qty * price;
          return updated;
        }),
      );
    },
    [amountField, priceField],
  );

  const totalHT = lignes.reduce(
    (s, l) => s + (Number((l as unknown as Record<string, unknown>)[amountField as string]) || 0),
    0,
  );

  return { lignes, setLignes, add, remove, change, totalHT };
}
