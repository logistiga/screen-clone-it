import { useState, useEffect, useCallback, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, FileText, Truck, Receipt, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { clientsApi, ordresApi, facturesApi, devisApi } from "@/lib/api/commercial";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "client" | "facture" | "ordre" | "devis";
  path: string;
  status?: string;
}

export const GlobalSearch = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  function GlobalSearch(_props, ref) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const debouncedQuery = useDebounce(query, 300);

  // Raccourci clavier Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Recherche API
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const [clientsRes, ordresRes, facturesRes, devisRes] = await Promise.all([
        clientsApi.getAll({ search: searchQuery, per_page: 5 }).catch(() => ({ data: [] })),
        ordresApi.getAll({ search: searchQuery, per_page: 5 }).catch(() => ({ data: [] })),
        facturesApi.getAll({ search: searchQuery, per_page: 5 }).catch(() => ({ data: [] })),
        devisApi.getAll({ search: searchQuery, per_page: 5 }).catch(() => ({ data: [] })),
      ]);

      const searchResults: SearchResult[] = [];

      // Clients
      if (clientsRes.data) {
        clientsRes.data.forEach((client: any) => {
          searchResults.push({
            id: client.id.toString(),
            title: client.nom,
            subtitle: client.email || client.telephone,
            type: "client",
            path: `/clients/${client.id}`,
          });
        });
      }

      // Ordres de travail
      if (ordresRes.data) {
        ordresRes.data.forEach((ordre: any) => {
          searchResults.push({
            id: ordre.id.toString(),
            title: ordre.numero || `OT-${ordre.id}`,
            subtitle: ordre.client?.nom || "Client inconnu",
            type: "ordre",
            path: `/ordres/${ordre.id}`,
            status: ordre.statut,
          });
        });
      }

      // Factures
      if (facturesRes.data) {
        facturesRes.data.forEach((facture: any) => {
          searchResults.push({
            id: facture.id.toString(),
            title: facture.numero || `FAC-${facture.id}`,
            subtitle: facture.client?.nom || "Client inconnu",
            type: "facture",
            path: `/factures/${facture.id}`,
            status: facture.statut,
          });
        });
      }

      // Devis
      if (devisRes.data) {
        devisRes.data.forEach((devis: any) => {
          searchResults.push({
            id: devis.id.toString(),
            title: devis.numero || `DEV-${devis.id}`,
            subtitle: devis.client?.nom || "Client inconnu",
            type: "devis",
            path: `/devis/${devis.id}`,
            status: devis.statut,
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Erreur de recherche:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    navigate(result.path);
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "client":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "ordre":
        return <Truck className="h-4 w-4 text-orange-500" />;
      case "facture":
        return <Receipt className="h-4 w-4 text-green-500" />;
      case "devis":
        return <FileText className="h-4 w-4 text-purple-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusColors: Record<string, string> = {
      brouillon: "bg-muted text-muted-foreground",
      en_attente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      en_cours: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      termine: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      payee: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      impayee: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      annule: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return (
      <Badge variant="outline" className={`text-xs ${statusColors[status] || ""}`}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const groupedResults = {
    clients: results.filter((r) => r.type === "client"),
    ordres: results.filter((r) => r.type === "ordre"),
    factures: results.filter((r) => r.type === "facture"),
    devis: results.filter((r) => r.type === "devis"),
  };

  return (
    <div ref={ref}>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Rechercher...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Rechercher clients, factures, ordres de travail..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {!isLoading && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          )}

          {!isLoading && query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Tapez au moins 2 caractères pour rechercher...
            </div>
          )}

          {!isLoading && groupedResults.clients.length > 0 && (
            <CommandGroup heading="Clients">
              {groupedResults.clients.map((result) => (
                <CommandItem
                  key={`client-${result.id}`}
                  value={`client-${result.id}-${result.title}`}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  {getIcon(result.type)}
                  <div className="ml-2 flex-1">
                    <p className="font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!isLoading && groupedResults.ordres.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Ordres de travail">
                {groupedResults.ordres.map((result) => (
                  <CommandItem
                    key={`ordre-${result.id}`}
                    value={`ordre-${result.id}-${result.title}`}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    {getIcon(result.type)}
                    <div className="ml-2 flex-1">
                      <p className="font-medium">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                      )}
                    </div>
                    {getStatusBadge(result.status)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {!isLoading && groupedResults.factures.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Factures">
                {groupedResults.factures.map((result) => (
                  <CommandItem
                    key={`facture-${result.id}`}
                    value={`facture-${result.id}-${result.title}`}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    {getIcon(result.type)}
                    <div className="ml-2 flex-1">
                      <p className="font-medium">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                      )}
                    </div>
                    {getStatusBadge(result.status)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {!isLoading && groupedResults.devis.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Devis">
                {groupedResults.devis.map((result) => (
                  <CommandItem
                    key={`devis-${result.id}`}
                    value={`devis-${result.id}-${result.title}`}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    {getIcon(result.type)}
                    <div className="ml-2 flex-1">
                      <p className="font-medium">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                      )}
                    </div>
                    {getStatusBadge(result.status)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
});

GlobalSearch.displayName = "GlobalSearch";
