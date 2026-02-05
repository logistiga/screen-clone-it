import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, Download, Loader2, Mail } from "lucide-react";
import { EmailModalWithTemplate } from "@/components/EmailModalWithTemplate";
import { QRCodeSVG } from "qrcode.react";
import { formatMontant, formatDate } from "@/data/mockData";
import { DocumentFooter } from "@/components/documents/DocumentLayout";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import { useDevisById } from "@/hooks/use-commercial";
import logoLogistiga from "@/assets/lojistiga-logo.png";

export default function DevisPDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Utiliser les vraies données de l'API
  const { data: devisData, isLoading } = useDevisById(id || '');

  const { contentRef, downloadPdf, generatePdfBlob } = usePdfDownload({ 
    filename: `Devis_${devisData?.numero || 'unknown'}` 
  });

  const [showEmailModal, setShowEmailModal] = useState(false);

  // Téléchargement automatique au chargement (après le chargement des données)
  useEffect(() => {
    if (devisData && !isLoading) {
      const timer = setTimeout(() => {
        downloadPdf();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [devisData, isLoading, downloadPdf]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Génération du PDF...</p>
        </div>
      </div>
    );
  }

  if (!devisData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-xl font-semibold mb-2">Devis non trouvé</h2>
          <Button onClick={() => navigate("/devis")} className="transition-all duration-200 hover:scale-105">
            Retour aux devis
          </Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const isAnnule = devisData.statut === "refuse" || devisData.statut === "expire";
  const client = devisData.client;
  
  // Construire les lignes à afficher (depuis lignes, conteneurs ou lots)
  const getLignesAffichage = () => {
    // Lignes directes (opérations indépendantes)
    if (devisData.lignes && devisData.lignes.length > 0) {
      return devisData.lignes.map((l: any) => ({
        id: l.id,
        description: l.description || l.type_operation || 'Prestation',
        quantite: l.quantite || 1,
        prixUnitaire: l.prix_unitaire || 0,
        montantHT: l.montant_ht || (l.quantite * l.prix_unitaire) || 0,
      }));
    }
    
    // Conteneurs avec opérations
    if (devisData.conteneurs && devisData.conteneurs.length > 0) {
      const lignes: any[] = [];
      devisData.conteneurs.forEach((c: any) => {
        if (c.operations && c.operations.length > 0) {
          c.operations.forEach((op: any) => {
            lignes.push({
              id: op.id,
              description: `${c.numero || 'Conteneur'} ${c.taille}' - ${op.description || op.type}`,
              quantite: op.quantite || 1,
              prixUnitaire: op.prix_unitaire || 0,
              montantHT: op.prix_total || (op.quantite * op.prix_unitaire) || 0,
            });
          });
        } else {
          lignes.push({
            id: c.id,
            description: `Conteneur ${c.numero || ''} ${c.taille}'`,
            quantite: 1,
            prixUnitaire: c.prix_unitaire || 0,
            montantHT: c.prix_unitaire || 0,
          });
        }
      });
      return lignes;
    }
    
    // Lots (conventionnel)
    if (devisData.lots && devisData.lots.length > 0) {
      return devisData.lots.map((l: any) => ({
        id: l.id,
        description: l.description || l.numero_lot || 'Lot',
        quantite: l.quantite || 1,
        prixUnitaire: l.prix_unitaire || 0,
        montantHT: l.prix_total || (l.quantite * l.prix_unitaire) || 0,
      }));
    }
    
    return [];
  };
  
  const lignesAffichage = getLignesAffichage();
  
  // URL pour le QR code - encode les données essentielles directement
  const baseUrl = window.location.origin;
  const qrPayload = {
    t: "devis",
    n: devisData.numero,
    d: devisData.date_creation || devisData.date,
    c: client?.nom || "",
    m: devisData.montant_ttc || 0,
    p: 0,
    s: devisData.statut
  };
  const qrData = `${baseUrl}/verifier?data=${encodeURIComponent(JSON.stringify(qrPayload))}`;

  return (
    <div className="min-h-screen bg-muted/30 animate-fade-in">
      {/* Toolbar - hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-background border-b">
        <div className="container py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/devis")} className="gap-2 transition-all duration-200 hover:scale-105">
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
              <img src={logoLogistiga} alt="LOGISTIGA" className="h-14 w-auto" />
              <div>
                <p className="text-xs text-primary font-semibold">TRANSPORT-STOCKAGE</p>
                <p className="text-xs text-primary font-semibold">-MANUTENTION</p>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-primary">DEVIS</h1>
              <p className="text-sm font-semibold">{devisData.numero}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <QRCodeSVG value={qrData} size={60} level="M" />
              <p className="text-[8px] text-muted-foreground">Scannez pour vérifier</p>
            </div>
          </div>

          {/* Infos document */}
          <div className="flex justify-between text-xs mb-4">
            <div>
              <p><span className="font-semibold">Date:</span> {formatDate(devisData.date_creation || devisData.date)}</p>
              <p><span className="font-semibold">Validité:</span> {formatDate(devisData.date_validite)}</p>
            </div>
          </div>

          {/* Client */}
          <div className="mb-4 border p-3 rounded">
            <h3 className="text-xs font-bold text-primary mb-1">CLIENT</h3>
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
              {lignesAffichage.map((ligne, index) => (
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
              {/* Lignes vides pour remplir (min 8 lignes) */}
              {Array.from({ length: Math.max(0, 8 - lignesAffichage.length) }).map((_, i) => (
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
                <span className="font-medium">{formatMontant(devisData.montant_ht || 0)}</span>
              </div>
              <div className="flex justify-between py-1 px-3 border-b">
                <span>TVA (18%)</span>
                <span>{formatMontant(devisData.montant_tva || devisData.tva || 0)}</span>
              </div>
              <div className="flex justify-between py-1 px-3 border-b">
                <span>CSS (1%)</span>
                <span>{formatMontant(devisData.montant_css || devisData.css || 0)}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-primary text-primary-foreground font-bold">
                <span>Total TTC</span>
                <span>{formatMontant(devisData.montant_ttc || 0)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {devisData.notes && (
            <div className="mb-3 border p-2 rounded">
              <h3 className="text-xs font-bold mb-1">NOTES</h3>
              <p className="text-xs">{devisData.notes}</p>
            </div>
          )}

          {/* Conditions */}
          <div className="border-t pt-3 text-xs mb-4">
            <h3 className="font-bold mb-1">Conditions</h3>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>Ce devis est valable jusqu&apos;au {formatDate(devisData.date_validite)}</li>
              <li>Paiement: 50% à la commande, 50% à la livraison</li>
              <li>Délai de réalisation: selon disponibilité</li>
            </ul>
          </div>

          {/* Footer */}
          <DocumentFooter />
        </Card>
      </div>

      {/* Email Modal */}
      <EmailModalWithTemplate
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        documentType="devis"
        documentData={{
          id: devisData.id,
          numero: devisData.numero,
          dateCreation: devisData.date_creation || devisData.date,
          dateValidite: devisData.date_validite,
          montantTTC: devisData.montant_ttc,
          montantHT: devisData.montant_ht,
          clientNom: devisData.client?.nom,
          clientEmail: devisData.client?.email,
        }}
        generatePdfBlob={generatePdfBlob}
      />

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
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
