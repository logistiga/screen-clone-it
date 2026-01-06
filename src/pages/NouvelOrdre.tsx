import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ship, Container, Package, Truck, Forklift, Warehouse, Users, FileText, Plus, Trash2, Save } from "lucide-react";
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
import { TotauxDocument } from "@/components/forms/TotauxDocument";
import { clients, LigneDocument, TAUX_TVA, TAUX_CSS, configurationNumerotation, formatMontant } from "@/data/mockData";
import { toast } from "sonner";

// Types de catégories principales
type CategorieOrdre = "conteneurs" | "conventionnel" | "operations_independantes";

// Types d'opérations
type TypeOperation = "import" | "export";
type TypeOperationIndep = "location" | "transport" | "manutention" | "stockage";

interface LigneConteneur {
  id: string;
  numero: string;
  taille: "20'" | "40'" | "";
  description: string;
  prixUnitaire: number;
}

interface LignePrestation {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
}

const categoriesLabels: Record<CategorieOrdre, { label: string; description: string; icon: React.ReactNode }> = {
  conteneurs: {
    label: "Conteneurs",
    description: "Import/Export conteneurs",
    icon: <Container className="h-6 w-6" />,
  },
  conventionnel: {
    label: "Conventionnel",
    description: "Marchandises en vrac",
    icon: <Package className="h-6 w-6" />,
  },
  operations_independantes: {
    label: "Opérations indépendantes",
    description: "Location, Transport, Manutention, Stockage",
    icon: <Truck className="h-6 w-6" />,
  },
};

const operationsIndepLabels: Record<TypeOperationIndep, { label: string; icon: React.ReactNode }> = {
  location: { label: "Location véhicule/équipement", icon: <Truck className="h-5 w-5" /> },
  transport: { label: "Transport", icon: <Truck className="h-5 w-5" /> },
  manutention: { label: "Manutention", icon: <Forklift className="h-5 w-5" /> },
  stockage: { label: "Stockage", icon: <Warehouse className="h-5 w-5" /> },
};

