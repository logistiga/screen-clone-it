import { useCallback, useRef } from 'react';
import html2pdf from 'html2pdf.js';

interface UsePdfDownloadOptions {
  filename: string;
  margin?: number;
}

/**
 * Hook for PDF download using html2pdf.js.
 * Generates PDF as Blob for both download and email attachment.
 */
export function usePdfDownload({ filename, margin = 10 }: UsePdfDownloadOptions) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Generate PDF as Blob
  const generatePdfBlob = useCallback(async (): Promise<Blob | null> => {
    if (!contentRef.current) return null;

    try {
      const blob = await html2pdf()
        .set({
          margin,
          filename: `${filename}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(contentRef.current)
        .outputPdf('blob');

      return blob;
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
