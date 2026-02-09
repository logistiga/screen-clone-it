import { useCallback, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface UsePdfDownloadOptions {
  filename: string;
  margin?: number;
}

/**
 * Convertit toutes les images d'un élément en base64 inline
 * pour éviter les problèmes CORS avec html2canvas
 */
async function inlineImagesToBase64(element: HTMLElement, timeout = 10000): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));
  if (images.length === 0) return;

  const convertOne = async (img: HTMLImageElement): Promise<void> => {
    // Déjà en base64
    if (img.src.startsWith("data:")) return;

    // Attendre le chargement
    if (!img.complete || img.naturalWidth === 0) {
      await new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    }

    // Convertir en base64 via un canvas temporaire
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        img.src = dataUrl;
      }
    } catch {
      // CORS : on ignore silencieusement
      console.warn("[PDF] Could not inline image:", img.src.substring(0, 60));
    }
  };

  await Promise.race([
    Promise.all(images.map(convertOne)),
    new Promise<void>((r) => setTimeout(r, timeout)),
  ]);
}

/**
 * Attend que les fonts soient prêtes
 */
async function waitForFonts(timeout = 5000): Promise<void> {
  if (!("fonts" in document)) return;
  await Promise.race([
    (document as any).fonts.ready,
    new Promise<void>((r) => setTimeout(r, timeout)),
  ]);
}

/**
 * Hook PDF fiable (html2canvas + jsPDF)
 * - convertit les images en base64 pour éliminer les problèmes CORS
 * - attend fonts
 * - capture haute résolution
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
      // 1️⃣ Vérifier les dimensions
      const rect = el.getBoundingClientRect();
      console.log("[PDF] Element dimensions:", Math.round(rect.width), "x", Math.round(rect.height));

      if (rect.width === 0 || rect.height === 0) {
        console.error("[PDF] Element has zero dimensions — aborting");
        return null;
      }

      // 2️⃣ Convertir les images en base64 inline (élimine tout problème CORS)
      await inlineImagesToBase64(el);
      await waitForFonts();

      // 3️⃣ Attendre le repaint après conversion des images
      await new Promise((r) => setTimeout(r, 500));

      // 4️⃣ Capture — PAS de allowTaint, PAS de windowWidth/Height custom
      console.log("[PDF] Starting html2canvas...");
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      console.log("[PDF] Canvas:", canvas.width, "x", canvas.height);

      if (canvas.width === 0 || canvas.height === 0) {
        console.error("[PDF] Canvas is empty (0x0)");
        return null;
      }

      // 5️⃣ Vérifier que toDataURL fonctionne
      let imgData: string;
      try {
        imgData = canvas.toDataURL("image/jpeg", 0.95);
      } catch (e) {
        console.error("[PDF] toDataURL failed (tainted canvas?):", e);
        return null;
      }

      console.log("[PDF] Image data:", imgData.length, "chars");

      if (imgData.length < 1000) {
        console.error("[PDF] Image data suspiciously small — canvas likely blank");
        return null;
      }

      // 6️⃣ Création PDF A4
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageH = pdf.internal.pageSize.getHeight() - margin * 2;

      const pxToMm = (px: number) => px * 0.264583;
      const imgWmm = pxToMm(canvas.width);
      const imgHmm = pxToMm(canvas.height);

      const s = Math.min(pageW / imgWmm, pageH / imgHmm);
      const finalW = imgWmm * s;
      const finalH = imgHmm * s;

      const xOff = margin + (pageW - finalW) / 2;

      pdf.addImage(imgData, "JPEG", xOff, margin, finalW, finalH);

      const blob = pdf.output("blob");
      console.log("[PDF] Final blob:", blob.size, "bytes");

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
