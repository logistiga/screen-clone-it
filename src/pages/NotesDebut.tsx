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
import { toast } from "@/hooks/use-toast";
import { PaiementNoteModal } from "@/components/notes/PaiementNoteModal";
import { EmailNoteModal } from "@/components/notes/EmailNoteModal";

interface NoteDebut {
  id: string;
  number: string;
  client: string;
  clientId: string;
  clientEmail: string;
  type: "ouverture_port" | "detention" | "reparation";
  ordresTravail: string[];
  blNumber: string;
  containerNumber: string;
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  tarifJournalier: number;
  montantTotal: number;
  paid: number;
  advance: number;
  status: "pending" | "invoiced" | "paid" | "cancelled" | "partial";
  description: string;
}

const typeConfig = {
  ouverture_port: {
    label: "Ouverture de port",
    icon: Anchor,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  detention: {
    label: "Détention",
    icon: Container,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  reparation: {
    label: "Réparation conteneur",
    icon: Wrench,
    color: "bg-green-100 text-green-700 border-green-200",
  },
};

const statusConfig = {
  pending: { label: "En attente", class: "bg-warning/20 text-warning" },
  invoiced: { label: "Facturée", class: "bg-primary/20 text-primary" },
  paid: { label: "Payée", class: "bg-success/20 text-success" },
  cancelled: { label: "Annulée", class: "bg-muted text-muted-foreground" },
  partial: { label: "Partielle", class: "bg-cyan-500/20 text-cyan-600" },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export default function NotesDebut() {
  const navigate = useNavigate();
  
  // Données en mémoire uniquement - perdues au refresh
  const [notes, setNotes] = useState<NoteDebut[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // États modales consolidés
  const [selectedNote, setSelectedNote] = useState<NoteDebut | null>(null);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filtrage
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.containerNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || note.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Sélection
  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredNotes.length ? [] : filteredNotes.map((n) => n.id));
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const isAllSelected = selectedIds.length === filteredNotes.length && filteredNotes.length > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-GA", { style: "decimal", minimumFractionDigits: 0 }).format(value);
  };

  // Handlers consolidés
  const handleGroupPayment = () => {
    const selectedNotes = notes.filter((n) => selectedIds.includes(n.id));
    if (selectedNotes.length < 2) {
      toast({ title: "Sélection insuffisante", description: "Sélectionnez au moins 2 notes.", variant: "destructive" });
      return;
    }
    if (new Set(selectedNotes.map((n) => n.clientId)).size > 1) {
      toast({ title: "Clients différents", description: "Le paiement groupé n'est possible que pour un seul client.", variant: "destructive" });
      return;
    }
    toast({ title: "Paiement groupé", description: `Paiement de ${selectedNotes.length} notes initialisé.` });
  };

  const confirmDelete = () => {
    if (selectedNote) {
      setNotes((prev) => prev.filter((n) => n.id !== selectedNote.id));
      toast({ title: "Note supprimée", description: `La note ${selectedNote.number} a été supprimée.` });
    }
    setShowDeleteDialog(false);
    setSelectedNote(null);
  };

  const handlePaiementSuccess = (montant: number) => {
    if (selectedNote) {
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === selectedNote.id) {
            const newPaid = n.paid + montant;
            const newStatus = newPaid + n.advance >= n.montantTotal ? "paid" : "partial";
            return { ...n, paid: newPaid, status: newStatus as NoteDebut["status"] };
          }
          return n;
        })
      );
    }
    setSelectedNote(null);
  };

  // Stats
  const stats = [
    { label: "Total notes", value: notes.length, unit: "notes" },
    { label: "En attente", value: notes.filter((n) => n.status === "pending").length, unit: "notes" },
    { label: "Montant total", value: formatCurrency(notes.reduce((acc, n) => acc + n.montantTotal, 0)), unit: "FCFA" },
  ];

  // État vide
  if (notes.length === 0) {
    return (
      <MainLayout title="Notes de début">
        <div className="flex flex-col items-center justify-center py-16 text-center">
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
      <div className="space-y-6">
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
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.unit}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="ouverture_port">Ouverture de port</SelectItem>
              <SelectItem value="detention">Détention</SelectItem>
              <SelectItem value="reparation">Réparation conteneur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selection Info */}
        {selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedIds.length} note(s) sélectionnée(s)</span>
              <span className="text-sm text-muted-foreground">
                - Total: {formatCurrency(notes.filter((n) => selectedIds.includes(n.id)).reduce((sum, n) => sum + (n.montantTotal - n.paid - n.advance), 0))} FCFA restant
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
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                  </TableHead>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-center">Jours</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                      Aucune note trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotes.map((note, index) => {
                    const typeInfo = typeConfig[note.type];
                    const TypeIcon = typeInfo.icon;
                    const status = statusConfig[note.status];
                    const isSelected = selectedIds.includes(note.id);
                    const remaining = note.montantTotal - note.paid - note.advance;
                    return (
                      <motion.tr
                        key={note.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.05 }}
                        className={`group hover:bg-muted/50 cursor-pointer ${isSelected ? "bg-primary/5" : ""}`}
                        onClick={() => navigate(`/notes-debut/${note.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSelected} onCheckedChange={() => handleSelectOne(note.id)} />
                        </TableCell>
                        <TableCell className="font-medium">{note.number}</TableCell>
                        <TableCell>{note.client}</TableCell>
                        <TableCell>
                          <Badge className={`${typeInfo.color} border`}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{note.containerNumber}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{note.dateDebut} → {note.dateFin}</TableCell>
                        <TableCell className="text-center font-semibold">{note.nombreJours}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(note.montantTotal)} FCFA</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            {note.paid > 0 && <span className="text-success text-sm">{formatCurrency(note.paid)}</span>}
                            {note.advance > 0 && <span className="text-cyan-600 text-xs">+{formatCurrency(note.advance)} avance</span>}
                            {remaining > 0 && <span className="text-muted-foreground text-xs">Reste: {formatCurrency(remaining)}</span>}
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
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="PDF" onClick={() => toast({ title: "PDF", description: `Génération du PDF ${note.number}...` })}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Email" onClick={() => { setSelectedNote(note); setShowEmailModal(true); }}>
                              <Mail className="h-4 w-4" />
                            </Button>
                            {remaining > 0 && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Paiement" onClick={() => { setSelectedNote(note); setShowPaiementModal(true); }}>
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            {note.paid === 0 && note.advance === 0 && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Supprimer" onClick={() => { setSelectedNote(note); setShowDeleteDialog(true); }}>
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
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {selectedNote && (
        <>
          <PaiementNoteModal
            open={showPaiementModal}
            onOpenChange={setShowPaiementModal}
            noteNumero={selectedNote.number}
            montantRestant={selectedNote.montantTotal - selectedNote.paid - selectedNote.advance}
            onSuccess={handlePaiementSuccess}
          />
          <EmailNoteModal
            open={showEmailModal}
            onOpenChange={setShowEmailModal}
            noteNumero={selectedNote.number}
            clientEmail={selectedNote.clientEmail}
            clientNom={selectedNote.client}
            noteType={typeConfig[selectedNote.type].label}
          />
        </>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La note {selectedNote?.number} sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
