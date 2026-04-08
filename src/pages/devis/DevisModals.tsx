import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmailModalWithPdfGenerator } from "@/components/EmailModalWithPdfGenerator";

interface DevisModalsProps {
  confirmAction: { type: 'annuler' | 'supprimer' | 'convertir' | 'facturer' | 'valider' | null; id: string; numero: string } | null;
  onConfirmClose: () => void;
  onConfirmAction: () => void;
  emailModal: any | null;
  onEmailClose: () => void;
}

export function DevisModals({ confirmAction, onConfirmClose, onConfirmAction, emailModal, onEmailClose }: DevisModalsProps) {
  return (
    <>
      <AlertDialog open={!!confirmAction} onOpenChange={onConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'annuler' && 'Annuler le devis'}
              {confirmAction?.type === 'valider' && 'Valider le devis'}
              {confirmAction?.type === 'supprimer' && 'Supprimer le devis'}
              {confirmAction?.type === 'convertir' && 'Convertir en ordre'}
              {confirmAction?.type === 'facturer' && 'Convertir en facture'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'annuler' && `Êtes-vous sûr de vouloir annuler le devis ${confirmAction?.numero} ?`}
              {confirmAction?.type === 'valider' && `Êtes-vous sûr de vouloir valider le devis ${confirmAction?.numero} ?`}
              {confirmAction?.type === 'supprimer' && `Êtes-vous sûr de vouloir supprimer le devis ${confirmAction?.numero} ? Cette action est irréversible.`}
              {confirmAction?.type === 'convertir' && `Voulez-vous convertir le devis ${confirmAction?.numero} en ordre de travail ?`}
              {confirmAction?.type === 'facturer' && `Voulez-vous convertir le devis ${confirmAction?.numero} directement en facture ?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmAction}
              className={confirmAction?.type === 'supprimer' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmAction?.type === 'annuler' && 'Annuler le devis'}
              {confirmAction?.type === 'valider' && 'Valider'}
              {confirmAction?.type === 'supprimer' && 'Supprimer'}
              {confirmAction?.type === 'convertir' && 'Convertir en ordre'}
              {confirmAction?.type === 'facturer' && 'Convertir en facture'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {emailModal && (
        <EmailModalWithPdfGenerator
          open={!!emailModal}
          onOpenChange={onEmailClose}
          documentType="devis"
          documentData={{
            id: emailModal.id,
            numero: emailModal.numero,
            clientNom: emailModal.client?.nom,
            clientEmail: emailModal.client?.email,
            transitaireNom: emailModal.transitaire?.nom,
            transitaireEmail: emailModal.transitaire?.email,
            armateurNom: emailModal.armateur?.nom,
            armateurEmail: emailModal.armateur?.email,
            representantNom: emailModal.representant?.nom,
            representantEmail: emailModal.representant?.email,
            contacts: emailModal.client?.contacts || [],
            montantHT: emailModal.montant_ht,
            montantTTC: emailModal.montant_ttc,
            remiseMontant: emailModal.remise_montant,
            remiseType: emailModal.remise_type,
            tva: emailModal.montant_tva,
            css: emailModal.montant_css,
            dateCreation: emailModal.date_creation,
            dateValidite: emailModal.date_validite,
            statut: emailModal.statut,
            categorie: emailModal.type_document,
          }}
          pdfContentUrl={`${import.meta.env.VITE_API_URL || 'https://facturation.logistiga.com/backend/public'}/api/devis/${emailModal.id}/pdf-html`}
        />
      )}
    </>
  );
}
