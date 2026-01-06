import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { banques } from "@/data/mockData";
import { z } from "zod";
import { Lightbulb, AlertCircle } from "lucide-react";

// Schéma de validation Zod
const previsionSchema = z.object({
  titre: z.string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(100, "Le titre ne peut pas dépasser 100 caractères"),
  description: z.string()
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(500, "La description ne peut pas dépasser 500 caractères"),
  montantEstime: z.number()
    .min(100000, "Le montant minimum est de 100 000 FCFA")
    .max(10000000000, "Le montant maximum est de 10 milliards FCFA"),
  banqueEnvisagee: z.string().optional(),
  tauxEstime: z.number()
    .min(0, "Le taux ne peut pas être négatif")
    .max(50, "Le taux ne peut pas dépasser 50%")
    .optional(),
  dureeEstimee: z.number()
    .min(1, "La durée minimum est de 1 mois")
    .max(360, "La durée maximum est de 360 mois")
    .optional(),
  dateObjectif: z.string().optional(),
  priorite: z.enum(["haute", "moyenne", "basse"], {
    required_error: "Veuillez sélectionner une priorité"
  }),
  notes: z.string().max(1000, "Les notes ne peuvent pas dépasser 1000 caractères").optional()
});

type PrevisionFormData = z.infer<typeof previsionSchema>;

interface NouvellePrevisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NouvellePrevisionModal({ open, onOpenChange, onSuccess }: NouvellePrevisionModalProps) {
  const [formData, setFormData] = useState<Partial<PrevisionFormData>>({
    titre: "",
    description: "",
    montantEstime: undefined,
    banqueEnvisagee: "",
    tauxEstime: undefined,
    dureeEstimee: undefined,
    dateObjectif: "",
    priorite: "moyenne",
    notes: ""
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: keyof PrevisionFormData, value: unknown) => {
    try {
      const fieldSchema = previsionSchema.shape[field];
      fieldSchema.parse(value);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [field]: error.errors[0]?.message || "Erreur de validation"
        }));
      }
      return false;
    }
  };

  const handleChange = (field: keyof PrevisionFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validation en temps réel pour les champs obligatoires
    if (field === "titre" || field === "description" || field === "priorite") {
      validateField(field, value);
    }
  };

  const handleNumberChange = (field: keyof PrevisionFormData, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
    
    if (field === "montantEstime" && numValue !== undefined) {
      validateField(field, numValue);
    }
  };

  const resetForm = () => {
    setFormData({
      titre: "",
      description: "",
      montantEstime: undefined,
      banqueEnvisagee: "",
      tauxEstime: undefined,
      dureeEstimee: undefined,
      dateObjectif: "",
      priorite: "moyenne",
      notes: ""
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation complète
      const validatedData = previsionSchema.parse({
        ...formData,
        montantEstime: formData.montantEstime || 0
      });

      // Simulation de création (à remplacer par l'appel API réel)
      console.log("Nouvelle prévision créée:", validatedData);
      
      toast.success("Prévision créée avec succès", {
        description: `"${validatedData.titre}" a été ajoutée aux prévisions d'investissement.`
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Formulaire invalide", {
          description: "Veuillez corriger les erreurs avant de soumettre."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  // Calcul de la mensualité estimée
  const calculerMensualiteEstimee = () => {
    const { montantEstime, tauxEstime, dureeEstimee } = formData;
    if (!montantEstime || !tauxEstime || !dureeEstimee) return null;

    const tauxMensuel = tauxEstime / 100 / 12;
    const mensualite = montantEstime * (tauxMensuel * Math.pow(1 + tauxMensuel, dureeEstimee)) / 
                       (Math.pow(1 + tauxMensuel, dureeEstimee) - 1);
    const totalInterets = (mensualite * dureeEstimee) - montantEstime;

    return { mensualite, totalInterets };
  };

  const simulation = calculerMensualiteEstimee();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-600" />
            Nouvelle prévision d'investissement
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau projet d'investissement ou de financement en attente d'approbation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations principales */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titre" className="flex items-center gap-1">
                Titre du projet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titre"
                placeholder="Ex: Acquisition nouveau camion-citerne"
                value={formData.titre}
                onChange={(e) => handleChange("titre", e.target.value)}
                className={errors.titre ? "border-destructive" : ""}
              />
              {errors.titre && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.titre}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-1">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Décrivez le projet, ses objectifs et les raisons de l'investissement..."
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="montantEstime" className="flex items-center gap-1">
                  Montant estimé (FCFA) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="montantEstime"
                  type="number"
                  placeholder="Ex: 50000000"
                  value={formData.montantEstime ?? ""}
                  onChange={(e) => handleNumberChange("montantEstime", e.target.value)}
                  className={errors.montantEstime ? "border-destructive" : ""}
                />
                {errors.montantEstime && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.montantEstime}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priorite" className="flex items-center gap-1">
                  Priorité <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.priorite}
                  onValueChange={(value) => handleChange("priorite", value as "haute" | "moyenne" | "basse")}
                >
                  <SelectTrigger className={errors.priorite ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner la priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haute">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Haute
                      </span>
                    </SelectItem>
                    <SelectItem value="moyenne">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        Moyenne
                      </span>
                    </SelectItem>
                    <SelectItem value="basse">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        Basse
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.priorite && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.priorite}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Paramètres de financement */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Paramètres de financement estimés
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banqueEnvisagee">Banque envisagée</Label>
                <Select
                  value={formData.banqueEnvisagee}
                  onValueChange={(value) => handleChange("banqueEnvisagee", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une banque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non définie</SelectItem>
                    {banques.map(banque => (
                      <SelectItem key={banque.id} value={banque.id}>
                        {banque.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateObjectif">Date objectif</Label>
                <Input
                  id="dateObjectif"
                  type="date"
                  value={formData.dateObjectif}
                  onChange={(e) => handleChange("dateObjectif", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tauxEstime">Taux estimé (%)</Label>
                <Input
                  id="tauxEstime"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 8.5"
                  value={formData.tauxEstime ?? ""}
                  onChange={(e) => handleNumberChange("tauxEstime", e.target.value)}
                  className={errors.tauxEstime ? "border-destructive" : ""}
                />
                {errors.tauxEstime && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tauxEstime}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dureeEstimee">Durée estimée (mois)</Label>
                <Input
                  id="dureeEstimee"
                  type="number"
                  placeholder="Ex: 36"
                  value={formData.dureeEstimee ?? ""}
                  onChange={(e) => handleNumberChange("dureeEstimee", e.target.value)}
                  className={errors.dureeEstimee ? "border-destructive" : ""}
                />
                {errors.dureeEstimee && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.dureeEstimee}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Simulation */}
          {simulation && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                📊 Simulation estimée
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Mensualité estimée</p>
                  <p className="font-bold text-lg">{simulation.mensualite.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total intérêts estimés</p>
                  <p className="font-bold text-lg text-orange-600">{simulation.totalInterets.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes additionnelles</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires, contacts, références..."
              rows={2}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className={errors.notes ? "border-destructive" : ""}
            />
            {errors.notes && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.notes}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer la prévision"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
