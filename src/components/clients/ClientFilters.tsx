import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, X, LayoutGrid, LayoutList, Download, FileSpreadsheet, FileText } from "lucide-react";

interface ClientFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  villeFilter: string;
  onVilleFilterChange: (value: string) => void;
  villes: string[];
  onExport?: (format: "excel" | "csv" | "pdf") => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function ClientFilters({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  villeFilter,
  onVilleFilterChange,
  villes,
  onExport,
  onClearFilters,
  hasActiveFilters,
}: ClientFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Recherche */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Filtre par statut */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="with_balance">Avec solde</SelectItem>
            <SelectItem value="no_balance">Sans solde</SelectItem>
            <SelectItem value="with_avoirs">Avec avoirs</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtre par ville */}
        <Select value={villeFilter} onValueChange={onVilleFilterChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ville" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes villes</SelectItem>
            {villes.map((ville) => (
              <SelectItem key={ville} value={ville}>
                {ville}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Effacer filtres */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        )}

        {/* Toggle Vue */}
        <div className="flex items-center border rounded-lg p-1 bg-muted/50">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("table")}
            className="px-2"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("cards")}
            className="px-2"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        {/* Export */}
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport("excel")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("csv")}>
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("pdf")}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
