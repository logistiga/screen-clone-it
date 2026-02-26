import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2, Wallet, Clock, Coins, Loader2,
  RefreshCw, Receipt, Banknote, Hash, AlertTriangle, Truck, FileText
} from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";
import api from "@/lib/api";
import { TablePagination } from "@/components/TablePagination";
import {
  DocumentStatCard, DocumentFilters, DocumentLoadingState,
} from "@/components/shared/documents";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const statutFilterOptions = [
  { value: "all", label: "Toutes les primes payées" },
  { value: "a_decaisser", label: "À décaisser" },
  { value: "decaisse", label: "Déjà décaissées" },
];

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Interface basée sur le vrai schéma OPS `primes` :
 * id, type, beneficiaire, responsable, montant, payee,
 * reference_paiement, numero_paiement, paiement_valide,
 * statut, camion_plaque, parc, responsable_nom, prestataire_nom, created_at
 */
interface PrimeEnAttente {
  id: string;
  type: string | null;
  beneficiaire: string | null;
  responsable: string | null;
  montant: number;
  payee: boolean;
  reference_paiement: string | null;
  numero_paiement: string | null;
  paiement_valide: boolean;
  statut: string | null;
  camion_plaque: string | null;
  parc: string | null;
  responsable_nom: string | null;
  prestataire_nom: string | null;
  created_at: string;
  // Champs ajoutés par le backend
  source: 'OPS' | 'CNV';
  decaisse: boolean;
  mouvement_id: number | null;
  date_decaissement: string | null;
  mode_paiement_decaissement: string | null;
  // CNV-specific
  conventionne_numero?: string | null;
  numero_parc?: string | null;
}

interface StatsResponse {
  total_valide: number;
  nombre_primes: number;
  total_a_decaisser: number;
  nombre_a_decaisser: number;
  deja_decaissees: number;
  total_decaisse: number;
}

