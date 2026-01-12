import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Download,
  Mail,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Anchor,
  Container,
  Wrench,
  CreditCard,
  FileText,
  Loader2,
  RotateCcw,
  PackageOpen,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PaiementNoteModal } from "@/components/notes/PaiementNoteModal";
import { EmailNoteModal } from "@/components/notes/EmailNoteModal";
import { useNotesDebut, useDeleteNoteDebut } from "@/hooks/use-notes-debut";
import { NoteDebut } from "@/lib/api/notes-debut";
import { TablePagination } from "@/components/TablePagination";
import { formatMontant, formatDate } from "@/data/mockData";

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  ouverture_port: {
    label: "Ouverture de port",
    icon: Anchor,
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  },
  detention: {
    label: "Détention",
    icon: Container,
    color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  },
  reparation: {
    label: "Réparation conteneur",
    icon: Wrench,
    color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  },
  relache: {
    label: "Relâche",
    icon: PackageOpen,
    color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  },
};

const statusConfig: Record<string, { label: string; class: string }> = {
  brouillon: { label: "Brouillon", class: "bg-muted text-muted-foreground" },
  en_attente: { label: "En attente", class: "bg-warning/20 text-warning" },
  pending: { label: "En attente", class: "bg-warning/20 text-warning" },
  facturee: { label: "Facturée", class: "bg-primary/20 text-primary" },
  invoiced: { label: "Facturée", class: "bg-primary/20 text-primary" },
  payee: { label: "Payée", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  paid: { label: "Payée", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  annulee: { label: "Annulée", class: "bg-muted text-muted-foreground" },
  cancelled: { label: "Annulée", class: "bg-muted text-muted-foreground" },
  partielle: { label: "Partielle", class: "bg-cyan-500/20 text-cyan-600" },
  partial: { label: "Partielle", class: "bg-cyan-500/20 text-cyan-600" },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export default function NotesDebut() {
  const navigate = useNavigate();
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  // Sélection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // États modales
  const [selectedNote, setSelectedNote] = useState<NoteDebut | null>(null);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Charger les données depuis le backend
  const { data: notesData, isLoading, refetch } = useNotesDebut({
    search: searchTerm || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    page: currentPage,
    per_page: pageSize,
  });

  const deleteNote = useDeleteNoteDebut();

  const notes = notesData?.data || [];
  const meta = notesData?.meta || { current_page: 1, last_page: 1, per_page: 15, total: 0 };

  // Sélection
  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === notes.length ? [] : notes.map((n) => n.id));
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const isAllSelected = selectedIds.length === notes.length && notes.length > 0;

  const hasFilters = searchTerm || typeFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setCurrentPage(1);
  };

  // Handlers
  const handleGroupPayment = () => {
    const selectedNotes = notes.filter((n) => selectedIds.includes(n.id));
    if (selectedNotes.length < 2) {
      toast.error("Sélectionnez au moins 2 notes pour un paiement groupé.");
      return;
    }
    const clientIds = new Set(selectedNotes.map((n) => n.client_id));
    if (clientIds.size > 1) {
      toast.error("Le paiement groupé n'est possible que pour un seul client.");
      return;
    }
    toast.info(`Paiement de ${selectedNotes.length} notes initialisé.`);
  };

  const confirmDelete = async () => {
    if (selectedNote) {
      try {
        await deleteNote.mutateAsync(selectedNote.id);
      } catch (error) {
        // Error handled by hook
      }
    }
    setShowDeleteDialog(false);
    setSelectedNote(null);
  };

  const handlePaiementSuccess = (montant: number) => {
    toast.success(`Paiement de ${formatMontant(montant)} enregistré`);
    refetch();
    setSelectedNote(null);
  };

  // Helper functions
  const getNoteAmount = (note: NoteDebut) => {
    return note.montant_ttc || note.montant_total || 0;
  };

  const getNotePaid = (note: NoteDebut) => {
    return note.montant_paye || 0;
  };

  const getNoteAdvance = (note: NoteDebut) => {
    return note.montant_avance || 0;
  };

  const getNoteRemaining = (note: NoteDebut) => {
    return getNoteAmount(note) - getNotePaid(note) - getNoteAdvance(note);
  };

  const getNoteStatus = (note: NoteDebut) => {
    const status = note.statut || 'en_attente';
    return statusConfig[status] || statusConfig.en_attente;
  };

  const getNoteType = (note: NoteDebut) => {
    return typeConfig[note.type] || typeConfig.detention;
  };

  // Stats
  const totalNotes = meta.total;
  const totalMontant = notes.reduce((acc, n) => acc + getNoteAmount(n), 0);

  if (isLoading) {
    return (
      <MainLayout title="Notes de début">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // État vide
  if (notes.length === 0 && !hasFilters) {
    return (
      <MainLayout title="Notes de début">
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucune note de début</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Commencez par créer votre première note de début (Ouverture de port, Détention, Réparation).
          </p>
          <Button onClick={() => navigate("/notes-debut/nouvelle")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle note
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Notes de début">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Notes de début</h1>
            <p className="text-muted-foreground mt-1">Gérez les notes de début</p>
          </div>
          <Button onClick={() => navigate("/notes-debut/nouvelle")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle note
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total notes</p>
                <p className="text-2xl font-bold mt-1">{totalNotes}</p>
                <p className="text-xs text-muted-foreground">notes</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold mt-1">{formatMontant(totalMontant)}</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Page</p>
                <p className="text-2xl font-bold mt-1">{meta.current_page} / {meta.last_page}</p>
                <p className="text-xs text-muted-foreground">{notes.length} affichées</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher par numéro, client, conteneur..." 
                  value={searchTerm} 
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                  className="pl-10" 
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="ouverture_port">Ouverture de port</SelectItem>
                  <SelectItem value="detention">Détention</SelectItem>
                  <SelectItem value="reparation">Réparation conteneur</SelectItem>
                  <SelectItem value="relache">Relâche</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selection Info */}
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedIds.length} note(s) sélectionnée(s)</span>
              <span className="text-sm text-muted-foreground">
                - Total: {formatMontant(notes.filter((n) => selectedIds.includes(n.id)).reduce((sum, n) => sum + getNoteRemaining(n), 0))} restant
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>Annuler</Button>
              <Button size="sm" onClick={handleGroupPayment}>
                <CreditCard className="h-4 w-4 mr-2" />
                Payer la sélection
              </Button>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                    </TableHead>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Conteneur</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-center">Jours</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 opacity-50" />
                          <p>Aucune note trouvée</p>
                          {hasFilters && (
                            <Button variant="link" onClick={clearFilters} className="text-primary">
                              Réinitialiser les filtres
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    notes.map((note, index) => {
                      const typeInfo = getNoteType(note);
                      const TypeIcon = typeInfo.icon;
                      const status = getNoteStatus(note);
                      const isSelected = selectedIds.includes(note.id);
                      const remaining = getNoteRemaining(note);
                      const paid = getNotePaid(note);
                      const advance = getNoteAdvance(note);
                      
                      return (
                        <motion.tr
                          key={note.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: index * 0.03 }}
                          className={`group hover:bg-muted/50 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                          onClick={() => navigate(`/notes-debut/${note.id}`)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSelected} onCheckedChange={() => handleSelectOne(note.id)} />
                          </TableCell>
                          <TableCell className="font-medium font-mono">{note.numero}</TableCell>
                          <TableCell>{note.client?.nom || '-'}</TableCell>
                          <TableCell>
                            <Badge className={`${typeInfo.color} border`}>
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{note.conteneur_numero || '-'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {note.date_debut || note.date_debut_stockage ? (
                              <>
                                {formatDate(note.date_debut || note.date_debut_stockage)} 
                                {(note.date_fin || note.date_fin_stockage) && (
                                  <> → {formatDate(note.date_fin || note.date_fin_stockage)}</>
                                )}
                              </>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {note.nombre_jours || note.jours_stockage || '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatMontant(getNoteAmount(note))}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              {paid > 0 && <span className="text-green-600 text-sm">{formatMontant(paid)}</span>}
                              {advance > 0 && <span className="text-cyan-600 text-xs">+{formatMontant(advance)} avance</span>}
                              {remaining > 0 && <span className="text-muted-foreground text-xs">Reste: {formatMontant(remaining)}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={status.class}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir" onClick={() => navigate(`/notes-debut/${note.id}`)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => navigate(`/notes-debut/${note.id}/modifier`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="PDF" onClick={() => toast.info(`Génération du PDF ${note.numero}...`)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                title="Email" 
                                onClick={() => { 
                                  setSelectedNote(note); 
                                  setShowEmailModal(true); 
                                }}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              {remaining > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  title="Paiement" 
                                  onClick={() => { 
                                    setSelectedNote(note); 
                                    setShowPaiementModal(true); 
                                  }}
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              )}
                              {paid === 0 && advance === 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive" 
                                  title="Supprimer" 
                                  onClick={() => { 
                                    setSelectedNote(note); 
                                    setShowDeleteDialog(true); 
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <TablePagination
            currentPage={meta.current_page}
            totalPages={meta.last_page}
            pageSize={pageSize}
            totalItems={meta.total}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        )}
      </div>

      {/* Modals */}
      {selectedNote && (
        <>
          <PaiementNoteModal
            open={showPaiementModal}
            onOpenChange={setShowPaiementModal}
            noteNumero={selectedNote.numero}
            montantRestant={getNoteRemaining(selectedNote)}
            onSuccess={handlePaiementSuccess}
          />
          <EmailNoteModal
            open={showEmailModal}
            onOpenChange={setShowEmailModal}
            noteNumero={selectedNote.numero}
            clientEmail={selectedNote.client?.email || ''}
            clientNom={selectedNote.client?.nom || ''}
            noteType={getNoteType(selectedNote).label}
          />
        </>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La note {selectedNote?.numero} sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground"
              disabled={deleteNote.isPending}
            >
              {deleteNote.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
