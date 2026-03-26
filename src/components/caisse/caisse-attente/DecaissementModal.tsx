import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Wallet, Coins, Loader2, AlertTriangle } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { toast } from "sonner";
import api from "@/lib/api";
import { PrimeEnAttente } from "./types";

interface DecaissementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prime: PrimeEnAttente | null;
}

export function DecaissementModal({ open, onOpenChange, prime }: DecaissementModalProps) {
  const queryClient = useQueryClient();
  const [modePaiement, setModePaiement] = useState("Espèces");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [categorie, setCategorie] = useState("");
  const [montantDecaisse, setMontantDecaisse] = useState("");
  const [paiementPartiel, setPaiementPartiel] = useState(false);

  // Charger les catégories de dépenses
  const { data: categoriesData } = useQuery({
    queryKey: ['categories-depenses', { type: 'Sortie', actif: true }],
    queryFn: async () => {
      const response = await api.get('/categories-depenses', { params: { type: 'Sortie', actif: true } });
      return response.data;
    },
    enabled: open,
  });

  const categories = categoriesData?.data || [];

  // Pré-remplir quand la prime change
  useEffect(() => {
    if (prime && open) {
      setMontantDecaisse(String(prime.montant));
      setPaiementPartiel(false);
      // Pré-remplir catégorie selon la source
      const defaultCat = prime.source === 'GARAGE' ? 'Achats Garage' :
        prime.source === 'GARAGE_PRIME' ? 'Primes Garage' :
        prime.source === 'HORSLBV' ? 'Primes Hors Libreville' :
        prime.source === 'CNV' ? 'Primes Conventionnel' :
        prime.source === 'PRIME_REP' ? 'Prime représentant' :
        prime.source === 'PRIME_TRANS' ? 'Prime transitaire' : 'Primes OPS';
      setCategorie(defaultCat);
      // Pré-remplir notes
      const autoNotes = [
        prime.type && `Type: ${prime.type}`,
        prime.numero_paiement && `N°: ${prime.numero_paiement}`,
        prime.camion_plaque && `Camion: ${prime.camion_plaque}`,
        prime.parc && `Parc: ${prime.parc}`,
      ].filter(Boolean).join(' | ');
      setNotes(autoNotes);
    }
  }, [prime, open]);

  const mutation = useMutation({
    mutationFn: async ({ primeId, source }: { primeId: string; source: string }) => {
      const endpointMap: Record<string, string> = {
        CNV: `/caisse-cnv/${primeId}/decaisser`,
        HORSLBV: `/caisse-horslbv/${primeId}/decaisser`,
        GARAGE: `/caisse-garage/${primeId}/decaisser`,
        GARAGE_PRIME: `/caisse-garage/primes/${primeId}/decaisser`,
        OPS: `/caisse-en-attente/${primeId}/decaisser`,
        PRIME_REP: `/caisse-primes-rep/${primeId}/decaisser`,
        PRIME_TRANS: `/caisse-primes-trans/${primeId}/decaisser`,
      };
      const endpoint = endpointMap[source] || endpointMap.OPS;
      const montant = paiementPartiel ? parseFloat(montantDecaisse) : prime?.montant;
      const response = await api.post(endpoint, {
        mode_paiement: modePaiement,
        reference,
        notes,
        source,
        categorie,
        montant: montant,
        paiement_partiel: paiementPartiel,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Décaissement validé avec succès");
      queryClient.invalidateQueries({ queryKey: ['caisse-en-attente'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-cnv'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-horslbv'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-garage'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-garage-primes'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-primes-rep'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-primes-trans'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-en-attente-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-cnv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-horslbv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-garage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-primes-rep-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-primes-trans-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-mouvements'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-solde'] });
      queryClient.invalidateQueries({ queryKey: ['paiements-fournisseurs'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors du décaissement");
    },
  });

  const resetForm = () => {
    setModePaiement("Espèces");
    setReference("");
    setNotes("");
    setCategorie("");
    setMontantDecaisse("");
    setPaiementPartiel(false);
  };

  const handleConfirm = () => {
    if (!prime) return;
    const montant = parseFloat(montantDecaisse);
    if (isNaN(montant) || montant <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (montant > prime.montant) {
      toast.error("Le montant ne peut pas dépasser le montant total");
      return;
    }
    mutation.mutate({ primeId: prime.id, source: prime.source });
  };

  const montantNum = parseFloat(montantDecaisse) || 0;
  const reste = prime ? prime.montant - montantNum : 0;
  const sourceLabel = prime?.source === 'OPS' ? 'Conteneurs (OPS)' :
    prime?.source === 'CNV' ? 'Conventionnel (CNV)' :
    prime?.source === 'HORSLBV' ? 'Hors Libreville' :
    prime?.source === 'GARAGE' ? 'Garage' :
    prime?.source === 'GARAGE_PRIME' ? 'Prime Garage' :
    prime?.source === 'PRIME_REP' ? 'Prime Représentant' :
    prime?.source === 'PRIME_TRANS' ? 'Prime Transitaire' : '-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Valider le décaissement
          </DialogTitle>
          <DialogDescription>
            Formulaire pré-rempli. Modifiez les champs si nécessaire.
          </DialogDescription>
        </DialogHeader>

        {prime && (
          <div className="space-y-4 py-2">
            {/* Résumé de l'opération */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Source:</span>
                <Badge variant="secondary">{sourceLabel}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant total:</span>
                <span className="font-semibold text-lg">{formatMontant(prime.montant)}</span>
              </div>
              {prime.type && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="capitalize">{prime.type}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bénéficiaire:</span>
                <span className="font-medium">{prime.beneficiaire || '-'}</span>
              </div>
              {prime.numero_paiement && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">N° Paiement:</span>
                  <span className="font-medium font-mono">{prime.numero_paiement}</span>
                </div>
              )}
            </div>

            {/* Paiement partiel toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Paiement partiel (avance)</Label>
                <p className="text-xs text-muted-foreground">Payer une partie du montant uniquement</p>
              </div>
              <Switch checked={paiementPartiel} onCheckedChange={setPaiementPartiel} />
            </div>

            {/* Montant à décaisser */}
            <div className="space-y-2">
              <Label>Montant à décaisser *</Label>
              <Input
                type="number"
                value={montantDecaisse}
                onChange={(e) => setMontantDecaisse(e.target.value)}
                disabled={!paiementPartiel}
                min={0}
                max={prime.montant}
                step={100}
              />
              {paiementPartiel && montantNum > 0 && montantNum < prime.montant && (
                <div className="flex items-center gap-2 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Reste à payer: {formatMontant(reste)}
                </div>
              )}
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label>Catégorie de dépense *</Label>
              <Select value={categorie} onValueChange={setCategorie}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                <SelectContent>
                  {/* Catégories par défaut */}
                  <SelectItem value="Primes OPS">Primes OPS</SelectItem>
                  <SelectItem value="Primes Conventionnel">Primes Conventionnel</SelectItem>
                  <SelectItem value="Primes Hors Libreville">Primes Hors Libreville</SelectItem>
                  <SelectItem value="Achats Garage">Achats Garage</SelectItem>
                  <SelectItem value="Prime représentant">Prime représentant</SelectItem>
                  <SelectItem value="Prime transitaire">Prime transitaire</SelectItem>
                  {/* Catégories personnalisées */}
                  {categories
                    .filter((c: any) => !['Primes OPS', 'Primes Conventionnel', 'Primes Hors Libreville', 'Achats Garage'].includes(c.nom))
                    .map((c: any) => (
                      <SelectItem key={c.id} value={c.nom}>{c.nom}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Mode de paiement */}
            <div className="space-y-2">
              <Label>Mode de paiement *</Label>
              <Select value={modePaiement} onValueChange={setModePaiement}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="Virement">Virement</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Référence */}
            <div className="space-y-2">
              <Label>Référence (optionnel)</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="N° chèque, référence virement..."
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes supplémentaires..."
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={mutation.isPending || !categorie || montantNum <= 0}
            className="gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Coins className="h-4 w-4" />
            )}
            {paiementPartiel ? `Décaisser ${formatMontant(montantNum)}` : 'Confirmer le décaissement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
