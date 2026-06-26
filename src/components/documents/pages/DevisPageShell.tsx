import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { ApiErrorState } from "@/components/ApiErrorState";
import {
  useDevisById,
  useCreateDevis,
  useUpdateDevis,
} from "@/hooks/use-commercial";
import { useAutoSave } from "@/hooks/use-auto-save";
import { AutoSaveIndicator, DevisForm, useDevisForm } from "@/components/devis/shared";
import { CategorieDocument, TypeOperationConteneur } from "@/types/documents";
import type { DevisConteneursData } from "@/components/devis/forms/DevisConteneursForm";
import type { DevisConventionnelData } from "@/components/devis/forms/DevisConventionnelForm";
import type { DevisIndependantData } from "@/components/devis/forms/DevisIndependantForm";
import type { RemiseData } from "@/components/shared/RemiseInput";
import DocumentPageHeader, { DEVIS_STATUT_BADGES } from "./DocumentPageHeader";
import { useDocumentPageData } from "./useDocumentPageData";

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

interface Props {
  mode: "create" | "edit";
}

export default function DevisPageShell({ mode }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const {
    clients,
    armateurs,
    transitaires,
    representants,
    isLoading: refsLoading,
    error: refsError,
  } = useDocumentPageData();

  const { data: devisData, isLoading: loadingDevis } = useDevisById(
    mode === "edit" ? id ?? "" : "",
  );
  const createMutation = useCreateDevis();
  const updateMutation = useUpdateDevis();
  const submitMutation = mode === "create" ? createMutation : updateMutation;

  const api = useDevisForm();
  const [currentStep, setCurrentStep] = useState(mode === "create" ? 1 : 2);
  const [isInitialized, setIsInitialized] = useState(mode === "create");
  const [showRestorePrompt, setShowRestorePrompt] = useState(true);
  const [isRestoredFromDraft, setIsRestoredFromDraft] = useState(false);

  // --- Mode edit : hydratation depuis API -----------------------------------
  useEffect(() => {
    if (mode !== "edit" || !devisData || isInitialized) return;

    api.setClientId(String(devisData.client_id || ""));
    api.setDateValidite(devisData.date_validite || "");
    api.setNotes(devisData.notes || "");

    const cat = (devisData as any).categorie ||
      (devisData.conteneurs?.length > 0 ? "conteneurs"
        : devisData.lots?.length > 0 ? "conventionnel"
        : devisData.lignes?.length > 0 ? "operations_independantes"
        : "conteneurs");
    api.setCategorie(cat as CategorieDocument);

    if ((devisData as any).remise_type && (devisData as any).remise_type !== "none") {
      api.setRemiseData({
        type: (devisData as any).remise_type,
        valeur: (devisData as any).remise_valeur || 0,
        montantCalcule: (devisData as any).remise_montant || 0,
      });
    }

    const taxesSelectionJson = (devisData as any).taxes_selection;
    if (taxesSelectionJson?.selected_tax_codes) {
      api.setTaxesSelectionData({
        selectedTaxCodes: taxesSelectionJson.selected_tax_codes || [],
        hasExoneration: taxesSelectionJson.has_exoneration || false,
        exoneratedTaxCodes: taxesSelectionJson.exonerated_tax_codes || [],
        motifExoneration: taxesSelectionJson.motif_exoneration || "",
      });
      api.taxesInitRef.current = true;
    }

    setIsInitialized(true);
  }, [mode, devisData, isInitialized, api]);

  // --- Init taxes recommandées (les 2 modes) --------------------------------
  useEffect(() => {
    if (api.taxesInitRef.current) return;
    if (api.taxesLoading || api.availableTaxes.length === 0) return;
    if (!isInitialized) return;
    api.taxesInitRef.current = true;
    const recommendedCodes = api.availableTaxes
      .filter((t) => t.obligatoire)
      .map((t) => t.code.toUpperCase());
    api.setTaxesSelectionData((prev) =>
      prev.selectedTaxCodes.length > 0
        ? prev
        : { ...prev, selectedTaxCodes: recommendedCodes },
    );
  }, [api.taxesLoading, api.availableTaxes, isInitialized]);

  // --- Mode create : auto-save ----------------------------------------------
  const autoSave = useAutoSave<DevisDraftData>({
    key: "nouveau_devis",
    debounceMs: 1500,
  });

  const handleRestoreDraft = useCallback(() => {
    const draft = autoSave.restore();
    if (!draft) return;
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
  }, [autoSave, api]);

  useEffect(() => {
    if (mode !== "create") return;
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
  }, [
    mode,
    api.categorie,
    api.clientId,
    api.dateValidite,
    api.notes,
    currentStep,
    api.conteneursData,
    api.conventionnelData,
    api.independantData,
    api.remiseData,
  ]);

  // --- Mode edit : initialChildData ----------------------------------------
  const initialChildData = useMemo(() => {
    if (mode !== "edit" || !devisData) return undefined;
    return {
      conteneurs: {
        typeOperation: ((devisData as any).type_operation as any) || "",
        numeroBL: (devisData as any).numero_bl || (devisData as any).bl_numero || "",
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
      },
      conventionnel: {
        numeroBL: (devisData as any).numero_bl || (devisData as any).bl_numero || "",
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
      },
      independant: {
        typeOperationIndep: (devisData as any).type_operation_indep || "",
        lieuChargement: (devisData as any).lieu_chargement || "",
        lieuDechargement: (devisData as any).lieu_dechargement || "",
        prestations: devisData.lignes?.map((l: any) => ({
          id: String(l.id),
          typeOperation: (l.type_operation || "") as any,
          description: l.description || "",
          lieuDepart: l.lieu_depart || "",
          lieuArrivee: l.lieu_arrivee || "",
          pointDepart: l.point_depart || l.lieu_depart || "",
          pointArrivee: l.point_arrivee || l.lieu_arrivee || "",
          typeTransport: l.type_transport || "",
          modeTrajet: l.mode_trajet || "",
          materiel: l.materiel || "",
          nombreJours: l.nombre_jours || undefined,
          dateDebut: l.date_debut || "",
          dateFin: l.date_fin || "",
          quantite: l.quantite || 1,
          prixUnitaire: l.prix_unitaire || 0,
          montantHT: (l.quantite || 1) * (l.prix_unitaire || 0),
        })) || [],
      },
    };
  }, [mode, devisData]);

  const selectedClient = useMemo(
    () => clients.find((c: any) => String(c.id) === api.clientId),
    [clients, api.clientId],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api.clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (mode === "create" && !api.categorie) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }
    if (mode === "create") {
      if (api.categorie === "conteneurs" && !api.conteneursData?.numeroBL) {
        toast.error("Veuillez saisir le numéro de BL");
        return;
      }
      if (api.categorie === "conventionnel" && !api.conventionnelData?.numeroBL) {
        toast.error("Veuillez saisir le numéro de BL");
        return;
      }
      if (api.categorie === "operations_independantes") {
        const prestations = api.independantData?.prestations ?? [];
        const hasType = prestations.some((p: any) => p?.typeOperation);
        if (!hasType && !api.independantData?.typeOperationIndep) {
          toast.error("Veuillez sélectionner un type d'opération sur au moins une ligne");
          return;
        }
      }
    }

    try {
      if (mode === "create") {
        const data = api.buildPayload({
          date_arrivee: new Date().toISOString().split("T")[0],
          validite_jours: Math.ceil(
            (new Date(api.dateValidite).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          ),
          lignes: [],
          conteneurs: [],
          lots: [],
        });
        await createMutation.mutateAsync(data);
        autoSave.clear();
      } else {
        const data = api.buildPayload();
        await updateMutation.mutateAsync({ id: id!, data });
      }
      navigate("/devis");
    } catch (error: any) {
      console.error("[DEBUG] Erreur soumission devis:", error?.response?.data || error);
    }
  };

  const isLoading = refsLoading || (mode === "edit" && loadingDevis);

  if (refsError) {
    return (
      <MainLayout title={mode === "create" ? "Nouveau devis" : "Modifier devis"}>
        <ApiErrorState
          title="Impossible de charger les données (API / CORS)"
          error={refsError}
          onRetry={() => window.location.reload()}
        />
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout title={mode === "create" ? "Nouveau devis" : "Chargement..."}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (mode === "edit" && !devisData) {
    return (
      <MainLayout title="Devis non trouvé">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold mb-2">Devis non trouvé</h2>
          <Button onClick={() => navigate("/devis")}>Retour aux devis</Button>
        </div>
      </MainLayout>
    );
  }

  const pageTitle =
    mode === "create" ? "Nouveau devis" : `Modifier ${devisData!.numero}`;
  const subtitle =
    mode === "create"
      ? "Créer un nouveau devis client"
      : `Créé le ${new Date(devisData!.created_at).toLocaleDateString("fr-FR")}`;

  return (
    <MainLayout title={pageTitle}>
      <DocumentPageHeader
        mode={mode}
        backTo="/devis"
        icon={<FileText className="h-6 w-6 text-primary" />}
        title={pageTitle}
        subtitle={subtitle}
        statut={mode === "edit" ? devisData!.statut : undefined}
        statutBadgeMap={DEVIS_STATUT_BADGES}
        autoSave={
          mode === "create"
            ? {
                hasDraft: autoSave.hasDraft,
                lastSaved: autoSave.lastSaved,
                isSaving: autoSave.isSaving,
                onRestore: handleRestoreDraft,
                onClear: autoSave.clear,
              }
            : undefined
        }
      />

      {mode === "create" &&
        showRestorePrompt &&
        autoSave.hasDraft &&
        !isRestoredFromDraft && (
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

      {mode === "create" && createMutation.error && (
        <div className="mb-6 animate-fade-in">
          <ApiErrorState
            variant="inline"
            title="Erreur lors de la création du devis"
            error={createMutation.error}
            onRetry={() => createMutation.reset()}
          />
        </div>
      )}

      <DevisForm
        mode={mode}
        api={api}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        clients={clients}
        armateurs={armateurs}
        transitaires={transitaires}
        representants={representants}
        isSubmitting={submitMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/devis")}
        initialChildData={initialChildData}
        isRestoredFromDraft={isRestoredFromDraft}
        selectedClient={selectedClient}
      />
    </MainLayout>
  );
}
