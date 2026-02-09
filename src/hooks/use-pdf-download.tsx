import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface UsePdfDownloadOptions {
  filename: string;
  margin?: number;
}

/**
 * Wait for all images inside an element to finish loading.
 */
async function waitForImages(element: HTMLElement, timeout = 10000): Promise<void> {
  const images = element.querySelectorAll('img');
  if (images.length === 0) return;

  const promises = Array.from(images).map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.addEventListener('load', () => resolve(), { once: true });
      img.addEventListener('error', () => resolve(), { once: true });
    });
  });

  await Promise.race([
    Promise.all(promises),
    new Promise<void>((resolve) => setTimeout(resolve, timeout)),
  ]);
}

/**
 * Wait for document fonts to be ready.
 */
async function waitForFonts(timeout = 5000): Promise<void> {
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => setTimeout(resolve, timeout)),
    ]);
  } catch {
    // fonts.ready not supported — continue
  }
}

/**
 * Hook for PDF download using html2canvas + jsPDF.
 * Forces content to fit on a single A4 page.
 * Waits for images and fonts before capturing.
 */
export function usePdfDownload({ filename, margin = 5 }: UsePdfDownloadOptions) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Generate PDF as Blob - fits content to single A4 page
  const generatePdfBlob = useCallback(async (): Promise<Blob | null> => {
    if (!contentRef.current) return null;

    try {
      // Wait for all images and fonts to be fully loaded
      await Promise.all([
        waitForImages(contentRef.current),
        waitForFonts(),
      ]);

      // Extra frame to let browser finish layout/paint
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      // A4 dimensions in mm
      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;
      const CONTENT_WIDTH_MM = A4_WIDTH_MM - (margin * 2);
      const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - (margin * 2);

      // Capture the content at high resolution
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate scaling to fit content on one page
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      
      // Scale factor to fit width
      const scaleX = CONTENT_WIDTH_MM / (imgWidthPx / 2);
      // Scale factor to fit height
      const scaleY = CONTENT_HEIGHT_MM / (imgHeightPx / 2);
      
      // Use the smaller scale to ensure everything fits
      const scale = Math.min(scaleX, scaleY);
      
      const finalWidth = (imgWidthPx / 2) * scale;
      const finalHeight = (imgHeightPx / 2) * scale;
      
      // Center horizontally
      const xOffset = margin + (CONTENT_WIDTH_MM - finalWidth) / 2;
      const yOffset = margin;

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);

      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  }, [filename, margin]);

  // Download PDF
  const downloadPdf = useCallback(async () => {
    const blob = await generatePdfBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [generatePdfBlob, filename]);

  return { contentRef, downloadPdf, generatePdfBlob };
}
