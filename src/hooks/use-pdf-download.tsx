import { useCallback, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface UsePdfDownloadOptions {
  filename: string;
  margin?: number;
  cleanupDelayMs?: number;
}

/**
 * Hook PDF — capture chaque [data-pdf-page] individuellement et le place sur
 * une page A4 dédiée. Évite tout chevauchement / page blanche dû à un
 * découpage pixel aveugle.
 */
export function usePdfDownload({ filename, cleanupDelayMs = 15000 }: UsePdfDownloadOptions) {
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
      const pageNodes = Array.from(el.querySelectorAll<HTMLElement>("[data-pdf-page]"));
      const targets: HTMLElement[] = pageNodes.length > 0 ? pageNodes : [el];
      console.log("[PDF] Step 1 — Detected", targets.length, "logical page(s)");

      // Attendre images
      const imgs = Array.from(el.querySelectorAll("img"));
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
      if ("fonts" in document) {
        await (document as any).fonts.ready.catch(() => {});
      }
      await new Promise((r) => setTimeout(r, 400));

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
      const pageWidthMm = 210;
      const pageHeightMm = 297;
      let rendered = 0;

      for (let i = 0; i < targets.length; i++) {
        const node = targets[i];
        const rect = node.getBoundingClientRect();
        const w = Math.max(Math.ceil(rect.width), node.scrollWidth || 0, node.offsetWidth || 0);
        const h = Math.max(Math.ceil(rect.height), node.scrollHeight || 0, node.offsetHeight || 0);
        if (w < 10 || h < 10) {
          console.warn("[PDF] Skipping empty page", i);
          continue;
        }

        const canvas = await html2canvas(node, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 15000,
          width: w,
          height: h,
          windowWidth: w,
          windowHeight: h,
          scrollX: 0,
          scrollY: 0,
          onclone: (_doc, clonedEl) => {
            clonedEl.style.width = w + "px";
            clonedEl.style.minWidth = w + "px";
            clonedEl.style.maxWidth = w + "px";
            clonedEl.style.height = h + "px";
            clonedEl.style.overflow = "hidden";
            clonedEl.style.transform = "none";
            clonedEl.style.margin = "0";
            clonedEl.style.boxSizing = "border-box";
          },
        });

        // PNG sans perte pour préserver la netteté du texte
        const imgData = canvas.toDataURL("image/png");
        if (imgData.length < 5000) {
          console.warn("[PDF] Page", i, "looks blank, skipping");
          continue;
        }

        if (rendered > 0) pdf.addPage();
        const ratio = canvas.height / canvas.width;
        let drawW = pageWidthMm;
        let drawH = drawW * ratio;
        if (drawH > pageHeightMm) {
          drawH = pageHeightMm;
          drawW = drawH / ratio;
        }
        const offsetX = (pageWidthMm - drawW) / 2;
        const offsetY = (pageHeightMm - drawH) / 2;
        pdf.addImage(imgData, "PNG", offsetX, offsetY, drawW, drawH, undefined, "FAST");

        rendered++;
      }

      if (rendered === 0) {
        console.error("[PDF] No page rendered");
        return null;
      }

      const blob = pdf.output("blob");
      console.log("[PDF] ✅ Final PDF:", blob.size, "bytes");
      return blob;
    } catch (error) {
      console.error("[PDF] ❌ Fatal error:", error);
      return null;
    }
  }, []);

  const downloadPdf = useCallback(async () => {
    const blob = await generatePdfBlob();
    if (!blob) return;
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

  return { contentRef, downloadPdf, generatePdfBlob };
}
