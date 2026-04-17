import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  useDevisById,
  useUpdateDevis,
  useClients,
  useArmateurs,
  useTransitaires,
  useRepresentants,
} from "@/hooks/use-commercial";
import { DevisForm, useDevisForm } from "@/components/devis/shared";
import { CategorieDocument, TypeOperationConteneur } from "@/types/documents";

const toArray = (v: any): any[] =>
  Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : [];

export default function ModifierDevisPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: devisData, isLoading: loadingDevis } = useDevisById(id || "");
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 500 });
  const { data: armateursData, isLoading: loadingArmateurs } = useArmateurs();
  const { data: transitairesData, isLoading: loadingTransitaires } = useTransitaires();
  const { data: representantsData, isLoading: loadingRepresentants } = useRepresentants({ per_page: 500 });
  const updateDevisMutation = useUpdateDevis();

  const clients = clientsData?.data || [];
  const armateurs = toArray(armateursData);
  const transitaires = toArray(transitairesData);
  const representants = toArray(representantsData);

  const api = useDevisForm();
  const [currentStep, setCurrentStep] = useState(2);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hydrater le formulaire à partir du devis chargé
  useEffect(() => {
    if (!devisData || isInitialized) return;

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
  }, [devisData, isInitialized, api]);

  // Initialiser les taxes par défaut si rien n'est défini
  useEffect(() => {
    if (api.taxesInitRef.current) return;
    if (api.taxesLoading || api.availableTaxes.length === 0) return;
    if (!isInitialized) return;
    api.taxesInitRef.current = true;
    const recommendedCodes = api.availableTaxes.filter((t) => t.obligatoire).map((t) => t.code.toUpperCase());
    api.setTaxesSelectionData((prev) =>
      prev.selectedTaxCodes.length > 0 ? prev : { ...prev, selectedTaxCodes: recommendedCodes }
    );
  }, [api.taxesLoading, api.availableTaxes, isInitialized]);

  // Données initiales pour les sous-formulaires (mode édition)
  const initialChildData = useMemo(() => {
    if (!devisData) return undefined;
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
          description: l.description || "",
          lieuDepart: l.lieu_depart || "",
          lieuArrivee: l.lieu_arrivee || "",
          dateDebut: l.date_debut || "",
          dateFin: l.date_fin || "",
          quantite: l.quantite || 1,
          prixUnitaire: l.prix_unitaire || 0,
          montantHT: (l.quantite || 1) * (l.prix_unitaire || 0),
        })) || [],
      },
    };
  }, [devisData]);

  const selectedClient = useMemo(
    () => clients.find((c: any) => String(c.id) === api.clientId),
    [clients, api.clientId]
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api.clientId) return;
    const data = api.buildPayload();
    try {
      await updateDevisMutation.mutateAsync({ id: id!, data });
      navigate("/devis");
    } catch (error) {
      // handled by mutation
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            type="button" variant="ghost" size="icon"
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
              Créé le {new Date(devisData.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

      <DevisForm
        mode="edit"
        api={api}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        clients={clients}
        armateurs={armateurs}
        transitaires={transitaires}
        representants={representants}
        isSubmitting={updateDevisMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/devis")}
        initialChildData={initialChildData}
        selectedClient={selectedClient}
      />
    </MainLayout>
  );
}
