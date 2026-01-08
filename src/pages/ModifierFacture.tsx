import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Users, Calendar, Receipt, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { useFactureById, useUpdateFacture, useClients, useConfiguration } from "@/hooks/use-commercial";
import { formatDate } from "@/data/mockData";
import { LignesFactureForm, LigneFacture } from "@/components/factures/forms";
import { RecapitulatifCard } from "@/components/devis/shared";

export default function ModifierFacturePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: facture, isLoading: factureLoading, error } = useFactureById(id || "");
  const { data: clientsData } = useClients();
  const { data: configData } = useConfiguration();
  const updateFactureMutation = useUpdateFacture();
  
  const clients = clientsData?.data || [];
  
  const TAUX_TVA = configData?.tva_taux ? parseFloat(configData.tva_taux) / 100 : 0.18;
  const TAUX_CSS = configData?.css_taux ? parseFloat(configData.css_taux) / 100 : 0.01;

  const [clientId, setClientId] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<LigneFacture[]>([
    { id: "1", description: "", quantite: 1, prixUnitaire: 0, montantHT: 0 }
  ]);

  useEffect(() => {
    if (facture) {
      setClientId(String(facture.client_id || ""));
      setDateEcheance(facture.date_echeance || "");
      setNotes(facture.notes || "");
      
      if (facture.lignes && facture.lignes.length > 0) {
        setLignes(facture.lignes.map((l: any) => ({
          id: String(l.id),
          description: l.description || l.type_operation || "",
          quantite: l.quantite || 1,
          prixUnitaire: l.prix_unitaire || 0,
          montantHT: l.montant_ht || (l.quantite * l.prix_unitaire) || 0,
        })));
      }
    }
  }, [facture]);

  if (factureLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !facture) {
    return (
      <MainLayout title="Facture non trouvée">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold mb-2">Facture non trouvée</h2>
          <Button onClick={() => navigate("/factures")}>Retour aux factures</Button>
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

  const handleLigneChange = (ligneId: string, field: keyof LigneFacture, value: string | number) => {
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
      date_echeance: dateEcheance,
      notes,
      lignes: lignes.map(l => ({
        type_operation: l.description,
        description: l.description,
        quantite: l.quantite,
        prix_unitaire: l.prixUnitaire,
      })),
    };

    try {
      await updateFactureMutation.mutateAsync({ id: id!, data });
      toast.success(`Facture ${facture.numero} modifiée avec succès`);
      navigate(`/factures/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la modification");
    }
  };

  return (
    <MainLayout title={`Modifier ${facture.numero}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate(`/factures/${id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-primary" />
                  Modifier {facture.numero}
                </h1>
                <Badge variant="secondary">En modification</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Créée le {formatDate(facture.date_facture)}
              </p>
            </div>
          </div>
          <Button type="submit" disabled={updateFactureMutation.isPending}>
            {updateFactureMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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
                  <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date d'échéance
                </Label>
                <Input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lignes de facture */}
        <LignesFactureForm
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
              placeholder="Notes ou commentaires sur cette facture..."
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
