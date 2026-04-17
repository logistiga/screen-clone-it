import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { ApiErrorState } from "@/components/ApiErrorState";
import { useClients, useArmateurs, useTransitaires, useRepresentants, useCreateDevis } from "@/hooks/use-commercial";
import { CategorieDocument } from "@/types/documents";
import { AutoSaveIndicator, DevisForm, useDevisForm } from "@/components/devis/shared";
import type { DevisConteneursData } from "@/components/devis/forms/DevisConteneursForm";
import type { DevisConventionnelData } from "@/components/devis/forms/DevisConventionnelForm";
import type { DevisIndependantData } from "@/components/devis/forms/DevisIndependantForm";
import { RemiseData } from "@/components/shared/RemiseInput";
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

const toArray = (v: any): any[] =>
  Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : [];

export default function NouveauDevisPage() {
  const navigate = useNavigate();

  const { data: clientsData, isLoading: loadingClients, error: clientsError } = useClients({ per_page: 500 });
  const { data: armateursData, isLoading: loadingArmateurs, error: armateursError } = useArmateurs();
  const { data: transitairesData, isLoading: loadingTransitaires, error: transitairesError } = useTransitaires();
  const { data: representantsData, isLoading: loadingRepresentants, error: representantsError } = useRepresentants({ per_page: 500 });
  const createDevisMutation = useCreateDevis();

  const clients = clientsData?.data || [];
  const armateurs = toArray(armateursData);
  const transitaires = toArray(transitairesData);
  const representants = toArray(representantsData);

  const api = useDevisForm();
  const [currentStep, setCurrentStep] = useState(1);
  const [showRestorePrompt, setShowRestorePrompt] = useState(true);
  const [isRestoredFromDraft, setIsRestoredFromDraft] = useState(false);

  // Init taxes recommandées
  useEffect(() => {
    if (api.taxesInitRef.current) return;
    if (api.taxesLoading || api.availableTaxes.length === 0) return;
    api.taxesInitRef.current = true;
    const recommendedCodes = api.availableTaxes.filter((t) => t.obligatoire).map((t) => t.code.toUpperCase());
    api.setTaxesSelectionData((prev) =>
      prev.selectedTaxCodes.length > 0 ? prev : { ...prev, selectedTaxCodes: recommendedCodes }
    );
  }, [api.taxesLoading, api.availableTaxes]);

  // Auto-save
  const autoSave = useAutoSave<DevisDraftData>({ key: "nouveau_devis", debounceMs: 1500 });

  const handleRestoreDraft = useCallback(() => {
    const draft = autoSave.restore();
    if (draft) {
      api.setCategorie(draft.categorie);
      api.setClientId(draft.clientId);
      api.setDateValidite(draft.dateValidite);
      api.setNotes(draft.notes);
      setCurrentStep(draft.currentStep || 1);
      api.setConteneursData(draft.conteneursData);
      api.setConventionnelData(draft.conventionnelData);
      api.setIndependantData(draft.independantData);
      api.setRemiseData(draft.remiseData || { type: "none", valeur: 0, montantCalcule: 0 });
      setIsRestoredFromDraft(true);
      setShowRestorePrompt(false);
      toast.success("Brouillon restauré avec succès");
    }
  }, [autoSave, api]);

  useEffect(() => {
    if (!api.categorie && !api.clientId) return;
    autoSave.save({
      categorie: api.categorie,
      clientId: api.clientId,
      dateValidite: api.dateValidite,
      notes: api.notes,
      currentStep,
      conteneursData: api.conteneursData,
      conventionnelData: api.conventionnelData,
      independantData: api.independantData,
      remiseData: api.remiseData,
    });
  }, [api.categorie, api.clientId, api.dateValidite, api.notes, currentStep, api.conteneursData, api.conventionnelData, api.independantData, api.remiseData]);

  const selectedClient = useMemo(
    () => clients.find((c: any) => String(c.id) === api.clientId),
    [clients, api.clientId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api.clientId) { toast.error("Veuillez sélectionner un client"); return; }
    if (!api.categorie) { toast.error("Veuillez sélectionner une catégorie"); return; }

    if (api.categorie === "conteneurs" && !api.conteneursData?.numeroBL) {
      toast.error("Veuillez saisir le numéro de BL"); return;
    }
    if (api.categorie === "conventionnel" && !api.conventionnelData?.numeroBL) {
      toast.error("Veuillez saisir le numéro de BL"); return;
    }
    if (api.categorie === "operations_independantes" && !api.independantData?.typeOperationIndep) {
      toast.error("Veuillez sélectionner un type d'opération"); return;
    }

    const data = api.buildPayload({
      date_arrivee: new Date().toISOString().split("T")[0],
      validite_jours: Math.ceil(
        (new Date(api.dateValidite).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      lignes: [],
      conteneurs: [],
      lots: [],
    });

    try {
      await createDevisMutation.mutateAsync(data);
      autoSave.clear();
      navigate("/devis");
    } catch (error: any) {
      console.error("[DEBUG] Erreur création devis:", error?.response?.data || error);
    }
  };

  const isLoading = loadingClients || loadingArmateurs || loadingTransitaires || loadingRepresentants;
  const loadError = clientsError || armateursError || transitairesError || representantsError;

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
          <AutoSaveIndicator
            hasDraft={autoSave.hasDraft}
            lastSaved={autoSave.lastSaved}
            isSaving={autoSave.isSaving}
            onRestore={handleRestoreDraft}
            onClear={autoSave.clear}
          />
        </div>
      </div>

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

      <DevisForm
        mode="create"
        api={api}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        clients={clients}
        armateurs={armateurs}
        transitaires={transitaires}
        representants={representants}
        isSubmitting={createDevisMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/devis")}
        isRestoredFromDraft={isRestoredFromDraft}
        selectedClient={selectedClient}
      />
    </MainLayout>
  );
}
