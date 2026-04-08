import { roundMoney } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmailModalWithTemplate } from "@/components/EmailModalWithTemplate";
import { PaiementModal } from "@/components/PaiementModal";
import { PaiementGlobalOrdresModal } from "@/components/PaiementGlobalOrdresModal";
import { AnnulationPaiementModal } from "@/components/AnnulationPaiementModal";
import { ExportModal } from "@/components/ExportModal";
import { AnnulationOrdreModal } from "@/components/AnnulationOrdreModal";

interface OrdreModalsProps {
  confirmAction: { type: "supprimer" | "facturer" | null; id: string; numero: string } | null;
  onConfirmActionChange: (val: any) => void;
  onHandleAction: () => void;
  annulationModal: { id: number; numero: string } | null;
  onAnnulationModalChange: (val: any) => void;
  paiementModal: any;
  onPaiementModalChange: (val: any) => void;
  paiementGlobalOpen: boolean;
  onPaiementGlobalChange: (val: boolean) => void;
  exportOpen: boolean;
  onExportChange: (val: boolean) => void;
  emailModal: any;
  onEmailModalChange: (val: any) => void;
  annulationPaiementModal: { id: string; numero: string } | null;
  onAnnulationPaiementModalChange: (val: any) => void;
  onRefetch: () => void;
}

export function OrdreModals({
  confirmAction, onConfirmActionChange, onHandleAction,
  annulationModal, onAnnulationModalChange,
  paiementModal, onPaiementModalChange,
  paiementGlobalOpen, onPaiementGlobalChange,
  exportOpen, onExportChange,
  emailModal, onEmailModalChange,
  annulationPaiementModal, onAnnulationPaiementModalChange,
  onRefetch,
}: OrdreModalsProps) {
  return (
    <>
      <AlertDialog open={!!confirmAction} onOpenChange={() => onConfirmActionChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "supprimer" ? "Confirmer la suppression" : "Convertir en facture"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "supprimer"
                ? `Êtes-vous sûr de vouloir supprimer l'ordre ${confirmAction?.numero} ? Cette action est irréversible.`
                : `Voulez-vous convertir l'ordre ${confirmAction?.numero} en facture ?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onHandleAction}
              className={confirmAction?.type === "supprimer" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmAction?.type === "supprimer" ? "Supprimer" : "Convertir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {annulationModal && (
        <AnnulationOrdreModal
          open={!!annulationModal}
          onOpenChange={() => onAnnulationModalChange(null)}
          ordreId={annulationModal.id}
          ordreNumero={annulationModal.numero}
        />
      )}

      {paiementModal && (
        <PaiementModal
          open={!!paiementModal}
          onOpenChange={() => onPaiementModalChange(null)}
          documentType="ordre"
          documentId={paiementModal.id}
          documentNumero={paiementModal.numero}
          montantRestant={paiementModal.montantRestant}
          clientId={paiementModal.clientId}
          montantHT={paiementModal.montantHT}
          montantDejaPaye={paiementModal.montantDejaPaye}
          exonereTva={paiementModal.exonereTva}
          exonereCss={paiementModal.exonereCss}
          tauxTva={18}
          tauxCss={1}
          onSuccess={() => onRefetch()}
        />
      )}

      <PaiementGlobalOrdresModal open={paiementGlobalOpen} onOpenChange={onPaiementGlobalChange} />
      <ExportModal open={exportOpen} onOpenChange={onExportChange} />

      {emailModal && (
        <EmailModalWithTemplate
          open={!!emailModal}
          onOpenChange={() => onEmailModalChange(null)}
          documentType="ordre"
          documentData={{
            id: emailModal.id,
            numero: emailModal.numero,
            dateCreation: emailModal.date_creation,
            montantTTC: emailModal.montant_ttc,
            montantHT: emailModal.montant_ht,
            resteAPayer: roundMoney((emailModal.montant_ttc || 0) - (emailModal.montant_paye || 0)),
            clientNom: emailModal.client?.raison_sociale || emailModal.client?.nom_complet,
            clientEmail: emailModal.client?.email,
            transitaireNom: emailModal.transitaire?.nom,
            transitaireEmail: emailModal.transitaire?.email,
            armateurNom: emailModal.armateur?.nom,
            armateurEmail: emailModal.armateur?.email,
            representantNom: emailModal.representant?.nom,
            representantEmail: emailModal.representant?.email,
            contacts: emailModal.client?.contacts || [],
            statut: emailModal.statut,
            categorie: emailModal.categorie || emailModal.type_operation,
          }}
        />
      )}

      {annulationPaiementModal && (
        <AnnulationPaiementModal
          open={!!annulationPaiementModal}
          onOpenChange={() => onAnnulationPaiementModalChange(null)}
          documentType="ordre"
          documentId={annulationPaiementModal.id}
          documentNumero={annulationPaiementModal.numero}
          onSuccess={() => onRefetch()}
        />
      )}
    </>
  );
}
