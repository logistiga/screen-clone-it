import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Container, Package, Users, FileText, Plus, Trash2, Save, MapPin, Calendar, Loader2, Truck } from "lucide-react";
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
import { useClients, useArmateurs, useTransitaires, useRepresentants, useCreateDevis, useConfiguration } from "@/hooks/use-commercial";
import {
  CategorieDocument,
  TypeOperation,
  TypeOperationIndep,
  TypeOperationConteneur,
  LigneConteneur,
  LigneLot,
  LignePrestationEtendue,
  typesOperationConteneur,
  getCategoriesLabels,
  getOperationsIndepLabels,
  getInitialConteneur,
  getInitialLot,
  getInitialPrestationEtendue,
  calculateTotalConteneurs,
  calculateTotalLots,
  calculateDaysBetween,
} from "@/types/documents";
import OperationsIndependantesForm from "@/components/operations/OperationsIndependantesForm";

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' XAF';
};

export default function NouveauDevisPage() {
  const navigate = useNavigate();
  
  // API hooks
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 100 });
  const { data: armateursData, isLoading: loadingArmateurs } = useArmateurs();
  const { data: transitairesData, isLoading: loadingTransitaires } = useTransitaires();
  const { data: representantsData, isLoading: loadingRepresentants } = useRepresentants();
  const { data: config } = useConfiguration();
  const createDevisMutation = useCreateDevis();

  const clients = clientsData?.data || [];
  const armateurs = armateursData || [];
  const transitaires = transitairesData || [];
  const representants = representantsData || [];
  
  const TAUX_TVA = config?.taux_tva ? parseFloat(config.taux_tva) / 100 : 0.18;
  const TAUX_CSS = config?.taux_css ? parseFloat(config.taux_css) / 100 : 0.01;
  
  const categoriesLabels = getCategoriesLabels();
  const operationsIndepLabels = getOperationsIndepLabels();

  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  const [clientId, setClientId] = useState("");
  const [dateValidite, setDateValidite] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [typeOperation, setTypeOperation] = useState<TypeOperation | "">("");
  const [numeroBL, setNumeroBL] = useState("");
  const [armateurId, setArmateurId] = useState("");
  const [transitaireId, setTransitaireId] = useState("");
  const [representantId, setRepresentantId] = useState("");
  const [conteneurs, setConteneurs] = useState<LigneConteneur[]>([getInitialConteneur()]);
  const [lots, setLots] = useState<LigneLot[]>([getInitialLot()]);
  const [lieuChargement, setLieuChargement] = useState("");
  const [lieuDechargement, setLieuDechargement] = useState("");
  const [prestations, setPrestations] = useState<LignePrestationEtendue[]>([getInitialPrestationEtendue()]);
  const [typeOperationIndep, setTypeOperationIndep] = useState<TypeOperationIndep | "">("");
  const [notes, setNotes] = useState("");

  const handleAddConteneur = () => setConteneurs([...conteneurs, { ...getInitialConteneur(), id: String(Date.now()) }]);
  const handleRemoveConteneur = (id: string) => { if (conteneurs.length > 1) setConteneurs(conteneurs.filter(c => c.id !== id)); };
  const handleConteneurChange = (id: string, field: keyof Omit<LigneConteneur, 'operations'>, value: string | number) => {
    setConteneurs(conteneurs.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleAddOperationConteneur = (conteneurId: string) => {
    setConteneurs(conteneurs.map(c => {
      if (c.id === conteneurId) {
        const defaultType: TypeOperationConteneur = "arrivee";
        const defaultPrix = typesOperationConteneur[defaultType].prixDefaut;
        return { ...c, operations: [...c.operations, { id: String(Date.now()), type: defaultType, description: "", quantite: 1, prixUnitaire: defaultPrix, prixTotal: defaultPrix }] };
      }
      return c;
    }));
  };

  const handleRemoveOperationConteneur = (conteneurId: string, operationId: string) => {
    setConteneurs(conteneurs.map(c => c.id === conteneurId ? { ...c, operations: c.operations.filter(op => op.id !== operationId) } : c));
  };

  const handleOperationConteneurChange = (conteneurId: string, operationId: string, field: string, value: string | number) => {
    setConteneurs(conteneurs.map(c => {
      if (c.id === conteneurId) {
        return {
          ...c,
          operations: c.operations.map(op => {
            if (op.id === operationId) {
              const updated = { ...op, [field]: value };
              if (field === "type") {
                updated.prixUnitaire = typesOperationConteneur[value as TypeOperationConteneur]?.prixDefaut || 0;
                updated.prixTotal = updated.quantite * updated.prixUnitaire;
              }
              if (field === "quantite" || field === "prixUnitaire") updated.prixTotal = updated.quantite * updated.prixUnitaire;
              return updated;
            }
            return op;
          })
        };
      }
      return c;
    }));
  };

  const handleAddLot = () => setLots([...lots, { ...getInitialLot(), id: String(Date.now()) }]);
  const handleRemoveLot = (id: string) => { if (lots.length > 1) setLots(lots.filter(l => l.id !== id)); };
  const handleLotChange = (id: string, field: keyof LigneLot, value: string | number) => {
    setLots(lots.map(l => {
      if (l.id === id) {
        const updated = { ...l, [field]: value };
        if (field === 'quantite' || field === 'prixUnitaire') updated.prixTotal = updated.quantite * updated.prixUnitaire;
        return updated;
      }
      return l;
    }));
  };

  const handleAddPrestation = () => setPrestations([...prestations, { ...getInitialPrestationEtendue(), id: String(Date.now()) }]);
  const handleRemovePrestation = (id: string) => { if (prestations.length > 1) setPrestations(prestations.filter(p => p.id !== id)); };
  const handlePrestationChange = (id: string, field: keyof LignePrestationEtendue, value: string | number) => {
    setPrestations(prestations.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === 'dateDebut' || field === 'dateFin') {
          const dateDebut = field === 'dateDebut' ? String(value) : updated.dateDebut || '';
          const dateFin = field === 'dateFin' ? String(value) : updated.dateFin || '';
          if (dateDebut && dateFin) {
            updated.quantite = calculateDaysBetween(dateDebut, dateFin);
          }
        }
        if (field === 'quantite' || field === 'prixUnitaire') updated.montantHT = updated.quantite * updated.prixUnitaire;
        return updated;
      }
      return p;
    }));
  };

  const calculateTotalPrestations = (prestations: LignePrestationEtendue[]): number => {
    return prestations.reduce((sum, p) => sum + p.montantHT, 0);
  };

  const calculateTotal = (): number => {
    if (categorie === "conteneurs") return calculateTotalConteneurs(conteneurs);
    if (categorie === "conventionnel") return calculateTotalLots(lots);
    return calculateTotalPrestations(prestations);
  };

  const montantHT = calculateTotal();
  const tva = Math.round(montantHT * TAUX_TVA);
  const css = Math.round(montantHT * TAUX_CSS);
  const montantTTC = montantHT + tva + css;

  const handleCategorieChange = (value: CategorieDocument) => {
    setCategorie(value);
    setTypeOperation("");
    setTypeOperationIndep("");
    setConteneurs([getInitialConteneur()]);
    setLots([getInitialLot()]);
    setPrestations([getInitialPrestationEtendue()]);
    setLieuChargement("");
    setLieuDechargement("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { toast.error("Veuillez sélectionner un client"); return; }
    if (!categorie) { toast.error("Veuillez sélectionner une catégorie"); return; }
    if ((categorie === "conteneurs" || categorie === "conventionnel") && !numeroBL) { toast.error("Veuillez saisir le numéro de BL"); return; }
    if (categorie === "operations_independantes" && !typeOperationIndep) { toast.error("Veuillez sélectionner un type d'opération"); return; }

    // Préparer les lignes pour l'API
    let lignes: any[] = [];
    if (categorie === "conteneurs") {
      conteneurs.forEach(c => {
        if (c.prixUnitaire > 0) {
          lignes.push({ designation: `Conteneur ${c.numero} (${c.taille})`, unite: 'unité', quantite: 1, prix_unitaire: c.prixUnitaire });
        }
        c.operations.forEach(op => {
          lignes.push({ designation: `${typesOperationConteneur[op.type]?.label} - ${c.numero}`, unite: 'unité', quantite: op.quantite, prix_unitaire: op.prixUnitaire });
        });
      });
    } else if (categorie === "conventionnel") {
      lots.forEach(l => {
        lignes.push({ designation: l.description || `Lot ${l.numeroLot}`, unite: 'unité', quantite: l.quantite, prix_unitaire: l.prixUnitaire });
      });
    } else {
      prestations.forEach(p => {
        lignes.push({ designation: p.description, unite: 'jour', quantite: p.quantite, prix_unitaire: p.prixUnitaire });
      });
    }

    const data = {
      client_id: parseInt(clientId),
      transitaire_id: transitaireId ? parseInt(transitaireId) : null,
      representant_id: representantId ? parseInt(representantId) : null,
      armateur_id: armateurId ? parseInt(armateurId) : null,
      date_devis: new Date().toISOString().split('T')[0],
      date_validite: dateValidite,
      reference_client: numeroBL || null,
      navire: null,
      voyage: null,
      port_chargement: lieuChargement || null,
      port_dechargement: lieuDechargement || null,
      conditions: null,
      notes: notes || null,
      lignes,
      conteneurs: categorie === "conteneurs" ? conteneurs.map(c => ({
        numero: c.numero,
        type: c.taille === "20'" ? "20" : "40",
        taille: c.taille === "20'" ? "20" : "40",
        operations: c.operations.map(op => ({
          type_operation: op.type,
          prix_unitaire: op.prixUnitaire,
          quantite: op.quantite
        }))
      })) : [],
      lots: categorie === "conventionnel" ? lots.map(l => ({
        designation: l.description || `Lot ${l.numeroLot}`,
        nature_marchandise: l.description,
        nombre_colis: l.quantite
      })) : []
    };

    try {
      await createDevisMutation.mutateAsync(data);
      navigate("/devis");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = loadingClients || loadingArmateurs || loadingTransitaires || loadingRepresentants;

  if (isLoading) {
    return (
      <MainLayout title="Nouveau devis">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Nouveau devis">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/devis")}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" />Nouveau devis</h1>
            <p className="text-muted-foreground text-sm">Créer un nouveau devis client</p>
          </div>
        </div>
      </div>

      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {!categorie && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Catégorie de devis</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.keys(categoriesLabels) as CategorieDocument[]).map((key) => (
                    <button key={key} type="button" onClick={() => handleCategorieChange(key)} className="p-4 rounded-lg border-2 text-left transition-all border-border hover:border-primary/50 hover:bg-muted/50">
                      <div className="flex items-center gap-3 mb-2"><div className="text-muted-foreground">{categoriesLabels[key].icon}</div><span className="font-semibold">{categoriesLabels[key].label}</span></div>
                      <p className="text-sm text-muted-foreground">{categoriesLabels[key].description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {categorie && (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2">{categoriesLabels[categorie].icon}<span>{categoriesLabels[categorie].label}</span></Badge>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCategorie("")} className="text-muted-foreground">Changer</Button>
            </div>
          )}

          {categorie && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-primary" />Client</CardTitle></CardHeader>
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
                    <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" />Date de validité</Label>
                    <Input type="date" value={dateValidite} onChange={(e) => setDateValidite(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {categorie === "conteneurs" && (
            <>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-primary" />Type d'opération et informations</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Type d'opération *</Label><Select value={typeOperation} onValueChange={(v) => setTypeOperation(v as TypeOperation)}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent><SelectItem value="import">Import</SelectItem><SelectItem value="export">Export</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Numéro BL *</Label><Input placeholder="Ex: MSCUAB123456" value={numeroBL} onChange={(e) => setNumeroBL(e.target.value.toUpperCase())} className="font-mono" /></div>
                    <div className="space-y-2"><Label>Armateur *</Label><Select value={armateurId} onValueChange={setArmateurId}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{armateurs.map((a) => (<SelectItem key={a.id} value={String(a.id)}>{a.nom}</SelectItem>))}</SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-amber-600">Transitaire</Label><Select value={transitaireId} onValueChange={setTransitaireId}><SelectTrigger className="border-amber-200"><SelectValue placeholder="Sélectionner (optionnel)" /></SelectTrigger><SelectContent>{transitaires.map((t) => (<SelectItem key={t.id} value={String(t.id)}>{t.nom}</SelectItem>))}</SelectContent></Select></div>
                    <div className="space-y-2"><Label className="text-amber-600">Représentant</Label><Select value={representantId} onValueChange={setRepresentantId}><SelectTrigger className="border-amber-200"><SelectValue placeholder="Sélectionner (optionnel)" /></SelectTrigger><SelectContent>{representants.map((r) => (<SelectItem key={r.id} value={String(r.id)}>{r.nom}</SelectItem>))}</SelectContent></Select></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-lg"><Container className="h-5 w-5 text-primary" />Conteneurs</CardTitle><Button type="button" variant="outline" size="sm" onClick={handleAddConteneur} className="gap-1"><Plus className="h-4 w-4" />Ajouter conteneur</Button></div></CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {conteneurs.map((conteneur, index) => (
                      <div key={conteneur.id} className="space-y-4">
                        <div className="flex items-center justify-between"><span className="font-medium text-sm text-muted-foreground">Conteneur {index + 1}</span>{conteneurs.length > 1 && (<Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveConteneur(conteneur.id)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>)}</div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2"><Label>N° Conteneur</Label><Input placeholder="Ex: MSCU1234567" value={conteneur.numero} onChange={(e) => handleConteneurChange(conteneur.id, 'numero', e.target.value.toUpperCase())} className="font-mono" /></div>
                          <div className="space-y-2"><Label>Description</Label><Input placeholder="Description de la marchandise" value={conteneur.description} onChange={(e) => handleConteneurChange(conteneur.id, 'description', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Taille</Label><Select value={conteneur.taille} onValueChange={(v) => handleConteneurChange(conteneur.id, 'taille', v)}><SelectTrigger><SelectValue placeholder="Taille" /></SelectTrigger><SelectContent><SelectItem value="20'">20'</SelectItem><SelectItem value="40'">40'</SelectItem></SelectContent></Select></div>
                          <div className="space-y-2"><Label>Prix (FCFA)</Label><Input type="number" placeholder="0" value={conteneur.prixUnitaire || ""} onChange={(e) => handleConteneurChange(conteneur.id, 'prixUnitaire', parseFloat(e.target.value) || 0)} className="text-right" /></div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between"><Label className="text-sm font-medium">Opérations</Label><Button type="button" variant="outline" size="sm" onClick={() => handleAddOperationConteneur(conteneur.id)} className="gap-1 text-xs"><Plus className="h-3 w-3" />Nouvelle opération</Button></div>
                          {conteneur.operations.length === 0 ? (<p className="text-sm text-muted-foreground italic">Aucune opération ajoutée.</p>) : (
                            <div className="space-y-3">
                              {conteneur.operations.map((op, opIndex) => (
                                <div key={op.id} className="p-3 border rounded-lg bg-muted/30 space-y-3">
                                  <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground font-medium">Opération {opIndex + 1}</span><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOperationConteneur(conteneur.id, op.id)} className="text-destructive h-6 w-6"><Trash2 className="h-3 w-3" /></Button></div>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="space-y-1 col-span-2"><Label className="text-xs">Type d'opération</Label><Select value={op.type} onValueChange={(value) => handleOperationConteneurChange(conteneur.id, op.id, "type", value)}><SelectTrigger className="h-9"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{(Object.keys(typesOperationConteneur) as TypeOperationConteneur[]).map((type) => (<SelectItem key={type} value={type}>{typesOperationConteneur[type].label}</SelectItem>))}</SelectContent></Select></div>
                                    <div className="space-y-1"><Label className="text-xs">Quantité</Label><Input type="number" min="1" className="h-9" value={op.quantite} onChange={(e) => handleOperationConteneurChange(conteneur.id, op.id, "quantite", parseInt(e.target.value) || 0)} /></div>
                                    <div className="space-y-1"><Label className="text-xs">Prix unit. (FCFA)</Label><Input type="number" min="0" className="h-9" value={op.prixUnitaire} onChange={(e) => handleOperationConteneurChange(conteneur.id, op.id, "prixUnitaire", parseInt(e.target.value) || 0)} /></div>
                                    <div className="space-y-1"><Label className="text-xs">Prix total</Label><Input type="number" className="h-9 bg-muted font-medium" value={op.prixTotal} readOnly /></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {index < conteneurs.length - 1 && <div className="border-b my-4" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-4 border-t mt-6"><div className="text-right"><span className="text-sm text-muted-foreground">Total: </span><span className="text-xl font-bold text-primary">{formatMontant(montantHT)}</span></div></div>
                </CardContent>
              </Card>
            </>
          )}

          {categorie === "conventionnel" && (
            <>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-primary" />Informations du lot</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-w-md space-y-2"><Label className="text-amber-600">Numéro BL *</Label><Input placeholder="Ex: MSCUAB123456" value={numeroBL} onChange={(e) => setNumeroBL(e.target.value.toUpperCase())} className="font-mono" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2"><Label className="flex items-center gap-2 text-amber-600"><MapPin className="h-4 w-4" />Lieu de chargement *</Label><Input placeholder="Ex: Port d'Owendo" value={lieuChargement} onChange={(e) => setLieuChargement(e.target.value)} /></div>
                    <div className="space-y-2"><Label className="flex items-center gap-2 text-amber-600"><MapPin className="h-4 w-4" />Lieu de déchargement *</Label><Input placeholder="Ex: Entrepôt client" value={lieuDechargement} onChange={(e) => setLieuDechargement(e.target.value)} /></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-lg"><Package className="h-5 w-5 text-primary" />Lots</CardTitle><Button type="button" variant="outline" size="sm" onClick={handleAddLot} className="gap-1"><Plus className="h-4 w-4" />Ajouter lot</Button></div></CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {lots.map((lot, index) => (
                      <div key={lot.id} className="space-y-4">
                        <div className="flex items-center justify-between"><span className="font-medium text-sm text-muted-foreground">Lot {index + 1}</span>{lots.length > 1 && (<Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLot(lot.id)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>)}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>N° Lot</Label><Input placeholder="Ex: LOT-2024-001" value={lot.numeroLot} onChange={(e) => handleLotChange(lot.id, 'numeroLot', e.target.value.toUpperCase())} className="font-mono" /></div>
                          <div className="space-y-2"><Label>Description</Label><Input placeholder="Description de la marchandise" value={lot.description} onChange={(e) => handleLotChange(lot.id, 'description', e.target.value)} /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2"><Label>Quantité</Label><Input type="number" min="1" value={lot.quantite} onChange={(e) => handleLotChange(lot.id, 'quantite', parseInt(e.target.value) || 0)} /></div>
                          <div className="space-y-2"><Label>Prix unitaire (FCFA)</Label><Input type="number" min="0" placeholder="0" value={lot.prixUnitaire || ""} onChange={(e) => handleLotChange(lot.id, 'prixUnitaire', parseInt(e.target.value) || 0)} /></div>
                          <div className="space-y-2"><Label>Prix total (FCFA)</Label><Input value={lot.prixTotal} disabled className="bg-muted font-medium" /></div>
                        </div>
                        {index < lots.length - 1 && <div className="border-b my-4" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-4 border-t mt-6"><div className="text-right"><span className="text-sm text-muted-foreground">Total: </span><span className="text-xl font-bold text-primary">{formatMontant(montantHT)}</span></div></div>
                </CardContent>
              </Card>
            </>
          )}

          {categorie === "operations_independantes" && (
            <>
              <Card>
                <CardHeader><CardTitle className="text-lg">Type d'opération indépendante</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {(Object.keys(operationsIndepLabels) as TypeOperationIndep[]).map((key) => {
                      const op = operationsIndepLabels[key];
                      const isSelected = typeOperationIndep === key;
                      return (<button key={key} type="button" onClick={() => setTypeOperationIndep(key)} className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 text-center ${isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}><div className={isSelected ? "text-primary" : "text-muted-foreground"}>{op.icon}</div><span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{op.label}</span></button>);
                    })}
                  </div>
                </CardContent>
              </Card>

              {typeOperationIndep && (
                <OperationsIndependantesForm
                  typeOperationIndep={typeOperationIndep}
                  prestations={prestations}
                  onAddPrestation={handleAddPrestation}
                  onRemovePrestation={handleRemovePrestation}
                  onPrestationChange={handlePrestationChange}
                />
              )}
            </>
          )}

          {categorie && (
            <Card><CardHeader><CardTitle className="text-lg">Conditions et notes</CardTitle></CardHeader><CardContent><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions particulières, notes..." rows={4} /></CardContent></Card>
          )}

          {categorie && (
            <div className="flex justify-end gap-4 pb-6">
              <Button type="button" variant="outline" onClick={() => navigate("/devis")} disabled={createDevisMutation.isPending}>Annuler</Button>
              <Button type="submit" className="gap-2" disabled={createDevisMutation.isPending}>
                {createDevisMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Créer le devis
              </Button>
            </div>
          )}
        </form>
      </div>
    </MainLayout>
  );
}
