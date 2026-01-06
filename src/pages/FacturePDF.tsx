import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { factures, clients, formatMontant, formatDate } from "@/data/mockData";
import { DocumentHeader, DocumentFooter, DocumentBankDetails } from "@/components/documents/DocumentLayout";

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
          {/* Watermark si annulée */}
          {isAnnulee && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-destructive/20 text-8xl font-bold rotate-[-30deg] border-8 border-destructive/20 px-8 py-4">
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

          <Separator className="my-6" />

          {/* Client */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">FACTURER À</h3>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="font-semibold text-lg">{client?.nom}</p>
              <p className="text-sm text-muted-foreground">{client?.adresse}</p>
              <p className="text-sm text-muted-foreground">{client?.ville}, Gabon</p>
              {client?.nif && (
                <p className="text-sm text-muted-foreground mt-2">NIF: {client.nif}</p>
              )}
              {client?.rccm && (
                <p className="text-sm text-muted-foreground">RCCM: {client.rccm}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Tél: {client?.telephone}
                <br />
                Email: {client?.email}
              </p>
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
              {facture.lignes.map((ligne, index) => (
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
                <span className="font-medium">{formatMontant(facture.montantHT)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">TVA (18%)</span>
                <span>{formatMontant(facture.tva)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">CSS (1%)</span>
                <span>{formatMontant(facture.css)}</span>
              </div>
              <Separator />
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Total TTC</span>
                <span className="text-primary">{formatMontant(facture.montantTTC)}</span>
              </div>
              <Separator />
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Montant payé</span>
                <span className="text-green-600">{formatMontant(facture.montantPaye)}</span>
              </div>
              <div className="flex justify-between py-1 font-semibold">
                <span>Reste à payer</span>
                <span className={resteAPayer > 0 ? "text-destructive" : "text-green-600"}>
                  {formatMontant(resteAPayer)}
                </span>
              </div>
            </div>
          </div>

          {/* Conditions de paiement */}
          <div className="mb-8 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">CONDITIONS DE PAIEMENT</h3>
            <p className="text-sm text-muted-foreground">
              Paiement à réception de facture. En cas de retard de paiement, des pénalités de retard
              seront appliquées conformément à la réglementation en vigueur.
            </p>
          </div>

          {/* Coordonnées bancaires */}
          <DocumentBankDetails />

          {/* Notes */}
          {facture.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">NOTES</h3>
              <p className="text-sm bg-muted/30 p-4 rounded-lg">{facture.notes}</p>
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
