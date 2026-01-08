import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LignePrestationEtendue } from "@/types/documents";

interface TransportFormFieldsProps {
  prestation: LignePrestationEtendue;
  onPrestationChange: (id: string, field: keyof LignePrestationEtendue, value: string | number) => void;
}

export default function TransportFormFields({
  prestation,
  onPrestationChange,
}: TransportFormFieldsProps) {
  return (
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
  );
}
