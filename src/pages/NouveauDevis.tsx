import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Save, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { ApiErrorState } from "@/components/ApiErrorState";
import { useClients, useArmateurs, useTransitaires, useRepresentants, useCreateDevis, useTaxes } from "@/hooks/use-commercial";
import { CategorieDocument, getCategoriesLabels } from "@/types/documents";
import {
  CategorieSelector,
  ClientInfoCard,
  RecapitulatifCard,
  DevisStepper,
  DevisPreview,
  AutoSaveIndicator,
} from "@/components/devis/shared";
import {
  DevisConteneursForm,
  DevisConventionnelForm,
  DevisIndependantForm,
} from "@/components/devis/forms";
import type { DevisConteneursData } from "@/components/devis/forms/DevisConteneursForm";
import type { DevisConventionnelData } from "@/components/devis/forms/DevisConventionnelForm";
import type { DevisIndependantData } from "@/components/devis/forms/DevisIndependantForm";
import RemiseInput, { RemiseData } from "@/components/shared/RemiseInput";
import { useAutoSave } from "@/hooks/use-auto-save";

interface DevisDraftData {
  categorie: CategorieDocument | "";
  clientId: string;
  dateValidite: string;
  notes: string;
  currentStep: number;
  conteneursData: DevisConteneursData | null;
  conventionnelData: DevisConventionnelData | null;
  independantData: DevisIndependantData | null;
  remiseData: RemiseData;
}