export default function NouvelOrdrePage() {
  const navigate = useNavigate();

  // Catégorie principale
  const [categorie, setCategorie] = useState<CategorieOrdre | "">("");
  
  // Client
  const [clientId, setClientId] = useState("");
  
  // Infos BL (pour conteneurs/conventionnel)
  const [typeOperation, setTypeOperation] = useState<TypeOperation | "">("");
  const [numeroBL, setNumeroBL] = useState("");
  
  // Conteneurs
  const [conteneurs, setConteneurs] = useState<LigneConteneur[]>([
    { id: "1", numero: "", taille: "", description: "", prixUnitaire: 0 }
  ]);
  
  // Prestations (conventionnel et opérations indépendantes)
  const [prestations, setPrestations] = useState<LignePrestation[]>([
    { id: "1", description: "", quantite: 1, prixUnitaire: 0, montantHT: 0 }
  ]);
  
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
    setConteneurs([
      ...conteneurs,
      { id: String(Date.now()), numero: "", taille: "", description: "", prixUnitaire: 0 }
    ]);
  };

  const handleRemoveConteneur = (id: string) => {
    if (conteneurs.length > 1) {
      setConteneurs(conteneurs.filter(c => c.id !== id));
    }
  };

  const handleConteneurChange = (id: string, field: keyof LigneConteneur, value: string | number) => {
    setConteneurs(conteneurs.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  // Gestion des prestations
  const handleAddPrestation = () => {
    setPrestations([
      ...prestations,
      { id: String(Date.now()), description: "", quantite: 1, prixUnitaire: 0, montantHT: 0 }
    ]);
  };

  const handleRemovePrestation = (id: string) => {
    if (prestations.length > 1) {
      setPrestations(prestations.filter(p => p.id !== id));
    }
  };

  const handlePrestationChange = (id: string, field: keyof LignePrestation, value: string | number) => {
    setPrestations(prestations.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === 'quantite' || field === 'prixUnitaire') {
          updated.montantHT = updated.quantite * updated.prixUnitaire;
        }
        return updated;
      }
      return p;
    }));
  };

  // Calcul des totaux
  const calculateTotal = (): number => {
    if (categorie === "conteneurs") {
      return conteneurs.reduce((sum, c) => sum + (c.prixUnitaire || 0), 0);
    }
    return prestations.reduce((sum, p) => sum + p.montantHT, 0);
  };

  const montantHT = calculateTotal();
  const tva = Math.round(montantHT * TAUX_TVA);
  const css = Math.round(montantHT * TAUX_CSS);
  const montantTTC = montantHT + tva + css;

  // Reset catégorie
  const handleCategorieChange = (value: CategorieOrdre) => {
    setCategorie(value);
    setTypeOperation("");
    setTypeOperationIndep("");
    setConteneurs([{ id: "1", numero: "", taille: "", description: "", prixUnitaire: 0 }]);
    setPrestations([{ id: "1", description: "", quantite: 1, prixUnitaire: 0, montantHT: 0 }]);
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

    const data = {
      id: Date.now().toString(),
      numero: generateNumero(),
      clientId,
      categorie,
      typeOperation: categorie === "operations_independantes" ? typeOperationIndep : typeOperation,
      numeroBL,
      conteneurs: categorie === "conteneurs" ? conteneurs : [],
      prestations: categorie !== "conteneurs" ? prestations : [],
      montantHT,
      tva,
      css,
      montantTTC,
      montantPaye: 0,
      statut: 'en_cours',
      notes,
      dateCreation: new Date().toISOString().split('T')[0]
    };

    console.log("Ordre créé:", data);
    toast.success("Ordre de travail créé avec succès");
    navigate("/ordres");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
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
                Numéro: <span className="font-medium">{generateNumero()}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Sélection de catégorie */}
          {!categorie && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Catégorie d'ordre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.keys(categoriesLabels) as CategorieOrdre[]).map((key) => {
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
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setCategorie("")}
                className="text-muted-foreground"
              >
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
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom}
                        </SelectItem>
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
                    Informations BL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type d'opération *</Label>
                      <Select value={typeOperation} onValueChange={(v) => setTypeOperation(v as TypeOperation)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="import">Import</SelectItem>
                          <SelectItem value="export">Export</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Numéro BL *</Label>
                      <Input
                        placeholder="Ex: MSCUAB123456"
                        value={numeroBL}
                        onChange={(e) => setNumeroBL(e.target.value.toUpperCase())}
                        className="font-mono"
                      />
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
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conteneurs.map((conteneur, index) => (
                      <div key={conteneur.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Conteneur {index + 1}</span>
                          {conteneurs.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveConteneur(conteneur.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Numéro conteneur</Label>
                            <Input
                              placeholder="MSKU1234567"
                              value={conteneur.numero}
                              onChange={(e) => handleConteneurChange(conteneur.id, 'numero', e.target.value.toUpperCase())}
                              className="font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Taille</Label>
                            <Select 
                              value={conteneur.taille} 
                              onValueChange={(v) => handleConteneurChange(conteneur.id, 'taille', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Taille" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="20'">20'</SelectItem>
                                <SelectItem value="40'">40'</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              placeholder="Description..."
                              value={conteneur.description}
                              onChange={(e) => handleConteneurChange(conteneur.id, 'description', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Prix (XAF)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={conteneur.prixUnitaire || ""}
                              onChange={(e) => handleConteneurChange(conteneur.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
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
                    Informations BL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md space-y-2">
                    <Label>Numéro BL *</Label>
                    <Input
                      placeholder="Ex: CONV2026001"
                      value={numeroBL}
                      onChange={(e) => setNumeroBL(e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-primary" />
                      Prestations
                    </CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddPrestation} className="gap-1">
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                      <div className="col-span-5">Description</div>
                      <div className="col-span-2">Quantité</div>
                      <div className="col-span-2">Prix unitaire</div>
                      <div className="col-span-2">Montant HT</div>
                      <div className="col-span-1"></div>
                    </div>
                    {prestations.map((prestation) => (
                      <div key={prestation.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <Input
                            placeholder="Description..."
                            value={prestation.description}
                            onChange={(e) => handlePrestationChange(prestation.id, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            value={prestation.quantite}
                            onChange={(e) => handlePrestationChange(prestation.id, 'quantite', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            value={prestation.prixUnitaire || ""}
                            onChange={(e) => handlePrestationChange(prestation.id, 'prixUnitaire', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={formatMontant(prestation.montantHT)}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div className="col-span-1">
                          {prestations.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePrestation(prestation.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
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
                  <CardTitle className="text-lg">Type d'opération</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(operationsIndepLabels) as TypeOperationIndep[]).map((key) => {
                      const op = operationsIndepLabels[key];
                      const isSelected = typeOperationIndep === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTypeOperationIndep(key)}
                          className={`p-3 rounded-lg border-2 text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className={isSelected ? "text-primary" : "text-muted-foreground"}>
                            {op.icon}
                          </div>
                          <span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>
                            {op.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {typeOperationIndep && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {operationsIndepLabels[typeOperationIndep].icon}
                        Détail {operationsIndepLabels[typeOperationIndep].label}
                      </CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddPrestation} className="gap-1">
                        <Plus className="h-4 w-4" />
                        Ajouter ligne
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                        <div className="col-span-5">Description</div>
                        <div className="col-span-2">Quantité</div>
                        <div className="col-span-2">Prix unitaire</div>
                        <div className="col-span-2">Montant HT</div>
                        <div className="col-span-1"></div>
                      </div>
                      {prestations.map((prestation) => (
                        <div key={prestation.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <Input
                              placeholder="Description..."
                              value={prestation.description}
                              onChange={(e) => handlePrestationChange(prestation.id, 'description', e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min="1"
                              value={prestation.quantite}
                              onChange={(e) => handlePrestationChange(prestation.id, 'quantite', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min="0"
                              value={prestation.prixUnitaire || ""}
                              onChange={(e) => handlePrestationChange(prestation.id, 'prixUnitaire', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={formatMontant(prestation.montantHT)}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                          <div className="col-span-1">
                            {prestations.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemovePrestation(prestation.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Récapitulatif */}
          {categorie && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent>
                <TotauxDocument
                  montantHT={montantHT}
                  tva={tva}
                  css={css}
                  montantTTC={montantTTC}
                />
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {categorie && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observations</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes ou observations..."
                  rows={4}
                />
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {categorie && (
            <div className="flex justify-end gap-4 pb-6">
              <Button type="button" variant="outline" onClick={() => navigate("/ordres")}>
                Annuler
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                Créer l'ordre de travail
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
