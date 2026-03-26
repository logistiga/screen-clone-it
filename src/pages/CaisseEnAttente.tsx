import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2, Wallet, Clock, Banknote, Truck, FileText, MapPin, Wrench, Users, Building2,
} from "lucide-react";
import { formatMontant } from "@/data/mockData";
import api from "@/lib/api";
import { DocumentStatCard } from "@/components/shared/documents";
import { PrimesTable } from "@/components/caisse/caisse-attente/PrimesTable";
import { GarageTable } from "@/components/caisse/caisse-attente/GarageTable";
import { DecaissementModal } from "@/components/caisse/caisse-attente/DecaissementModal";
import { RefusModal } from "@/components/caisse/caisse-attente/RefusModal";
import { PrimeEnAttente, StatsResponse } from "@/components/caisse/caisse-attente/types";

export default function CaisseEnAttentePage() {
  const [activeTab, setActiveTab] = useState<string>("OPS");

  const [decaissementModalOpen, setDecaissementModalOpen] = useState(false);
  const [refusModalOpen, setRefusModalOpen] = useState(false);
  const [selectedPrime, setSelectedPrime] = useState<PrimeEnAttente | null>(null);

  const { data: opsStatsData } = useQuery({
    queryKey: ['caisse-en-attente-stats'],
    queryFn: async () => {
      const response = await api.get<StatsResponse>('/caisse-en-attente/stats');
      return response.data;
    },
  });

  const { data: cnvStatsData } = useQuery({
    queryKey: ['caisse-cnv-stats'],
    queryFn: async () => {
      const response = await api.get<StatsResponse>('/caisse-cnv/stats');
      return response.data;
    },
  });

  const { data: horslbvStatsData } = useQuery({
    queryKey: ['caisse-horslbv-stats'],
    queryFn: async () => {
      const response = await api.get<StatsResponse>('/caisse-horslbv/stats');
      return response.data;
    },
  });

  const { data: garageStatsData } = useQuery({
    queryKey: ['caisse-garage-stats'],
    queryFn: async () => {
      const response = await api.get<StatsResponse>('/caisse-garage/stats');
      return response.data;
    },
  });

  const { data: repStatsData } = useQuery({
    queryKey: ['caisse-primes-rep-stats'],
    queryFn: async () => {
      const response = await api.get<StatsResponse>('/caisse-primes-rep/stats');
      return response.data;
    },
  });

  const { data: transStatsData } = useQuery({
    queryKey: ['caisse-primes-trans-stats'],
    queryFn: async () => {
      const response = await api.get<StatsResponse>('/caisse-primes-trans/stats');
      return response.data;
    },
  });

  const { data: garagePrimesStatsData } = useQuery({
    queryKey: ['caisse-garage-primes-stats'],
    queryFn: async () => {
      const response = await api.get<StatsResponse>('/caisse-garage/primes/stats');
      return response.data;
    },
  });

  const emptyStats: StatsResponse = { total_valide: 0, nombre_primes: 0, total_a_decaisser: 0, nombre_a_decaisser: 0, deja_decaissees: 0, total_decaisse: 0 };
  const opsStats = opsStatsData || emptyStats;
  const cnvStats = cnvStatsData || emptyStats;
  const horslbvStats = horslbvStatsData || emptyStats;
  const garageStats = garageStatsData || emptyStats;
  const repStats = repStatsData || emptyStats;
  const transStats = transStatsData || emptyStats;
  const garagePrimesStats = garagePrimesStatsData || emptyStats;

  const allStats = [opsStats, cnvStats, horslbvStats, garageStats, repStats, transStats, garagePrimesStats];
  const stats = {
    total_valide: allStats.reduce((s, st) => s + st.total_valide, 0),
    nombre_primes: allStats.reduce((s, st) => s + st.nombre_primes, 0),
    total_a_decaisser: allStats.reduce((s, st) => s + st.total_a_decaisser, 0),
    nombre_a_decaisser: allStats.reduce((s, st) => s + st.nombre_a_decaisser, 0),
    deja_decaissees: allStats.reduce((s, st) => s + st.deja_decaissees, 0),
    total_decaisse: allStats.reduce((s, st) => s + st.total_decaisse, 0),
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Caisse en attente</h1>
            <p className="text-muted-foreground mt-1">Primes et dépenses en attente de décaissement</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <DocumentStatCard
            title="Total payé"
            value={formatMontant(stats.total_valide)}
            icon={Banknote}
            subtitle={`${stats.nombre_primes} éléments`}
            variant="primary"
            delay={0}
          />
          <DocumentStatCard
            title="À décaisser"
            value={formatMontant(stats.total_a_decaisser)}
            icon={Clock}
            subtitle={`${stats.nombre_a_decaisser} éléments`}
            variant="warning"
            delay={0.1}
          />
          <DocumentStatCard
            title="Déjà décaissées"
            value={formatMontant(stats.total_decaisse)}
            icon={CheckCircle2}
            subtitle={`${stats.deja_decaissees} éléments`}
            variant="success"
            delay={0.2}
          />
          <DocumentStatCard
            title="Total éléments"
            value={stats.nombre_primes}
            icon={Wallet}
            subtitle="Toutes sources"
            delay={0.3}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 max-w-4xl">
            <TabsTrigger value="OPS" className="gap-1 text-xs">
              <Truck className="h-4 w-4" />
              Conteneurs
            </TabsTrigger>
            <TabsTrigger value="CNV" className="gap-1 text-xs">
              <FileText className="h-4 w-4" />
              Conventionnel
            </TabsTrigger>
            <TabsTrigger value="HORSLBV" className="gap-1 text-xs">
              <MapPin className="h-4 w-4" />
              Hors LBV
            </TabsTrigger>
            <TabsTrigger value="GARAGE" className="gap-1 text-xs">
              <Wrench className="h-4 w-4" />
              Garage
            </TabsTrigger>
            <TabsTrigger value="PRIME_REP" className="gap-1 text-xs">
              <Users className="h-4 w-4" />
              P. Représentant
            </TabsTrigger>
            <TabsTrigger value="PRIME_TRANS" className="gap-1 text-xs">
              <Building2 className="h-4 w-4" />
              P. Transitaire
            </TabsTrigger>
          </TabsList>

          <TabsContent value="OPS" className="mt-4">
            <PrimesTable source="OPS" onDecaisser={openDecaissementModal} onRefuser={openRefusModal} />
          </TabsContent>

          <TabsContent value="CNV" className="mt-4">
            <PrimesTable source="CNV" onDecaisser={openDecaissementModal} onRefuser={openRefusModal} />
          </TabsContent>

          <TabsContent value="HORSLBV" className="mt-4">
            <PrimesTable source="HORSLBV" onDecaisser={openDecaissementModal} onRefuser={openRefusModal} />
          </TabsContent>

          <TabsContent value="GARAGE" className="mt-4">
            <GarageTable onDecaisser={openDecaissementModal} onRefuser={openRefusModal} />
          </TabsContent>

          <TabsContent value="PRIME_REP" className="mt-4">
            <PrimesTable source="PRIME_REP" onDecaisser={openDecaissementModal} onRefuser={openRefusModal} />
          </TabsContent>

          <TabsContent value="PRIME_TRANS" className="mt-4">
            <PrimesTable source="PRIME_TRANS" onDecaisser={openDecaissementModal} onRefuser={openRefusModal} />
          </TabsContent>
        </Tabs>
      </div>

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
