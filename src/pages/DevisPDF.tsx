import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, Download, Loader2, Mail } from "lucide-react";
import { EmailModalWithTemplate } from "@/components/EmailModalWithTemplate";
import { QRCodeSVG } from "qrcode.react";
import { formatMontant, formatDate } from "@/data/mockData";
import { DocumentFooter } from "@/components/documents/DocumentLayout";
import { SignatureCachet } from "@/components/documents/SignatureCachet";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import { useDevisById } from "@/hooks/use-commercial";
import logoLogistiga from "@/assets/lojistiga-logo.png";

export default function DevisPDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Utiliser les vraies données de l'API
  const { data: devisResponse, isLoading } = useDevisById(id || '');
  const devisData = devisResponse as any;

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
  
  // URL pour le QR code - toujours pointer vers la production
  const baseUrl = "https://facturation.logistiga.pro";
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

      {/* PDF Content - A4 Format (paginé) */}
      <div className="container py-8 print:py-0 flex flex-col items-center gap-6 print:gap-0 animate-fade-in" ref={contentRef}>
        {(() => {
          const ROWS_PAGE_1 = 22;
          const ROWS_MIDDLE = 38;
          const ROWS_LAST_WITH_TOTALS = 18;

          type Row = (typeof lignesAffichage)[number];
          const allRows: Row[] = lignesAffichage as any;
          const totalRows = allRows.length;

          const pages: Row[][] = [];
          if (totalRows === 0) {
            pages.push([]);
          } else if (totalRows <= ROWS_PAGE_1) {
            pages.push(allRows);
          } else {
            pages.push(allRows.slice(0, ROWS_PAGE_1));
            let cursor = ROWS_PAGE_1;
            while (totalRows - cursor > ROWS_LAST_WITH_TOTALS) {
              pages.push(allRows.slice(cursor, cursor + ROWS_MIDDLE));
              cursor += ROWS_MIDDLE;
            }
            pages.push(allRows.slice(cursor));
          }

          const renderTable = (rows: Row[], startIndex: number) => (
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
                {rows.length === 0 ? (
                  <tr><td colSpan={5} className="py-3 px-2 border-b text-center text-muted-foreground">Aucune ligne</td></tr>
                ) : rows.map((ligne: any, index: number) => (
                  <tr key={ligne.id ?? index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                    <td className="py-1.5 px-2 border-r border-b align-middle">{startIndex + index + 1}</td>
                    <td className="py-1.5 px-2 border-r border-b align-middle">{ligne.description}</td>
                    <td className="text-center py-1.5 px-2 border-r border-b align-middle">{ligne.quantite}</td>
                    <td className="text-right py-1.5 px-2 border-r border-b align-middle">{formatMontant(ligne.prixUnitaire)}</td>
                    <td className="text-right py-1.5 px-2 font-medium border-b align-middle">{formatMontant(ligne.montantHT)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );

          const renderTotaux = () => (
            <>
              <div className="flex justify-between mb-4 gap-8 items-start">
                <div className="flex-1 p-3 border rounded text-xs relative">
                  <h3 className="font-bold mb-1">CONDITIONS DE PAIEMENT</h3>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>Devis valable jusqu&apos;au {formatDate(devisData.date_validite)}</li>
                    <li>Paiement: 50% à la commande, 50% à la livraison</li>
                    <li>Délai de réalisation: selon disponibilité</li>
                  </ul>
                </div>

                <div className="w-72 border-2 border-primary rounded-md shadow-sm overflow-hidden text-xs shrink-0 self-start [&_.label]:text-left [&_.amount]:text-right [&_.amount]:tabular-nums [&_.amount]:whitespace-nowrap">
                  <div className="bg-primary/10 px-3 py-1.5 border-b border-primary/30">
                    <h3 className="text-[11px] font-bold text-primary uppercase tracking-wide">Récapitulatif</h3>
                  </div>

                  <div className="flex justify-between items-center gap-2 py-1 px-3 border-b">
                    <span className="label">Total HT</span>
                    <span className="amount font-medium">{formatMontant(devisData.montant_ht || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 py-1 px-3 border-b">
                    <span className="label">TVA (18%)</span>
                    <span className="amount">{formatMontant(devisData.montant_tva || devisData.tva || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 py-1 px-3 border-b">
                    <span className="label">CSS (1%)</span>
                    <span className="amount">{formatMontant(devisData.montant_css || devisData.css || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 py-2 px-3 bg-primary text-primary-foreground font-bold">
                    <span className="label">Total TTC</span>
                    <span className="amount">{formatMontant(devisData.montant_ttc || 0)}</span>
                  </div>
                </div>
              </div>

              {devisData.notes && (
                <div className="mb-3 border p-2 rounded">
                  <h3 className="text-xs font-bold mb-1">NOTES</h3>
                  <p className="text-xs">{devisData.notes}</p>
                </div>
              )}
            </>
          );

          const renderFullHeader = () => (
            <>
              <div className="flex justify-between items-start mb-4 border-b-2 border-primary pb-3">
                <img src={logoLogistiga} alt="LOGISTIGA" className="h-20 w-auto" />
                <div className="text-center">
                  <h1 className="text-xl font-bold text-primary">DEVIS</h1>
                  <p className="text-sm font-semibold">{devisData.numero}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <QRCodeSVG value={qrData} size={60} level="M" />
                  <p className="text-[8px] text-muted-foreground">Scannez pour vérifier</p>
                </div>
              </div>

              <div className="flex justify-between text-xs mb-4">
                <div>
                  <p><span className="font-semibold">Date:</span> {formatDate(devisData.date_creation || devisData.date)}</p>
                  <p><span className="font-semibold">Validité:</span> {formatDate(devisData.date_validite)}</p>
                </div>
                <div className="text-right">
                  <p>
                    <span className="font-semibold">Catégorie:</span>{" "}
                    {devisData.type_document === 'Conteneur' ? 'Conteneurs' : devisData.type_document === 'Lot' ? 'Conventionnel' : 'Opérations Indépendantes'}
                  </p>
                  {devisData.type_operation && (
                    <p><span className="font-semibold">Type:</span> {devisData.type_operation}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border p-3 rounded">
                  <h3 className="text-xs font-bold text-primary mb-1">CLIENT</h3>
                  <p className="font-semibold text-sm">{client?.nom}</p>
                  <p className="text-xs text-muted-foreground">{client?.adresse} - {client?.ville}, Gabon</p>
                  <p className="text-xs text-muted-foreground">Tél: {client?.telephone}</p>
                  {client?.email && <p className="text-xs text-muted-foreground">Email: {client?.email}</p>}
                  {(client?.nif || client?.rccm) && (
                    <p className="text-xs text-muted-foreground">
                      {client?.nif && `NIF: ${client.nif}`}
                      {client?.nif && client?.rccm && ' | '}
                      {client?.rccm && `RCCM: ${client.rccm}`}
                    </p>
                  )}
                </div>

                <div className="border p-3 rounded">
                  <h3 className="text-xs font-bold text-primary mb-1">INFORMATIONS OPÉRATION</h3>
                  <div className="text-xs space-y-0.5">
                    <p>
                      <span className="font-semibold">Catégorie:</span>{" "}
                      {devisData.type_document === 'Conteneur' ? 'Conteneurs' : devisData.type_document === 'Lot' ? 'Conventionnel' : 'Opérations Indépendantes'}
                    </p>
                    {devisData.type_operation && (
                      <p><span className="font-semibold">Type:</span> {devisData.type_operation}</p>
                    )}
                    {devisData.numero_bl && (
                      <p><span className="font-semibold">N° BL:</span> {devisData.numero_bl}</p>
                    )}
                    {devisData.armateur?.nom && (
                      <p><span className="font-semibold">Armateur:</span> {devisData.armateur.nom}</p>
                    )}
                    {devisData.transitaire?.nom && (
                      <p><span className="font-semibold">Transitaire:</span> {devisData.transitaire.nom}</p>
                    )}
                    {devisData.navire && (
                      <p><span className="font-semibold">Navire:</span> {devisData.navire}</p>
                    )}
                    {devisData.representant?.nom && (
                      <p><span className="font-semibold">Représentant:</span> {devisData.representant.nom}</p>
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
                  <p className="text-sm font-bold text-primary leading-tight">DEVIS {devisData.numero}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {client?.nom} • {formatDate(devisData.date_creation || devisData.date)}
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
                className="bg-white print:shadow-none print:border-none relative flex flex-col"
                style={{ width: '210mm', height: '297mm', padding: '10mm', paddingBottom: '34mm', overflow: 'hidden' }}
              >
                {isAnnule && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="text-destructive/20 text-6xl font-bold rotate-[-30deg] border-4 border-destructive/20 px-6 py-3">
                      ANNULÉ
                    </div>
                  </div>
                )}

                {isFirst ? renderFullHeader() : renderCompactHeader(pageIndex, pages.length)}

                {renderTable(pageRows, startIndexes[pageIndex])}

                {isLast && renderTotaux()}

                <DocumentFooter fixed />
              </Card>
            );
          });
        })()}
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
