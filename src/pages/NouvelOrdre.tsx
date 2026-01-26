import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ship, Save, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  OrdreConteneursForm,
  OrdreConventionnelForm,
  OrdreIndependantForm,
  OrdreConteneursData,
  OrdreConventionnelData,
  OrdreIndependantData,
} from "@/components/ordres/forms";
import { RecapitulatifCard, AutoSaveIndicator } from "@/components/devis/shared";
import { OrdreStepper, OrdrePreview } from "@/components/ordres/shared";
import { useClients, useArmateurs, useTransitaires, useRepresentants, useCreateOrdre } from "@/hooks/use-commercial";
import { useAutoSave } from "@/hooks/use-auto-save";
import RemiseInput, { RemiseData } from "@/components/shared/RemiseInput";
import { ClientCombobox } from "@/components/shared/ClientCombobox";
import TaxesSelector, { TaxesSelectionData } from "@/components/shared/TaxesSelector";
import { useDocumentTaxes, areTaxesSelectionDataEqual } from "@/hooks/useDocumentTaxes";
import { Users } from "lucide-react";
import { FormError } from "@/components/ui/form-error";
import {
  validateOrdreConteneurs,
  validateOrdreConventionnel,
  validateOrdreIndependant,
} from "@/lib/validations/ordre-schemas";
import ConfirmationSaveModal from "@/components/shared/ConfirmationSaveModal";

interface DraftData {
  categorie: CategorieDocument | "";
  clientId: string;
  notes: string;
  currentStep: number;
  conteneursData: OrdreConteneursData | null;
  conventionnelData: OrdreConventionnelData | null;
  independantData: OrdreIndependantData | null;
  remiseData: RemiseData;
  taxesSelectionData: TaxesSelectionData;
}

