import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { conteneursTraitesApi, ConteneurTraite, ConteneursTraitesStats, anomaliesApi } from "@/lib/api/conteneurs-traites";
import { ordresApi } from "@/lib/api/commercial";

export const statutOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "en_attente", label: "En attente" },
  { value: "affecte", label: "Affectés" },
  { value: "facture", label: "Facturés" },
  { value: "ignore", label: "Ignorés" },
];

export function useConteneursEnAttenteData() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [selectedConteneur, setSelectedConteneur] = useState<ConteneurTraite | null>(null);
  const [isAffecterDialogOpen, setIsAffecterDialogOpen] = useState(false);
  const [selectedOrdreId, setSelectedOrdreId] = useState<string>("");

  const { data: conteneursData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['conteneurs-traites', statutFilter, searchQuery],
    queryFn: () => conteneursTraitesApi.getAll({
      statut: statutFilter !== "all" ? statutFilter : undefined,
      search: searchQuery || undefined,
      per_page: 50,
    }),
  });

  const { data: stats } = useQuery<ConteneursTraitesStats>({
    queryKey: ['conteneurs-traites-stats'],
    queryFn: () => conteneursTraitesApi.getStats(),
  });

  const { data: ordresData } = useQuery({
    queryKey: ['ordres-for-affectation'],
    queryFn: () => ordresApi.getAll({ categorie: 'conteneurs', per_page: 100 }),
    enabled: isAffecterDialogOpen,
  });

  const affecterOrdreMutation = useMutation({
    mutationFn: ({ conteneurId, ordreId }: { conteneurId: number; ordreId: number }) =>
      conteneursTraitesApi.affecterAOrdre(conteneurId, ordreId),
    onSuccess: (data) => {
      toast.success(`Conteneur affecté à l'ordre ${data.ordre?.numero}`);
      setIsAffecterDialogOpen(false); setSelectedConteneur(null);
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites-stats'] });
    },
    onError: () => toast.error("Erreur lors de l'affectation"),
  });

  const ignorerMutation = useMutation({
    mutationFn: (conteneurId: number) => conteneursTraitesApi.ignorer(conteneurId),
    onSuccess: () => {
      toast.success("Conteneur ignoré");
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites-stats'] });
    },
    onError: () => toast.error("Erreur lors de l'opération"),
  });

  const syncAndDetectMutation = useMutation({
    mutationFn: async () => {
      await conteneursTraitesApi.syncFromOps();
      try { await anomaliesApi.detecter(); } catch {}
    },
    onSuccess: () => {
      toast.success("Synchronisation terminée");
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites-stats'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies-stats'] });
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la synchronisation - voir les détails ci-dessous");
      console.error('[Sync OPS] Erreur:', error);
    },
  });

  const conteneurs: ConteneurTraite[] = conteneursData?.data || [];
  const ordres = Array.isArray(ordresData) ? ordresData : (ordresData?.data || []);

  const handleAffecterClick = (conteneur: ConteneurTraite) => {
    setSelectedConteneur(conteneur); setIsAffecterDialogOpen(true);
  };

  const handleAffecterConfirm = () => {
    if (selectedConteneur && selectedOrdreId) {
      affecterOrdreMutation.mutate({ conteneurId: selectedConteneur.id, ordreId: parseInt(selectedOrdreId) });
    }
  };

  const handleCreerOrdre = (conteneur: ConteneurTraite) => {
    const prefillData = {
      categorie: 'conteneurs', numeroBL: conteneur.numero_bl || '',
      clientNom: conteneur.client_nom || '', armateurCode: conteneur.armateur_code || '',
      armateurNom: conteneur.armateur_nom || '',
      conteneur: { numero: conteneur.numero_conteneur, taille: '20', type: 'DRY' },
      sourceConteneurId: conteneur.id,
    };
    sessionStorage.setItem('prefill_ordre', JSON.stringify(prefillData));
    navigate('/ordres/nouveau?prefill=conteneur');
  };

  return {
    navigate, searchQuery, setSearchQuery, statutFilter, setStatutFilter,
    selectedConteneur, setSelectedConteneur, isAffecterDialogOpen, setIsAffecterDialogOpen,
    selectedOrdreId, setSelectedOrdreId,
    conteneurs, ordres, stats, isLoading, error, isRefetching,
    refetch, affecterOrdreMutation, ignorerMutation, syncAndDetectMutation,
    handleAffecterClick, handleAffecterConfirm, handleCreerOrdre,
  };
}
