import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCreatePrevision } from "@/hooks/use-previsions";
import { useCategoriesDepenses } from "@/hooks/use-commercial";
import type { CategorieDepense } from "@/lib/api/commercial";
import { TrendingUp, TrendingDown } from "lucide-react";

interface NouvellePrevisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultType?: 'recette' | 'depense';
  defaultMois?: number;
  defaultAnnee?: number;
}

export function NouvellePrevisionModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  defaultType = 'depense',
  defaultMois,
  defaultAnnee,
}: NouvellePrevisionModalProps) {
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    type: defaultType,
    categorie: '',
    description: '',
    montant_prevu: '',
    mois: defaultMois || currentDate.getMonth() + 1,
    annee: defaultAnnee || currentDate.getFullYear(),
    notes: '',
  });

  const { data: categoriesData, isLoading: loadingCategories } = useCategoriesDepenses({
    type: formData.type === 'recette' ? 'Entrée' : 'Sortie',
    actif: true,
  });

  const createMutation = useCreatePrevision();

  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        type: defaultType,
        mois: defaultMois || currentDate.getMonth() + 1,
        annee: defaultAnnee || currentDate.getFullYear(),
      }));
    }
  }, [open, defaultType, defaultMois, defaultAnnee]);

  const handleChange = (field: string, value: string | number) => {
    if (field === 'type') {
      setFormData(prev => ({ ...prev, type: value as 'recette' | 'depense', categorie: '' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      type: defaultType,
      categorie: '',
      description: '',
      montant_prevu: '',
      mois: defaultMois || currentDate.getMonth() + 1,
      annee: defaultAnnee || currentDate.getFullYear(),
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categorie) {
      toast.error('Veuillez sélectionner une catégorie');
      return;
    }
    
    if (!formData.montant_prevu || parseFloat(formData.montant_prevu) <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }

    try {
      await createMutation.mutateAsync({
        type: formData.type as 'recette' | 'depense',
        categorie: formData.categorie,
        description: formData.description || undefined,
        montant_prevu: parseFloat(formData.montant_prevu),
        mois: formData.mois,
        annee: formData.annee,
        notes: formData.notes || undefined,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const categoriesList = (categoriesData?.data || [])
    .map((c: CategorieDepense) => c.nom)
    .filter(Boolean);

  const moisOptions = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' },
  ];

  const anneeOptions = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 1 + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.type === 'recette' ? (
              <TrendingUp className="h-5 w-5 text-success" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
            Nouvelle prévision budgétaire
          </DialogTitle>
          <DialogDescription>
            Créez une prévision mensuelle pour le suivi budgétaire.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recette">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Recette
                  </span>
                </SelectItem>
                <SelectItem value="depense">
                  <span className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    Dépense
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Période */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mois</Label>
              <Select
                value={formData.mois.toString()}
                onValueChange={(value) => handleChange('mois', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moisOptions.map(m => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Année</Label>
              <Select
                value={formData.annee.toString()}
                onValueChange={(value) => handleChange('annee', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anneeOptions.map(a => (
                    <SelectItem key={a} value={a.toString()}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select
              value={formData.categorie}
              onValueChange={(value) => handleChange('categorie', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {loadingCategories && (
                  <SelectItem value="__loading" disabled>
                    Chargement...
                  </SelectItem>
                )}

                {!loadingCategories && categoriesList.length === 0 && (
                  <SelectItem value="__empty" disabled>
                    Aucune catégorie (voir Catégories de dépenses)
                  </SelectItem>
                )}

                {categoriesList.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label>Montant prévu (FCFA)</Label>
            <Input
              type="number"
              placeholder="Ex: 5000000"
              value={formData.montant_prevu}
              onChange={(e) => handleChange('montant_prevu', e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Input
              placeholder="Description courte..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              placeholder="Notes additionnelles..."
              rows={2}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Création..." : "Créer la prévision"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
