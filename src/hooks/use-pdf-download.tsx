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
    const el = contentRef.current;
    if (!el) {
      console.error("[PDF] contentRef is null");
      return null;
    }

    try {
      // 1️⃣ Diagnostic: dimensions de l'élément source
      const rect = el.getBoundingClientRect();
      console.log("[PDF] Element rect:", { width: rect.width, height: rect.height, top: rect.top, left: rect.left });
      console.log("[PDF] Element offsetHeight:", el.offsetHeight, "scrollHeight:", el.scrollHeight);

      if (rect.width === 0 || rect.height === 0) {
        console.error("[PDF] Element has zero dimensions — aborting");
        return null;
      }

      // 2️⃣ Attendre images
      const images = Array.from(el.querySelectorAll("img"));
      console.log("[PDF] Found", images.length, "images, states:", images.map(img => ({
        src: img.src?.substring(0, 80),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
      })));
      await waitForImages(el);
      await waitForFonts();

      // 3️⃣ Attendre le layout — délai généreux
      await new Promise((r) => setTimeout(r, 1500));

      // 4️⃣ Capture haute résolution
      console.log("[PDF] Starting html2canvas...");
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: true,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      console.log("[PDF] Canvas size:", canvas.width, "x", canvas.height);

      // Vérifier que le canvas n'est pas vide
      if (canvas.width === 0 || canvas.height === 0) {
        console.error("[PDF] Canvas is empty (0x0)");
        return null;
      }

      // 5️⃣ Création PDF A4
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;

      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;

      const pxToMm = (px: number) => px * 0.264583;

      const imgWidthMm = pxToMm(imgWidthPx);
      const imgHeightMm = pxToMm(imgHeightPx);

      const scale = Math.min(pageWidth / imgWidthMm, pageHeight / imgHeightMm);

      const finalWidth = imgWidthMm * scale;
      const finalHeight = imgHeightMm * scale;

      const xOffset = margin + (pageWidth - finalWidth) / 2;
      const yOffset = margin;

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      console.log("[PDF] Image data length:", imgData.length, "chars");

      pdf.addImage(imgData, "JPEG", xOffset, yOffset, finalWidth, finalHeight);

      const blob = pdf.output("blob");
      console.log("[PDF] Final blob size:", blob.size, "bytes");

      return blob;
    } catch (error) {
      console.error("[PDF] Generation error:", error);
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
