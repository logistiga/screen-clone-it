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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, Banknote, CreditCard, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { banques, ordresTravail, factures, clients, formatMontant } from "@/data/mockData";

interface PaiementGlobalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type MethodePaiement = "especes" | "cheque" | "virement";

interface DocumentSelectionne {
  id: string;
  type: "ordre" | "facture";
  numero: string;
  clientId: string;
  montantRestant: number;
}

export function PaiementGlobalModal({
  open,
  onOpenChange,
  onSuccess,
}: PaiementGlobalModalProps) {
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [montant, setMontant] = useState<number>(0);
  const [methode, setMethode] = useState<MethodePaiement>("especes");
  const [banqueId, setBanqueId] = useState("");
  const [numeroCheque, setNumeroCheque] = useState("");
  const [reference, setReference] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Récupérer les documents non soldés pour le client sélectionné
  const getDocumentsClient = (): DocumentSelectionne[] => {
    if (!clientId) return [];

    const docs: DocumentSelectionne[] = [];

    // Ordres non soldés
    ordresTravail
      .filter((o) => o.clientId === clientId && o.statut !== "annule" && o.montantTTC > o.montantPaye)
      .forEach((o) => {
        docs.push({
          id: `ordre-${o.id}`,
          type: "ordre",
          numero: o.numero,
          clientId: o.clientId,
          montantRestant: o.montantTTC - o.montantPaye,
        });
      });

    // Factures non soldées
    factures
      .filter((f) => f.clientId === clientId && f.statut !== "annulee" && f.statut !== "payee")
      .forEach((f) => {
        docs.push({
          id: `facture-${f.id}`,
          type: "facture",
          numero: f.numero,
          clientId: f.clientId,
          montantRestant: f.montantTTC - f.montantPaye,
        });
      });

    return docs;
  };

  const documentsClient = getDocumentsClient();
  const totalSelectionne = documentsClient
    .filter((d) => selectedDocs.includes(d.id))
    .reduce((sum, d) => sum + d.montantRestant, 0);

  const toggleDocument = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const selectAll = () => {
    setSelectedDocs(documentsClient.map((d) => d.id));
    setMontant(documentsClient.reduce((sum, d) => sum + d.montantRestant, 0));
  };

  const handleSubmit = async () => {
    if (selectedDocs.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un document.",
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

    if ((methode === "cheque" || methode === "virement") && !banqueId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une banque.",
        variant: "destructive",
      });
      return;
    }

    if (methode === "cheque" && !numeroCheque) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le numéro de chèque.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const client = clients.find((c) => c.id === clientId);
    const documentsPayes = documentsClient.filter((d) => selectedDocs.includes(d.id));

    console.log("Paiement global enregistré:", {
      clientId,
      documents: documentsPayes,
      montant,
      methode,
      banqueId,
      numeroCheque,
      reference,
    });

    toast({
      title: "Paiement global enregistré",
      description: `Paiement de ${formatMontant(montant)} enregistré pour ${client?.nom} (${documentsPayes.length} documents).`,
    });

    setIsSaving(false);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Paiement global
          </DialogTitle>
          <DialogDescription>
            Enregistrer un paiement pour plusieurs documents d'un même client
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
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Liste des documents */}
          {clientId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Documents à payer</Label>
                {documentsClient.length > 0 && (
                  <Button variant="link" size="sm" onClick={selectAll} className="p-0 h-auto">
                    Tout sélectionner
                  </Button>
                )}
              </div>

              {documentsClient.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucun document en attente de paiement pour ce client.
                </p>
              ) : (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {documentsClient.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleDocument(doc.id)}
                    >
                      <Checkbox
                        checked={selectedDocs.includes(doc.id)}
                        onCheckedChange={() => toggleDocument(doc.id)}
                      />
                      <div className="flex-1">
                        <span className="font-medium">{doc.numero}</span>
                        <span className="text-xs text-muted-foreground ml-2 capitalize">
                          ({doc.type})
                        </span>
                      </div>
                      <span className="font-semibold text-primary">
                        {formatMontant(doc.montantRestant)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedDocs.length > 0 && (
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">
                    {selectedDocs.length} document(s) sélectionné(s)
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
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${methode === "especes" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                      onClick={() => setMethode("especes")}
                    >
                      <RadioGroupItem value="especes" id="g-especes" />
                      <Label htmlFor="g-especes" className="flex items-center gap-1 cursor-pointer text-sm">
                        <Banknote className="h-4 w-4 text-green-600" />
                        Espèces
                      </Label>
                    </div>
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${methode === "cheque" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                      onClick={() => setMethode("cheque")}
                    >
                      <RadioGroupItem value="cheque" id="g-cheque" />
                      <Label htmlFor="g-cheque" className="flex items-center gap-1 cursor-pointer text-sm">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        Chèque
                      </Label>
                    </div>
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${methode === "virement" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                      onClick={() => setMethode("virement")}
                    >
                      <RadioGroupItem value="virement" id="g-virement" />
                      <Label htmlFor="g-virement" className="flex items-center gap-1 cursor-pointer text-sm">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        Virement
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Champs bancaires */}
              {(methode === "cheque" || methode === "virement") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banque</Label>
                    <Select value={banqueId} onValueChange={setBanqueId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {banques.filter((b) => b.actif).map((banque) => (
                          <SelectItem key={banque.id} value={banque.id}>
                            {banque.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {methode === "cheque" && (
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

                  {methode === "virement" && (
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
