import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNoteDebut } from "@/hooks/use-notes-debut";
import { EmailModalWithTemplate } from "@/components/EmailModalWithTemplate";
import { toast } from "sonner";
import api from "@/lib/api";

export default function NoteDebutPDF() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: note, isLoading, error } = useNoteDebut(id);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Auto-download on load
  useEffect(() => {
    if (note) {
      const timer = setTimeout(() => {
        handleDownloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [note]);

  const handleDownloadPdf = async () => {
    if (!id || isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await api.get(`/notes-debit/${id}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Note_${note?.numero || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF téléchargé avec succès");
    } catch (err) {
      console.error("Erreur téléchargement PDF:", err);
      toast.error("Erreur lors du téléchargement du PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Note non trouvée</p>
        <Button onClick={() => navigate("/notes-debut")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux notes
        </Button>
      </div>
    );
  }

  const clientName = note.client?.nom || (note.client as any)?.raison_sociale || '-';
  const clientEmail = note.client?.email || '';
  const montantTotal = note.montant_total || note.montant_ttc || note.montant_ht || 0;
  const dateCreation = note.date_creation || note.date || note.created_at;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/notes-debut/${id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">PDF - {note.numero}</h1>
              <p className="text-sm text-muted-foreground">Le PDF est généré par le serveur</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownloadPdf} disabled={isDownloading} className="gap-2">
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Télécharger PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowEmailModal(true)} 
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Envoyer par email
            </Button>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="container py-16 flex justify-center">
        <div className="text-center space-y-4">
          <Download className="h-16 w-16 text-primary mx-auto" />
          <h2 className="text-xl font-semibold">PDF en cours de téléchargement</h2>
          <p className="text-muted-foreground">
            Le PDF de la note <strong>{note.numero}</strong> est généré par le serveur.<br/>
            Si le téléchargement ne démarre pas, cliquez sur le bouton ci-dessus.
          </p>
        </div>
      </div>

      {/* Email Modal */}
      <EmailModalWithTemplate
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        documentType="note_debut"
        documentData={{
          id: note.id,
          numero: note.numero,
          dateCreation: dateCreation,
          montantTTC: montantTotal,
          clientNom: clientName,
          clientEmail: clientEmail,
        }}
      />
    </div>
  );
}
