import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Users, Ship, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { useOrdreById, useUpdateOrdre, useClients, useConfiguration } from "@/hooks/use-commercial";
import { formatDate } from "@/data/mockData";
import { LignesOrdreForm, LigneOrdre } from "@/components/ordres/forms";
import { RecapitulatifCard } from "@/components/devis/shared";

export default function ModifierOrdrePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: ordre, isLoading: ordreLoading, error } = useOrdreById(id || "");
  const { data: clientsData } = useClients();
  const { data: configData } = useConfiguration();
  const updateOrdreMutation = useUpdateOrdre();
  
  const clients = clientsData?.data || [];
  
  const TAUX_TVA = configData?.tva_taux ? parseFloat(configData.tva_taux) / 100 : 0.18;
  const TAUX_CSS = configData?.css_taux ? parseFloat(configData.css_taux) / 100 : 0.01;

  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<LigneOrdre[]>([
    { id: "1", description: "", quantite: 1, prixUnitaire: 0, montantHT: 0 }
  ]);

  useEffect(() => {
    if (ordre) {
      setClientId(String(ordre.client_id || ""));
      setNotes(ordre.notes || "");
      
      if (ordre.lignes && ordre.lignes.length > 0) {
        setLignes(ordre.lignes.map((l: any) => ({
          id: String(l.id),
          description: l.description || l.type_operation || "",
          quantite: l.quantite || 1,
          prixUnitaire: l.prix_unitaire || 0,
          montantHT: l.montant_ht || (l.quantite * l.prix_unitaire) || 0,
        })));
      }
    }
  }, [ordre]);

  if (ordreLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !ordre) {
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
      Conteneur: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Lot: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Independant: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
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

    const data = {
      client_id: clientId,
      notes,
      lignes: lignes.map(l => ({
        type_operation: l.description,
        description: l.description,
        quantite: l.quantite,
        prix_unitaire: l.prixUnitaire,
      })),
    };

    try {
      await updateOrdreMutation.mutateAsync({ id: id!, data });
      toast.success(`Ordre ${ordre.numero} modifié avec succès`);
      navigate(`/ordres/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la modification");
    }
  };

  return (
    <MainLayout title={`Modifier ${ordre.numero}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate(`/ordres/${id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Ship className="h-6 w-6 text-primary" />
                  Modifier {ordre.numero}
                </h1>
                {getTypeBadge(ordre.type_document)}
              </div>
              <p className="text-muted-foreground text-sm">
                Créé le {formatDate(ordre.date)}
              </p>
            </div>
          </div>
          <Button type="submit" disabled={updateOrdreMutation.isPending}>
            {updateOrdreMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
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
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lignes de l'ordre */}
        <LignesOrdreForm
          lignes={lignes}
          onAdd={handleAddLigne}
          onRemove={handleRemoveLigne}
          onChange={handleLigneChange}
        />

        {/* Récapitulatif */}
        <RecapitulatifCard
          montantHT={montantHT}
          tva={tva}
          css={css}
          montantTTC={montantTTC}
          tauxTva={Math.round(TAUX_TVA * 100)}
          tauxCss={Math.round(TAUX_CSS * 100)}
        />

        {/* Notes */}
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
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
