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
import { ArrowDownCircle, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBanques, useCreateMouvementCaisse } from "@/hooks/use-commercial";
import { formatMontant } from "@/data/mockData";

interface EntreeBancaireModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banqueId?: string;
  onSuccess?: () => void;
}

export function EntreeBancaireModal({
  open,
  onOpenChange,
  banqueId: initialBanqueId,
  onSuccess,
}: EntreeBancaireModalProps) {
  const { toast } = useToast();
  const [montant, setMontant] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [banqueId, setBanqueId] = useState(initialBanqueId || "");
  const [beneficiaire, setBeneficiaire] = useState("");

  const { data: banques = [], isLoading: banquesLoading } = useBanques({ actif: true });
  const createMouvement = useCreateMouvementCaisse();

  const selectedBanque = banques.find(b => b.id === banqueId);

  const handleSubmit = async () => {
    if (montant <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être supérieur à 0.",
        variant: "destructive",
      });
      return;
    }

    if (!banqueId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une banque.",
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
        source: 'banque',
        montant,
        description,
        categorie: 'Entrée bancaire',
        banque_id: banqueId,
        beneficiaire: beneficiaire || undefined,
      });

      toast({
        title: "Entrée enregistrée",
        description: `Entrée de ${formatMontant(montant)} (${selectedBanque?.nom}) enregistrée.`,
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
          <DialogTitle className="flex items-center gap-2 text-success">
            <ArrowDownCircle className="h-5 w-5" />
            Entrée bancaire (Encaissement)
          </DialogTitle>
          <DialogDescription>
            Enregistrer une entrée bancaire (virement reçu, versement, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sélection banque */}
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
                Solde actuel: {formatMontant(selectedBanque.solde || 0)}
              </p>
            )}
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant-entree">Montant (FCFA) *</Label>
            <Input
              id="montant-entree"
              type="number"
              value={montant || ""}
              onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
              className="text-right text-lg font-semibold"
              placeholder="0"
            />
          </div>

          {/* Bénéficiaire / Source */}
          <div className="space-y-2">
            <Label htmlFor="beneficiaire-entree">Source / Provenance</Label>
            <Input
              id="beneficiaire-entree"
              placeholder="Ex: Client X, Virement reçu..."
              value={beneficiaire}
              onChange={(e) => setBeneficiaire(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description-entree">Description *</Label>
            <Textarea
              id="description-entree"
              placeholder="Ex: Virement client, Versement espèces..."
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
