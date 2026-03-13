import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Wallet, Clock, Coins, Hash,
  AlertTriangle, RefreshCw, Receipt, Ban, XCircle, Truck, FileText,
} from "lucide-react";
import { formatMontant } from "@/data/mockData";
import api from "@/lib/api";
import { TablePagination } from "@/components/TablePagination";
import { DocumentFilters, DocumentLoadingState } from "@/components/shared/documents";
import { PrimeEnAttente, statutFilterOptions, itemVariants } from "./types";

interface PrimesTableProps {
  source: 'OPS' | 'CNV' | 'HORSLBV';
  onDecaisser: (prime: PrimeEnAttente) => void;
  onRefuser: (prime: PrimeEnAttente) => void;
}

export function PrimesTable({ source, onDecaisser, onRefuser }: PrimesTableProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("a_decaisser");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const queryKeyMap = {
    OPS: ['caisse-en-attente', 'OPS', page, pageSize, search, statut],
    CNV: ['caisse-cnv', page, pageSize, search, statut],
    HORSLBV: ['caisse-horslbv', page, pageSize, search, statut],
  };
  const queryKey = queryKeyMap[source];

  const apiEndpointMap = {
    OPS: '/caisse-en-attente',
    CNV: '/caisse-cnv',
    HORSLBV: '/caisse-horslbv',
  };
  const apiEndpoint = apiEndpointMap[source];

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page, per_page: pageSize, statut,
      };
      if (source === 'OPS') params.source = 'OPS';
      if (search) params.search = search;
      const response = await api.get(apiEndpoint, { params });
      return response.data;
    },
  });

  const handleSync = async () => {
    await refetch();
  };

  const items: PrimeEnAttente[] = data?.data || [];
  const totalPages = data?.meta?.last_page || 1;
  const totalCount = data?.meta?.total || 0;
  const error = data?.error || data?.message;
  const hasFilters = !!search || statut !== 'a_decaisser';

  if (isLoading) {
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
        searchPlaceholder={
          source === 'OPS'
            ? "Rechercher (bénéficiaire, camion, parc, prestataire, type)..."
            : source === 'CNV'
            ? "Rechercher (bénéficiaire, N° paiement, conventionné, type)..."
            : "Rechercher (N° fiche, N° dépense, note)..."
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
            ) : source === 'CNV' ? (
              <FileText className="h-5 w-5 text-primary" />
            ) : (
              <Truck className="h-5 w-5 text-primary" />
            )}
            {source === 'OPS' ? 'Primes Conteneurs (OPS)' : source === 'CNV' ? 'Primes Conventionnel (CNV)' : 'Dépenses Hors Libreville'}
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
                  {source === 'OPS' && (
                    <>
                      <TableHead>Camion / Parc</TableHead>
                      <TableHead>Prestataire</TableHead>
                      <TableHead>Responsable</TableHead>
                    </>
                  )}
                  {source === 'CNV' && (
                    <>
                      <TableHead>N° Conventionné</TableHead>
                      <TableHead>Responsable</TableHead>
                    </>
                  )}
                  {source === 'HORSLBV' && (
                    <>
                      <TableHead>N° Fiche</TableHead>
                      <TableHead>N° Dépense</TableHead>
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
                    <TableCell colSpan={10} className="py-16 text-center text-muted-foreground">
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
                      {source === 'OPS' && (
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
                      )}
                      {source === 'CNV' && (
                        <>
                          <TableCell className="text-sm font-mono">
                            {prime.conventionne_numero || prime.numero_parc || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {prime.responsable_nom || prime.responsable || '-'}
                          </TableCell>
                        </>
                      )}
                      {source === 'HORSLBV' && (
                        <>
                          <TableCell className="text-sm font-mono">
                            {prime.numero_fiche || '-'}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {prime.numero_depense || '-'}
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
                        ) : prime.refusee ? (
                          <Badge className="bg-destructive/20 text-destructive gap-1">
                            <Ban className="h-3 w-3" />
                            Refusée
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
                        ) : prime.refusee ? (
                          <span className="text-sm text-destructive flex items-center justify-end gap-1">
                            <Ban className="h-4 w-4" />
                            Ignorée
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" className="gap-1" onClick={() => onDecaisser(prime)}>
                              <Coins className="h-4 w-4" />
                              Décaisser
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => onRefuser(prime)}>
                              <XCircle className="h-4 w-4" />
                              Refuser
                            </Button>
                          </div>
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

      {totalPages > 1 && (
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalCount}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      )}
    </div>
  );
}
