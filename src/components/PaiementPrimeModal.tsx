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
import { useQueryClient } from "@tanstack/react-query";
import { primesApi } from "@/lib/api/commercial";
import { toast } from "sonner";
import { formatMontant } from "@/data/mockData";
import { Loader2, Printer, FileText } from "lucide-react";

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

  const [formData, setFormData] = useState({
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [isPaying, setIsPaying] = useState(false);
  const [paiementSuccess, setPaiementSuccess] = useState<{
    montant: number;
    primes: PrimeGeneric[];
    date: string;
    numeroRecu?: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
      setPaiementSuccess(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);
    let lastNumeroRecu: string | undefined;

    try {
      for (const prime of primes) {
        const resteAPayer = prime.reste_a_payer ?? prime.montant - (prime.montant_paye || 0);
        if (resteAPayer > 0) {
          const response = await primesApi.payer(String(prime.id), {
            montant: resteAPayer,
            notes: formData.notes || undefined,
          } as any);
          if (response?.numero_recu) lastNumeroRecu = response.numero_recu;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["transitaires"] });
      queryClient.invalidateQueries({ queryKey: ["representants"] });
      queryClient.invalidateQueries({ queryKey: ["primes"] });
      queryClient.invalidateQueries({ queryKey: ["caisse"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-primes-rep"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-primes-rep-stats"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-primes-trans"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-primes-trans-stats"] });

      setPaiementSuccess({
        montant: total,
        primes,
        date: formData.date,
        numeroRecu: lastNumeroRecu,
      });

      toast.success(`Prime validée (${formatMontant(total)}) — en attente de décaissement par la caisse`);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la validation");
    } finally {
      setIsPaying(false);
    }
  };

  const handlePrint = () => window.print();

  const handleOpenPDF = () => {
    if (!paiementSuccess) return;
    const primesData = paiementSuccess.primes.map((p) => ({
      numero: p.ordre?.numero || p.facture?.numero || p.description || `Prime #${p.id}`,
      montant: p.reste_a_payer ?? p.montant,
    }));
    const params = new URLSearchParams({
      montant: String(paiementSuccess.montant),
      mode: "À définir",
      date: paiementSuccess.date,
      beneficiaire: partenaireNom,
      type: partenaireType,
      numero_recu: paiementSuccess.numeroRecu || "",
      primes: encodeURIComponent(JSON.stringify(primesData)),
    });
    window.open(`/partenaires/recu-prime/new?${params.toString()}`, "_blank");
  };

  const handleClose = () => {
    onOpenChange(false);
    setPaiementSuccess(null);
  };

  if (paiementSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] print:shadow-none print:border-none">
          <DialogHeader>
            <DialogTitle className="text-green-600">✓ Prime validée</DialogTitle>
            <DialogDescription>
              {paiementSuccess.numeroRecu ? (
                <span className="text-primary font-semibold">{paiementSuccess.numeroRecu}</span>
              ) : (
                "Récapitulatif de validation — en attente de décaissement par la caisse"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 print:py-8">
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg">{partenaireNom}</h3>
              <p className="text-sm text-muted-foreground">
                {partenaireType === "transitaire" ? "Transitaire" : "Représentant"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(paiementSuccess.date).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>

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
                    <td className="p-2">Total validé</td>
                    <td className="p-2 text-right text-primary font-mono">
                      {formatMontant(paiementSuccess.montant)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <DialogFooter className="print:hidden gap-2">
            <Button variant="outline" onClick={handleOpenPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              Voir PDF
            </Button>
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
          <DialogTitle>Validation de primes</DialogTitle>
          <DialogDescription>
            Validation pour {partenaireNom} ({partenaireType === "transitaire" ? "Transitaire" : "Représentant"}).
            Le mode de paiement sera renseigné lors du décaissement par la caisse.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {primes.length} prime(s) sélectionnée(s)
                </span>
                <span className="text-xl font-bold text-primary">{formatMontant(total)}</span>
              </div>
              {primes.length > 0 && primes.length <= 5 && (
                <div className="mt-2 space-y-1">
                  {primes.map((prime) => (
                    <div key={prime.id} className="text-xs text-muted-foreground flex justify-between">
                      <span>
                        {prime.ordre?.numero || prime.facture?.numero || prime.description || `#${prime.id}`}
                      </span>
                      <span>{formatMontant(prime.reste_a_payer ?? prime.montant)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date de validation</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                  Validation en cours...
                </>
              ) : (
                "Confirmer la validation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
