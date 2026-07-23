type DetailRow = Record<string, unknown>;

export const asRecord = (value: unknown): DetailRow | undefined =>
  value && typeof value === "object" ? (value as DetailRow) : undefined;

export const asRows = (value: unknown): DetailRow[] =>
  Array.isArray(value) ? value.map(asRecord).filter((row): row is DetailRow => Boolean(row)) : [];

export const readText = (row: DetailRow | undefined, keys: string[]): string => {
  if (!row) return "";
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};

export const readNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const isGenericLotText = (value: string): boolean => {
  const text = value.trim();
  return text === "" || text === "—" || /^lots?[\s_-]*\d+$/i.test(text);
};

const normalizeLotNumber = (value: string): string => {
  const compact = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return compact.startsWith("lot") ? compact.slice(3) : compact;
};

export const mergeLotsAvecOrdre = (factureLots: DetailRow[], ordreLots: DetailRow[]): DetailRow[] => {
  if (factureLots.length === 0) return ordreLots;

  return factureLots.map((lot, index) => {
    const designation = readText(lot, ["designation", "description"]);
    if (!isGenericLotText(designation)) return lot;

    const numero = normalizeLotNumber(readText(lot, ["numero_lot"]));
    const source = ordreLots.find((ordreLot) => {
      return normalizeLotNumber(readText(ordreLot, ["numero_lot"])) === numero;
    }) ?? ordreLots[index];

    const sourceDesignation = readText(source, ["designation", "description"]);
    if (!source || isGenericLotText(sourceDesignation)) return lot;

    return { ...source, ...lot, designation: sourceDesignation, description: sourceDesignation };
  });
};

export const getFactureLotsAvecOrdre = (facture: unknown): DetailRow[] => {
  const factureRecord = asRecord(facture) ?? {};
  const ordre = asRecord(factureRecord.ordre_travail) ?? asRecord(factureRecord.ordreTravail);
  return mergeLotsAvecOrdre(asRows(factureRecord.lots), asRows(ordre?.lots));
};