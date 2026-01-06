import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { factures, clients, formatMontant, formatDate } from "@/data/mockData";
import { DocumentHeader, DocumentFooter, DocumentBankDetails } from "@/components/documents/DocumentLayout";
import { usePdfDownload } from "@/hooks/use-pdf-download";

export default function FacturePDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const facture = factures.find((f) => f.id === id);
  const client = facture ? clients.find((c) => c.id === facture.clientId) : null;

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

  const { contentRef, downloadPdf } = usePdfDownload({ 
    filename: `Facture_${facture.numero}` 
  });

  const handlePrint = () => {
    window.print();
  };

  const isAnnulee = facture.statut === "annulee";
  const resteAPayer = facture.montantTTC - facture.montantPaye;

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

      {/* PDF Content */}
      <div className="container py-8 print:py-0">
        <Card ref={contentRef} className="max-w-4xl mx-auto p-6 print:shadow-none print:border-none relative bg-white">
          {/* Watermark si annulée */}
          {isAnnulee && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-destructive/20 text-6xl font-bold rotate-[-30deg] border-4 border-destructive/20 px-6 py-3">
                ANNULÉE
              </div>
            </div>
          )}

          {/* Header avec logo centré */}
          <DocumentHeader
            title="FACTURE"
            numero={facture.numero}
            date={formatDate(facture.dateCreation)}
            secondaryLabel="Échéance"
            secondaryValue={formatDate(facture.dateEcheance)}
          />

          <Separator className="my-3" />

          {/* Client */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-1">FACTURER À</h3>
            <div className="bg-muted/30 p-3 rounded text-sm">
              <p className="font-semibold">{client?.nom}</p>
              <p className="text-xs text-muted-foreground">{client?.adresse} - {client?.ville}, Gabon</p>
              <p className="text-xs text-muted-foreground">
                Tél: {client?.telephone} | Email: {client?.email}
                {client?.nif && ` | NIF: ${client.nif}`}
                {client?.rccm && ` | RCCM: ${client.rccm}`}
              </p>
            </div>
          </div>

          {/* Tableau des lignes */}
          <table className="w-full mb-4 text-sm">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left py-2 font-semibold text-xs">Description</th>
                <th className="text-center py-2 font-semibold w-16 text-xs">Qté</th>
                <th className="text-right py-2 font-semibold w-28 text-xs">Prix unit.</th>
                <th className="text-right py-2 font-semibold w-32 text-xs">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {facture.lignes.map((ligne, index) => (
                <tr key={ligne.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                  <td className="py-1.5 px-1 text-xs">{ligne.description}</td>
                  <td className="text-center py-1.5 text-xs">{ligne.quantite}</td>
                  <td className="text-right py-1.5 text-xs">{formatMontant(ligne.prixUnitaire)}</td>
                  <td className="text-right py-1.5 font-medium text-xs">
                    {formatMontant(ligne.montantHT)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux et Paiement côte à côte */}
          <div className="flex justify-between mb-4 gap-4">
            {/* Conditions de paiement */}
            <div className="flex-1 p-3 bg-muted/30 rounded text-xs">
              <h3 className="font-semibold mb-1">CONDITIONS DE PAIEMENT</h3>
              <p className="text-muted-foreground">
                Paiement à réception. Pénalités de retard applicables.
              </p>
            </div>

            {/* Totaux */}
            <div className="w-56 space-y-1 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Total HT</span>
                <span className="font-medium">{formatMontant(facture.montantHT)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">TVA (18%)</span>
                <span>{formatMontant(facture.tva)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">CSS (1%)</span>
                <span>{formatMontant(facture.css)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between py-1 text-sm font-bold">
                <span>Total TTC</span>
                <span className="text-primary">{formatMontant(facture.montantTTC)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Payé</span>
                <span className="text-green-600">{formatMontant(facture.montantPaye)}</span>
              </div>
              <div className="flex justify-between py-0.5 font-semibold">
                <span>Reste</span>
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
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground mb-1">NOTES</h3>
              <p className="text-xs bg-muted/30 p-2 rounded">{facture.notes}</p>
            </div>
          )}

          {/* Footer standardisé */}
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
        }
      `}</style>
    </div>
  );
}
