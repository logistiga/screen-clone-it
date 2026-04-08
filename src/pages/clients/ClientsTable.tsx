import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AnimatedTableRow, AnimatedTableBody } from "@/components/ui/animated-table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Edit, Trash2, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { InfiniteScrollLoader } from "@/components/InfiniteScrollLoader";
import { ClientAvatar, ClientHealthBadge } from "@/components/clients";
import { Client } from "@/lib/api/commercial";
import { usePrefetch } from "@/hooks/use-prefetch";
import type { SortField } from "./useClientsData";

interface Props {
  filteredClients: Client[];
  isSearching: boolean;
  tableRenderKey: string;
  sortField: SortField;
  sortOrder: "asc" | "desc";
  onSort: (field: SortField) => void;
  onDelete: (client: { id: number; nom: string }) => void;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  loadedCount: number;
  totalCount: number;
  onLoadMore: () => void;
}

export function ClientsTable({
  filteredClients, isSearching, tableRenderKey, sortField, sortOrder,
  onSort, onDelete, loadMoreRef, isFetchingNextPage, hasNextPage,
  loadedCount, totalCount, onLoadMore,
}: Props) {
  const navigate = useNavigate();
  const { prefetchClient } = usePrefetch();

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <Card className="shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">
                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => onSort("nom")}>
                  Client{getSortIcon("nom")}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button className="flex items-center justify-end w-full hover:text-foreground transition-colors" onClick={() => onSort("solde")}>
                  Solde dû{getSortIcon("solde")}
                </button>
              </TableHead>
              <TableHead className="text-right">Avoirs</TableHead>
              <TableHead className="text-right">Statut</TableHead>
              <TableHead className="w-[120px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <AnimatedTableBody key={tableRenderKey}>
            {isSearching ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredClients.map((client: Client, index: number) => {
              const solde = Number(client.solde) || 0;
              const avoirs = Number(client.solde_avoirs) || 0;

              return (
                <AnimatedTableRow
                  key={client.id} index={index}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/clients/${client.id}`)}
                  onMouseEnter={() => prefetchClient(client.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ClientAvatar name={client.nom} size="sm" />
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{client.nom}</p>
                        {client.type && <p className="text-xs text-muted-foreground">{client.type}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={solde > 0 ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                      {formatMontant(solde)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={avoirs > 0 ? "font-semibold text-blue-600 dark:text-blue-400" : "text-muted-foreground"}>
                      {formatMontant(avoirs)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <ClientHealthBadge solde={solde} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/clients/${client.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Voir</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/clients/${client.id}/modifier`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Modifier</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete({ id: client.id, nom: client.nom })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Supprimer</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </AnimatedTableRow>
              );
            })}
          </AnimatedTableBody>
        </Table>
      </div>
      <InfiniteScrollLoader
        ref={loadMoreRef}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        loadedCount={loadedCount}
        totalCount={totalCount}
        onLoadMore={onLoadMore}
      />
    </Card>
  );
}
