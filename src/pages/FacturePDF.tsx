import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, Download, Loader2, Mail } from "lucide-react";
import { EmailModalWithTemplate } from "@/components/EmailModalWithTemplate";
import { QRCodeSVG } from "qrcode.react";
import { useFactureById } from "@/hooks/use-commercial";
import { formatMontant, formatDate } from "@/data/mockData";
import { DocumentFooter, DocumentBankDetails } from "@/components/documents/DocumentLayout";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import logoLogistiga from "@/assets/lojistiga-logo.png";

export default function FacturePDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: facture, isLoading, error } = useFactureById(id || "");

  const { contentRef, downloadPdf, generatePdfBlob } = usePdfDownload({ 
    filename: `Facture_${facture?.numero || 'unknown'}` 
  });

  const [showEmailModal, setShowEmailModal] = useState(false);

  // Téléchargement automatique au chargement
  useEffect(() => {
    if (facture) {
      const timer = setTimeout(() => {
        downloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [facture, downloadPdf]);

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

  if (error || !facture) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-xl font-semibold mb-2">Facture non trouvée</h2>
          <Button onClick={() => navigate("/factures")} className="transition-all duration-200 hover:scale-105">Retour aux factures</Button>
        </div>
      </div>
    );
  }

  const client = facture.client;
  const handlePrint = () => {
    window.print();
  };

  const isAnnulee = facture.statut === "annulee";
  const resteAPayer = (facture.montant_ttc || 0) - (facture.montant_paye || 0);

  // Construire les lignes pour le PDF
  const buildLignes = () => {
    const lignes: Array<{ description: string; quantite: number; prixUnitaire: number; montantHT: number }> = [];
    
    // Lignes directes
    if (facture.lignes && facture.lignes.length > 0) {
      facture.lignes.forEach((ligne: any) => {
        lignes.push({
          description: ligne.description || ligne.type_operation || 'Prestation',
          quantite: ligne.quantite || 1,
          prixUnitaire: ligne.prix_unitaire || 0,
          montantHT: ligne.montant_ht || (ligne.quantite * ligne.prix_unitaire) || 0
        });
      });
    }
    
    // Conteneurs avec leurs opérations
    if (facture.conteneurs && facture.conteneurs.length > 0) {
      facture.conteneurs.forEach((conteneur: any) => {
        if (conteneur.operations && conteneur.operations.length > 0) {
          conteneur.operations.forEach((op: any) => {
            lignes.push({
              description: `${conteneur.numero} - ${op.description || op.type_operation}`,
              quantite: op.quantite || 1,
              prixUnitaire: op.prix_unitaire || 0,
              montantHT: op.montant_ht || (op.quantite * op.prix_unitaire) || 0
            });
          });
        } else {
          lignes.push({
            description: `Conteneur ${conteneur.numero} (${conteneur.taille})`,
            quantite: 1,
            prixUnitaire: conteneur.montant_ht || 0,
            montantHT: conteneur.montant_ht || 0
          });
        }
      });
    }
    
    // Lots
    if (facture.lots && facture.lots.length > 0) {
      facture.lots.forEach((lot: any) => {
        lignes.push({
          description: lot.designation || `Lot`,
          quantite: lot.quantite || 1,
          prixUnitaire: lot.prix_unitaire || 0,
          montantHT: lot.montant_ht || (lot.quantite * lot.prix_unitaire) || 0
        });
      });
    }
    
    return lignes;
  };

  const lignes = buildLignes();
  
  // Données pour le QR code de vérification
  const qrPayload = {
    type: "FACTURE",
    numero: facture.numero,
    date: facture.date_facture || facture.created_at,
    client: client?.nom,
    montantTTC: facture.montant_ttc,
    montantPaye: facture.montant_paye || 0,
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
          <Button variant="ghost" onClick={() => navigate("/factures")} className="gap-2 transition-all duration-200 hover:scale-105">
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
            <Button variant="outline" onClick={() => setShowEmailModal(true)} className="gap-2 transition-all duration-200 hover:scale-105">
              <Mail className="h-4 w-4" />
              Envoyer par email
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content - A4 Format */}
      <div className="container py-8 print:py-0 flex justify-center animate-fade-in">
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
              <img src={logoLogistiga} alt="LOGISTIGA" className="h-14 w-auto" />
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
              <p><span className="font-semibold">Date:</span> {formatDate(facture.date_facture || facture.created_at)}</p>
              <p><span className="font-semibold">Échéance:</span> {formatDate(facture.date_echeance)}</p>
              {facture.bl_numero && (
                <p><span className="font-semibold">N° BL:</span> {facture.bl_numero}</p>
              )}
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
              {lignes.map((ligne, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
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
              {Array.from({ length: Math.max(0, 10 - lignes.length) }).map((_, i) => (
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
                <span className="font-medium">{formatMontant(facture.montant_ht)}</span>
              </div>
              <div className="flex justify-between py-1 px-3 border-b">
                <span>
                  TVA ({facture.taux_tva || 18}%)
                  {facture.exonere_tva && <span className="text-amber-600 ml-1 text-[9px]">(Exonéré)</span>}
                </span>
                <span className={facture.exonere_tva ? "line-through text-muted-foreground" : ""}>
                  {formatMontant(facture.exonere_tva ? 0 : facture.montant_tva)}
                </span>
              </div>
              <div className="flex justify-between py-1 px-3 border-b">
                <span>
                  CSS ({facture.taux_css || 1}%)
                  {facture.exonere_css && <span className="text-amber-600 ml-1 text-[9px]">(Exonéré)</span>}
                </span>
                <span className={facture.exonere_css ? "line-through text-muted-foreground" : ""}>
                  {formatMontant(facture.exonere_css ? 0 : facture.montant_css)}
                </span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-primary text-primary-foreground font-bold border-b">
                <span>Total TTC</span>
                <span>{formatMontant(facture.montant_ttc)}</span>
              </div>
              <div className="flex justify-between py-1 px-3 border-b">
                <span>Payé</span>
                <span className="text-green-600 font-medium">{formatMontant(facture.montant_paye || 0)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 font-bold">
                <span>Reste à payer</span>
                <span className={resteAPayer > 0 ? "text-destructive" : "text-green-600"}>
                  {formatMontant(resteAPayer)}
                </span>
              </div>
            </div>
          </div>

          {/* Motif d'exonération */}
          {facture.motif_exoneration && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
              <strong className="text-amber-700">Exonération:</strong>{" "}
              <span className="text-amber-600">{facture.motif_exoneration}</span>
            </div>
          )}

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

      {/* Email Modal */}
      <EmailModalWithTemplate
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        documentType="facture"
        documentData={{
          id: facture.id,
          numero: facture.numero,
          dateCreation: facture.date_facture || facture.created_at,
          dateEcheance: facture.date_echeance,
          montantTTC: facture.montant_ttc,
          montantHT: facture.montant_ht,
          resteAPayer: resteAPayer,
          clientNom: facture.client?.nom,
          clientEmail: facture.client?.email,
        }}
        generatePdfBlob={generatePdfBlob}
      />

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