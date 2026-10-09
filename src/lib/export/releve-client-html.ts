import {
  type ClientGroup, type ExportOptions, type ReleveDoc,
  dateFr, isPaid, money, reste, safe, statutLabel, totals,
} from "./releve-client-data";

export type RowItem =
  | { kind: "doc"; doc: ReleveDoc; idx: number }
  | { kind: "group"; group: ClientGroup }
  | { kind: "subtotal"; group: ClientGroup };

const titre = (o: ExportOptions) => (o.client ? "RELEVÉ CLIENT" : "RELEVÉ TOUS LES CLIENTS");
const sujet = (o: ExportOptions) => (o.client ? safe(o.client.nom) : "Tous les clients");

export function buildHeader(options: ExportOptions, isFirst: boolean) {
  const periode = `${dateFr(options.dateDebut)} au ${dateFr(options.dateFin)}`;
  if (!isFirst) {
    return `<table style="width:100%;margin-bottom:10px;border-bottom:2px solid #dc2626;padding-bottom:6px"><tr>
      <td style="font-size:13px;font-weight:bold;color:#dc2626">${titre(options)} (suite)</td>
      <td style="text-align:right;font-size:10px;color:#555">${sujet(options)} — ${periode}</td>
    </tr></table>`;
  }
  const logoUrl = `${window.location.origin}/images/logo-logistiga.png`;
  const today = new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
  return `<table style="width:100%;margin-bottom:14px;border-bottom:3px solid #dc2626;padding-bottom:10px"><tr>
    <td style="vertical-align:top;width:55%">
      <img src="${logoUrl}" alt="Logistiga" crossorigin="anonymous" style="height:50px;width:auto;margin-bottom:4px"/>
      <div style="font-size:9px;color:#666;line-height:1.4">LOGISTIGA SAS — Owendo SETRAG, Libreville (Gabon)<br/>
      Tél : (+241) 011 70 14 35 | info@logistiga.com | www.logistiga.com</div>
    </td>
    <td style="text-align:right;vertical-align:top">
      <div style="font-size:20px;font-weight:bold;color:#dc2626;letter-spacing:.5px">${titre(options)}</div>
      <div style="font-size:11px;color:#444;margin-top:3px">${dateFr(options.dateDebut)} → ${dateFr(options.dateFin)}</div>
      <div style="font-size:9px;color:#888;margin-top:2px">Édité le ${today}</div>
    </td>
  </tr></table>`;
}

export function buildClientBlock(options: ExportOptions, nbClients: number) {
  const c = options.client as (ExportOptions["client"] & Record<string, string | undefined>) | null;
  const info = c
    ? `<div style="font-size:13px;font-weight:bold;color:#111;margin-top:2px">${safe(c.nom)}</div>
       ${c.adresse ? `<div style="font-size:10px;color:#555;margin-top:3px">${safe(c.adresse)}</div>` : ""}
       ${c.telephone || c.email ? `<div style="font-size:10px;color:#555;margin-top:2px">${safe(c.telephone || "")}${c.telephone && c.email ? " · " : ""}${safe(c.email || "")}</div>` : ""}
       ${c.nif ? `<div style="font-size:10px;color:#555;margin-top:2px">NIF : ${safe(c.nif)}</div>` : ""}`
    : `<div style="font-size:13px;font-weight:bold;color:#111;margin-top:2px">Tous les clients — ${nbClients} client(s) concerné(s)</div>`;
  return `<table style="width:100%;margin-bottom:12px;border-collapse:collapse"><tr>
    <td style="width:65%;vertical-align:top;background:#f9fafb;border:1px solid #e5e7eb;padding:10px 12px">
      <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.3px">Client</div>${info}
    </td>
    <td style="width:35%;vertical-align:top;padding-left:10px"><div style="border:1px solid #e5e7eb;padding:8px 10px;background:#fff">
      <div style="font-size:9px;color:#6b7280;text-transform:uppercase">Filtre appliqué</div>
      <div style="font-size:11px;font-weight:600;color:#111;margin-top:2px">${statutLabel(options.filtreStatut)}</div>
    </div></td>
  </tr></table>`;
}

export function buildKpis(docs: ReleveDoc[]) {
  const t = totals(docs);
  const card = (label: string, value: string, color: string, bg: string) => `
    <td style="width:25%;background:${bg};border:1px solid ${color}33;padding:10px 12px;border-radius:4px">
      <div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:.3px">${label}</div>
      <div style="font-size:13px;font-weight:bold;color:${color};margin-top:3px">${value}</div>
    </td>`;
  return `<table style="width:100%;margin-bottom:12px;border-spacing:6px;border-collapse:separate"><tr>
    ${card("Documents", String(docs.length), "#1e40af", "#eff6ff")}
    ${card("Total TTC", money(t.ttc), "#111", "#f9fafb")}
    ${card("Total payé", money(t.paye), "#15803d", "#dcfce7")}
    ${card("Reste à payer", money(t.reste), "#dc2626", "#fef2f2")}
  </tr></table>`;
}

