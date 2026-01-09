import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ordresTravail, clients, formatMontant, formatDate } from "@/data/mockData";
import { DocumentFooter } from "@/components/documents/DocumentLayout";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import logoLojistiga from "@/assets/lojistiga-logo.png";

export default function OrdrePDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const ordre = ordresTravail.find((o) => o.id === id);
  const client = ordre ? clients.find((c) => c.id === ordre.clientId) : null;

  const { contentRef, downloadPdf } = usePdfDownload({ 
    filename: `OT_${ordre?.numero || 'unknown'}` 
  });

  // Téléchargement automatique au chargement
  useEffect(() => {
    if (ordre) {
      const timer = setTimeout(() => {
        downloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ordre, downloadPdf]);

  if (!ordre) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Ordre non trouvé</h2>
          <Button onClick={() => navigate("/ordres")}>Retour aux ordres</Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const isAnnule = ordre.statut === "annule";
  const resteAPayer = ordre.montantTTC - ordre.montantPaye;

  const getTypeOperationLabel = (type: string) => {
    const labels: Record<string, string> = {
      conteneurs: "Conteneurs",
      conventionnel: "Conventionnel",
      location: "Location",
      transport: "Transport",
      manutention: "Manutention",
      stockage: "Stockage"
    };
    return labels[type] || type;
  };
  
  // Données encodées dans le QR code (URL de vérification)
  const qrPayload = {
    type: "CONNAISSEMENT",
    numero: ordre.numero,
    date: ordre.dateCreation,
    client: client?.nom,
    typeOperation: ordre.typeOperation,
    montantTTC: ordre.montantTTC,
    montantPaye: ordre.montantPaye,
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
          <Button variant="ghost" onClick={() => navigate("/ordres")} className="gap-2">
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
          <div className="flex justify-between items-start mb-3 border-b-2 border-primary pb-2">
            <div className="flex items-center gap-3">
              <img src={logoLojistiga} alt="LOGISTIGA" className="h-12 w-auto" />
              <div>
                <p className="text-[10px] text-primary font-semibold">TRANSPORT-STOCKAGE</p>
                <p className="text-[10px] text-primary font-semibold">-MANUTENTION</p>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-lg font-bold text-primary">CONNAISSEMENT</h1>
              <p className="text-xs font-semibold">{ordre.numero}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <QRCodeSVG value={qrData} size={50} level="M" />
              <p className="text-[7px] text-muted-foreground">Scannez pour vérifier</p>
            </div>
          </div>

          {/* Infos document */}
          <div className="flex justify-between text-[10px] mb-3">
            <div>
              <p><span className="font-semibold">Date:</span> {formatDate(ordre.dateCreation)}</p>
              <p><span className="font-semibold">Type:</span> {getTypeOperationLabel(ordre.typeOperation)}</p>
            </div>
          </div>

          {/* Client */}
          <div className="mb-3 border p-2 rounded">
            <h3 className="text-[10px] font-bold text-primary mb-0.5">CLIENT</h3>
            <p className="font-semibold text-xs">{client?.nom}</p>
            <p className="text-[10px] text-muted-foreground">{client?.adresse} - {client?.ville}, Gabon</p>
            <p className="text-[10px] text-muted-foreground">
              Tél: {client?.telephone} | Email: {client?.email}
            </p>
          </div>

          {/* Tableau des lignes */}
          <table className="w-full mb-3 text-[10px] border-collapse border">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="text-left py-1.5 px-2 font-semibold w-8 border-r">N°</th>
                <th className="text-left py-1.5 px-2 font-semibold border-r">Description</th>
                <th className="text-center py-1.5 px-2 font-semibold w-12 border-r">Qté</th>
                <th className="text-right py-1.5 px-2 font-semibold w-20 border-r">Prix unit.</th>
                <th className="text-right py-1.5 px-2 font-semibold w-24">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {ordre.lignes.map((ligne, index) => (
                <tr key={ligne.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                  <td className="py-1 px-2 border-r border-b">{index + 1}</td>
                  <td className="py-1 px-2 border-r border-b">{ligne.description}</td>
                  <td className="text-center py-1 px-2 border-r border-b">{ligne.quantite}</td>
                  <td className="text-right py-1 px-2 border-r border-b">{formatMontant(ligne.prixUnitaire)}</td>
                  <td className="text-right py-1 px-2 font-medium border-b">
                    {formatMontant(ligne.montantHT)}
                  </td>
                </tr>
              ))}
              {/* Lignes vides pour remplir (min 8 lignes) */}
              {Array.from({ length: Math.max(0, 8 - ordre.lignes.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-5">
                  <td className="py-1 px-2 border-r border-b">&nbsp;</td>
                  <td className="py-1 px-2 border-r border-b">&nbsp;</td>
                  <td className="py-1 px-2 border-r border-b">&nbsp;</td>
                  <td className="py-1 px-2 border-r border-b">&nbsp;</td>
                  <td className="py-1 px-2 border-b">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div className="flex justify-end mb-3">
            <div className="w-48 border text-[10px]">
              <div className="flex justify-between py-0.5 px-2 border-b">
                <span>Total HT</span>
                <span className="font-medium">{formatMontant(ordre.montantHT)}</span>
              </div>
              <div className="flex justify-between py-0.5 px-2 border-b">
                <span>TVA (18%)</span>
                <span>{formatMontant(ordre.tva)}</span>
              </div>
              <div className="flex justify-between py-0.5 px-2 border-b">
                <span>CSS (1%)</span>
                <span>{formatMontant(ordre.css)}</span>
              </div>
              <div className="flex justify-between py-1 px-2 bg-primary text-primary-foreground font-bold border-b">
                <span>Total TTC</span>
                <span>{formatMontant(ordre.montantTTC)}</span>
              </div>
              <div className="flex justify-between py-0.5 px-2 border-b">
                <span>Payé</span>
                <span className="text-green-600 font-medium">{formatMontant(ordre.montantPaye)}</span>
              </div>
              <div className="flex justify-between py-1 px-2 font-bold">
                <span>Reste à payer</span>
                <span className={resteAPayer > 0 ? "text-destructive" : "text-green-600"}>
                  {formatMontant(resteAPayer)}
                </span>
              </div>
            </div>
          </div>

          {/* DECLARATION CLIENT & CONDITIONS DE TRANSPORT */}
          <div className="border mb-2">
            <div className="grid grid-cols-2">
              {/* Déclaration Client */}
              <div className="border-r p-2">
                <h4 className="font-bold text-[9px] border-b pb-1 mb-1">DECLARATION CLIENT</h4>
                <p className="text-[7px] leading-tight text-justify">
                  JE DECLARE QUE le contenu de cette expédition est complètement et correctement décrit ci-dessus avec la 
                  désignation officielle de transport, qu'il est classé et empaqueté correctement, que les indications de danger 
                  pour les produits dangereux sont correctement appliquées ou affichées, et qu'il est, à tous les égards, en bon état pour 
                  être transporté selon les Règlements sur le transport des marchandises dangereuses. I HEREBY DECLARE that the 
                  contents of this consignment are fully and accurately described above by the proper shipping name, are properly 
                  classified and packaged, have dangerous goods safety marks properly affixed or displayed on them, and are in all 
                  respects in proper condition for transport according to the Transportation of Dangerous Goods Regulations. I declare 
                  to have accepted the conditions of transport
                </p>
                <p className="text-[8px] font-semibold mt-2">Signature et cachet :</p>
              </div>
              
              {/* Conditions de Transport */}
              <div className="p-2">
                <h4 className="font-bold text-[9px] border-b pb-1 mb-1">CONDITIONS DE TRANSPORT</h4>
                <p className="text-[7px] leading-tight text-justify">
                  En acceptant le présent document, vous acceptez, sans limitation, les conditions juridiques suivantes : à tout moment et sans préavis, 
                  LOGISTIGA peut modifier les présents termes et conditions juridiques. Logistiga n'est pas responsable de "Surtaxes et Détentions aux quais des Installations 
                  Portuaires" ni de "Surestaries de Détention à l'Import ou à l'Export". Logistiga n'est pas responsable de détention en cas de grève dans la zone 
                  portuaire/Logistiga N'EST PAS RESPONSABLE de la marchandise en cas d'émeute ou mouvements populaires ou les catastrophes naturelles. Logistiga 
                  n'est pas responsable de tout dommage que le conteneur en cas de sinistre déclaré pendant le transport ou le stockage. Logistiga a une assurance de 
                  transport plafonnée à 50 millions XAF par voyage. Une déclaration est obligatoire en cas de dépassement. Le client est le seul responsable de la 
                  marchandise et du matériel lié à la livraison à l'un des lieux inaccessibles. Le client est le responsable du matériel en cas de dégât.
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {ordre.notes && (
            <div className="mb-2 border p-2 rounded">
              <h3 className="text-[9px] font-bold mb-0.5">NOTES</h3>
              <p className="text-[8px]">{ordre.notes}</p>
            </div>
          )}

          {/* Footer */}
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
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
