import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/MainLayout";
import { useDevisById, useUpdateDevis, useClients, useConfiguration } from "@/hooks/use-commercial";
import { ClientInfoCard, NotesCard, RecapitulatifCard, LignesDevisForm } from "@/components/devis";
import type { LigneDevis } from "@/components/devis/forms/LignesDevisForm";

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

    if (!clientId || lignes.some((l) => !l.designation)) {
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

        <ClientInfoCard
          clientId={clientId}
          setClientId={setClientId}
          dateValidite={dateValidite}
          setDateValidite={setDateValidite}
          clients={clients}
        />

        <LignesDevisForm
          lignes={lignes}
          onAdd={handleAddLigne}
          onRemove={handleRemoveLigne}
          onChange={handleLigneChange}
        />

        <RecapitulatifCard
          montantHT={montantHT}
          tva={tva}
          css={css}
          montantTTC={montantTTC}
          tauxTva={Math.round(TAUX_TVA * 100)}
          tauxCss={Math.round(TAUX_CSS * 100)}
        />

        <NotesCard notes={notes} setNotes={setNotes} />
      </form>
    </MainLayout>
  );
}
