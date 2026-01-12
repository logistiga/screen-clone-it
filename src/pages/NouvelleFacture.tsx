import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Receipt, Save, Loader2, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { RecapitulatifCard } from "@/components/devis/shared";
import { useClients, useArmateurs, useTransitaires, useRepresentants, useCreateFacture, useConfiguration } from "@/hooks/use-commercial";
import { extractApiErrorInfo } from "@/lib/api-error";
import { formatMontant } from "@/data/mockData";
import RemiseInput, { RemiseData, RemiseType } from "@/components/shared/RemiseInput";

export default function NouvelleFacturePage() {
  const navigate = useNavigate();
  
  const { data: clientsData } = useClients();
  const { data: armateursData } = useArmateurs();
  const { data: transitairesData } = useTransitaires();
  const { data: representantsData } = useRepresentants();
  const { data: configData } = useConfiguration();
  const createFactureMutation = useCreateFacture();
  
  const clients = clientsData?.data || [];
  const armateurs = armateursData || [];
  const transitaires = transitairesData || [];
  const representants = representantsData || [];
  
  const TAUX_TVA = configData?.tva_taux ? parseFloat(configData.tva_taux) / 100 : 0.18;
  const TAUX_CSS = configData?.css_taux ? parseFloat(configData.css_taux) / 100 : 0.01;
  
  const categoriesLabels = getCategoriesLabels();

  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  const [clientId, setClientId] = useState("");
  const [dateEcheance, setDateEcheance] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState("");

  // Données des formulaires par catégorie
  const [conteneursData, setConteneursData] = useState<FactureConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<FactureConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<FactureIndependantData | null>(null);

  // État de la remise
  const [remiseData, setRemiseData] = useState<RemiseData>({
    type: "none",
    valeur: 0,
    montantCalcule: 0,
  });

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

  const handleCategorieChange = (value: CategorieDocument) => {
    setCategorie(value);
    setConteneursData(null);
    setConventionnelData(null);
    setIndependantData(null);
    setRemiseData({ type: "none", valeur: 0, montantCalcule: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { toast.error("Veuillez sélectionner un client"); return; }
    if (!categorie) { toast.error("Veuillez sélectionner une catégorie"); return; }
    
    if (categorie === "conteneurs" && (!conteneursData?.numeroBL)) {
      toast.error("Veuillez saisir le numéro de BL"); return;
    }
    if (categorie === "conventionnel" && (!conventionnelData?.numeroBL)) {
      toast.error("Veuillez saisir le numéro de BL"); return;
    }
    if (categorie === "operations_independantes" && (!independantData?.typeOperationIndep)) {
      toast.error("Veuillez sélectionner un type d'opération"); return;
    }

    // Validation côté client (pour éviter les 422 Laravel)
    if (categorie === "conteneurs" && conteneursData) {
      if (!conteneursData.armateurId) {
        toast.error("Veuillez sélectionner un armateur");
        return;
      }

      const idxNumero = conteneursData.conteneurs.findIndex((c) => !c.numero?.trim());
      if (idxNumero !== -1) {
        toast.error(`Veuillez saisir le N° du conteneur (ligne ${idxNumero + 1})`);
        return;
      }

      const idxTaille = conteneursData.conteneurs.findIndex((c) => !c.taille);
      if (idxTaille !== -1) {
        toast.error(`Veuillez sélectionner la taille du conteneur (ligne ${idxTaille + 1})`);
        return;
      }
    }

    if (categorie === "conventionnel" && conventionnelData) {
      const idxDesignation = conventionnelData.lots.findIndex(
        (l) => !(l.description?.trim() || l.numeroLot?.trim())
      );
      if (idxDesignation !== -1) {
        toast.error(`Veuillez renseigner la désignation du lot (ligne ${idxDesignation + 1})`);
        return;
      }
    }

    let lignesData: any[] = [];
    let conteneursDataForApi: any[] = [];
    let lotsData: any[] = [];

    if (categorie === "conteneurs" && conteneursData) {
      conteneursDataForApi = conteneursData.conteneurs.map((c) => ({
        numero: c.numero,
        type: "DRY",
        taille: c.taille,
        description: c.description,
        prix_unitaire: 0,
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

      // Compatibilité backend (certaines versions attendent categorie + numero_bl)
      categorie,
      bl_numero: blNumero,
      numero_bl: blNumero,

      date_echeance: dateEcheance,
      transitaire_id: conteneursData?.transitaireId ? Number(conteneursData.transitaireId) : null,
      representant_id: conteneursData?.representantId ? Number(conteneursData.representantId) : null,
      armateur_id: conteneursData?.armateurId ? Number(conteneursData.armateurId) : null,
      type_operation_indep: independantData?.typeOperationIndep || null,

      // Primes pour transitaire et représentant
      prime_transitaire: conteneursData?.primeTransitaire || 0,
      prime_representant: conteneursData?.primeRepresentant || 0,

      // Remise
      remise_type: remiseData.type || null,
      remise_valeur: remiseData.valeur || 0,
      remise_montant: remiseData.montantCalcule || 0,

      notes,
      lignes: lignesData,
      conteneurs: conteneursDataForApi,
      lots: lotsData,
    };

    try {
      await createFactureMutation.mutateAsync(data);
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

      // eslint-disable-next-line no-console
      console.error("[NouvelleFacture] Erreur API", {
        status: info.status,
        message: info.message,
        error: backendError,
        errors: responseData?.errors,
      });

      if (backendError) {
        toast.error(message, { description: backendError });
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <MainLayout title="Nouvelle facture">
      <div className="mb-6 animate-fade-in">
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
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        {/* Sélection catégorie */}
        {!categorie && (
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader><CardTitle className="text-lg">Catégorie de facture</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.keys(categoriesLabels) as CategorieDocument[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCategorieChange(key)}
                    className="p-4 rounded-lg border-2 text-left transition-all duration-300 border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-md hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-muted-foreground">{categoriesLabels[key].icon}</div>
                      <span className="font-semibold">{categoriesLabels[key].label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{categoriesLabels[key].description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {categorie && (
          <div className="flex items-center gap-3 animate-fade-in">
            <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2 transition-all duration-200 hover:scale-105">
              {categoriesLabels[categorie].icon}
              <span>{categoriesLabels[categorie].label}</span>
            </Badge>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCategorie("")} className="text-muted-foreground transition-all duration-200 hover:scale-105">
              Changer
            </Button>
          </div>
        )}

        {/* Client et date échéance */}
        {categorie && (
          <Card className="transition-all duration-300 hover:shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du client *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date d'échéance
                  </Label>
                  <Input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulaires par catégorie */}
        {categorie === "conteneurs" && (
          <div className="animate-fade-in">
            <FactureConteneursForm
              armateurs={armateurs}
              transitaires={transitaires}
              representants={representants}
              onDataChange={setConteneursData}
            />
          </div>
        )}

        {categorie === "conventionnel" && (
          <div className="animate-fade-in">
            <FactureConventionnelForm onDataChange={setConventionnelData} />
          </div>
        )}

        {categorie === "operations_independantes" && (
          <div className="animate-fade-in">
            <FactureIndependantForm onDataChange={setIndependantData} />
          </div>
        )}

        {/* Notes */}
        {categorie && (
          <Card className="transition-all duration-300 hover:shadow-lg animate-fade-in">
            <CardHeader><CardTitle className="text-lg">Notes / Observations</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ajouter des notes ou observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        )}

        {/* Remise - avant le récapitulatif */}
        {categorie && montantHT > 0 && (
          <RemiseInput montantHT={montantHT} onChange={setRemiseData} />
        )}

        {/* Récapitulatif */}
        {categorie && (
          <div className="animate-fade-in">
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

        {/* Boutons */}
        {categorie && (
          <div className="flex justify-end gap-4 animate-fade-in">
            <Button type="button" variant="outline" onClick={() => navigate("/factures")} className="transition-all duration-200 hover:scale-105">Annuler</Button>
            <Button type="submit" disabled={createFactureMutation.isPending} className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md">
              {createFactureMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Créer la facture
            </Button>
          </div>
        )}
      </form>
    </MainLayout>
  );
}