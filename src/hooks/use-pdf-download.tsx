import { useCallback, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface UsePdfDownloadOptions {
  filename: string;
  margin?: number;
}

/**
 * Attend le chargement de toutes les images contenues dans l’élément
 */
async function waitForImages(element: HTMLElement, timeout = 10000): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));
  if (images.length === 0) return;

  const promises = images.map((img) => {
    if (img.complete && img.naturalWidth > 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      img.addEventListener("load", () => resolve(), { once: true });
      img.addEventListener("error", () => resolve(), { once: true });
    });
  });

  await Promise.race([Promise.all(promises), new Promise<void>((resolve) => setTimeout(resolve, timeout))]);
}

/**
 * Attend que les fonts soient prêtes (si supporté)
 */
async function waitForFonts(timeout = 5000): Promise<void> {
  if (!("fonts" in document)) return;

  await Promise.race([(document as any).fonts.ready, new Promise<void>((resolve) => setTimeout(resolve, timeout))]);
}

/**
 * Hook PDF fiable (html2canvas + jsPDF)
 * - attend images + fonts
 * - conversion px → mm correcte
 * - aucun calcul hasardeux
 * - PDF A4 net et valide
 */
export function usePdfDownload({ filename, margin = 5 }: UsePdfDownloadOptions) {
  const contentRef = useRef<HTMLDivElement>(null);

  const generatePdfBlob = useCallback(async (): Promise<Blob | null> => {
    if (!contentRef.current) return null;

    try {
      // 1️⃣ attendre DOM réellement prêt
      await waitForImages(contentRef.current);
      await waitForFonts();
      await new Promise((r) => setTimeout(r, 500));

      // 2️⃣ capture haute résolution
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // 3️⃣ création PDF A4
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;

      // dimensions canvas (px)
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;

      // conversion px → mm (standard CSS)
      const pxToMm = (px: number) => px * 0.264583;

      const imgWidthMm = pxToMm(imgWidthPx);
      const imgHeightMm = pxToMm(imgHeightPx);

      // scale unique pour tenir dans la page
      const scale = Math.min(pageWidth / imgWidthMm, pageHeight / imgHeightMm);

      const finalWidth = imgWidthMm * scale;
      const finalHeight = imgHeightMm * scale;

      const xOffset = margin + (pageWidth - finalWidth) / 2;
      const yOffset = margin;

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", xOffset, yOffset, finalWidth, finalHeight);

      return pdf.output("blob");
    } catch (error) {
      console.error("PDF generation error:", error);
      return null;
    }
  }, [margin]);

  const downloadPdf = useCallback(async () => {
    const blob = await generatePdfBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [generatePdfBlob, filename]);

  return {
    contentRef,
    downloadPdf,
    generatePdfBlob,
  };
}
