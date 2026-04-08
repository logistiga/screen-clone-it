import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  useTransitaires,
  useRepresentants,
  useArmateurs,
  useDeleteTransitaire,
  useDeleteRepresentant,
  useSyncArmateurs,
  useUpdateArmateurTypeConteneur,
} from "@/hooks/use-commercial";
import { formatMontant } from "@/data/mockData";

export function usePartenairesData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nom: string; type: string } | null>(null);
  const [showTransitaireModal, setShowTransitaireModal] = useState(false);
  const [showRepresentantModal, setShowRepresentantModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Pagination states
  const [transitairesPage, setTransitairesPage] = useState(1);
  const [transitairesPageSize, setTransitairesPageSize] = useState(200);
  const [representantsPage, setRepresentantsPage] = useState(1);
  const [representantsPageSize, setRepresentantsPageSize] = useState(10);
  const [armateursPage, setArmateursPage] = useState(1);
  const [armateursPageSize, setArmateursPageSize] = useState(10);

  // Inline type conteneur editing
  const [editingTypeConteneur, setEditingTypeConteneur] = useState<{ id: number | string; value: string } | null>(null);

  // Fetch data
  const { data: transitairesData, isLoading: isLoadingTransitaires, error: errorTransitaires, refetch: refetchTransitaires } = useTransitaires();
  const { data: representantsData, isLoading: isLoadingRepresentants, error: errorRepresentants, refetch: refetchRepresentants } = useRepresentants();
  const { data: armateursData, isLoading: isLoadingArmateurs, error: errorArmateurs, refetch: refetchArmateurs } = useArmateurs();

  const updateTypeConteneur = useUpdateArmateurTypeConteneur();
  const deleteTransitaireMutation = useDeleteTransitaire();
  const deleteRepresentantMutation = useDeleteRepresentant();
  const syncArmateursMutation = useSyncArmateurs();

  // Ensure arrays
  const transitaires = Array.isArray(transitairesData) ? transitairesData : [];
  const representants = Array.isArray(representantsData) ? representantsData : [];
  const armateurs = Array.isArray(armateursData) ? armateursData : [];

  // Filtering
  const filteredTransitaires = useMemo(() =>
    transitaires.filter(t =>
      t.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [transitaires, searchTerm]);

  const filteredRepresentants = useMemo(() =>
    representants.filter(r =>
      r.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [representants, searchTerm]);

  const filteredArmateurs = useMemo(() =>
    armateurs.filter(a =>
      a.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [armateurs, searchTerm]);

  // Pagination totals
  const transitairesTotalPages = Math.max(1, Math.ceil(filteredTransitaires.length / transitairesPageSize));
  const representantsTotalPages = Math.max(1, Math.ceil(filteredRepresentants.length / representantsPageSize));
  const armateursTotalPages = Math.max(1, Math.ceil(filteredArmateurs.length / armateursPageSize));

  // Clamp pages
  useEffect(() => { if (transitairesPage > transitairesTotalPages) setTransitairesPage(transitairesTotalPages); }, [transitairesPage, transitairesTotalPages]);
  useEffect(() => { if (representantsPage > representantsTotalPages) setRepresentantsPage(representantsTotalPages); }, [representantsPage, representantsTotalPages]);
  useEffect(() => { if (armateursPage > armateursTotalPages) setArmateursPage(armateursTotalPages); }, [armateursPage, armateursTotalPages]);

  // Paginated data
  const paginatedTransitaires = filteredTransitaires.slice((transitairesPage - 1) * transitairesPageSize, transitairesPage * transitairesPageSize);
  const paginatedRepresentants = filteredRepresentants.slice((representantsPage - 1) * representantsPageSize, representantsPage * representantsPageSize);
  const paginatedArmateurs = filteredArmateurs.slice((armateursPage - 1) * armateursPageSize, armateursPage * armateursPageSize);

  // Primes
  const primesTransitaires = transitaires.reduce((acc, t) => acc + (t.primes_dues || 0), 0);
  const primesRepresentants = representants.reduce((acc, r) => acc + (r.primes_dues || 0), 0);
  const totalPrimesAPayer = primesTransitaires + primesRepresentants;

  // Stats
  const transitairesActifs = transitaires.filter(t => t.actif !== false).length;
  const representantsActifs = representants.filter(r => r.actif !== false).length;
  const armateursActifs = armateurs.filter(a => a.actif !== false).length;

  const handleDelete = () => {
    if (deleteConfirm) {
      if (deleteConfirm.type === "Transitaire") {
        deleteTransitaireMutation.mutate(deleteConfirm.id);
      } else if (deleteConfirm.type === "Représentant") {
        deleteRepresentantMutation.mutate(deleteConfirm.id);
      } else if (deleteConfirm.type === "Armateur") {
        toast.error("Les armateurs sont synchronisés depuis OPS. Suppression désactivée.");
      }
      setDeleteConfirm(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setTransitairesPage(1);
    setRepresentantsPage(1);
    setArmateursPage(1);
  };

  return {
    searchTerm, handleSearchChange, deleteConfirm, setDeleteConfirm,
    showTransitaireModal, setShowTransitaireModal,
    showRepresentantModal, setShowRepresentantModal,
    viewMode, setViewMode,
    editingTypeConteneur, setEditingTypeConteneur, updateTypeConteneur,
    // Data
    transitaires, representants, armateurs,
    filteredTransitaires, filteredRepresentants, filteredArmateurs,
    paginatedTransitaires, paginatedRepresentants, paginatedArmateurs,
    // Loading / errors
    isLoadingTransitaires, isLoadingRepresentants, isLoadingArmateurs,
    errorTransitaires, errorRepresentants, errorArmateurs,
    refetchTransitaires, refetchRepresentants, refetchArmateurs,
    // Pagination
    transitairesPage, setTransitairesPage, transitairesPageSize, setTransitairesPageSize, transitairesTotalPages,
    representantsPage, setRepresentantsPage, representantsPageSize, setRepresentantsPageSize, representantsTotalPages,
    armateursPage, setArmateursPage, armateursPageSize, setArmateursPageSize, armateursTotalPages,
    // Mutations
    syncArmateursMutation, handleDelete,
    // Stats
    primesTransitaires, primesRepresentants, totalPrimesAPayer,
    transitairesActifs, representantsActifs, armateursActifs,
  };
}
