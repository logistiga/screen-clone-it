import { useCallback, useRef } from 'react';

interface UsePdfDownloadOptions {
  filename: string;
  margin?: number;
}

/**
 * Hook for PDF download using native browser print functionality.
 * This replaces html2pdf.js which had a critical security vulnerability (Path Traversal via jsPDF).
 * 
 * The browser's native print dialog provides a secure "Save as PDF" option
 * that avoids the security risks of client-side PDF generation libraries.
 */
export function usePdfDownload({ filename }: UsePdfDownloadOptions) {
  const contentRef = useRef<HTMLDivElement>(null);

  const downloadPdf = useCallback(async () => {
    if (!contentRef.current) return;

    // Store original title to restore after print
    const originalTitle = document.title;
    
    // Set document title to filename for PDF save dialog
    document.title = filename;
    
    try {
      // Trigger browser's native print dialog
      // Users can select "Save as PDF" in the print destination
      window.print();
    } finally {
      // Restore original title after a short delay
      // (allows print dialog to capture the filename)
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }
  }, [filename]);

  return { contentRef, downloadPdf };
}
