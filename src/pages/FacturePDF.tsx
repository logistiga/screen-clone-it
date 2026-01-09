import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { factures, clients, formatMontant, formatDate } from "@/data/mockData";
import { DocumentFooter, DocumentBankDetails } from "@/components/documents/DocumentLayout";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import logoLojistiga from "@/assets/lojistiga-logo.png";

export default function FacturePDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const facture = factures.find((f) => f.id === id);
  const client = facture ? clients.find((c) => c.id === facture.clientId) : null;

  const { contentRef, downloadPdf } = usePdfDownload({ 
    filename: `Facture_${facture?.numero || 'unknown'}` 
  });

  // Téléchargement automatique au chargement
  useEffect(() => {
    if (facture) {
      const timer = setTimeout(() => {
        downloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [facture, downloadPdf]);

  if (!facture) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Facture non trouvée</h2>
          <Button onClick={() => navigate("/factures")}>Retour aux factures</Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const isAnnulee = facture.statut === "annulee";
  const resteAPayer = facture.montantTTC - facture.montantPaye;
  
  // Données pour le QR code de vérification
  const qrPayload = {
    type: "FACTURE",
    numero: facture.numero,
    date: facture.dateCreation,
    client: client?.nom,
    montantTTC: facture.montantTTC,
    montantPaye: facture.montantPaye,
    reste: resteAPayer,
    statut: facture.statut,
    url: `${window.location.origin}/factures/${id}`
  };
  
  const qrData = `${window.location.origin}/verification?data=${encodeURIComponent(JSON.stringify(qrPayload))}`;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 z-50 bg-background border-b">
        <div className="container py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/factures")} className="gap-2">
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
          {/* Watermark si annulée */}
          {isAnnulee && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-destructive/20 text-6xl font-bold rotate-[-30deg] border-4 border-destructive/20 px-6 py-3">
                ANNULÉE
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
              <h1 className="text-xl font-bold text-primary">FACTURE</h1>
              <p className="text-sm font-semibold">{facture.numero}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <QRCodeSVG value={qrData} size={60} level="M" />
              <p className="text-[8px] text-muted-foreground">Scannez pour vérifier</p>
            </div>
          </div>

          {/* Infos document */}
          <div className="flex justify-between text-xs mb-4">
            <div>
              <p><span className="font-semibold">Date:</span> {formatDate(facture.dateCreation)}</p>
              <p><span className="font-semibold">Échéance:</span> {formatDate(facture.dateEcheance)}</p>
            </div>
          </div>

          {/* Client */}
          <div className="mb-4 border p-3 rounded">
            <h3 className="text-xs font-bold text-primary mb-1">FACTURER À</h3>
            <p className="font-semibold text-sm">{client?.nom}</p>
            <p className="text-xs text-muted-foreground">{client?.adresse} - {client?.ville}, Gabon</p>
            <p className="text-xs text-muted-foreground">
              Tél: {client?.telephone} | Email: {client?.email}
              {client?.nif && ` | NIF: ${client.nif}`}
              {client?.rccm && ` | RCCM: ${client.rccm}`}
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
              {facture.lignes.map((ligne, index) => (
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
              {Array.from({ length: Math.max(0, 10 - facture.lignes.length) }).map((_, i) => (
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

          {/* Totaux et Paiement */}
          <div className="flex justify-between mb-4 gap-4">
            {/* Conditions de paiement */}
            <div className="flex-1 p-3 border rounded text-xs">
              <h3 className="font-bold mb-1">CONDITIONS DE PAIEMENT</h3>
              <p className="text-muted-foreground">
                Paiement à réception de facture. En cas de retard, des pénalités de retard
                seront appliquées conformément à la réglementation en vigueur.
              </p>
            </div>

            {/* Totaux */}
            <div className="w-56 border text-xs">
              <div className="flex justify-between py-1 px-3 border-b">
                <span>Total HT</span>
                <span className="font-medium">{formatMontant(facture.montantHT)}</span>
              </div>
              <div className="flex justify-between py-1 px-3 border-b">
                <span>TVA (18%)</span>
                <span>{formatMontant(facture.tva)}</span>
              </div>
              <div className="flex justify-between py-1 px-3 border-b">
                <span>CSS (1%)</span>
                <span>{formatMontant(facture.css)}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-primary text-primary-foreground font-bold border-b">
                <span>Total TTC</span>
                <span>{formatMontant(facture.montantTTC)}</span>
              </div>
              <div className="flex justify-between py-1 px-3 border-b">
                <span>Payé</span>
                <span className="text-green-600 font-medium">{formatMontant(facture.montantPaye)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 font-bold">
                <span>Reste à payer</span>
                <span className={resteAPayer > 0 ? "text-destructive" : "text-green-600"}>
                  {formatMontant(resteAPayer)}
                </span>
              </div>
            </div>
          </div>

          {/* Coordonnées bancaires */}
          <DocumentBankDetails />

          {/* Notes */}
          {facture.notes && (
            <div className="mb-3 border p-2 rounded">
              <h3 className="text-xs font-bold mb-1">NOTES</h3>
              <p className="text-xs">{facture.notes}</p>
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
