import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  responsabilite: string;
  onResponsabiliteChange: (v: string) => void;
  paiement: string;
  onPaiementChange: (v: string) => void;
}

export function DetentionFilters({
  search, onSearchChange,
  responsabilite, onResponsabiliteChange,
  paiement, onPaiementChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher conteneur, BL, client..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={responsabilite} onValueChange={onResponsabiliteChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Responsabilité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes</SelectItem>
          <SelectItem value="Client">Client</SelectItem>
          <SelectItem value="Compagnie">Compagnie</SelectItem>
          <SelectItem value="Logistiga">Logistiga</SelectItem>
        </SelectContent>
      </Select>
      <Select value={paiement} onValueChange={onPaiementChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Paiement" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="true">Payé</SelectItem>
          <SelectItem value="false">Non payé</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