export default function CaisseEnAttentePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("OPS");

  // OPS state
  const [opsSearch, setOpsSearch] = useState("");
  const [opsStatut, setOpsStatut] = useState("a_decaisser");
  const [opsPage, setOpsPage] = useState(1);
  const [opsPageSize, setOpsPageSize] = useState(20);

  // CNV state
  const [cnvSearch, setCnvSearch] = useState("");
  const [cnvStatut, setCnvStatut] = useState("a_decaisser");
  const [cnvPage, setCnvPage] = useState(1);
  const [cnvPageSize, setCnvPageSize] = useState(20);

  // Modal state
  const [decaissementModalOpen, setDecaissementModalOpen] = useState(false);
  const [selectedPrime, setSelectedPrime] = useState<PrimeEnAttente | null>(null);
  const [modePaiement, setModePaiement] = useState("Espèces");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch OPS primes
  const { data: opsData, isLoading: opsLoading, refetch: refetchOps, isRefetching: opsRefetching } = useQuery({
    queryKey: ['caisse-en-attente', 'OPS', opsPage, opsPageSize, opsSearch, opsStatut],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: opsPage, per_page: opsPageSize, statut: opsStatut, source: 'OPS',
      };
      if (opsSearch) params.search = opsSearch;
      const response = await api.get('/caisse-en-attente', { params });
      return response.data;
    },
  });

  // Fetch CNV primes (route dédiée)
  const { data: cnvData, isLoading: cnvLoading, refetch: refetchCnv, isRefetching: cnvRefetching } = useQuery({
    queryKey: ['caisse-cnv', cnvPage, cnvPageSize, cnvSearch, cnvStatut],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: cnvPage, per_page: cnvPageSize, statut: cnvStatut,
      };
      if (cnvSearch) params.search = cnvSearch;
      const response = await api.get('/caisse-cnv', { params });
      return response.data;
    },
  });

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

  // Mutation décaissement (route selon source)
  const decaissementMutation = useMutation({
    mutationFn: async ({ primeId, source }: { primeId: string; source: string }) => {
      const endpoint = source === 'CNV'
        ? `/caisse-cnv/${primeId}/decaisser`
        : `/caisse-en-attente/${primeId}/decaisser`;
      const response = await api.post(endpoint, {
        mode_paiement: modePaiement, reference, notes,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Décaissement validé avec succès");
      queryClient.invalidateQueries({ queryKey: ['caisse-en-attente'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-cnv'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-en-attente-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-cnv-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-mouvements'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-solde'] });
      setDecaissementModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors du décaissement");
    },
  });

  const handleSync = async () => {
    toast.info("Synchronisation en cours...");
    if (activeTab === "OPS") await refetchOps();
    else await refetchCnv();
    queryClient.invalidateQueries({ queryKey: ['caisse-en-attente-stats'] });
    toast.success("Synchronisation terminée");
  };

  const resetForm = () => {
    setSelectedPrime(null);
    setModePaiement("Espèces");
    setReference("");
    setNotes("");
  };

  const openDecaissementModal = (prime: PrimeEnAttente) => {
    setSelectedPrime(prime);
    setDecaissementModalOpen(true);
  };

  const handleDecaissement = () => {
    if (!selectedPrime) return;
    decaissementMutation.mutate({ primeId: selectedPrime.id, source: selectedPrime.source });
  };

  const emptyStats = { total_valide: 0, nombre_primes: 0, total_a_decaisser: 0, nombre_a_decaisser: 0, deja_decaissees: 0, total_decaisse: 0 };
  const opsStats = opsStatsData || emptyStats;
  const cnvStats = cnvStatsData || emptyStats;
  // Stats combinées pour l'affichage global
  const stats = {
    total_valide: opsStats.total_valide + cnvStats.total_valide,
    nombre_primes: opsStats.nombre_primes + cnvStats.nombre_primes,
    total_a_decaisser: opsStats.total_a_decaisser + cnvStats.total_a_decaisser,
    nombre_a_decaisser: opsStats.nombre_a_decaisser + cnvStats.nombre_a_decaisser,
    deja_decaissees: opsStats.deja_decaissees + cnvStats.deja_decaissees,
    total_decaisse: opsStats.total_decaisse + cnvStats.total_decaisse,
  };

  const isRefetching = activeTab === "OPS" ? opsRefetching : cnvRefetching;
  const currentData = activeTab === "OPS" ? opsData : cnvData;
  const totalItems = currentData?.meta?.total || 0;

  const renderPrimesTable = (source: 'OPS' | 'CNV') => {
    const data = source === 'OPS' ? opsData : cnvData;
    const loading = source === 'OPS' ? opsLoading : cnvLoading;
    const items: PrimeEnAttente[] = data?.data || [];
    const total = data?.meta?.last_page || 1;
    const totalCount = data?.meta?.total || 0;
    const error = data?.error || data?.message;
    const search = source === 'OPS' ? opsSearch : cnvSearch;
    const statut = source === 'OPS' ? opsStatut : cnvStatut;
    const page = source === 'OPS' ? opsPage : cnvPage;
    const size = source === 'OPS' ? opsPageSize : cnvPageSize;

    const setSearch = source === 'OPS' ? setOpsSearch : setCnvSearch;
    const setStatut = source === 'OPS' ? setOpsStatut : setCnvStatut;
    const setPage = source === 'OPS' ? setOpsPage : setCnvPage;
    const setSize = source === 'OPS' ? setOpsPageSize : setCnvPageSize;

    const hasFilters = !!search || statut !== 'a_decaisser';

    if (loading) {
      return <DocumentLoadingState message={`Chargement des primes ${source}...`} />;
    }

    return (
      <div className="space-y-4">
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="font-medium text-destructive">Problème de connexion</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSync} className="ml-auto gap-1">
                <RefreshCw className="h-3 w-3" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filtres */}
        <DocumentFilters
          searchTerm={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          searchPlaceholder={source === 'OPS'
            ? "Rechercher (bénéficiaire, camion, parc, prestataire, type)..."
            : "Rechercher (bénéficiaire, N° paiement, conventionné, type)..."
          }
          statutFilter={statut}
          onStatutChange={(v) => { setStatut(v); setPage(1); }}
          statutOptions={statutFilterOptions}
        />

        {/* Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {source === 'OPS' ? (
                <Truck className="h-5 w-5 text-primary" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
              {source === 'OPS' ? 'Primes Conteneurs (OPS)' : 'Primes Conventionnel (CNV)'}
              <Badge variant="secondary" className="ml-2">{totalCount}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead>Type</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    {source === 'OPS' ? (
                      <>
                        <TableHead>Camion / Parc</TableHead>
                        <TableHead>Prestataire</TableHead>
                        <TableHead>Responsable</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>N° Conventionné</TableHead>
                        <TableHead>Responsable</TableHead>
                      </>
                    )}
                    <TableHead>N° Paiement</TableHead>
                    <TableHead>Réf. Paiement</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={source === 'OPS' ? 10 : 9} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Wallet className="h-8 w-8 opacity-50" />
                          <p>Aucune prime {source} trouvée</p>
                          {hasFilters && (
                            <Button variant="link" onClick={() => { setSearch(""); setStatut("a_decaisser"); setPage(1); }} className="text-primary">
                              Réinitialiser les filtres
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((prime, index) => (
                      <motion.tr
                        key={`${prime.source}-${prime.id}`}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {prime.type || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate font-medium">
                          {prime.beneficiaire || '-'}
                        </TableCell>
                        {source === 'OPS' ? (
                          <>
                            <TableCell className="text-sm">
                              {prime.camion_plaque && (
                                <span className="block font-medium">{prime.camion_plaque}</span>
                              )}
                              {prime.parc && (
                                <span className="text-muted-foreground">{prime.parc}</span>
                              )}
                              {!prime.camion_plaque && !prime.parc && '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[130px] truncate">
                              {prime.prestataire_nom || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {prime.responsable_nom || prime.responsable || '-'}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-sm font-mono">
                              {prime.conventionne_numero || prime.numero_parc || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {prime.responsable_nom || prime.responsable || '-'}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          {prime.numero_paiement ? (
                            <Badge variant="outline" className="gap-1 font-mono">
                              <Hash className="h-3 w-3" />
                              {prime.numero_paiement}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[100px] truncate">
                          {prime.reference_paiement || '-'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatMontant(prime.montant)}
                        </TableCell>
                        <TableCell>
                          {prime.decaisse ? (
                            <Badge className="bg-success/20 text-success gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" />
                              Décaissée
                            </Badge>
                          ) : (
                            <Badge className="bg-warning/20 text-warning gap-1">
                              <Clock className="h-3 w-3" />
                              À décaisser
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {prime.decaisse ? (
                            <span className="text-sm text-success flex items-center justify-end gap-1">
                              <Receipt className="h-4 w-4" />
                              #{prime.mouvement_id}
                            </span>
                          ) : (
                            <Button size="sm" className="gap-1" onClick={() => openDecaissementModal(prime)}>
                              <Coins className="h-4 w-4" />
                              Décaisser
                            </Button>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {total > 1 && (
          <TablePagination
            currentPage={page}
            totalPages={total}
            pageSize={size}
            totalItems={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setSize(s); setPage(1); }}
          />
        )}
      </div>
    );
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
          <Button
            variant="outline"
            onClick={handleSync}
            className="gap-2"
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Synchroniser
          </Button>
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
            title="Affichées"
            value={totalItems}
            icon={Wallet}
            subtitle="primes dans la liste"
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
            {renderPrimesTable('OPS')}
          </TabsContent>

          <TabsContent value="CNV" className="mt-4">
            {renderPrimesTable('CNV')}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de décaissement */}
      <Dialog open={decaissementModalOpen} onOpenChange={setDecaissementModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Valider le décaissement
            </DialogTitle>
            <DialogDescription>
              Cette action va créer une sortie de caisse pour cette prime.
            </DialogDescription>
          </DialogHeader>

          {selectedPrime && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Source:</span>
                  <Badge variant="secondary">
                    {selectedPrime.source === 'OPS' ? 'Conteneurs (OPS)' : 'Conventionnel (CNV)'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Montant:</span>
                  <span className="font-semibold text-lg">{formatMontant(selectedPrime.montant)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="capitalize">{selectedPrime.type || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bénéficiaire:</span>
                  <span className="font-medium">{selectedPrime.beneficiaire || '-'}</span>
                </div>
                {selectedPrime.camion_plaque && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Camion:</span>
                    <span>{selectedPrime.camion_plaque}</span>
                  </div>
                )}
                {selectedPrime.parc && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Parc:</span>
                    <span>{selectedPrime.parc}</span>
                  </div>
                )}
                {selectedPrime.prestataire_nom && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Prestataire:</span>
                    <span>{selectedPrime.prestataire_nom}</span>
                  </div>
                )}
                {(selectedPrime.responsable_nom || selectedPrime.responsable) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Responsable:</span>
                    <span>{selectedPrime.responsable_nom || selectedPrime.responsable}</span>
                  </div>
                )}
                {selectedPrime.numero_paiement && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">N° Paiement:</span>
                    <span className="font-medium font-mono">{selectedPrime.numero_paiement}</span>
                  </div>
                )}
                {selectedPrime.reference_paiement && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Réf. Paiement:</span>
                    <span>{selectedPrime.reference_paiement}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select value={modePaiement} onValueChange={setModePaiement}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Espèces">Espèces</SelectItem>
                    <SelectItem value="Virement">Virement</SelectItem>
                    <SelectItem value="Chèque">Chèque</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Référence (optionnel)</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="N° chèque, référence virement..."
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes supplémentaires..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDecaissementModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleDecaissement}
              disabled={decaissementMutation.isPending}
              className="gap-2"
            >
              {decaissementMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Coins className="h-4 w-4" />
              )}
              Confirmer le décaissement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
