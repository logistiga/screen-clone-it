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
  CheckCircle2, Wallet, Clock, Truck, Coins, Package, Loader2,
  RefreshCw, Receipt, Banknote, CalendarDays, Hash
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
  { value: "all", label: "Toutes les primes validées" },
  { value: "a_decaisser", label: "À décaisser" },
  { value: "decaisse", label: "Déjà décaissées" },
];

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

interface PrimeEnAttente {
  id: number;
  vehicule_id: number;
  chauffeur_id: number;
  numero_conteneur: string;
  numero_bl: string;
  nom_client: string;
  date_sortie: string;
  montant: number;
  statut: string;
  payee: boolean;
  paiement_valide: boolean;
  numero_paiement: string | null;
  date_paiement: string | null;
  reference_paiement: string | null;
  numero_camion: string | null;
  chauffeur_nom: string | null;
  chauffeur_prenom: string | null;
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

  // Fetch primes validées depuis OPS
  const { data: primesData, isLoading, refetch } = useQuery({
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

  const primes: PrimeEnAttente[] = primesData?.data || [];
  const totalPages = primesData?.meta?.last_page || 1;
  const totalItems = primesData?.meta?.total || 0;

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
        <DocumentLoadingState message="Chargement des primes validées..." />
      </MainLayout>
    );
  }

  if (primes.length === 0 && !hasFilters) {
    return (
      <MainLayout title="Caisse en attente">
        <DocumentEmptyState
          icon={Wallet}
          title="Aucune prime en attente"
          description="Les primes validées et payées depuis l'application TC apparaîtront ici pour le décaissement comptable."
        />
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
            <p className="text-muted-foreground mt-1">Primes validées depuis TC en attente de décaissement</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <DocumentStatCard
            title="Total validé"
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
            icon={Truck}
            subtitle="primes dans la liste"
            delay={0.3}
          />
        </div>

        {/* Filtres */}
        <DocumentFilters
          searchTerm={searchTerm}
          onSearchChange={(value) => { setSearchTerm(value); setCurrentPage(1); }}
          searchPlaceholder="Rechercher (camion, conteneur, BL, client, N° paiement)..."
          statutFilter={statutFilter}
          onStatutChange={(v) => { setStatutFilter(v); setCurrentPage(1); }}
          statutOptions={statutFilterOptions}
        />

        {/* Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Primes validées en attente de décaissement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead>N° Paiement</TableHead>
                    <TableHead>Date paiement</TableHead>
                    <TableHead>N° Camion</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Conteneur</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {primes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Wallet className="h-8 w-8 opacity-50" />
                          <p>Aucune prime trouvée</p>
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
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{prime.numero_camion || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {prime.chauffeur_nom
                            ? `${prime.chauffeur_nom} ${prime.chauffeur_prenom || ''}`.trim()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Package className="h-3 w-3" />
                            {prime.numero_conteneur || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {prime.nom_client || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {prime.reference_paiement || '-'}
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
                        <TableCell className="text-right font-semibold">
                          {formatMontant(prime.montant)}
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
              Cette action va créer une sortie de caisse pour cette prime validée.
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
                  <span className="text-sm text-muted-foreground">Camion:</span>
                  <span className="font-medium">{selectedPrime.numero_camion || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Chauffeur:</span>
                  <span>{selectedPrime.chauffeur_nom ? `${selectedPrime.chauffeur_nom} ${selectedPrime.chauffeur_prenom || ''}`.trim() : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Conteneur:</span>
                  <span>{selectedPrime.numero_conteneur || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Client:</span>
                  <span className="truncate max-w-[200px]">{selectedPrime.nom_client || '-'}</span>
                </div>
                {selectedPrime.reference_paiement && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Réf. paiement:</span>
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
