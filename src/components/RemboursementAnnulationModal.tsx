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
import { useRembourserAnnulation } from "@/hooks/use-annulations";
import { formatMontant } from "@/data/mockData";
import type { Annulation } from "@/lib/api/annulations";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface RemboursementAnnulationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annulation: Annulation | null;
}

export function RemboursementAnnulationModal({
  open,
  onOpenChange,
  annulation,
}: RemboursementAnnulationModalProps) {
  const [formData, setFormData] = useState({
    montant: 0,
    mode_paiement: "especes",
    banque_id: "",
    reference: "",
    notes: "",
  });

  const rembourser = useRembourserAnnulation();

  // Charger les banques
  const { data: banquesData } = useQuery({
    queryKey: ['banques'],
    queryFn: async () => {
      const res = await api.get('/banques');
      return res.data;
    },
  });

  const banques = banquesData?.data || [];

  useEffect(() => {
    if (annulation) {
      setFormData({
        montant: annulation.montant,
        mode_paiement: "especes",
        banque_id: "",
        reference: "",
        notes: "",
      });
    }
  }, [annulation]);

  const handleSubmit = () => {
    if (!annulation) return;

    rembourser.mutate(
      {
        annulationId: annulation.id,
        data: {
          montant: formData.montant,
          mode_paiement: formData.mode_paiement,
          banque_id: formData.banque_id ? Number(formData.banque_id) : undefined,
          reference: formData.reference || undefined,
          notes: formData.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!annulation) return null;

  const needsBanque = formData.mode_paiement === "virement" || formData.mode_paiement === "cheque";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rembourser le client</DialogTitle>
          <DialogDescription>
            Annulation {annulation.numero} - {annulation.client?.nom}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Récapitulatif */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Document annulé</span>
              <span className="font-medium">{annulation.document_numero}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant de l'annulation</span>
              <span className="font-bold text-destructive">{formatMontant(annulation.montant)}</span>
            </div>
          </div>

          {/* Montant à rembourser */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant à rembourser (FCFA)</Label>
            <Input
              id="montant"
              type="number"
              value={formData.montant}
              onChange={(e) =>
                setFormData({ ...formData, montant: Number(e.target.value) })
              }
              max={annulation.montant}
              min={0}
            />
            {formData.montant > annulation.montant && (
              <p className="text-sm text-destructive">
                Le montant ne peut pas dépasser {formatMontant(annulation.montant)}
              </p>
            )}
          </div>

          {/* Mode de paiement */}
          <div className="space-y-2">
            <Label>Mode de remboursement</Label>
            <Select
              value={formData.mode_paiement}
              onValueChange={(v) => setFormData({ ...formData, mode_paiement: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="virement">Virement</SelectItem>
                <SelectItem value="carte">Carte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Banque (si virement ou chèque) */}
          {needsBanque && (
            <div className="space-y-2">
              <Label>Banque source</Label>
              <Select
                value={formData.banque_id}
                onValueChange={(v) => setFormData({ ...formData, banque_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une banque" />
                </SelectTrigger>
                <SelectContent>
                  {banques.map((banque: any) => (
                    <SelectItem key={banque.id} value={String(banque.id)}>
                      {banque.nom} ({formatMontant(banque.solde)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Référence */}
          <div className="space-y-2">
            <Label htmlFor="reference">Référence (optionnel)</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="N° de chèque, référence virement..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Commentaires sur le remboursement..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              rembourser.isPending ||
              formData.montant <= 0 ||
              formData.montant > annulation.montant ||
              (needsBanque && !formData.banque_id)
            }
          >
            {rembourser.isPending ? "Traitement..." : "Rembourser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
