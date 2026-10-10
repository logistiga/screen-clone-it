import {
  type ExportOptions, type ReleveDoc,
  dateFr, fetchClientStatement, groupByClient, isPaid, money, reste, safe, statutLabel, totals,
} from "./releve-client-data";
import {
  type RowItem,
  buildClientBlock, buildFooter, buildHeader, buildKpis, buildRows, buildTableHeader, buildTotals,
} from "./releve-client-html";

export type { ReleveFormat, ReleveStatut } from "./releve-client-data";
export { fetchClientStatement } from "./releve-client-data";

const fileSafe = (value: string) => value.replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "");

function buildItems(options: ExportOptions, docs: ReleveDoc[]): RowItem[] {
  if (options.client) return docs.map((doc, i) => ({ kind: "doc", doc, idx: i + 1 }));
  const items: RowItem[] = [];
  let idx = 0;
  for (const group of groupByClient(docs)) {
    items.push({ kind: "group", group });
    for (const doc of group.docs) items.push({ kind: "doc", doc, idx: ++idx });
    items.push({ kind: "subtotal", group });
  }
  return items;
}

function paginate(items: RowItem[]) {
  const ROWS_FIRST = 18;
  const ROWS_OTHER = 28;
  if (!items.length) return [[]] as RowItem[][];
  const pages: RowItem[][] = [items.slice(0, ROWS_FIRST)];
  for (let o = ROWS_FIRST; o < items.length; o += ROWS_OTHER) pages.push(items.slice(o, o + ROWS_OTHER));
  return pages;
}

async function renderPagesToPdf(options: ExportOptions, docs: ReleveDoc[], filename: string) {
  const pages = paginate(buildItems(options, docs));
  const nbClients = groupByClient(docs).length;
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");

  for (let p = 0; p < pages.length; p++) {
    const isFirst = p === 0;
    const isLast = p === pages.length - 1;
    const html = `
      <div style="font-family:Arial,sans-serif;padding:15px 20px;color:#1a1a1a;background:#fff;width:760px;min-height:1060px;display:flex;flex-direction:column">
        ${buildHeader(options, isFirst)}
        ${isFirst ? buildClientBlock(options, nbClients) : ""}
        ${isFirst ? buildKpis(docs) : ""}
        <div style="flex:1">
          <table style="width:100%;border-collapse:collapse">
            <thead>${buildTableHeader()}</thead>
            <tbody>${buildRows(pages[p])}</tbody>
            ${isLast && docs.length > 0 ? `<tfoot>${buildTotals(docs)}</tfoot>` : ""}
          </table>
        </div>
        ${buildFooter(p + 1, pages.length, docs.length)}
      </div>`;

    const container = document.createElement("div");
    container.innerHTML = html;
    Object.assign(container.style, { position: "absolute", left: "-9999px", top: "0", background: "#fff" });
    document.body.appendChild(container);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
        scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff",
      });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (p > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
    } finally {
      document.body.removeChild(container);
    }
  }
  pdf.save(`${filename}.pdf`);
}

const num = (v: number) => String(Math.round(v || 0));

function buildExcelHtml(options: ExportOptions, docs: ReleveDoc[]) {
  const all = !options.client;
  const t = totals(docs);
  const rows = docs.map((d, i) => `<tr><td>${i + 1}</td>${all ? `<td>${safe(d.clientNom)}</td>` : ""}<td>${safe(d.type)}</td><td>${safe(d.numero)}</td><td>${dateFr(d.date)}</td><td>${safe(d.categorie)}</td><td>${safe(d.statut)}</td><td>${num(d.montantTtc)}</td><td>${num(d.montantPaye)}</td><td>${num(reste(d))}</td><td>${isPaid(d) ? "Payé" : "Impayé"}</td></tr>`).join("");
  const recap = all
    ? `<h3>Récapitulatif par client</h3><table border="1" cellspacing="0" cellpadding="4">
        <thead><tr><th>Client</th><th>Documents</th><th>Total TTC (FCFA)</th><th>Payé (FCFA)</th><th>Reste (FCFA)</th></tr></thead>
        <tbody>${groupByClient(docs).map((g) => { const s = totals(g.docs); return `<tr><td>${safe(g.clientNom)}</td><td>${g.docs.length}</td><td>${num(s.ttc)}</td><td>${num(s.paye)}</td><td>${num(s.reste)}</td></tr>`; }).join("")}</tbody>
        <tfoot><tr><td><b>Total</b></td><td>${docs.length}</td><td>${num(t.ttc)}</td><td>${num(t.paye)}</td><td>${num(t.reste)}</td></tr></tfoot>
      </table><br/>`
    : "";
  const span = all ? 7 : 6;
  return `<!doctype html><html><head><meta charset="UTF-8"></head><body>
    <h2>Relevé ${all ? "tous les clients" : `client — ${safe(options.client?.nom)}`}</h2>
    <p>Période : ${dateFr(options.dateDebut)} au ${dateFr(options.dateFin)} · Filtre : ${statutLabel(options.filtreStatut)} · Montants en FCFA</p>
    ${recap}
    <h3>Détail des documents</h3>
    <table border="1" cellspacing="0" cellpadding="4">
      <thead><tr><th>#</th>${all ? "<th>Client</th>" : ""}<th>Type</th><th>Numéro</th><th>Date</th><th>Catégorie</th><th>Statut</th><th>Total TTC</th><th>Payé</th><th>Reste</th><th>Paiement</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="${span}"><b>Totaux — ${money(t.ttc)}</b></td><td>${num(t.ttc)}</td><td>${num(t.paye)}</td><td>${num(t.reste)}</td><td></td></tr></tfoot>
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
  const nom = options.client ? fileSafe(options.client.nom) : "tous_clients";
  const filename = `releve_${nom}_${options.dateDebut}_${options.dateFin}`;
  if (options.format === "excel") {
    downloadBlob(["\ufeff", buildExcelHtml(options, docs)], "application/vnd.ms-excel;charset=utf-8", `${filename}.xls`);
  } else {
    await renderPagesToPdf(options, docs, filename);
  }
  return docs.length;
}
