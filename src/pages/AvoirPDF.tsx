import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAnnulation } from "@/hooks/use-annulations";
import { formatMontant, formatDate } from "@/data/mockData";
import { DocumentFooter, DocumentBankDetails } from "@/components/documents/DocumentLayout";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import logoLogistiga from "@/assets/lojistiga-logo.png";

export default function AvoirPDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: annulation, isLoading, error } = useAnnulation(Number(id) || 0);

  const { contentRef, downloadPdf } = usePdfDownload({ 
    filename: `Avoir_${annulation?.numero_avoir || 'unknown'}` 
  });

  // Téléchargement automatique au chargement
  useEffect(() => {
    if (annulation) {
      const timer = setTimeout(() => {
        downloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [annulation, downloadPdf]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement du document...</p>
        </div>
      </div>
    );
  }

  if (error || !annulation || !annulation.avoir_genere) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-xl font-semibold mb-2">Avoir non trouvé</h2>
          <p className="text-muted-foreground mb-4">
            Cet avoir n'existe pas ou n'a pas encore été généré.
          </p>
          <Button onClick={() => navigate("/annulations")} className="transition-all duration-200 hover:scale-105">
            Retour aux annulations
          </Button>
        </div>
      </div>
    );
  }

  const client = annulation.client;
  const handlePrint = () => {
    window.print();
  };

  // Type de document annulé
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      facture: "Facture",
      ordre: "Ordre de travail",
      devis: "Devis",
    };
    return labels[type] || type;
  };

  // Données pour le QR code de vérification
  const qrPayload = {
    type: "AVOIR",
    numero: annulation.numero_avoir,
    date: annulation.date,
    client: client?.nom,
    montant: annulation.montant,
    documentAnnule: annulation.document_numero,
    url: `${window.location.origin}/annulations`
  };
  
  const qrData = `${window.location.origin}/verification?data=${encodeURIComponent(JSON.stringify(qrPayload))}`;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 z-50 bg-background border-b">
        <div className="container py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/annulations")} className="gap-2 transition-all duration-200 hover:scale-105">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2 transition-all duration-200 hover:scale-105">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <Button className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={downloadPdf}>
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content - A4 Format */}
      <div className="container py-8 print:py-0 flex justify-center animate-fade-in">
        <Card 
          ref={contentRef} 
          className="bg-white print:shadow-none print:border-none relative"
          style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}
        >
          {/* Header avec logo et QR code */}
          <div className="flex justify-between items-start mb-6 border-b-2 border-primary pb-4">
            <div className="flex items-center gap-3">
              <img src={logoLogistiga} alt="LOGISTIGA" className="h-16 w-auto" />
              <div>
                <p className="text-xs text-primary font-semibold">TRANSPORT-STOCKAGE</p>
                <p className="text-xs text-primary font-semibold">-MANUTENTION</p>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive">AVOIR</h1>
              <p className="text-lg font-semibold">{annulation.numero_avoir}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {formatDate(annulation.date)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <QRCodeSVG value={qrData} size={70} level="M" />
              <p className="text-[8px] text-muted-foreground">Scannez pour vérifier</p>
            </div>
          </div>

          {/* Client */}
          <div className="mb-6 border p-4 rounded-lg bg-muted/20">
            <h3 className="text-sm font-bold text-primary mb-2">CLIENT</h3>
            <p className="font-semibold text-base">{client?.nom}</p>
            {client?.adresse && (
              <p className="text-sm text-muted-foreground">{client.adresse} - {client.ville}, Gabon</p>
            )}
            {client?.telephone && (
              <p className="text-sm text-muted-foreground">
                Tél: {client.telephone}
                {client.email && ` | Email: ${client.email}`}
              </p>
            )}
          </div>

          {/* Détails de l'avoir */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-primary mb-3 border-b pb-2">DÉTAILS DE L'AVOIR</h3>
            
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-3 font-medium text-muted-foreground w-1/3">Document annulé</td>
                  <td className="py-3 font-semibold">
                    {getTypeLabel(annulation.type)} n° {annulation.document_numero}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium text-muted-foreground">Date d'annulation</td>
                  <td className="py-3">{formatDate(annulation.date)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium text-muted-foreground">N° Annulation</td>
                  <td className="py-3">{annulation.numero}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium text-muted-foreground">Motif de l'annulation</td>
                  <td className="py-3">{annulation.motif}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Montant de l'avoir */}
          <div className="mb-8 bg-destructive/5 border-2 border-destructive/20 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-destructive">MONTANT DE L'AVOIR</h3>
                <p className="text-sm text-muted-foreground">
                  Ce montant est à déduire des prochaines factures ou à rembourser au client.
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-destructive">
                  {formatMontant(annulation.montant)}
                </p>
                <p className="text-xs text-muted-foreground">TTC</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6 border p-4 rounded-lg">
            <h3 className="text-sm font-bold mb-2">CONDITIONS D'UTILISATION</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Cet avoir peut être déduit du montant de vos prochaines factures.</li>
              <li>• Sur demande, le montant peut être remboursé par virement bancaire.</li>
              <li>• Ce document doit être conservé pour toute réclamation.</li>
              <li>• Validité: 1 an à compter de la date d'émission.</li>
            </ul>
          </div>

          {/* Coordonnées bancaires (pour remboursement éventuel) */}
          <DocumentBankDetails />

          {/* Signature */}
          <div className="flex justify-between items-end mb-6 mt-8">
            <div className="w-1/3">
              <p className="text-xs text-muted-foreground mb-1">Signature du client</p>
              <div className="border-b border-dashed h-12"></div>
            </div>
            <div className="w-1/3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Cachet de l'entreprise</p>
              <div className="border border-dashed h-16 rounded"></div>
            </div>
            <div className="w-1/3 text-right">
              <p className="text-xs text-muted-foreground mb-1">Signature autorisée</p>
              <div className="border-b border-dashed h-12"></div>
            </div>
          </div>

          {/* Footer */}
          <DocumentFooter />
        </Card>
      </div>

      <style>{`
        @media print {
          body { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
