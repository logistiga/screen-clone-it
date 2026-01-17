import { useState, useCallback, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { EmailModalWithTemplate } from './EmailModalWithTemplate';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface EmailModalWithPdfGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'devis' | 'facture' | 'ordre';
  documentData: any;
  pdfContentUrl: string; // URL to fetch PDF-ready HTML content
}

/**
 * Wrapper component that fetches document HTML and generates PDF blob
 * before passing it to EmailModalWithTemplate.
 * This ensures PDF attachment even if server-side DomPDF is unavailable.
 */
export function EmailModalWithPdfGenerator({
  open,
  onOpenChange,
  documentType,
  documentData,
  pdfContentUrl,
}: EmailModalWithPdfGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch HTML content when modal opens
  useEffect(() => {
    if (open && !htmlContent) {
      setIsGenerating(true);
      fetch(pdfContentUrl, {
        headers: {
          'Accept': 'text/html',
        },
      })
        .then(res => res.text())
        .then(html => {
          setHtmlContent(html);
          setPdfReady(true);
          setIsGenerating(false);
        })
        .catch(err => {
          console.error('Error fetching PDF content:', err);
          // Continue without PDF - backend will try to generate
          setPdfReady(true);
          setIsGenerating(false);
        });
    }
  }, [open, pdfContentUrl, htmlContent]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setHtmlContent(null);
      setPdfReady(false);
    }
  }, [open]);

  // Generate PDF blob from HTML content
  const generatePdfBlob = useCallback(async (): Promise<Blob | null> => {
    if (!htmlContent || !contentRef.current) return null;

    try {
      const blob = await html2pdf()
        .set({
          margin: 10,
          filename: `${documentType}-${documentData.numero}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(contentRef.current)
        .outputPdf('blob');

      return blob;
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return null;
    }
  }, [htmlContent, documentType, documentData.numero]);

  // Show loading while fetching HTML
  if (open && isGenerating) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Préparation du document...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3">Génération du PDF en cours...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {/* Hidden div for PDF generation */}
      {htmlContent && (
        <div 
          ref={contentRef}
          style={{ position: 'absolute', left: '-9999px', top: 0 }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}

      {pdfReady && (
        <EmailModalWithTemplate
          open={open}
          onOpenChange={onOpenChange}
          documentType={documentType}
          documentData={documentData}
          generatePdfBlob={htmlContent ? generatePdfBlob : undefined}
        />
      )}
    </>
  );
}
