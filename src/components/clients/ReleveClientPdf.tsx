import { forwardRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Client } from "@/lib/api/commercial";

interface ReleveClientPdfProps {
  client: Client;
  dateDebut: Date;
  dateFin: Date;
  factures: any[];
  ordres: any[];
  devis: any[];
  paiements: any[];
  selectedTypes: string[];
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(montant)) + ' FCFA';
};

export const ReleveClientPdf = forwardRef<HTMLDivElement, ReleveClientPdfProps>(
  ({ client, dateDebut, dateFin, factures, ordres, devis, paiements, selectedTypes }, ref) => {
    // Filtrer les données par période
    const filterByPeriod = (items: any[], dateField: string) => {
      return items.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= dateDebut && itemDate <= dateFin;
      });
    };

    const filteredFactures = selectedTypes.includes('factures') 
      ? filterByPeriod(factures, 'date_facture') 
      : [];
    const filteredOrdres = selectedTypes.includes('ordres') 
      ? filterByPeriod(ordres, 'date') 
      : [];
    const filteredDevis = selectedTypes.includes('devis') 
      ? filterByPeriod(devis, 'date') 
      : [];
    const filteredPaiements = selectedTypes.includes('paiements') 
      ? filterByPeriod(paiements, 'date') 
      : [];

    // Calculs des totaux
    const totalFactures = filteredFactures.reduce((sum, f) => sum + (f.montant_ttc || 0), 0);
    const totalPaye = filteredFactures.reduce((sum, f) => sum + (f.montant_paye || 0), 0);
    const soldeFactures = totalFactures - totalPaye;

    return (
      <div ref={ref} className="p-8 bg-white text-black print:p-0" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* En-tête */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RELEVÉ DE COMPTE</h1>
              <p className="text-gray-600 mt-1">
                Période: {format(dateDebut, "dd MMMM yyyy", { locale: fr })} - {format(dateFin, "dd MMMM yyyy", { locale: fr })}
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>Généré le {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
            </div>
          </div>
        </div>

        {/* Informations client */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
          <h2 className="font-semibold text-lg mb-2">Client</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-900">{client.nom}</p>
              {client.email && <p className="text-gray-600">{client.email}</p>}
              {client.telephone && <p className="text-gray-600">{client.telephone}</p>}
            </div>
            <div className="text-right">
              {client.adresse && <p className="text-gray-600">{client.adresse}</p>}
              {(client.ville || client.pays) && (
                <p className="text-gray-600">
                  {[client.ville, client.pays].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
            <p className="text-sm text-blue-600">Total Facturé</p>
            <p className="text-xl font-bold text-blue-900">{formatMontant(totalFactures)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <p className="text-sm text-green-600">Total Payé</p>
            <p className="text-xl font-bold text-green-900">{formatMontant(totalPaye)}</p>
          </div>
          <div className={`p-4 rounded-lg border text-center ${soldeFactures > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-sm ${soldeFactures > 0 ? 'text-red-600' : 'text-gray-600'}`}>Solde Dû</p>
            <p className={`text-xl font-bold ${soldeFactures > 0 ? 'text-red-900' : 'text-gray-900'}`}>{formatMontant(soldeFactures)}</p>
          </div>
        </div>

        {/* Factures */}
        {selectedTypes.includes('factures') && filteredFactures.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 border-b pb-2">Factures ({filteredFactures.length})</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">Numéro</th>
                  <th className="text-left p-2 border">Date</th>
                  <th className="text-right p-2 border">Montant TTC</th>
                  <th className="text-right p-2 border">Payé</th>
                  <th className="text-right p-2 border">Reste</th>
                  <th className="text-center p-2 border">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredFactures.map((facture) => (
                  <tr key={facture.id} className="border-b">
                    <td className="p-2 border font-medium">{facture.numero}</td>
                    <td className="p-2 border">{format(new Date(facture.date_facture), "dd/MM/yyyy")}</td>
                    <td className="p-2 border text-right">{formatMontant(facture.montant_ttc || 0)}</td>
                    <td className="p-2 border text-right text-green-600">{formatMontant(facture.montant_paye || 0)}</td>
                    <td className="p-2 border text-right text-red-600">
                      {formatMontant((facture.montant_ttc || 0) - (facture.montant_paye || 0))}
                    </td>
                    <td className="p-2 border text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        facture.statut === 'payee' ? 'bg-green-100 text-green-800' :
                        facture.statut === 'partielle' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {facture.statut === 'payee' ? 'Payée' : facture.statut === 'partielle' ? 'Partielle' : 'Impayée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="p-2 border">Total</td>
                  <td className="p-2 border text-right">{formatMontant(totalFactures)}</td>
                  <td className="p-2 border text-right text-green-600">{formatMontant(totalPaye)}</td>
                  <td className="p-2 border text-right text-red-600">{formatMontant(soldeFactures)}</td>
                  <td className="p-2 border"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Ordres de travail */}
        {selectedTypes.includes('ordres') && filteredOrdres.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 border-b pb-2">Ordres de travail ({filteredOrdres.length})</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">Numéro</th>
                  <th className="text-left p-2 border">Date</th>
                  <th className="text-left p-2 border">Description</th>
                  <th className="text-right p-2 border">Montant TTC</th>
                  <th className="text-center p-2 border">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrdres.map((ordre) => (
                  <tr key={ordre.id} className="border-b">
                    <td className="p-2 border font-medium">{ordre.numero}</td>
                    <td className="p-2 border">{format(new Date(ordre.date), "dd/MM/yyyy")}</td>
                    <td className="p-2 border">{ordre.reference || '-'}</td>
                    <td className="p-2 border text-right">{formatMontant(ordre.montant_ttc || 0)}</td>
                    <td className="p-2 border text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        ordre.statut === 'termine' || ordre.statut === 'facture' ? 'bg-green-100 text-green-800' :
                        ordre.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ordre.statut === 'termine' ? 'Terminé' : 
                         ordre.statut === 'facture' ? 'Facturé' :
                         ordre.statut === 'en_cours' ? 'En cours' : ordre.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={3} className="p-2 border">Total</td>
                  <td className="p-2 border text-right">
                    {formatMontant(filteredOrdres.reduce((sum, o) => sum + (o.montant_ttc || 0), 0))}
                  </td>
                  <td className="p-2 border"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Devis */}
        {selectedTypes.includes('devis') && filteredDevis.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 border-b pb-2">Devis ({filteredDevis.length})</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">Numéro</th>
                  <th className="text-left p-2 border">Date</th>
                  <th className="text-right p-2 border">Montant TTC</th>
                  <th className="text-center p-2 border">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevis.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="p-2 border font-medium">{d.numero}</td>
                    <td className="p-2 border">{format(new Date(d.date), "dd/MM/yyyy")}</td>
                    <td className="p-2 border text-right">{formatMontant(d.montant_ttc || 0)}</td>
                    <td className="p-2 border text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        d.statut === 'accepte' || d.statut === 'converti' ? 'bg-green-100 text-green-800' :
                        d.statut === 'refuse' ? 'bg-red-100 text-red-800' :
                        d.statut === 'envoye' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {d.statut === 'accepte' ? 'Accepté' : 
                         d.statut === 'converti' ? 'Converti' :
                         d.statut === 'refuse' ? 'Refusé' :
                         d.statut === 'envoye' ? 'Envoyé' : d.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="p-2 border">Total</td>
                  <td className="p-2 border text-right">
                    {formatMontant(filteredDevis.reduce((sum, d) => sum + (d.montant_ttc || 0), 0))}
                  </td>
                  <td className="p-2 border"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Paiements */}
        {selectedTypes.includes('paiements') && filteredPaiements.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 border-b pb-2">Paiements ({filteredPaiements.length})</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border">Référence</th>
                  <th className="text-left p-2 border">Date</th>
                  <th className="text-left p-2 border">Mode</th>
                  <th className="text-right p-2 border">Montant</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaiements.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2 border font-medium">{p.reference || `#${p.id}`}</td>
                    <td className="p-2 border">{format(new Date(p.date), "dd/MM/yyyy")}</td>
                    <td className="p-2 border">{p.mode_paiement || '-'}</td>
                    <td className="p-2 border text-right text-green-600 font-medium">
                      {formatMontant(p.montant || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={3} className="p-2 border">Total</td>
                  <td className="p-2 border text-right text-green-600">
                    {formatMontant(filteredPaiements.reduce((sum, p) => sum + (p.montant || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Message si aucune donnée */}
        {filteredFactures.length === 0 && filteredOrdres.length === 0 && 
         filteredDevis.length === 0 && filteredPaiements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucune donnée trouvée pour la période sélectionnée.
          </div>
        )}

        {/* Pied de page */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
          <p>Document généré automatiquement - {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        </div>
      </div>
    );
  }
);

ReleveClientPdf.displayName = 'ReleveClientPdf';
