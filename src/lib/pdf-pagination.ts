export interface PdfRowLimits {
  firstPageRows: number;
  middlePageRows: number;
  lastPageRows: number;
  singlePageRows: number;
  footerReserveMm: number;
}

interface PdfRowLimitOptions {
  footerHeightMm: number;
  firstHeaderMm: number;
  compactHeaderMm: number;
  lastContentMm: number;
  singleLastContentMm?: number;
  rowHeightMm?: number;
  tableHeaderMm?: number;
  footerGapMm?: number;
  safetyMm?: number;
  minRows?: number;
}

const A4_HEIGHT_MM = 297;
const A4_WIDTH_MM = 210;
const PAGE_PADDING_TOP_MM = 10;
const PAGE_PADDING_BOTTOM_MM = 10;
const FALLBACK_FOOTER_HEIGHT_MM = 18;

export const measurePdfFooterHeightMm = () => {
  if (typeof document === "undefined") return FALLBACK_FOOTER_HEIGHT_MM;

  const footer = document.querySelector<HTMLElement>("[data-document-footer]");
  if (!footer) return FALLBACK_FOOTER_HEIGHT_MM;

  const footerHeightPx = footer.getBoundingClientRect().height;
  const page = footer.closest<HTMLElement>("[data-pdf-page]");
  const pageWidthPx = page?.getBoundingClientRect().width || 0;
  const pxPerMm = pageWidthPx > 0 ? pageWidthPx / A4_WIDTH_MM : 96 / 25.4;

  return Math.max(FALLBACK_FOOTER_HEIGHT_MM, Math.ceil((footerHeightPx / pxPerMm) * 10) / 10);
};

export const getPdfRowLimits = ({
  footerHeightMm,
  firstHeaderMm,
  compactHeaderMm,
  lastContentMm,
  singleLastContentMm,
  rowHeightMm = 5.8,
  tableHeaderMm = 8,
  footerGapMm = 7,
  safetyMm = 4,
  minRows = 1,
}: PdfRowLimitOptions): PdfRowLimits => {
  const footerReserveMm = Math.ceil(PAGE_PADDING_BOTTOM_MM + footerHeightMm + footerGapMm);
  const availableMm = A4_HEIGHT_MM - PAGE_PADDING_TOP_MM - footerReserveMm;
  const rowsFor = (headerMm: number, afterTableMm = 0) =>
    Math.max(minRows, Math.floor((availableMm - headerMm - tableHeaderMm - afterTableMm - safetyMm) / rowHeightMm));

  return {
    firstPageRows: rowsFor(firstHeaderMm),
    middlePageRows: rowsFor(compactHeaderMm),
    lastPageRows: rowsFor(compactHeaderMm, lastContentMm),
    singlePageRows: rowsFor(firstHeaderMm, singleLastContentMm ?? lastContentMm),
    footerReserveMm,
  };
};

export const paginatePdfRows = <T>(rows: T[], limits: PdfRowLimits): T[][] => {
  if (rows.length === 0) return [[]];
  if (rows.length <= limits.singlePageRows) return [rows];

  const pages: T[][] = [];
  let cursor = Math.min(limits.firstPageRows, rows.length - 1);
  pages.push(rows.slice(0, cursor));

  while (rows.length - cursor > limits.lastPageRows) {
    const remaining = rows.length - cursor;
    const take = Math.min(limits.middlePageRows, remaining - limits.lastPageRows);
    if (take <= 0) break;
    pages.push(rows.slice(cursor, cursor + take));
    cursor += take;
  }

  if (cursor < rows.length) pages.push(rows.slice(cursor));
  return pages;
};