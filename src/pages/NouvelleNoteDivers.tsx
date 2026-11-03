import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Loader2, Receipt } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/layout/PageTransition";
import { useClients } from "@/hooks/use-commercial";
import { useCreateNoteDebut } from "@/hooks/use-notes-debut";

interface LigneDivers {
  id: string;
  designation: string;
  reference: string;
  montant: number;
}

interface ClientOption {
  id: number | string;
  nom: string;
}

const nouvelleLigne = (): LigneDivers => ({ id: String(Date.now() + Math.random()), designation: "", reference: "", montant: 0 });

const formatMontant = (value: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(value));

export default function NouvelleNoteDivers() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [lignes, setLignes] = useState<LigneDivers[]>([nouvelleLigne()]);

  const { data: clientsResponse, isLoading: isLoadingClients } = useClients({ per_page: 1000 });
  const clients: ClientOption[] = clientsResponse?.data || [];
  const createNote = useCreateNoteDebut();

  const updateLigne = (id: string, field: keyof LigneDivers, value: string | number) =>
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  const montantTotal = lignes.reduce((acc, l) => acc + (Math.round(l.montant) || 0), 0);

  const handleSubmit = async () => {
    if (!clientId) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un client", variant: "destructive" });
      return;
    }
    const valides = lignes.filter((l) => l.designation.trim() && l.montant > 0);
    if (valides.length === 0) {
      toast({ title: "Erreur", description: "Ajoutez au moins un frais avec une désignation et un montant", variant: "destructive" });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    try {
      await createNote.mutateAsync({
        type: "Divers",
        client_id: clientId,
        description: description || undefined,
        date_creation: today,
        date_debut: today,
        date_fin: today,
        lignes: valides.map((l) => ({
          designation: l.designation.trim(),
          conteneur_numero: l.reference.trim() || undefined,
          reference_justificatif: l.reference.trim() || undefined,
          date_debut: today,
          date_fin: today,
          tarif_journalier: Math.round(l.montant),
          observations: l.designation.trim(),
        })),
      });
      navigate("/notes-debut");
    } catch {
      // Erreur affichée par le hook
    }
  };

  return (
    <MainLayout title="Nouvelle note de débit divers">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/notes-debut/nouvelle")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Note de débit divers</h1>
                <p className="text-muted-foreground mt-1">
                  Frais avancés pour le client (pont-bascule, péage, pesée...) refacturés à l'identique, sans taxes
                </p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingClients ? "Chargement..." : "Sélectionner un client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objet / mission</Label>
                <Textarea
                  placeholder="Ex : trajet Owendo – Franceville du 03/11"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Frais à refacturer</CardTitle>
              <Button size="sm" onClick={() => setLignes((p) => [...p, nouvelleLigne()])}>
                <Plus className="h-4 w-4 mr-2" />Ajouter un frais
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {lignes.map((ligne, index) => (
                <div key={ligne.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Frais {index + 1}</span>
                    {lignes.length > 1 && (
                      <Button variant="ghost" size="icon" className="text-destructive"
                        onClick={() => setLignes((p) => p.filter((l) => l.id !== ligne.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Désignation *</Label>
                      <Input placeholder="Passage pont-bascule" value={ligne.designation}
                        onChange={(e) => updateLigne(ligne.id, "designation", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>N° reçu / référence</Label>
                      <Input placeholder="Ticket 00123" maxLength={50} value={ligne.reference}
                        onChange={(e) => updateLigne(ligne.id, "reference", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Montant payé (FCFA) *</Label>
                      <Input type="number" min={0} placeholder="15000" value={ligne.montant || ""}
                        onChange={(e) => updateLigne(ligne.id, "montant", Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total à refacturer (sans TVA ni CSS)</p>
                  <p className="text-2xl font-bold">{formatMontant(montantTotal)} FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/notes-debut")}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createNote.isPending}>
              {createNote.isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création...</>
                : <><Save className="h-4 w-4 mr-2" />Créer la note</>}
            </Button>
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
