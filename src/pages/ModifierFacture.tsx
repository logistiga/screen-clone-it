import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Receipt, Loader2, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useConfiguration 
} from "@/hooks/use-commercial";
import { RecapitulatifCard } from "@/components/devis/shared";
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

export default function ModifierFacturePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Fetch data
  const { data: factureData, isLoading: loadingFacture } = useFactureById(id || '');
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 100 });
  const { data: armateursData, isLoading: loadingArmateurs } = useArmateurs();
  const { data: transitairesData, isLoading: loadingTransitaires } = useTransitaires();
  const { data: representantsData, isLoading: loadingRepresentants } = useRepresentants();
  const { data: config } = useConfiguration();
  const updateFactureMutation = useUpdateFacture();

  const clients = clientsData?.data || [];
  const armateurs = armateursData || [];
  const transitaires = transitairesData || [];
  const representants = representantsData || [];
  
  const TAUX_TVA = config?.taux_tva ? parseFloat(config.taux_tva) / 100 : 0.18;
  const TAUX_CSS = config?.taux_css ? parseFloat(config.taux_css) / 100 : 0.01;
  
  const categoriesLabels = getCategoriesLabels();

  const [clientId, setClientId] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [notes, setNotes] = useState("");
  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  
  // Form data from child components
  const [conteneursData, setConteneursData] = useState<FactureConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<FactureConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<FactureIndependantData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Populate form when data loads
  useEffect(() => {
    if (factureData && !isInitialized) {
      setClientId(String(factureData.client_id || ""));
      setDateEcheance(factureData.date_echeance || "");
      setNotes(factureData.notes || "");
      
      // Déterminer la catégorie basée sur type_document
      let cat: CategorieDocument = 'conteneurs';
      if (factureData.type_document === 'Conteneur' || factureData.conteneurs?.length > 0) {
        cat = 'conteneurs';
      } else if (factureData.type_document === 'Lot' || factureData.lots?.length > 0) {
        cat = 'conventionnel';
      } else if (factureData.type_document === 'Independant' || factureData.lignes?.length > 0) {
        cat = 'operations_independantes';
      }
      setCategorie(cat);
      
      setIsInitialized(true);
    }
  }, [factureData, isInitialized]);

  // Préparer les données initiales pour le formulaire indépendant
  const independantInitialData = useMemo(() => {
    if (!factureData || categorie !== "operations_independantes") return null;

    const facture = factureData as any;

    // Déduire le type_operation_indep depuis les lignes si non défini
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
    const config = configs[statut] || { label: getStatutLabel(statut), className: "bg-gray-100 text-gray-800" };
    return (
      <Badge 
        variant="outline" 
        className={`${config.className} transition-all duration-200 hover:scale-105`}
      >
        {config.label}
      </Badge>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    const data: any = {
      client_id: parseInt(clientId),
      date_echeance: dateEcheance || null,
      notes: notes || null,
    };

    if (categorie === "conteneurs" && conteneursData) {
      data.transitaire_id = conteneursData.transitaireId ? parseInt(conteneursData.transitaireId) : null;
      data.bl_numero = conteneursData.numeroBL || null;
      data.conteneurs = conteneursData.conteneurs.map(c => ({
        numero: c.numero,
        type: "DRY",
        taille: c.taille === "20'" ? "20" : "40",
        description: c.description || null,
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
      // Retourner vers la liste des factures
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
          <Button onClick={() => navigate("/factures")} className="transition-all duration-200 hover:scale-105">Retour aux factures</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Modifier ${factureData.numero}`}>
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/factures`)}
              className="transition-all duration-200 hover:scale-110"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-primary" />
                  Modifier {factureData.numero}
                </h1>
                {getStatutBadge(factureData.statut)}
              </div>
              <p className="text-muted-foreground text-sm">
                Créée le {formatDate(factureData.date_facture || factureData.created_at)}
              </p>
            </div>
          </div>
          <Button type="submit" disabled={updateFactureMutation.isPending} className="transition-all duration-200 hover:scale-105 hover:shadow-md">
            {updateFactureMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>

        {/* Catégorie (lecture seule) */}
        {categorie && (
          <div className="flex items-center gap-3 animate-fade-in">
            <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2 transition-all duration-200 hover:scale-105">
              {categoriesLabels[categorie]?.icon}
              <span>{categoriesLabels[categorie]?.label}</span>
            </Badge>
            <span className="text-sm text-muted-foreground">(non modifiable)</span>
          </div>
        )}

        {/* Client et date échéance */}
        <Card className="transition-all duration-300 hover:shadow-lg">
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
                  <SelectTrigger>
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
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
            <FactureIndependantForm 
              onDataChange={setIndependantData} 
              initialData={independantInitialData}
            />
          </div>
        )}

        {/* Notes */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Notes / Observations</CardTitle>
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

        {/* Récapitulatif */}
        <div className="animate-fade-in">
          <RecapitulatifCard
            montantHT={montantHT}
            tva={tva}
            css={css}
            montantTTC={montantTTC}
            tauxTva={Math.round(TAUX_TVA * 100)}
            tauxCss={Math.round(TAUX_CSS * 100)}
          />
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-4 pb-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(`/factures`)} 
            disabled={updateFactureMutation.isPending}
            className="transition-all duration-200 hover:scale-105"
          >
            Annuler
          </Button>
          <Button type="submit" className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md" disabled={updateFactureMutation.isPending}>
            {updateFactureMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </MainLayout>
  );
}