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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { primesApi } from "@/lib/api/commercial";
import { useBanques } from "@/hooks/use-commercial";
import { toast } from "sonner";
import { formatMontant } from "@/data/mockData";
import { Loader2, Printer } from "lucide-react";

// Type générique pour les primes
interface PrimeGeneric {
  id: string | number;
  montant: number;
  montant_paye?: number;
  reste_a_payer?: number;
  statut?: string;
  ordre?: { numero: string };
  facture?: { numero: string };
  description?: string;
  [key: string]: any;
}

interface PaiementPrimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partenaireNom: string;
  partenaireType: "transitaire" | "representant";
  primes: PrimeGeneric[];
  total: number;
  onSuccess?: () => void;
}

export function PaiementPrimeModal({ 
  open, 
  onOpenChange, 
  partenaireNom,
  partenaireType,
  primes,
  total,
  onSuccess,
}: PaiementPrimeModalProps) {
  const queryClient = useQueryClient();
  const { data: banques = [] } = useBanques();
  
  const [formData, setFormData] = useState({
    modePaiement: "Espèces",
    banqueId: "",
    reference: "",
    notes: "",
    date: new Date().toISOString().split('T')[0],
  });
  const [isPaying, setIsPaying] = useState(false);
  const [paiementSuccess, setPaiementSuccess] = useState<{
    montant: number;
    primes: PrimeGeneric[];
    date: string;
    reference?: string;
  } | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setFormData({
        modePaiement: "Espèces",
        banqueId: "",
        reference: "",
        notes: "",
        date: new Date().toISOString().split('T')[0],
      });
      setPaiementSuccess(null);
    }
  }, [open]);

  const activeBanques = banques.filter(b => b.actif);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.modePaiement) {
      toast.error("Veuillez sélectionner un mode de paiement");
      return;
    }

    if ((formData.modePaiement === "Chèque" || formData.modePaiement === "Virement") && !formData.banqueId) {
      toast.error("Veuillez sélectionner une banque");
      return;
    }

    setIsPaying(true);

    try {
      // Payer chaque prime séquentiellement
      for (const prime of primes) {
        const resteAPayer = prime.reste_a_payer ?? (prime.montant - (prime.montant_paye || 0));
        if (resteAPayer > 0) {
          await primesApi.payer(String(prime.id), {
            montant: resteAPayer,
            mode_paiement: formData.modePaiement,
            reference: formData.reference || undefined,
            notes: formData.notes || undefined,
          });
        }
      }

      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['transitaires'] });
      queryClient.invalidateQueries({ queryKey: ['representants'] });
      queryClient.invalidateQueries({ queryKey: ['primes'] });
      queryClient.invalidateQueries({ queryKey: ['caisse'] });

      // Afficher le récap pour impression
      setPaiementSuccess({
        montant: total,
        primes: primes,
        date: formData.date,
        reference: formData.reference,
      });

      toast.success(`Paiement de ${formatMontant(total)} effectué avec succès`);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors du paiement");
    } finally {
      setIsPaying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    onOpenChange(false);
    setPaiementSuccess(null);
  };

  // Affichage du récap après paiement
  if (paiementSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] print:shadow-none print:border-none">
          <DialogHeader>
            <DialogTitle className="text-green-600">✓ Paiement effectué</DialogTitle>
            <DialogDescription>Récapitulatif du paiement</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 print:py-8">
            {/* En-tête récap */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg">{partenaireNom}</h3>
              <p className="text-sm text-muted-foreground">
                {partenaireType === "transitaire" ? "Transitaire" : "Représentant"}
              </p>
            </div>

            {/* Détails */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>
                <span className="ml-2 font-medium">{new Date(paiementSuccess.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mode:</span>
                <span className="ml-2 font-medium">{formData.modePaiement}</span>
              </div>
              {paiementSuccess.reference && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Référence:</span>
                  <span className="ml-2 font-medium">{paiementSuccess.reference}</span>
                </div>
              )}
            </div>

            {/* Liste des primes payées */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Document</th>
                    <th className="text-right p-2">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {paiementSuccess.primes.map((prime) => (
                    <tr key={prime.id} className="border-t">
                      <td className="p-2">
                        {prime.ordre?.numero || prime.facture?.numero || prime.description || `Prime #${prime.id}`}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {formatMontant(prime.reste_a_payer ?? prime.montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 font-semibold">
                  <tr className="border-t">
                    <td className="p-2">Total payé</td>
                    <td className="p-2 text-right text-primary font-mono">
                      {formatMontant(paiementSuccess.montant)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <Button onClick={handleClose}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Paiement de primes</DialogTitle>
          <DialogDescription>
            Paiement pour {partenaireNom} ({partenaireType === "transitaire" ? "Transitaire" : "Représentant"})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Récapitulatif */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {primes.length} prime(s) sélectionnée(s)
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatMontant(total)}
                </span>
              </div>
              {primes.length > 0 && primes.length <= 5 && (
                <div className="mt-2 space-y-1">
                  {primes.map((prime) => (
                    <div key={prime.id} className="text-xs text-muted-foreground flex justify-between">
                      <span>{prime.ordre?.numero || prime.facture?.numero || prime.description || `#${prime.id}`}</span>
                      <span>{formatMontant(prime.reste_a_payer ?? prime.montant)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date du paiement</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="modePaiement">Mode de paiement *</Label>
              <Select
                value={formData.modePaiement}
                onValueChange={(value) => setFormData({ ...formData, modePaiement: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="Virement">Virement bancaire</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Banque pour chèque/virement */}
            {(formData.modePaiement === "Chèque" || formData.modePaiement === "Virement") && (
              <div className="grid gap-2">
                <Label>Banque *</Label>
                <Select
                  value={formData.banqueId}
                  onValueChange={(value) => setFormData({ ...formData, banqueId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une banque" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBanques.map((banque) => (
                      <SelectItem key={banque.id} value={banque.id}>
                        {banque.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="reference">
                {formData.modePaiement === "Chèque" ? "Numéro de chèque" : "Référence"}
              </Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder={formData.modePaiement === "Chèque" ? "CHQ-XXXXXX" : "Référence optionnelle"}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPaying}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPaying || primes.length === 0}>
              {isPaying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Paiement en cours...
                </>
              ) : (
                "Confirmer le paiement"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
