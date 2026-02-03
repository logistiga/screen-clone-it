import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Wallet, 
  Clock, 
  AlertCircle,
  Coins,
  User,
  FileText,
  Loader2
} from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";
import api from "@/lib/api";
import { TablePagination } from "@/components/TablePagination";
import {
  DocumentStatCard,
  DocumentFilters,
  DocumentEmptyState,
  DocumentLoadingState,
} from "@/components/shared/documents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Prime } from "@/types/partenaires";

const statutFilterOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "Payée", label: "Payée (en attente décaissement)" },
  { value: "Partiellement payée", label: "Partiellement payée" },
];

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

interface PrimeResponse {
  data: Prime[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export default function PrimesDecaissementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("Payée");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Modal de décaissement
  const [decaissementModalOpen, setDecaissementModalOpen] = useState(false);
  const [selectedPrime, setSelectedPrime] = useState<Prime | null>(null);
  const [modePaiement, setModePaiement] = useState("Espèces");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch primes payées (en attente de décaissement)
  const { data: primesData, isLoading, refetch } = useQuery({
    queryKey: ['primes-decaissement', currentPage, pageSize, searchTerm, statutFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: pageSize,
        statut: statutFilter === 'all' ? '' : statutFilter,
      };
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.get<PrimeResponse>('/primes', { params });
      return response.data;
    },
  });

  // Mutation pour valider le décaissement
  const decaissementMutation = useMutation({
    mutationFn: async (primeId: string | number) => {
      // On utilise l'endpoint payer pour créer la sortie de caisse
      const response = await api.post(`/primes/${primeId}/decaisser`, {
        mode_paiement: modePaiement,
        reference,
        notes,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Décaissement validé avec succès");
      queryClient.invalidateQueries({ queryKey: ['primes-decaissement'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-mouvements'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-solde'] });
      setDecaissementModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors du décaissement");
    },
  });

  const primes = primesData?.data || [];
  const totalPages = primesData?.meta?.last_page || 1;
  const totalItems = primesData?.meta?.total || 0;

  // Statistiques
  const totalMontant = primes.reduce((sum, p) => sum + p.montant, 0);
  const primesPayees = primes.filter(p => p.statut === 'Payée');
  const primesPartielles = primes.filter(p => p.statut === 'Partiellement payée');

  const hasFilters = !!searchTerm || statutFilter !== 'Payée';

  const clearFilters = () => {
    setSearchTerm("");
    setStatutFilter("Payée");
    setCurrentPage(1);
  };

  const resetForm = () => {
    setSelectedPrime(null);
    setModePaiement("Espèces");
    setReference("");
    setNotes("");
  };

  const openDecaissementModal = (prime: Prime) => {
    setSelectedPrime(prime);
    setDecaissementModalOpen(true);
  };

  const handleDecaissement = () => {
    if (!selectedPrime) return;
    decaissementMutation.mutate(selectedPrime.id);
  };

  if (isLoading) {
    return (
      <MainLayout title="Primes à décaisser">
        <DocumentLoadingState message="Chargement des primes..." />
      </MainLayout>
    );
  }

  // État vide
  if (primes.length === 0 && !hasFilters) {
    return (
      <MainLayout title="Primes à décaisser">
        <DocumentEmptyState
          icon={Coins}
          title="Aucune prime en attente de décaissement"
          description="Les primes marquées comme payées dans le module Partenaires apparaîtront ici pour validation du décaissement."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Primes à décaisser">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Primes à décaisser</h1>
            <p className="text-muted-foreground mt-1">Validez les décaissements des primes partenaires</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <DocumentStatCard
            title="Total à décaisser"
            value={formatMontant(totalMontant)}
            icon={Wallet}
            subtitle={`${totalItems} primes`}
            variant="primary"
            delay={0}
          />
          <DocumentStatCard
            title="Primes payées"
            value={primesPayees.length}
            icon={CheckCircle2}
            subtitle="en attente décaissement"
            variant="success"
            delay={0.1}
          />
          <DocumentStatCard
            title="Partiellement payées"
            value={primesPartielles.length}
            icon={Clock}
            subtitle="paiement partiel"
            variant="warning"
            delay={0.2}
          />
          <DocumentStatCard
            title="Montant total"
            value={formatMontant(primes.reduce((sum, p) => sum + (p.reste_a_payer || 0), 0))}
            icon={AlertCircle}
            subtitle="reste à décaisser"
            variant="danger"
            delay={0.3}
          />
        </div>

        {/* Filtres */}
        <DocumentFilters
          searchTerm={searchTerm}
          onSearchChange={(value) => { setSearchTerm(value); setCurrentPage(1); }}
          searchPlaceholder="Rechercher (représentant, facture)..."
          statutFilter={statutFilter}
          onStatutChange={(v) => { setStatutFilter(v); setCurrentPage(1); }}
          statutOptions={statutFilterOptions}
        />

        {/* Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Primes en attente de décaissement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Représentant</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {primes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Coins className="h-8 w-8 opacity-50" />
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
                        <TableCell className="text-muted-foreground">
                          {formatDate(prime.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {prime.representant_id ? `Rep. #${prime.representant_id}` : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {prime.facture ? (
                            <Badge variant="outline" className="gap-1">
                              <FileText className="h-3 w-3" />
                              {prime.facture.numero}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {prime.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              prime.statut === 'Payée' 
                                ? 'bg-success/20 text-success' 
                                : prime.statut === 'Partiellement payée'
                                ? 'bg-warning/20 text-warning'
                                : 'bg-muted text-muted-foreground'
                            }
                          >
                            {prime.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatMontant(prime.montant)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            className="gap-1"
                            onClick={() => openDecaissementModal(prime)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Décaisser
                          </Button>
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
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
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
              {/* Résumé de la prime */}
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Montant:</span>
                  <span className="font-semibold">{formatMontant(selectedPrime.montant)}</span>
                </div>
                {selectedPrime.facture && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Facture:</span>
                    <span>{selectedPrime.facture.numero}</span>
                  </div>
                )}
                {selectedPrime.description && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Description:</span>
                    <span className="truncate max-w-[200px]">{selectedPrime.description}</span>
                  </div>
                )}
              </div>

              {/* Mode de paiement */}
              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select value={modePaiement} onValueChange={setModePaiement}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Espèces">Espèces</SelectItem>
                    <SelectItem value="Virement">Virement</SelectItem>
                    <SelectItem value="Chèque">Chèque</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Référence */}
              <div className="space-y-2">
                <Label>Référence (optionnel)</Label>
                <Input 
                  value={reference} 
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="N° chèque, référence virement..."
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Commentaires..."
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
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Valider le décaissement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
