import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { devis, clients, formatMontant, formatDate } from "@/data/mockData";
import { DocumentHeader, DocumentFooter } from "@/components/documents/DocumentLayout";

export default function DevisPDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const devisData = devis.find((d) => d.id === id);
  const client = devisData ? clients.find((c) => c.id === devisData.clientId) : null;

  if (!devisData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Devis non trouvé</h2>
          <Button onClick={() => navigate("/devis")}>Retour aux devis</Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const isAnnule = devisData.statut === "refuse" || devisData.statut === "expire";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar - hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-background border-b">
        <div className="container py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/devis")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="container py-8 print:py-0">
        <Card className="max-w-4xl mx-auto p-8 print:shadow-none print:border-none relative">
          {/* Watermark si annulé */}
          {isAnnule && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-destructive/20 text-8xl font-bold rotate-[-30deg] border-8 border-destructive/20 px-8 py-4">
                ANNULÉ
              </div>
            </div>
          )}

          {/* Header avec logo centré */}
          <DocumentHeader
            title="DEVIS"
            numero={devisData.numero}
            date={formatDate(devisData.dateCreation)}
            secondaryLabel="Validité"
            secondaryValue={formatDate(devisData.dateValidite)}
          />

          <Separator className="my-6" />

          {/* Client */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">CLIENT</h3>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="font-semibold text-lg">{client?.nom}</p>
              <p className="text-sm text-muted-foreground">{client?.adresse}</p>
              <p className="text-sm text-muted-foreground">{client?.ville}, Gabon</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tél: {client?.telephone}
                <br />
                Email: {client?.email}
              </p>
              {client?.nif && (
                <p className="text-sm text-muted-foreground mt-2">NIF: {client.nif}</p>
              )}
              {client?.rccm && (
                <p className="text-sm text-muted-foreground">RCCM: {client.rccm}</p>
              )}
            </div>
          </div>

          {/* Tableau des lignes */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left py-3 font-semibold">Description</th>
                <th className="text-center py-3 font-semibold w-20">Qté</th>
                <th className="text-right py-3 font-semibold w-32">Prix unit.</th>
                <th className="text-right py-3 font-semibold w-36">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {devisData.lignes.map((ligne, index) => (
                <tr key={ligne.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                  <td className="py-3 px-2">{ligne.description}</td>
                  <td className="text-center py-3">{ligne.quantite}</td>
                  <td className="text-right py-3">{formatMontant(ligne.prixUnitaire)}</td>
                  <td className="text-right py-3 font-medium">
                    {formatMontant(ligne.montantHT)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Total HT</span>
                <span className="font-medium">{formatMontant(devisData.montantHT)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">TVA (18%)</span>
                <span>{formatMontant(devisData.tva)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">CSS (1%)</span>
                <span>{formatMontant(devisData.css)}</span>
              </div>
              <Separator />
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Total TTC</span>
                <span className="text-primary">{formatMontant(devisData.montantTTC)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {devisData.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">NOTES</h3>
              <p className="text-sm bg-muted/30 p-4 rounded-lg">{devisData.notes}</p>
            </div>
          )}

          {/* Conditions */}
          <div className="border-t pt-6 text-sm text-muted-foreground mb-6">
            <h3 className="font-semibold mb-2">Conditions</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Ce devis est valable jusqu'au {formatDate(devisData.dateValidite)}</li>
              <li>Paiement: 50% à la commande, 50% à la livraison</li>
              <li>Délai de réalisation: selon disponibilité</li>
            </ul>
          </div>

          {/* Footer standardisé */}
          <DocumentFooter />
        </Card>
      </div>

      {/* Print styles */}
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
