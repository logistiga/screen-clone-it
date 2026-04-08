import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PaiementModal } from "@/components/PaiementModal";
import { EmailNoteModal } from "@/components/notes/EmailNoteModal";
import { NoteDebut } from "@/lib/api/notes-debut";
import { getNoteRemaining, getNoteType } from "./useNotesDebutData";

interface NotesModalsProps {
  selectedNote: NoteDebut | null;
  showPaiementModal: boolean;
  onPaiementChange: (v: boolean) => void;
  showEmailModal: boolean;
  onEmailChange: (v: boolean) => void;
  showDeleteDialog: boolean;
  onDeleteChange: (v: boolean) => void;
  onConfirmDelete: () => void;
  onPaiementSuccess: () => void;
  deleteIsPending: boolean;
}

export function NotesModals({
  selectedNote, showPaiementModal, onPaiementChange,
  showEmailModal, onEmailChange,
  showDeleteDialog, onDeleteChange, onConfirmDelete,
  onPaiementSuccess, deleteIsPending,
}: NotesModalsProps) {
  return (
    <>
      {selectedNote && (
        <>
          <PaiementModal
            open={showPaiementModal} onOpenChange={onPaiementChange}
            documentType="note_debut" documentId={selectedNote.id}
            documentNumero={selectedNote.numero}
            montantRestant={getNoteRemaining(selectedNote)}
            clientId={selectedNote.client_id ? parseInt(selectedNote.client_id) : undefined}
            onSuccess={onPaiementSuccess}
          />
          <EmailNoteModal
            open={showEmailModal} onOpenChange={onEmailChange}
            noteId={selectedNote.id} noteNumero={selectedNote.numero}
            clientEmail={selectedNote.client?.email || ''} clientNom={selectedNote.client?.nom || ''}
            noteType={getNoteType(selectedNote).label}
          />
        </>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={onDeleteChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. La note {selectedNote?.numero} sera définitivement supprimée.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="bg-destructive text-destructive-foreground" disabled={deleteIsPending}>
              {deleteIsPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
