import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Receipt, Save, Loader2, Users, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// Select inutilisé après remplacement par ClientCombobox
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  CategorieDocument,
  getCategoriesLabels,
  typesOperationConteneur,
} from "@/types/documents";
import {
  FactureConteneursForm,
  FactureConventionnelForm,
  FactureIndependantForm,
  FactureConteneursData,
  FactureConventionnelData,
  FactureIndependantData,
} from "@/components/factures/forms";
import { RecapitulatifCard, AutoSaveIndicator } from "@/components/devis/shared";
import { FactureStepper, FacturePreview } from "@/components/factures/shared";
import { useClients, useArmateurs, useTransitaires, useRepresentants, useCreateFacture } from "@/hooks/use-commercial";
import { useAutoSave } from "@/hooks/use-auto-save";
import { extractApiErrorInfo } from "@/lib/api-error";
import RemiseInput, { RemiseData } from "@/components/shared/RemiseInput";
import { ClientCombobox } from "@/components/shared/ClientCombobox";
import TaxesSelector, { TaxesSelectionData } from "@/components/shared/TaxesSelector";
import { useDocumentTaxes, areTaxesSelectionDataEqual } from "@/hooks/useDocumentTaxes";
import {
  validateFactureConteneurs,
  validateFactureConventionnel,
  validateFactureIndependant,
} from "@/lib/validations/facture-schemas";
import ConfirmationSaveModal from "@/components/shared/ConfirmationSaveModal";

interface DraftData {
  categorie: CategorieDocument | "";
  clientId: string;
  dateEcheance: string;
  notes: string;
  currentStep: number;
  conteneursData: FactureConteneursData | null;
  conventionnelData: FactureConventionnelData | null;
  independantData: FactureIndependantData | null;
  remiseData: RemiseData;
  taxesSelectionData: TaxesSelectionData;
}

