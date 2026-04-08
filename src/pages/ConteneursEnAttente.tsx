import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, RefreshCw, Download, AlertTriangle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DocumentFilters, DocumentEmptyState, DocumentLoadingState, DocumentErrorState } from "@/components/shared/documents";
import { AnomaliesSection } from "@/components/conteneurs/AnomaliesSection";
import { OpsConnectionStatus } from "@/components/conteneurs/OpsConnectionStatus";
import { useConteneursEnAttenteData, statutOptions } from "./conteneurs-en-attente/useConteneursEnAttenteData";
import { ConteneursStatsCards } from "./conteneurs-en-attente/ConteneursStatsCards";
import { ConteneursTable } from "./conteneurs-en-attente/ConteneursTable";
import { ConteneursAffecterDialog } from "./conteneurs-en-attente/ConteneursModals";

export default function ConteneursEnAttentePage() {
  const d = useConteneursEnAttenteData();

  if (d.isLoading) {
    return <MainLayout title="Conteneurs en Attente"><DocumentLoadingState message="Chargement des conteneurs..." /></MainLayout>;
  }

  if (d.error) {
    return <MainLayout title="Conteneurs en Attente"><DocumentErrorState message="Erreur lors du chargement des conteneurs" onRetry={() => d.refetch()} /></MainLayout>;
  }

  if (d.conteneurs.length === 0 && !d.searchQuery && d.statutFilter === "en_attente") {
    return (
      <MainLayout title="Conteneurs en Attente">
        <div className="space-y-6 animate-fade-in">
          <ConteneursStatsCards stats={d.stats} />
          <div className="flex flex-wrap gap-2 justify-end">
            <Button onClick={() => d.syncAndDetectMutation.mutate()} disabled={d.syncAndDetectMutation.isPending} className="gap-2">
              <Download className={`h-4 w-4 ${d.syncAndDetectMutation.isPending ? 'animate-spin' : ''}`} />Synchroniser depuis OPS
            </Button>
            <Button onClick={() => d.refetch()} disabled={d.isRefetching} variant="outline" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${d.isRefetching ? 'animate-spin' : ''}`} />Actualiser
            </Button>
          </div>
          <OpsConnectionStatus syncError={d.syncAndDetectMutation.error as Error | null} onRetrySync={() => d.syncAndDetectMutation.mutate()} />
          <DocumentEmptyState icon={Package} title="Aucun conteneur en attente" description="Les conteneurs traités par Logistiga OPS apparaîtront ici. Cliquez sur 'Synchroniser depuis OPS' pour récupérer les dernières données." actionLabel="Synchroniser" onAction={() => d.syncAndDetectMutation.mutate()} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Conteneurs en Attente">
      <div className="space-y-6 animate-fade-in">
        <ConteneursStatsCards stats={d.stats} />

        <DocumentFilters searchTerm={d.searchQuery} onSearchChange={d.setSearchQuery} searchPlaceholder="Rechercher par conteneur, BL, client..." statutFilter={d.statutFilter} onStatutChange={d.setStatutFilter} statutOptions={statutOptions} />

        <div className="flex flex-wrap gap-2 justify-end">
          <Button onClick={() => d.syncAndDetectMutation.mutate()} disabled={d.syncAndDetectMutation.isPending} className="gap-2 transition-all duration-200 hover:scale-105">
            <Download className={`h-4 w-4 ${d.syncAndDetectMutation.isPending ? 'animate-spin' : ''}`} />Synchroniser depuis OPS
          </Button>
          <Button onClick={() => d.refetch()} disabled={d.isRefetching} variant="outline" className="gap-2 transition-all duration-200 hover:scale-105">
            <RefreshCw className={`h-4 w-4 ${d.isRefetching ? 'animate-spin' : ''}`} />Actualiser
          </Button>
        </div>

        <OpsConnectionStatus syncError={d.syncAndDetectMutation.error as Error | null} onRetrySync={() => d.syncAndDetectMutation.mutate()} />

        <Tabs defaultValue="conteneurs" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="conteneurs" className="gap-2"><Package className="h-4 w-4" />Liste des conteneurs<Badge variant="secondary" className="ml-1 text-xs">{d.conteneurs.length}</Badge></TabsTrigger>
            <TabsTrigger value="anomalies" className="gap-2"><AlertTriangle className="h-4 w-4" />Anomalies détectées</TabsTrigger>
          </TabsList>
          <TabsContent value="conteneurs" className="mt-4">
            <ConteneursTable conteneurs={d.conteneurs} navigate={d.navigate} handleCreerOrdre={d.handleCreerOrdre} handleAffecterClick={d.handleAffecterClick} ignorerMutate={(id) => d.ignorerMutation.mutate(id)} />
          </TabsContent>
          <TabsContent value="anomalies" className="mt-4"><AnomaliesSection /></TabsContent>
        </Tabs>

        <ConteneursAffecterDialog isOpen={d.isAffecterDialogOpen} setIsOpen={d.setIsAffecterDialogOpen} selectedConteneur={d.selectedConteneur} selectedOrdreId={d.selectedOrdreId} setSelectedOrdreId={d.setSelectedOrdreId} ordres={d.ordres} handleConfirm={d.handleAffecterConfirm} isPending={d.affecterOrdreMutation.isPending} />
      </div>
    </MainLayout>
  );
}
