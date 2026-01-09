import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, Send } from "lucide-react";
import { toast } from "sonner";
import {
  DocumentCommercial,
  categoriesConfig,
  formatMontant,
  formatDate,
} from "@/types/commercial";
import {
  DocumentHeader,
  DocumentFooter,
  DocumentBankDetails,
} from "@/components/documents/DocumentLayout";

// Mock data
const mockDevis: DocumentCommercial = {
  id: "1",
  numero: "DEV-2025-0001",
  type: "devis",
  categorie: "conteneurs",
  clientId: "1",
  clientNom: "TOTAL GABON",
  date: "2025-01-08",
  dateValidite: "2025-02-08",
  statut: "envoye",
  montantHT: 1500000,
  montantTVA: 270000,
  montantCSS: 15000,
  montantTTC: 1785000,
  montantPaye: 0,
  numeroBL: "MSCUAB123456",
  conteneurs: [
    {
      id: "1",
      numero: "MSCU1234567",
      taille: "40'",
      description: "Conteneur standard",
      prixUnitaire: 500000,
      operations: [
        {
          id: "1",
          type: "arrivee",
          description: "Arrivée au port",
          quantite: 1,
          prixUnitaire: 50000,
          prixTotal: 50000,
        },
        {
          id: "2",
          type: "transport",
          description: "Transport vers dépôt",
          quantite: 1,
          prixUnitaire: 150000,
          prixTotal: 150000,
        },
      ],
    },
    {
      id: "2",
      numero: "MSCU7654321",
      taille: "20'",
      description: "Conteneur réfrigéré",
      prixUnitaire: 800000,
      operations: [],
    },
  ],
};

const mockClient = {
  nom: "TOTAL GABON",
  adresse: "BP 1100, Libreville",
  telephone: "+241 01 79 80 00",
  email: "contact@total.ga",
};

export default function DevisPDFPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const devis = mockDevis;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Téléchargement du PDF en cours...");
    // Implémenter avec html2pdf.js
  };

  const handleSend = () => {
    toast.success("Devis envoyé par email");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Barre d'actions (masquée à l'impression) */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(`/devis/${id}`)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSend} className="gap-2">
              <Send className="h-4 w-4" />
              Envoyer
            </Button>
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Document */}
      <div className="max-w-4xl mx-auto p-4 print:p-0 print:max-w-none">
        <div className="bg-white shadow-lg print:shadow-none p-8 print:p-6">
          {/* En-tête */}
          <DocumentHeader
            title="DEVIS"
            numero={devis.numero}
            date={formatDate(devis.date)}
            secondaryLabel="Validité"
            secondaryValue={formatDate(devis.dateValidite)}
          />

          {/* Informations client */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">CLIENT</h3>
              <div className="text-sm">
                <p className="font-bold text-base">{mockClient.nom}</p>
                <p>{mockClient.adresse}</p>
                <p>{mockClient.telephone}</p>
                <p>{mockClient.email}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">RÉFÉRENCE</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Catégorie:</span>{" "}
                  <span className="font-medium">{categoriesConfig[devis.categorie].label}</span>
                </p>
                {devis.numeroBL && (
                  <p>
                    <span className="text-muted-foreground">N° BL:</span>{" "}
                    <span className="font-mono font-medium">{devis.numeroBL}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tableau des prestations */}
          <div className="mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border px-3 py-2 text-left font-semibold">Désignation</th>
                  <th className="border px-3 py-2 text-center font-semibold w-20">Qté</th>
                  <th className="border px-3 py-2 text-right font-semibold w-28">P.U.</th>
                  <th className="border px-3 py-2 text-right font-semibold w-32">Montant</th>
                </tr>
              </thead>
              <tbody>
                {devis.conteneurs?.map((conteneur) => (
                  <>
                    <tr key={conteneur.id}>
                      <td className="border px-3 py-2">
                        <span className="font-mono font-medium">{conteneur.numero}</span>
                        {conteneur.taille && ` - ${conteneur.taille}`}
                        {conteneur.description && (
                          <span className="text-muted-foreground ml-2">({conteneur.description})</span>
                        )}
                      </td>
                      <td className="border px-3 py-2 text-center">1</td>
                      <td className="border px-3 py-2 text-right">
                        {formatMontant(conteneur.prixUnitaire)}
                      </td>
                      <td className="border px-3 py-2 text-right font-medium">
                        {formatMontant(conteneur.prixUnitaire)}
                      </td>
                    </tr>
                    {conteneur.operations.map((op) => (
                      <tr key={op.id} className="text-muted-foreground">
                        <td className="border px-3 py-1 pl-8 text-xs">↳ {op.description || op.type}</td>
                        <td className="border px-3 py-1 text-center text-xs">{op.quantite}</td>
                        <td className="border px-3 py-1 text-right text-xs">
                          {formatMontant(op.prixUnitaire)}
                        </td>
                        <td className="border px-3 py-1 text-right text-xs">
                          {formatMontant(op.prixTotal)}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-1 text-sm">
                <span>Total HT</span>
                <span className="font-medium">{formatMontant(devis.montantHT)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span>TVA (18%)</span>
                <span>{formatMontant(devis.montantTVA)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span>CSS (1%)</span>
                <span>{formatMontant(devis.montantCSS)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-primary mt-2">
                <span>Total TTC</span>
                <span className="text-primary">{formatMontant(devis.montantTTC)}</span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="mb-6 p-4 bg-muted/30 rounded text-xs">
            <h3 className="font-semibold mb-2">CONDITIONS</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Ce devis est valable jusqu'au {formatDate(devis.dateValidite)}</li>
              <li>• Paiement: 50% à la commande, solde à la livraison</li>
              <li>• Les prix sont exprimés en Francs CFA (XAF)</li>
            </ul>
          </div>

          {/* Coordonnées bancaires */}
          <DocumentBankDetails />

          {/* Pied de page */}
          <DocumentFooter />
        </div>
      </div>
    </div>
  );
}
