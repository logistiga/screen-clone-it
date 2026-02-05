import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, Download, Loader2, Mail } from "lucide-react";
import { EmailModalWithTemplate } from "@/components/EmailModalWithTemplate";
import { QRCodeSVG } from "qrcode.react";
import { useOrdreById } from "@/hooks/use-commercial";
import { formatMontant, formatDate } from "@/data/mockData";
import { DocumentFooter } from "@/components/documents/DocumentLayout";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import logoLogistiga from "@/assets/lojistiga-logo.png";

export default function OrdrePDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: ordre, isLoading, error } = useOrdreById(id || "");

  const { contentRef, downloadPdf, generatePdfBlob } = usePdfDownload({ 
    filename: `OT_${ordre?.numero || 'unknown'}` 
  });

  const [showEmailModal, setShowEmailModal] = useState(false);

  // Téléchargement automatique au chargement
  useEffect(() => {
    if (ordre) {
      const timer = setTimeout(() => {
        downloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ordre, downloadPdf]);

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

  if (error || !ordre) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-xl font-semibold mb-2">Ordre non trouvé</h2>
          <Button onClick={() => navigate("/ordres")} className="transition-all duration-200 hover:scale-105">Retour aux ordres</Button>
        </div>
      </div>
    );
  }

  const client = ordre.client;
  const handlePrint = () => {
    window.print();
  };

  const isAnnule = ordre.statut === "annule";
  const resteAPayer = (ordre.montant_ttc || 0) - (ordre.montant_paye || 0);

  const getTypeOperationLabel = (type: string) => {
    const labels: Record<string, string> = {
      conteneurs: "Conteneurs",
      conventionnel: "Conventionnel",
      location: "Location",
      transport: "Transport",
      manutention: "Manutention",
      stockage: "Stockage",
      Conteneur: "Conteneurs",
      Lot: "Conventionnel",
      Independant: "Opérations Indépendantes"
    };
    return labels[type] || type;
  };

  // Construire les lignes pour le PDF
  const buildLignes = () => {
    const lignes: Array<{ description: string; quantite: number; prixUnitaire: number; montantHT: number }> = [];
    
    // Lignes directes
    if (ordre.lignes && ordre.lignes.length > 0) {
      ordre.lignes.forEach((ligne: any) => {
        lignes.push({
          description: ligne.description || ligne.type_operation || 'Prestation',
          quantite: ligne.quantite || 1,
          prixUnitaire: ligne.prix_unitaire || 0,
          montantHT: ligne.montant_ht || (ligne.quantite * ligne.prix_unitaire) || 0
        });
      });
    }
    
    // Conteneurs avec leurs opérations
    if (ordre.conteneurs && ordre.conteneurs.length > 0) {
      ordre.conteneurs.forEach((conteneur: any) => {
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
    if (ordre.lots && ordre.lots.length > 0) {
      ordre.lots.forEach((lot: any) => {
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
  
  // Données encodées dans le QR code (URL de vérification)
  const qrPayload = {
    type: "CONNAISSEMENT",
    numero: ordre.numero,
    date: ordre.date || ordre.created_at,
    client: client?.nom,
    typeOperation: ordre.type_document,
    montantTTC: ordre.montant_ttc,
    montantPaye: ordre.montant_paye || 0,
    reste: resteAPayer,
    statut: ordre.statut,
    url: `${window.location.origin}/ordres/${id}`
  };
  
  const qrData = `${window.location.origin}/verification?data=${encodeURIComponent(JSON.stringify(qrPayload))}`;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 z-50 bg-background border-b">
        <div className="container py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/ordres")} className="gap-2 transition-all duration-200 hover:scale-105">
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
          className="bg-white print:shadow-none print:border-none relative flex flex-col"
          style={{ width: '210mm', minHeight: '297mm', padding: '8mm' }}
        >
          {/* Watermark si annulé */}
          {isAnnule && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-destructive/20 text-6xl font-bold rotate-[-30deg] border-4 border-destructive/20 px-6 py-3">
                ANNULÉ
              </div>
            </div>
          )}

          {/* Contenu principal - grandit pour pousser le footer en bas */}
          <div className="flex-1">
            {/* Header avec logo et QR code */}
            <div className="flex justify-between items-start mb-2 border-b-2 border-primary pb-2">
              <div className="flex items-center gap-2">
                <img src={logoLogistiga} alt="LOGISTIGA" className="h-10 w-auto" />
                <div>
                  <p className="text-[9px] text-primary font-semibold">TRANSPORT-STOCKAGE</p>
                  <p className="text-[9px] text-primary font-semibold">-MANUTENTION</p>
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-base font-bold text-primary">CONNAISSEMENT</h1>
                <p className="text-[10px] font-semibold">{ordre.numero}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <QRCodeSVG value={qrData} size={40} level="M" />
                <p className="text-[6px] text-muted-foreground">Scannez pour vérifier</p>
              </div>
            </div>

            {/* Infos document */}
            <div className="flex justify-between text-[9px] mb-2">
              <div>
                <p><span className="font-semibold">Date:</span> {formatDate(ordre.date || ordre.created_at)}</p>
                <p><span className="font-semibold">Type:</span> {getTypeOperationLabel(ordre.type_document)}</p>
                {ordre.bl_numero && (
                  <p><span className="font-semibold">N° BL:</span> {ordre.bl_numero}</p>
                )}
              </div>
            </div>

            {/* Client - compact */}
            <div className="mb-2 border p-1.5 rounded">
              <h3 className="text-[9px] font-bold text-primary mb-0.5">CLIENT</h3>
              <p className="font-semibold text-[10px]">{client?.nom}</p>
              <p className="text-[8px] text-muted-foreground">{client?.adresse} - {client?.ville}, Gabon</p>
              <p className="text-[8px] text-muted-foreground">
                Tél: {client?.telephone} | Email: {client?.email}
              </p>
            </div>

            {/* Tableau des lignes - compact */}
            <table className="w-full mb-2 text-[9px] border-collapse border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="text-left py-1 px-1.5 font-semibold w-6 border-r">N°</th>
                  <th className="text-left py-1 px-1.5 font-semibold border-r">Description</th>
                  <th className="text-center py-1 px-1.5 font-semibold w-10 border-r">Qté</th>
                  <th className="text-right py-1 px-1.5 font-semibold w-16 border-r">Prix unit.</th>
                  <th className="text-right py-1 px-1.5 font-semibold w-20">Montant</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                    <td className="py-0.5 px-1.5 border-r border-b">{index + 1}</td>
                    <td className="py-0.5 px-1.5 border-r border-b">{ligne.description}</td>
                    <td className="text-center py-0.5 px-1.5 border-r border-b">{ligne.quantite}</td>
                    <td className="text-right py-0.5 px-1.5 border-r border-b">{formatMontant(ligne.prixUnitaire)}</td>
                    <td className="text-right py-0.5 px-1.5 font-medium border-b">
                      {formatMontant(ligne.montantHT)}
                    </td>
                  </tr>
                ))}
                {/* Lignes vides pour remplir (min 6 lignes) */}
                {Array.from({ length: Math.max(0, 6 - lignes.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-4">
                    <td className="py-0.5 px-1.5 border-r border-b">&nbsp;</td>
                    <td className="py-0.5 px-1.5 border-r border-b">&nbsp;</td>
                    <td className="py-0.5 px-1.5 border-r border-b">&nbsp;</td>
                    <td className="py-0.5 px-1.5 border-r border-b">&nbsp;</td>
                    <td className="py-0.5 px-1.5 border-b">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totaux - à droite (sans détail taxes sur connaissement) */}
            <div className="flex justify-end mb-2">
              <div className="w-44 border text-[9px]">
                <div className="flex justify-between py-0.5 px-1.5 bg-primary text-primary-foreground font-bold border-b">
                  <span>Total</span>
                  <span>{formatMontant(ordre.montant_ttc)}</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5 border-b">
                  <span>Payé</span>
                  <span className="text-green-600 font-medium">{formatMontant(ordre.montant_paye || 0)}</span>
                </div>
                <div className="flex justify-between py-0.5 px-1.5 font-bold">
                  <span>Reste à payer</span>
                  <span className={resteAPayer > 0 ? "text-destructive" : "text-green-600"}>
                    {formatMontant(resteAPayer)}
                  </span>
                </div>
              </div>
            </div>

            {/* Motif d'exonération */}
            {ordre.motif_exoneration && (
              <div className="mb-2 p-1.5 bg-amber-50 border border-amber-200 rounded text-[8px]">
                <strong className="text-amber-700">Exonération:</strong>{" "}
                <span className="text-amber-600">{ordre.motif_exoneration}</span>
              </div>
            )}

            {/* Notes */}
            {ordre.notes && (
              <div className="mb-2 border p-1.5 rounded">
                <h3 className="text-[8px] font-bold mb-0.5">NOTES</h3>
                <p className="text-[7px]">{ordre.notes}</p>
              </div>
            )}
          </div>

          {/* Section fixée en bas de page */}
          <div className="mt-auto">
            {/* DECLARATION CLIENT & CONDITIONS DE TRANSPORT */}
            <div className="border mb-2">
              <div className="grid grid-cols-2">
                {/* Déclaration Client */}
                <div className="border-r p-1.5">
                  <h4 className="font-bold text-[8px] border-b pb-0.5 mb-1">DECLARATION CLIENT</h4>
                  <p className="text-[6px] leading-tight text-justify">
                    JE DECLARE QUE le contenu de cette expédition est complètement et correctement décrit ci-dessus avec la 
                    désignation officielle de transport, qu'il est classé et empaqueté correctement, que les indications de danger 
                    pour les produits dangereux sont correctement appliquées ou affichées, et qu'il est, à tous les égards, en bon état pour 
                    être transporté selon les Règlements sur le transport des marchandises dangereuses. I HEREBY DECLARE that the 
                    contents of this consignment are fully and accurately described above by the proper shipping name, are properly 
                    classified and packaged, have dangerous goods safety marks properly affixed or displayed on them, and are in all 
                    respects in proper condition for transport according to the Transportation of Dangerous Goods Regulations. I declare 
                    to have accepted the conditions of transport
                  </p>
                  <p className="text-[7px] font-semibold mt-1">Signature et cachet :</p>
                </div>
                
                {/* Conditions de Transport */}
                <div className="p-1.5">
                  <h4 className="font-bold text-[8px] border-b pb-0.5 mb-1">CONDITIONS DE TRANSPORT</h4>
                  <p className="text-[6px] leading-tight text-justify">
                    En acceptant le présent document, vous acceptez, sans limitation, les conditions juridiques suivantes : à tout moment et sans préavis, 
                    LOGISTIGA peut modifier les présents termes et conditions juridiques. Logistiga n'est pas responsable de "Surtaxes et Détentions aux quais des Installations 
                    Portuaires" ni de "Surestaries de Détention à l'Import ou à l'Export". Logistiga n'est pas responsable de détention en cas de grève dans la zone 
                    portuaire/Logistiga N'EST PAS RESPONSABLE de la marchandise en cas d'émeute ou mouvements populaires ou les catastrophes naturelles. Logistiga 
                    n'est pas responsable de tout dommage que le conteneur en cas de sinistre déclaré pendant le transport ou le stockage. Logistiga a une assurance de 
                    transport plafonnée à 50 millions XAF par voyage. Une déclaration est obligatoire en cas de dépassement. Le client est le seul responsable de la 
                    marchandise et du matériel lié à la livraison à l'un des lieux inaccessibles.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <DocumentFooter />
          </div>
        </Card>
      </div>

      {/* Email Modal */}
      <EmailModalWithTemplate
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        documentType="ordre"
        documentData={{
          id: ordre.id,
          numero: ordre.numero,
          dateCreation: ordre.date || ordre.created_at,
          montantTTC: ordre.montant_ttc,
          montantHT: ordre.montant_ht,
          resteAPayer: resteAPayer,
          clientNom: ordre.client?.nom,
          clientEmail: ordre.client?.email,
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