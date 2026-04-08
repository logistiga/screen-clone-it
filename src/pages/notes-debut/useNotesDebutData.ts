import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { roundMoney } from "@/lib/utils";
import { useNotesDebut, useDeleteNoteDebut } from "@/hooks/use-notes-debut";
import { NoteDebut } from "@/lib/api/notes-debut";
import { toast } from "sonner";
import { formatMontant } from "@/data/mockData";

export const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  ouverture_port: { label: "Ouverture de port", icon: null, color: "bg-primary/10 text-primary border-primary/20" },
  "Ouverture Port": { label: "Ouverture de port", icon: null, color: "bg-primary/10 text-primary border-primary/20" },
  detention: { label: "Détention", icon: null, color: "bg-warning/10 text-warning border-warning/20" },
  Detention: { label: "Détention", icon: null, color: "bg-warning/10 text-warning border-warning/20" },
  reparation: { label: "Réparation conteneur", icon: null, color: "bg-success/10 text-success border-success/20" },
  Reparation: { label: "Réparation conteneur", icon: null, color: "bg-success/10 text-success border-success/20" },
  relache: { label: "Relâche", icon: null, color: "bg-accent text-accent-foreground border-accent" },
  Relache: { label: "Relâche", icon: null, color: "bg-accent text-accent-foreground border-accent" },
};

export const statusConfig: Record<string, { label: string; class: string }> = {
  brouillon: { label: "Brouillon", class: "bg-muted text-muted-foreground" },
  en_attente: { label: "En attente", class: "bg-warning/20 text-warning" },
  pending: { label: "En attente", class: "bg-warning/20 text-warning" },
  facturee: { label: "Facturée", class: "bg-primary/20 text-primary" },
  invoiced: { label: "Facturée", class: "bg-primary/20 text-primary" },
  payee: { label: "Payée", class: "bg-success/20 text-success" },
  paid: { label: "Payée", class: "bg-success/20 text-success" },
  annulee: { label: "Annulée", class: "bg-muted text-muted-foreground" },
  cancelled: { label: "Annulée", class: "bg-muted text-muted-foreground" },
  partielle: { label: "Partielle", class: "bg-info/20 text-info" },
  partial: { label: "Partielle", class: "bg-info/20 text-info" },
};

export const typeFilterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "ouverture_port", label: "Ouverture de port" },
  { value: "detention", label: "Détention" },
  { value: "reparation", label: "Réparation conteneur" },
  { value: "relache", label: "Relâche" },
];

// Note amount helpers
export const getNoteAmount = (note: NoteDebut) => note.montant_ttc || note.montant_total || 0;
export const getNotePaid = (note: NoteDebut) => note.montant_paye || 0;
export const getNoteAdvance = (note: NoteDebut) => note.montant_avance || 0;
export const getNoteRemaining = (note: NoteDebut) => roundMoney(getNoteAmount(note) - getNotePaid(note) - getNoteAdvance(note));
export const getNoteStatus = (note: NoteDebut) => statusConfig[note.statut || 'en_attente'] || statusConfig.en_attente;
export const getNoteType = (note: NoteDebut) => typeConfig[note.type] || typeConfig.detention;

export function useNotesDebutData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteDebut | null>(null);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: notesData, isLoading, isFetching, refetch } = useNotesDebut({
    search: debouncedSearch || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    page: currentPage,
    per_page: pageSize,
  });

  const deleteNote = useDeleteNoteDebut();

  const notes = notesData?.data || [];
  const meta = notesData?.meta || { current_page: 1, last_page: 1, per_page: 15, total: 0 };

  const isSearching = (searchTerm !== debouncedSearch) || (isFetching && !isLoading);
  const tableRenderKey = useMemo(() =>
    [debouncedSearch, typeFilter, currentPage, pageSize, meta.total, notes.map((n: any) => n.id).join("-")].join("|"),
    [debouncedSearch, typeFilter, currentPage, pageSize, meta.total, notes]
  );

  const hasFilters = !!searchTerm || typeFilter !== "all";
  const isAllSelected = selectedIds.length === notes.length && notes.length > 0;

  const handleSelectAll = () => setSelectedIds(selectedIds.length === notes.length ? [] : notes.map((n: any) => n.id));
  const handleSelectOne = (id: string) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  const clearFilters = () => { setSearchTerm(""); setTypeFilter("all"); setCurrentPage(1); };

  const handleGroupPayment = () => {
    const selectedNotes = notes.filter((n: any) => selectedIds.includes(n.id));
    if (selectedNotes.length < 2) { toast.error("Sélectionnez au moins 2 notes pour un paiement groupé."); return; }
    const clientIds = new Set(selectedNotes.map((n: any) => n.client_id));
    if (clientIds.size > 1) { toast.error("Le paiement groupé n'est possible que pour un seul client."); return; }
    toast.info(`Paiement de ${selectedNotes.length} notes initialisé.`);
  };

  const confirmDelete = async () => {
    if (selectedNote) { try { await deleteNote.mutateAsync(selectedNote.id); } catch {} }
    setShowDeleteDialog(false);
    setSelectedNote(null);
  };

  const handlePaiementSuccess = () => { refetch(); setSelectedNote(null); };

  const totalNotes = meta.total;
  const totalMontant = notes.reduce((acc: number, n: any) => acc + getNoteAmount(n), 0);

  return {
    searchTerm, setSearchTerm, typeFilter, setTypeFilter,
    currentPage, setCurrentPage, pageSize, setPageSize,
    isLoading, isSearching, hasFilters, clearFilters,
    notes, meta, tableRenderKey, totalNotes, totalMontant,
    selectedIds, setSelectedIds, isAllSelected, handleSelectAll, handleSelectOne,
    selectedNote, setSelectedNote,
    showPaiementModal, setShowPaiementModal,
    showEmailModal, setShowEmailModal,
    showDeleteDialog, setShowDeleteDialog,
    handleGroupPayment, confirmDelete, handlePaiementSuccess,
    deleteNote, refetch,
  };
}
