import html2pdf from "html2pdf.js";
import api from "@/lib/api";
import type { Client, Facture, OrdreTravail, PaginatedResponse } from "@/lib/api/commercial";

export type ReleveFormat = "pdf" | "excel";
export type ReleveStatut = "tous" | "paye" | "impaye";

type ReleveDoc = {
  type: "Facture" | "OT";
  numero: string;
  date: string;
  categorie: string;
  statut: string;
  montantTtc: number;
  montantPaye: number;
};

type ExportOptions = {
  client: Client;
  dateDebut: string;
  dateFin: string;
  filtreStatut: ReleveStatut;
  format: ReleveFormat;
};

const money = (value: number) => `${Math.round(value || 0).toLocaleString("fr-FR")} FCFA`;
const dateFr = (value: string) => (value ? new Date(value).toLocaleDateString("fr-FR") : "-");
const safe = (value?: string | number | null) => String(value ?? "-").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c));
const fileSafe = (value: string) => value.replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "");

async function fetchAll<T>(url: string, params: Record<string, string | number>) {
  const first = await api.get<PaginatedResponse<T>>(url, { params: { ...params, page: 1, per_page: 100 } });
  const items = Array.isArray(first.data.data) ? [...first.data.data] : [];
  const lastPage = Number(first.data.meta?.last_page || 1);

  for (let page = 2; page <= lastPage; page += 1) {
    const response = await api.get<PaginatedResponse<T>>(url, { params: { ...params, page, per_page: 100 } });
    if (Array.isArray(response.data.data)) items.push(...response.data.data);
  }

  return items;
}

const isPaid = (doc: ReleveDoc) => doc.montantPaye + 1 >= doc.montantTtc;
const keepByStatus = (doc: ReleveDoc, filter: ReleveStatut) => {
  if (filter === "tous") return true;
  return filter === "paye" ? isPaid(doc) : !isPaid(doc);
};

const normalizeFacture = (f: Facture): ReleveDoc => ({
  type: "Facture",
  numero: f.numero,
  date: f.date_facture || f.date_creation || f.date || "",
  categorie: f.categorie || "-",
  statut: f.statut || "-",
  montantTtc: Number(f.montant_ttc || 0),
  montantPaye: Number(f.montant_paye || 0),
});

const normalizeOrdre = (o: OrdreTravail): ReleveDoc => ({
  type: "OT",
  numero: o.numero,
  date: o.date_creation || o.date || "",
  categorie: o.categorie || o.type_operation || "-",
  statut: o.statut || "-",
  montantTtc: Number(o.montant_ttc || 0),
  montantPaye: Number(o.montant_paye || 0),
});

export async function fetchClientStatement(options: ExportOptions) {
  const params = {
    client_id: String(options.client.id),
    date_debut: options.dateDebut,
    date_fin: options.dateFin,
  };

  const [factures, ordres] = await Promise.all([
    fetchAll<Facture>("/factures", params),
    fetchAll<OrdreTravail>("/ordres-travail", params),
  ]);

  return [...factures.map(normalizeFacture), ...ordres.map(normalizeOrdre)]
    .filter((doc) => keepByStatus(doc, options.filtreStatut))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

function rowsHtml(docs: ReleveDoc[]) {
  if (!docs.length) return `<tr><td colspan="9" class="empty">Aucun document trouvé</td></tr>`;
  return docs.map((doc) => {
    const reste = Math.max(0, doc.montantTtc - doc.montantPaye);
    return `<tr>
      <td>${safe(doc.type)}</td><td>${safe(doc.numero)}</td><td>${dateFr(doc.date)}</td>
      <td>${safe(doc.categorie)}</td><td>${safe(doc.statut)}</td>
      <td class="num">${money(doc.montantTtc)}</td><td class="num">${money(doc.montantPaye)}</td>
      <td class="num">${money(reste)}</td><td>${isPaid(doc) ? "Payé" : "Impayé"}</td>
    </tr>`;
  }).join("");
}

function buildHtml(options: ExportOptions, docs: ReleveDoc[]) {
  const totalTtc = docs.reduce((sum, doc) => sum + doc.montantTtc, 0);
  const totalPaye = docs.reduce((sum, doc) => sum + doc.montantPaye, 0);
  const label = options.filtreStatut === "tous" ? "Tous les documents" : options.filtreStatut === "paye" ? "Documents payés" : "Documents impayés";

  return `<!doctype html><html><head><meta charset="UTF-8"><style>
    body{font-family:Arial,sans-serif;color:#111827;padding:24px}.header{border-bottom:3px solid #e11d48;padding-bottom:14px;margin-bottom:18px}
    h1{margin:0;color:#e11d48;font-size:24px}.muted{color:#6b7280;font-size:12px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}
    .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px}.card b{display:block;font-size:18px;margin-top:6px}
    table{width:100%;border-collapse:collapse;font-size:11px}th{background:#f3f4f6;text-align:left;color:#374151}th,td{border:1px solid #e5e7eb;padding:7px}.num{text-align:right}.empty{text-align:center;color:#6b7280;padding:18px}
  </style></head><body>
    <div class="header"><h1>Relevé client</h1><div class="muted">LOGISTIGA — Généré le ${dateFr(new Date().toISOString())}</div></div>
    <p><strong>Client :</strong> ${safe(options.client.nom)}<br/><strong>Période :</strong> ${dateFr(options.dateDebut)} au ${dateFr(options.dateFin)}<br/><strong>Filtre :</strong> ${label}</p>
    <div class="grid"><div class="card">Documents<b>${docs.length}</b></div><div class="card">Total TTC<b>${money(totalTtc)}</b></div><div class="card">Reste à payer<b>${money(Math.max(0, totalTtc - totalPaye))}</b></div></div>
    <table><thead><tr><th>Type</th><th>Numéro</th><th>Date</th><th>Catégorie</th><th>Statut</th><th>Total TTC</th><th>Payé</th><th>Reste</th><th>Paiement</th></tr></thead><tbody>${rowsHtml(docs)}</tbody></table>
  </body></html>`;
}

function downloadBlob(content: BlobPart[], type: string, filename: string) {
  const url = URL.createObjectURL(new Blob(content, { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadClientStatement(options: ExportOptions) {
  const docs = await fetchClientStatement(options);
  const html = buildHtml(options, docs);
  const filename = `releve_${fileSafe(options.client.nom)}_${options.dateDebut}_${options.dateFin}`;

  if (options.format === "excel") {
    downloadBlob(["\ufeff", html], "application/vnd.ms-excel;charset=utf-8", `${filename}.xls`);
    return docs.length;
  }

  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    await html2pdf().set({ margin: 8, filename: `${filename}.pdf`, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
  return docs.length;
}