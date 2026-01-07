import { Plus, Trash2, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMontant } from "@/data/mockData";
import {
  TypeOperationIndep,
  LignePrestationEtendue,
  getOperationsIndepLabels,
  calculateDaysBetween,
} from "@/types/documents";

interface OperationsIndependantesFormProps {
  typeOperationIndep: TypeOperationIndep;
  prestations: LignePrestationEtendue[];
  onAddPrestation: () => void;
  onRemovePrestation: (id: string) => void;
  onPrestationChange: (id: string, field: keyof LignePrestationEtendue, value: string | number) => void;
}

export default function OperationsIndependantesForm({
  typeOperationIndep,
  prestations,
  onAddPrestation,
  onRemovePrestation,
  onPrestationChange,
}: OperationsIndependantesFormProps) {
  const operationsIndepLabels = getOperationsIndepLabels();
  
  const handleDateChange = (id: string, field: 'dateDebut' | 'dateFin', value: string) => {
    const prestation = prestations.find(p => p.id === id);
    if (!prestation) return;
    
    // Mettre à jour la date
    onPrestationChange(id, field, value);
    
    // Calculer la nouvelle quantité
    const dateDebut = field === 'dateDebut' ? value : prestation.dateDebut || '';
    const dateFin = field === 'dateFin' ? value : prestation.dateFin || '';
    
    if (dateDebut && dateFin) {
      const days = calculateDaysBetween(dateDebut, dateFin);
      onPrestationChange(id, 'quantite', days);
    }
  };

  // Pour Location et Stockage : afficher les dates
  const showDates = typeOperationIndep === 'location' || typeOperationIndep === 'stockage';
  
  // Pour Transport : afficher départ/arrivée
  const showTransport = typeOperationIndep === 'transport';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {operationsIndepLabels[typeOperationIndep].icon}
            Détail {operationsIndepLabels[typeOperationIndep].label}
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={onAddPrestation} className="gap-1">
            <Plus className="h-4 w-4" />Ajouter ligne
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {prestations.map((prestation, index) => (
            <div key={prestation.id} className="p-4 border rounded-lg bg-muted/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Ligne {index + 1}</span>
                {prestations.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onRemovePrestation(prestation.id)} 
                    className="text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Champs spécifiques pour Transport */}
              {showTransport && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Lieu de départ
                    </Label>
                    <Input 
                      placeholder="Ex: Libreville" 
                      value={prestation.lieuDepart || ''} 
                      onChange={(e) => onPrestationChange(prestation.id, 'lieuDepart', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Lieu d'arrivée
                    </Label>
                    <Input 
                      placeholder="Ex: Franceville" 
                      value={prestation.lieuArrivee || ''} 
                      onChange={(e) => onPrestationChange(prestation.id, 'lieuArrivee', e.target.value)} 
                    />
                  </div>
                </div>
              )}

              {/* Champs spécifiques pour Location et Stockage */}
              {showDates && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {typeOperationIndep === 'stockage' ? 'Début de stockage' : 'Date de début'}
                    </Label>
                    <Input 
                      type="date" 
                      value={prestation.dateDebut || ''} 
                      onChange={(e) => handleDateChange(prestation.id, 'dateDebut', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {typeOperationIndep === 'stockage' ? 'Fin de stockage' : 'Date de fin'}
                    </Label>
                    <Input 
                      type="date" 
                      value={prestation.dateFin || ''} 
                      onChange={(e) => handleDateChange(prestation.id, 'dateFin', e.target.value)} 
                    />
                  </div>
                </div>
              )}

              {/* Champs communs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    placeholder="Description..." 
                    value={prestation.description} 
                    onChange={(e) => onPrestationChange(prestation.id, 'description', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>{showDates ? 'Nombre de jours' : 'Quantité'}</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={prestation.quantite} 
                    onChange={(e) => onPrestationChange(prestation.id, 'quantite', parseInt(e.target.value) || 0)}
                    disabled={showDates}
                    className={showDates ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix unitaire (FCFA)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={prestation.prixUnitaire || ''} 
                    onChange={(e) => onPrestationChange(prestation.id, 'prixUnitaire', parseInt(e.target.value) || 0)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Montant HT</Label>
                  <Input 
                    value={formatMontant(prestation.montantHT)} 
                    disabled 
                    className="bg-muted font-medium" 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
