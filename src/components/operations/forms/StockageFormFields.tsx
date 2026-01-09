import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LignePrestationEtendue } from "@/types/documents";

interface StockageFormFieldsProps {
  prestation: LignePrestationEtendue;
  onPrestationChange: (id: string, field: keyof LignePrestationEtendue, value: string | number) => void;
}

export default function StockageFormFields({
  prestation,
  onPrestationChange,
}: StockageFormFieldsProps) {
  const handleDateChange = (field: 'dateDebut' | 'dateFin', value: string) => {
    // Une seule mise à jour : le parent calcule quantité/montant.
    onPrestationChange(prestation.id, field, value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Début de stockage
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
          Fin de stockage
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
