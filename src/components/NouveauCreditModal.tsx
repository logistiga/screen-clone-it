import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useBanques } from "@/hooks/use-commercial";
import { useCreateCredit } from "@/hooks/use-credits";
import { toast } from "sonner";
import { Loader2, Calculator, Percent } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NouveauCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fonction pour calculer le taux d'intérêt à partir de la mensualité (méthode Newton-Raphson)
function calculerTauxDepuisMensualite(principal: number, mensualite: number, duree: number): number | null {
  if (principal <= 0 || mensualite <= 0 || duree <= 0) return null;
  if (mensualite * duree <= principal) return null; // Mensualité trop faible
  
  // Estimation initiale
  let r = 0.01; // 1% mensuel comme point de départ
  const tolerance = 1e-10;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    const factor = Math.pow(1 + r, duree);
    const f = principal * (r * factor) / (factor - 1) - mensualite;
    
    // Dérivée de la fonction
    const df = principal * (
      (factor * (factor - 1) - r * duree * Math.pow(1 + r, duree - 1) * (factor - 1) + r * factor * duree * Math.pow(1 + r, duree - 1)) / 
      Math.pow(factor - 1, 2)
    );
    
    if (Math.abs(df) < tolerance) break;
    
    const newR = r - f / df;
    
    if (Math.abs(newR - r) < tolerance) {
      // Convertir en taux annuel en pourcentage
      return newR * 12 * 100;
    }
    
    r = Math.max(0.0001, newR); // Éviter les valeurs négatives
  }
  
  // Si Newton-Raphson échoue, utiliser la méthode de bissection
  let low = 0.0001;
  let high = 0.5; // 50% mensuel max
  
  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const factor = Math.pow(1 + mid, duree);
    const calculatedMensualite = principal * (mid * factor) / (factor - 1);
    
    if (Math.abs(calculatedMensualite - mensualite) < 1) {
      return mid * 12 * 100;
    }
    
    if (calculatedMensualite > mensualite) {
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return null;
}

// Fonction pour calculer la mensualité à partir du taux
function calculerMensualiteDepuisTaux(principal: number, tauxAnnuel: number, duree: number): number | null {
  if (principal <= 0 || tauxAnnuel <= 0 || duree <= 0) return null;
  
  const tauxMensuel = tauxAnnuel / 100 / 12;
  const factor = Math.pow(1 + tauxMensuel, duree);
  return principal * (tauxMensuel * factor) / (factor - 1);
}