const TH = "padding:6px 5px;color:#fff;font-size:8px;text-transform:uppercase";
export function buildTableHeader() {
  const cols = ["#", "Type", "Numéro", "Date", "Catégorie", "Statut"];
  return `<tr style="background:#1f2937">
    ${cols.map((c) => `<th style="${TH};text-align:left">${c}</th>`).join("")}
    ${["Total TTC", "Payé", "Reste"].map((c) => `<th style="${TH};text-align:right">${c}</th>`).join("")}
    <th style="${TH};text-align:center">Paiement</th>
  </tr>`;
}

const TD = "padding:5px;border-bottom:1px solid #e5e7eb;font-size:9px";
function docRow(doc: ReleveDoc, idx: number) {
  const r = reste(doc);
  const paid = isPaid(doc);
  const bg = idx % 2 === 1 ? "#ffffff" : "#f9fafb";
  const badge = `<span style="display:inline-block;padding:2px 6px;border-radius:3px;font-size:8px;font-weight:600;background:${paid ? "#dcfce7" : "#fee2e2"};color:${paid ? "#166534" : "#991b1b"}">${paid ? "PAYÉ" : "IMPAYÉ"}</span>`;
  const fac = doc.type === "Facture";
  const typeBadge = `<span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:600;background:${fac ? "#dbeafe" : "#fef3c7"};color:${fac ? "#1e40af" : "#92400e"}">${doc.type}</span>`;
  return `<tr style="background:${bg}">
    <td style="${TD};color:#6b7280">${idx}</td><td style="${TD}">${typeBadge}</td>
    <td style="${TD};font-weight:600">${safe(doc.numero)}</td><td style="${TD}">${dateFr(doc.date)}</td>
    <td style="${TD}">${safe(doc.categorie)}</td><td style="${TD}">${safe(doc.statut)}</td>
    <td style="${TD};text-align:right;font-weight:600">${money(doc.montantTtc)}</td>
    <td style="${TD};text-align:right;color:#15803d">${money(doc.montantPaye)}</td>
    <td style="${TD};text-align:right;font-weight:600;color:${r > 0 ? "#dc2626" : "#15803d"}">${money(r)}</td>
    <td style="${TD};text-align:center">${badge}</td>
  </tr>`;
}

export function buildRows(items: RowItem[]) {
  if (!items.length) {
    return `<tr><td colspan="10" style="padding:24px;text-align:center;color:#6b7280;font-style:italic;font-size:10px">Aucun document trouvé pour cette période</td></tr>`;
  }
  return items.map((it) => {
    if (it.kind === "doc") return docRow(it.doc, it.idx);
    if (it.kind === "group") {
      return `<tr style="background:#fee2e2"><td colspan="10" style="padding:6px;font-size:10px;font-weight:bold;color:#991b1b;border-top:1px solid #dc2626">${safe(it.group.clientNom)} — ${it.group.docs.length} document(s)</td></tr>`;
    }
    const t = totals(it.group.docs);
    return `<tr style="background:#f3f4f6;font-weight:bold">
      <td colspan="6" style="${TD};text-align:right">Sous-total ${safe(it.group.clientNom)}</td>
      <td style="${TD};text-align:right">${money(t.ttc)}</td><td style="${TD};text-align:right;color:#15803d">${money(t.paye)}</td>
      <td style="${TD};text-align:right;color:#dc2626">${money(t.reste)}</td><td style="${TD}"></td>
    </tr>`;
  }).join("");
}

export function buildTotals(docs: ReleveDoc[]) {
  const t = totals(docs);
  const B = "padding:8px 6px;border-top:2px solid #dc2626;font-size:10px";
  return `<tr style="background:#fef2f2;font-weight:bold">
    <td colspan="6" style="${B};text-transform:uppercase">Totaux — ${docs.length} document(s)</td>
    <td style="${B};text-align:right">${money(t.ttc)}</td><td style="${B};text-align:right;color:#15803d">${money(t.paye)}</td>
    <td style="${B};text-align:right;color:#dc2626">${money(t.reste)}</td><td style="border-top:2px solid #dc2626"></td>
  </tr>`;
}

export function buildFooter(pageNum: number, totalPages: number, totalDocs: number) {
  return `<table style="width:100%;margin-top:14px;border-top:2px solid #dc2626;padding-top:6px">
    <tr><td style="text-align:left;font-size:8px;color:#888">Document généré automatiquement · LOGISTIGA — Relevé client</td>
    <td style="text-align:right;font-size:8px;color:#888">Page ${pageNum} / ${totalPages} · ${totalDocs} document(s)</td></tr>
    <tr><td colspan="2" style="text-align:center;padding-top:6px;line-height:1.6">
      <div style="font-size:8px;font-weight:bold;color:#333">LOGISTIGA SAS au Capital : 218 000 000 F CFA — Siège Social : Owendo SETRAG (GABON)</div>
      <div style="font-size:8px;color:#555">Tél : (+241) 011 70 14 35 / 011 70 14 34 | B.P. : 18 486 — NIF : 743 107 W — RCCM : 2016B20135</div>
      <div style="font-size:8px;color:#555">Email : info@logistiga.com — Site web : www.logistiga.com</div>
    </td></tr>
  </table>`;
}
