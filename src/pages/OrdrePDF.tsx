import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ordresTravail, clients, formatMontant, formatDate } from "@/data/mockData";
import { DocumentFooter } from "@/components/documents/DocumentLayout";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import logoLojistiga from "@/assets/lojistiga-logo.png";

export default function OrdrePDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const ordre = ordresTravail.find((o) => o.id === id);
  const client = ordre ? clients.find((c) => c.id === ordre.clientId) : null;

  const { contentRef, downloadPdf } = usePdfDownload({ 
    filename: `OT_${ordre?.numero || 'unknown'}` 
  });

  // Téléchargement automatique au chargement
  useEffect(() => {
    if (ordre) {
      const timer = setTimeout(() => {
        downloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ordre, downloadPdf]);

  if (!ordre) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Ordre non trouvé</h2>
          <Button onClick={() => navigate("/ordres")}>Retour aux ordres</Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const isAnnule = ordre.statut === "annule";
  const resteAPayer = ordre.montantTTC - ordre.montantPaye;

  const getTypeOperationLabel = (type: string) => {
    const labels: Record<string, string> = {
      conteneurs: "Conteneurs",
      conventionnel: "Conventionnel",
      location: "Location",
      transport: "Transport",
      manutention: "Manutention",
      stockage: "Stockage"
    };
    return labels[type] || type;
  };
  
  // URL pour le QR code
  const documentUrl = `${window.location.origin}/ordres/${id}`;
  
  // Données encodées dans le QR code
  const qrData = JSON.stringify({
    type: "ORDRE_TRAVAIL",
    numero: ordre.numero,
    date: ordre.dateCreation,
    client: client?.nom,
    typeOperation: ordre.typeOperation,
    montantTTC: ordre.montantTTC,
    montantPaye: ordre.montantPaye,
    reste: resteAPayer,
    statut: ordre.statut,
    url: documentUrl
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 z-50 bg-background border-b">
        <div className="container py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/ordres")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <Button className="gap-2" onClick={downloadPdf}>
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content - A4 Format */}
      <div className="container py-8 print:py-0 flex justify-center">
        <Card 
          ref={contentRef} 
          className="bg-white print:shadow-none print:border-none relative"
          style={{ width: '210mm', minHeight: '297mm', padding: '10mm' }}
        >
          {/* Watermark si annulé */}
          {isAnnule && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-destructive/20 text-6xl font-bold rotate-[-30deg] border-4 border-destructive/20 px-6 py-3">
                ANNULÉ
              </div>
            </div>
          )}

          {/* Header avec logo et QR code */}
          <div className="flex justify-between items-start mb-4 border-b-2 border-primary pb-3">
            <div className="flex items-center gap-3">
              <img src={logoLojistiga} alt="LOGISTIGA" className="h-14 w-auto" />
              <div>
                <p className="text-xs text-primary font-semibold">TRANSPORT-STOCKAGE</p>
                <p className="text-xs text-primary font-semibold">-MANUTENTION</p>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-primary">ORDRE DE TRAVAIL</h1>
              <p className="text-sm font-semibold">{ordre.numero}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <QRCodeSVG value={qrData} size={60} level="M" />
              <p className="text-[8px] text-muted-foreground">Scannez pour vérifier</p>
            </div>
          </div>

          {/* Infos document */}
          <div className="flex justify-between text-xs mb-4">
            <div>
              <p><span className="font-semibold">Date:</span> {formatDate(ordre.dateCreation)}</p>
              <p><span className="font-semibold">Type:</span> {getTypeOperationLabel(ordre.typeOperation)}</p>
            </div>
          </div>

          {/* Client */}
          <div className="mb-4 border p-3 rounded">
            <h3 className="text-xs font-bold text-primary mb-1">CLIENT</h3>
            <p className="font-semibold text-sm">{client?.nom}</p>
            <p className="text-xs text-muted-foreground">{client?.adresse} - {client?.ville}, Gabon</p>
            <p className="text-xs text-muted-foreground">
              Tél: {client?.telephone} | Email: {client?.email}
            </p>
          </div>

          {/* Tableau des lignes */}
          <table className="w-full mb-4 text-xs border-collapse border">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="text-left py-2 px-2 font-semibold w-10 border-r">N°</th>
                <th className="text-left py-2 px-2 font-semibold border-r">Description</th>
                <th className="text-center py-2 px-2 font-semibold w-14 border-r">Qté</th>
                <th className="text-right py-2 px-2 font-semibold w-24 border-r">Prix unit.</th>
                <th className="text-right py-2 px-2 font-semibold w-28">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {ordre.lignes.map((ligne, index) => (
                <tr key={ligne.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                  <td className="py-1.5 px-2 border-r border-b">{index + 1}</td>
                  <td className="py-1.5 px-2 border-r border-b">{ligne.description}</td>
                  <td className="text-center py-1.5 px-2 border-r border-b">{ligne.quantite}</td>
                  <td className="text-right py-1.5 px-2 border-r border-b">{formatMontant(ligne.prixUnitaire)}</td>
                  <td className="text-right py-1.5 px-2 font-medium border-b">
                    {formatMontant(ligne.montantHT)}
                  </td>
                </tr>
              ))}
              {/* Lignes vides pour remplir (min 10 lignes) */}
              {Array.from({ length: Math.max(0, 10 - ordre.lignes.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-6">
                  <td className="py-1.5 px-2 border-r border-b">&nbsp;</td>
                  <td className="py-1.5 px-2 border-r border-b">&nbsp;</td>
                  <td className="py-1.5 px-2 border-r border-b">&nbsp;</td>
                  <td className="py-1.5 px-2 border-r border-b">&nbsp;</td>
                  <td className="py-1.5 px-2 border-b">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div className="flex justify-end mb-4">
            <div className="w-56 border text-xs">
              <div className="flex justify-between py-1 px-3 border-b">
                <span>Total HT</span>
                <span className="font-medium">{formatMontant(ordre.montantHT)}</span>
              </div>
              <div className="flex justify-between py-1 px-3 border-b">
                <span>TVA (18%)</span>
                <span>{formatMontant(ordre.tva)}</span>
              </div>
              <div className="flex justify-between py-1 px-3 border-b">
                <span>CSS (1%)</span>
                <span>{formatMontant(ordre.css)}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-primary text-primary-foreground font-bold border-b">
                <span>Total TTC</span>
                <span>{formatMontant(ordre.montantTTC)}</span>
              </div>
              <div className="flex justify-between py-1 px-3 border-b">
                <span>Payé</span>
                <span className="text-green-600 font-medium">{formatMontant(ordre.montantPaye)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 font-bold">
                <span>Reste à payer</span>
                <span className={resteAPayer > 0 ? "text-destructive" : "text-green-600"}>
                  {formatMontant(resteAPayer)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {ordre.notes && (
            <div className="mb-3 border p-2 rounded">
              <h3 className="text-xs font-bold mb-1">NOTES</h3>
              <p className="text-xs">{ordre.notes}</p>
            </div>
          )}

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