export function NouveauCreditModal({ open, onOpenChange }: NouveauCreditModalProps) {
  const { data: banques = [], isLoading: isLoadingBanques } = useBanques({ actif: true });
  const createCredit = useCreateCredit();
  
  const [mode, setMode] = useState<"taux" | "mensualite">("mensualite");
  const [formData, setFormData] = useState({
    banqueId: "",
    montantEmprunte: "",
    tauxInteret: "",
    mensualite: "",
    dureeEnMois: "",
    dateDebut: "",
    objet: "",
    notes: ""
  });

  // Calculer automatiquement selon le mode
  const calculerAutomatique = useCallback(() => {
    const montant = parseFloat(formData.montantEmprunte);
    const duree = parseInt(formData.dureeEnMois);
    
    if (mode === "mensualite" && formData.mensualite && montant && duree) {
      const mensualite = parseFloat(formData.mensualite);
      const tauxCalcule = calculerTauxDepuisMensualite(montant, mensualite, duree);
      if (tauxCalcule !== null && tauxCalcule > 0 && tauxCalcule < 100) {
        return { tauxCalcule: tauxCalcule.toFixed(2), mensualiteCalculee: null };
      }
    } else if (mode === "taux" && formData.tauxInteret && montant && duree) {
      const taux = parseFloat(formData.tauxInteret);
      const mensualiteCalculee = calculerMensualiteDepuisTaux(montant, taux, duree);
      if (mensualiteCalculee !== null) {
        return { tauxCalcule: null, mensualiteCalculee: Math.round(mensualiteCalculee) };
      }
    }
    return { tauxCalcule: null, mensualiteCalculee: null };
  }, [formData.montantEmprunte, formData.mensualite, formData.tauxInteret, formData.dureeEnMois, mode]);

  const calculs = calculerAutomatique();
  
  // Calculer le total des intérêts
  const calculerTotalInterets = () => {
    const montant = parseFloat(formData.montantEmprunte);
    const duree = parseInt(formData.dureeEnMois);
    let mensualite: number;
    
    if (mode === "mensualite") {
      mensualite = parseFloat(formData.mensualite);
    } else {
      mensualite = calculs.mensualiteCalculee || 0;
    }
    
    if (montant && duree && mensualite) {
      return Math.round(mensualite * duree - montant);
    }
    return null;
  };

  const totalInterets = calculerTotalInterets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tauxFinal = mode === "mensualite" ? calculs.tauxCalcule : formData.tauxInteret;
    
    if (!formData.banqueId || !formData.montantEmprunte || !tauxFinal || !formData.dureeEnMois || !formData.dateDebut || !formData.objet) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await createCredit.mutateAsync({
        banque_id: parseInt(formData.banqueId),
        montant_principal: parseFloat(formData.montantEmprunte),
        taux_interet: parseFloat(tauxFinal),
        duree_mois: parseInt(formData.dureeEnMois),
        date_debut: formData.dateDebut,
        objet: formData.objet,
        notes: formData.notes || undefined,
      });

      toast.success("Crédit bancaire créé avec succès");
      
      setFormData({
        banqueId: "",
        montantEmprunte: "",
        tauxInteret: "",
        mensualite: "",
        dureeEnMois: "",
        dateDebut: "",
        objet: "",
        notes: ""
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Erreur lors de la création du crédit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau crédit bancaire</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="banque">Banque *</Label>
            <Select value={formData.banqueId} onValueChange={(value) => setFormData({...formData, banqueId: value})}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingBanques ? "Chargement..." : "Sélectionner une banque"} />
              </SelectTrigger>
              <SelectContent>
                {banques.filter(b => b.actif).map(banque => (
                  <SelectItem key={banque.id} value={String(banque.id)}>{banque.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="montant">Montant emprunté (FCFA) *</Label>
            <Input
              id="montant"
              type="number"
              value={formData.montantEmprunte}
              onChange={(e) => setFormData({...formData, montantEmprunte: e.target.value})}
              placeholder="50 000 000"
            />
          </div>

          {/* Mode de saisie */}
          <div className="space-y-2">
            <Label>Mode de calcul</Label>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "taux" | "mensualite")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mensualite" className="text-xs">
                  <Calculator className="h-3 w-3 mr-1" />
                  Saisir mensualité
                </TabsTrigger>
                <TabsTrigger value="taux" className="text-xs">
                  <Percent className="h-3 w-3 mr-1" />
                  Saisir taux
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duree">Durée (mois) *</Label>
              <Input
                id="duree"
                type="number"
                value={formData.dureeEnMois}
                onChange={(e) => setFormData({...formData, dureeEnMois: e.target.value})}
                placeholder="36"
              />
            </div>
            
            {mode === "mensualite" ? (
              <div className="space-y-2">
                <Label htmlFor="mensualite">Mensualité (FCFA) *</Label>
                <Input
                  id="mensualite"
                  type="number"
                  value={formData.mensualite}
                  onChange={(e) => setFormData({...formData, mensualite: e.target.value})}
                  placeholder="1 500 000"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="taux">Taux d'intérêt (% annuel) *</Label>
                <Input
                  id="taux"
                  type="number"
                  step="0.1"
                  value={formData.tauxInteret}
                  onChange={(e) => setFormData({...formData, tauxInteret: e.target.value})}
                  placeholder="8.5"
                />
              </div>
            )}
          </div>

          {/* Affichage du calcul automatique */}
          {(calculs.tauxCalcule || calculs.mensualiteCalculee) && (
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">
                  {mode === "mensualite" 
                    ? `Taux calculé: ${calculs.tauxCalcule}% annuel`
                    : `Mensualité calculée: ${calculs.mensualiteCalculee?.toLocaleString('fr-FR')} FCFA`
                  }
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dateDebut">Date de début *</Label>
            <Input
              id="dateDebut"
              type="date"
              value={formData.dateDebut}
              onChange={(e) => setFormData({...formData, dateDebut: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objet">Objet du crédit *</Label>
            <Input
              id="objet"
              value={formData.objet}
              onChange={(e) => setFormData({...formData, objet: e.target.value})}
              placeholder="Acquisition de matériel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Notes additionnelles..."
              rows={2}
            />
          </div>

          {/* Récapitulatif */}
          {totalInterets !== null && totalInterets > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Récapitulatif</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Mensualité</span>
                  <p className="font-semibold text-primary">
                    {mode === "mensualite" 
                      ? parseFloat(formData.mensualite || "0").toLocaleString('fr-FR')
                      : calculs.mensualiteCalculee?.toLocaleString('fr-FR')
                    } FCFA
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Total intérêts</span>
                  <p className="font-semibold text-orange-600">{totalInterets.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Coût total</span>
                  <p className="font-semibold">
                    {(parseFloat(formData.montantEmprunte || "0") + totalInterets).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createCredit.isPending}>
              {createCredit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le crédit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
