import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCredits, useCreditStats, useCreditDashboard, useCreditComparaison, useAnnulerCredit, useDeleteCredit } from "@/hooks/use-credits";

export function useCreditsData() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [selectedAnnee, setSelectedAnnee] = useState(currentYear);
  const [showNouveauModal, setShowNouveauModal] = useState(false);
  const [showRemboursementModal, setShowRemboursementModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [selectedEcheance, setSelectedEcheance] = useState<any>(null);
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [expandedBanques, setExpandedBanques] = useState<number[]>([]);
  const [creditToAnnuler, setCreditToAnnuler] = useState<any>(null);
  const [creditToSupprimer, setCreditToSupprimer] = useState<any>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');

  const annulerMutation = useAnnulerCredit();
  const supprimerMutation = useDeleteCredit();
  const { data: creditsData, isLoading: loadingCredits, refetch } = useCredits({ per_page: 100 });
  const { data: stats, isLoading: loadingStats } = useCreditStats(selectedAnnee);
  const { data: dashboard } = useCreditDashboard(selectedAnnee);
  const { data: comparaison } = useCreditComparaison(selectedAnnee);

  const credits = creditsData?.data || [];
  const isLoading = loadingCredits || loadingStats;

  const creditsFiltres = credits.filter((credit: any) =>
    filterStatut === "all" || credit.statut.toLowerCase() === filterStatut.toLowerCase()
  );

  const toggleBanque = (banqueId: number) => {
    setExpandedBanques(prev => prev.includes(banqueId) ? prev.filter(id => id !== banqueId) : [...prev, banqueId]);
  };

  const handleRemboursement = (credit: any, echeance?: any) => {
    setSelectedCredit(credit);
    setSelectedEcheance(echeance || null);
    setShowRemboursementModal(true);
  };

  const handlePayerEcheance = (echeance: any) => {
    const credit = credits.find((c: any) => c.id === echeance.credit_id);
    if (credit) {
      handleRemboursement(credit, echeance);
    } else {
      handleRemboursement({ id: echeance.credit_id, numero: echeance.credit_numero, objet: echeance.objet || '', banque: { nom: echeance.banque } }, echeance);
    }
  };

  const handleAnnuler = useCallback(() => {
    if (!creditToAnnuler || !motifAnnulation.trim()) return;
    annulerMutation.mutate({ id: creditToAnnuler.id, motif: motifAnnulation }, {
      onSuccess: () => { setCreditToAnnuler(null); setMotifAnnulation(''); }
    });
  }, [creditToAnnuler, motifAnnulation, annulerMutation]);

  const handleSupprimer = useCallback(() => {
    if (!creditToSupprimer) return;
    supprimerMutation.mutate(creditToSupprimer.id, {
      onSuccess: () => setCreditToSupprimer(null),
    });
  }, [creditToSupprimer, supprimerMutation]);

  const evolutionChartData = stats?.evolution_mensuelle || [];
  const comparaisonChartData = comparaison?.par_mois || [];

  const pieData = useMemo(() => stats?.par_banque?.map((b: any, index: number) => ({
    name: b.banque_nom,
    value: b.total,
    color: ['hsl(var(--primary))', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)', 'hsl(262 83% 58%)', 'hsl(189 94% 43%)'][index % 6]
  })) || [], [stats]);

  return {
    navigate, currentYear, selectedAnnee, setSelectedAnnee,
    showNouveauModal, setShowNouveauModal, showRemboursementModal, setShowRemboursementModal,
    selectedCredit, setSelectedCredit, selectedEcheance, setSelectedEcheance,
    filterStatut, setFilterStatut, expandedBanques, toggleBanque,
    creditToAnnuler, setCreditToAnnuler, creditToSupprimer, setCreditToSupprimer,
    motifAnnulation, setMotifAnnulation,
    annulerMutation, supprimerMutation,
    credits, creditsFiltres, isLoading, loadingCredits, loadingStats, refetch,
    stats, dashboard, comparaison,
    evolutionChartData, comparaisonChartData, pieData,
    handleRemboursement, handlePayerEcheance, handleAnnuler, handleSupprimer,
  };
}

export const formatMontant = (montant: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(montant)) + ' FCFA';

export const formatMontantCompact = (montant: number) => {
  if (montant >= 1000000000) return (montant / 1000000000).toFixed(1) + ' Mrd';
  if (montant >= 1000000) return (montant / 1000000).toFixed(1) + ' M';
  if (montant >= 1000) return (montant / 1000).toFixed(0) + ' K';
  return montant.toLocaleString('fr-FR');
};
