import html2pdf from 'html2pdf.js';
import { useCallback, useRef } from 'react';

interface UsePdfDownloadOptions {
  filename: string;
  margin?: number;
}

export function usePdfDownload({ filename, margin = 10 }: UsePdfDownloadOptions) {
  const contentRef = useRef<HTMLDivElement>(null);

  const downloadPdf = useCallback(async () => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    
    const opt = {
      margin: margin,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  }, [filename, margin]);

  return { contentRef, downloadPdf };
}
