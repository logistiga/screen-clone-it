import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Wrench, CheckCircle2, Clock, AlertTriangle, RefreshCw, Wallet,
  ShoppingCart, Coins, Ban, XCircle, Receipt, Hash,
} from "lucide-react";
import { formatMontant } from "@/data/mockData";
import api from "@/lib/api";
import { TablePagination } from "@/components/TablePagination";
import { DocumentFilters, DocumentLoadingState } from "@/components/shared/documents";
import { PrimeEnAttente, StatsResponse, statutFilterOptions, itemVariants } from "./types";

interface GarageTableProps {
  onDecaisser: (prime: PrimeEnAttente) => void;
  onRefuser: (prime: PrimeEnAttente) => void;
}

function GarageSubTable({ 
  fournisseurFilter, 
  onDecaisser, 
  onRefuser 
}: { 
  fournisseurFilter: 'piston' | 'autres';
  onDecaisser: (prime: PrimeEnAttente) => void;
  onRefuser: (prime: PrimeEnAttente) => void;
}) {
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("a_decaisser");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const label = fournisseurFilter === 'piston' ? 'Piston Gabon' : 'Autres Fournisseurs';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['caisse-garage', fournisseurFilter, page, pageSize, search, statut],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page, per_page: pageSize, statut, fournisseur_filter: fournisseurFilter,
      };
      if (search) params.search = search;
      const response = await api.get('/caisse-garage', { params });
      return response.data;
    },
  });

  const items = data?.data || [];
  const totalPages = data?.meta?.last_page || 1;
  const totalCount = data?.meta?.total || 0;
  const error = data?.error || data?.message;
  const hasFilters = !!search || statut !== 'a_decaisser';

  if (isLoading) {
    return <DocumentLoadingState message={`Chargement des achats ${label}...`} />;
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
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto gap-1">
              <RefreshCw className="h-3 w-3" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      <DocumentFilters
        searchTerm={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Rechercher (numéro, fournisseur, désignation)..."
        statutFilter={statut}
        onStatutChange={(v) => { setStatut(v); setPage(1); }}
        statutOptions={statutFilterOptions}
      />

      <Card className="border-border/50 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            {label}
            <Badge variant="secondary" className="ml-2">{totalCount}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/50">
                  <TableHead>Type</TableHead>
                  <TableHead>N°</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="h-8 w-8 opacity-50" />
                        <p>Aucun achat {label} trouvé</p>
                        {hasFilters && (
                          <Button variant="link" onClick={() => { setSearch(""); setStatut("a_decaisser"); setPage(1); }} className="text-primary">
                            Réinitialiser les filtres
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any, index: number) => (
                    <motion.tr
                      key={`${item.type_key}-${item.id}`}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.03 }}
                      className="group hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.numero || '-'}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate font-medium">
                        {item.fournisseur_nom || item.beneficiaire || '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {item.designation || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '-'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatMontant(item.montant)}
                      </TableCell>
                      <TableCell>
                        {item.decaisse ? (
                          <Badge className="bg-success/20 text-success gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Décaissé
                          </Badge>
                        ) : item.refusee ? (
                          <Badge className="bg-destructive/20 text-destructive gap-1">
                            <Ban className="h-3 w-3" />
                            Refusé
                          </Badge>
                        ) : (
                          <Badge className="bg-warning/20 text-warning gap-1">
                            <Clock className="h-3 w-3" />
                            À décaisser
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.decaisse ? (
                          <span className="text-sm text-success flex items-center justify-end gap-1">
                            <Receipt className="h-4 w-4" />
                            #{item.mouvement_id}
                          </span>
                        ) : item.refusee ? (
                          <span className="text-sm text-destructive flex items-center justify-end gap-1">
                            <Ban className="h-4 w-4" />
                            Ignoré
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" className="gap-1" onClick={() => onDecaisser({
                              id: item.id,
                              type: item.type,
                              beneficiaire: item.fournisseur_nom || item.beneficiaire,
                              montant: item.montant,
                              source: 'GARAGE' as const,
                              decaisse: false,
                              refusee: false,
                              mouvement_id: null,
                              date_decaissement: null,
                              mode_paiement_decaissement: null,
                              payee: true,
                              paiement_valide: true,
                              responsable: null,
                              reference_paiement: null,
                              numero_paiement: item.numero,
                              statut: null,
                              camion_plaque: null,
                              parc: null,
                              responsable_nom: null,
                              prestataire_nom: null,
                              created_at: item.created_at,
                            })}>
                              <Coins className="h-4 w-4" />
                              Décaisser
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => onRefuser({
                              id: item.id,
                              type: item.type,
                              beneficiaire: item.fournisseur_nom || item.beneficiaire,
                              montant: item.montant,
                              source: 'GARAGE' as const,
                              decaisse: false,
                              refusee: false,
                              mouvement_id: null,
                              date_decaissement: null,
                              mode_paiement_decaissement: null,
                              payee: true,
                              paiement_valide: true,
                              responsable: null,
                              reference_paiement: null,
                              numero_paiement: item.numero,
                              statut: null,
                              camion_plaque: null,
                              parc: null,
                              responsable_nom: null,
                              prestataire_nom: null,
                              created_at: item.created_at,
                            })}>
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

export function GarageTable({ onDecaisser, onRefuser }: GarageTableProps) {
  return (
    <Tabs defaultValue="piston" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="piston" className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Piston Gabon
        </TabsTrigger>
        <TabsTrigger value="autres" className="gap-2">
          <Wrench className="h-4 w-4" />
          Autres Fournisseurs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="piston" className="mt-4">
        <div><GarageSubTable fournisseurFilter="piston" onDecaisser={onDecaisser} onRefuser={onRefuser} /></div>
      </TabsContent>

      <TabsContent value="autres" className="mt-4">
        <div><GarageSubTable fournisseurFilter="autres" onDecaisser={onDecaisser} onRefuser={onRefuser} /></div>
      </TabsContent>
    </Tabs>
  );
}
