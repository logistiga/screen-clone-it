import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, Banknote, CreditCard, Building2, Receipt, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClients, useBanques, useFactures } from "@/hooks/use-commercial";
import { paiementsApi } from "@/lib/api/commercial";
import { formatMontant } from "@/data/mockData";

interface PaiementGlobalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type MethodePaiement = "Espèces" | "Chèque" | "Virement";

interface FactureSelectionne {
  id: string;
  numero: string;
  numeroOrdre?: string;
  clientId: string;
  montantRestant: number;
}

export function PaiementGlobalModal({
  open,
  onOpenChange,
  onSuccess,
}: PaiementGlobalModalProps) {
  const { toast } = useToast();
  const { data: clientsData } = useClients();
  const { data: banquesData } = useBanques();
  const { data: facturesData, refetch: refetchFactures } = useFactures({ per_page: 500 });
  
  const clients = clientsData?.data || [];
  const banques = banquesData || [];
  const factures = facturesData?.data || [];
  
  const [clientId, setClientId] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [montant, setMontant] = useState<number>(0);
  const [methode, setMethode] = useState<MethodePaiement>("Espèces");
  const [banqueId, setBanqueId] = useState<string>("");
  const [numeroCheque, setNumeroCheque] = useState("");
  const [reference, setReference] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setClientId("");
      setSelectedDocs([]);
      setMontant(0);
      setMethode("Espèces");
      setBanqueId("");
      setNumeroCheque("");
      setReference("");
    }
  }, [open]);

  // Récupérer les factures non soldées pour le client sélectionné
  const facturesClient = useMemo((): FactureSelectionne[] => {
    if (!clientId) return [];

    return factures
      .filter((f: any) => 
        f.client_id?.toString() === clientId && 
        f.statut !== "annulee" && 
        f.statut !== "payee" &&
        (f.montant_ttc - (f.montant_paye || 0)) > 0
      )
      .map((f: any) => ({
        id: f.id.toString(),
        numero: f.numero,
        numeroOrdre: f.ordre_travail?.numero || f.ordre?.numero,
        clientId: f.client_id?.toString(),
        montantRestant: f.montant_ttc - (f.montant_paye || 0),
      }));
  }, [clientId, factures]);

  const totalSelectionne = useMemo(() => {
    return facturesClient
      .filter((f) => selectedDocs.includes(f.id))
      .reduce((sum, f) => sum + f.montantRestant, 0);
  }, [facturesClient, selectedDocs]);

  const toggleDocument = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const selectAll = () => {
    setSelectedDocs(facturesClient.map((f) => f.id));
    setMontant(facturesClient.reduce((sum, f) => sum + f.montantRestant, 0));
  };

  const handleSubmit = async () => {
    if (selectedDocs.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins une facture.",
        variant: "destructive",
      });
      return;
    }

    if (montant <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être supérieur à 0.",
        variant: "destructive",
      });
      return;
    }

    if ((methode === "Chèque" || methode === "Virement") && !banqueId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une banque.",
        variant: "destructive",
      });
      return;
    }

    if (methode === "Chèque" && !numeroCheque) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le numéro de chèque.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Répartir le montant entre les factures sélectionnées
      const selectedFactures = facturesClient.filter((f) => selectedDocs.includes(f.id));
      let montantRestant = montant;
      const facturesRepartition: { id: string; montant: number }[] = [];

      for (const facture of selectedFactures) {
        if (montantRestant <= 0) break;
        const montantPourCeDoc = Math.min(montantRestant, facture.montantRestant);
        facturesRepartition.push({
          id: facture.id,
          montant: montantPourCeDoc,
        });
        montantRestant -= montantPourCeDoc;
      }

      await paiementsApi.createGlobal({
        client_id: clientId,
        montant,
        factures: facturesRepartition,
        mode_paiement: methode,
        reference: methode === "Chèque" ? numeroCheque : reference || undefined,
        banque_id: banqueId || undefined,
      });

      const client = clients.find((c: any) => c.id?.toString() === clientId);

      toast({
        title: "Paiement global enregistré",
        description: `Paiement de ${formatMontant(montant)} enregistré pour ${client?.nom} (${facturesRepartition.length} facture(s)).`,
      });

      refetchFactures();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'enregistrement du paiement.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Paiement global - Factures
          </DialogTitle>
          <DialogDescription>
            Enregistrer un paiement pour plusieurs factures d'un même client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sélection du client */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Select
              value={clientId}
              onValueChange={(v) => {
                setClientId(v);
                setSelectedDocs([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id?.toString()}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Liste des factures */}
          {clientId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Factures à payer</Label>
                {facturesClient.length > 0 && (
                  <Button variant="link" size="sm" onClick={selectAll} className="p-0 h-auto">
                    Tout sélectionner
                  </Button>
                )}
              </div>

              {facturesClient.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucune facture en attente de paiement pour ce client.
                </p>
              ) : (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {facturesClient.map((facture) => (
                    <div
                      key={facture.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleDocument(facture.id)}
                    >
                      <Checkbox
                        checked={selectedDocs.includes(facture.id)}
                        onCheckedChange={() => toggleDocument(facture.id)}
                      />
                      <div className="flex-1">
                        <span className="font-medium">{facture.numero}</span>
                        {facture.numeroOrdre && (
                          <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1 inline-flex">
                            <FileText className="h-3 w-3" />
                            OT: {facture.numeroOrdre}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-primary">
                        {formatMontant(facture.montantRestant)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedDocs.length > 0 && (
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">
                    {selectedDocs.length} facture(s) sélectionnée(s)
                  </span>
                  <span className="font-bold text-primary">
                    Total: {formatMontant(totalSelectionne)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Montant */}
          {selectedDocs.length > 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="montant">Montant du paiement (FCFA)</Label>
                <Input
                  id="montant"
                  type="number"
                  value={montant || ""}
                  onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
                  className="text-right text-lg font-semibold"
                />
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={() => setMontant(totalSelectionne)}
                >
                  Payer la totalité ({formatMontant(totalSelectionne)})
                </Button>
              </div>

              {/* Méthode de paiement */}
              <div className="space-y-3">
                <Label>Méthode de paiement</Label>
                <RadioGroup value={methode} onValueChange={(v) => setMethode(v as MethodePaiement)}>
                  <div className="grid grid-cols-3 gap-2">
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${methode === "Espèces" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                      onClick={() => setMethode("Espèces")}
                    >
                      <RadioGroupItem value="Espèces" id="g-especes" />
                      <Label htmlFor="g-especes" className="flex items-center gap-1 cursor-pointer text-sm">
                        <Banknote className="h-4 w-4 text-green-600" />
                        Espèces
                      </Label>
                    </div>
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${methode === "Chèque" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                      onClick={() => setMethode("Chèque")}
                    >
                      <RadioGroupItem value="Chèque" id="g-cheque" />
                      <Label htmlFor="g-cheque" className="flex items-center gap-1 cursor-pointer text-sm">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        Chèque
                      </Label>
                    </div>
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${methode === "Virement" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                      onClick={() => setMethode("Virement")}
                    >
                      <RadioGroupItem value="Virement" id="g-virement" />
                      <Label htmlFor="g-virement" className="flex items-center gap-1 cursor-pointer text-sm">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        Virement
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Champs bancaires */}
              {(methode === "Chèque" || methode === "Virement") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banque</Label>
                    <Select value={banqueId} onValueChange={setBanqueId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {(banques || []).filter((b: any) => b.actif).map((banque: any) => (
                          <SelectItem key={banque.id} value={banque.id?.toString()}>
                            {banque.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {methode === "Chèque" && (
                    <div className="space-y-2">
                      <Label htmlFor="g-numeroCheque">N° Chèque</Label>
                      <Input
                        id="g-numeroCheque"
                        placeholder="CHQ-123456"
                        value={numeroCheque}
                        onChange={(e) => setNumeroCheque(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  )}

                  {methode === "Virement" && (
                    <div className="space-y-2">
                      <Label htmlFor="g-reference">Référence</Label>
                      <Input
                        id="g-reference"
                        placeholder="VIR-2026-001"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || selectedDocs.length === 0}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                Enregistrer le paiement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
