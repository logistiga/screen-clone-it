import { useCallback, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface UsePdfDownloadOptions {
  filename: string;
  margin?: number;
  cleanupDelayMs?: number;
}

/**
 * Hook PDF robuste
 * - Utilise onclone pour forcer des dimensions pixel explicites
 * - PNG au lieu de JPEG pour éviter les artefacts
 * - Logging détaillé à chaque étape
 */
export function usePdfDownload({ filename, margin = 10, cleanupDelayMs = 15000 }: UsePdfDownloadOptions) {
  const contentRef = useRef<HTMLDivElement>(null);

  const getSafeFilename = useCallback(() => {
    const trimmed = filename.trim();
    if (!trimmed) return "document.pdf";

    return trimmed.toLowerCase().endsWith(".pdf") ? trimmed : `${trimmed}.pdf`;
  }, [filename]);

  const generatePdfBlob = useCallback(async (): Promise<Blob | null> => {
    const el = contentRef.current;
    if (!el) {
      console.error("[PDF] contentRef is null");
      return null;
    }

    try {
      // 1️⃣ Dimensions réelles en pixels
      const rect = el.getBoundingClientRect();
      const elWidth = Math.max(Math.ceil(rect.width), el.scrollWidth || 0, el.offsetWidth || 0);
      const elHeight = Math.max(Math.ceil(rect.height), el.scrollHeight || 0, el.offsetHeight || 0);
      console.log("[PDF] Step 1 — Source element:", elWidth, "x", elHeight, "px");

      if (elWidth < 10 || elHeight < 10) {
        console.error("[PDF] Element too small, aborting");
        return null;
      }

      // 2️⃣ Attendre que les images soient chargées
      const imgs = Array.from(el.querySelectorAll("img"));
      console.log("[PDF] Step 2 — Waiting for", imgs.length, "images...");
      
      await Promise.all(
        imgs.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            const done = () => resolve();
            img.onload = done;
            img.onerror = done;
            setTimeout(done, 5000);
          });
        })
      );

      // 3️⃣ Attendre fonts + repaint
      if ("fonts" in document) {
        await (document as any).fonts.ready.catch(() => {});
      }
      await new Promise((r) => setTimeout(r, 800));

      // 4️⃣ Capturer avec onclone pour fixer les dimensions
      console.log("[PDF] Step 4 — html2canvas starting...");
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: true,
        width: elWidth,
        height: elHeight,
        windowWidth: elWidth,
        windowHeight: elHeight,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc, clonedEl) => {
          // Forcer des dimensions explicites en px sur le clone
          clonedDoc.documentElement.style.width = elWidth + "px";
          clonedDoc.body.style.width = elWidth + "px";
          clonedDoc.body.style.margin = "0";
          clonedDoc.body.style.background = "#ffffff";

          clonedEl.style.width = elWidth + "px";
          clonedEl.style.minWidth = elWidth + "px";
          clonedEl.style.maxWidth = elWidth + "px";
          clonedEl.style.height = "auto";
          clonedEl.style.minHeight = elHeight + "px";
          clonedEl.style.overflow = "visible";
          clonedEl.style.position = "relative";
          clonedEl.style.transform = "none";
          clonedEl.style.margin = "0";
          clonedEl.style.boxSizing = "border-box";
          console.log("[PDF] onclone — clone dimensions forced to", elWidth, "x", elHeight, "px");
        },
      });

      console.log("[PDF] Step 5 — Canvas:", canvas.width, "x", canvas.height);

      if (canvas.width < 20 || canvas.height < 20) {
        console.error("[PDF] Canvas too small:", canvas.width, "x", canvas.height);
        return null;
      }

      // 5️⃣ Extraire image PNG
      let imgData: string;
      try {
        imgData = canvas.toDataURL("image/png");
      } catch (e) {
        console.error("[PDF] toDataURL failed:", e);
        return null;
      }

      console.log("[PDF] Step 6 — PNG data:", imgData.length, "chars");

      if (imgData.length < 5000) {
        console.error("[PDF] PNG data too small — blank canvas suspected");
        return null;
      }

      // 6️⃣ Créer le PDF A4
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190; // A4 width minus 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 277; // A4 height minus 10mm margins

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Multi-page si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const blob = pdf.output("blob");
      console.log("[PDF] ✅ Final PDF:", blob.size, "bytes (" + Math.round(blob.size / 1024) + " KB)");

      return blob;
    } catch (error) {
      console.error("[PDF] ❌ Fatal error:", error);
      return null;
    }
  }, [margin]);

  const downloadPdf = useCallback(async () => {
    const blob = await generatePdfBlob();
    if (!blob) {
      console.error("[PDF] No blob generated — download aborted");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getSafeFilename();
    document.body.appendChild(link);
    link.click();

    window.setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, cleanupDelayMs);
  }, [cleanupDelayMs, generatePdfBlob, getSafeFilename]);

  return {
    contentRef,
    downloadPdf,
    generatePdfBlob,
  };
}
