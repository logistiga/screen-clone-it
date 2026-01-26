import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Ship, Loader2, Users, Container, Package, Truck, Warehouse, Calendar, RotateCcw, ArrowDownToLine, ArrowUpFromLine, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  useOrdreById, 
  useUpdateOrdre, 
  useClients, 
  useArmateurs, 
  useTransitaires, 
  useRepresentants 
} from "@/hooks/use-commercial";
import { RecapitulatifCard } from "@/components/devis/shared";
import { OrdreStepper, OrdrePreview } from "@/components/ordres/shared";
import { 
  OrdreConteneursForm, 
  OrdreConventionnelForm, 
  OrdreIndependantForm,
} from "@/components/ordres/forms";
import type { OrdreConteneursData } from "@/components/ordres/forms/OrdreConteneursForm";
import type { OrdreConventionnelData } from "@/components/ordres/forms/OrdreConventionnelForm";
import type { OrdreIndependantData } from "@/components/ordres/forms/OrdreIndependantForm";
import { getCategoriesLabels, CategorieDocument, typesOperationConteneur } from "@/types/documents";
import { formatDate, getStatutLabel } from "@/data/mockData";
import { toast } from "sonner";
import TaxesSelector, { TaxesSelectionData } from "@/components/shared/TaxesSelector";
import { useDocumentTaxes, areTaxesSelectionDataEqual } from "@/hooks/useDocumentTaxes";
import ConfirmationSaveModal from "@/components/shared/ConfirmationSaveModal";

