import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2, Wallet, Clock, Banknote, RefreshCw, Truck, FileText,
} from "lucide-react";
import { formatMontant } from "@/data/mockData";
import api from "@/lib/api";
import { DocumentStatCard } from "@/components/shared/documents";
import { PrimesTable } from "@/components/caisse/caisse-attente/PrimesTable";
import { DecaissementModal } from "@/components/caisse/caisse-attente/DecaissementModal";
import { RefusModal } from "@/components/caisse/caisse-attente/RefusModal";
import { PrimeEnAttente, StatsResponse } from "@/components/caisse/caisse-attente/types";
import { toast } from "sonner";

export default function CaisseEnAttentePage() {
  const [activeTab, setActiveTab] = useState<string>("OPS");

  // Modal state
  const [decaissementModalOpen, setDecaissementModalOpen] = useState(false);
  const [refusModalOpen, setRefusModalOpen] = useState(false);
  const [selectedPrime, setSelectedPrime] = useState<PrimeEnAttente | null>(null);

  // Fetch stats OPS
  const { data: opsStatsData } = useQuery({
    queryKey: ['caisse-en-attente-stats'],
    queryFn: async () => {
      const response = await api.get<StatsResponse>('/caisse-en-attente/stats');
      return response.data;
    },
  });

  // Fetch stats CNV
  const { data: cnvStatsData } = useQuery({
    queryKey: ['caisse-cnv-stats'],
    queryFn: async () => {
      const response = await api.get<StatsResponse>('/caisse-cnv/stats');
      return response.data;
    },
  });

  const emptyStats: StatsResponse = { total_valide: 0, nombre_primes: 0, total_a_decaisser: 0, nombre_a_decaisser: 0, deja_decaissees: 0, total_decaisse: 0 };
  const opsStats = opsStatsData || emptyStats;
  const cnvStats = cnvStatsData || emptyStats;

  const stats = {
    total_valide: opsStats.total_valide + cnvStats.total_valide,
    nombre_primes: opsStats.nombre_primes + cnvStats.nombre_primes,
    total_a_decaisser: opsStats.total_a_decaisser + cnvStats.total_a_decaisser,
    nombre_a_decaisser: opsStats.nombre_a_decaisser + cnvStats.nombre_a_decaisser,
    deja_decaissees: opsStats.deja_decaissees + cnvStats.deja_decaissees,
    total_decaisse: opsStats.total_decaisse + cnvStats.total_decaisse,
  };

  const openDecaissementModal = (prime: PrimeEnAttente) => {
    setSelectedPrime(prime);
    setDecaissementModalOpen(true);
  };

  const openRefusModal = (prime: PrimeEnAttente) => {
    setSelectedPrime(prime);
    setRefusModalOpen(true);
  };

  return (
    <MainLayout title="Caisse en attente">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Caisse en attente</h1>
            <p className="text-muted-foreground mt-1">Primes payées en attente de décaissement</p>
          </div>
        </div>

        {/* Stats globales */}
        <div className="grid gap-4 md:grid-cols-4">
          <DocumentStatCard
            title="Total payé"
            value={formatMontant(stats.total_valide)}
            icon={Banknote}
            subtitle={`${stats.nombre_primes} primes`}
            variant="primary"
            delay={0}
          />
          <DocumentStatCard
            title="À décaisser"
            value={formatMontant(stats.total_a_decaisser)}
            icon={Clock}
            subtitle={`${stats.nombre_a_decaisser} primes`}
            variant="warning"
            delay={0.1}
          />
          <DocumentStatCard
            title="Déjà décaissées"
            value={formatMontant(stats.total_decaisse)}
            icon={CheckCircle2}
            subtitle={`${stats.deja_decaissees} primes`}
            variant="success"
            delay={0.2}
          />
          <DocumentStatCard
            title="Total primes"
            value={stats.nombre_primes}
            icon={Wallet}
            subtitle="OPS + CNV"
            delay={0.3}
          />
        </div>

        {/* Onglets OPS / CNV */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="OPS" className="gap-2">
              <Truck className="h-4 w-4" />
              Conteneurs (OPS)
            </TabsTrigger>
            <TabsTrigger value="CNV" className="gap-2">
              <FileText className="h-4 w-4" />
              Conventionnel (CNV)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="OPS" className="mt-4">
            <PrimesTable
              source="OPS"
              onDecaisser={openDecaissementModal}
              onRefuser={openRefusModal}
            />
          </TabsContent>

          <TabsContent value="CNV" className="mt-4">
            <PrimesTable
              source="CNV"
              onDecaisser={openDecaissementModal}
              onRefuser={openRefusModal}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <DecaissementModal
        open={decaissementModalOpen}
        onOpenChange={setDecaissementModalOpen}
        prime={selectedPrime}
      />
      <RefusModal
        open={refusModalOpen}
        onOpenChange={setRefusModalOpen}
        prime={selectedPrime}
      />
    </MainLayout>
  );
}
