import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmailModalWithPdfGenerator } from "@/components/EmailModalWithPdfGenerator";
import { PaiementModal } from "@/components/PaiementModal";
import { AnnulationPaiementModal } from "@/components/AnnulationPaiementModal";
import { PaiementGlobalModal } from "@/components/PaiementGlobalModal";
import { ExportModal } from "@/components/ExportModal";
import { AnnulationModal } from "@/components/AnnulationModal";

interface FacturesModalsProps {
  confirmDelete: { id: string; numero: string } | null;
  onConfirmDeleteClose: () => void;
  onHandleDelete: () => void;
  emailModal: any | null;
  onEmailClose: () => void;
  paiementModal: any | null;
  onPaiementClose: () => void;
  annulationModal: any | null;
  onAnnulationClose: () => void;
  paiementGlobalOpen: boolean;
  onPaiementGlobalClose: (v: boolean) => void;
  exportOpen: boolean;
  onExportClose: (v: boolean) => void;
  annulationPaiementModal: { id: string; numero: string } | null;
  onAnnulationPaiementClose: () => void;
  onRefetch: () => void;
}

export function FacturesModals({
  confirmDelete, onConfirmDeleteClose, onHandleDelete,
  emailModal, onEmailClose,
  paiementModal, onPaiementClose,
  annulationModal, onAnnulationClose,
  paiementGlobalOpen, onPaiementGlobalClose,
  exportOpen, onExportClose,
  annulationPaiementModal, onAnnulationPaiementClose, onRefetch,
}: FacturesModalsProps) {
  return (
    <>
      <AlertDialog open={!!confirmDelete} onOpenChange={onConfirmDeleteClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer la facture {confirmDelete?.numero} ? Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onHandleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {emailModal && (
        <EmailModalWithPdfGenerator
          open={!!emailModal} onOpenChange={onEmailClose} documentType="facture"
          documentData={{
            id: emailModal.id, numero: emailModal.numero,
            clientNom: emailModal.client?.nom, clientEmail: emailModal.client?.email,
            transitaireNom: emailModal.transitaire?.nom, transitaireEmail: emailModal.transitaire?.email,
            armateurNom: emailModal.armateur?.nom, armateurEmail: emailModal.armateur?.email,
            representantNom: emailModal.representant?.nom, representantEmail: emailModal.representant?.email,
            contacts: emailModal.client?.contacts || [],
            montantHT: emailModal.montant_ht, montantTTC: emailModal.montant_ttc,
            remiseMontant: emailModal.remise_montant, remiseType: emailModal.remise_type,
            tva: emailModal.montant_tva, css: emailModal.montant_css,
            resteAPayer: emailModal.reste_a_payer,
            dateCreation: emailModal.date_facture, dateEcheance: emailModal.date_echeance,
            statut: emailModal.statut, categorie: emailModal.categorie,
          }}
          pdfContentUrl={`${import.meta.env.VITE_API_URL || 'https://facturation.logistiga.com/backend/public'}/api/factures/${emailModal.id}/pdf-html`}
        />
      )}

      {paiementModal && (
        <PaiementModal
          open={!!paiementModal} onOpenChange={onPaiementClose} documentType="facture"
          documentId={paiementModal.id} documentNumero={paiementModal.numero}
          montantRestant={paiementModal.montantRestant}
          clientId={paiementModal.clientId ? Number(paiementModal.clientId) : undefined}
          montantHT={paiementModal.montantHT} montantDejaPaye={paiementModal.montantDejaPaye}
          exonereTva={paiementModal.exonereTva} exonereCss={paiementModal.exonereCss}
          tauxTva={18} tauxCss={1} onSuccess={() => {}}
        />
      )}

      {annulationModal && (
        <AnnulationModal
          open={!!annulationModal} onOpenChange={onAnnulationClose} documentType="facture"
          documentId={Number(annulationModal.id)} documentNumero={annulationModal.numero}
          montantTTC={annulationModal.montantTTC} montantPaye={annulationModal.montantPaye}
          clientNom={annulationModal.clientNom}
        />
      )}

      <PaiementGlobalModal open={paiementGlobalOpen} onOpenChange={onPaiementGlobalClose} />
      <ExportModal open={exportOpen} onOpenChange={onExportClose} />

      {annulationPaiementModal && (
        <AnnulationPaiementModal
          open={!!annulationPaiementModal} onOpenChange={onAnnulationPaiementClose}
          documentType="facture" documentId={annulationPaiementModal.id}
          documentNumero={annulationPaiementModal.numero} onSuccess={onRefetch}
        />
      )}
    </>
  );
}
