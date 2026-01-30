import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { useDeleteMouvementCaisse } from "@/hooks/use-commercial";
import { formatMontant } from "@/data/mockData";
import { EditMouvementCaisseModal } from "./EditMouvementCaisseModal";

interface MouvementCaisse {
  id: string;
  type: 'entree' | 'sortie';
  montant: number;
  date: string;
  description: string;
  source: string;
  categorie: string;
  beneficiaire?: string | null;
  document_numero?: string | null;
  paiement_id?: number | null;
}

interface MouvementCaisseActionsProps {
  mouvement: MouvementCaisse;
  onSuccess?: () => void;
}

export function MouvementCaisseActions({ mouvement, onSuccess }: MouvementCaisseActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const deleteMouvement = useDeleteMouvementCaisse();

  // On ne peut modifier/supprimer que les mouvements manuels (pas liés à un paiement)
  const canModify = !mouvement.paiement_id && !mouvement.document_numero;

  const handleDelete = async () => {
    try {
      await deleteMouvement.mutateAsync(mouvement.id);
      setShowDeleteDialog(false);
      onSuccess?.();
    } catch {
      // Error handled by hook
    }
  };

  if (!canModify) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditModal(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de modification */}
      <EditMouvementCaisseModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        mouvement={mouvement}
        onSuccess={onSuccess}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce mouvement de{" "}
              <span className="font-semibold">{formatMontant(mouvement.montant)}</span> ?
              <br />
              Cette action est irréversible et mettra à jour le solde de la caisse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMouvement.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMouvement.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMouvement.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
