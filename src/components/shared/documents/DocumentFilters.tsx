import * as React from "react";
import { Search, X, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface DocumentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Statut filter (optional)
  statutFilter?: string;
  onStatutChange?: (value: string) => void;
  statutOptions?: FilterOption[];
  
  // Categorie filter (optional)
  categorieFilter?: string;
  onCategorieChange?: (value: string) => void;
  categorieOptions?: FilterOption[];
  
  // View mode (optional)
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  showViewToggle?: boolean;
}

export const DocumentFilters = React.forwardRef<
  HTMLDivElement,
  DocumentFiltersProps
>(({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Rechercher...",
  statutFilter,
  onStatutChange,
  statutOptions,
  categorieFilter,
  onCategorieChange,
  categorieOptions,
  viewMode = 'list',
  onViewModeChange,
  showViewToggle = false,
}, ref) => {
  const activeFilters = [
    statutFilter && statutFilter !== 'all' && statutFilter,
    categorieFilter && categorieFilter !== 'all' && categorieFilter,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onStatutChange?.('all');
    onCategorieChange?.('all');
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card/50 backdrop-blur-sm p-4 rounded-lg border">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-1">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder={searchPlaceholder}
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="pl-9 pr-9 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {searchTerm && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Statut filter */}
        {statutOptions && onStatutChange && (
          <Select value={statutFilter || 'all'} onValueChange={onStatutChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {statutOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Categorie filter */}
        {categorieOptions && onCategorieChange && (
          <Select value={categorieFilter || 'all'} onValueChange={onCategorieChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categorieOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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
      {showViewToggle && onViewModeChange && (
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1 bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 transition-all",
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
                "h-8 w-8 p-0 transition-all",
                viewMode === 'grid' && "bg-background shadow-sm"
              )}
              onClick={() => onViewModeChange('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
DocumentFilters.displayName = "DocumentFilters";
