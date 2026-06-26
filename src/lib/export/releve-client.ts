import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { fetchAllPaginated } from "@/services/api";
import type { Client, Facture, OrdreTravail } from "@/lib/api/commercial";

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
const htmlEntities: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;" };
const safe = (value?: string | number | null) =>
  String(value ?? "-").replace(/[<>&]/g, (c) => htmlEntities[c] || c);
const fileSafe = (value: string) => value.replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "");

async function fetchAll<T>(url: string, params: Record<string, string | number>) {
  return fetchAllPaginated<T>(url, params, 100);
}

const isPaid = (doc: ReleveDoc) => doc.montantPaye + 1 >= doc.montantTtc;
const keepByStatus = (doc: ReleveDoc, filter: ReleveStatut) => {
  if (filter === "tous") return true;
  return filter === "paye" ? isPaid(doc) : !isPaid(doc);
};
const keepByPeriod = (doc: ReleveDoc, start: string, end: string) => {
  const date = (doc.date || "").slice(0, 10);
  return !!date && date >= start && date <= end;
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
const isConvertedOrdre = (o: OrdreTravail) =>
  !!o.facture || ["facture", "facturé", "Facturé"].includes(o.statut || "");

export async function fetchClientStatement(options: ExportOptions) {
  const params = { client_id: String(options.client.id) };
  const [factures, ordres] = await Promise.all([
    fetchAll<Facture>("/factures", params),
    fetchAll<OrdreTravail>("/ordres-travail", params),
  ]);
  return [
    ...factures.map(normalizeFacture),
    ...ordres.filter((o) => !isConvertedOrdre(o)).map(normalizeOrdre),
  ]
    .filter((doc) => keepByPeriod(doc, options.dateDebut, options.dateFin))
    .filter((doc) => keepByStatus(doc, options.filtreStatut))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

const statutLabel = (filter: ReleveStatut) =>
  filter === "tous" ? "Tous les documents" : filter === "paye" ? "Documents payés" : "Documents impayés";

function buildHeader(options: ExportOptions, isFirst: boolean) {
  const logoUrl = `${window.location.origin}/images/logo-logistiga.png`;
  const today = new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
  if (!isFirst) {
    return `<table style="width:100%;margin-bottom:10px;border-bottom:2px solid #dc2626;padding-bottom:6px">
      <tr>
        <td style="font-size:13px;font-weight:bold;color:#dc2626">RELEVÉ CLIENT (suite)</td>
        <td style="text-align:right;font-size:10px;color:#555">${safe(options.client.nom)} — ${dateFr(options.dateDebut)} au ${dateFr(options.dateFin)}</td>
      </tr>
    </table>`;
  }
  return `<table style="width:100%;margin-bottom:14px;border-bottom:3px solid #dc2626;padding-bottom:10px">
    <tr>
      <td style="vertical-align:top;width:55%">
        <img src="${logoUrl}" alt="Logistiga" crossorigin="anonymous" style="height:50px;width:auto;margin-bottom:4px"/>
        <div style="font-size:9px;color:#666;line-height:1.4">
          LOGISTIGA SAS — Owendo SETRAG, Libreville (Gabon)<br/>
          Tél : (+241) 011 70 14 35 | info@logistiga.com | www.logistiga.com
        </div>
      </td>
      <td style="text-align:right;vertical-align:top">
        <div style="font-size:20px;font-weight:bold;color:#dc2626;letter-spacing:.5px">RELEVÉ CLIENT</div>
        <div style="font-size:11px;color:#444;margin-top:3px">${dateFr(options.dateDebut)} → ${dateFr(options.dateFin)}</div>
        <div style="font-size:9px;color:#888;margin-top:2px">Édité le ${today}</div>
      </td>
    </tr>
  </table>`;
}

function buildClientBlock(options: ExportOptions) {
  const client = options.client as any;
  return `<table style="width:100%;margin-bottom:12px;border-collapse:collapse">
    <tr>
      <td style="width:65%;vertical-align:top;background:#f9fafb;border:1px solid #e5e7eb;padding:10px 12px">
        <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.3px">Client</div>
        <div style="font-size:13px;font-weight:bold;color:#111;margin-top:2px">${safe(client?.nom)}</div>
        ${client?.adresse ? `<div style="font-size:10px;color:#555;margin-top:3px">${safe(client.adresse)}</div>` : ""}
        ${client?.telephone || client?.email
          ? `<div style="font-size:10px;color:#555;margin-top:2px">${safe(client?.telephone || "")}${client?.telephone && client?.email ? " · " : ""}${safe(client?.email || "")}</div>`
          : ""}
        ${client?.nif ? `<div style="font-size:10px;color:#555;margin-top:2px">NIF : ${safe(client.nif)}</div>` : ""}
      </td>
      <td style="width:35%;vertical-align:top;padding-left:10px">
        <div style="border:1px solid #e5e7eb;padding:8px 10px;background:#fff">
          <div style="font-size:9px;color:#6b7280;text-transform:uppercase">Filtre appliqué</div>
          <div style="font-size:11px;font-weight:600;color:#111;margin-top:2px">${statutLabel(options.filtreStatut)}</div>
        </div>
      </td>
    </tr>
  </table>`;
}

function buildKpis(docs: ReleveDoc[]) {
  const totalTtc = docs.reduce((s, d) => s + d.montantTtc, 0);
  const totalPaye = docs.reduce((s, d) => s + d.montantPaye, 0);
  const reste = Math.max(0, totalTtc - totalPaye);
  const card = (label: string, value: string, color: string, bg: string) => `
    <td style="width:25%;background:${bg};border:1px solid ${color}33;padding:10px 12px;border-radius:4px">
      <div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:.3px">${label}</div>
      <div style="font-size:13px;font-weight:bold;color:${color};margin-top:3px">${value}</div>
    </td>`;
  return `<table style="width:100%;margin-bottom:12px;border-spacing:6px;border-collapse:separate">
    <tr>
      ${card("Documents", String(docs.length), "#1e40af", "#eff6ff")}
      ${card("Total TTC", money(totalTtc), "#111", "#f9fafb")}
      ${card("Total payé", money(totalPaye), "#15803d", "#dcfce7")}
      ${card("Reste à payer", money(reste), "#dc2626", "#fef2f2")}
    </tr>
  </table>`;
}

function buildTableHeader() {
  return `<tr style="background:#1f2937">
    <th style="padding:6px 5px;text-align:left;color:#fff;font-size:8px;text-transform:uppercase;letter-spacing:.3px;width:24px">#</th>
    <th style="padding:6px 5px;text-align:left;color:#fff;font-size:8px;text-transform:uppercase">Type</th>
    <th style="padding:6px 5px;text-align:left;color:#fff;font-size:8px;text-transform:uppercase">Numéro</th>
    <th style="padding:6px 5px;text-align:left;color:#fff;font-size:8px;text-transform:uppercase">Date</th>
    <th style="padding:6px 5px;text-align:left;color:#fff;font-size:8px;text-transform:uppercase">Catégorie</th>
    <th style="padding:6px 5px;text-align:left;color:#fff;font-size:8px;text-transform:uppercase">Statut</th>
    <th style="padding:6px 5px;text-align:right;color:#fff;font-size:8px;text-transform:uppercase">Total TTC</th>
    <th style="padding:6px 5px;text-align:right;color:#fff;font-size:8px;text-transform:uppercase">Payé</th>
    <th style="padding:6px 5px;text-align:right;color:#fff;font-size:8px;text-transform:uppercase">Reste</th>
    <th style="padding:6px 5px;text-align:center;color:#fff;font-size:8px;text-transform:uppercase">Paiement</th>
  </tr>`;
}

function buildRows(rows: ReleveDoc[], startIdx: number) {
  if (!rows.length) {
    return `<tr><td colspan="10" style="padding:24px;text-align:center;color:#6b7280;font-style:italic;font-size:10px">Aucun document trouvé pour cette période</td></tr>`;
  }
  return rows.map((doc, i) => {
    const idx = startIdx + i + 1;
    const reste = Math.max(0, doc.montantTtc - doc.montantPaye);
    const paid = isPaid(doc);
    const bg = i % 2 === 0 ? "#ffffff" : "#f9fafb";
    const badge = `<span style="display:inline-block;padding:2px 6px;border-radius:3px;font-size:8px;font-weight:600;background:${paid ? "#dcfce7" : "#fee2e2"};color:${paid ? "#166534" : "#991b1b"}">${paid ? "PAYÉ" : "IMPAYÉ"}</span>`;
    const typeBadge = `<span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:600;background:${doc.type === "Facture" ? "#dbeafe" : "#fef3c7"};color:${doc.type === "Facture" ? "#1e40af" : "#92400e"}">${doc.type}</span>`;
    return `<tr style="background:${bg}">
      <td style="padding:5px;border-bottom:1px solid #e5e7eb;font-size:9px;color:#6b7280">${idx}</td>
      <td style="padding:5px;border-bottom:1px solid #e5e7eb">${typeBadge}</td>
      <td style="padding:5px;border-bottom:1px solid #e5e7eb;font-size:9px;font-weight:600">${safe(doc.numero)}</td>
      <td style="padding:5px;border-bottom:1px solid #e5e7eb;font-size:9px">${dateFr(doc.date)}</td>
      <td style="padding:5px;border-bottom:1px solid #e5e7eb;font-size:9px">${safe(doc.categorie)}</td>
      <td style="padding:5px;border-bottom:1px solid #e5e7eb;font-size:9px">${safe(doc.statut)}</td>
      <td style="padding:5px;border-bottom:1px solid #e5e7eb;font-size:9px;text-align:right;font-weight:600">${money(doc.montantTtc)}</td>
      <td style="padding:5px;border-bottom:1px solid #e5e7eb;font-size:9px;text-align:right;color:#15803d">${money(doc.montantPaye)}</td>
      <td style="padding:5px;border-bottom:1px solid #e5e7eb;font-size:9px;text-align:right;color:${reste > 0 ? "#dc2626" : "#15803d"};font-weight:600">${money(reste)}</td>
      <td style="padding:5px;border-bottom:1px solid #e5e7eb;text-align:center">${badge}</td>
    </tr>`;
  }).join("");
}

function buildTotals(docs: ReleveDoc[]) {
  const totalTtc = docs.reduce((s, d) => s + d.montantTtc, 0);
  const totalPaye = docs.reduce((s, d) => s + d.montantPaye, 0);
  const reste = Math.max(0, totalTtc - totalPaye);
  return `<tr style="background:#fef2f2;font-weight:bold">
    <td colspan="6" style="padding:8px 6px;border-top:2px solid #dc2626;font-size:10px;text-transform:uppercase;letter-spacing:.3px">Totaux — ${docs.length} document(s)</td>
    <td style="padding:8px 6px;border-top:2px solid #dc2626;text-align:right;font-size:10px">${money(totalTtc)}</td>
    <td style="padding:8px 6px;border-top:2px solid #dc2626;text-align:right;font-size:10px;color:#15803d">${money(totalPaye)}</td>
    <td style="padding:8px 6px;border-top:2px solid #dc2626;text-align:right;font-size:10px;color:#dc2626">${money(reste)}</td>
    <td style="border-top:2px solid #dc2626"></td>
  </tr>`;
}

function buildFooter(pageNum: number, totalPages: number, totalDocs: number) {
  return `<table style="width:100%;margin-top:14px;border-top:2px solid #dc2626;padding-top:6px">
    <tr>
      <td style="text-align:left;font-size:8px;color:#888">Document généré automatiquement · LOGISTIGA — Relevé client</td>
      <td style="text-align:right;font-size:8px;color:#888">Page ${pageNum} / ${totalPages} · ${totalDocs} document(s)</td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:center;padding-top:6px;line-height:1.6">
        <div style="font-size:8px;font-weight:bold;color:#333">LOGISTIGA SAS au Capital : 218 000 000 F CFA — Siège Social : Owendo SETRAG (GABON)</div>
        <div style="font-size:8px;color:#555">Tél : (+241) 011 70 14 35 / 011 70 14 34 | B.P. : 18 486 — NIF : 743 107 W — RCCM : 2016B20135</div>
        <div style="font-size:8px;color:#555">Email : info@logistiga.com — Site web : www.logistiga.com</div>
      </td>
    </tr>
  </table>`;
}

async function renderPagesToPdf(options: ExportOptions, docs: ReleveDoc[], filename: string) {
  const ROWS_FIRST = 18;
  const ROWS_OTHER = 28;

  const pages: ReleveDoc[][] = [];
  if (docs.length === 0) {
    pages.push([]);
  } else {
    pages.push(docs.slice(0, ROWS_FIRST));
    let offset = ROWS_FIRST;
    while (offset < docs.length) {
      pages.push(docs.slice(offset, offset + ROWS_OTHER));
      offset += ROWS_OTHER;
    }
  }
  const totalPages = pages.length;
  const pdf = new jsPDF("p", "mm", "a4");

  for (let p = 0; p < pages.length; p++) {
    const isFirst = p === 0;
    const isLast = p === pages.length - 1;
    const startIdx = isFirst ? 0 : ROWS_FIRST + (p - 1) * ROWS_OTHER;

    const html = `
      <div style="font-family:Arial,sans-serif;padding:15px 20px;color:#1a1a1a;background:#fff;width:760px;min-height:1060px;display:flex;flex-direction:column">
        ${buildHeader(options, isFirst)}
        ${isFirst ? buildClientBlock(options) : ""}
        ${isFirst ? buildKpis(docs) : ""}
        <div style="flex:1">
          <table style="width:100%;border-collapse:collapse">
            <thead>${buildTableHeader()}</thead>
            <tbody>${buildRows(pages[p], startIdx)}</tbody>
            ${isLast && docs.length > 0 ? `<tfoot>${buildTotals(docs)}</tfoot>` : ""}
          </table>
        </div>
        ${buildFooter(p + 1, totalPages, docs.length)}
      </div>`;

    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.background = "#fff";
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/png");
      if (p > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } finally {
      document.body.removeChild(container);
    }
  }
  pdf.save(`${filename}.pdf`);
}

function buildExcelHtml(options: ExportOptions, docs: ReleveDoc[]) {
  const totalTtc = docs.reduce((s, d) => s + d.montantTtc, 0);
  const totalPaye = docs.reduce((s, d) => s + d.montantPaye, 0);
  const reste = Math.max(0, totalTtc - totalPaye);
  const rows = docs.map((d, i) => {
    const r = Math.max(0, d.montantTtc - d.montantPaye);
    return `<tr><td>${i + 1}</td><td>${safe(d.type)}</td><td>${safe(d.numero)}</td><td>${dateFr(d.date)}</td><td>${safe(d.categorie)}</td><td>${safe(d.statut)}</td><td>${money(d.montantTtc)}</td><td>${money(d.montantPaye)}</td><td>${money(r)}</td><td>${isPaid(d) ? "Payé" : "Impayé"}</td></tr>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="UTF-8"></head><body>
    <h2>Relevé client — ${safe(options.client.nom)}</h2>
    <p>Période : ${dateFr(options.dateDebut)} au ${dateFr(options.dateFin)} · Filtre : ${statutLabel(options.filtreStatut)}</p>
    <table border="1" cellspacing="0" cellpadding="4">
      <thead><tr><th>#</th><th>Type</th><th>Numéro</th><th>Date</th><th>Catégorie</th><th>Statut</th><th>Total TTC</th><th>Payé</th><th>Reste</th><th>Paiement</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="6"><b>Totaux</b></td><td>${money(totalTtc)}</td><td>${money(totalPaye)}</td><td>${money(reste)}</td><td></td></tr></tfoot>
    </table>
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
  const filename = `releve_${fileSafe(options.client.nom)}_${options.dateDebut}_${options.dateFin}`;

  if (options.format === "excel") {
    downloadBlob(["\ufeff", buildExcelHtml(options, docs)], "application/vnd.ms-excel;charset=utf-8", `${filename}.xls`);
    return docs.length;
  }

  await renderPagesToPdf(options, docs, filename);
  return docs.length;
}
