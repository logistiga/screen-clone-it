import { useCallback, useRef } from "react";
import html2pdf from "html2pdf.js";

interface UsePdfDownloadOptions {
  filename: string;
  margin?: number;
}

/**
 * Hook PDF utilisant html2pdf.js
 * - Clone l'élément en interne (pas de problème CORS)
 * - Gère automatiquement images, fonts, layout
 * - Produit un PDF A4 fiable
 */
export function usePdfDownload({ filename, margin = 5 }: UsePdfDownloadOptions) {
  const contentRef = useRef<HTMLDivElement>(null);

  const generatePdfBlob = useCallback(async (): Promise<Blob | null> => {
    const el = contentRef.current;
    if (!el) {
      console.error("[PDF] contentRef is null");
      return null;
    }

    try {
      const rect = el.getBoundingClientRect();
      console.log("[PDF] Element:", Math.round(rect.width), "x", Math.round(rect.height));

      if (rect.width === 0 || rect.height === 0) {
        console.error("[PDF] Element has zero dimensions");
        return null;
      }

      const opt = {
        margin: margin,
        filename: `${filename}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait" as const,
        },
        pagebreak: { mode: ["avoid-all"] },
      };

      const blob: Blob = await html2pdf().set(opt).from(el).outputPdf("blob");
      console.log("[PDF] Blob size:", blob.size, "bytes");

      return blob;
    } catch (error) {
      console.error("[PDF] Generation error:", error);
      return null;
    }
  }, [margin, filename]);

  const downloadPdf = useCallback(async () => {
    const el = contentRef.current;
    if (!el) return;

    try {
      const opt = {
        margin: margin,
        filename: `${filename}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait" as const,
        },
        pagebreak: { mode: ["avoid-all"] },
      };

      await html2pdf().set(opt).from(el).save();
      console.log("[PDF] Download triggered");
    } catch (error) {
      console.error("[PDF] Download error:", error);
    }
  }, [margin, filename]);

  return {
    contentRef,
    downloadPdf,
    generatePdfBlob,
  };
}
