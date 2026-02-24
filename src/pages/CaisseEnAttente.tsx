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
import {
  CheckCircle2, Wallet, Clock, Coins, Loader2,
  RefreshCw, Receipt, Banknote, CalendarDays, Hash, AlertTriangle
} from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";
import api from "@/lib/api";
import { TablePagination } from "@/components/TablePagination";
import {
  DocumentStatCard, DocumentFilters, DocumentEmptyState, DocumentLoadingState,
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

interface PrimeEnAttente {
  id: number;
  sortie_conteneur_id: number | null;
  type: string | null;
  beneficiaire: string | null;
  numero_parc: string | null;
  responsable: string | null;
  montant: number;
  payee: boolean;
  paiement_valide: boolean;
  date_paiement: string | null;
  date_prime: string | null;
  reference_paiement: string | null;
  numero_paiement: string | null;
  statut: string;
  observations: string | null;
  created_at: string | null;
  decaisse: boolean;
  mouvement_id: number | null;
  date_decaissement: string | null;
  mode_paiement_decaissement: string | null;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("a_decaisser");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal de décaissement
  const [decaissementModalOpen, setDecaissementModalOpen] = useState(false);
  const [selectedPrime, setSelectedPrime] = useState<PrimeEnAttente | null>(null);
  const [modePaiement, setModePaiement] = useState("Espèces");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch primes payées depuis OPS
  const { data: primesData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['caisse-en-attente', currentPage, pageSize, searchTerm, statutFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: pageSize,
        statut: statutFilter,
      };
      if (searchTerm) params.search = searchTerm;
      const response = await api.get('/caisse-en-attente', { params });
      return response.data;
    },
  });

  // Fetch statistiques
  const { data: statsData } = useQuery({
    queryKey: ['caisse-en-attente-stats'],
    queryFn: async () => {
      const response = await api.get<StatsResponse>('/caisse-en-attente/stats');
      return response.data;
    },
  });

  // Mutation pour valider le décaissement
  const decaissementMutation = useMutation({
    mutationFn: async (primeId: number) => {
      const response = await api.post(`/caisse-en-attente/${primeId}/decaisser`, {
        mode_paiement: modePaiement,
        reference,
        notes,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Décaissement validé avec succès");
      queryClient.invalidateQueries({ queryKey: ['caisse-en-attente'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-en-attente-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-mouvements'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-solde'] });
      setDecaissementModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors du décaissement");
    },
  });

  // Sync manuelle
  const handleSync = async () => {
    toast.info("Synchronisation en cours...");
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['caisse-en-attente-stats'] });
    toast.success("Synchronisation terminée");
  };

  const primes: PrimeEnAttente[] = primesData?.data || [];
  const totalPages = primesData?.meta?.last_page || 1;
  const totalItems = primesData?.meta?.total || 0;
  const apiError = primesData?.error || primesData?.message;

  const stats = statsData || {
    total_valide: 0, nombre_primes: 0, total_a_decaisser: 0,
    nombre_a_decaisser: 0, deja_decaissees: 0, total_decaisse: 0,
  };

  const hasFilters = !!searchTerm || statutFilter !== 'a_decaisser';

  const clearFilters = () => {
    setSearchTerm("");
    setStatutFilter("a_decaisser");
    setCurrentPage(1);
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
    decaissementMutation.mutate(selectedPrime.id);
  };

  if (isLoading) {
    return (
      <MainLayout title="Caisse en attente">
        <DocumentLoadingState message="Chargement des primes payées..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Caisse en attente">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Caisse en attente</h1>
            <p className="text-muted-foreground mt-1">Primes payées depuis TC en attente de décaissement</p>
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

        {/* Erreur de connexion OPS */}
        {apiError && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="font-medium text-destructive">Problème de connexion OPS</p>
                <p className="text-sm text-muted-foreground">{apiError}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSync} className="ml-auto gap-1">
                <RefreshCw className="h-3 w-3" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
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

        {/* Filtres */}
        <DocumentFilters
          searchTerm={searchTerm}
          onSearchChange={(value) => { setSearchTerm(value); setCurrentPage(1); }}
          searchPlaceholder="Rechercher (bénéficiaire, N° paiement, référence, type)..."
          statutFilter={statutFilter}
          onStatutChange={(v) => { setStatutFilter(v); setCurrentPage(1); }}
          statutOptions={statutFilterOptions}
        />

        {/* Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Primes payées en attente de décaissement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead>N° Paiement</TableHead>
                    <TableHead>Date paiement</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>N° Parc</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Observations</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {primes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Wallet className="h-8 w-8 opacity-50" />
                          <p>Aucune prime payée trouvée</p>
                          {hasFilters && (
                            <Button variant="link" onClick={clearFilters} className="text-primary">
                              Réinitialiser les filtres
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    primes.map((prime, index) => (
                      <motion.tr
                        key={prime.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          {prime.numero_paiement ? (
                            <Badge variant="outline" className="gap-1 font-mono">
                              <Hash className="h-3 w-3" />
                              {prime.numero_paiement}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {prime.date_paiement ? formatDate(prime.date_paiement) : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {prime.type || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {prime.numero_parc || prime.beneficiaire || '-'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatMontant(prime.montant)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {prime.reference_paiement || '-'}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                          {prime.observations || '-'}
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
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => openDecaissementModal(prime)}
                            >
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

        {/* Pagination */}
        {totalPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        )}
      </div>

      {/* Modal de décaissement */}
      <Dialog open={decaissementModalOpen} onOpenChange={setDecaissementModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
                  <span className="text-sm text-muted-foreground">Montant:</span>
                  <span className="font-semibold text-lg">{formatMontant(selectedPrime.montant)}</span>
                </div>
                {selectedPrime.numero_paiement && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">N° Paiement:</span>
                    <span className="font-medium font-mono">{selectedPrime.numero_paiement}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="capitalize">{selectedPrime.type || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bénéficiaire:</span>
                  <span className="font-medium">{selectedPrime.beneficiaire || '-'}</span>
                </div>
                {selectedPrime.reference_paiement && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Réf. paiement:</span>
                    <span>{selectedPrime.reference_paiement}</span>
                  </div>
                )}
                {selectedPrime.observations && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Observations:</span>
                    <span className="truncate max-w-[200px]">{selectedPrime.observations}</span>
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
