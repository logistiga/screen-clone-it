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
  Loader2,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { isAxiosError } from "axios";
import { downloadNoteDebitPdf } from "@/services/api";
import { typeConfig, statusConfig, defaultTypeInfo } from "@/components/notes/note-debut-config";
import { NoteDebutContent } from "@/components/notes/NoteDebutContent";
import { PaiementModal } from "@/components/PaiementModal";
import { EmailNoteModal } from "@/components/notes/EmailNoteModal";
import { useNoteDebut, useDeleteNoteDebut } from "@/hooks/use-notes-debut";
import { usePaiements } from "@/hooks/use-commercial";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const { data: paiementsData } = usePaiements({ ...{ note_debut_id: id } });
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
      const response = await downloadNoteDebitPdf(id);
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
    } catch (err: unknown) {
      if (!isAxiosError(err)) {
        toast.error("Erreur lors du téléchargement");
        return;
      }
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
  const status = statusConfig[note.statut || 'en_attente'] || statusConfig.en_attente;
  
  const montantTotal = note.montant_total || note.montant_ttc || 0;
  const montantPaye = note.montant_paye || 0;
  const montantAvance = note.montant_avance || 0;
  const remaining = roundMoney(montantTotal - montantPaye - montantAvance);

  const clientName = note.client?.nom || '-';
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

        <NoteDebutContent note={note} typeInfo={typeInfo} clientName={clientName}
          montantTotal={montantTotal} montantPaye={montantPaye} montantAvance={montantAvance}
          remaining={remaining} paiements={paiements} formatCurrency={formatCurrency}
          formatDate={formatDate} onPayment={() => setShowPaiementModal(true)} />
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
