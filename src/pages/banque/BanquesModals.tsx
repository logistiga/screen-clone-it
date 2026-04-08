import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Save } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { Banque } from "@/lib/api/commercial";

interface BanqueFormModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isEditing: boolean;
  formData: { nom: string; numero_compte: string; iban: string; swift: string; solde: string; actif: boolean };
  setFormData: (fd: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function BanqueFormModal({ open, onOpenChange, isEditing, formData, setFormData, onSubmit, isPending }: BanqueFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la banque" : "Nouvelle banque"}</DialogTitle>
          <DialogDescription>{isEditing ? "Modifiez les informations du compte" : "Ajoutez un nouveau compte bancaire"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom de la banque *</Label>
            <Input id="nom" placeholder="Ex: BGFI Bank" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_compte">N° de compte</Label>
              <Input id="numero_compte" value={formData.numero_compte} onChange={(e) => setFormData({ ...formData, numero_compte: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="swift">Code SWIFT</Label>
              <Input id="swift" value={formData.swift} onChange={(e) => setFormData({ ...formData, swift: e.target.value.toUpperCase() })} maxLength={11} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input id="iban" value={formData.iban} onChange={(e) => setFormData({ ...formData, iban: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="solde">Solde (FCFA)</Label>
            <Input id="solde" type="number" value={formData.solde} onChange={(e) => setFormData({ ...formData, solde: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="actif" checked={formData.actif} onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })} />
            <Label htmlFor="actif">Compte actif</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isEditing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface BanqueDeleteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  banque: Banque | null;
  onDelete: () => void;
  isPending: boolean;
}

export function BanqueDeleteDialog({ open, onOpenChange, banque, onDelete, isPending }: BanqueDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce compte bancaire ?</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le compte <strong>{banque?.nom}</strong> ?
            {banque && (banque.solde || 0) > 0 && (
              <span className="block mt-2 text-destructive">⚠️ Ce compte a un solde de {formatMontant(banque.solde || 0)}.</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
