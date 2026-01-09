import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  useDevisById, 
  useUpdateDevis, 
  useClients, 
  useArmateurs, 
  useTransitaires, 
  useRepresentants, 
  useConfiguration 
} from "@/hooks/use-commercial";
import { 
  ClientInfoCard, 
  RecapitulatifCard,
  DevisConteneursForm,
  DevisConventionnelForm,
  DevisIndependantForm,
} from "@/components/devis";
import { getCategoriesLabels, CategorieDocument } from "@/types/documents";
import type { DevisConteneursData } from "@/components/devis/forms/DevisConteneursForm";
import type { DevisConventionnelData } from "@/components/devis/forms/DevisConventionnelForm";
import type { DevisIndependantData } from "@/components/devis/forms/DevisIndependantForm";

export default function ModifierDevisPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Fetch data
  const { data: devisData, isLoading: loadingDevis } = useDevisById(id || '');
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 100 });
  const { data: armateursData, isLoading: loadingArmateurs } = useArmateurs();
  const { data: transitairesData, isLoading: loadingTransitaires } = useTransitaires();
  const { data: representantsData, isLoading: loadingRepresentants } = useRepresentants();
  const { data: config } = useConfiguration();
  const updateDevisMutation = useUpdateDevis();

  const clients = clientsData?.data || [];
  const armateurs = armateursData || [];
  const transitaires = transitairesData || [];
  const representants = representantsData || [];
  
  const TAUX_TVA = config?.taux_tva ? parseFloat(config.taux_tva) / 100 : 0.18;
  const TAUX_CSS = config?.taux_css ? parseFloat(config.taux_css) / 100 : 0.01;
  
  const categoriesLabels = getCategoriesLabels();

  const [clientId, setClientId] = useState("");
  const [dateValidite, setDateValidite] = useState("");
  const [notes, setNotes] = useState("");
  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  
  // Form data from child components
  const [conteneursData, setConteneursData] = useState<DevisConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<DevisConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<DevisIndependantData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Populate form when data loads
  useEffect(() => {
    if (devisData && !isInitialized) {
      setClientId(String(devisData.client_id || ""));
      setDateValidite(devisData.date_validite || "");
      setNotes(devisData.notes || "");
      
      // Déterminer la catégorie
      const cat = devisData.categorie || 
        (devisData.conteneurs?.length > 0 ? 'conteneurs' : 
         devisData.lots?.length > 0 ? 'conventionnel' : 
         devisData.lignes?.length > 0 ? 'operations_independantes' : 'conteneurs');
      setCategorie(cat as CategorieDocument);
      
      setIsInitialized(true);
    }
  }, [devisData, isInitialized]);

  const getMontantHT = (): number => {
    if (categorie === "conteneurs" && conteneursData) return conteneursData.montantHT;
    if (categorie === "conventionnel" && conventionnelData) return conventionnelData.montantHT;
    if (categorie === "operations_independantes" && independantData) return independantData.montantHT;
    // Fallback to existing data
    return devisData?.montant_ht || 0;
  };

  const montantHT = getMontantHT();
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

    if (!clientId) return;

    const data: any = {
      client_id: parseInt(clientId),
      date_validite: dateValidite,
      notes: notes || null,
    };

    if (categorie === "conteneurs" && conteneursData) {
      data.transitaire_id = conteneursData.transitaireId ? parseInt(conteneursData.transitaireId) : null;
      data.representant_id = conteneursData.representantId ? parseInt(conteneursData.representantId) : null;
      data.armateur_id = conteneursData.armateurId ? parseInt(conteneursData.armateurId) : null;
      data.bl_numero = conteneursData.numeroBL || null;
      data.type_operation = conteneursData.typeOperation || "import";
      data.conteneurs = conteneursData.conteneurs.map(c => ({
        numero: c.numero,
        type: "DRY",
        taille: c.taille === "20'" ? "20" : "40",
        description: c.description || null,
        armateur_id: conteneursData.armateurId ? parseInt(conteneursData.armateurId) : null,
        operations: c.operations.map(op => ({
          type_operation: op.type,
          description: op.description || "",
          quantite: op.quantite,
          prix_unitaire: op.prixUnitaire
        }))
      }));
    }

    if (categorie === "conventionnel" && conventionnelData) {
      data.bl_numero = conventionnelData.numeroBL || null;
      data.lieu_chargement = conventionnelData.lieuChargement || null;
      data.lieu_dechargement = conventionnelData.lieuDechargement || null;
      data.lots = conventionnelData.lots.map(l => ({
        numero_lot: l.numeroLot || null,
        designation: l.description || `Lot ${l.numeroLot}`,
        description: l.description || `Lot ${l.numeroLot}`,
        quantite: l.quantite,
        prix_unitaire: l.prixUnitaire
      }));
    }

    if (categorie === "operations_independantes" && independantData) {
      data.type_operation_indep = independantData.typeOperationIndep || null;
      data.lignes = independantData.prestations.map(p => ({
        type_operation: independantData.typeOperationIndep || "manutention",
        description: p.description || "",
        lieu_depart: p.lieuDepart || independantData.lieuChargement || null,
        lieu_arrivee: p.lieuArrivee || independantData.lieuDechargement || null,
        date_debut: p.dateDebut || null,
        date_fin: p.dateFin || null,
        quantite: p.quantite || 1,
        prix_unitaire: p.prixUnitaire || 0
      }));
    }

    try {
      await updateDevisMutation.mutateAsync({ id: id!, data });
      navigate(`/devis/${id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = loadingDevis || loadingClients || loadingArmateurs || loadingTransitaires || loadingRepresentants;

  if (isLoading) {
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

        {/* Catégorie (lecture seule) */}
        {categorie && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2">
              {categoriesLabels[categorie]?.icon}
              <span>{categoriesLabels[categorie]?.label}</span>
            </Badge>
            <span className="text-sm text-muted-foreground">(non modifiable)</span>
          </div>
        )}

        <ClientInfoCard
          clientId={clientId}
          setClientId={setClientId}
          dateValidite={dateValidite}
          setDateValidite={setDateValidite}
          clients={clients}
        />

        {categorie === "conteneurs" && (
          <DevisConteneursForm
            armateurs={armateurs}
            transitaires={transitaires}
            representants={representants}
            onDataChange={setConteneursData}
          />
        )}

        {categorie === "conventionnel" && (
          <DevisConventionnelForm onDataChange={setConventionnelData} />
        )}

        {categorie === "operations_independantes" && (
          <DevisIndependantForm onDataChange={setIndependantData} />
        )}

        {categorie && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conditions et notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conditions particulières, notes..."
                rows={4}
              />
            </CardContent>
          </Card>
        )}

        <RecapitulatifCard
          montantHT={montantHT}
          tva={tva}
          css={css}
          montantTTC={montantTTC}
          tauxTva={Math.round(TAUX_TVA * 100)}
          tauxCss={Math.round(TAUX_CSS * 100)}
        />

        <div className="flex justify-end gap-4 pb-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(`/devis/${id}`)} 
            disabled={updateDevisMutation.isPending}
          >
            Annuler
          </Button>
          <Button type="submit" className="gap-2" disabled={updateDevisMutation.isPending}>
            {updateDevisMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </MainLayout>
  );
}
