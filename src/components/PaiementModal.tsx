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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wallet, Banknote, CreditCard, Building2, Smartphone, Gift, AlertCircle } from "lucide-react";
import { useCreatePaiement, useBanques } from "@/hooks/use-commercial";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAvoirsClient, utiliserAvoir, Annulation } from "@/lib/api/annulations";
import { toast } from "sonner";

interface PaiementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: "ordre" | "facture" | "note_debut";
  documentId: string;
  documentNumero: string;
  montantRestant: number;
  clientId?: number;
  onSuccess?: () => void;
}

type ModePaiement = "Espèces" | "Chèque" | "Virement" | "Mobile Money" | "Avoir";

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export function PaiementModal({
  open,
  onOpenChange,
  documentType,
  documentId,
  documentNumero,
  montantRestant,
  clientId,
  onSuccess,
}: PaiementModalProps) {
  const [montant, setMontant] = useState<number>(montantRestant);
  const [modePaiement, setModePaiement] = useState<ModePaiement>("Espèces");
  const [banqueId, setBanqueId] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAvoirId, setSelectedAvoirId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { data: banques = [], isLoading: isLoadingBanques } = useBanques();
  const createPaiement = useCreatePaiement();

  // Fetch client's available avoirs
  const { data: avoirsData, isLoading: isLoadingAvoirs } = useQuery({
    queryKey: ['avoirs-client', clientId],
    queryFn: () => getAvoirsClient(clientId!),
    enabled: !!clientId && open,
  });

  const availableAvoirs = (avoirsData?.avoirs || []).filter(
    (avoir: Annulation) => avoir.solde_avoir > 0
  );
  const totalAvoirsDisponibles = availableAvoirs.reduce(
    (sum: number, avoir: Annulation) => sum + avoir.solde_avoir, 
    0
  );

  // Mutation to use avoir
  const useAvoirMutation = useMutation({
    mutationFn: ({
      avoirId,
      payload,
    }: {
      avoirId: number;
      payload: { facture_id?: number; ordre_id?: number; montant: number };
    }) => utiliserAvoir(avoirId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['ordres'] });
      queryClient.invalidateQueries({ queryKey: ['avoirs-client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Paiement par avoir enregistré avec succès");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors du paiement par avoir");
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setMontant(montantRestant);
      setModePaiement("Espèces");
      setBanqueId("");
      setReference("");
      setNotes("");
      setSelectedAvoirId(null);
    }
  }, [open, montantRestant]);

  // When switching to Avoir mode, pre-select the first available avoir
  useEffect(() => {
    if (modePaiement === "Avoir" && availableAvoirs.length > 0 && !selectedAvoirId) {
      setSelectedAvoirId(availableAvoirs[0].id);
      // Set montant to min of avoir solde and montant restant
      const maxFromAvoir = Math.min(availableAvoirs[0].solde_avoir, montantRestant);
      setMontant(maxFromAvoir);
    }
  }, [modePaiement, availableAvoirs, selectedAvoirId, montantRestant]);

  // Update montant when selecting a different avoir
  const handleAvoirChange = (avoirId: string) => {
    const id = parseInt(avoirId);
    setSelectedAvoirId(id);
    const avoir = availableAvoirs.find((a: Annulation) => a.id === id);
    if (avoir) {
      setMontant(Math.min(avoir.solde_avoir, montantRestant));
    }
  };

  const selectedAvoir = availableAvoirs.find((a: Annulation) => a.id === selectedAvoirId);
  const maxMontantAvoir = selectedAvoir ? Math.min(selectedAvoir.solde_avoir, montantRestant) : montantRestant;

  const handleSubmit = async () => {
    if (montant <= 0 || montant > montantRestant) {
      return;
    }

    if (modePaiement === "Avoir") {
      if (!selectedAvoirId) {
        toast.error("Veuillez sélectionner un avoir");
        return;
      }
      if (montant > (selectedAvoir?.solde_avoir || 0)) {
        toast.error("Le montant dépasse le solde de l'avoir");
        return;
      }

      const docId = parseInt(documentId);

      useAvoirMutation.mutate({
        avoirId: selectedAvoirId,
        payload:
          documentType === 'facture'
            ? { facture_id: docId, montant }
            : { ordre_id: docId, montant },
      });
    } else {
      const docId = parseInt(documentId);
      const paiementData = {
        montant,
        mode_paiement: modePaiement,
        banque_id: (modePaiement === "Chèque" || modePaiement === "Virement") && banqueId ? parseInt(banqueId) : undefined,
        reference: reference || undefined,
        notes: notes || undefined,
        ...(documentType === "facture" 
          ? { facture_id: docId } 
          : documentType === "ordre" 
            ? { ordre_id: docId } 
            : { note_debut_id: docId }),
      };

      createPaiement.mutate(paiementData, {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      });
    }
  };

  const activeBanques = (banques || []).filter(b => Boolean(b.actif));
  const isLoading = createPaiement.isPending || useAvoirMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Enregistrer un paiement
          </DialogTitle>
          <DialogDescription>
            {documentType === "facture" ? "Facture" : "Ordre"} <strong>{documentNumero}</strong>
            <br />
            Reste à payer: <strong className="text-primary">{formatMontant(montantRestant)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avoirs disponibles section */}
          {clientId && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800 dark:text-amber-400">Avoirs disponibles</span>
              </div>
              {isLoadingAvoirs ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : availableAvoirs.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {availableAvoirs.length} avoir(s) disponible(s) pour un total de{" "}
                    <strong>{formatMontant(totalAvoirsDisponibles)}</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableAvoirs.map((avoir: Annulation) => (
                      <Badge 
                        key={avoir.id} 
                        variant="outline" 
                        className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300"
                      >
                        {avoir.numero_avoir}: {formatMontant(avoir.solde_avoir)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Aucun avoir disponible pour ce client
                </p>
              )}
            </div>
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant du paiement (FCFA)</Label>
            <Input
              id="montant"
              type="number"
              value={montant || ""}
              onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
              className="text-right text-lg font-semibold"
              max={modePaiement === "Avoir" ? maxMontantAvoir : montantRestant}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs"
                onClick={() => setMontant(modePaiement === "Avoir" ? maxMontantAvoir : montantRestant)}
              >
                {modePaiement === "Avoir" 
                  ? `Maximum de l'avoir (${formatMontant(maxMontantAvoir)})`
                  : `Payer la totalité (${formatMontant(montantRestant)})`
                }
              </Button>
            </div>
          </div>

          {/* Mode de paiement */}
          <div className="space-y-3">
            <Label>Mode de paiement</Label>
            <RadioGroup value={modePaiement} onValueChange={(v) => setModePaiement(v as ModePaiement)}>
              {/* Avoir option - only for factures with available avoirs */}
              {documentType === "facture" && availableAvoirs.length > 0 && (
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 cursor-pointer">
                  <RadioGroupItem value="Avoir" id="avoir" />
                  <Label htmlFor="avoir" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Gift className="h-4 w-4 text-amber-600" />
                    <span>Utiliser un avoir</span>
                    <Badge variant="secondary" className="ml-auto bg-amber-200 text-amber-800">
                      {formatMontant(totalAvoirsDisponibles)}
                    </Badge>
                  </Label>
                </div>
              )}

              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="Espèces" id="especes" />
                <Label htmlFor="especes" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-4 w-4 text-green-600" />
                  Espèces
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="Chèque" id="cheque" />
                <Label htmlFor="cheque" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  Chèque
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="Virement" id="virement" />
                <Label htmlFor="virement" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  Virement bancaire
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="Mobile Money" id="mobile" />
                <Label htmlFor="mobile" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="h-4 w-4 text-orange-600" />
                  Mobile Money
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Avoir selection */}
          {modePaiement === "Avoir" && availableAvoirs.length > 0 && (
            <div className="space-y-4 pt-2 border-t">
              <div className="space-y-2">
                <Label>Sélectionner l'avoir</Label>
                <Select value={selectedAvoirId?.toString() || ""} onValueChange={handleAvoirChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un avoir" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAvoirs.map((avoir: Annulation) => (
                      <SelectItem key={avoir.id} value={avoir.id.toString()}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{avoir.numero_avoir}</span>
                          <span className="text-muted-foreground">
                            Solde: {formatMontant(avoir.solde_avoir)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAvoir && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p><strong>Avoir:</strong> {selectedAvoir.numero_avoir}</p>
                  <p><strong>Document annulé:</strong> {selectedAvoir.document_numero}</p>
                  <p><strong>Solde disponible:</strong> {formatMontant(selectedAvoir.solde_avoir)}</p>
                  {montant > selectedAvoir.solde_avoir && (
                    <p className="text-destructive mt-2 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Le montant dépasse le solde de l'avoir
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Champs conditionnels pour banque */}
          {(modePaiement === "Chèque" || modePaiement === "Virement") && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Banque</Label>
                <Select value={banqueId} onValueChange={setBanqueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une banque" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingBanques ? (
                      <SelectItem value="loading" disabled>Chargement...</SelectItem>
                    ) : activeBanques.length === 0 ? (
                      <SelectItem value="empty" disabled>Aucune banque disponible</SelectItem>
                    ) : (
                      activeBanques.map((banque) => (
                        <SelectItem key={String(banque.id)} value={String(banque.id)}>
                          {banque.nom} {banque.numero_compte ? `(${banque.numero_compte})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">
                  {modePaiement === "Chèque" ? "Numéro de chèque" : "Référence du virement"}
                </Label>
                <Input
                  id="reference"
                  placeholder={modePaiement === "Chèque" ? "Ex: CHQ-123456" : "Ex: VIR-2026-001"}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          {/* Référence Mobile Money */}
          {modePaiement === "Mobile Money" && (
            <div className="space-y-2">
              <Label htmlFor="reference">Référence de la transaction</Label>
              <Input
                id="reference"
                placeholder="Ex: MM-123456789"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="font-mono"
              />
            </div>
          )}

          {/* Notes - hide for Avoir */}
          {modePaiement !== "Avoir" && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Notes sur ce paiement..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              isLoading || 
              montant <= 0 || 
              montant > montantRestant ||
              (modePaiement === "Avoir" && (!selectedAvoirId || montant > (selectedAvoir?.solde_avoir || 0)))
            } 
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                {modePaiement === "Avoir" ? <Gift className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                {modePaiement === "Avoir" ? "Utiliser l'avoir" : "Enregistrer"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
