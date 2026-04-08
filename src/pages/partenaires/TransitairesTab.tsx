import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Edit, Trash2, Truck, Banknote, Users, UserCheck, UserX } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { TablePagination } from "@/components/TablePagination";
import { PartenaireAvatar, PartenaireCard, StatCard, PartenaireTableSkeleton, PartenaireGridSkeleton, StatCardSkeleton } from "@/components/partenaires";
import { PartenairesErrorCard } from "./PartenairesErrorCard";
import { cn } from "@/lib/utils";
import type { Transitaire } from "@/lib/api/commercial";

interface TransitairesTabProps {
  transitaires: Transitaire[];
  paginatedTransitaires: Transitaire[];
  filteredTransitaires: Transitaire[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  viewMode: "list" | "grid";
  transitairesActifs: number;
  primesTransitaires: number;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
  totalPages: number;
  onAdd: () => void;
  onDelete: (item: { id: string; nom: string; type: string }) => void;
}

export function TransitairesTab({
  transitaires, paginatedTransitaires, filteredTransitaires,
  isLoading, error, refetch, viewMode,
  transitairesActifs, primesTransitaires,
  page, setPage, pageSize, setPageSize, totalPages,
  onAdd, onDelete,
}: TransitairesTabProps) {
  const navigate = useNavigate();

  return (
    <div className="mt-6 space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatCard title="Total Transitaires" value={transitaires.length} icon={Users} variant="primary" />
            <StatCard title="Actifs" value={transitairesActifs} icon={UserCheck} variant="success" />
            <StatCard title="Inactifs" value={transitaires.length - transitairesActifs} icon={UserX} variant="muted" />
            <StatCard title="Primes à payer" value={formatMontant(primesTransitaires)} icon={Banknote} variant="warning" />
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button className="gap-2 shadow-sm" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Nouveau transitaire
        </Button>
      </div>

      {error && <PartenairesErrorCard error={error} onRetry={refetch} entityName="transitaires" />}

      {viewMode === "list" ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead>Nom</TableHead><TableHead className="text-right">Primes à payer</TableHead><TableHead>Statut</TableHead><TableHead className="w-32">Actions</TableHead></TableRow></TableHeader>
                <TableBody><PartenaireTableSkeleton rows={5} /></TableBody>
              </Table>
            ) : (
              <>
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Nom</TableHead><TableHead className="text-right">Primes à payer</TableHead><TableHead>Statut</TableHead><TableHead className="w-32">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {paginatedTransitaires.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground"><Truck className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>Aucun transitaire trouvé</p></TableCell></TableRow>
                    ) : (
                      paginatedTransitaires.map((t) => {
                        const primes = t.primes_dues || 0;
                        return (
                          <TableRow key={t.id} className="group hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/partenaires/transitaires/${t.id}`)}>
                                <PartenaireAvatar nom={t.nom} />
                                <span className="font-medium text-foreground group-hover:text-primary transition-colors">{t.nom}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {primes > 0 ? <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400">{formatMontant(primes)}</span> : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant={t.actif !== false ? "default" : "secondary"} className={cn(t.actif !== false && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30")}>
                                {t.actif !== false ? "Actif" : "Inactif"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" title="Voir" onClick={() => navigate(`/partenaires/transitaires/${t.id}`)}><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="Modifier"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" title="Supprimer" onClick={() => onDelete({ id: t.id, nom: t.nom, type: "Transitaire" })}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <TablePagination currentPage={page} totalPages={totalPages} pageSize={pageSize} totalItems={filteredTransitaires.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} pageSizeOptions={[10, 20, 50, 100, 200]} />
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {isLoading ? <PartenaireGridSkeleton count={6} /> : paginatedTransitaires.length === 0 ? (
            <Card className="py-12"><div className="text-center text-muted-foreground"><Truck className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>Aucun transitaire trouvé</p></div></Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedTransitaires.map((t) => (
                  <PartenaireCard key={t.id} id={t.id} nom={t.nom} email={t.email} telephone={t.telephone} adresse={t.adresse} actif={t.actif !== false} primesAPayer={t.primes_dues || 0} type="transitaire" onView={() => navigate(`/partenaires/transitaires/${t.id}`)} onDelete={() => onDelete({ id: t.id, nom: t.nom, type: "Transitaire" })} />
                ))}
              </div>
              <TablePagination currentPage={page} totalPages={totalPages} pageSize={pageSize} totalItems={filteredTransitaires.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} pageSizeOptions={[10, 20, 50, 100, 200]} />
            </>
          )}
        </>
      )}
    </div>
  );
}
