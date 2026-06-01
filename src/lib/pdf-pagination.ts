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
const FALLBACK_FOOTER_HEIGHT_MM = 22;

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
  rowHeightMm = 6.4,
  tableHeaderMm = 8,
  footerGapMm = 12,
  safetyMm = 6,
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

  const firstCapacity = Math.max(1, limits.firstPageRows);
  const middleCapacity = Math.max(1, limits.middlePageRows);
  const lastCapacity = Math.max(1, limits.lastPageRows);
  let pageCount = 2;
  while (rows.length > firstCapacity + Math.max(0, pageCount - 2) * middleCapacity + lastCapacity) {
    pageCount++;
  }

  const capacities = Array.from({ length: pageCount }, (_, index) => {
    if (index === 0) return firstCapacity;
    if (index === pageCount - 1) return lastCapacity;
    return middleCapacity;
  });
  const pages: T[][] = [];
  let cursor = 0;

  capacities.forEach((capacity, index) => {
    const remainingRows = rows.length - cursor;
    const remainingPages = pageCount - index;
    if (remainingPages === 1) {
      pages.push(rows.slice(cursor));
      return;
    }

    const capacityAfter = capacities.slice(index + 1).reduce((sum, value) => sum + value, 0);
    const take = Math.min(capacity, remainingRows - capacityAfter);

    pages.push(rows.slice(cursor, cursor + take));
    cursor += take;
  });


  return pages;
};