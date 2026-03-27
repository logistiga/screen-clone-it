import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { TablePagination } from "@/components/TablePagination";

import { useDetentionsAttente, useDetentionsAttenteStats } from "@/hooks/use-detentions-attente";
import { DetentionStatsCards } from "@/components/detentions/DetentionStatsCards";
import { DetentionFilters } from "@/components/detentions/DetentionFilters";
import { DetentionTable } from "@/components/detentions/DetentionTable";

export default function DetentionsEnAttente() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [responsabilite, setResponsabilite] = useState("all");
  const [paiement, setPaiement] = useState("all");

  const debouncedSearch = useDebounce(search, 400);

  const params = {
    page,
    per_page: 20,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(responsabilite !== "all" && { responsabilite }),
    ...(paiement !== "all" && { paiement_valide: paiement }),
  };

  const { data, isLoading } = useDetentionsAttente(params);
  const { data: stats, isLoading: statsLoading } = useDetentionsAttenteStats();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["detentions-attente"] });
    queryClient.invalidateQueries({ queryKey: ["detentions-attente-stats"] });
  };

  return (
    <MainLayout title="Détention en attente">
      <div className="space-y-6">
        {/* Stats */}
        <DetentionStatsCards stats={stats} isLoading={statsLoading} />

        {/* Table card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Container className="h-5 w-5" />
              Détentions attribuées
              {data?.meta?.total !== undefined && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({data.meta.total} résultats)
                </span>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetentionFilters
              search={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              responsabilite={responsabilite}
              onResponsabiliteChange={(v) => { setResponsabilite(v); setPage(1); }}
              paiement={paiement}
              onPaiementChange={(v) => { setPaiement(v); setPage(1); }}
            />

            <DetentionTable data={data?.data ?? []} isLoading={isLoading} />

            {data?.meta && data.meta.last_page > 1 && (
              <TablePagination
                currentPage={data.meta.current_page}
                totalPages={data.meta.last_page}
                pageSize={data.meta.per_page}
                totalItems={data.meta.total}
                onPageChange={setPage}
                onPageSizeChange={() => {}}
              />
            )}

            {data?.source_errors && Object.keys(data.source_errors).length > 0 && (
              <p className="text-sm text-destructive">
                ⚠ Source indisponible : {Object.values(data.source_errors).join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