export default function NouvelOrdrePage() {
  const navigate = useNavigate();
  
  // API hooks
  const { data: clientsData } = useClients({ per_page: 1000 });
  const { data: armateursData } = useArmateurs();
  const { data: transitairesData } = useTransitaires();
  const { data: representantsData } = useRepresentants();
  const createOrdreMutation = useCreateOrdre();
  
  // Hook unifié pour les taxes - stabilisé
  const { 
    taxRates, 
    availableTaxes, 
    isLoading: taxesLoading,
    getInitialTaxesSelection,
    calculateTaxes,
    toApiPayload 
  } = useDocumentTaxes();
  
  const clients = Array.isArray(clientsData?.data) ? clientsData.data : (Array.isArray(clientsData) ? clientsData : []);
  const armateurs = Array.isArray(armateursData) ? armateursData : [];
  const transitaires = Array.isArray(transitairesData) ? transitairesData : [];
  const representants = Array.isArray(representantsData) ? representantsData : [];
  
  const categoriesLabels = getCategoriesLabels();

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [showRestorePrompt, setShowRestorePrompt] = useState(true);
  const [isRestoredFromDraft, setIsRestoredFromDraft] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // État global
  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  
  // Données des formulaires par catégorie
  const [conteneursData, setConteneursData] = useState<OrdreConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<OrdreConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<OrdreIndependantData | null>(null);

  // État de la remise
  const [remiseData, setRemiseData] = useState<RemiseData>({
    type: "none",
    valeur: 0,
    montantCalcule: 0,
  });

  // État de la sélection des taxes - nouvelle structure avec codes
  // Initialisé vide, sera peuplé par l'effet ci-dessous (ou par draft)
  const [taxesSelectionData, setTaxesSelectionData] = useState<TaxesSelectionData>(() => ({
    selectedTaxCodes: [], // Vide initialement, peuplé par l'effet
    hasExoneration: false,
    exoneratedTaxCodes: [],
    motifExoneration: "",
  }));
  
  // Ref pour éviter les initialisations multiples
  const taxesInitRef = useRef(false);
  
  // Synchroniser les taxes recommandées quand elles sont chargées depuis l'API (une seule fois)
  // L'utilisateur peut ensuite les décocher librement pour créer un document "sans taxes"
  useEffect(() => {
    // Guard: ne s'exécute qu'une seule fois
    if (taxesInitRef.current) return;
    if (taxesLoading || availableTaxes.length === 0) return;
    
    taxesInitRef.current = true;
    
    // Sélectionner les taxes recommandées par défaut (obligatoire=true)
    const recommendedCodes = availableTaxes
      .filter(t => t.obligatoire)
      .map(t => t.code.toUpperCase());
    
    setTaxesSelectionData(prev => {
      // Ne pas écraser si déjà configuré (ex: restauration draft)
      // IMPORTANT: on vérifie avec une ref si c'est une restauration de draft
      if (prev.selectedTaxCodes.length > 0) return prev;
      // Pré-sélectionner les taxes recommandées (l'utilisateur peut les décocher)
      return { ...prev, selectedTaxCodes: recommendedCodes };
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
    key: 'nouvel_ordre',
    debounceMs: 1500,
  });

  // Auto-save on data changes
  useEffect(() => {
    if (categorie || clientId || notes) {
      save({
        categorie,
        clientId,
        notes,
        currentStep,
        conteneursData,
        conventionnelData,
        independantData,
        remiseData,
        taxesSelectionData,
      });
    }
  }, [categorie, clientId, notes, currentStep, conteneursData, conventionnelData, independantData, remiseData, taxesSelectionData, save]);

  const handleRestoreDraft = () => {
    const draft = restore();
    if (draft) {
      setCategorie(draft.categorie);
      setClientId(draft.clientId);
      setNotes(draft.notes);
      setConteneursData(draft.conteneursData);
      setConventionnelData(draft.conventionnelData);
      setIndependantData(draft.independantData);
      setRemiseData(draft.remiseData || { type: "none", valeur: 0, montantCalcule: 0 });
      
      // S'assurer que les taxes ont toujours au moins TVA et CSS sélectionnés
      const restoredTaxes = draft.taxesSelectionData || getInitialTaxesSelection();
      const validTaxes = {
        ...restoredTaxes,
        selectedTaxCodes: restoredTaxes.selectedTaxCodes?.length > 0 
          ? restoredTaxes.selectedTaxCodes 
          : ['TVA', 'CSS'],
      };
      setTaxesSelectionData(validTaxes);
      
      setCurrentStep(draft.currentStep || 1);
      setIsRestoredFromDraft(true);
      taxesInitRef.current = true; // Évite la réinitialisation
      toast.success("Brouillon restauré avec succès");
    }
    setShowRestorePrompt(false);
  };

  // Calcul du montant HT selon la catégorie
  const getMontantHT = (): number => {
    if (categorie === "conteneurs" && conteneursData) return conteneursData.montantHT;
    if (categorie === "conventionnel" && conventionnelData) return conventionnelData.montantHT;
    if (categorie === "operations_independantes" && independantData) return independantData.montantHT;
    return 0;
  };

  const montantHT = getMontantHT();
  const montantHTApresRemise = montantHT - remiseData.montantCalcule;
  
  // Calculer les taxes à appliquer via le hook unifié
  const { tva, css, totalTaxes } = calculateTaxes(montantHTApresRemise, taxesSelectionData);
  const montantTTC = montantHTApresRemise + totalTaxes;

  // Calculer l'état de validation pour chaque étape du stepper
  const stepsValidation = useMemo(() => {
    const isStep1Valid = !!categorie;
    const step1Details = categorie 
      ? [`Catégorie : ${categoriesLabels[categorie as CategorieDocument]}`]
      : ["Catégorie non sélectionnée"];

    const isStep2Valid = !!clientId;
    const selectedClient = clients.find(c => c.id === clientId);
    const step2Details = selectedClient
      ? [`Client : ${selectedClient.nom}`]
      : ["Client non sélectionné"];
    
    let isStep3Valid = false;
    let step3Details: string[] = [];
    
    if (categorie === "conteneurs") {
      const missing: string[] = [];
      const completed: string[] = [];
      
      if (!conteneursData?.typeOperation) missing.push("Type d'opération");
      else completed.push(`Type : ${conteneursData.typeOperation}`);
      
      if (!conteneursData?.numeroBL?.trim()) missing.push("Numéro BL");
      else completed.push(`BL : ${conteneursData.numeroBL}`);
      
      const validConteneurs = conteneursData?.conteneurs?.filter(c => c.numero?.trim()).length || 0;
      if (validConteneurs === 0) missing.push("Au moins un conteneur");
      else completed.push(`${validConteneurs} conteneur(s)`);
      
      isStep3Valid = missing.length === 0;
      step3Details = isStep3Valid ? completed : missing;
    } else if (categorie === "conventionnel") {
      const missing: string[] = [];
      const completed: string[] = [];
      
      if (!conventionnelData?.numeroBL?.trim()) missing.push("Numéro BL");
      else completed.push(`BL : ${conventionnelData.numeroBL}`);
      
      const validLots = conventionnelData?.lots?.filter(l => l.description?.trim()).length || 0;
      if (validLots === 0) missing.push("Au moins un lot");
      else completed.push(`${validLots} lot(s)`);
      
      isStep3Valid = missing.length === 0;
      step3Details = isStep3Valid ? completed : missing;
    } else if (categorie === "operations_independantes") {
      const missing: string[] = [];
      const completed: string[] = [];
      
      if (!independantData?.typeOperationIndep) missing.push("Type d'opération");
      else completed.push(`Type : ${independantData.typeOperationIndep}`);
      
      const validPrestations = independantData?.prestations?.filter(p => p.description?.trim()).length || 0;
      if (validPrestations === 0) missing.push("Au moins une prestation");
      else completed.push(`${validPrestations} prestation(s)`);
      
      isStep3Valid = missing.length === 0;
      step3Details = isStep3Valid ? completed : missing;
    }

    return {
      1: { isValid: isStep1Valid, hasError: currentStep > 1 && !isStep1Valid, details: step1Details },
      2: { isValid: isStep2Valid, hasError: currentStep > 2 && !isStep2Valid, details: step2Details },
      3: { isValid: isStep3Valid, hasError: currentStep > 3 && !isStep3Valid, details: step3Details },
      4: { isValid: true, hasError: false, details: ["Vérification finale"] },
    };
  }, [categorie, clientId, clients, conteneursData, conventionnelData, independantData, currentStep, categoriesLabels]);

  // Reset catégorie
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
    // Validation stricte avant de passer à l'étape suivante
    if (currentStep === 1) {
      if (!categorie) {
        toast.error("Veuillez sélectionner une catégorie", {
          description: "Choisissez le type d'ordre de travail pour continuer"
        });
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!clientId) {
        toast.error("Veuillez sélectionner un client", {
          description: "Le client est obligatoire pour continuer"
        });
        return;
      }
    }
    
    if (currentStep === 3) {
      // Validation détaillée selon la catégorie
      if (categorie === "conteneurs") {
        if (!conteneursData?.typeOperation) {
          toast.error("Veuillez sélectionner un type d'opération", {
            description: "Le type d'opération (import/export) est obligatoire"
          });
          return;
        }
        if (!conteneursData.numeroBL?.trim()) {
          toast.error("Veuillez saisir le numéro BL", {
            description: "Le numéro de connaissement est obligatoire"
          });
          return;
        }
        if (!conteneursData.conteneurs?.length || conteneursData.conteneurs.every(c => !c.numero?.trim())) {
          toast.error("Veuillez ajouter au moins un conteneur", {
            description: "Saisissez le numéro d'au moins un conteneur"
          });
          return;
        }
      } else if (categorie === "conventionnel") {
        if (!conventionnelData?.numeroBL?.trim()) {
          toast.error("Veuillez saisir le numéro BL", {
            description: "Le numéro de connaissement est obligatoire"
          });
          return;
        }
        if (!conventionnelData.lots?.length || conventionnelData.lots.every(l => !l.description?.trim())) {
          toast.error("Veuillez ajouter au moins un lot", {
            description: "Saisissez la description d'au moins un lot"
          });
          return;
        }
      } else if (categorie === "operations_independantes") {
        if (!independantData?.typeOperationIndep) {
          toast.error("Veuillez sélectionner un type d'opération", {
            description: "Le type d'opération indépendante est obligatoire"
          });
          return;
        }
        if (!independantData.prestations?.length || independantData.prestations.every(p => !p.description?.trim())) {
          toast.error("Veuillez ajouter au moins une prestation", {
            description: "Saisissez la description d'au moins une prestation"
          });
          return;
        }
      }
    }

    // Si la validation passe, avancer à l'étape suivante
    if (canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Fonction de validation + ouverture du modal (appelée par bouton, PAS par form submit)
  const handleOpenConfirmModal = () => {
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (!categorie) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }

    // Validation Zod selon la catégorie
    if (categorie === "conteneurs" && conteneursData) {
      const validation = validateOrdreConteneurs(conteneursData);
      if (!validation.success) {
        toast.error("Erreurs de validation", {
          description: validation.firstError || "Veuillez corriger les erreurs dans le formulaire",
        });
        console.log("Validation errors:", validation.errors);
        return;
      }
    } else if (categorie === "conventionnel" && conventionnelData) {
      const validation = validateOrdreConventionnel(conventionnelData);
      if (!validation.success) {
        toast.error("Erreurs de validation", {
          description: validation.firstError || "Veuillez corriger les erreurs dans le formulaire",
        });
        console.log("Validation errors:", validation.errors);
        return;
      }
    } else if (categorie === "operations_independantes" && independantData) {
      const validation = validateOrdreIndependant(independantData);
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
    // Préparer les données selon la catégorie
    let lignesData: any[] = [];
    let conteneursDataApi: any[] = [];
    let lotsData: any[] = [];
    let numeroBL = "";
    let transitaireId = "";

    if (categorie === "conteneurs" && conteneursData) {
      numeroBL = conteneursData.numeroBL;
      transitaireId = conteneursData.transitaireId;
      conteneursDataApi = conteneursData.conteneurs.map(c => ({
        numero: c.numero,
        type: 'dry',
        taille: c.taille,
        description: c.description,
        armateur_id: conteneursData.armateurId || null,
        prix_unitaire: c.prixUnitaire || 0,
        operations: c.operations.map(op => ({
          type_operation: op.type,
          description: typesOperationConteneur[op.type]?.label || op.description,
          quantite: op.quantite,
          prix_unitaire: op.prixUnitaire,
        }))
      }));
    } else if (categorie === "conventionnel" && conventionnelData) {
      numeroBL = conventionnelData.numeroBL;
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

    const data = {
      client_id: clientId,
      type_document: categorie === "conteneurs" ? "Conteneur" : categorie === "conventionnel" ? "Lot" : "Independant",
      type_operation: categorie === "conteneurs" && conteneursData ? conteneursData.typeOperation : null,
      type_operation_indep: categorie === "operations_independantes" && independantData ? independantData.typeOperationIndep : null,
      bl_numero: numeroBL || null,
      navire: null,
      date_arrivee: null,
      transitaire_id: transitaireId || null,
      representant_id: conteneursData?.representantId || null,
      prime_transitaire: conteneursData?.primeTransitaire || 0,
      prime_representant: conteneursData?.primeRepresentant || 0,
      // Backend attend null, "pourcentage" ou "montant" - pas "none"
      remise_type: remiseData.type === "none" ? null : remiseData.type,
      remise_valeur: remiseData.type === "none" ? 0 : (remiseData.valeur || 0),
      remise_montant: remiseData.type === "none" ? 0 : (remiseData.montantCalcule || 0),
      // Exonérations - basées sur la nouvelle structure
     ...toApiPayload(taxesSelectionData),
      notes,
      lignes: lignesData,
      conteneurs: conteneursDataApi,
      lots: lotsData,
    };

    try {
     console.log('📤 Envoi ordre avec taxes_selection:', data.taxes_selection);
      await createOrdreMutation.mutateAsync(data);
      clear(); // Clear draft on success
      setShowConfirmModal(false);
      toast.success("Ordre de travail créé avec succès");
      // Retourner à la liste des ordres
      navigate("/ordres");
    } catch (error: any) {
      const response = error?.response?.data;
      const apiMessage = response?.message;
      const apiErrors = response?.errors;

      // Afficher les erreurs de validation détaillées (422)
      if (apiErrors && typeof apiErrors === 'object') {
        const errorMessages = Object.entries(apiErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        
        console.error('Validation errors:', apiErrors);
        toast.error(apiMessage || "Erreurs de validation", {
          description: errorMessages,
          duration: 8000,
        });
      } else if (response?.error) {
        toast.error(apiMessage || "Erreur lors de la création de l'ordre", {
          description: String(response.error),
        });
      } else {
        toast.error(apiMessage || "Erreur lors de la création de l'ordre");
      }
      setShowConfirmModal(false);
    }
  };

  // Get client for preview
  const selectedClient = clients.find(c => String(c.id) === clientId);

  return (
    <MainLayout title="Nouvel ordre de travail">
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/ordres")} className="transition-all duration-200 hover:scale-110">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Ship className="h-6 w-6 text-primary" />
                Nouvel ordre de travail
              </h1>
              <p className="text-muted-foreground text-sm">
                Créez un ordre de travail pour l'exploitation
              </p>
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
      <OrdreStepper 
        currentStep={currentStep} 
        categorie={categorie || undefined}
        onStepClick={handleStepClick}
        stepsValidation={stepsValidation}
      />

      <div 
        onKeyDown={(e) => {
          // Empêcher la soumission sur Entrée
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
                  <CardTitle className="text-lg">Catégorie d'ordre</CardTitle>
                  <CardDescription>Sélectionnez le type d'ordre de travail</CardDescription>
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
                    Client
                  </CardTitle>
                  <CardDescription>Sélectionnez le client pour cet ordre</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md">
                    <Label htmlFor="client">Nom du client *</Label>
                    <ClientCombobox
                      clients={clients}
                      value={clientId}
                      onChange={setClientId}
                      placeholder="Rechercher un client..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Détails */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                {categorie === "conteneurs" && (
                  <OrdreConteneursForm
                    armateurs={armateurs}
                    transitaires={transitaires}
                    representants={representants}
                    onDataChange={setConteneursData}
                    initialData={conteneursData ? {
                      typeOperation: conteneursData.typeOperation,
                      numeroBL: conteneursData.numeroBL,
                      armateurId: conteneursData.armateurId,
                      transitaireId: conteneursData.transitaireId,
                      representantId: conteneursData.representantId,
                      conteneurs: conteneursData.conteneurs,
                      primeTransitaire: conteneursData.primeTransitaire,
                      primeRepresentant: conteneursData.primeRepresentant,
                    } : undefined}
                  />
                )}

                {categorie === "conventionnel" && (
                  <OrdreConventionnelForm 
                    onDataChange={setConventionnelData}
                    initialData={conventionnelData ? {
                      numeroBL: conventionnelData.numeroBL,
                      lieuChargement: conventionnelData.lieuChargement,
                      lieuDechargement: conventionnelData.lieuDechargement,
                      lots: conventionnelData.lots,
                    } : undefined}
                  />
                )}

                {categorie === "operations_independantes" && (
                  <OrdreIndependantForm 
                    onDataChange={setIndependantData}
                    initialData={independantData ? {
                      typeOperationIndep: independantData.typeOperationIndep,
                      prestations: independantData.prestations,
                    } : undefined}
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
                  tauxTva={taxRates.TVA}
                  tauxCss={taxRates.CSS}
                  tva={tva}
                  css={css}
                  montantTTC={montantTTC}
                  remiseMontant={remiseData.montantCalcule}
                  remiseType={remiseData.type}
                  remiseValeur={remiseData.valeur}
                  selectedTaxCodes={taxesSelectionData.selectedTaxCodes}
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
                  disabled={createOrdreMutation.isPending}
                  className="transition-all duration-200 hover:scale-105 hover:shadow-md"
                >
                  {createOrdreMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Créer l'ordre de travail
                </Button>
              )}
            </div>
          </div>

          {/* Preview sidebar */}
          <div className="hidden lg:block">
            <OrdrePreview
              categorie={categorie}
              client={selectedClient ? { id: selectedClient.id, nom: selectedClient.nom } : null}
              montantHT={montantHT}
              tva={tva}
              css={css}
              montantTTC={montantTTC}
              numeroBL={conteneursData?.numeroBL || conventionnelData?.numeroBL}
              typeOperation={conteneursData?.typeOperation}
              typeOperationIndep={independantData?.typeOperationIndep}
              conteneurs={conteneursData?.conteneurs}
              lots={conventionnelData?.lots?.map(l => ({ description: l.description || l.numeroLot, quantite: l.quantite }))}
              prestations={independantData?.prestations?.map(p => ({ description: p.description, quantite: p.quantite }))}
              notes={notes}
              currentStep={currentStep}
              selectedTaxCodes={taxesSelectionData.selectedTaxCodes}
            />
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      <ConfirmationSaveModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmSave}
        isLoading={createOrdreMutation.isPending}
        type="ordre"
        montantHT={montantHTApresRemise}
        tva={tva}
        css={css}
        montantTTC={montantTTC}
        remise={remiseData.montantCalcule}
        selectedTaxCodes={taxesSelectionData.selectedTaxCodes}
        tauxTva={taxRates.TVA}
        tauxCss={taxRates.CSS}
        {...toApiPayload(taxesSelectionData)}
        clientName={selectedClient?.nom}
        categorie={categorie || undefined}
      />
    </MainLayout>
  );
}
