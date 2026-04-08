import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, ArrowUpCircle, ArrowDownCircle, Building2, CalendarIcon, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BanqueFiltersProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  banqueFilter: string;
  onBanqueChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  dateDebut: Date | undefined;
  onDateDebutChange: (d: Date | undefined) => void;
  dateFin: Date | undefined;
  onDateFinChange: (d: Date | undefined) => void;
  banques: any[];
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function BanqueFilters({
  searchTerm, onSearchChange, banqueFilter, onBanqueChange,
  typeFilter, onTypeChange, dateDebut, onDateDebutChange,
  dateFin, onDateFinChange, banques, hasFilters, onClearFilters,
}: BanqueFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher par client, référence, description..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
            </div>
            <Select value={banqueFilter} onValueChange={onBanqueChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Toutes les banques" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les banques</SelectItem>
                {banques.map((banque: any) => (<SelectItem key={banque.id} value={banque.id}>{banque.nom}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={onTypeChange}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Tous les types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mouvements</SelectItem>
                <SelectItem value="entree"><span className="flex items-center gap-2"><ArrowDownCircle className="h-4 w-4 text-green-600" />Encaissements</span></SelectItem>
                <SelectItem value="sortie"><span className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4 text-red-600" />Décaissements</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[160px] justify-start text-left font-normal", !dateDebut && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />{dateDebut ? format(dateDebut, "dd/MM/yyyy", { locale: fr }) : "Date début"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateDebut} onSelect={onDateDebutChange} initialFocus locale={fr} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[160px] justify-start text-left font-normal", !dateFin && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />{dateFin ? format(dateFin, "dd/MM/yyyy", { locale: fr }) : "Date fin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFin} onSelect={onDateFinChange} initialFocus locale={fr} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {hasFilters && (
              <Button variant="ghost" onClick={onClearFilters} className="gap-2"><RotateCcw className="h-4 w-4" />Réinitialiser</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
