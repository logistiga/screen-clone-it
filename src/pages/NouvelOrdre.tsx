import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ship, Container, Package, Users, FileText, Plus, Trash2, Save, MapPin, Handshake } from "lucide-react";
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
import { clients, TAUX_TVA, TAUX_CSS, configurationNumerotation, formatMontant } from "@/data/mockData";
import { toast } from "sonner";
import { primesPartenaires, transitairesData, representantsData } from "@/data/partenairesData";
import { PrimePartenaire } from "@/types/partenaires";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  CategorieDocument,
  TypeOperation,
  TypeOperationIndep,
  TypeOperationConteneur,
  LigneConteneur,
  LigneLot,
  LignePrestationEtendue,
  typesOperationConteneur,
  armateurs,
  transitaires,
  representants,
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

export default function NouvelOrdrePage() {
  const navigate = useNavigate();
  
  const categoriesLabels = getCategoriesLabels();
  const operationsIndepLabels = getOperationsIndepLabels();

  // Catégorie principale
  const [categorie, setCategorie] = useState<CategorieDocument | "">("");
  
  // Client
  const [clientId, setClientId] = useState("");
  
  // Infos BL (pour conteneurs/conventionnel)
  const [typeOperation, setTypeOperation] = useState<TypeOperation | "">("");
  const [numeroBL, setNumeroBL] = useState("");
  const [armateurId, setArmateurId] = useState("");
  const [transitaireId, setTransitaireId] = useState("");
  const [representantId, setRepresentantId] = useState("");
  const [primeTransitaire, setPrimeTransitaire] = useState<number>(0);
  const [primeRepresentant, setPrimeRepresentant] = useState<number>(0);
  
  // Conteneurs
  const [conteneurs, setConteneurs] = useState<LigneConteneur[]>([getInitialConteneur()]);
  
  // Lots (pour conventionnel)
  const [lots, setLots] = useState<LigneLot[]>([getInitialLot()]);
  
  // Lieux (pour conventionnel)
  const [lieuChargement, setLieuChargement] = useState("");
  const [lieuDechargement, setLieuDechargement] = useState("");
  
  // Prestations (opérations indépendantes)
  const [prestations, setPrestations] = useState<LignePrestationEtendue[]>([getInitialPrestationEtendue()]);
  
  // Type opération indépendante
  const [typeOperationIndep, setTypeOperationIndep] = useState<TypeOperationIndep | "">("");
  
  // Notes
  const [notes, setNotes] = useState("");

  // Generate numero
  const generateNumero = () => {
    const year = new Date().getFullYear();
    const counter = configurationNumerotation.prochainNumeroOrdre.toString().padStart(4, '0');
    return `${configurationNumerotation.prefixeOrdre}-${year}-${counter}`;
  };

  // Gestion des conteneurs
  const handleAddConteneur = () => {
    setConteneurs([...conteneurs, { ...getInitialConteneur(), id: String(Date.now()) }]);
  };

  const handleRemoveConteneur = (id: string) => {
    if (conteneurs.length > 1) {
      setConteneurs(conteneurs.filter(c => c.id !== id));
    }
  };

  const handleConteneurChange = (id: string, field: keyof Omit<LigneConteneur, 'operations'>, value: string | number) => {
    setConteneurs(conteneurs.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Gestion des opérations de conteneur
  const handleAddOperationConteneur = (conteneurId: string) => {
    setConteneurs(conteneurs.map(c => {
      if (c.id === conteneurId) {
        const defaultType: TypeOperationConteneur = "arrivee";
        const defaultPrix = typesOperationConteneur[defaultType].prixDefaut;
        return {
          ...c,
          operations: [
            ...c.operations,
            { id: String(Date.now()), type: defaultType, description: "", quantite: 1, prixUnitaire: defaultPrix, prixTotal: defaultPrix }
          ]
        };
      }
      return c;
    }));
  };

  const handleRemoveOperationConteneur = (conteneurId: string, operationId: string) => {
    setConteneurs(conteneurs.map(c => {
      if (c.id === conteneurId) {
        return { ...c, operations: c.operations.filter(op => op.id !== operationId) };
      }
      return c;
    }));
  };

  const handleOperationConteneurChange = (
    conteneurId: string,
    operationId: string,
    field: string,
    value: string | number
  ) => {
    setConteneurs(conteneurs.map(c => {
      if (c.id === conteneurId) {
        return {
          ...c,
          operations: c.operations.map(op => {
            if (op.id === operationId) {
              const updated = { ...op, [field]: value };
              if (field === "type") {
                const typeOp = value as TypeOperationConteneur;
                updated.prixUnitaire = typesOperationConteneur[typeOp]?.prixDefaut || 0;
                updated.prixTotal = updated.quantite * updated.prixUnitaire;
              }
              if (field === "quantite" || field === "prixUnitaire") {
                updated.prixTotal = updated.quantite * updated.prixUnitaire;
              }
              return updated;
            }
            return op;
          })
        };
      }
      return c;
    }));
  };

  // Gestion des lots
  const handleAddLot = () => {
    setLots([...lots, { ...getInitialLot(), id: String(Date.now()) }]);
  };

  const handleRemoveLot = (id: string) => {
    if (lots.length > 1) {
      setLots(lots.filter(l => l.id !== id));
    }
  };

  const handleLotChange = (id: string, field: keyof LigneLot, value: string | number) => {
    setLots(lots.map(l => {
      if (l.id === id) {
        const updated = { ...l, [field]: value };
        if (field === 'quantite' || field === 'prixUnitaire') {
          updated.prixTotal = updated.quantite * updated.prixUnitaire;
        }
        return updated;
      }
      return l;
    }));
  };

  // Gestion des prestations
  const handleAddPrestation = () => {
    setPrestations([...prestations, { ...getInitialPrestationEtendue(), id: String(Date.now()) }]);
  };

  const handleRemovePrestation = (id: string) => {
    if (prestations.length > 1) {
      setPrestations(prestations.filter(p => p.id !== id));
    }
  };

  const handlePrestationChange = (id: string, field: keyof LignePrestationEtendue, value: string | number) => {
    setPrestations(prestations.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        // Recalculer la quantité si on change les dates
        if (field === 'dateDebut' || field === 'dateFin') {
          const dateDebut = field === 'dateDebut' ? String(value) : updated.dateDebut || '';
          const dateFin = field === 'dateFin' ? String(value) : updated.dateFin || '';
          if (dateDebut && dateFin) {
            updated.quantite = calculateDaysBetween(dateDebut, dateFin);
          }
        }
        if (field === 'quantite' || field === 'prixUnitaire') {
          updated.montantHT = updated.quantite * updated.prixUnitaire;
        }
        return updated;
      }
      return p;
    }));
  };

  const calculateTotalPrestations = (prestations: LignePrestationEtendue[]): number => {
    return prestations.reduce((sum, p) => sum + p.montantHT, 0);
  };

  // Calcul des totaux
  const calculateTotal = (): number => {
    if (categorie === "conteneurs") return calculateTotalConteneurs(conteneurs);
    if (categorie === "conventionnel") return calculateTotalLots(lots);
    return calculateTotalPrestations(prestations);
  };

  const montantHT = calculateTotal();
  const tva = Math.round(montantHT * TAUX_TVA);
  const css = Math.round(montantHT * TAUX_CSS);
  const montantTTC = montantHT + tva + css;

  // Reset catégorie
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

  // Génération automatique des primes partenaires
  const generatePrimesPartenaires = (ordreId: string, ordreNumero: string) => {
    const dateCreation = new Date().toISOString().split('T')[0];
    const primesGeneres: PrimePartenaire[] = [];

    // Prime transitaire
    if (transitaireId && primeTransitaire > 0) {
      const primeTransit: PrimePartenaire = {
        id: `prime-${Date.now()}-trans`,
        ordreId,
        ordreNumero,
        transitaireId,
        montant: primeTransitaire,
        statut: 'due',
        dateCreation
      };
      primesPartenaires.push(primeTransit);
      primesGeneres.push(primeTransit);
    }

    // Prime représentant
    if (representantId && primeRepresentant > 0) {
      const primeRep: PrimePartenaire = {
        id: `prime-${Date.now()}-rep`,
        ordreId,
        ordreNumero,
        representantId,
        montant: primeRepresentant,
        statut: 'due',
        dateCreation
      };
      primesPartenaires.push(primeRep);
      primesGeneres.push(primeRep);
    }

    return primesGeneres;
  };

  // Envoi des données partenaires à la comptabilité
  const envoyerComptabilite = (data: any, primes: PrimePartenaire[]) => {
    const transitaire = transitaireId ? transitairesData.find(t => t.id === transitaireId) : null;
    const representant = representantId ? representantsData.find(r => r.id === representantId) : null;

    const dataComptabilite = {
      ...data,
      partenaires: {
        transitaire: transitaire ? {
          id: transitaire.id,
          nom: transitaire.nom,
          email: transitaire.email,
          telephone: transitaire.telephone,
          prime: primeTransitaire
        } : null,
        representant: representant ? {
          id: representant.id,
          nom: representant.nom,
          email: representant.email,
          telephone: representant.telephone,
          prime: primeRepresentant
        } : null,
        totalPrimes: primeTransitaire + primeRepresentant
      },
      primesGenerees: primes
    };

    console.log("📊 Données envoyées à la comptabilité:", dataComptabilite);
    return dataComptabilite;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (!categorie) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }
    if ((categorie === "conteneurs" || categorie === "conventionnel") && !numeroBL) {
      toast.error("Veuillez saisir le numéro de BL");
      return;
    }
    if (categorie === "operations_independantes" && !typeOperationIndep) {
      toast.error("Veuillez sélectionner un type d'opération");
      return;
    }

    const ordreId = Date.now().toString();
    const ordreNumero = generateNumero();

    const data = {
      id: ordreId,
      numero: ordreNumero,
      clientId,
      categorie,
      typeOperation: categorie === "operations_independantes" ? typeOperationIndep : typeOperation,
      numeroBL,
      armateurId,
      transitaireId,
      representantId,
      primeTransitaire,
      primeRepresentant,
      conteneurs: categorie === "conteneurs" ? conteneurs : [],
      lots: categorie === "conventionnel" ? lots : [],
      prestations: categorie === "operations_independantes" ? prestations : [],
      montantHT,
      tva,
      css,
      montantTTC,
      montantPaye: 0,
      statut: 'en_cours',
      notes,
      dateCreation: new Date().toISOString().split('T')[0]
    };

    // Générer automatiquement les primes partenaires
    const primesGenerees = generatePrimesPartenaires(ordreId, ordreNumero);

    // Envoyer à la comptabilité avec les données partenaires
    const dataComptabilite = envoyerComptabilite(data, primesGenerees);

    console.log("Ordre créé:", data);
    
    // Afficher message de succès avec info sur les primes
    if (primesGenerees.length > 0) {
      toast.success(`Ordre créé avec ${primesGenerees.length} prime(s) générée(s) et envoyé à la comptabilité`);
    } else {
      toast.success("Ordre de travail créé avec succès");
    }
    
    navigate("/ordres");
  };

  return (
    <MainLayout title="Nouvel ordre de travail">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ordres")}>
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
      </div>

      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Sélection de catégorie */}
          {!categorie && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Catégorie d'ordre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.keys(categoriesLabels) as CategorieDocument[]).map((key) => {
                    const cat = categoriesLabels[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCategorieChange(key)}
                        className="p-4 rounded-lg border-2 text-left transition-all border-border hover:border-primary/50 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-muted-foreground">{cat.icon}</div>
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

          {/* Badge catégorie sélectionnée */}
          {categorie && (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="py-2 px-4 text-sm flex items-center gap-2">
                {categoriesLabels[categorie].icon}
                <span>{categoriesLabels[categorie].label}</span>
              </Badge>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCategorie("")} className="text-muted-foreground">
                Changer
              </Button>
            </div>
          )}

          {/* Section Client */}
          {categorie && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-md">
                  <Label htmlFor="client">Nom du client *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section Conteneurs */}
          {categorie === "conteneurs" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Type d'opération et informations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Type d'opération *</Label>
                      <Select value={typeOperation} onValueChange={(v) => setTypeOperation(v as TypeOperation)}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="import">Import</SelectItem>
                          <SelectItem value="export">Export</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Numéro BL *</Label>
                      <Input placeholder="Ex: MSCUAB123456" value={numeroBL} onChange={(e) => setNumeroBL(e.target.value.toUpperCase())} className="font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label>Armateur *</Label>
                      <Select value={armateurId} onValueChange={setArmateurId}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        <SelectContent>
                          {armateurs.map((a) => (<SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-amber-600">Transitaire</Label>
                      <Select value={transitaireId} onValueChange={setTransitaireId}>
                        <SelectTrigger className="border-amber-200"><SelectValue placeholder="Sélectionner (optionnel)" /></SelectTrigger>
                        <SelectContent>
                          {transitaires.map((t) => (<SelectItem key={t.id} value={t.id}>{t.nom}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-amber-600">Représentant</Label>
                      <Select value={representantId} onValueChange={setRepresentantId}>
                        <SelectTrigger className="border-amber-200"><SelectValue placeholder="Sélectionner (optionnel)" /></SelectTrigger>
                        <SelectContent>
                          {representants.map((r) => (<SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prime transitaire (FCFA)</Label>
                      <Input type="number" placeholder="0" value={primeTransitaire || ""} onChange={(e) => setPrimeTransitaire(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Prime représentant (FCFA)</Label>
                      <Input type="number" placeholder="0" value={primeRepresentant || ""} onChange={(e) => setPrimeRepresentant(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Container className="h-5 w-5 text-primary" />
                      Conteneurs
                    </CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddConteneur} className="gap-1">
                      <Plus className="h-4 w-4" />Ajouter conteneur
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {conteneurs.map((conteneur, index) => (
                      <div key={conteneur.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-muted-foreground">Conteneur {index + 1}</span>
                          {conteneurs.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveConteneur(conteneur.id)} className="text-destructive h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>N° Conteneur</Label>
                            <Input placeholder="Ex: MSCU1234567" value={conteneur.numero} onChange={(e) => handleConteneurChange(conteneur.id, 'numero', e.target.value.toUpperCase())} className="font-mono" />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input placeholder="Description de la marchandise" value={conteneur.description} onChange={(e) => handleConteneurChange(conteneur.id, 'description', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Taille</Label>
                            <Select value={conteneur.taille} onValueChange={(v) => handleConteneurChange(conteneur.id, 'taille', v)}>
                              <SelectTrigger><SelectValue placeholder="Taille" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="20'">20'</SelectItem>
                                <SelectItem value="40'">40'</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Prix (FCFA)</Label>
                            <Input type="number" placeholder="0" value={conteneur.prixUnitaire || ""} onChange={(e) => handleConteneurChange(conteneur.id, 'prixUnitaire', parseFloat(e.target.value) || 0)} className="text-right" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Opérations</Label>
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" size="sm" className="gap-1 text-xs" disabled>Associer existante</Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => handleAddOperationConteneur(conteneur.id)} className="gap-1 text-xs">
                                <Plus className="h-3 w-3" />Nouvelle opération
                              </Button>
                            </div>
                          </div>
                          {conteneur.operations.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">Aucune opération ajoutée.</p>
                          ) : (
                            <div className="space-y-3">
                              {conteneur.operations.map((op, opIndex) => (
                                <div key={op.id} className="p-3 border rounded-lg bg-muted/30 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground font-medium">Opération {opIndex + 1}</span>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOperationConteneur(conteneur.id, op.id)} className="text-destructive h-6 w-6">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="space-y-1 col-span-2">
                                      <Label className="text-xs">Type d'opération</Label>
                                      <Select value={op.type} onValueChange={(value) => handleOperationConteneurChange(conteneur.id, op.id, "type", value)}>
                                        <SelectTrigger className="h-9"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                        <SelectContent>
                                          {(Object.keys(typesOperationConteneur) as TypeOperationConteneur[]).map((type) => (
                                            <SelectItem key={type} value={type}>{typesOperationConteneur[type].label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Quantité</Label>
                                      <Input type="number" min="1" className="h-9" value={op.quantite} onChange={(e) => handleOperationConteneurChange(conteneur.id, op.id, "quantite", parseInt(e.target.value) || 0)} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Prix unit. (FCFA)</Label>
                                      <Input type="number" min="0" className="h-9" value={op.prixUnitaire} onChange={(e) => handleOperationConteneurChange(conteneur.id, op.id, "prixUnitaire", parseInt(e.target.value) || 0)} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Prix total</Label>
                                      <Input type="number" className="h-9 bg-muted font-medium" value={op.prixTotal} readOnly />
                                    </div>
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
                  <div className="flex justify-end pt-4 border-t mt-6">
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Total: </span>
                      <span className="text-xl font-bold text-primary">{formatMontant(montantHT)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Section Conventionnel */}
          {categorie === "conventionnel" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Informations du lot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-w-md space-y-2">
                    <Label className="text-amber-600">Numéro BL *</Label>
                    <Input placeholder="Ex: MSCUAB123456" value={numeroBL} onChange={(e) => setNumeroBL(e.target.value.toUpperCase())} className="font-mono" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-amber-600"><MapPin className="h-4 w-4" />Lieu de chargement *</Label>
                      <Input placeholder="Ex: Port d'Owendo" value={lieuChargement} onChange={(e) => setLieuChargement(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-amber-600"><MapPin className="h-4 w-4" />Lieu de déchargement *</Label>
                      <Input placeholder="Ex: Entrepôt client" value={lieuDechargement} onChange={(e) => setLieuDechargement(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-primary" />
                      Lots
                    </CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddLot} className="gap-1">
                      <Plus className="h-4 w-4" />Ajouter lot
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {lots.map((lot, index) => (
                      <div key={lot.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-muted-foreground">Lot {index + 1}</span>
                          {lots.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLot(lot.id)} className="text-destructive h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>N° Lot</Label>
                            <Input placeholder="Ex: LOT-2024-001" value={lot.numeroLot} onChange={(e) => handleLotChange(lot.id, 'numeroLot', e.target.value.toUpperCase())} className="font-mono" />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input placeholder="Description de la marchandise" value={lot.description} onChange={(e) => handleLotChange(lot.id, 'description', e.target.value)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Quantité</Label>
                            <Input type="number" min="1" value={lot.quantite} onChange={(e) => handleLotChange(lot.id, 'quantite', parseInt(e.target.value) || 0)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Prix unitaire (FCFA)</Label>
                            <Input type="number" min="0" placeholder="0" value={lot.prixUnitaire || ""} onChange={(e) => handleLotChange(lot.id, 'prixUnitaire', parseInt(e.target.value) || 0)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Prix total (FCFA)</Label>
                            <Input value={lot.prixTotal} disabled className="bg-muted font-medium" />
                          </div>
                        </div>
                        {index < lots.length - 1 && <div className="border-b my-4" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-4 border-t mt-6">
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Total: </span>
                      <span className="text-xl font-bold text-primary">{formatMontant(montantHT)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Section Opérations indépendantes */}
          {categorie === "operations_independantes" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Type d'opération indépendante</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {(Object.keys(operationsIndepLabels) as TypeOperationIndep[]).map((key) => {
                      const op = operationsIndepLabels[key];
                      const isSelected = typeOperationIndep === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTypeOperationIndep(key)}
                          className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 text-center ${isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                        >
                          <div className={isSelected ? "text-primary" : "text-muted-foreground"}>{op.icon}</div>
                          <span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{op.label}</span>
                        </button>
                      );
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

          {/* Observations */}
          {categorie && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observations</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Remarques ou instructions particulières..." rows={4} />
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {categorie && (
            <div className="flex justify-end gap-4 pb-6">
              <Button type="button" variant="outline" onClick={() => navigate("/ordres")}>Annuler</Button>
              <Button type="submit" className="gap-2"><Save className="h-4 w-4" />Créer l'ordre de travail</Button>
            </div>
          )}
        </form>
      </div>
    </MainLayout>
  );
}
