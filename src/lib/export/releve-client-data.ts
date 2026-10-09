import { fetchAllPaginated } from "@/services/api";
import type { Client, Facture, OrdreTravail } from "@/lib/api/commercial";

export type ReleveFormat = "pdf" | "excel";
export type ReleveStatut = "tous" | "paye" | "impaye";

export type ReleveDoc = {
  type: "Facture" | "OT";
  clientId: string;
  clientNom: string;
  numero: string;
  date: string;
  categorie: string;
  statut: string;
  montantTtc: number;
  montantPaye: number;
};

/** client = null → relevé de tous les clients. */
export type ExportOptions = {
  client: Client | null;
  dateDebut: string;
  dateFin: string;
  filtreStatut: ReleveStatut;
  format: ReleveFormat;
  /** ordres = tous les OT (y compris transférés en facture) ; factures = factures seules. */
  source?: ReleveSource;
};
export type ReleveSource = "tous" | "ordres" | "factures";

export const money = (value: number) => `${Math.round(value || 0).toLocaleString("fr-FR")} FCFA`;
export const dateFr = (value: string) => (value ? new Date(value).toLocaleDateString("fr-FR") : "-");
const htmlEntities: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;" };
export const safe = (value?: string | number | null) =>
  String(value ?? "-").replace(/[<>&]/g, (c) => htmlEntities[c] || c);

export const reste = (d: ReleveDoc) => Math.max(0, Math.round(d.montantTtc) - Math.round(d.montantPaye));
export const isPaid = (d: ReleveDoc) => reste(d) <= 0;
export const totals = (docs: ReleveDoc[]) => {
  const ttc = docs.reduce((s, d) => s + Math.round(d.montantTtc), 0);
  const paye = docs.reduce((s, d) => s + Math.round(d.montantPaye), 0);
  return { ttc, paye, reste: docs.reduce((s, d) => s + reste(d), 0) };
};

export const statutLabel = (filter: ReleveStatut) =>
  filter === "tous" ? "Tous les documents" : filter === "paye" ? "Documents payés" : "Documents impayés";

const ANNULES = ["annulee", "annulée", "Annulée", "annule", "annulé", "Annulé"];
const estAnnule = (statut?: string) => ANNULES.includes(statut || "");

const keepByStatus = (doc: ReleveDoc, filter: ReleveStatut) =>
  filter === "tous" ? true : filter === "paye" ? isPaid(doc) : !isPaid(doc);
const keepByPeriod = (doc: ReleveDoc, start: string, end: string) => {
  const date = (doc.date || "").slice(0, 10);
  return !!date && date >= start && date <= end;
};

const clientNom = (c?: Client, id?: string) => c?.nom || (id ? `Client #${id}` : "Client inconnu");

const normalizeFacture = (f: Facture): ReleveDoc => ({
  type: "Facture",
  clientId: String(f.client_id ?? ""),
  clientNom: clientNom(f.client, f.client_id),
  numero: f.numero,
  date: f.date_facture || f.date_creation || f.date || "",
  categorie: f.categorie || "-",
  statut: f.statut || "-",
  montantTtc: Number(f.montant_ttc || 0),
  montantPaye: Number(f.montant_paye || 0),
});

const normalizeOrdre = (o: OrdreTravail): ReleveDoc => ({
  type: "OT",
  clientId: String(o.client_id ?? ""),
  clientNom: clientNom(o.client, o.client_id),
  numero: o.numero,
  date: o.date_creation || o.date || "",
  categorie: o.categorie || o.type_operation || "-",
  statut: o.statut || "-",
  montantTtc: Number(o.montant_ttc || 0),
  montantPaye: Number(o.montant_paye || 0),
});

const isConvertedOrdre = (o: OrdreTravail) =>
  !!o.facture || ["facture", "facturé", "Facturé"].includes(o.statut || "");

const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export async function fetchClientStatement(options: ExportOptions): Promise<ReleveDoc[]> {
  // Tous les clients : on restreint côté serveur à une période un peu élargie
  // (le serveur filtre sur la date de création), puis on affine ici.
  const params: Record<string, string> = options.client
    ? { client_id: String(options.client.id) }
    : { date_debut: shiftDate(options.dateDebut, -62), date_fin: shiftDate(options.dateFin, 1) };
  const source = options.source || "tous";
  const [factures, ordres] = await Promise.all([
    source === "ordres" ? Promise.resolve([] as Facture[]) : fetchAllPaginated<Facture>("/factures", params, 100),
    source === "factures" ? Promise.resolve([] as OrdreTravail[]) : fetchAllPaginated<OrdreTravail>("/ordres-travail", params, 100),
  ]);
  return [
    ...factures.filter((f) => !estAnnule(f.statut)).map(normalizeFacture),
    ...ordres
      .filter((o) => (source === "ordres" || !isConvertedOrdre(o)) && !estAnnule(o.statut))
      .map(normalizeOrdre),
  ]
    .filter((doc) => keepByPeriod(doc, options.dateDebut, options.dateFin))
    .filter((doc) => keepByStatus(doc, options.filtreStatut))
    .sort((a, b) =>
      options.client
        ? (b.date || "").localeCompare(a.date || "")
        : a.clientNom.localeCompare(b.clientNom, "fr") || (a.date || "").localeCompare(b.date || ""),
    );
}

export type ClientGroup = { clientId: string; clientNom: string; docs: ReleveDoc[] };

export function groupByClient(docs: ReleveDoc[]): ClientGroup[] {
  const map = new Map<string, ClientGroup>();
  for (const d of docs) {
    const key = d.clientId || d.clientNom;
    if (!map.has(key)) map.set(key, { clientId: d.clientId, clientNom: d.clientNom, docs: [] });
    map.get(key)!.docs.push(d);
  }
  return [...map.values()];
}
