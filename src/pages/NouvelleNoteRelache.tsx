import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Loader2, PackageOpen } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/layout/PageTransition";
import { useClients } from "@/hooks/use-commercial";
import { useCreateNoteDebut } from "@/hooks/use-notes-debut";

interface LigneRelache {
  id: string;
  numeroConteneur: string;
  description: string;
  montant: number;
}

export default function NouvelleNoteRelache() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");
  const [notesGenerales, setNotesGenerales] = useState("");
  const [lignes, setLignes] = useState<LigneRelache[]>([
    {
      id: "1",
      numeroConteneur: "",
      description: "",
      montant: 0,
    },
  ]);

  // Fetch clients from backend
  const { data: clientsResponse, isLoading: isLoadingClients } = useClients({ per_page: 1000 });
  const clients = clientsResponse?.data || [];

  const createNote = useCreateNoteDebut();

  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      {
        id: String(Date.now()),
        numeroConteneur: "",
        description: "",
        montant: 0,
      },
    ]);
  };

  const supprimerLigne = (id: string) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((l) => l.id !== id));
    }
  };

  const updateLigne = (id: string, field: keyof LigneRelache, value: string | number) => {
    setLignes(
      lignes.map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      )
    );
  };

  const montantTotal = lignes.reduce((acc, l) => acc + (l.montant || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-GA", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async () => {
    if (!clientId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un client",
        variant: "destructive",
      });
      return;
    }

    // Validation: at least one line with container number and montant > 0
    const lignesValides = lignes.filter(
      (l) => l.numeroConteneur.trim() && l.montant > 0
    );

    if (lignesValides.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins une ligne avec un numéro de conteneur et un montant",
        variant: "destructive",
      });
      return;
    }

    const dateCreation = new Date().toISOString().slice(0, 10);

    try {
      // Create one note for each valid ligne
      for (const ligne of lignesValides) {
        await createNote.mutateAsync({
          type: "Relache",
          client_id: clientId,
          conteneur_numero: ligne.numeroConteneur,
          montant_ht: ligne.montant,
          description: ligne.description || notesGenerales || undefined,
          date_creation: dateCreation,
          // For relache, we don't use dates or tarif journalier
          date_debut: dateCreation,
          date_fin: dateCreation,
          nombre_jours: 1,
          tarif_journalier: ligne.montant,
        });
      }

      navigate("/notes-debut");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <MainLayout title="Nouvelle note de relâche">
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/notes-debut/nouvelle")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <PackageOpen className="h-6 w-6 text-purple-700 dark:text-purple-300" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  Nouvelle note de relâche
                </h1>
                <p className="text-muted-foreground mt-1">
                  Facturation de la relâche de conteneurs
                </p>
              </div>
            </div>
          </div>

          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClients ? "Chargement..." : "Sélectionner un client"} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={String(client.id)}>
                          {client.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes générales</Label>
                  <Textarea
                    placeholder="Notes générales pour cette note de relâche..."
                    value={notesGenerales}
                    onChange={(e) => setNotesGenerales(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lignes de conteneurs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Conteneurs</CardTitle>
              <Button onClick={ajouterLigne} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un conteneur
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {lignes.map((ligne, index) => (
                <div
                  key={ligne.id}
                  className="border rounded-lg p-4 space-y-4 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Conteneur {index + 1}</span>
                    {lignes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => supprimerLigne(ligne.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>N° Conteneur *</Label>
                      <Input
                        placeholder="MSKU1234567"
                        value={ligne.numeroConteneur}
                        onChange={(e) =>
                          updateLigne(ligne.id, "numeroConteneur", e.target.value.toUpperCase())
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="Description de la relâche..."
                        value={ligne.description}
                        onChange={(e) => updateLigne(ligne.id, "description", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Montant (FCFA) *</Label>
                      <Input
                        type="number"
                        placeholder="50000"
                        value={ligne.montant || ""}
                        onChange={(e) =>
                          updateLigne(ligne.id, "montant", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="text-2xl font-bold">{formatCurrency(montantTotal)} FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/notes-debut")}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={createNote.isPending}>
              {createNote.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer la note
                </>
              )}
            </Button>
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
