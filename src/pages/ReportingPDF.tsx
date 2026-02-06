import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import { useTableauDeBord, useChiffreAffaires, useCreances, useRentabilite, useActiviteClients } from "@/hooks/use-reporting";
import { DocumentLoadingState } from "@/components/shared/documents/DocumentLoadingState";
import logoLogistiga from "@/assets/lojistiga-logo.png";

const formatMontant = (montant: number | null | undefined): string => {
  const value = Number(montant);
  if (isNaN(value) || montant === null || montant === undefined) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value)) + ' FCFA';
};

const moisLabels = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function ReportingPDFPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const annee = Number(searchParams.get('annee')) || new Date().getFullYear();
  
  const { contentRef, downloadPdf } = usePdfDownload({ 
    filename: `Reporting_${annee}`,
    margin: 5,
  });

  const dateDebutAnnee = `${annee}-01-01`;
  const dateFinAnnee = `${annee}-12-31`;

  const { data: tableauDeBord, isLoading: loadingTableau } = useTableauDeBord(annee);
  const { data: chiffreAffaires, isLoading: loadingCA } = useChiffreAffaires(annee);
  const { data: creances, isLoading: loadingCreances } = useCreances();
  const { data: rentabilite, isLoading: loadingRentabilite } = useRentabilite(annee);
  const { data: activiteClients, isLoading: loadingClients } = useActiviteClients(dateDebutAnnee, dateFinAnnee, 10);

  const isLoading = loadingTableau || loadingCA || loadingCreances || loadingRentabilite || loadingClients;
  const [autoDownloaded, setAutoDownloaded] = useState(false);

  const evolutionMensuelle = useMemo(() => {
    if (!chiffreAffaires?.mensuel) return [];
    return chiffreAffaires.mensuel.map((m: any) => ({
      mois: moisLabels[m.mois - 1] || m.label,
      ca: Number(m.total_ttc) || 0,
      nbFactures: Number(m.nb_factures) || 0,
    }));
  }, [chiffreAffaires]);

  const topClients = useMemo(() => {
    return (activiteClients?.top_clients || []).slice(0, 10).map((c: any) => ({
      nom: c.client_nom || 'Client inconnu',
      ca: Number(c.ca_total) || 0,
      factures: Number(c.nb_factures) || 0,
      paiements: Number(c.paiements) || 0,
      solde: Number(c.solde_du) || 0,
    }));
  }, [activiteClients]);

  const topDebiteurs = useMemo(() => {
    return (creances?.top_debiteurs || []).slice(0, 10).map((c: any) => ({
      nom: c.client_nom || 'Client inconnu',
      montant: Number(c.montant_du) || 0,
      factures: Number(c.nb_factures) || 0,
    }));
  }, [creances]);

  // Auto-download PDF once data is loaded
  useEffect(() => {
    if (!isLoading && tableauDeBord && !autoDownloaded) {
      const timer = setTimeout(() => {
        downloadPdf();
        setAutoDownloaded(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, tableauDeBord, downloadPdf, autoDownloaded]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <DocumentLoadingState message="Chargement des données de reporting..." />
      </div>
    );
  }

  const dateGeneration = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar */}
      <div className="bg-background border-b sticky top-0 z-10 print:hidden">
        <div className="container flex items-center justify-between py-3">
          <Button variant="ghost" onClick={() => navigate('/reporting')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour au Reporting
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
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

      {/* PDF Content */}
      <div className="container py-8 print:py-0 flex justify-center">
        <Card
          ref={contentRef}
          className="bg-white print:shadow-none print:border-none relative text-black"
          style={{ width: '210mm', minHeight: '297mm', padding: '10mm', fontSize: '11px' }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4 border-b-2 border-red-600 pb-3">
            <img src={logoLogistiga} alt="LOGISTIGA" className="h-16 w-auto" />
            <div className="text-right">
              <h1 className="text-lg font-bold text-red-600">RAPPORT D'ACTIVITÉ</h1>
              <p className="text-sm font-semibold text-gray-700">Année {annee}</p>
              <p className="text-xs text-gray-500">Généré le {dateGeneration}</p>
            </div>
          </div>

          {/* KPIs Section */}
          <div className="mb-4">
            <h2 className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">
              Indicateurs Clés de Performance
            </h2>
            <div className="grid grid-cols-4 gap-2">
              <KpiBox label="Chiffre d'Affaires" value={formatMontant(tableauDeBord?.kpis?.ca_total)} />
              <KpiBox label="CA Mois Courant" value={formatMontant(tableauDeBord?.kpis?.ca_mois_courant)} />
              <KpiBox label="Créances Totales" value={formatMontant(tableauDeBord?.kpis?.creances_totales)} variant="danger" />
              <KpiBox label="Taux Recouvrement" value={`${tableauDeBord?.kpis?.taux_recouvrement || 0}%`} variant="success" />
              <KpiBox label="Factures" value={String(tableauDeBord?.kpis?.nb_factures || 0)} />
              <KpiBox label="Devis" value={String(tableauDeBord?.kpis?.nb_devis || 0)} />
              <KpiBox label="Ordres de Travail" value={String(tableauDeBord?.kpis?.nb_ordres || 0)} />
              <KpiBox label="Clients Actifs" value={String(tableauDeBord?.kpis?.nb_clients || 0)} />
            </div>
          </div>

          {/* Rentabilité */}
          {rentabilite && (
            <div className="mb-4">
              <h2 className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">
                Rentabilité
              </h2>
              <div className="grid grid-cols-4 gap-2">
                <KpiBox label="Chiffre d'Affaires" value={formatMontant(rentabilite?.chiffre_affaires)} />
                <KpiBox label="Charges d'Exploitation" value={formatMontant(rentabilite?.charges_exploitation)} variant="warning" />
                <KpiBox label="Résultat Net" value={formatMontant(rentabilite?.resultat_net)} variant={(rentabilite?.resultat_net || 0) >= 0 ? 'success' : 'danger'} />
                <KpiBox label="Taux de Marge" value={`${rentabilite?.taux_marge || 0}%`} />
              </div>
            </div>
          )}

          {/* Évolution mensuelle du CA */}
          {evolutionMensuelle.length > 0 && (
            <div className="mb-4">
              <h2 className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">
                Évolution Mensuelle du Chiffre d'Affaires
              </h2>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Mois</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right font-semibold">CA TTC</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold">Nb Factures</th>
                  </tr>
                </thead>
                <tbody>
                  {evolutionMensuelle.map((m, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-2 py-1">{m.mois}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right font-medium">{formatMontant(m.ca)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{m.nbFactures}</td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 font-bold">
                    <td className="border border-gray-300 px-2 py-1.5">TOTAL</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right text-red-600">
                      {formatMontant(chiffreAffaires?.total_annuel?.total_ttc)}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">
                      {chiffreAffaires?.total_annuel?.nb_factures || 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Top Clients */}
          {topClients.length > 0 && (
            <div className="mb-4">
              <h2 className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">
                Top 10 Clients par Chiffre d'Affaires
              </h2>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold w-6">#</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Client</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right font-semibold">CA Total</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold">Factures</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right font-semibold">Paiements</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right font-semibold">Solde Dû</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map((c, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-2 py-1 font-medium">{i + 1}</td>
                      <td className="border border-gray-300 px-2 py-1 font-medium">{c.nom}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatMontant(c.ca)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{c.factures}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right text-green-700">{formatMontant(c.paiements)}</td>
                      <td className={`border border-gray-300 px-2 py-1 text-right ${c.solde > 0 ? 'text-red-600 font-semibold' : ''}`}>
                        {formatMontant(c.solde)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Créances */}
          {topDebiteurs.length > 0 && (
            <div className="mb-4">
              <h2 className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">
                Créances — Top Débiteurs
              </h2>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <KpiBox label="Total Créances" value={formatMontant(creances?.total_creances)} variant="danger" />
                <KpiBox label="Factures Impayées" value={String(creances?.nb_factures_impayees || 0)} />
                <KpiBox label="Âge Moyen" value={`${creances?.age_moyen || 0} jours`} />
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">#</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Client</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right font-semibold">Montant Dû</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold">Factures</th>
                  </tr>
                </thead>
                <tbody>
                  {topDebiteurs.map((d, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-2 py-1">{i + 1}</td>
                      <td className="border border-gray-300 px-2 py-1 font-medium">{d.nom}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right text-red-600 font-semibold">{formatMontant(d.montant)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{d.factures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-3 border-t text-[9px] text-gray-500">
            <div className="text-center space-y-0.5">
              <p className="font-semibold text-gray-700 text-[10px]">
                LOGISTIGA SAS au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)
              </p>
              <p>
                Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135
              </p>
              <p>
                Email: info@logistiga.com – Site web: www.logistiga.com
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Sub-component for KPI boxes
function KpiBox({ label, value, variant }: { label: string; value: string; variant?: 'danger' | 'success' | 'warning' }) {
  const bgClass = variant === 'danger' ? 'bg-red-50 border-red-200' 
    : variant === 'success' ? 'bg-green-50 border-green-200'
    : variant === 'warning' ? 'bg-amber-50 border-amber-200'
    : 'bg-gray-50 border-gray-200';
  
  const valueClass = variant === 'danger' ? 'text-red-600' 
    : variant === 'success' ? 'text-green-700'
    : variant === 'warning' ? 'text-amber-700'
    : 'text-gray-900';

  return (
    <div className={`${bgClass} border rounded p-2`}>
      <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-xs font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
