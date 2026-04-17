import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Save, Ship, Loader2, Users, Container, Package, Truck,
  Warehouse, Calendar, RotateCcw, ArrowDownToLine, ArrowUpFromLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  useOrdreById, useUpdateOrdre, useClients, useArmateurs, useTransitaires, useRepresentants,
} from "@/hooks/use-commercial";
import { RecapitulatifCard } from "@/components/devis/shared";
import {
  OrdreStepper, OrdrePreview, useOrdreForm, buildOrdreStepsValidation,
} from "@/components/ordres/shared";
import {
  OrdreConteneursForm, OrdreConventionnelForm, OrdreIndependantForm,
} from "@/components/ordres/forms";
import { getCategoriesLabels, CategorieDocument } from "@/types/documents";
import { formatDate, getStatutLabel } from "@/data/mockData";
import { toast } from "sonner";
import TaxesSelector from "@/components/shared/TaxesSelector";
import ConfirmationSaveModal from "@/components/shared/ConfirmationSaveModal";

const toArray = (v: any): any[] =>
  Array.isArray(v?.data) ? v.data : Array.isArray(v) ? v : [];

export default function ModifierOrdrePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Data fetching
  const { data: ordreData, isLoading: loadingOrdre } = useOrdreById(id || "");
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 500 });
  const { data: armateursData, isLoading: loadingArmateurs } = useArmateurs();
  const { data: transitairesData, isLoading: loadingTransitaires } = useTransitaires();
  const { data: representantsData, isLoading: loadingRepresentants } = useRepresentants({ per_page: 500 });
  const updateOrdreMutation = useUpdateOrdre();

  const clients = toArray(clientsData);
  const armateurs = toArray(armateursData);
  const transitaires = toArray(transitairesData);
  const representants = toArray(representantsData);
  const categoriesLabels = getCategoriesLabels();

  // Form state via hook partagé
  const api = useOrdreForm();

  const [currentStep, setCurrentStep] = useState(2);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Hydratation depuis l'OT chargé
  useEffect(() => {
    if (!ordreData || isInitialized) return;

    api.setClientId(String(ordreData.client_id || ""));
    api.setNotes(ordreData.notes || "");

    let cat: CategorieDocument = "conteneurs";
    if (ordreData.type_document === "Conteneur" || (ordreData as any).categorie === "conteneurs" || ordreData.conteneurs?.length > 0) cat = "conteneurs";
    else if (ordreData.type_document === "Lot" || (ordreData as any).categorie === "conventionnel" || ordreData.lots?.length > 0) cat = "conventionnel";
    else if (ordreData.type_document === "Independant" || (ordreData as any).categorie === "operations_independantes" || ordreData.lignes?.length > 0) cat = "operations_independantes";
    api.setCategorie(cat);

    if (!api.taxesLoading && api.availableTaxes.length > 0) {
      const exonereTva = (ordreData as any).exonere_tva || false;
      const exonereCss = (ordreData as any).exonere_css || false;
      const motif = (ordreData as any).motif_exoneration || "";
      const taxesSelectionJson = (ordreData as any).taxes_selection;
      api.setTaxesSelectionData(api.getTaxesSelectionFromDocument(exonereTva, exonereCss, motif, taxesSelectionJson));
      api.taxesInitRef.current = true;
    }

    if ((ordreData as any).remise_type && (ordreData as any).remise_type !== "none") {
      api.setRemiseData({
        type: (ordreData as any).remise_type,
        valeur: (ordreData as any).remise_valeur || 0,
        montantCalcule: (ordreData as any).remise_montant || 0,
      });
    }

    setIsInitialized(true);
  }, [ordreData, isInitialized, api.taxesLoading, api.availableTaxes]);

  // Initial data pour les sous-formulaires
  const getPrimeMontant = (key: "transitaire_id" | "representant_id"): number => {
    const primes = (ordreData as any)?.primes;
    if (!Array.isArray(primes)) return 0;
    const p = primes.find((x: any) =>
      key === "transitaire_id" ? x.transitaire_id && !x.representant_id : x.representant_id && !x.transitaire_id
    );
    return p ? parseFloat(String(p.montant)) || 0 : 0;
  };

  const conteneursInitialData = useMemo(() => {
    if (!ordreData || !Array.isArray(ordreData.conteneurs) || ordreData.conteneurs.length === 0) return undefined;
    return {
      typeOperation: (ordreData.type_operation as any) || "",
      numeroBL: ordreData.numero_bl || "",
      armateurId: String(ordreData.armateur_id || ""),
      transitaireId: String(ordreData.transitaire_id || ""),
      representantId: String(ordreData.representant_id || ""),
      primeTransitaire: getPrimeMontant("transitaire_id"),
      primeRepresentant: getPrimeMontant("representant_id"),
      conteneurs: ordreData.conteneurs.map((c: any) => ({
        id: String(c.id),
        numero: c.numero || "",
        taille: c.taille === "20" ? "20'" : c.taille === "40" ? "40'" : c.taille || "20'",
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
  }, [ordreData]);

  const conventionnelInitialData = useMemo(() => {
    if (!ordreData || !Array.isArray(ordreData.lots) || ordreData.lots.length === 0) return undefined;
    return {
      numeroBL: ordreData.numero_bl || "",
      description: ordreData.notes || "",
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
  }, [ordreData]);

  const independantInitialData = useMemo(() => {
    if (!ordreData || !Array.isArray(ordreData.lignes) || ordreData.lignes.length === 0) return undefined;
    let typeFromOrder = (ordreData as any).type_operation_indep || "";
    if (!typeFromOrder && ordreData.lignes.length > 0) {
      typeFromOrder = ordreData.lignes[0].type_operation || "";
    }
    const normalizedType = typeFromOrder.toLowerCase().replace(/\s+/g, "_").replace("double relevage", "double_relevage");
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

  const stepsValidation = buildOrdreStepsValidation({
    api, clients, currentStep, categoriesLabels: categoriesLabels as any, isEditMode: true,
  });

  const handleStepClick = (step: number) => {
    if (step < 2 || step > 4) return;
    if (step < currentStep) { setCurrentStep(step); return; }
    for (let s = currentStep + 1; s <= step; s++) {
      if (!api.canProceedToStep(s)) {
        if (s === 3) toast.error("Veuillez sélectionner un client");
        else if (s === 4) toast.error("Veuillez compléter les détails de l'ordre");
        return;
      }
    }
    setCurrentStep(step);
  };

  const handleNextStep = () => {
    if (currentStep === 2 && !api.clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (currentStep === 3) {
      const v = api.validateStep3();
      if (!v.ok) {
        toast.error(v.error || "Veuillez compléter les détails");
        return;
      }
    }
    if (currentStep < 4 && api.canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 2) setCurrentStep(currentStep - 1);
  };

  // Badges UI
  const getTypeBadge = useMemo(() => {
    if (api.categorie === "conteneurs") {
      const typeOp = ordreData?.type_operation?.toLowerCase() || "";
      if (typeOp.includes("import")) return <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1.5"><ArrowDownToLine className="h-3.5 w-3.5" />Conteneurs / Import</Badge>;
      if (typeOp.includes("export")) return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 flex items-center gap-1.5"><ArrowUpFromLine className="h-3.5 w-3.5" />Conteneurs / Export</Badge>;
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1.5"><Container className="h-3.5 w-3.5" />Conteneurs</Badge>;
    }
    if (api.categorie === "operations_independantes") {
      const typeIndep = ((ordreData as any)?.type_operation_indep || ordreData?.type_operation || "").toLowerCase();
      const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
        transport: { label: "Transport", icon: <Truck className="h-3.5 w-3.5" />, className: "bg-green-100 text-green-800" },
        manutention: { label: "Manutention", icon: <Package className="h-3.5 w-3.5" />, className: "bg-orange-100 text-orange-800" },
        stockage: { label: "Stockage", icon: <Warehouse className="h-3.5 w-3.5" />, className: "bg-indigo-100 text-indigo-800" },
        location: { label: "Location", icon: <Calendar className="h-3.5 w-3.5" />, className: "bg-teal-100 text-teal-800" },
        double_relevage: { label: "Double Relevage", icon: <RotateCcw className="h-3.5 w-3.5" />, className: "bg-pink-100 text-pink-800" },
      };
      const c = configs[typeIndep];
      if (c) return <Badge className={`${c.className} flex items-center gap-1.5`}>{c.icon}Indépendant / {c.label}</Badge>;
      return <Badge className="bg-green-100 text-green-800 flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" />Indépendant</Badge>;
    }
    if (api.categorie === "conventionnel") {
      return <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1.5"><Ship className="h-3.5 w-3.5" />Conventionnel</Badge>;
    }
    return null;
  }, [api.categorie, ordreData]);

  const getStatutBadge = (statut: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      en_cours: { label: getStatutLabel(statut), className: "bg-amber-100 text-amber-800 border-amber-300" },
      termine: { label: getStatutLabel(statut), className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
      facture: { label: getStatutLabel(statut), className: "bg-blue-100 text-blue-800 border-blue-300" },
      annule: { label: getStatutLabel(statut), className: "bg-red-100 text-red-800 border-red-300" },
    };
    const c = configs[statut] || { label: getStatutLabel(statut), className: "bg-gray-100 text-gray-800" };
    return <Badge variant="outline" className={`${c.className} transition-all duration-200 hover:scale-105`}>{c.label}</Badge>;
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (currentStep !== 4) {
      toast.info("Cliquez sur « Suivant » pour aller au récapitulatif avant de valider.");
      return;
    }
    if (!api.clientId) { toast.error("Veuillez sélectionner un client"); return; }

    const apiPayload = api.toApiPayload(api.taxesSelectionData);
    if ((apiPayload.exonere_tva || apiPayload.exonere_css) && api.taxesSelectionData.hasExoneration && !api.taxesSelectionData.motifExoneration.trim()) {
      toast.error("Le motif d'exonération est obligatoire");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    const data = api.buildPayload();
    try {
      await updateOrdreMutation.mutateAsync({ id: id!, data });
      toast.success("Ordre modifié avec succès");
      setShowConfirmModal(false);
      navigate("/ordres");
    } catch (error) {
      // mutation handles toast
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
          <Button onClick={() => navigate("/ordres")}>Retour aux ordres</Button>
        </div>
      </MainLayout>
    );
  }

  const selectedClient = clients.find((c: any) => String(c.id) === api.clientId);

  return (
    <MainLayout title={`Modifier ${ordreData.numero}`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/50 backdrop-blur-sm p-4 rounded-lg border mb-6"
        >
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/ordres")}>
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
                {updateOrdreMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer
              </Button>
            </motion.div>
          )}
        </motion.div>

        <OrdreStepper
          currentStep={currentStep}
          categorie={api.categorie || undefined}
          onStepClick={handleStepClick}
          stepsValidation={stepsValidation}
        />

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON") e.preventDefault();
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {api.categorie && currentStep === 2 && (
                <div className="flex items-center gap-3 animate-fade-in">
                  <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2">
                    {categoriesLabels[api.categorie]?.icon}
                    <span>{categoriesLabels[api.categorie]?.label}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">(non modifiable)</span>
                </div>
              )}

              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                        <Select value={api.clientId} onValueChange={api.setClientId}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((c: any) => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {currentStep === 3 && (
                <AnimatePresence mode="wait">
                  {api.categorie === "conteneurs" && isInitialized && (
                    <motion.div key="conteneurs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                      <OrdreConteneursForm
                        armateurs={armateurs}
                        transitaires={transitaires}
                        representants={representants}
                        onDataChange={api.setConteneursData}
                        initialData={conteneursInitialData}
                      />
                    </motion.div>
                  )}

                  {api.categorie === "conventionnel" && isInitialized && (
                    <motion.div key="conventionnel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                      <OrdreConventionnelForm
                        onDataChange={api.setConventionnelData}
                        initialData={conventionnelInitialData}
                      />
                    </motion.div>
                  )}

                  {api.categorie === "operations_independantes" && isInitialized && independantInitialData && (
                    <motion.div key="independant" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                      <OrdreIndependantForm
                        onDataChange={api.setIndependantData}
                        initialData={independantInitialData}
                      />
                    </motion.div>
                  )}

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
                    <Card className="transition-all duration-300 hover:shadow-lg overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent">
                        <CardTitle className="text-lg">Notes / Observations</CardTitle>
                        <CardDescription>Informations complémentaires pour cet ordre</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <Textarea
                          value={api.notes}
                          onChange={(e) => api.setNotes(e.target.value)}
                          placeholder="Conditions particulières, notes..."
                          rows={4}
                          className="resize-none"
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              )}

              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {api.montantHT > 0 && (
                    <TaxesSelector
                      taxes={api.availableTaxes}
                      montantHT={api.montantHT}
                      onChange={api.handleTaxesChange}
                      value={api.taxesSelectionData}
                    />
                  )}

                  <RecapitulatifCard
                    montantHT={api.montantHT}
                    tauxTva={api.taxRates.TVA}
                    tauxCss={api.taxRates.CSS}
                    tva={api.tva}
                    css={api.css}
                    montantTTC={api.montantTTC}
                    selectedTaxCodes={api.taxesSelectionData.selectedTaxCodes}
                    {...api.toApiPayload(api.taxesSelectionData)}
                  />
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                {currentStep > 2 ? (
                  <Button type="button" variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Précédent
                  </Button>
                ) : <div />}
                {currentStep < 4 && (
                  <Button type="button" onClick={handleNextStep} disabled={!api.canProceedToStep(currentStep + 1)}>
                    Suivant
                  </Button>
                )}
              </div>
            </div>

            {/* Preview panel */}
            <div className="lg:col-span-1">
              <OrdrePreview
                categorie={api.categorie}
                client={selectedClient}
                notes={api.notes}
                conteneursData={api.conteneursData}
                conventionnelData={api.conventionnelData}
                independantData={api.independantData}
                montantHT={api.montantHT}
                tva={api.tva}
                css={api.css}
                montantTTC={api.montantTTC}
                armateurs={armateurs}
                transitaires={transitaires}
                representants={representants}
              />
            </div>
          </div>
        </form>
      </motion.div>

      <ConfirmationSaveModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmSave}
        type="ordre"
        montantHT={api.montantHT}
        tva={api.tva}
        css={api.css}
        montantTTC={api.montantTTC}
        remise={api.remiseData.montantCalcule}
        exonereTva={api.toApiPayload(api.taxesSelectionData).exonere_tva}
        exonereCss={api.toApiPayload(api.taxesSelectionData).exonere_css}
        motifExoneration={api.taxesSelectionData.motifExoneration}
        clientName={selectedClient?.nom}
        categorie={api.categorie || undefined}
        selectedTaxCodes={api.taxesSelectionData.selectedTaxCodes}
        tauxTva={api.taxRates.TVA}
        tauxCss={api.taxRates.CSS}
        isLoading={updateOrdreMutation.isPending}
      />
    </MainLayout>
  );
}
