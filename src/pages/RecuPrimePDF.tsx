import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";
import logoImage from "@/assets/logistiga-logo-new.png";

export default function RecuPrimePDF() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Récupérer les données du paiement depuis les query params
  const montant = parseFloat(searchParams.get('montant') || '0');
  const modePaiement = searchParams.get('mode') || '';
  const reference = searchParams.get('reference') || '';
  const date = searchParams.get('date') || new Date().toISOString();
  const beneficiaire = searchParams.get('beneficiaire') || '';
  const type = searchParams.get('type') || 'transitaire';
  const numeroRecu = searchParams.get('numero_recu') || '';
  const primesParam = searchParams.get('primes') || '';
  
  // Parser les primes depuis JSON
  let primes: Array<{ numero: string; montant: number }> = [];
  try {
    if (primesParam) {
      primes = JSON.parse(decodeURIComponent(primesParam));
    }
  } catch (e) {
    console.error('Error parsing primes:', e);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Actions - hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => window.history.length <= 2 ? navigate('/primes') : navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>

      {/* PDF Content */}
      <div className="max-w-2xl mx-auto p-8 print:p-0 print:max-w-none">
        <div className="bg-white print:shadow-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-800 pb-6 mb-6">
            <div>
              <img src={logoImage} alt="Logo" className="h-16 mb-2" />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-800">REÇU DE PAIEMENT</h1>
              <p className="text-sm text-gray-600 mt-1">Prime {type === 'transitaire' ? 'Transitaire' : 'Représentant'}</p>
              <p className="text-lg font-semibold text-primary mt-2">{numeroRecu || `N° ${id || 'AUTO'}`}</p>
            </div>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Bénéficiaire</p>
                <p className="text-lg font-semibold">{beneficiaire}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                <p className="font-medium">{type === 'transitaire' ? 'Transitaire' : 'Représentant commercial'}</p>
              </div>
            </div>
            <div className="space-y-3 text-right">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Date de paiement</p>
                <p className="text-lg font-semibold">{formatDate(date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Mode de paiement</p>
                <p className="font-medium">{modePaiement}</p>
              </div>
              {reference && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Référence</p>
                  <p className="font-medium">{reference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Primes Table */}
          {primes.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b pb-2">
                Détail des primes payées
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Document</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {primes.map((prime, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2">{prime.numero}</td>
                      <td className="py-2 text-right font-mono">{formatMontant(prime.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">TOTAL PAYÉ</span>
              <span className="text-3xl font-bold text-green-600">{formatMontant(montant)}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t">
            <div className="text-center">
              <div className="h-16 border-b border-dashed border-gray-400 mb-2"></div>
              <p className="text-sm text-gray-600">Signature du bénéficiaire</p>
            </div>
            <div className="text-center">
              <div className="h-16 border-b border-dashed border-gray-400 mb-2"></div>
              <p className="text-sm text-gray-600">Signature et cachet de l'entreprise</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-xs text-gray-500">
            <p>Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
            <p className="mt-1">Ce document fait office de reçu de paiement</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
