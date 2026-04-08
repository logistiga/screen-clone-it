import { useState, useMemo, useEffect, useRef } from "react";
import { useDeleteClient } from "@/hooks/use-commercial";
import { useInfiniteClients, useInfiniteScroll } from "@/hooks/use-infinite-queries";
import { useDebounce } from "@/hooks/use-debounce";
import { Client } from "@/lib/api/commercial";

export type SortField = "nom" | "solde" | "ville" | "created_at";
export type SortOrder = "asc" | "desc";

export function useClientsData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nom: string } | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [statusFilter, setStatusFilter] = useState("all");
  const [villeFilter, setVilleFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("nom");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const debouncedSearch = useDebounce(searchTerm, 600);

  const {
    flatData: allClients,
    totalItems: totalAllItems,
    isLoading: isLoadingAllClients,
  } = useInfiniteClients({ per_page: 20 });

  const {
    flatData: clients,
    totalItems,
    isLoading,
    isFetching,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteClients({
    search: debouncedSearch || undefined,
    per_page: 20,
  });

  const hasFinishedFirstLoadRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !isLoadingAllClients) {
      hasFinishedFirstLoadRef.current = true;
    }
  }, [isLoading, isLoadingAllClients]);

  const isInitialLoading = !hasFinishedFirstLoadRef.current && (isLoading || isLoadingAllClients);
  const isSearching = isFetching && !isFetchingNextPage && !!debouncedSearch;

  const tableRenderKey = useMemo(() =>
    [debouncedSearch, statusFilter, villeFilter, sortField, sortOrder, clients.map((c: Client) => c.id).join("-")].join("|"),
    [debouncedSearch, statusFilter, villeFilter, sortField, sortOrder, clients]
  );

  const loadMoreRef = useInfiniteScroll(fetchNextPage, hasNextPage, isFetchingNextPage);
  const deleteClientMutation = useDeleteClient();

  const villes = useMemo(() => {
    const villeSet = new Set<string>();
    allClients.forEach((client: Client) => {
      if (client.ville) villeSet.add(client.ville);
    });
    return Array.from(villeSet).sort();
  }, [allClients]);

  const filteredClients = useMemo(() => {
    let result = [...clients];
    if (statusFilter === "with_balance") result = result.filter((c: Client) => Number(c.solde) > 0);
    else if (statusFilter === "no_balance") result = result.filter((c: Client) => Number(c.solde) <= 0);
    else if (statusFilter === "with_avoirs") result = result.filter((c: Client) => Number(c.solde_avoirs) > 0);
    if (villeFilter !== "all") result = result.filter((c: Client) => c.ville === villeFilter);
    result.sort((a: Client, b: Client) => {
      let comparison = 0;
      switch (sortField) {
        case "nom": comparison = a.nom.localeCompare(b.nom); break;
        case "solde": comparison = Number(a.solde) - Number(b.solde); break;
        case "ville": comparison = (a.ville || "").localeCompare(b.ville || ""); break;
        case "created_at": comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return result;
  }, [clients, statusFilter, villeFilter, sortField, sortOrder]);

  const stats = useMemo(() => {
    const total = allClients.length;
    const totalSolde = allClients.reduce((sum: number, c: Client) => sum + Number(c.solde || 0), 0);
    const totalAvoirs = allClients.reduce((sum: number, c: Client) => sum + Number(c.solde_avoirs || 0), 0);
    const withSolde = allClients.filter((c: Client) => Number(c.solde) > 0).length;
    return { total, totalSolde, totalAvoirs, withSolde, serverTotal: totalAllItems };
  }, [allClients, totalAllItems]);

  const hasActiveFilters = statusFilter !== "all" || villeFilter !== "all" || searchTerm !== "";

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteClientMutation.mutateAsync(String(deleteConfirm.id));
      setDeleteConfirm(null);
    }
  };

  const clearFilters = () => { setSearchTerm(""); setStatusFilter("all"); setVilleFilter("all"); };

  return {
    searchTerm, setSearchTerm, deleteConfirm, setDeleteConfirm,
    viewMode, setViewMode, statusFilter, setStatusFilter,
    villeFilter, setVilleFilter, sortField, sortOrder, handleSort,
    clients, totalItems, filteredClients, stats, villes,
    isInitialLoading, isSearching, error,
    fetchNextPage, hasNextPage, isFetchingNextPage, loadMoreRef,
    deleteClientMutation, handleDelete, clearFilters, hasActiveFilters,
    tableRenderKey,
  };
}
