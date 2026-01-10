import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Ship, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  useOrdreById, 
  useUpdateOrdre, 
  useClients, 
  useArmateurs, 
  useTransitaires, 
  useRepresentants, 
  useConfiguration 
} from "@/hooks/use-commercial";
import { RecapitulatifCard } from "@/components/devis/shared";
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

export default function ModifierOrdrePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Fetch data
  const { data: ordreData, isLoading: loadingOrdre } = useOrdreById(id || '');
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 100 });
  const { data: armateursData, isLoading: loadingArmateurs } = useArmateurs();
  const { data: transitairesData, isLoading: loadingTransitaires } = useTransitaires();
  const { data: representantsData, isLoading: loadingRepresentants } = useRepresentants();
  const { data: config } = useConfiguration();
  const updateOrdreMutation = useUpdateOrdre();

  const clients = clientsData?.data || [];
  const armateurs = armateursData || [];
  const transitaires = transitairesData || [];
  const representants = representantsData || [];
  
  const TAUX_TVA = config?.taux_tva ? parseFloat(config.taux_tva) / 100 : 0.18;
  const TAUX_CSS = config?.taux_css ? parseFloat(config.taux_css) / 100 : 0.01;
  
  const categoriesLabels = getCategoriesLabels();

  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  
  // Form data from child components
  const [conteneursData, setConteneursData] = useState<OrdreConteneursData | null>(null);
  const [conventionnelData, setConventionnelData] = useState<OrdreConventionnelData | null>(null);
  const [independantData, setIndependantData] = useState<OrdreIndependantData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
      
      setIsInitialized(true);
    }
  }, [ordreData, isInitialized]);

  // Préparer les données initiales pour les formulaires enfants
  const getConteneursInitialData = () => {
    if (!ordreData || !ordreData.conteneurs) return undefined;
    return {
      typeOperation: (ordreData.type_operation as any) || "",
      numeroBL: ordreData.numero_bl || "",
      armateurId: String(ordreData.armateur_id || ""),
      transitaireId: String(ordreData.transitaire_id || ""),
      representantId: String(ordreData.representant_id || ""),
      primeTransitaire: 0,
      primeRepresentant: 0,
      conteneurs: ordreData.conteneurs.map((c: any) => ({
        id: String(c.id),
        numero: c.numero || "",
        taille: c.taille === "20" ? "20'" : c.taille === "40" ? "40'" : (c.taille || "20'"),
        description: c.description || "",
        prixUnitaire: parseFloat(String(c.prix_unitaire)) || 0,
        operations: (c.operations || []).map((op: any) => ({
          id: String(op.id),
          type: op.type || op.type_operation || "arrivee",
          description: op.description || "",
          quantite: op.quantite || 1,
          prixUnitaire: parseFloat(String(op.prix_unitaire)) || 0,
          prixTotal: (op.quantite || 1) * (parseFloat(String(op.prix_unitaire)) || 0),
        })),
      })),
      montantHT: parseFloat(String(ordreData.montant_ht)) || 0,
    };
  };

  const getConventionnelInitialData = () => {
    if (!ordreData || !ordreData.lots) return undefined;
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

  const getIndependantInitialData = () => {
    if (!ordreData || !ordreData.lignes) return undefined;
    return {
      typeOperationIndep: ((ordreData as any).type_operation_indep as any) || (ordreData.type_operation as any) || "",
      prestations: ordreData.lignes.map((l: any) => ({
        id: String(l.id),
        description: l.description || "",
        lieuDepart: l.lieu_depart || "",
        lieuArrivee: l.lieu_arrivee || "",
        dateDebut: l.date_debut || "",
        dateFin: l.date_fin || "",
        quantite: l.quantite || 1,
        prixUnitaire: parseFloat(String(l.prix_unitaire)) || 0,
        montantHT: (l.quantite || 1) * (parseFloat(String(l.prix_unitaire)) || 0),
      })),
      montantHT: parseFloat(String(ordreData.montant_ht)) || 0,
    };
  };

  const getMontantHT = (): number => {
    if (categorie === "conteneurs" && conteneursData) return conteneursData.montantHT;
    if (categorie === "conventionnel" && conventionnelData) return conventionnelData.montantHT;
    if (categorie === "operations_independantes" && independantData) return independantData.montantHT;
    return ordreData?.montant_ht || 0;
  };

  const montantHT = getMontantHT();
  const tva = Math.round(montantHT * TAUX_TVA);
  const css = Math.round(montantHT * TAUX_CSS);
  const montantTTC = montantHT + tva + css;

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
      notes: notes || null,
    };

    if (categorie === "conteneurs" && conteneursData) {
      data.transitaire_id = conteneursData.transitaireId ? parseInt(conteneursData.transitaireId) : null;
      data.bl_numero = conteneursData.numeroBL || null;
      // Ajouter type_operation (Import/Export)
      data.type_operation = conteneursData.typeOperation || null;
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
      // Ajouter type_operation_indep au niveau de l'ordre
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
      navigate("/ordres");
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

  return (
    <MainLayout title={`Modifier ${ordreData.numero}`}>
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/ordres/${id}`)}
              className="transition-all duration-200 hover:scale-110"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Ship className="h-6 w-6 text-primary" />
                  Modifier {ordreData.numero}
                </h1>
                {getStatutBadge(ordreData.statut)}
              </div>
              <p className="text-muted-foreground text-sm">
                Créé le {formatDate(ordreData.date || ordreData.created_at)}
              </p>
            </div>
          </div>
          <Button type="submit" disabled={updateOrdreMutation.isPending} className="transition-all duration-200 hover:scale-105 hover:shadow-md">
            {updateOrdreMutation.isPending ? (
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

        {/* Client */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-2">
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
          </CardContent>
        </Card>

        {/* Formulaires par catégorie */}
        {categorie === "conteneurs" && isInitialized && (
          <div className="animate-fade-in">
            <OrdreConteneursForm
              armateurs={armateurs}
              transitaires={transitaires}
              representants={representants}
              onDataChange={setConteneursData}
              initialData={getConteneursInitialData()}
            />
          </div>
        )}

        {categorie === "conventionnel" && isInitialized && (
          <div className="animate-fade-in">
            <OrdreConventionnelForm 
              onDataChange={setConventionnelData} 
              initialData={getConventionnelInitialData()}
            />
          </div>
        )}

        {categorie === "operations_independantes" && isInitialized && (
          <div className="animate-fade-in">
            <OrdreIndependantForm 
              onDataChange={setIndependantData} 
              initialData={getIndependantInitialData()}
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
            onClick={() => navigate(`/ordres/${id}`)} 
            disabled={updateOrdreMutation.isPending}
            className="transition-all duration-200 hover:scale-105"
          >
            Annuler
          </Button>
          <Button type="submit" className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md" disabled={updateOrdreMutation.isPending}>
            {updateOrdreMutation.isPending ? (
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