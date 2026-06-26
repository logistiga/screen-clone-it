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
import { getPdfRowLimits, measurePdfFooterHeightMm, paginatePdfRows } from "@/lib/pdf-pagination";
import logoLogistiga from "@/assets/lojistiga-logo.png";

export default function OrdrePDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: ordre, isLoading, error } = useOrdreById(id || "");

  const { contentRef, downloadPdf, generatePdfBlob } = usePdfDownload({ 
    filename: `OT_${ordre?.numero || 'unknown'}` 
  });

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [footerHeightMm, setFooterHeightMm] = useState(18);

  useEffect(() => {
    if (!ordre) return;
    const updateFooterHeight = () => setFooterHeightMm(measurePdfFooterHeightMm());
    const frame = window.requestAnimationFrame(updateFooterHeight);
    window.addEventListener("resize", updateFooterHeight);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateFooterHeight);
    };
  }, [ordre]);

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

  // Construire les lignes pour le PDF selon le type (avec sous-lignes opérations)
  const buildLignesConteneur = () => {
    const lignes: Array<{
      isOperation: boolean;
      numero?: string;
      taille?: string;
      description: string;
      quantite: number;
      prixUnitaire: number;
      montant: number;
    }> = [];

    if (ordre.conteneurs && ordre.conteneurs.length > 0) {
      ordre.conteneurs.forEach((conteneur: any) => {
        const baseHT = Number(conteneur.prix_unitaire ?? 0);
        lignes.push({
          isOperation: false,
          numero: conteneur.numero || '',
          taille: conteneur.taille || '20',
          description: conteneur.description || '',
          quantite: 1,
          prixUnitaire: baseHT,
          montant: baseHT,
        });
        (conteneur.operations || []).forEach((op: any) => {
          const qte = Number(op.quantite ?? 1);
          const pu = Number(op.prix_unitaire ?? 0);
          const total = Number(op.prix_total ?? qte * pu);
          lignes.push({
            isOperation: true,
            description: `• ${op.type_operation || op.type || 'Opération'}${op.description ? ' — ' + op.description : ''}`,
            quantite: qte,
            prixUnitaire: pu,
            montant: total,
          });
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
    const lignes: Array<{ description: string; trajet?: string; quantite: number; prixUnitaire: number; montant: number }> = [];
    
    if (ordre.lignes && ordre.lignes.length > 0) {
      ordre.lignes.forEach((ligne: any) => {
        let trajet: string | undefined;
        if ((ligne.type_operation || '') === 'transport') {
          const dep = ligne.point_depart || ligne.lieu_depart;
          const arr = ligne.point_arrivee || ligne.lieu_arrivee;
          if (dep || arr) {
            trajet = `Trajet : ${dep || '—'} → ${arr || '—'}`;
          }
        }
        lignes.push({
          description: ligne.description || ligne.type_operation || 'Prestation',
          trajet,
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

      {/* PDF Content - A4 Format (paginé) */}
      <div className="container py-8 print:py-0 flex flex-col items-center gap-6 print:gap-0 animate-fade-in" ref={contentRef}>
        {(() => {
          const allRows: any[] = isConteneur
            ? lignesConteneur
            : isConventionnel
              ? lignesConventionnel
              : lignesIndependant;
          const pagination = getPdfRowLimits({
            footerHeightMm,
            firstHeaderMm: 58,
            compactHeaderMm: 16,
            lastContentMm: ordre.motif_exoneration || ordre.notes ? 86 : 76,
            singleLastContentMm: ordre.motif_exoneration || ordre.notes ? 90 : 80,
          });
          const pages = paginatePdfRows<any>(allRows, pagination);

          const renderTable = (rows: any[], startIndex: number) => {
            if (isConteneur) {
              const offsetCounter = (lignesConteneur as any[])
                .slice(0, startIndex)
                .filter((l) => !l.isOperation).length;
              let counter = offsetCounter;
              return (
                <table className="w-full mb-4 text-xs border-collapse border">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="text-left py-2 px-2 font-semibold w-8 border-r">N°</th>
                      <th className="text-left py-2 px-2 font-semibold border-r">Désignation</th>
                      <th className="text-center py-2 px-2 font-semibold w-12 border-r">Qté</th>
                      <th className="text-right py-2 px-2 font-semibold w-24 border-r">Prix unit.</th>
                      <th className="text-right py-2 px-2 font-semibold w-28">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((ligne: any, index: number) => {
                      if (!ligne.isOperation) counter++;
                      return (
                        <tr key={index} className={ligne.isOperation ? "bg-muted/10" : (counter % 2 === 0 ? "bg-muted/20" : "")}>
                          <td className="py-1.5 px-2 border-r border-b align-middle">{ligne.isOperation ? '' : counter}</td>
                          <td className={`py-1.5 px-2 border-r border-b align-middle ${ligne.isOperation ? 'pl-6 text-muted-foreground' : 'font-mono'}`}>
                            {ligne.isOperation ? (
                              <span className="font-sans">{ligne.description}</span>
                            ) : (
                              <>
                                <span>{ligne.numero}</span>
                                {ligne.taille && <span className="ml-1 text-muted-foreground">({ligne.taille}')</span>}
                                {ligne.description && (
                                  <> <span className="text-muted-foreground">|</span> <span className="font-sans">{ligne.description}</span></>
                                )}
                              </>
                            )}
                          </td>
                          <td className="text-center py-1.5 px-2 border-r border-b align-middle">{ligne.quantite}</td>
                          <td className="text-right py-1.5 px-2 border-r border-b align-middle">{formatMontant(ligne.prixUnitaire)}</td>
                          <td className="text-right py-1.5 px-2 font-medium border-b align-middle">{formatMontant(ligne.montant)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            }

            const label = isConventionnel ? "Description" : "Prestation";
            return (
              <table className="w-full mb-4 text-xs border-collapse border">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="text-left py-2 px-2 font-semibold w-10 border-r">N°</th>
                    <th className="text-left py-2 px-2 font-semibold border-r">{label}</th>
                    <th className="text-center py-2 px-2 font-semibold w-14 border-r">Qté</th>
                    <th className="text-right py-2 px-2 font-semibold w-24 border-r">Prix unit.</th>
                    <th className="text-right py-2 px-2 font-semibold w-28">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={5} className="py-3 px-2 border-b text-center text-muted-foreground">Aucune ligne</td></tr>
                  ) : rows.map((ligne: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="py-1.5 px-2 border-r border-b align-middle">{startIndex + index + 1}</td>
                      <td className="py-1.5 px-2 border-r border-b align-middle">
                        <div>{ligne.description}</div>
                        {ligne.trajet && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">{ligne.trajet}</div>
                        )}
                      </td>
                      <td className="text-center py-1.5 px-2 border-r border-b align-middle">{ligne.quantite}</td>
                      <td className="text-right py-1.5 px-2 border-r border-b align-middle">{formatMontant(ligne.prixUnitaire)}</td>
                      <td className="text-right py-1.5 px-2 font-medium border-b align-middle">{formatMontant(ligne.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          };

          const renderTotaux = () => (
            <>
              <div className="flex justify-between mb-4 gap-8 items-start">
                <div className="flex-1 p-3 border rounded text-xs relative">
                  <SignatureCachet leftBlock size={150} />
                  <h3 className="font-bold mb-1">CONDITIONS DE PAIEMENT</h3>
                  <p className="text-muted-foreground">
                    Paiement à réception. En cas de retard, des pénalités seront appliquées
                    conformément à la réglementation en vigueur.
                  </p>
                </div>

                <div className="w-72 border-2 border-primary rounded-md shadow-sm overflow-hidden text-xs shrink-0 self-start">
                  <div className="bg-primary/10 px-3 py-1.5 border-b border-primary/30">
                    <h3 className="text-[11px] font-bold text-primary uppercase tracking-wide">Récapitulatif</h3>
                  </div>

                  <div className="flex justify-between items-center gap-2 py-1.5 px-3 bg-primary text-primary-foreground font-bold border-b">
                    <span className="whitespace-nowrap">Total TTC</span>
                    <span className="whitespace-nowrap tabular-nums">{formatMontant(ordre.montant_ttc)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 py-1.5 px-3 border-b">
                    <span className="whitespace-nowrap">Payé</span>
                    <span className="whitespace-nowrap tabular-nums text-green-600 font-medium">{formatMontant(ordre.montant_paye || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 py-1.5 px-3 font-bold">
                    <span className="whitespace-nowrap">Reste à payer</span>
                    <span className={`whitespace-nowrap tabular-nums ${resteAPayer > 0 ? "text-destructive" : "text-green-600"}`}>
                      {formatMontant(resteAPayer)}
                    </span>
                  </div>
                </div>
              </div>

              {ordre.motif_exoneration && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs">
                  <strong className="text-amber-700">Exonération:</strong>{" "}
                  <span className="text-amber-600">{ordre.motif_exoneration}</span>
                </div>
              )}

              {ordre.notes && (
                <div className="mb-4 border p-3 rounded">
                  <h3 className="text-xs font-bold mb-1">NOTES</h3>
                  <p className="text-xs">{ordre.notes}</p>
                </div>
              )}
            </>
          );

          const renderLegalBlock = () => (
            <div className="border mb-2">
              <div className="grid grid-cols-2">
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
          );

          const renderFullHeader = () => (
            <>
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

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border p-3 rounded">
                  <h3 className="text-xs font-bold text-primary mb-1">CLIENT</h3>
                  <p className="font-semibold text-sm">{client?.nom}</p>
                  <p className="text-xs text-muted-foreground">{client?.adresse} - {client?.ville}, Gabon</p>
                  <p className="text-xs text-muted-foreground">Tél: {client?.telephone}</p>
                  <p className="text-xs text-muted-foreground">Email: {client?.email}</p>
                </div>

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
                  </div>
                </div>
              </div>
            </>
          );


          const renderCompactHeader = (pageIndex: number, totalPages: number) => (
            <div className="flex justify-between items-center mb-3 border-b border-primary/40 pb-2">
              <div className="flex items-center gap-3">
                <img src={logoLogistiga} alt="LOGISTIGA" className="h-10 w-auto" />
                <div>
                  <p className="text-sm font-bold text-primary leading-tight">CONNAISSEMENT {ordre.numero}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {client?.nom} • {formatDate(ordre.date || ordre.created_at)}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Page {pageIndex + 1} / {totalPages}</p>
            </div>
          );

          const startIndexes: number[] = [];
          let acc = 0;
          for (const p of pages) {
            startIndexes.push(acc);
            acc += p.length;
          }

          return pages.map((pageRows, pageIndex) => {
            const isFirst = pageIndex === 0;
            const isLast = pageIndex === pages.length - 1;
            return (
              <Card
                key={pageIndex}
                data-pdf-page
                className="bg-white print:shadow-none print:border-none relative flex flex-col"
                style={{ width: '210mm', height: '297mm', padding: '10mm', paddingBottom: `${pagination.footerReserveMm}mm`, overflow: 'hidden' }}
              >
                {isAnnule && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="text-destructive/20 text-6xl font-bold rotate-[-30deg] border-4 border-destructive/20 px-6 py-3">
                      ANNULÉ
                    </div>
                  </div>
                )}

                <div className="flex-1">
                  {isFirst ? renderFullHeader() : renderCompactHeader(pageIndex, pages.length)}
                  {renderTable(pageRows, startIndexes[pageIndex])}
                  {isLast && renderTotaux()}
                </div>

                <div className="mt-auto">
                  {isLast && renderLegalBlock()}
                  <DocumentFooter fixed />
                </div>
              </Card>
            );
          });
        })()}
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