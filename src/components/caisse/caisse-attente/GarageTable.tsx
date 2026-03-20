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
  Wrench, CheckCircle2, Clock, AlertTriangle, RefreshCw, Wallet, ShoppingCart,
} from "lucide-react";
import { formatMontant } from "@/data/mockData";
import api from "@/lib/api";
import { TablePagination } from "@/components/TablePagination";
import { DocumentFilters, DocumentLoadingState } from "@/components/shared/documents";
import { DocumentStatCard } from "@/components/shared/documents";
import { itemVariants } from "./types";

interface GarageItem {
  id: number;
  type: string;
  type_key: string;
  numero: string | null;
  fournisseur_nom: string | null;
  date: string | null;
  montant: number;
  statut: string;
  designation: string | null;
  created_at: string;
  source: string;
}

interface GarageStatsResponse {
  total_en_attente: number;
  nombre_en_attente: number;
  total_valide: number;
  nombre_valide: number;
  message?: string;
  error?: string;
}

const statutOptions = [
  { value: "en_attente", label: "En attente de validation" },
  { value: "valide", label: "Validés" },
  { value: "all", label: "Tous" },
];

function GarageSubTable({ fournisseurFilter }: { fournisseurFilter: 'piston' | 'autres' }) {
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("en_attente");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const label = fournisseurFilter === 'piston' ? 'Piston Gabon' : 'Autres Fournisseurs';

  const { data: statsData } = useQuery({
    queryKey: ['caisse-garage-stats', fournisseurFilter],
    queryFn: async () => {
      const response = await api.get<GarageStatsResponse>('/caisse-garage/stats', {
        params: { fournisseur_filter: fournisseurFilter },
      });
      return response.data;
    },
  });

  const stats = statsData || { total_en_attente: 0, nombre_en_attente: 0, total_valide: 0, nombre_valide: 0 };

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

  const items: GarageItem[] = data?.data || [];
  const totalPages = data?.meta?.last_page || 1;
  const totalCount = data?.meta?.total || 0;
  const error = data?.error || data?.message;
  const hasFilters = !!search || statut !== 'en_attente';

  if (isLoading) {
    return <DocumentLoadingState message={`Chargement des achats ${label}...`} />;
  }

  return (
    <div className="space-y-4">
      {/* Stats mini */}
      <div className="grid gap-3 grid-cols-2">
        <DocumentStatCard
          title="En attente"
          value={formatMontant(stats.total_en_attente)}
          icon={Clock}
          subtitle={`${stats.nombre_en_attente} achats`}
          variant="warning"
          delay={0}
        />
        <DocumentStatCard
          title="Validés"
          value={formatMontant(stats.total_valide)}
          icon={CheckCircle2}
          subtitle={`${stats.nombre_valide} achats`}
          variant="success"
          delay={0.1}
        />
      </div>

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
        statutOptions={statutOptions}
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
                          <Button variant="link" onClick={() => { setSearch(""); setStatut("en_attente"); setPage(1); }} className="text-primary">
                            Réinitialiser les filtres
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
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
                        {item.fournisseur_nom || '-'}
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
                        {['validé', 'valide', 'validated'].includes(item.statut) ? (
                          <Badge className="bg-success/20 text-success gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Validé
                          </Badge>
                        ) : (
                          <Badge className="bg-warning/20 text-warning gap-1">
                            <Clock className="h-3 w-3" />
                            En attente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {['validé', 'valide', 'validated'].includes(item.statut) ? (
                          <span className="text-sm text-success flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Fait
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={async () => {
                              try {
                                await api.post(`/caisse-garage/${item.type_key}/${item.id}/valider`);
                                refetch();
                              } catch (e) {
                                console.error('Erreur validation:', e);
                              }
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Valider
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

export function GarageTable() {
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
        <GarageSubTable fournisseurFilter="piston" />
      </TabsContent>

      <TabsContent value="autres" className="mt-4">
        <GarageSubTable fournisseurFilter="autres" />
      </TabsContent>
    </Tabs>
  );
}
