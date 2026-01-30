import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpdateMouvementCaisse, useCategoriesDepenses } from "@/hooks/use-commercial";
import { formatMontant } from "@/data/mockData";

interface MouvementCaisse {
  id: string;
  type: 'entree' | 'sortie';
  montant: number;
  date: string;
  description: string;
  source: string;
  categorie: string;
  beneficiaire?: string | null;
}

interface EditMouvementCaisseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mouvement: MouvementCaisse;
  onSuccess?: () => void;
}

export function EditMouvementCaisseModal({
  open,
  onOpenChange,
  mouvement,
  onSuccess,
}: EditMouvementCaisseModalProps) {
  const { toast } = useToast();
  const [montant, setMontant] = useState<number>(mouvement.montant);
  const [description, setDescription] = useState(mouvement.description);
  const [categorie, setCategorie] = useState(mouvement.categorie);
  const [beneficiaire, setBeneficiaire] = useState(mouvement.beneficiaire || "");

  const typeLabel = mouvement.type === 'entree' ? 'Entrée' : 'Sortie';
  const { data: categoriesData } = useCategoriesDepenses({ type: typeLabel, actif: true });
  const updateMouvement = useUpdateMouvementCaisse();

  const categories = categoriesData?.data || [];

  // Reset form when mouvement changes
  useEffect(() => {
    setMontant(mouvement.montant);
    setDescription(mouvement.description);
    setCategorie(mouvement.categorie);
    setBeneficiaire(mouvement.beneficiaire || "");
  }, [mouvement]);

  const handleSubmit = async () => {
    if (montant <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être supérieur à 0.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une description.",
        variant: "destructive",
      });
      return;
    }

    if (!categorie) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une catégorie.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateMouvement.mutateAsync({
        id: mouvement.id,
        data: {
          montant,
          description,
          categorie,
          beneficiaire: beneficiaire || undefined,
        },
      });

      toast({
        title: "Mouvement modifié",
        description: `Le mouvement de ${formatMontant(montant)} a été mis à jour.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Modifier le mouvement
          </DialogTitle>
          <DialogDescription>
            Modifier cette {mouvement.type === 'entree' ? 'entrée' : 'sortie'} de caisse
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {/* Ajouter la catégorie actuelle si elle n'est pas dans la liste */}
                {!categories.find((cat: any) => cat.nom === categorie) && categorie && (
                  <SelectItem key="current" value={categorie}>
                    {categorie}
                  </SelectItem>
                )}
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.nom}>
                    {cat.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="edit-montant">Montant (FCFA) *</Label>
            <Input
              id="edit-montant"
              type="number"
              value={montant || ""}
              onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
              className="text-right text-lg font-semibold"
              placeholder="0"
            />
          </div>

          {/* Bénéficiaire/Source */}
          <div className="space-y-2">
            <Label htmlFor="edit-beneficiaire">
              {mouvement.type === 'sortie' ? 'Bénéficiaire' : 'Source'}
            </Label>
            <Input
              id="edit-beneficiaire"
              placeholder={mouvement.type === 'sortie' ? "Nom du bénéficiaire" : "Source / Provenance"}
              value={beneficiaire}
              onChange={(e) => setBeneficiaire(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description *</Label>
            <Textarea
              id="edit-description"
              placeholder="Description du mouvement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateMouvement.isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMouvement.isPending}
            className="gap-2"
          >
            {updateMouvement.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
