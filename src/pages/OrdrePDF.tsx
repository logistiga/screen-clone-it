import { useParams, useNavigate } from "react-router-dom";
import { roundMoney } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, Download, Loader2, Mail } from "lucide-react";
import { EmailModalWithTemplate } from "@/components/EmailModalWithTemplate";
import { QRCodeSVG } from "qrcode.react";
import { useOrdreById } from "@/hooks/use-commercial";
import { formatMontant, formatDate } from "@/data/mockData";
import { DocumentFooter } from "@/components/documents/DocumentLayout";
import { SignatureCachet } from "@/components/documents/SignatureCachet";
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
  const resteAPayer = roundMoney((ordre.montant_ttc || 0) - (ordre.montant_paye || 0));

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

  // Déterminer le type d'ordre
  const isConteneur = ordre.type_document === 'conteneurs' || ordre.type_document === 'Conteneur' || (ordre.conteneurs && ordre.conteneurs.length > 0);
  const isConventionnel = ordre.type_document === 'conventionnel' || ordre.type_document === 'Lot' || (ordre.lots && ordre.lots.length > 0);
  const isIndependant = ordre.type_document === 'operations_independantes' || ordre.type_document === 'Independant' || (!isConteneur && !isConventionnel && ordre.lignes && ordre.lignes.length > 0);

  // Construire les lignes pour le PDF selon le type
  const buildLignesConteneur = () => {
    const lignes: Array<{ numero: string; taille: string; montant: number }> = [];
    
    if (ordre.conteneurs && ordre.conteneurs.length > 0) {
      ordre.conteneurs.forEach((conteneur: any) => {
        lignes.push({
          numero: conteneur.numero || '',
          taille: conteneur.taille || '20',
          montant: conteneur.montant_ht || 0
        });
      });
    }
    
    return lignes;
  };

  const buildLignesConventionnel = () => {
    const lignes: Array<{ description: string; quantite: number; prixUnitaire: number; montant: number }> = [];
    
    if (ordre.lots && ordre.lots.length > 0) {
      ordre.lots.forEach((lot: any) => {
        lignes.push({
          description: lot.designation || `Lot`,
          quantite: lot.quantite || 1,
          prixUnitaire: lot.prix_unitaire || 0,
          montant: lot.montant_ht || (lot.quantite * lot.prix_unitaire) || 0
        });
      });
    }
    
    return lignes;
  };

  const buildLignesIndependant = () => {
    const lignes: Array<{ description: string; quantite: number; prixUnitaire: number; montant: number }> = [];
    
    if (ordre.lignes && ordre.lignes.length > 0) {
      ordre.lignes.forEach((ligne: any) => {
        lignes.push({
          description: ligne.description || ligne.type_operation || 'Prestation',
          quantite: ligne.quantite || 1,
          prixUnitaire: ligne.prix_unitaire || 0,
          montant: ligne.montant_ht || (ligne.quantite * ligne.prix_unitaire) || 0
        });
      });
    }
    
    return lignes;
  };

  const lignesConteneur = buildLignesConteneur();
  const lignesConventionnel = buildLignesConventionnel();
  const lignesIndependant = buildLignesIndependant();
  
  // URL pour le QR code - toujours pointer vers la production
  const baseUrl = "https://facturation.logistiga.pro";
  const qrPayload = {
    t: "ordre",
    n: ordre.numero,
    d: ordre.date || ordre.created_at,
    c: client?.nom || "",
    m: ordre.montant_ttc || 0,
    p: ordre.montant_paye || 0,
    s: ordre.statut
  };
  const qrData = `${baseUrl}/verifier?data=${encodeURIComponent(JSON.stringify(qrPayload))}`;

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
          style={{ width: '210mm', height: '297mm', padding: '10mm', paddingBottom: '34mm', overflow: 'hidden' }}
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
            <div className="flex justify-between items-start mb-4 border-b-2 border-primary pb-3">
              <img src={logoLogistiga} alt="LOGISTIGA" className="h-20 w-auto" />
              <div className="text-center">
                <h1 className="text-xl font-bold text-primary">CONNAISSEMENT</h1>
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
                <p><span className="font-semibold">Date:</span> {formatDate(ordre.date || ordre.created_at)}</p>
              </div>
              <div className="text-right">
                <p><span className="font-semibold">Type:</span> {getTypeOperationLabel(ordre.type_document)}</p>
                {isConteneur && ordre.type_operation && (
                  <p><span className="font-semibold">Opération:</span> {ordre.type_operation === 'import' ? 'Import' : ordre.type_operation === 'export' ? 'Export' : ordre.type_operation}</p>
                )}
              </div>
            </div>

            {/* Client (gauche) + Informations Opération (droite) */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Client */}
              <div className="border p-3 rounded">
                <h3 className="text-xs font-bold text-primary mb-1">CLIENT</h3>
                <p className="font-semibold text-sm">{client?.nom}</p>
                <p className="text-xs text-muted-foreground">{client?.adresse} - {client?.ville}, Gabon</p>
                <p className="text-xs text-muted-foreground">Tél: {client?.telephone}</p>
                <p className="text-xs text-muted-foreground">Email: {client?.email}</p>
              </div>

              {/* Informations Opération */}
              <div className="border p-3 rounded">
                <h3 className="text-xs font-bold text-primary mb-1">INFORMATIONS OPÉRATION</h3>
                <div className="text-xs space-y-0.5">
                  <p><span className="font-semibold">Catégorie:</span> {getTypeOperationLabel(ordre.type_document)}</p>
                  {isConteneur && ordre.type_operation && (
                    <p><span className="font-semibold">Type:</span> {ordre.type_operation === 'import' ? 'Import' : ordre.type_operation === 'export' ? 'Export' : ordre.type_operation}</p>
                  )}
                  {ordre.bl_numero && (
                    <p><span className="font-semibold">N° BL:</span> {ordre.bl_numero}</p>
                  )}
                  {(ordre as any).armateur?.nom && (
                    <p><span className="font-semibold">Armateur:</span> {(ordre as any).armateur.nom}</p>
                  )}
                  {(ordre as any).transitaire?.nom && (
                    <p><span className="font-semibold">Transitaire:</span> {(ordre as any).transitaire.nom}</p>
                  )}
                  {(ordre as any).navire && (
                    <p><span className="font-semibold">Navire:</span> {(ordre as any).navire}</p>
                  )}
                  {(ordre as any).representant?.nom && (
                    <p><span className="font-semibold">Représentant:</span> {(ordre as any).representant.nom}</p>
                  )}
                  {isIndependant && ordre.lignes?.some((l: any) => l.lieu_depart || l.lieu_arrivee) && (
                    <>
                      {ordre.lignes.filter((l: any) => l.lieu_depart || l.lieu_arrivee).map((l: any, i: number) => (
                        <p key={i}>
                          <span className="font-semibold">Trajet:</span>{" "}
                          {l.lieu_depart && l.lieu_arrivee ? `${l.lieu_depart} → ${l.lieu_arrivee}` : l.lieu_depart || l.lieu_arrivee}
                        </p>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* TABLEAU CONTENEURS */}
            {isConteneur && (
              <table className="w-full mb-4 text-xs border-collapse border">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="text-left py-2 px-2 font-semibold w-10 border-r">N°</th>
                    <th className="text-left py-2 px-2 font-semibold border-r">Conteneur</th>
                    <th className="text-center py-2 px-2 font-semibold w-20 border-r">Taille</th>
                    <th className="text-right py-2 px-2 font-semibold w-28">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {lignesConteneur.map((ligne, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="py-1.5 px-2 border-r border-b align-middle">{index + 1}</td>
                      <td className="py-1.5 px-2 border-r border-b font-mono align-middle">{ligne.numero}</td>
                      <td className="text-center py-1.5 px-2 border-r border-b align-middle">{ligne.taille}'</td>
                      <td className="text-right py-1.5 px-2 font-medium border-b align-middle">
                        {formatMontant(ligne.montant)}
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 6 - lignesConteneur.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-6">
                      <td className="py-1.5 px-2 border-r border-b align-middle">&nbsp;</td>
                      <td className="py-1.5 px-2 border-r border-b align-middle">&nbsp;</td>
                      <td className="py-1.5 px-2 border-r border-b align-middle">&nbsp;</td>
                      <td className="py-1.5 px-2 border-b align-middle">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TABLEAU CONVENTIONNEL */}
            {isConventionnel && (
              <table className="w-full mb-4 text-xs border-collapse border">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="text-left py-2 px-2 font-semibold w-10 border-r">N°</th>
                    <th className="text-left py-2 px-2 font-semibold border-r">Description</th>
                    <th className="text-center py-2 px-2 font-semibold w-14 border-r">Qté</th>
                    <th className="text-right py-2 px-2 font-semibold w-24 border-r">Prix unit.</th>
                    <th className="text-right py-2 px-2 font-semibold w-28">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {lignesConventionnel.map((ligne, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="py-1.5 px-2 border-r border-b align-middle">{index + 1}</td>
                      <td className="py-1.5 px-2 border-r border-b align-middle">{ligne.description}</td>
                      <td className="text-center py-1.5 px-2 border-r border-b align-middle">{ligne.quantite}</td>
                      <td className="text-right py-1.5 px-2 border-r border-b align-middle">{formatMontant(ligne.prixUnitaire)}</td>
                      <td className="text-right py-1.5 px-2 font-medium border-b align-middle">
                        {formatMontant(ligne.montant)}
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 6 - lignesConventionnel.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-6">
                      <td className="py-1.5 px-2 border-r border-b align-middle">&nbsp;</td>
                      <td className="py-1.5 px-2 border-r border-b align-middle">&nbsp;</td>
                      <td className="py-1.5 px-2 border-r border-b align-middle">&nbsp;</td>
                      <td className="py-1.5 px-2 border-r border-b align-middle">&nbsp;</td>
                      <td className="py-1.5 px-2 border-b align-middle">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TABLEAU OPERATIONS INDEPENDANTES */}
            {isIndependant && (
              <table className="w-full mb-4 text-xs border-collapse border">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="text-left py-2 px-2 font-semibold w-10 border-r">N°</th>
                    <th className="text-left py-2 px-2 font-semibold border-r">Prestation</th>
                    <th className="text-center py-2 px-2 font-semibold w-14 border-r">Qté</th>
                    <th className="text-right py-2 px-2 font-semibold w-24 border-r">Prix unit.</th>
                    <th className="text-right py-2 px-2 font-semibold w-28">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {lignesIndependant.map((ligne, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="py-1.5 px-2 border-r border-b align-middle">{index + 1}</td>
                      <td className="py-1.5 px-2 border-r border-b align-middle">{ligne.description}</td>
                      <td className="text-center py-1.5 px-2 border-r border-b align-middle">{ligne.quantite}</td>
                      <td className="text-right py-1.5 px-2 border-r border-b align-middle">{formatMontant(ligne.prixUnitaire)}</td>
                      <td className="text-right py-1.5 px-2 font-medium border-b align-middle">
                        {formatMontant(ligne.montant)}
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 6 - lignesIndependant.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-6">
                      <td className="py-1.5 px-2 border-r border-b align-middle">&nbsp;</td>
                      <td className="py-1.5 px-2 border-r border-b align-middle">&nbsp;</td>
                      <td className="py-1.5 px-2 border-r border-b align-middle">&nbsp;</td>
                      <td className="py-1.5 px-2 border-r border-b align-middle">&nbsp;</td>
                      <td className="py-1.5 px-2 border-b align-middle">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Totaux et Conditions de paiement */}
            <div className="flex justify-between mb-4 gap-4">
              {/* Conditions de paiement (avec cachet en haut à gauche) */}
              <div className="flex-1 p-3 border rounded text-xs">
                <div className="mb-2">
                  <SignatureCachet leftBlock size={100} />
                </div>
                <h3 className="font-bold mb-1">CONDITIONS DE PAIEMENT</h3>
                <p className="text-muted-foreground">
                  Paiement à réception. En cas de retard, des pénalités seront appliquées
                  conformément à la réglementation en vigueur.
                </p>
              </div>

              {/* Totaux */}
              <div className="w-56 border text-xs">
                <div className="flex justify-between py-1 px-3 bg-primary text-primary-foreground font-bold border-b">
                  <span>Total</span>
                  <span>{formatMontant(ordre.montant_ttc)}</span>
                </div>
                <div className="flex justify-between py-1 px-3 border-b">
                  <span>Payé</span>
                  <span className="text-green-600 font-medium">{formatMontant(ordre.montant_paye || 0)}</span>
                </div>
                <div className="flex justify-between py-1 px-3 font-bold">
                  <span>Reste à payer</span>
                  <span className={resteAPayer > 0 ? "text-destructive" : "text-green-600"}>
                    {formatMontant(resteAPayer)}
                  </span>
                </div>
              </div>
            </div>

            {/* Motif d'exonération */}
            {ordre.motif_exoneration && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs">
                <strong className="text-amber-700">Exonération:</strong>{" "}
                <span className="text-amber-600">{ordre.motif_exoneration}</span>
              </div>
            )}

            {/* Notes */}
            {ordre.notes && (
              <div className="mb-4 border p-3 rounded">
                <h3 className="text-xs font-bold mb-1">NOTES</h3>
                <p className="text-xs">{ordre.notes}</p>
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
            <DocumentFooter fixed />
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