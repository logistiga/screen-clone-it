import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Users, FileText, Plus, Trash2, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clients, TAUX_TVA, TAUX_CSS, formatMontant, ordresTravail } from "@/data/mockData";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";

interface LigneOrdre {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
}

export default function ModifierOrdrePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Trouver l'ordre à modifier
  const ordreExistant = ordresTravail.find((o) => o.id === id);

  const [clientId, setClientId] = useState(ordreExistant?.clientId || "");
  const [notes, setNotes] = useState(ordreExistant?.notes || "");
  const [lignes, setLignes] = useState<LigneOrdre[]>(
    ordreExistant?.lignes.map((l) => ({
      id: l.id,
      description: l.description,
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire,
      montantHT: l.montantHT,
    })) || [{ id: "1", description: "", quantite: 1, prixUnitaire: 0, montantHT: 0 }]
  );
  const [isLoading, setIsLoading] = useState(false);

  if (!ordreExistant) {
    return (
      <MainLayout title="Ordre non trouvé">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold mb-2">Ordre de travail non trouvé</h2>
          <Button onClick={() => navigate("/ordres")}>Retour aux ordres</Button>
        </div>
      </MainLayout>
    );
  }

  const handleAddLigne = () => {
    setLignes([
      ...lignes,
      { id: String(Date.now()), description: "", quantite: 1, prixUnitaire: 0, montantHT: 0 },
    ]);
  };

  const handleRemoveLigne = (ligneId: string) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((l) => l.id !== ligneId));
    }
  };

  const handleLigneChange = (ligneId: string, field: keyof LigneOrdre, value: string | number) => {
    setLignes(
      lignes.map((l) => {
        if (l.id === ligneId) {
          const updated = { ...l, [field]: value };
          if (field === "quantite" || field === "prixUnitaire") {
            updated.montantHT = updated.quantite * updated.prixUnitaire;
          }
          return updated;
        }
        return l;
      })
    );
  };

  const montantHT = lignes.reduce((sum, l) => sum + l.montantHT, 0);
  const tva = Math.round(montantHT * TAUX_TVA);
  const css = Math.round(montantHT * TAUX_CSS);
  const montantTTC = montantHT + tva + css;

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      conteneurs: "bg-blue-100 text-blue-800",
      conventionnel: "bg-purple-100 text-purple-800",
      location: "bg-orange-100 text-orange-800",
      transport: "bg-green-100 text-green-800",
      manutention: "bg-yellow-100 text-yellow-800",
      stockage: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[type] || "bg-gray-100"}>{type}</Badge>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (lignes.some((l) => !l.description)) {
      toast.error("Veuillez remplir toutes les descriptions");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    toast.success(`Ordre ${ordreExistant.numero} modifié avec succès`);
    setIsLoading(false);
    navigate(`/ordres/${id}`);
  };

  return (
    <MainLayout title={`Modifier ${ordreExistant.numero}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/ordres/${id}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Ship className="h-6 w-6 text-primary" />
                  Modifier {ordreExistant.numero}
                </h1>
                {getTypeBadge(ordreExistant.typeOperation)}
              </div>
              <p className="text-muted-foreground text-sm">
                Créé le {ordreExistant.dateCreation}
              </p>
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>

        {/* Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-2">
              <Label>Nom du client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
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
          </CardContent>
        </Card>

        {/* Lignes de l'ordre */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Lignes de l'ordre
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLigne}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter ligne
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lignes.map((ligne) => (
                <div
                  key={ligne.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 border rounded-lg bg-muted/30"
                >
                  <div className="md:col-span-5 space-y-2">
                    <Label>Description *</Label>
                    <Input
                      placeholder="Description de la prestation"
                      value={ligne.description}
                      onChange={(e) => handleLigneChange(ligne.id, "description", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      min="1"
                      value={ligne.quantite}
                      onChange={(e) =>
                        handleLigneChange(ligne.id, "quantite", parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Prix unitaire</Label>
                    <Input
                      type="number"
                      min="0"
                      value={ligne.prixUnitaire}
                      onChange={(e) =>
                        handleLigneChange(ligne.id, "prixUnitaire", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Montant HT</Label>
                    <div className="h-10 flex items-center font-medium">
                      {formatMontant(ligne.montantHT)}
                    </div>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    {lignes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLigne(ligne.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Récapitulatif */}
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-w-md ml-auto">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant HT</span>
                <span className="font-medium">{formatMontant(montantHT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA (18%)</span>
                <span>{formatMontant(tva)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CSS (1%)</span>
                <span>{formatMontant(css)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total TTC</span>
                <span className="text-primary">{formatMontant(montantTTC)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Notes ou commentaires sur cet ordre..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>
      </form>
    </MainLayout>
  );
}
