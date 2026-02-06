import { useState } from "react";
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
import { ArrowDownCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateMouvementCaisse, useCategoriesDepenses } from "@/hooks/use-commercial";
import { formatMontant } from "@/data/mockData";

interface EntreeCaisseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EntreeCaisseModal({
  open,
  onOpenChange,
  onSuccess,
}: EntreeCaisseModalProps) {
  const { toast } = useToast();
  const [montant, setMontant] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");

  const createMouvement = useCreateMouvementCaisse();

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


    try {
      await createMouvement.mutateAsync({
        type: 'Entrée',
        source: 'caisse',
        montant,
        description,
        categorie,
        beneficiaire: source || undefined,
      });

      toast({
        title: "Entrée enregistrée",
        description: `Entrée de ${formatMontant(montant)} en caisse enregistrée.`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by hook
    }
  };

  const resetForm = () => {
    setMontant(0);
    setDescription("");
    setCategorie("");
    setSource("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-success">
            <ArrowDownCircle className="h-5 w-5" />
            Nouvelle entrée de caisse
          </DialogTitle>
          <DialogDescription>
            Enregistrer une entrée d'espèces manuelle
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
                {categories.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Aucune catégorie d'entrée disponible
                  </div>
                ) : (
                  categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.nom}>
                      {cat.nom}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (FCFA) *</Label>
            <Input
              id="montant"
              type="number"
              value={montant || ""}
              onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
              className="text-right text-lg font-semibold"
              placeholder="0"
            />
          </div>

          {/* Source/Provenance */}
          <div className="space-y-2">
            <Label htmlFor="source">Source / Provenance</Label>
            <Input
              id="source"
              placeholder="Ex: Vente comptoir, Client X..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Ex: Vente de matériel, Remboursement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMouvement.isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMouvement.isPending}
            className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
          >
            {createMouvement.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <ArrowDownCircle className="h-4 w-4" />
                Enregistrer l'entrée
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
