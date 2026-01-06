import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { ordresTravail, clients, formatMontant, formatDate } from "@/data/mockData";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import logoLojistiga from "@/assets/lojistiga-logo.png";

export default function ConnaissementPDFPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const ordre = ordresTravail.find((o) => o.id === id);
  const client = ordre ? clients.find((c) => c.id === ordre.clientId) : null;

  if (!ordre) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connaissement non trouvé</h2>
          <Button onClick={() => navigate("/ordres")}>Retour aux ordres</Button>
        </div>
      </div>
    );
  }

  const { contentRef, downloadPdf } = usePdfDownload({ 
    filename: `Connaissement_${ordre.numero}` 
  });

  const handlePrint = () => {
    window.print();
  };

  // Calcul du total
  const total = ordre.lignes.reduce((acc, ligne) => acc + ligne.montantHT, 0);

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
      <div className="container py-8 print:py-0">
        <Card 
          ref={contentRef} 
          className="mx-auto bg-white print:shadow-none print:border-none relative"
          style={{ width: '210mm', minHeight: '297mm', padding: '10mm' }}
        >
          {/* En-tête avec logo */}
          <div className="flex justify-between items-start mb-4 border-b-2 border-primary pb-3">
            <div className="flex items-center gap-3">
              <img src={logoLojistiga} alt="LOGISTIGA" className="h-14 w-auto" />
              <div>
                <p className="text-xs text-primary font-semibold">TRANSPORT-STOCKAGE</p>
                <p className="text-xs text-primary font-semibold">-MANUTENTION</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <p className="mb-1">Libreville le: {formatDate(ordre.dateCreation)}</p>
              <p className="font-semibold">Connaissement : {ordre.numero}</p>
              <p className="font-semibold mt-1">Num BL : {Math.floor(Math.random() * 900000000) + 100000000}</p>
            </div>
          </div>

          {/* Infos Client et QR */}
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="col-span-2 space-y-2">
              <div className="border-b pb-1">
                <span className="text-xs font-semibold">Client : </span>
                <span className="text-xs">{client?.nom}</span>
              </div>
              <div className="border-b pb-1">
                <span className="text-xs font-semibold">Destination : </span>
                <span className="text-xs">{client?.ville || "Libreville"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-1">
                <div>
                  <span className="text-xs font-semibold">Transitaire : </span>
                  <span className="text-xs">{client?.nom}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold">Compagnie maritime : </span>
                  <span className="text-xs">MAERSK</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-1">
                <div>
                  <span className="text-xs font-semibold">La Caution : </span>
                  <span className="text-xs">Non</span>
                </div>
                <div>
                  <span className="text-xs font-semibold">Nombre de TC : </span>
                  <span className="text-xs">{ordre.lignes.length}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold">Type De Connaissement : </span>
                  <span className="text-xs">Conteneurs</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-start">
              {/* QR Code placeholder */}
              <div className="w-20 h-20 border-2 border-gray-300 flex items-center justify-center">
                <span className="text-[8px] text-gray-400 text-center">QR Code</span>
              </div>
            </div>
          </div>

          {/* Titre section données */}
          <div className="bg-muted/50 text-center py-1 mb-2">
            <p className="text-xs font-semibold">Données fournies par le Transitaire</p>
          </div>

          {/* Tableau des lignes */}
          <table className="w-full border-collapse mb-2 text-xs">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left py-1.5 px-2 font-semibold w-10 border-r">N°</th>
                <th className="text-left py-1.5 px-2 font-semibold border-r">Descriptions</th>
                <th className="text-center py-1.5 px-2 font-semibold w-16 border-r">Qte</th>
                <th className="text-right py-1.5 px-2 font-semibold w-24 border-r">Prix unitaire</th>
                <th className="text-right py-1.5 px-2 font-semibold w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {ordre.lignes.map((ligne, index) => (
                <tr key={ligne.id} className="border-b">
                  <td className="py-1.5 px-2 border-r">{index + 1}</td>
                  <td className="py-1.5 px-2 border-r">{ligne.description}</td>
                  <td className="text-center py-1.5 px-2 border-r">{ligne.quantite}</td>
                  <td className="text-right py-1.5 px-2 border-r">{formatMontant(ligne.prixUnitaire)}</td>
                  <td className="text-right py-1.5 px-2 font-medium">{formatMontant(ligne.montantHT)}</td>
                </tr>
              ))}
              {/* Lignes vides pour remplir le tableau (min 10 lignes) */}
              {Array.from({ length: Math.max(0, 10 - ordre.lignes.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b h-6">
                  <td className="py-1.5 px-2 border-r">&nbsp;</td>
                  <td className="py-1.5 px-2 border-r">&nbsp;</td>
                  <td className="py-1.5 px-2 border-r">&nbsp;</td>
                  <td className="py-1.5 px-2 border-r">&nbsp;</td>
                  <td className="py-1.5 px-2">&nbsp;</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary">
                <td colSpan={4} className="text-right py-2 px-2 font-bold">Total:</td>
                <td className="text-right py-2 px-2 font-bold text-primary">{formatMontant(total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Déclarations en bas */}
          <div className="grid grid-cols-2 gap-3 mt-4 border-t pt-3">
            {/* Déclaration Client */}
            <div className="border p-2">
              <h4 className="text-xs font-bold text-primary mb-1">DECLARATION CLIENT</h4>
              <p className="text-[9px] leading-tight text-justify">
                JE DECLARE QUE le contenu de cette expédition est complètement et correctement décrit ci-dessus avec la 
                désignation officielle de transport, qu&apos;il est classé et empaqueté correctement, que les indications de danger 
                pour les produits dangereux sont correctement applicables ou affichées, et qu&apos;il est, à tous les égards, en bon état pour 
                être transporté selon les Règlements sur le transport des marchandises dangereuses. I HEREBY DECLARE that the 
                contents of this consignment are fully and accurately described above by the proper shipping name, are properly 
                classified and packaged, have dangerous goods safety marks properly affixed or displayed on them, and are in all 
                respects in proper conditions for transport according to the Transportation of Dangerous Goods Regulations. I declare 
                to have accepted the conditions of transport.
              </p>
              <p className="text-[9px] mt-2">Signature et cachet :</p>
            </div>

            {/* Conditions de Transport */}
            <div className="border p-2">
              <h4 className="text-xs font-bold text-primary mb-1">CONDITIONS DE TRANSPORT</h4>
              <p className="text-[9px] leading-tight text-justify">
                En acceptant le présent document, vous acceptez, sans limitation, les conditions juridiques suivantes : à tout moment et sans préavis, LOGISTIGA 
                peut modifier les présents termes et conditions juridiques. Logistiga n&apos;est pas responsable de &quot;Surtaxes et Détentions aux quais des Installations 
                Portuaires&quot; ni de &quot;Surestaries de Détention à l&apos;Import ou à l&apos;Export&quot;. Logistiga n&apos;est pas responsable de détention en cas de grève dans la zone 
                portuaire/Logistiga N&apos;EST PAS RESPONSABLE de la marchandise en cas d&apos;émeutes ou mouvements populaires ou les catastrophes naturelles. Logistiga 
                n&apos;est pas responsable de tout dommage que le conteneur en cas de sinistre déclaré pendant le transport ou le stockage. Logistiga a une assurance de 
                transport plafonnée à 50 millions XAF par voyage. Une déclaration est obligatoire en cas de dépassement. Le client est le seul responsable de la 
                marchandise et du matériel lié à la livraison à l&apos;un des lieux inaccessibles. Le client est responsable du matériel en cas de dégât.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-3 border-t text-center">
            <p className="text-[9px] font-semibold text-primary">
              LOGISTIGA SAS au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)
            </p>
            <p className="text-[9px]">
              Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03
            </p>
            <p className="text-[9px]">
              B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135
            </p>
            <p className="text-[9px]">
              Email: info@logistiga.com – Site web: www.logistiga.com
            </p>
            <p className="text-[9px] font-medium mt-1">
              Compte BGFI N°: 40003 04140 41041658011 78 – Compte UGB N°: 40002 00043 90000338691 84
            </p>
          </div>
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
