import { useParams, useNavigate } from "react-router-dom";
import { roundMoney } from "@/lib/utils";
import { useState } from "react";
import {
  ArrowLeft,
  Edit,
  Download,
  Mail,
  CreditCard,
  Trash2,
  Anchor,
  Container,
  Wrench,
  Calendar,
  Clock,
  FileText,
  User,
  Receipt,
  PackageOpen,
  Loader2,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { PaiementModal } from "@/components/PaiementModal";
import { EmailNoteModal } from "@/components/notes/EmailNoteModal";
import { useNoteDebut, useDeleteNoteDebut } from "@/hooks/use-notes-debut";
import { usePaiements } from "@/hooks/use-commercial";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const typeConfig: Record<string, { label: string; icon: typeof Anchor; color: string }> = {
  ouverture_port: {
    label: "Ouverture de port",
    icon: Anchor,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  "Ouverture Port": {
    label: "Ouverture de port",
    icon: Anchor,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  detention: {
    label: "Détention",
    icon: Container,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  Detention: {
    label: "Détention",
    icon: Container,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  reparation: {
    label: "Réparation conteneur",
    icon: Wrench,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  Reparation: {
    label: "Réparation conteneur",
    icon: Wrench,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  relache: {
    label: "Relâche",
    icon: PackageOpen,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  Relache: {
    label: "Relâche",
    icon: PackageOpen,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

const statusConfig: Record<string, { label: string; class: string }> = {
  brouillon: { label: "Brouillon", class: "bg-muted text-muted-foreground" },
  en_attente: { label: "En attente", class: "bg-warning/20 text-warning" },
  facturee: { label: "Facturée", class: "bg-primary/20 text-primary" },
  payee: { label: "Payée", class: "bg-success/20 text-success" },
  annulee: { label: "Annulée", class: "bg-muted text-muted-foreground" },
  partielle: { label: "Partielle", class: "bg-cyan-500/20 text-cyan-600" },
};

const defaultTypeInfo = {
  label: "Note",
  icon: FileText,
  color: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function NoteDebutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Fetch note data from API
  const { data: note, isLoading, error } = useNoteDebut(id);
  
  // Fetch payments for this note
  const { data: paiementsData } = usePaiements({ note_debut_id: id } as any);
  const paiements = paiementsData?.data || [];

  const deleteMutation = useDeleteNoteDebut();

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "0";
    return new Intl.NumberFormat("fr-GA", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate("/notes-debut");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    if (!id || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const { default: api } = await import("@/lib/api");
      const response = await api.get(`/notes-debit/${id}/pdf`, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || '';
      
      if (contentType.includes('application/json') || (response.data as Blob)?.size < 500) {
        const text = await (response.data as Blob).text();
        try {
          const errorData = JSON.parse(text);
          toast.error(errorData.error || errorData.message || "Erreur PDF");
        } catch {
          toast.error("Erreur serveur: " + text.substring(0, 200));
        }
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Note_${note?.numero || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("PDF téléchargé");
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorData = JSON.parse(text);
          toast.error(errorData.error || errorData.message || "Erreur PDF");
        } catch {
          toast.error("Erreur lors du téléchargement");
        }
      } else {
        toast.error(err.response?.data?.message || "Erreur lors du téléchargement");
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePaiementSuccess = () => {
    // Refresh data after payment
    queryClient.invalidateQueries({ queryKey: ['notes-debut', id] });
    queryClient.invalidateQueries({ queryKey: ['paiements'] });
  };

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !note) {
    return (
      <MainLayout title="Erreur">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive">Note non trouvée</p>
          <Button onClick={() => navigate("/notes-debut")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux notes
          </Button>
        </div>
      </MainLayout>
    );
  }

  const typeInfo = typeConfig[note.type] || defaultTypeInfo;
  const TypeIcon = typeInfo.icon;
  const status = statusConfig[note.statut || 'en_attente'] || statusConfig.en_attente;
  
  const montantTotal = note.montant_total || note.montant_ttc || 0;
  const montantPaye = note.montant_paye || 0;
  const montantAvance = note.montant_avance || 0;
  const remaining = roundMoney(montantTotal - montantPaye - montantAvance);

  const clientName = note.client?.nom || (note.client as any)?.raison_sociale || '-';
  const clientEmail = note.client?.email || '';
  const clientId = note.client_id;

  return (
    <MainLayout title={`Note ${note.numero}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/notes-debut")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">{note.numero}</h1>
                <Badge className={status.class}>{status.label}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{clientName}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/notes-debut/${id}/modifier`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloadingPdf}>
              {isDownloadingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {isDownloadingPdf ? 'Téléchargement...' : 'PDF'}
            </Button>
            <Button variant="outline" onClick={() => setShowEmailModal(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            {remaining > 0 && (
              <Button onClick={() => setShowPaiementModal(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Paiement
              </Button>
            )}
            {montantPaye === 0 && montantAvance === 0 && (
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations de la note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge className={`${typeInfo.color} border text-base px-4 py-2`}>
                  <TypeIcon className="h-5 w-5 mr-2" />
                  {typeInfo.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" /> Client
                  </p>
                  <p className="font-medium">{clientName}</p>
                </div>
                {note.conteneur_numero && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">N° Conteneur</p>
                    <p className="font-mono font-medium">{note.conteneur_numero}</p>
                  </div>
                )}
                {note.bl_numero && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">N° BL</p>
                    <p className="font-medium">{note.bl_numero}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(note.date_debut || note.date_debut_stockage) && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Date début
                    </p>
                    <p className="font-medium">{formatDate(note.date_debut || note.date_debut_stockage)}</p>
                  </div>
                )}
                {(note.date_fin || note.date_fin_stockage) && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Date fin
                    </p>
                    <p className="font-medium">{formatDate(note.date_fin || note.date_fin_stockage)}</p>
                  </div>
                )}
                {(note.nombre_jours || note.jours_stockage) && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Nombre de jours
                    </p>
                    <p className="font-bold text-xl">{note.nombre_jours || note.jours_stockage}</p>
                  </div>
                )}
                {note.tarif_journalier && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tarif journalier</p>
                    <p className="font-medium">{formatCurrency(note.tarif_journalier)} FCFA</p>
                  </div>
                )}
              </div>

              {(note.description || note.observations || note.notes) && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p>{note.description || note.observations || note.notes}</p>
                  </div>
                </>
              )}

              {note.navire && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Navire</p>
                    <p className="font-medium">{note.navire}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Résumé financier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Résumé financier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Montant total</span>
                  <span className="font-bold text-xl">{formatCurrency(montantTotal)} FCFA</span>
                </div>
                <Separator />
                {montantAvance > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Avance</span>
                    <span className="text-cyan-600 font-medium">
                      -{formatCurrency(montantAvance)} FCFA
                    </span>
                  </div>
                )}
                {montantPaye > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payé</span>
                    <span className="text-success font-medium">
                      -{formatCurrency(montantPaye)} FCFA
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Reste à payer</span>
                  <span className={`font-bold text-xl ${remaining > 0 ? "text-destructive" : "text-success"}`}>
                    {formatCurrency(remaining)} FCFA
                  </span>
                </div>
              </div>

              {remaining > 0 && (
                <Button className="w-full" onClick={() => setShowPaiementModal(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Enregistrer un paiement
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Historique des paiements */}
        {paiements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paiements.map((paiement: any) => (
                    <TableRow key={paiement.id}>
                      <TableCell>{formatDate(paiement.date || paiement.date_paiement)}</TableCell>
                      <TableCell>{paiement.mode_paiement}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {paiement.reference || paiement.numero_cheque || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-success">
                        {formatCurrency(paiement.montant)} FCFA
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <PaiementModal
        open={showPaiementModal}
        onOpenChange={setShowPaiementModal}
        documentType="note_debut"
        documentId={note.id}
        documentNumero={note.numero}
        montantRestant={remaining}
        clientId={clientId ? parseInt(clientId) : undefined}
        onSuccess={handlePaiementSuccess}
      />

      <EmailNoteModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        noteId={note.id}
        noteNumero={note.numero}
        clientEmail={clientEmail}
        clientNom={clientName}
        noteType={typeInfo.label}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La note {note.numero} sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