export default function NouvelleFacturePage() {
  const navigate = useNavigate();
  
  const { data: clientsData } = useClients({ per_page: 500 });
  const { data: armateursData } = useArmateurs();
  const { data: transitairesData } = useTransitaires();
  const { data: representantsData } = useRepresentants({ per_page: 500 });
  const createFactureMutation = useCreateFacture();
  
  // Hook unifié pour les taxes - stabilisé
  const { 
    taxRates, 
    availableTaxes, 
    isLoading: taxesLoading,
    getInitialTaxesSelection,
    calculateTaxes,
    toApiPayload 
  } = useDocumentTaxes();
  
  const clients = clientsData?.data || [];
  const armateurs = armateursData || [];
  const transitaires = transitairesData || [];
  const representants = representantsData || [];
  
  const categoriesLabels = getCategoriesLabels();

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [showRestorePrompt, setShowRestorePrompt] = useState(true);
  const [isRestoredFromDraft, setIsRestoredFromDraft] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  const [clientId, setClientId] = useState("");
  const [dateEcheance, setDateEcheance] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState("");

  const [conteneursData, setConteneursData] = useState<FactureConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<FactureConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<FactureIndependantData | null>(null);

  const [remiseData, setRemiseData] = useState<RemiseData>({
    type: "none",
    valeur: 0,
    montantCalcule: 0,
  });

  // État de la sélection des taxes - nouvelle structure avec codes
  const [taxesSelectionData, setTaxesSelectionData] = useState<TaxesSelectionData>(() => ({
    selectedTaxCodes: ['TVA', 'CSS'], // Taxes obligatoires par défaut
    hasExoneration: false,
    exoneratedTaxCodes: [],
    motifExoneration: "",
  }));
  
  // Ref pour éviter les initialisations multiples
  const taxesInitRef = useRef(false);
  
  // Synchroniser les taxes quand elles sont chargées depuis l'API (une seule fois)
  useEffect(() => {
    // Guard: ne s'exécute qu'une seule fois
    if (taxesInitRef.current) return;
    if (taxesLoading || availableTaxes.length === 0) return;
    
    taxesInitRef.current = true;
    
    // Sélectionner toutes les taxes obligatoires par défaut (TVA, CSS)
    const mandatoryCodes = availableTaxes
      .filter(t => t.obligatoire)
      .map(t => t.code.toUpperCase());
    
    // Si aucune taxe obligatoire, sélectionner TVA et CSS par défaut
    const defaultCodes = mandatoryCodes.length > 0 
      ? mandatoryCodes 
      : availableTaxes.map(t => t.code.toUpperCase()).filter(c => c === 'TVA' || c === 'CSS');
    
    // S'assurer qu'on a au moins TVA et CSS
    const finalCodes = defaultCodes.length > 0 ? defaultCodes : ['TVA', 'CSS'];
    
    setTaxesSelectionData(prev => {
      // Ne pas écraser si déjà configuré (ex: restauration draft)
      if (prev.selectedTaxCodes.length > 0) return prev;
      return { ...prev, selectedTaxCodes: finalCodes };
    });
  }, [taxesLoading, availableTaxes]);
  
  // Handler stable pour TaxesSelector avec comparaison profonde inline
  const handleTaxesChange = useCallback((next: TaxesSelectionData) => {
    setTaxesSelectionData(prev => {
      // Comparaison stricte pour éviter les setState inutiles
      const same =
        prev.hasExoneration === next.hasExoneration &&
        prev.motifExoneration === next.motifExoneration &&
        prev.selectedTaxCodes.length === next.selectedTaxCodes.length &&
        prev.selectedTaxCodes.every((v, i) => v === next.selectedTaxCodes[i]) &&
        prev.exoneratedTaxCodes.length === next.exoneratedTaxCodes.length &&
        prev.exoneratedTaxCodes.every((v, i) => v === next.exoneratedTaxCodes[i]);
      return same ? prev : next;
    });
  }, []);
  // Auto-save
  const { save, clear, restore, hasDraft, lastSaved, isSaving } = useAutoSave<DraftData>({
    key: 'nouvelle_facture',
    debounceMs: 1500,
  });

  // Auto-save on data changes
  useEffect(() => {
    if (categorie || clientId || notes) {
      save({
        categorie,
        clientId,
        dateEcheance,
        notes,
        currentStep,
        conteneursData,
        conventionnelData,
        independantData,
        remiseData,
        taxesSelectionData,
      });
    }
  }, [categorie, clientId, dateEcheance, notes, currentStep, conteneursData, conventionnelData, independantData, remiseData, taxesSelectionData, save]);

  const handleRestoreDraft = () => {
    const draft = restore();
    if (draft) {
      setCategorie(draft.categorie);
      setClientId(draft.clientId);
      setDateEcheance(draft.dateEcheance);
      setNotes(draft.notes);
      setConteneursData(draft.conteneursData);
      setConventionnelData(draft.conventionnelData);
      setIndependantData(draft.independantData);
      setRemiseData(draft.remiseData || { type: "none", valeur: 0, montantCalcule: 0 });
      setTaxesSelectionData(draft.taxesSelectionData || getInitialTaxesSelection());
      setCurrentStep(draft.currentStep || 1);
      setIsRestoredFromDraft(true);
      taxesInitRef.current = true; // Évite la réinitialisation
      toast.success("Brouillon restauré avec succès");
    }
    setShowRestorePrompt(false);
  };

  const getMontantHT = (): number => {
    if (categorie === "conteneurs" && conteneursData) return conteneursData.montantHT;
    if (categorie === "conventionnel" && conventionnelData) return conventionnelData.montantHT;
    if (categorie === "operations_independantes" && independantData) return independantData.montantHT;
    return 0;
  };

  const montantHT = getMontantHT();
  const montantHTApresRemise = montantHT - remiseData.montantCalcule;
  
  // Calculer les taxes via le hook unifié
  const { tva, css, totalTaxes } = calculateTaxes(montantHTApresRemise, taxesSelectionData);
  const montantTTC = montantHTApresRemise + totalTaxes;

  const handleCategorieChange = (value: CategorieDocument) => {
    setCategorie(value);
    setConteneursData(null);
    setConventionnelData(null);
    setIndependantData(null);
    setRemiseData({ type: "none", valeur: 0, montantCalcule: 0 });
    setTaxesSelectionData(getInitialTaxesSelection());
    setCurrentStep(2);
  };

  // Stepper navigation
  const handleStepClick = (step: number) => {
    if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  };

  const canProceedToStep = (step: number): boolean => {
    if (step === 2) return !!categorie;
    if (step === 3) return !!categorie && !!clientId;
    if (step === 4) {
      if (categorie === "conteneurs") return !!conteneursData && conteneursData.conteneurs.length > 0;
      if (categorie === "conventionnel") return !!conventionnelData && conventionnelData.lots.length > 0;
      if (categorie === "operations_independantes") return !!independantData && independantData.prestations.length > 0;
    }
    return true;
  };

  const handleNextStep = () => {
    if (canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    } else {
      if (currentStep === 1 && !categorie) {
        toast.error("Veuillez sélectionner une catégorie");
      } else if (currentStep === 2 && !clientId) {
        toast.error("Veuillez sélectionner un client");
      } else if (currentStep === 3) {
        toast.error("Veuillez compléter les détails de la facture");
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Fonction de validation + ouverture du modal (appelée par bouton, PAS par form submit)
  const handleOpenConfirmModal = () => {
    if (!clientId) { toast.error("Veuillez sélectionner un client"); return; }
    if (!categorie) { toast.error("Veuillez sélectionner une catégorie"); return; }

    // Validation Zod selon la catégorie
    if (categorie === "conteneurs" && conteneursData) {
      const validation = validateFactureConteneurs(conteneursData);
      if (!validation.success) {
        toast.error("Erreurs de validation", {
          description: validation.firstError || "Veuillez corriger les erreurs dans le formulaire",
        });
        console.log("Validation errors:", validation.errors);
        return;
      }
    } else if (categorie === "conventionnel" && conventionnelData) {
      const validation = validateFactureConventionnel(conventionnelData);
      if (!validation.success) {
        toast.error("Erreurs de validation", {
          description: validation.firstError || "Veuillez corriger les erreurs dans le formulaire",
        });
        console.log("Validation errors:", validation.errors);
        return;
      }
    } else if (categorie === "operations_independantes" && independantData) {
      const validation = validateFactureIndependant(independantData);
      if (!validation.success) {
        toast.error("Erreurs de validation", {
          description: validation.firstError || "Veuillez corriger les erreurs dans le formulaire",
        });
        console.log("Validation errors:", validation.errors);
        return;
      }
    }

    // Validation exonération : si activée, le motif est obligatoire
    if (taxesSelectionData.hasExoneration && !taxesSelectionData.motifExoneration?.trim()) {
      toast.error("Veuillez renseigner le motif d'exonération");
      return;
    }

    // Ouvrir le modal de confirmation
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    let lignesData: any[] = [];
    let conteneursDataForApi: any[] = [];
    let lotsData: any[] = [];

    if (categorie === "conteneurs" && conteneursData) {
      conteneursDataForApi = conteneursData.conteneurs.map((c) => ({
        numero: c.numero,
        type: "DRY",
        taille: c.taille,
        description: c.description,
        prix_unitaire: Number(c.prixUnitaire || 0),
        armateur_id: conteneursData.armateurId || null,
        operations: c.operations.map((op) => ({
          type_operation: op.type,
          description: typesOperationConteneur[op.type]?.label || op.description,
          quantite: op.quantite,
          prix_unitaire: op.prixUnitaire,
        })),
      }));
    } else if (categorie === "conventionnel" && conventionnelData) {
      lotsData = conventionnelData.lots.map(l => ({
        designation: l.description || l.numeroLot,
        quantite: l.quantite,
        poids: 0,
        volume: 0,
        prix_unitaire: l.prixUnitaire,
      }));
    } else if (categorie === "operations_independantes" && independantData) {
      lignesData = independantData.prestations.map(p => ({
        type_operation: independantData.typeOperationIndep,
        description: p.description,
        lieu_depart: p.lieuDepart,
        lieu_arrivee: p.lieuArrivee,
        date_debut: p.dateDebut,
        date_fin: p.dateFin,
        quantite: p.quantite,
        prix_unitaire: p.prixUnitaire,
      }));
    }

    const blNumero =
      (categorie === "conteneurs" ? conteneursData?.numeroBL : conventionnelData?.numeroBL) || null;

    const data = {
      client_id: Number(clientId),
      type_document:
        categorie === "conteneurs"
          ? "Conteneur"
          : categorie === "conventionnel"
            ? "Lot"
            : "Independant",
      categorie,
      bl_numero: blNumero,
      numero_bl: blNumero,
      date_echeance: dateEcheance,
      transitaire_id: conteneursData?.transitaireId ? Number(conteneursData.transitaireId) : null,
      representant_id: conteneursData?.representantId ? Number(conteneursData.representantId) : null,
      armateur_id: conteneursData?.armateurId ? Number(conteneursData.armateurId) : null,
      type_operation_indep: independantData?.typeOperationIndep || null,
      prime_transitaire: conteneursData?.primeTransitaire || 0,
      prime_representant: conteneursData?.primeRepresentant || 0,
      remise_type: remiseData.type !== "none" ? remiseData.type : null,
      remise_valeur: remiseData.type !== "none" ? remiseData.valeur : 0,
      remise_montant: remiseData.type !== "none" ? remiseData.montantCalcule : 0,
      // Exonérations - basées sur la nouvelle structure
      ...toApiPayload(taxesSelectionData),
      notes,
      lignes: lignesData,
      conteneurs: conteneursDataForApi,
      lots: lotsData,
    };

    try {
      await createFactureMutation.mutateAsync(data);
      clear();
      setShowConfirmModal(false);
      toast.success("Facture créée avec succès");
      navigate("/factures");
    } catch (error: any) {
      const info = extractApiErrorInfo(error);
      const responseData: any = (error as any)?.response?.data;
      const errors = responseData?.errors;
      const backendError = typeof responseData?.error === "string" ? responseData.error : undefined;

      let message = info.message || "Erreur lors de la création de la facture";

      if (errors && typeof errors === "object") {
        const firstKey = Object.keys(errors)[0];
        const firstVal = (errors as any)[firstKey];
        const firstMsg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
        if (firstMsg) message = firstMsg;
      }

      if (backendError) {
        toast.error(message, { description: backendError });
      } else {
        toast.error(message);
      }
      setShowConfirmModal(false);
    }
  };

  // Get client for preview
  const selectedClient = clients.find(c => String(c.id) === clientId);

  return (
    <MainLayout title="Nouvelle facture">
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/factures")} className="transition-all duration-200 hover:scale-110">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                Nouvelle facture
              </h1>
              <p className="text-muted-foreground text-sm">Créez une nouvelle facture client</p>
            </div>
          </div>
          <AutoSaveIndicator
            hasDraft={hasDraft}
            lastSaved={lastSaved}
            isSaving={isSaving}
            onRestore={handleRestoreDraft}
            onClear={clear}
          />
        </div>
      </div>

      {/* Restore prompt */}
      {showRestorePrompt && hasDraft && !isRestoredFromDraft && (
        <AutoSaveIndicator
          hasDraft={hasDraft}
          lastSaved={lastSaved}
          isSaving={isSaving}
          onRestore={handleRestoreDraft}
          onClear={clear}
          showRestorePrompt={true}
          onDismissPrompt={() => setShowRestorePrompt(false)}
        />
      )}

      {/* Stepper */}
      <FactureStepper 
        currentStep={currentStep} 
        categorie={categorie || undefined}
        onStepClick={handleStepClick}
      />

      <div 
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') {
            e.preventDefault();
          }
        }}
        className="animate-fade-in"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Catégorie */}
            {currentStep === 1 && (
              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Catégorie de facture</CardTitle>
                  <CardDescription>Sélectionnez le type de facture</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(Object.keys(categoriesLabels) as CategorieDocument[]).map((key) => {
                      const cat = categoriesLabels[key];
                      const isSelected = categorie === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleCategorieChange(key)}
                          className={`p-4 rounded-lg border-2 text-left transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                              {cat.icon}
                            </div>
                            <span className="font-semibold">{cat.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{cat.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Client */}
            {currentStep === 2 && (
              <Card className="transition-all duration-300 hover:shadow-lg animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Client & Échéance
                  </CardTitle>
                  <CardDescription>Sélectionnez le client et la date d'échéance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom du client *</Label>
                      <ClientCombobox
                        clients={clients}
                        value={clientId}
                        onChange={setClientId}
                        placeholder="Rechercher un client..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date d'échéance
                      </Label>
                      <Input 
                        type="date" 
                        value={dateEcheance} 
                        onChange={(e) => setDateEcheance(e.target.value)} 
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Détails */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                {categorie === "conteneurs" && (
                  <FactureConteneursForm
                    armateurs={armateurs}
                    transitaires={transitaires}
                    representants={representants}
                    onDataChange={setConteneursData}
                    initialData={isRestoredFromDraft && conteneursData ? conteneursData : undefined}
                  />
                )}

                {categorie === "conventionnel" && (
                  <FactureConventionnelForm 
                    onDataChange={setConventionnelData} 
                    initialData={isRestoredFromDraft && conventionnelData ? conventionnelData : undefined}
                  />
                )}

                {categorie === "operations_independantes" && (
                  <FactureIndependantForm 
                    onDataChange={setIndependantData} 
                    initialData={isRestoredFromDraft && independantData ? independantData : undefined}
                  />
                )}

                {/* Notes */}
                <Card className="transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Notes / Observations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Ajouter des notes ou observations..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </CardContent>
                </Card>

                {/* Remise */}
                {montantHT > 0 && (
                  <RemiseInput montantHT={montantHT} onChange={setRemiseData} />
                )}
              </div>
            )}

            {/* Step 4: Récapitulatif */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                {/* Sélection des taxes */}
                {montantHTApresRemise > 0 && (
                  <TaxesSelector
                    taxes={availableTaxes}
                    montantHT={montantHTApresRemise}
                    onChange={handleTaxesChange}
                    value={taxesSelectionData}
                  />
                )}

                <RecapitulatifCard
                  montantHT={montantHT}
                  tva={tva}
                  css={css}
                  montantTTC={montantTTC}
                  tauxTva={taxRates.TVA}
                  tauxCss={taxRates.CSS}
                  remiseMontant={remiseData.montantCalcule}
                  remiseType={remiseData.type}
                  remiseValeur={remiseData.valeur}
                  {...toApiPayload(taxesSelectionData)}
                />
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePrevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              {currentStep < 4 ? (
                <Button 
                  type="button" 
                  onClick={handleNextStep}
                  disabled={!canProceedToStep(currentStep + 1)}
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={handleOpenConfirmModal}
                  size="lg" 
                  disabled={createFactureMutation.isPending}
                  className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
                >
                  {createFactureMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Créer la facture
                </Button>
              )}
            </div>
          </div>

          {/* Preview sidebar */}
          <div className="hidden lg:block">
            <FacturePreview
              categorie={categorie}
              client={selectedClient ? { id: selectedClient.id, nom: selectedClient.nom } : null}
              montantHT={montantHT}
              tva={tva}
              css={css}
              montantTTC={montantTTC}
              numeroBL={conteneursData?.numeroBL || conventionnelData?.numeroBL}
              dateEcheance={dateEcheance}
              typeOperation={conteneursData?.typeOperation}
              typeOperationIndep={independantData?.typeOperationIndep}
              conteneurs={conteneursData?.conteneurs}
              lots={conventionnelData?.lots?.map(l => ({ description: l.description || l.numeroLot, quantite: l.quantite }))}
              prestations={independantData?.prestations?.map(p => ({ description: p.description, quantite: p.quantite }))}
              notes={notes}
              remiseMontant={remiseData.montantCalcule}
              currentStep={currentStep}
            />
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      <ConfirmationSaveModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmSave}
        isLoading={createFactureMutation.isPending}
        type="facture"
        montantHT={montantHTApresRemise}
        tva={tva}
        css={css}
        montantTTC={montantTTC}
        remise={remiseData.montantCalcule}
        {...toApiPayload(taxesSelectionData)}
        clientName={selectedClient?.nom}
        categorie={categorie || undefined}
      />
    </MainLayout>
  );
}
