import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Receipt, Loader2, Users, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useFactureById, 
  useUpdateFacture, 
  useClients, 
  useArmateurs, 
  useTransitaires, 
  useRepresentants, 
  useTaxes 
} from "@/hooks/use-commercial";
import { RecapitulatifCard } from "@/components/devis/shared";
import { FactureStepper, FacturePreview } from "@/components/factures/shared";
import { 
  FactureConteneursForm, 
  FactureConventionnelForm, 
  FactureIndependantForm,
} from "@/components/factures/forms";
import type { FactureConteneursData } from "@/components/factures/forms/FactureConteneursForm";
import type { FactureConventionnelData } from "@/components/factures/forms/FactureConventionnelForm";
import type { FactureIndependantData } from "@/components/factures/forms/FactureIndependantForm";
import { getCategoriesLabels, CategorieDocument, typesOperationConteneur, TypeOperationIndep } from "@/types/documents";
import { formatDate, getStatutLabel } from "@/data/mockData";
import { toast } from "sonner";
import TaxesSelector, { TaxeItem, TaxesSelectionData } from "@/components/shared/TaxesSelector";

export default function ModifierFacturePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Fetch data
  const { data: factureData, isLoading: loadingFacture } = useFactureById(id || '');
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 500 });
  const { data: armateursData, isLoading: loadingArmateurs } = useArmateurs();
  const { data: transitairesData, isLoading: loadingTransitaires } = useTransitaires();
  const { data: representantsData, isLoading: loadingRepresentants } = useRepresentants({ per_page: 500 });
  const { data: taxesData } = useTaxes();
  const updateFactureMutation = useUpdateFacture();

  const clients = clientsData?.data || [];
  const armateurs = armateursData || [];
  const transitaires = transitairesData || [];
  const representants = representantsData || [];
  
  const TAUX_TVA = taxesData?.tva_taux ? parseFloat(taxesData.tva_taux) / 100 : 0.18;
  const TAUX_CSS = taxesData?.css_taux ? parseFloat(taxesData.css_taux) / 100 : 0.01;
  
  // Préparer les taxes disponibles
  const availableTaxes: TaxeItem[] = [
    { code: "TVA", nom: "Taxe sur la Valeur Ajoutée", taux: Math.round(TAUX_TVA * 100), active: true },
    { code: "CSS", nom: "Contribution Spéciale de Solidarité", taux: Math.round(TAUX_CSS * 100), active: true },
  ];
  
  const categoriesLabels = getCategoriesLabels();

  // Stepper state - start at step 2 since category is not editable
  const [currentStep, setCurrentStep] = useState(2);

  const [clientId, setClientId] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [notes, setNotes] = useState("");
  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  
  const [conteneursData, setConteneursData] = useState<FactureConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<FactureConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<FactureIndependantData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // État pour la sélection des taxes
  const [taxesSelectionData, setTaxesSelectionData] = useState<TaxesSelectionData>({
    taxesAppliquees: availableTaxes,
    exonere: false,
    motifExoneration: "",
  });

  // Populate form when data loads
  useEffect(() => {
    if (factureData && !isInitialized) {
      setClientId(String(factureData.client_id || ""));
      setDateEcheance(factureData.date_echeance || "");
      setNotes(factureData.notes || "");
      
      let cat: CategorieDocument = 'conteneurs';
      if (factureData.type_document === 'Conteneur' || factureData.conteneurs?.length > 0) {
        cat = 'conteneurs';
      } else if (factureData.type_document === 'Lot' || factureData.lots?.length > 0) {
        cat = 'conventionnel';
      } else if (factureData.type_document === 'Independant' || factureData.lignes?.length > 0) {
        cat = 'operations_independantes';
      }
      setCategorie(cat);
      
      // Initialiser les données de taxes
      const exonereTva = (factureData as any).exonere_tva || false;
      const exonereCss = (factureData as any).exonere_css || false;
      const motif = (factureData as any).motif_exoneration || "";
      
      // Si exonéré totalement, mettre exonere à true, sinon on garde les taxes sélectionnées
      const isFullyExempt = exonereTva && exonereCss;
      setTaxesSelectionData({
        taxesAppliquees: isFullyExempt ? [] : availableTaxes.filter(t => 
          (t.code === "TVA" && !exonereTva) || (t.code === "CSS" && !exonereCss)
        ),
        exonere: isFullyExempt,
        motifExoneration: motif,
      });
      
      setIsInitialized(true);
    }
  }, [factureData, isInitialized, availableTaxes]);

  // Initial data for forms
  const conteneursInitialData = useMemo(() => {
    if (!factureData || categorie !== "conteneurs") return null;
    const facture = factureData as any;
    
    const conteneurs = (facture.conteneurs || []).map((c: any, idx: number) => ({
      id: String(c.id || idx),
      numero: c.numero || "",
      description: c.description || "",
      taille: c.taille === "20" ? "20'" : "40'",
      prixUnitaire: parseFloat(c.prix_unitaire) || 0,
      operations: (c.operations || []).map((op: any, opIdx: number) => ({
        id: String(op.id || opIdx),
        type: op.type_operation || "arrivee",
        description: op.description || "",
        quantite: parseFloat(op.quantite) || 1,
        prixUnitaire: parseFloat(op.prix_unitaire) || 0,
        prixTotal: (parseFloat(op.quantite) || 1) * (parseFloat(op.prix_unitaire) || 0),
      })),
    }));

    return {
      typeOperation: (facture.type_operation?.toLowerCase() || "") as "import" | "export" | "",
      numeroBL: facture.numero_bl || facture.bl_numero || "",
      armateurId: String(facture.armateur_id || ""),
      transitaireId: String(facture.transitaire_id || ""),
      representantId: String(facture.representant_id || ""),
      primeTransitaire: parseFloat(facture.prime_transitaire) || 0,
      primeRepresentant: parseFloat(facture.prime_representant) || 0,
      conteneurs,
      montantHT: conteneurs.reduce((sum: number, c: any) => 
        sum + c.prixUnitaire + c.operations.reduce((opSum: number, op: any) => opSum + op.prixTotal, 0), 0
      ),
    };
  }, [factureData, categorie]);

  const conventionnelInitialData = useMemo(() => {
    if (!factureData || categorie !== "conventionnel") return null;
    const facture = factureData as any;
    
    const lots = (facture.lots || []).map((l: any, idx: number) => ({
      id: String(l.id || idx),
      numeroLot: l.designation || l.numero_lot || `Lot ${idx + 1}`,
      description: l.description || l.designation || "",
      quantite: parseFloat(l.quantite) || 1,
      prixUnitaire: parseFloat(l.prix_unitaire) || 0,
      prixTotal: (parseFloat(l.quantite) || 1) * (parseFloat(l.prix_unitaire) || 0),
    }));

    return {
      numeroBL: facture.numero_bl || facture.bl_numero || "",
      lieuChargement: facture.lieu_chargement || "",
      lieuDechargement: facture.lieu_dechargement || "",
      lots,
      montantHT: lots.reduce((sum: number, l: any) => sum + l.prixTotal, 0),
    };
  }, [factureData, categorie]);

  const independantInitialData = useMemo(() => {
    if (!factureData || categorie !== "operations_independantes") return null;

    const facture = factureData as any;

    let typeOp = facture.type_operation_indep || "";
    if (!typeOp && facture.lignes?.length > 0) {
      const rawType = facture.lignes[0].type_operation || "";
      const normalized = rawType.toLowerCase().replace(/\s+/g, "_").replace("é", "e");
      const validTypes: TypeOperationIndep[] = ["transport", "manutention", "stockage", "location", "double_relevage"];
      if (validTypes.includes(normalized as TypeOperationIndep)) {
        typeOp = normalized as TypeOperationIndep;
      } else if (rawType.toLowerCase().includes("relevage")) {
        typeOp = "double_relevage";
      }
    }

    const prestations = (facture.lignes || []).map((l: any, idx: number) => ({
      id: String(l.id || idx),
      description: l.description || "",
      lieuDepart: l.lieu_depart || "",
      lieuArrivee: l.lieu_arrivee || "",
      dateDebut: l.date_debut || "",
      dateFin: l.date_fin || "",
      quantite: parseFloat(l.quantite) || 1,
      prixUnitaire: parseFloat(l.prix_unitaire) || 0,
      montantHT: (parseFloat(l.quantite) || 1) * (parseFloat(l.prix_unitaire) || 0),
    }));

    return {
      typeOperationIndep: typeOp as TypeOperationIndep | "",
      prestations,
      montantHT: prestations.reduce((sum: number, p: any) => sum + p.montantHT, 0),
    };
  }, [factureData, categorie]);

  const getMontantHT = (): number => {
    if (categorie === "conteneurs" && conteneursData) return conteneursData.montantHT;
    if (categorie === "conventionnel" && conventionnelData) return conventionnelData.montantHT;
    if (categorie === "operations_independantes" && independantData) return independantData.montantHT;
    return factureData?.montant_ht || 0;
  };

  const montantHT = getMontantHT();
  const tva = Math.round(montantHT * TAUX_TVA);
  const css = Math.round(montantHT * TAUX_CSS);
  const montantTTC = montantHT + tva + css;

  // Stepper navigation
  const handleStepClick = (step: number) => {
    if (step >= 2 && step <= 4) {
      setCurrentStep(step);
    }
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
    if (currentStep < 4 && canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStatutBadge = (statut: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      brouillon: { 
        label: getStatutLabel(statut), 
        className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-200 dark:border-gray-700" 
      },
      emise: { 
        label: getStatutLabel(statut), 
        className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700" 
      },
      payee: { 
        label: getStatutLabel(statut), 
        className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700" 
      },
      partielle: { 
        label: getStatutLabel(statut), 
        className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700" 
      },
      impayee: { 
        label: getStatutLabel(statut), 
        className: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700" 
      },
      annulee: { 
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

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    // Empêche la validation/soumission involontaire (ex: touche Entrée) avant le récapitulatif.
    // On autorise toujours le bouton "Enregistrer" du header (event type = "click").
    if (e.type === "submit" && currentStep !== 4) {
      toast.info("Cliquez sur « Suivant » pour aller au récapitulatif avant de valider.");
      return;
    }

    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    // Validation exonération
    const exonereTva = taxesSelectionData.exonere || !taxesSelectionData.taxesAppliquees.some(t => t.code === "TVA");
    const exonereCss = taxesSelectionData.exonere || !taxesSelectionData.taxesAppliquees.some(t => t.code === "CSS");
    
    if ((exonereTva || exonereCss) && taxesSelectionData.exonere && !taxesSelectionData.motifExoneration.trim()) {
      toast.error("Le motif d'exonération est obligatoire");
      return;
    }

    const data: any = {
      client_id: parseInt(clientId),
      date_echeance: dateEcheance || null,
      notes: notes || null,
      // Données d'exonération
      exonere_tva: exonereTva,
      exonere_css: exonereCss,
      motif_exoneration: taxesSelectionData.motifExoneration || null,
    };

    if (categorie === "conteneurs" && conteneursData) {
      data.transitaire_id = conteneursData.transitaireId ? parseInt(conteneursData.transitaireId) : null;
      data.representant_id = conteneursData.representantId ? parseInt(conteneursData.representantId) : null;
      data.armateur_id = conteneursData.armateurId ? parseInt(conteneursData.armateurId) : null;
      data.bl_numero = conteneursData.numeroBL || null;
      data.prime_transitaire = conteneursData.primeTransitaire || 0;
      data.prime_representant = conteneursData.primeRepresentant || 0;
      data.conteneurs = conteneursData.conteneurs.map(c => ({
        numero: c.numero,
        type: "DRY",
        taille: c.taille === "20'" ? "20" : "40",
        description: c.description || null,
        prix_unitaire: Number(c.prixUnitaire || 0),
        armateur_id: conteneursData.armateurId ? parseInt(conteneursData.armateurId) : null,
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
      await updateFactureMutation.mutateAsync({ id: id!, data });
      toast.success("Facture modifiée avec succès");
      navigate("/factures");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = loadingFacture || loadingClients || loadingArmateurs || loadingTransitaires || loadingRepresentants;

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!factureData) {
    return (
      <MainLayout title="Facture non trouvée">
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <h2 className="text-xl font-semibold mb-2">Facture non trouvée</h2>
          <Button onClick={() => navigate("/factures")} className="transition-all duration-200 hover:scale-105">
            Retour aux factures
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Get client for preview
  const selectedClient = clients.find(c => String(c.id) === clientId);

  return (
    <MainLayout title={`Modifier ${factureData.numero}`}>
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
                onClick={() => navigate(`/factures`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </motion.div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-primary" />
                  Modifier {factureData.numero}
                </h1>
                {getStatutBadge(factureData.statut)}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Créée le {formatDate(factureData.date_facture || factureData.created_at)}
              </p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleSubmit} disabled={updateFactureMutation.isPending} className="gap-2 shadow-md">
              {updateFactureMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </motion.div>
        </motion.div>

        {/* Stepper */}
        <FactureStepper 
          currentStep={currentStep} 
          categorie={categorie || undefined}
          onStepClick={handleStepClick}
        />

        <form onSubmit={handleSubmit}>
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
                        Client & Échéance
                      </CardTitle>
                      <CardDescription>Modifiez le client et la date d'échéance</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
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
                      <FactureConteneursForm
                        armateurs={armateurs}
                        transitaires={transitaires}
                        representants={representants}
                        onDataChange={setConteneursData}
                        initialData={conteneursInitialData}
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
                      <FactureConventionnelForm 
                        onDataChange={setConventionnelData} 
                        initialData={conventionnelInitialData}
                      />
                    </motion.div>
                  )}

                  {categorie === "operations_independantes" && isInitialized && (
                    <motion.div
                      key="independant"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <FactureIndependantForm 
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
                        <CardDescription>Informations complémentaires</CardDescription>
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
                      onChange={setTaxesSelectionData}
                      initialData={taxesSelectionData}
                    />
                  )}

                  <RecapitulatifCard
                    montantHT={montantHT}
                    tva={taxesSelectionData.exonere || !taxesSelectionData.taxesAppliquees.some(t => t.code === "TVA") ? 0 : tva}
                    css={taxesSelectionData.exonere || !taxesSelectionData.taxesAppliquees.some(t => t.code === "CSS") ? 0 : css}
                    montantTTC={montantHT + 
                      (taxesSelectionData.exonere || !taxesSelectionData.taxesAppliquees.some(t => t.code === "TVA") ? 0 : tva) + 
                      (taxesSelectionData.exonere || !taxesSelectionData.taxesAppliquees.some(t => t.code === "CSS") ? 0 : css)}
                    tauxTva={Math.round(TAUX_TVA * 100)}
                    tauxCss={Math.round(TAUX_CSS * 100)}
                    exonereTva={taxesSelectionData.exonere || !taxesSelectionData.taxesAppliquees.some(t => t.code === "TVA")}
                    exonereCss={taxesSelectionData.exonere || !taxesSelectionData.taxesAppliquees.some(t => t.code === "CSS")}
                    motifExoneration={taxesSelectionData.motifExoneration}
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
                    disabled={updateFactureMutation.isPending}
                    className="gap-2 shadow-md transition-all duration-200 hover:scale-105"
                  >
                    {updateFactureMutation.isPending ? (
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
              <FacturePreview
                categorie={categorie}
                client={selectedClient ? { id: selectedClient.id, nom: selectedClient.nom } : null}
                montantHT={montantHT}
                tva={tva}
                css={css}
                montantTTC={montantTTC}
                numeroBL={conteneursData?.numeroBL || conventionnelData?.numeroBL || factureData?.numero_bl}
                dateEcheance={dateEcheance}
                typeOperation={conteneursData?.typeOperation || (factureData as any)?.type_operation}
                typeOperationIndep={independantData?.typeOperationIndep || (factureData as any)?.type_operation_indep}
                conteneurs={conteneursData?.conteneurs || factureData?.conteneurs?.map((c: any) => ({ numero: c.numero, taille: c.taille }))}
                lots={conventionnelData?.lots?.map(l => ({ description: l.description || l.numeroLot, quantite: l.quantite })) || factureData?.lots?.map((l: any) => ({ description: l.designation, quantite: l.quantite }))}
                prestations={independantData?.prestations?.map(p => ({ description: p.description, quantite: p.quantite })) || factureData?.lignes?.map((l: any) => ({ description: l.description, quantite: l.quantite }))}
                notes={notes}
              />
            </div>
          </div>
        </form>
      </motion.div>
    </MainLayout>
  );
}
