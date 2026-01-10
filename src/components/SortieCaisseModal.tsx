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
import { ArrowUpCircle, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBanques, useCreateMouvementCaisse, useCategoriesDepenses, useSoldeCaisse } from "@/hooks/use-commercial";
import { formatMontant } from "@/data/mockData";

interface SortieCaisseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "caisse" | "banque";
  banqueId?: string;
  onSuccess?: () => void;
}

export function SortieCaisseModal({
  open,
  onOpenChange,
  type,
  banqueId: initialBanqueId,
  onSuccess,
}: SortieCaisseModalProps) {
  const { toast } = useToast();
  const [montant, setMontant] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [banqueId, setBanqueId] = useState(initialBanqueId || "");
  const [reference, setReference] = useState("");
  const [categorie, setCategorie] = useState("");
  const [beneficiaire, setBeneficiaire] = useState("");

  const { data: banques = [], isLoading: banquesLoading } = useBanques({ actif: true });
  const { data: categoriesData } = useCategoriesDepenses({ type: 'Sortie', actif: true });
  const { data: soldeData } = useSoldeCaisse();
  const createMouvement = useCreateMouvementCaisse();

  const categories = categoriesData?.data || [];
  const selectedBanque = banques.find(b => b.id === banqueId);
  const soldeCaisse = soldeData?.solde || 0;

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

    if (type === "banque" && !banqueId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une banque.",
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

    // Vérifier le solde
    if (type === "caisse" && montant > soldeCaisse) {
      toast({
        title: "Solde insuffisant",
        description: `Le solde de la caisse (${formatMontant(soldeCaisse)}) est insuffisant.`,
        variant: "destructive",
      });
      return;
    }

    if (type === "banque" && selectedBanque && montant > (selectedBanque.solde || 0)) {
      toast({
        title: "Solde insuffisant",
        description: `Le solde de ${selectedBanque.nom} (${formatMontant(selectedBanque.solde || 0)}) est insuffisant.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await createMouvement.mutateAsync({
        type: 'Sortie',
        source: type,
        montant,
        description,
        categorie,
        banque_id: type === "banque" ? banqueId : undefined,
        beneficiaire: beneficiaire || undefined,
      });

      const banque = type === "banque" ? selectedBanque : null;

      toast({
        title: "Sortie enregistrée",
        description: `Sortie de ${formatMontant(montant)} ${type === "banque" ? `(${banque?.nom})` : "(Caisse)"} enregistrée.`,
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
    setReference("");
    setCategorie("");
    setBeneficiaire("");
    if (!initialBanqueId) {
      setBanqueId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ArrowUpCircle className="h-5 w-5" />
            Sortie {type === "caisse" ? "de caisse" : "bancaire"}
          </DialogTitle>
          <DialogDescription>
            Enregistrer une sortie {type === "caisse" ? "d'espèces" : "bancaire"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sélection banque si type banque */}
          {type === "banque" && (
            <div className="space-y-2">
              <Label>Compte bancaire *</Label>
              <Select value={banqueId} onValueChange={setBanqueId} disabled={!!initialBanqueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {banquesLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    banques.map((banque) => (
                      <SelectItem key={banque.id} value={banque.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {banque.nom} - {formatMontant(banque.solde || 0)}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedBanque && (
                <p className="text-xs text-muted-foreground">
                  Solde disponible: {formatMontant(selectedBanque.solde || 0)}
                </p>
              )}
            </div>
          )}

          {/* Solde caisse si type caisse */}
          {type === "caisse" && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Solde disponible en caisse: <span className="font-semibold text-foreground">{formatMontant(soldeCaisse)}</span>
              </p>
            </div>
          )}

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
                    Aucune catégorie disponible
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

          {/* Bénéficiaire */}
          <div className="space-y-2">
            <Label htmlFor="beneficiaire">Bénéficiaire</Label>
            <Input
              id="beneficiaire"
              placeholder="Nom du bénéficiaire"
              value={beneficiaire}
              onChange={(e) => setBeneficiaire(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Ex: Achat fournitures bureau, Paiement fournisseur..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Référence (optionnel pour banque) */}
          {type === "banque" && (
            <div className="space-y-2">
              <Label htmlFor="reference">Référence (optionnel)</Label>
              <Input
                id="reference"
                placeholder="Ex: VIR-OUT-001, CHQ-789..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="font-mono"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMouvement.isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMouvement.isPending}
            className="gap-2 bg-destructive hover:bg-destructive/90"
          >
            {createMouvement.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <ArrowUpCircle className="h-4 w-4" />
                Enregistrer la sortie
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