export default function ModifierOrdrePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Fetch data
  const { data: ordreData, isLoading: loadingOrdre } = useOrdreById(id || '');
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 500 });
  const { data: armateursData, isLoading: loadingArmateurs } = useArmateurs();
  const { data: transitairesData, isLoading: loadingTransitaires } = useTransitaires();
  const { data: representantsData, isLoading: loadingRepresentants } = useRepresentants({ per_page: 500 });
  const updateOrdreMutation = useUpdateOrdre();
  
  // Hook unifié pour les taxes - stabilisé
  const { 
    taxRates, 
    availableTaxes, 
    isLoading: taxesLoading,
    getTaxesSelectionFromDocument,
    calculateTaxes,
    toApiPayload 
  } = useDocumentTaxes();

  const clients = Array.isArray(clientsData?.data) ? clientsData.data : (Array.isArray(clientsData) ? clientsData : []);
  const armateurs = Array.isArray(armateursData) ? armateursData : [];
  const transitaires = Array.isArray(transitairesData) ? transitairesData : [];
  const representants = Array.isArray(representantsData) ? representantsData : [];
  
  const categoriesLabels = getCategoriesLabels();

  // Stepper state - start at step 2 (client) since category is not editable
  const [currentStep, setCurrentStep] = useState(2);

  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  
  // Form data from child components
  const [conteneursData, setConteneursData] = useState<OrdreConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<OrdreConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<OrdreIndependantData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // État pour la sélection des taxes - nouvelle structure avec codes
  const [taxesSelectionData, setTaxesSelectionData] = useState<TaxesSelectionData>({
    selectedTaxCodes: ['TVA', 'CSS'], // Taxes obligatoires par défaut
    hasExoneration: false,
    exoneratedTaxCodes: [],
    motifExoneration: "",
  });
  
  // Handler stable pour TaxesSelector avec comparaison profonde
  const handleTaxesChange = useCallback((next: TaxesSelectionData) => {
    setTaxesSelectionData(prev => {
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
  
  // État pour le modal de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Populate form when data loads
  useEffect(() => {
    if (ordreData && !isInitialized) {
      setClientId(String(ordreData.client_id || ""));
      setNotes(ordreData.notes || "");
      
      // Déterminer la catégorie basée sur type_document
      let cat: CategorieDocument = 'conteneurs';
      if (ordreData.type_document === 'Conteneur' || ordreData.categorie === 'conteneurs' || ordreData.conteneurs?.length > 0) {
        cat = 'conteneurs';
      } else if (ordreData.type_document === 'Lot' || ordreData.categorie === 'conventionnel' || ordreData.lots?.length > 0) {
        cat = 'conventionnel';
      } else if (ordreData.type_document === 'Independant' || ordreData.categorie === 'operations_independantes' || ordreData.lignes?.length > 0) {
        cat = 'operations_independantes';
      }
      setCategorie(cat);
      
      // Initialiser les données de taxes avec le helper du hook
      if (!taxesLoading && availableTaxes.length > 0) {
        const exonereTva = (ordreData as any).exonere_tva || false;
        const exonereCss = (ordreData as any).exonere_css || false;
        const motif = (ordreData as any).motif_exoneration || "";
        setTaxesSelectionData(getTaxesSelectionFromDocument(exonereTva, exonereCss, motif));
      }
      
      setIsInitialized(true);
    }
  }, [ordreData, isInitialized, availableTaxes, taxesLoading, getTaxesSelectionFromDocument]);

  // Préparer les données initiales pour les formulaires enfants
  // Extraire les primes depuis le tableau primes
  const getPrimeTransitaire = (): number => {
    if (!ordreData?.primes || !Array.isArray(ordreData.primes)) return 0;
    const primeTransitaire = ordreData.primes.find((p: any) => p.transitaire_id && !p.representant_id);
    return primeTransitaire ? parseFloat(String(primeTransitaire.montant)) || 0 : 0;
  };

  const getPrimeRepresentant = (): number => {
    if (!ordreData?.primes || !Array.isArray(ordreData.primes)) return 0;
    const primeRepresentant = ordreData.primes.find((p: any) => p.representant_id && !p.transitaire_id);
    return primeRepresentant ? parseFloat(String(primeRepresentant.montant)) || 0 : 0;
  };

  const getConteneursInitialData = () => {
    if (!ordreData || !Array.isArray(ordreData.conteneurs) || ordreData.conteneurs.length === 0) return undefined;
    return {
      typeOperation: (ordreData.type_operation as any) || "",
      numeroBL: ordreData.numero_bl || "",
      armateurId: String(ordreData.armateur_id || ""),
      transitaireId: String(ordreData.transitaire_id || ""),
      representantId: String(ordreData.representant_id || ""),
      primeTransitaire: getPrimeTransitaire(),
      primeRepresentant: getPrimeRepresentant(),
      conteneurs: ordreData.conteneurs.map((c: any) => ({
        id: String(c.id),
        numero: c.numero || "",
        taille: c.taille === "20" ? "20'" : c.taille === "40" ? "40'" : (c.taille || "20'"),
        description: c.description || "",
        prixUnitaire: parseFloat(String(c.prix_unitaire)) || 0,
        operations: Array.isArray(c.operations) ? c.operations.map((op: any) => ({
          id: String(op.id),
          type: op.type || op.type_operation || "arrivee",
          description: op.description || "",
          quantite: op.quantite || 1,
          prixUnitaire: parseFloat(String(op.prix_unitaire)) || 0,
          prixTotal: (op.quantite || 1) * (parseFloat(String(op.prix_unitaire)) || 0),
        })) : [],
      })),
      montantHT: parseFloat(String(ordreData.montant_ht)) || 0,
    };
  };

  const getConventionnelInitialData = () => {
    if (!ordreData || !Array.isArray(ordreData.lots) || ordreData.lots.length === 0) return undefined;
    return {
      numeroBL: ordreData.numero_bl || "",
      lieuChargement: (ordreData as any).lieu_chargement || "",
      lieuDechargement: (ordreData as any).lieu_dechargement || "",
      lots: ordreData.lots.map((l: any) => ({
        id: String(l.id),
        numeroLot: l.numero_lot || l.designation || "",
        description: l.description || l.designation || "",
        quantite: l.quantite || 1,
        prixUnitaire: parseFloat(String(l.prix_unitaire)) || 0,
        prixTotal: (l.quantite || 1) * (parseFloat(String(l.prix_unitaire)) || 0),
      })),
      montantHT: parseFloat(String(ordreData.montant_ht)) || 0,
    };
  };

  const independantInitialData = useMemo(() => {
    if (!ordreData || !Array.isArray(ordreData.lignes) || ordreData.lignes.length === 0) {
      return undefined;
    }
    
    let typeFromOrder = (ordreData as any).type_operation_indep || "";
    
    if (!typeFromOrder && ordreData.lignes.length > 0) {
      const firstLigne = ordreData.lignes[0];
      if (firstLigne.type_operation) {
        typeFromOrder = firstLigne.type_operation;
      }
    }
    
    const normalizedType = typeFromOrder.toLowerCase().replace(/\s+/g, '_').replace('double relevage', 'double_relevage');
    
    return {
      typeOperationIndep: normalizedType as any,
      prestations: ordreData.lignes.map((l: any) => ({
        id: String(l.id),
        description: l.description || "",
        lieuDepart: l.lieu_depart || "",
        lieuArrivee: l.lieu_arrivee || "",
        dateDebut: l.date_debut || "",
        dateFin: l.date_fin || "",
        quantite: parseFloat(String(l.quantite)) || 1,
        prixUnitaire: parseFloat(String(l.prix_unitaire)) || 0,
        montantHT: (parseFloat(String(l.quantite)) || 1) * (parseFloat(String(l.prix_unitaire)) || 0),
      })),
      montantHT: parseFloat(String(ordreData.montant_ht)) || 0,
    };
  }, [ordreData]);

  const getMontantHT = (): number => {
    if (categorie === "conteneurs" && conteneursData) return conteneursData.montantHT;
    if (categorie === "conventionnel" && conventionnelData) return conventionnelData.montantHT;
    if (categorie === "operations_independantes" && independantData) return independantData.montantHT;
    return ordreData?.montant_ht || 0;
  };

  const montantHT = getMontantHT();
  
  // Calculer les taxes via le hook unifié
  const { tva, css, totalTaxes } = calculateTaxes(montantHT, taxesSelectionData);
  const montantTTC = montantHT + totalTaxes;

  // Stepper navigation - vérifie les prérequis avant de changer d'étape
  const handleStepClick = (step: number) => {
    if (step < 2 || step > 4) return;
    
    // Permet de revenir en arrière sans restriction
    if (step < currentStep) {
      setCurrentStep(step);
      return;
    }
    
    // Pour avancer, vérifie les prérequis de chaque étape intermédiaire
    for (let s = currentStep + 1; s <= step; s++) {
      if (!canProceedToStep(s)) {
        if (s === 3) toast.error("Veuillez sélectionner un client");
        else if (s === 4) toast.error("Veuillez compléter les détails de l'ordre");
        return;
      }
    }
    setCurrentStep(step);
  };

  const canProceedToStep = (step: number): boolean => {
    if (step === 3) return !!clientId;
    if (step === 4) {
      if (categorie === "conteneurs") return !!conteneursData && conteneursData.conteneurs.length > 0;
      if (categorie === "conventionnel") return !!conventionnelData && conventionnelData.lots.length > 0;
      if (categorie === "operations_independantes") return !!independantData && independantData.prestations.length > 0;
    }
    return true;
  };

  const handleNextStep = () => {
    // Validation stricte avant de passer à l'étape suivante
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
    if (currentStep < 4 && canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Configuration des badges de type
  const getTypeBadge = useMemo(() => {
    if (categorie === 'conteneurs') {
      const typeOp = ordreData?.type_operation?.toLowerCase() || '';
      if (typeOp.includes('import')) {
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1.5">
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Conteneurs / Import
          </Badge>
        );
      }
      if (typeOp.includes('export')) {
        return (
          <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 flex items-center gap-1.5">
            <ArrowUpFromLine className="h-3.5 w-3.5" />
            Conteneurs / Export
          </Badge>
        );
      }
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1.5">
          <Container className="h-3.5 w-3.5" />
          Conteneurs
        </Badge>
      );
    }
    
    if (categorie === 'operations_independantes') {
      const typeIndep = ((ordreData as any)?.type_operation_indep || ordreData?.type_operation || '').toLowerCase();
      const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
        transport: { label: "Transport", icon: <Truck className="h-3.5 w-3.5" />, className: "bg-green-100 text-green-800" },
        manutention: { label: "Manutention", icon: <Package className="h-3.5 w-3.5" />, className: "bg-orange-100 text-orange-800" },
        stockage: { label: "Stockage", icon: <Warehouse className="h-3.5 w-3.5" />, className: "bg-indigo-100 text-indigo-800" },
        location: { label: "Location", icon: <Calendar className="h-3.5 w-3.5" />, className: "bg-teal-100 text-teal-800" },
        double_relevage: { label: "Double Relevage", icon: <RotateCcw className="h-3.5 w-3.5" />, className: "bg-pink-100 text-pink-800" },
      };
      const badgeConfig = configs[typeIndep];
      if (badgeConfig) {
        return (
          <Badge className={`${badgeConfig.className} flex items-center gap-1.5`}>
            {badgeConfig.icon}
            Indépendant / {badgeConfig.label}
          </Badge>
        );
      }
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5" />
          Indépendant
        </Badge>
      );
    }
    
    if (categorie === 'conventionnel') {
      return (
        <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1.5">
          <Ship className="h-3.5 w-3.5" />
          Conventionnel
        </Badge>
      );
    }
    
    return null;
  }, [categorie, ordreData]);

  const getStatutBadge = (statut: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      en_cours: { 
        label: getStatutLabel(statut), 
        className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700" 
      },
      termine: { 
        label: getStatutLabel(statut), 
        className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700" 
      },
      facture: { 
        label: getStatutLabel(statut), 
        className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700" 
      },
      annule: { 
        label: getStatutLabel(statut), 
        className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700" 
      },
    };
    const badgeConfig = configs[statut] || { label: getStatutLabel(statut), className: "bg-gray-100 text-gray-800" };
    return (
      <Badge 
        variant="outline" 
        className={`${badgeConfig.className} transition-all duration-200 hover:scale-105`}
      >
        {badgeConfig.label}
      </Badge>
    );
  };

  // Pré-validation avant d'ouvrir le modal
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    // Empêche la validation/soumission involontaire (ex: touche Entrée) avant le récapitulatif.
    // Seul le bouton à l'étape 4 ou le bouton Enregistrer du header peut déclencher la validation.
    if (currentStep !== 4) {
      toast.info("Cliquez sur « Suivant » pour aller au récapitulatif avant de valider.");
      return;
    }

    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    // Validation exonération
    const apiPayload = toApiPayload(taxesSelectionData);
    
    if (apiPayload.exonere_tva || apiPayload.exonere_css) {
      if (taxesSelectionData.hasExoneration && !taxesSelectionData.motifExoneration.trim()) {
        toast.error("Le motif d'exonération est obligatoire");
        return;
      }
    }

    // Ouvrir le modal de confirmation
    setShowConfirmModal(true);
  };

  // Confirmation et envoi réel des données
  const handleConfirmSave = async () => {
    const apiPayload = toApiPayload(taxesSelectionData);

    const data: any = {
      client_id: parseInt(clientId),
      notes: notes || null,
      // Données d'exonération
      ...apiPayload,
    };

    if (categorie === "conteneurs" && conteneursData) {
      data.transitaire_id = conteneursData.transitaireId ? parseInt(conteneursData.transitaireId) : null;
      data.representant_id = conteneursData.representantId ? parseInt(conteneursData.representantId) : null;
      data.bl_numero = conteneursData.numeroBL || null;
      data.type_operation = conteneursData.typeOperation || null;
      data.prime_transitaire = conteneursData.primeTransitaire || 0;
      data.prime_representant = conteneursData.primeRepresentant || 0;
      data.conteneurs = conteneursData.conteneurs.map(c => ({
        numero: c.numero,
        type: "DRY",
        taille: c.taille === "20'" ? "20" : "40",
        description: c.description || null,
        armateur_id: conteneursData.armateurId ? parseInt(conteneursData.armateurId) : null,
        prix_unitaire: c.prixUnitaire || 0,
        operations: c.operations.map(op => ({
          type_operation: op.type,
          description: typesOperationConteneur[op.type]?.label || op.description || "",
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
        designation: l.description || l.numeroLot || `Lot ${l.numeroLot}`,
        quantite: l.quantite,
        poids: 0,
        volume: 0,
        prix_unitaire: l.prixUnitaire
      }));
    }

    if (categorie === "operations_independantes" && independantData) {
      data.type_operation_indep = independantData.typeOperationIndep || null;
      data.lignes = independantData.prestations.map(p => ({
        type_operation: independantData.typeOperationIndep || "manutention",
        description: p.description || "",
        lieu_depart: p.lieuDepart || null,
        lieu_arrivee: p.lieuArrivee || null,
        date_debut: p.dateDebut || null,
        date_fin: p.dateFin || null,
        quantite: p.quantite || 1,
        prix_unitaire: p.prixUnitaire || 0
      }));
    }

    try {
      await updateOrdreMutation.mutateAsync({ id: id!, data });
      toast.success("Ordre modifié avec succès");
      setShowConfirmModal(false);
      navigate(`/ordres`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = loadingOrdre || loadingClients || loadingArmateurs || loadingTransitaires || loadingRepresentants;

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!ordreData) {
    return (
      <MainLayout title="Ordre non trouvé">
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <h2 className="text-xl font-semibold mb-2">Ordre non trouvé</h2>
          <Button onClick={() => navigate("/ordres")} className="transition-all duration-200 hover:scale-105">Retour aux ordres</Button>
        </div>
      </MainLayout>
    );
  }

  // Get client for preview
  const selectedClient = clients.find(c => String(c.id) === clientId);

  return (
    <MainLayout title={`Modifier ${ordreData.numero}`}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/50 backdrop-blur-sm p-4 rounded-lg border mb-6"
        >
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/ordres`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </motion.div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Ship className="h-6 w-6 text-primary" />
                  Modifier {ordreData.numero}
                </h1>
                {getStatutBadge(ordreData.statut)}
                {getTypeBadge}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Créé le {formatDate(ordreData.date || ordreData.created_at)}
              </p>
            </div>
          </div>
          {currentStep === 4 && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button type="button" onClick={handleSubmit} disabled={updateOrdreMutation.isPending} className="gap-2 shadow-md">
                {updateOrdreMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Stepper - starting from step 2 */}
        <OrdreStepper 
          currentStep={currentStep} 
          categorie={categorie || undefined}
          onStepClick={handleStepClick}
        />

        <form 
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') {
              e.preventDefault();
            }
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Catégorie badge (read-only) */}
              {categorie && currentStep === 2 && (
                <div className="flex items-center gap-3 animate-fade-in">
                  <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2">
                    {categoriesLabels[categorie]?.icon}
                    <span>{categoriesLabels[categorie]?.label}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">(non modifiable)</span>
                </div>
              )}

              {/* Step 2: Client */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="transition-all duration-300 hover:shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-primary" />
                        Client
                      </CardTitle>
                      <CardDescription>Sélectionnez le client pour cet ordre de travail</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="max-w-md space-y-2">
                        <Label>Nom du client *</Label>
                        <Select value={clientId} onValueChange={setClientId}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Détails */}
              {currentStep === 3 && (
                <AnimatePresence mode="wait">
                  {categorie === "conteneurs" && isInitialized && (
                    <motion.div
                      key="conteneurs"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <OrdreConteneursForm
                        armateurs={armateurs}
                        transitaires={transitaires}
                        representants={representants}
                        onDataChange={setConteneursData}
                        initialData={getConteneursInitialData()}
                      />
                    </motion.div>
                  )}

                  {categorie === "conventionnel" && isInitialized && (
                    <motion.div
                      key="conventionnel"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <OrdreConventionnelForm 
                        onDataChange={setConventionnelData} 
                        initialData={getConventionnelInitialData()}
                      />
                    </motion.div>
                  )}

                  {categorie === "operations_independantes" && isInitialized && independantInitialData && (
                    <motion.div
                      key="independant"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <OrdreIndependantForm 
                        onDataChange={setIndependantData} 
                        initialData={independantInitialData}
                      />
                    </motion.div>
                  )}

                  {/* Notes */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-6"
                  >
                    <Card className="transition-all duration-300 hover:shadow-lg overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent">
                        <CardTitle className="text-lg">Notes / Observations</CardTitle>
                        <CardDescription>Informations complémentaires pour cet ordre</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Conditions particulières, notes..."
                          rows={4}
                          className="resize-none"
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Step 4: Récapitulatif */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Sélection des taxes */}
                  {montantHT > 0 && (
                    <TaxesSelector
                      taxes={availableTaxes}
                      montantHT={montantHT}
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
                    selectedTaxCodes={taxesSelectionData.selectedTaxCodes}
                    {...toApiPayload(taxesSelectionData)}
                  />
                </motion.div>
              )}

              {/* Navigation buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-between pt-4"
              >
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePrevStep}
                  disabled={currentStep === 2}
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
                    type="submit" 
                    size="lg" 
                    disabled={updateOrdreMutation.isPending}
                    className="gap-2 shadow-md transition-all duration-200 hover:scale-105"
                  >
                    {updateOrdreMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Enregistrer les modifications
                  </Button>
                )}
              </motion.div>
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
                numeroBL={conteneursData?.numeroBL || conventionnelData?.numeroBL || ordreData?.numero_bl}
                typeOperation={conteneursData?.typeOperation || ordreData?.type_operation}
                typeOperationIndep={independantData?.typeOperationIndep || (ordreData as any)?.type_operation_indep}
                conteneurs={conteneursData?.conteneurs || (Array.isArray(ordreData?.conteneurs) ? ordreData.conteneurs.map((c: any) => ({ numero: c.numero, taille: c.taille })) : undefined)}
                lots={conventionnelData?.lots?.map(l => ({ description: l.description || l.numeroLot, quantite: l.quantite })) || (Array.isArray(ordreData?.lots) ? ordreData.lots.map((l: any) => ({ description: l.designation, quantite: l.quantite })) : undefined)}
                prestations={independantData?.prestations?.map(p => ({ description: p.description, quantite: p.quantite })) || (Array.isArray(ordreData?.lignes) ? ordreData.lignes.map((l: any) => ({ description: l.description, quantite: l.quantite })) : undefined)}
                notes={notes}
                currentStep={currentStep}
                selectedTaxCodes={taxesSelectionData.selectedTaxCodes}
              />
            </div>
          </div>
        </form>

        {/* Modal de confirmation */}
        <ConfirmationSaveModal
          open={showConfirmModal}
          onOpenChange={setShowConfirmModal}
          onConfirm={handleConfirmSave}
          isLoading={updateOrdreMutation.isPending}
          type="ordre"
          montantHT={montantHT}
          tva={tva}
          css={css}
          montantTTC={montantTTC}
          selectedTaxCodes={taxesSelectionData.selectedTaxCodes}
          tauxTva={taxRates.TVA}
          tauxCss={taxRates.CSS}
          {...toApiPayload(taxesSelectionData)}
          clientName={selectedClient?.nom}
          categorie={categorie || undefined}
        />
      </motion.div>
    </MainLayout>
  );
}
