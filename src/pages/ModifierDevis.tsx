import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Users, FileText, Plus, Trash2, Calendar, Loader2 } from "lucide-react";
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
import { MainLayout } from "@/components/layout/MainLayout";
import { useDevisById, useUpdateDevis, useClients, useConfiguration } from "@/hooks/use-commercial";

interface LigneDevis {
  id: string;
  designation: string;
  unite: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' XAF';
};

export default function ModifierDevisPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Fetch data
  const { data: devisData, isLoading: loadingDevis } = useDevisById(id || '');
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 100 });
  const { data: config } = useConfiguration();
  const updateDevisMutation = useUpdateDevis();

  const clients = clientsData?.data || [];
  const TAUX_TVA = config?.taux_tva ? parseFloat(config.taux_tva) / 100 : 0.18;
  const TAUX_CSS = config?.taux_css ? parseFloat(config.taux_css) / 100 : 0.01;

  const [clientId, setClientId] = useState("");
  const [dateValidite, setDateValidite] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<LigneDevis[]>([]);

  // Populate form when data loads
  useEffect(() => {
    if (devisData) {
      setClientId(String(devisData.client_id || ""));
      setDateValidite(devisData.date_validite || "");
      setNotes(devisData.notes || "");
      setLignes(
        devisData.lignes?.map((l: any) => ({
          id: String(l.id),
          designation: l.designation,
          unite: l.unite || 'unité',
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire,
          montant: l.montant || l.quantite * l.prix_unitaire,
        })) || [{ id: "1", designation: "", unite: "unité", quantite: 1, prix_unitaire: 0, montant: 0 }]
      );
    }
  }, [devisData]);

  if (loadingDevis || loadingClients) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!devisData) {
    return (
      <MainLayout title="Devis non trouvé">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold mb-2">Devis non trouvé</h2>
          <Button onClick={() => navigate("/devis")}>Retour aux devis</Button>
        </div>
      </MainLayout>
    );
  }

  const handleAddLigne = () => {
    setLignes([
      ...lignes,
      { id: String(Date.now()), designation: "", unite: "unité", quantite: 1, prix_unitaire: 0, montant: 0 },
    ]);
  };

  const handleRemoveLigne = (ligneId: string) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((l) => l.id !== ligneId));
    }
  };

  const handleLigneChange = (ligneId: string, field: keyof LigneDevis, value: string | number) => {
    setLignes(
      lignes.map((l) => {
        if (l.id === ligneId) {
          const updated = { ...l, [field]: value };
          if (field === "quantite" || field === "prix_unitaire") {
            updated.montant = updated.quantite * updated.prix_unitaire;
          }
          return updated;
        }
        return l;
      })
    );
  };

  const montantHT = lignes.reduce((sum, l) => sum + l.montant, 0);
  const tva = Math.round(montantHT * TAUX_TVA);
  const css = Math.round(montantHT * TAUX_CSS);
  const montantTTC = montantHT + tva + css;

  const getStatutBadge = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      envoye: "Envoyé",
      accepte: "Accepté",
      refuse: "Refusé",
      expire: "Expiré",
      converti: "Converti",
    };
    const colors: Record<string, string> = {
      brouillon: "bg-gray-100 text-gray-800",
      envoye: "bg-blue-100 text-blue-800",
      accepte: "bg-green-100 text-green-800",
      refuse: "bg-red-100 text-red-800",
      expire: "bg-orange-100 text-orange-800",
      converti: "bg-purple-100 text-purple-800",
    };
    return <Badge className={colors[statut] || "bg-gray-100"}>{labels[statut] || statut}</Badge>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      return;
    }
    if (lignes.some((l) => !l.designation)) {
      return;
    }

    const data = {
      client_id: parseInt(clientId),
      date_validite: dateValidite,
      notes: notes || null,
      lignes: lignes.map(l => ({
        designation: l.designation,
        unite: l.unite,
        quantite: l.quantite,
        prix_unitaire: l.prix_unitaire,
      })),
    };

    try {
      await updateDevisMutation.mutateAsync({ id: id!, data });
      navigate(`/devis/${id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <MainLayout title={`Modifier ${devisData.numero}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/devis/${id}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Modifier {devisData.numero}
                </h1>
                {getStatutBadge(devisData.statut)}
              </div>
              <p className="text-muted-foreground text-sm">
                Créé le {new Date(devisData.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <Button type="submit" disabled={updateDevisMutation.isPending}>
            {updateDevisMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>

        {/* Client et dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de validité
                </Label>
                <Input
                  type="date"
                  value={dateValidite}
                  onChange={(e) => setDateValidite(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lignes du devis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Lignes du devis
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
                    <Label>Désignation *</Label>
                    <Input
                      placeholder="Description de la prestation"
                      value={ligne.designation}
                      onChange={(e) => handleLigneChange(ligne.id, "designation", e.target.value)}
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
                      value={ligne.prix_unitaire}
                      onChange={(e) =>
                        handleLigneChange(ligne.id, "prix_unitaire", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Montant</Label>
                    <div className="h-10 flex items-center font-medium">
                      {formatMontant(ligne.montant)}
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
              placeholder="Notes ou commentaires sur ce devis..."
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