export default function NouveauDevisPage() {
  const navigate = useNavigate();
  
  // API hooks
  const { data: clientsData, isLoading: loadingClients, error: clientsError } = useClients({ per_page: 500 });
  const { data: armateursData, isLoading: loadingArmateurs, error: armateursError } = useArmateurs();
  const { data: transitairesData, isLoading: loadingTransitaires, error: transitairesError } = useTransitaires();
  const { data: representantsData, isLoading: loadingRepresentants, error: representantsError } = useRepresentants({ per_page: 500 });
  const { data: taxesData, error: taxesError } = useTaxes();
  const createDevisMutation = useCreateDevis();

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
  
  const tvaTax = taxesData?.data?.find((t: any) => t.code === 'TVA' || t.nom?.toLowerCase().includes('tva'));
  const cssTax = taxesData?.data?.find((t: any) => t.code === 'CSS' || t.nom?.toLowerCase().includes('css'));
  const TAUX_TVA = tvaTax?.taux ? parseFloat(tvaTax.taux) / 100 : 0.18;
  const TAUX_CSS = cssTax?.taux ? parseFloat(cssTax.taux) / 100 : 0.01;
  
  const categoriesLabels = getCategoriesLabels();

  // Stepper
  const [currentStep, setCurrentStep] = useState(1);
  const [showRestorePrompt, setShowRestorePrompt] = useState(true);
  const [isRestoredFromDraft, setIsRestoredFromDraft] = useState(false);

  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  const [clientId, setClientId] = useState("");
  const [dateValidite, setDateValidite] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState("");
  
  // Form data from child components
  const [conteneursData, setConteneursData] = useState<DevisConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<DevisConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<DevisIndependantData | null>(null);

  // État de la remise
  const [remiseData, setRemiseData] = useState<RemiseData>({
    type: "none",
    valeur: 0,
    montantCalcule: 0,
  });

  // Auto-save hook
  const autoSave = useAutoSave<DevisDraftData>({
    key: 'nouveau_devis',
    debounceMs: 1500,
  });

  // Restore draft function
  const handleRestoreDraft = useCallback(() => {
    const draft = autoSave.restore();
    if (draft) {
      setCategorie(draft.categorie);
      setClientId(draft.clientId);
      setDateValidite(draft.dateValidite);
      setNotes(draft.notes);
      setCurrentStep(draft.currentStep || 1);
      setConteneursData(draft.conteneursData);
      setConventionnelData(draft.conventionnelData);
      setIndependantData(draft.independantData);
      setRemiseData(draft.remiseData || { type: "none", valeur: 0, montantCalcule: 0 });
      setIsRestoredFromDraft(true);
      setShowRestorePrompt(false);
      toast.success("Brouillon restauré avec succès");
    }
  }, [autoSave]);

  // Auto-save when form data changes
  useEffect(() => {
    // Ne pas sauvegarder si on n'a pas encore fait de choix
    if (!categorie && !clientId) return;

    const draftData: DevisDraftData = {
      categorie,
      clientId,
      dateValidite,
      notes,
      currentStep,
      conteneursData,
      conventionnelData,
      independantData,
      remiseData,
    };

    autoSave.save(draftData);
  }, [categorie, clientId, dateValidite, notes, currentStep, conteneursData, conventionnelData, independantData, remiseData]);

  const getMontantHT = (): number => {
    if (categorie === "conteneurs" && conteneursData) return conteneursData.montantHT;
    if (categorie === "conventionnel" && conventionnelData) return conventionnelData.montantHT;
    if (categorie === "operations_independantes" && independantData) return independantData.montantHT;
    return 0;
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

  // Calcul de l'étape courante automatiquement
  const calculateCurrentStep = () => {
    if (!categorie) return 1;
    if (!clientId) return 2;
    const hasContent = 
      (categorie === "conteneurs" && conteneursData && conteneursData.conteneurs.length > 0) ||
      (categorie === "conventionnel" && conventionnelData && conventionnelData.lots.length > 0) ||
      (categorie === "operations_independantes" && independantData && independantData.prestations.length > 0);
    if (!hasContent) return 3;
    return 4;
  };

  const handleCategorieChange = (value: CategorieDocument) => {
    setCategorie(value);
    setConteneursData(null);
    setConventionnelData(null);
    setIndependantData(null);
    setRemiseData({ type: "none", valeur: 0, montantCalcule: 0 });
    setCurrentStep(2);
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return !!categorie;
      case 2: return !!clientId;
      case 3: 
        if (categorie === "conteneurs") return conteneursData && conteneursData.numeroBL;
        if (categorie === "conventionnel") return conventionnelData && conventionnelData.numeroBL;
        if (categorie === "operations_independantes") return independantData && independantData.typeOperationIndep;
        return false;
      case 4: return true;
      default: return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { toast.error("Veuillez sélectionner un client"); return; }
    if (!categorie) { toast.error("Veuillez sélectionner une catégorie"); return; }
    
    if (categorie === "conteneurs" && !conteneursData?.numeroBL) {
      toast.error("Veuillez saisir le numéro de BL"); return;
    }
    if (categorie === "conventionnel" && !conventionnelData?.numeroBL) {
      toast.error("Veuillez saisir le numéro de BL"); return;
    }
    if (categorie === "operations_independantes" && !independantData?.typeOperationIndep) {
      toast.error("Veuillez sélectionner un type d'opération"); return;
    }

    const typeDocumentMap: Record<CategorieDocument, string> = {
      conteneurs: "Conteneur",
      conventionnel: "Lot",
      operations_independantes: "Independant"
    };

    const data: any = {
      client_id: parseInt(clientId),
      type_document: typeDocumentMap[categorie as CategorieDocument],
      date_arrivee: new Date().toISOString().split('T')[0],
      validite_jours: Math.ceil((new Date(dateValidite).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      notes: notes || null,
      remise_type: remiseData.type === "none" ? null : remiseData.type,
      remise_valeur: remiseData.type === "none" ? 0 : (remiseData.valeur || 0),
      remise_montant: remiseData.type === "none" ? 0 : (remiseData.montantCalcule || 0),
      lignes: [],
      conteneurs: [],
      lots: [],
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
      await createDevisMutation.mutateAsync(data);
      // Clear draft on successful creation
      autoSave.clear();
      navigate("/devis");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = loadingClients || loadingArmateurs || loadingTransitaires || loadingRepresentants;
  const loadError = clientsError || armateursError || transitairesError || representantsError || taxesError;

  if (loadError) {
    return (
      <MainLayout title="Nouveau devis">
        <ApiErrorState
          title="Impossible de charger les données (API / CORS)"
          error={loadError}
          onRetry={() => window.location.reload()}
        />
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout title="Nouveau devis">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Nouveau devis">
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/devis")} className="transition-all duration-200 hover:scale-110">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />Nouveau devis
            </h1>
            <p className="text-muted-foreground text-sm">Créer un nouveau devis client</p>
          </div>
          {/* Auto-save indicator */}
          <AutoSaveIndicator
            hasDraft={autoSave.hasDraft}
            lastSaved={autoSave.lastSaved}
            isSaving={autoSave.isSaving}
            onRestore={handleRestoreDraft}
            onClear={autoSave.clear}
          />
        </div>
      </div>

      {/* Prompt de restauration si brouillon existant */}
      {showRestorePrompt && autoSave.hasDraft && !isRestoredFromDraft && (
        <AutoSaveIndicator
          hasDraft={autoSave.hasDraft}
          lastSaved={autoSave.lastSaved}
          isSaving={false}
          onRestore={handleRestoreDraft}
          onClear={autoSave.clear}
          showRestorePrompt={true}
          onDismissPrompt={() => setShowRestorePrompt(false)}
        />
      )}

      {/* Stepper */}
      <DevisStepper 
        currentStep={currentStep} 
        onStepClick={(step) => {
          if (step <= calculateCurrentStep() + 1) {
            setCurrentStep(step);
          }
        }} 
      />

      {createDevisMutation.error && (
        <div className="mb-6 animate-fade-in">
          <ApiErrorState
            variant="inline"
            title="Erreur lors de la création du devis"
            error={createDevisMutation.error}
            onRetry={() => createDevisMutation.reset()}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Étape 1: Catégorie */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <CategorieSelector onSelect={handleCategorieChange} />
              </div>
            )}

            {/* Étape 2: Client */}
            {currentStep === 2 && categorie && (
              <div className="animate-fade-in space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2 transition-all duration-200 hover:scale-105">
                    {categoriesLabels[categorie].icon}
                    <span>{categoriesLabels[categorie].label}</span>
                  </Badge>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setCategorie(""); setCurrentStep(1); }} className="text-muted-foreground transition-all duration-200 hover:text-primary">
                    Changer
                  </Button>
                </div>

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
            {currentStep === 3 && categorie && (
              <div className="animate-fade-in">
                {categorie === "conteneurs" && (
                  <DevisConteneursForm
                    armateurs={armateurs}
                    transitaires={transitaires}
                    representants={representants}
                    onDataChange={setConteneursData}
                    initialData={isRestoredFromDraft && conteneursData ? {
                      typeOperation: conteneursData.typeOperation,
                      numeroBL: conteneursData.numeroBL,
                      armateurId: conteneursData.armateurId,
                      transitaireId: conteneursData.transitaireId,
                      representantId: conteneursData.representantId,
                      conteneurs: conteneursData.conteneurs,
                    } : undefined}
                  />
                )}

                {categorie === "conventionnel" && (
                  <DevisConventionnelForm 
                    onDataChange={setConventionnelData}
                    initialData={isRestoredFromDraft && conventionnelData ? {
                      numeroBL: conventionnelData.numeroBL,
                      lieuChargement: conventionnelData.lieuChargement,
                      lieuDechargement: conventionnelData.lieuDechargement,
                      lots: conventionnelData.lots,
                    } : undefined}
                  />
                )}

                {categorie === "operations_independantes" && (
                  <DevisIndependantForm 
                    onDataChange={setIndependantData}
                    initialData={isRestoredFromDraft && independantData ? {
                      typeOperationIndep: independantData.typeOperationIndep,
                      lieuChargement: independantData.lieuChargement,
                      lieuDechargement: independantData.lieuDechargement,
                      prestations: independantData.prestations,
                    } : undefined}
                  />
                )}
              </div>
            )}

            {/* Étape 4: Récapitulatif */}
            {currentStep === 4 && categorie && (
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
                  <RemiseInput montantHT={montantHT} onChange={setRemiseData} />
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
            {currentStep === 5 && categorie && (
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
                      Vérifiez les informations dans l'aperçu à droite avant de créer le devis.
                    </p>
                    <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">Prêt à créer</p>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          Montant TTC: {montantTTC.toLocaleString("fr-FR")} XAF
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation buttons */}
            {categorie && (
              <div className="flex justify-between gap-4 pb-6 animate-fade-in">
                <div>
                  {currentStep > 1 && (
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
                  <Button type="button" variant="outline" onClick={() => navigate("/devis")} disabled={createDevisMutation.isPending} className="transition-all duration-200 hover:scale-105">
                    Annuler
                  </Button>
                  
                  {currentStep < 5 ? (
                    <Button 
                      type="button" 
                      onClick={handleNextStep}
                      disabled={!canProceedToNext()}
                      className="gap-2 transition-all duration-200 hover:scale-105"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md" disabled={createDevisMutation.isPending}>
                      {createDevisMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Créer le devis
                    </Button>
                  )}
                </div>
              </div>
            )}
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
