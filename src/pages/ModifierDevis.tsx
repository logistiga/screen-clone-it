import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
  DevisStepper,
  DevisPreview,
} from "@/components/devis/shared";
import {
  DevisConteneursForm,
  DevisConventionnelForm,
  DevisIndependantForm,
} from "@/components/devis/forms";
import { getCategoriesLabels, CategorieDocument } from "@/types/documents";
import type { DevisConteneursData } from "@/components/devis/forms/DevisConteneursForm";
import type { DevisConventionnelData } from "@/components/devis/forms/DevisConventionnelForm";
import type { DevisIndependantData } from "@/components/devis/forms/DevisIndependantForm";
import { TypeOperationConteneur } from "@/types/documents";
import RemiseInput, { RemiseData } from "@/components/shared/RemiseInput";

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
  const armateurs = Array.isArray(armateursData)
    ? armateursData
    : Array.isArray((armateursData as any)?.data)
      ? (armateursData as any).data
      : [];
  const transitaires = Array.isArray(transitairesData)
    ? transitairesData
    : Array.isArray((transitairesData as any)?.data)
      ? (transitairesData as any).data
      : [];
  const representants = Array.isArray(representantsData)
    ? representantsData
    : Array.isArray((representantsData as any)?.data)
      ? (representantsData as any).data
      : [];
  
  const TAUX_TVA = config?.taux_tva ? parseFloat(config.taux_tva) / 100 : 0.18;
  const TAUX_CSS = config?.taux_css ? parseFloat(config.taux_css) / 100 : 0.01;
  
  const categoriesLabels = getCategoriesLabels();

  // Stepper - commence à l'étape 2 en mode édition (pas de sélection catégorie)
  const [currentStep, setCurrentStep] = useState(2);

  const [clientId, setClientId] = useState("");
  const [dateValidite, setDateValidite] = useState("");
  const [notes, setNotes] = useState("");
  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  
  // Form data from child components
  const [conteneursData, setConteneursData] = useState<DevisConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<DevisConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<DevisIndependantData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // État de la remise
  const [remiseData, setRemiseData] = useState<RemiseData>({
    type: "none",
    valeur: 0,
    montantCalcule: 0,
  });

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

      // Initialiser la remise si elle existe
      if ((devisData as any).remise_type && (devisData as any).remise_type !== 'none') {
        setRemiseData({
          type: (devisData as any).remise_type,
          valeur: (devisData as any).remise_valeur || 0,
          montantCalcule: (devisData as any).remise_montant || 0,
        });
      }
      
      setIsInitialized(true);
    }
  }, [devisData, isInitialized]);

  const getMontantHT = (): number => {
    if (categorie === "conteneurs" && conteneursData) return conteneursData.montantHT;
    if (categorie === "conventionnel" && conventionnelData) return conventionnelData.montantHT;
    if (categorie === "operations_independantes" && independantData) return independantData.montantHT;
    return devisData?.montant_ht || 0;
  };

  const montantHT = getMontantHT();
  const montantHTApresRemise = montantHT - remiseData.montantCalcule;
  const tva = Math.round(montantHTApresRemise * TAUX_TVA);
  const css = Math.round(montantHTApresRemise * TAUX_CSS);
  const montantTTC = montantHTApresRemise + tva + css;

  // Client sélectionné pour la preview
  const selectedClient = useMemo(() => {
    return clients.find((c: any) => String(c.id) === clientId);
  }, [clients, clientId]);

  const getStatutBadge = (statut: string) => {
    const config: Record<string, { className: string; label: string }> = {
      brouillon: { className: "bg-gray-100 text-gray-700 border-gray-300", label: "Brouillon" },
      envoye: { className: "bg-blue-100 text-blue-700 border-blue-300", label: "Envoyé" },
      accepte: { className: "bg-green-100 text-green-700 border-green-300", label: "Accepté" },
      refuse: { className: "bg-red-100 text-red-700 border-red-300", label: "Refusé" },
      expire: { className: "bg-orange-100 text-orange-700 border-orange-300", label: "Expiré" },
      converti: { className: "bg-purple-100 text-purple-700 border-purple-300", label: "Converti" },
    };
    const style = config[statut] || config.brouillon;
    return (
      <Badge variant="outline" className={`${style.className} transition-all duration-200 hover:scale-105`}>
        {style.label}
      </Badge>
    );
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) return;

    const data: any = {
      client_id: parseInt(clientId),
      date_validite: dateValidite,
      notes: notes || null,
      remise_type: remiseData.type || null,
      remise_valeur: remiseData.valeur || 0,
      remise_montant: remiseData.montantCalcule || 0,
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
        prix_unitaire: c.prixUnitaire || 0,
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
      navigate("/devis");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/devis")}
            className="transition-all duration-200 hover:scale-110"
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
      </div>

      {/* Stepper - mode édition (sans étape catégorie) */}
      <DevisStepper 
        currentStep={currentStep} 
        onStepClick={setCurrentStep}
        isEditMode={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
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

            {/* Étape 2: Client */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
                <ClientInfoCard
                  clientId={clientId}
                  setClientId={setClientId}
                  dateValidite={dateValidite}
                  setDateValidite={setDateValidite}
                  clients={clients}
                />
              </div>
            )}

            {/* Étape 3: Détails */}
            {currentStep === 3 && (
              <div className="animate-fade-in">
                {categorie === "conteneurs" && devisData && (
                  <DevisConteneursForm
                    armateurs={armateurs}
                    transitaires={transitaires}
                    representants={representants}
                    onDataChange={setConteneursData}
                    initialData={{
                      typeOperation: (devisData.type_operation as any) || "",
                      numeroBL: devisData.numero_bl || devisData.bl_numero || "",
                      armateurId: devisData.armateur_id ? String(devisData.armateur_id) : "",
                      transitaireId: devisData.transitaire_id ? String(devisData.transitaire_id) : "",
                      representantId: devisData.representant_id ? String(devisData.representant_id) : "",
                      conteneurs: devisData.conteneurs?.map((c: any) => ({
                        id: String(c.id),
                        numero: c.numero || "",
                        description: c.description || "",
                        taille: c.taille === "20" ? "20'" : "40'",
                        prixUnitaire: c.prix_unitaire || 0,
                        operations: (c.operations || []).map((op: any) => ({
                          id: String(op.id),
                          type: op.type_operation as TypeOperationConteneur,
                          description: op.description || "",
                          quantite: op.quantite || 1,
                          prixUnitaire: op.prix_unitaire || 0,
                          prixTotal: (op.quantite || 1) * (op.prix_unitaire || 0),
                        })),
                      })) || [],
                    }}
                  />
                )}

                {categorie === "conventionnel" && devisData && (
                  <DevisConventionnelForm 
                    onDataChange={setConventionnelData}
                    initialData={{
                      numeroBL: devisData.numero_bl || devisData.bl_numero || "",
                      lieuChargement: (devisData as any).lieu_chargement || "",
                      lieuDechargement: (devisData as any).lieu_dechargement || "",
                      lots: devisData.lots?.map((l: any) => ({
                        id: String(l.id),
                        numeroLot: l.numero_lot || "",
                        description: l.description || l.designation || "",
                        quantite: l.quantite || 1,
                        prixUnitaire: l.prix_unitaire || 0,
                        prixTotal: (l.quantite || 1) * (l.prix_unitaire || 0),
                      })) || [],
                    }}
                  />
                )}

                {categorie === "operations_independantes" && devisData && (
                  <DevisIndependantForm 
                    onDataChange={setIndependantData}
                    initialData={{
                      typeOperationIndep: (devisData as any).type_operation_indep || "",
                      lieuChargement: (devisData as any).lieu_chargement || "",
                      lieuDechargement: (devisData as any).lieu_dechargement || "",
                      prestations: devisData.lignes?.map((l: any) => ({
                        id: String(l.id),
                        description: l.description || "",
                        lieuDepart: l.lieu_depart || "",
                        lieuArrivee: l.lieu_arrivee || "",
                        dateDebut: l.date_debut || "",
                        dateFin: l.date_fin || "",
                        quantite: l.quantite || 1,
                        prixUnitaire: l.prix_unitaire || 0,
                        montantHT: (l.quantite || 1) * (l.prix_unitaire || 0),
                      })) || [],
                    }}
                  />
                )}
              </div>
            )}

            {/* Étape 4: Récapitulatif */}
            {currentStep === 4 && (
              <div className="animate-fade-in space-y-6">
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

                {montantHT > 0 && (
                  <RemiseInput 
                    montantHT={montantHT} 
                    onChange={setRemiseData}
                    initialType={remiseData.type}
                    initialValeur={remiseData.valeur}
                  />
                )}

                <RecapitulatifCard
                  montantHT={montantHT}
                  tva={tva}
                  css={css}
                  montantTTC={montantTTC}
                  tauxTva={Math.round(TAUX_TVA * 100)}
                  tauxCss={Math.round(TAUX_CSS * 100)}
                  remiseMontant={remiseData.montantCalcule}
                  remiseType={remiseData.type}
                  remiseValeur={remiseData.valeur}
                />
              </div>
            )}

            {/* Étape 5: Aperçu final */}
            {currentStep === 5 && (
              <div className="animate-fade-in">
                <Card className="border-primary/20">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Vérification finale
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground mb-4">
                      Vérifiez les modifications dans l'aperçu à droite avant d'enregistrer.
                    </p>
                    <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Save className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-700 dark:text-blue-400">Prêt à enregistrer</p>
                        <p className="text-sm text-blue-600 dark:text-blue-500">
                          Montant TTC: {montantTTC.toLocaleString("fr-FR")} XAF
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between gap-4 pb-6">
              <div>
                {currentStep > 2 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePrevStep}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                )}
              </div>

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/devis")} 
                  disabled={updateDevisMutation.isPending}
                  className="transition-all duration-200 hover:scale-105"
                >
                  Annuler
                </Button>

                {currentStep < 5 ? (
                  <Button 
                    type="button" 
                    onClick={handleNextStep}
                    className="gap-2 transition-all duration-200 hover:scale-105"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md" disabled={updateDevisMutation.isPending}>
                    {updateDevisMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Enregistrer les modifications
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-1">
          <DevisPreview
            categorie={categorie}
            client={selectedClient}
            dateValidite={dateValidite}
            notes={notes}
            conteneursData={conteneursData}
            conventionnelData={conventionnelData}
            independantData={independantData}
            montantHT={montantHT}
            tva={tva}
            css={css}
            montantTTC={montantTTC}
            remiseData={remiseData}
            armateurs={armateurs}
            transitaires={transitaires}
            representants={representants}
          />
        </div>
      </div>
    </MainLayout>
  );
}
