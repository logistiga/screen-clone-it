import { Search, Filter, X, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DevisFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statutFilter: string;
  onStatutChange: (value: string) => void;
  categorieFilter: string;
  onCategorieChange: (value: string) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

export function DevisFilters({
  searchTerm,
  onSearchChange,
  statutFilter,
  onStatutChange,
  categorieFilter,
  onCategorieChange,
  viewMode,
  onViewModeChange,
}: DevisFiltersProps) {
  const activeFilters = [
    statutFilter !== 'all' && statutFilter,
    categorieFilter !== 'all' && categorieFilter,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onStatutChange('all');
    onCategorieChange('all');
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par numéro, client..." 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="pl-9 pr-9"
          />
          {searchTerm && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Statut filter */}
        <Select value={statutFilter} onValueChange={onStatutChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="brouillon">Brouillon</SelectItem>
            <SelectItem value="envoye">Envoyé</SelectItem>
            <SelectItem value="accepte">Accepté</SelectItem>
            <SelectItem value="refuse">Refusé</SelectItem>
            <SelectItem value="expire">Expiré</SelectItem>
            <SelectItem value="converti">Converti</SelectItem>
          </SelectContent>
        </Select>

        {/* Categorie filter */}
        <Select value={categorieFilter} onValueChange={onCategorieChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            <SelectItem value="Conteneur">Conteneurs</SelectItem>
            <SelectItem value="Lot">Conventionnel</SelectItem>
            <SelectItem value="Independant">Indépendant</SelectItem>
          </SelectContent>
        </Select>

        {/* Active filters indicator */}
        {activeFilters > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            {activeFilters} filtre{activeFilters > 1 ? 's' : ''}
          </Button>
        )}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-lg p-1 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              viewMode === 'list' && "bg-background shadow-sm"
            )}
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              viewMode === 'grid' && "bg-background shadow-sm"
            )}
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
