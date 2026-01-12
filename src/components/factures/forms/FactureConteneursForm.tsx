import { useState, useEffect, useRef } from "react";
import { Container, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TypeOperation,
  TypeOperationConteneur,
  LigneConteneur,
  typesOperationConteneur,
  getInitialConteneur,
  calculateTotalConteneurs,
} from "@/types/documents";

interface Armateur {
  id: string | number;
  nom: string;
}

interface Transitaire {
  id: string | number;
  nom: string;
}

interface Representant {
  id: string | number;
  nom: string;
}

interface FactureConteneursFormProps {
  armateurs: Armateur[];
  transitaires: Transitaire[];
  representants: Representant[];
  onDataChange: (data: FactureConteneursData) => void;
  initialData?: FactureConteneursData | null;
}

export interface FactureConteneursData {
  typeOperation: TypeOperation | "";
  numeroBL: string;
  armateurId: string;
  transitaireId: string;
  representantId: string;
  primeTransitaire: number;
  primeRepresentant: number;
  conteneurs: LigneConteneur[];
  montantHT: number;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' XAF';
};

export default function FactureConteneursForm({
  armateurs,
  transitaires,
  representants,
  onDataChange,
  initialData,
}: FactureConteneursFormProps) {
  const lastInitKey = useRef<string>("");
  const [typeOperation, setTypeOperation] = useState<TypeOperation | "">("");
  const [numeroBL, setNumeroBL] = useState("");
  const [armateurId, setArmateurId] = useState("");
  const [transitaireId, setTransitaireId] = useState("");
  const [representantId, setRepresentantId] = useState("");
  const [primeTransitaire, setPrimeTransitaire] = useState<number>(0);
  const [primeRepresentant, setPrimeRepresentant] = useState<number>(0);
  const [conteneurs, setConteneurs] = useState<LigneConteneur[]>([getInitialConteneur()]);

  // Sync initialData une seule fois
  useEffect(() => {
    if (!initialData) return;
    const initKey = JSON.stringify(initialData);
    if (initKey === lastInitKey.current) return;
    
    setTypeOperation(initialData.typeOperation || "");
    setNumeroBL(initialData.numeroBL || "");
    setArmateurId(initialData.armateurId || "");
    setTransitaireId(initialData.transitaireId || "");
    setRepresentantId(initialData.representantId || "");
    setPrimeTransitaire(initialData.primeTransitaire || 0);
    setPrimeRepresentant(initialData.primeRepresentant || 0);
    if (initialData.conteneurs?.length > 0) {
      setConteneurs(initialData.conteneurs);
    }
    lastInitKey.current = initKey;
  }, [initialData]);
  const updateParent = (newConteneurs: LigneConteneur[]) => {
    const montantHT = calculateTotalConteneurs(newConteneurs);
    onDataChange({
      typeOperation,
      numeroBL,
      armateurId,
      transitaireId,
      representantId,
      primeTransitaire,
      primeRepresentant,
      conteneurs: newConteneurs,
      montantHT,
    });
  };

  useEffect(() => {
    updateParent(conteneurs);
  }, [typeOperation, numeroBL, armateurId, transitaireId, representantId, primeTransitaire, primeRepresentant]);

  const handleAddConteneur = () => {
    const newConteneurs = [...conteneurs, { ...getInitialConteneur(), id: String(Date.now()) }];
    setConteneurs(newConteneurs);
    updateParent(newConteneurs);
  };

  const handleRemoveConteneur = (id: string) => {
    if (conteneurs.length > 1) {
      const newConteneurs = conteneurs.filter(c => c.id !== id);
      setConteneurs(newConteneurs);
      updateParent(newConteneurs);
    }
  };

  const handleConteneurChange = (id: string, field: keyof Omit<LigneConteneur, 'operations'>, value: string | number) => {
    const newConteneurs = conteneurs.map(c => c.id === id ? { ...c, [field]: value } : c);
    setConteneurs(newConteneurs);
    updateParent(newConteneurs);
  };

  const handleAddOperationConteneur = (conteneurId: string) => {
    const newConteneurs = conteneurs.map(c => {
      if (c.id === conteneurId) {
        const defaultType: TypeOperationConteneur = "arrivee";
        const defaultPrix = typesOperationConteneur[defaultType].prixDefaut;
        return {
          ...c,
          operations: [...c.operations, {
            id: String(Date.now()),
            type: defaultType,
            description: "",
            quantite: 1,
            prixUnitaire: defaultPrix,
            prixTotal: defaultPrix
          }]
        };
      }
      return c;
    });
    setConteneurs(newConteneurs);
    updateParent(newConteneurs);
  };

  const handleRemoveOperationConteneur = (conteneurId: string, operationId: string) => {
    const newConteneurs = conteneurs.map(c =>
      c.id === conteneurId
        ? { ...c, operations: c.operations.filter(op => op.id !== operationId) }
        : c
    );
    setConteneurs(newConteneurs);
    updateParent(newConteneurs);
  };

  const handleOperationConteneurChange = (conteneurId: string, operationId: string, field: string, value: string | number) => {
    const newConteneurs = conteneurs.map(c => {
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
    });
    setConteneurs(newConteneurs);
    updateParent(newConteneurs);
  };

  const montantHT = calculateTotalConteneurs(conteneurs);

  return (
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
              <Input
                placeholder="Ex: MSCUAB123456"
                value={numeroBL}
                onChange={(e) => setNumeroBL(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Armateur *</Label>
              <Select value={armateurId} onValueChange={setArmateurId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {armateurs.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-amber-600">Transitaire</Label>
              <Select value={transitaireId} onValueChange={setTransitaireId}>
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="Sélectionner (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {transitaires.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-amber-600">Représentant</Label>
              <Select value={representantId} onValueChange={setRepresentantId}>
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="Sélectionner (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {representants.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-pink-600">Prime transitaire (FCFA)</Label>
              <Input
                type="number"
                placeholder="0"
                value={primeTransitaire || ""}
                onChange={(e) => setPrimeTransitaire(parseFloat(e.target.value) || 0)}
                className="border-pink-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-pink-600">Prime représentant (FCFA)</Label>
              <Input
                type="number"
                placeholder="0"
                value={primeRepresentant || ""}
                onChange={(e) => setPrimeRepresentant(parseFloat(e.target.value) || 0)}
                className="border-pink-200"
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
              Ajouter conteneur
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveConteneur(conteneur.id)}
                      className="text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>N° Conteneur</Label>
                    <Input
                      placeholder="Ex: MSCU1234567"
                      value={conteneur.numero}
                      onChange={(e) => handleConteneurChange(conteneur.id, 'numero', e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Description de la marchandise"
                      value={conteneur.description}
                      onChange={(e) => handleConteneurChange(conteneur.id, 'description', e.target.value)}
                    />
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
                    <Input
                      type="number"
                      placeholder="0"
                      value={conteneur.prixUnitaire || ""}
                      onChange={(e) => handleConteneurChange(conteneur.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Opérations</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddOperationConteneur(conteneur.id)}
                      className="gap-1 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                      Nouvelle opération
                    </Button>
                  </div>

                  {conteneur.operations.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Aucune opération ajoutée.</p>
                  ) : (
                    <div className="space-y-3">
                      {conteneur.operations.map((op, opIndex) => (
                        <div key={op.id} className="p-3 border rounded-lg bg-muted/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-medium">Opération {opIndex + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveOperationConteneur(conteneur.id, op.id)}
                              className="text-destructive h-6 w-6"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="space-y-1 col-span-2">
                              <Label className="text-xs">Type d'opération</Label>
                              <Select
                                value={op.type}
                                onValueChange={(value) => handleOperationConteneurChange(conteneur.id, op.id, "type", value)}
                              >
                                <SelectTrigger className="h-9"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                <SelectContent>
                                  {(Object.keys(typesOperationConteneur) as TypeOperationConteneur[]).map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {typesOperationConteneur[type].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Quantité</Label>
                              <Input
                                type="number"
                                min="1"
                                className="h-9"
                                value={op.quantite}
                                onChange={(e) => handleOperationConteneurChange(conteneur.id, op.id, "quantite", parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Prix unit. (FCFA)</Label>
                              <Input
                                type="number"
                                min="0"
                                className="h-9"
                                value={op.prixUnitaire}
                                onChange={(e) => handleOperationConteneurChange(conteneur.id, op.id, "prixUnitaire", parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Prix total</Label>
                              <Input
                                type="number"
                                className="h-9 bg-muted font-medium"
                                value={op.prixTotal}
                                readOnly
                              />
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
  );
}
