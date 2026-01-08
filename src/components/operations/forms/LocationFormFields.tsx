import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LignePrestationEtendue, calculateDaysBetween } from "@/types/documents";

interface LocationFormFieldsProps {
  prestation: LignePrestationEtendue;
  onPrestationChange: (id: string, field: keyof LignePrestationEtendue, value: string | number) => void;
}

export default function LocationFormFields({
  prestation,
  onPrestationChange,
}: LocationFormFieldsProps) {
  const handleDateChange = (field: 'dateDebut' | 'dateFin', value: string) => {
    onPrestationChange(prestation.id, field, value);
    
    const dateDebut = field === 'dateDebut' ? value : prestation.dateDebut || '';
    const dateFin = field === 'dateFin' ? value : prestation.dateFin || '';
    
    if (dateDebut && dateFin) {
      const days = calculateDaysBetween(dateDebut, dateFin);
      onPrestationChange(prestation.id, 'quantite', days);
      onPrestationChange(prestation.id, 'montantHT', days * prestation.prixUnitaire);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Date de début
        </Label>
        <Input 
          type="date" 
          value={prestation.dateDebut || ''} 
          onChange={(e) => handleDateChange('dateDebut', e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Date de fin
        </Label>
        <Input 
          type="date" 
          value={prestation.dateFin || ''} 
          onChange={(e) => handleDateChange('dateFin', e.target.value)} 
        />
      </div>
    </div>
  );
}
