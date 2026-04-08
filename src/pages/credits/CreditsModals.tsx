import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { NouveauCreditModal } from "@/components/NouveauCreditModal";
import { RemboursementCreditModal } from "@/components/RemboursementCreditModal";

interface CreditsModalsProps {
  showNouveauModal: boolean; setShowNouveauModal: (v: boolean) => void;
  showRemboursementModal: boolean; setShowRemboursementModal: (v: boolean) => void;
  selectedCredit: any; setSelectedCredit: (v: any) => void;
  selectedEcheance: any; setSelectedEcheance: (v: any) => void;
  creditToAnnuler: any; setCreditToAnnuler: (v: any) => void;
  creditToSupprimer: any; setCreditToSupprimer: (v: any) => void;
  motifAnnulation: string; setMotifAnnulation: (v: string) => void;
  handleAnnuler: () => void; handleSupprimer: () => void;
  annulerPending: boolean; supprimerPending: boolean;
}

export function CreditsModals({
  showNouveauModal, setShowNouveauModal,
  showRemboursementModal, setShowRemboursementModal,
  selectedCredit, setSelectedCredit, selectedEcheance, setSelectedEcheance,
  creditToAnnuler, setCreditToAnnuler, creditToSupprimer, setCreditToSupprimer,
  motifAnnulation, setMotifAnnulation,
  handleAnnuler, handleSupprimer, annulerPending, supprimerPending,
}: CreditsModalsProps) {
  return (
    <>
      <NouveauCreditModal open={showNouveauModal} onOpenChange={setShowNouveauModal} />
      {selectedCredit && (
        <RemboursementCreditModal
          open={showRemboursementModal}
          onOpenChange={(open) => { setShowRemboursementModal(open); if (!open) { setSelectedCredit(null); setSelectedEcheance(null); } }}
          credit={selectedCredit} echeance={selectedEcheance}
        />
      )}

      <AlertDialog open={!!creditToAnnuler} onOpenChange={(open) => { if (!open) { setCreditToAnnuler(null); setMotifAnnulation(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler le crédit {creditToAnnuler?.numero} ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action changera le statut du crédit en "Annulé" et annulera toutes les échéances non payées. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium">Motif d'annulation *</label>
            <Textarea value={motifAnnulation} onChange={(e) => setMotifAnnulation(e.target.value)} placeholder="Indiquez le motif de l'annulation..." className="mt-1" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAnnuler} disabled={!motifAnnulation.trim() || annulerPending} className="bg-amber-600 hover:bg-amber-700">
              {annulerPending ? 'Annulation...' : 'Confirmer l\'annulation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!creditToSupprimer} onOpenChange={(open) => { if (!open) setCreditToSupprimer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le crédit {creditToSupprimer?.numero} ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action supprimera définitivement le crédit ainsi que toutes ses échéances et documents associés. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleSupprimer} disabled={supprimerPending} className="bg-destructive hover:bg-destructive/90">
              {supprimerPending ? 'Suppression...' : 'Supprimer définitivement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
