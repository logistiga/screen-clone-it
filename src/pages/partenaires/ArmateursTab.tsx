import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit, Ship, RefreshCw, Users, UserCheck, UserX } from "lucide-react";
import { TablePagination } from "@/components/TablePagination";
import { PartenaireAvatar, PartenaireCard, StatCard, PartenaireTableSkeleton, PartenaireGridSkeleton, StatCardSkeleton } from "@/components/partenaires";
import { PartenairesErrorCard } from "./PartenairesErrorCard";
import { cn } from "@/lib/utils";
import type { Armateur } from "@/lib/api/commercial";

interface ArmateursTabProps {
  armateurs: Armateur[];
  paginatedArmateurs: Armateur[];
  filteredArmateurs: Armateur[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  viewMode: "list" | "grid";
  armateursActifs: number;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
  totalPages: number;
  syncArmateursMutation: { mutate: () => void; isPending: boolean };
  editingTypeConteneur: { id: number | string; value: string } | null;
  setEditingTypeConteneur: (v: { id: number | string; value: string } | null) => void;
  updateTypeConteneur: { mutate: (v: { id: number | string; type_conteneur: string }) => void };
}

export function ArmateursTab({
  armateurs, paginatedArmateurs, filteredArmateurs,
  isLoading, error, refetch, viewMode,
  armateursActifs, page, setPage, pageSize, setPageSize, totalPages,
  syncArmateursMutation, editingTypeConteneur, setEditingTypeConteneur, updateTypeConteneur,
}: ArmateursTabProps) {
  const navigate = useNavigate();

  return (
    <div className="mt-6 space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatCard title="Total Armateurs" value={armateurs.length} icon={Ship} variant="primary" />
            <StatCard title="Actifs" value={armateursActifs} icon={UserCheck} variant="success" />
            <StatCard title="Inactifs" value={armateurs.length - armateursActifs} icon={UserX} variant="muted" />
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button className="gap-2 shadow-sm" onClick={() => syncArmateursMutation.mutate()} disabled={syncArmateursMutation.isPending}>
          <RefreshCw className={`h-4 w-4 ${syncArmateursMutation.isPending ? 'animate-spin' : ''}`} />
          {syncArmateursMutation.isPending ? 'Synchronisation...' : 'Synchroniser depuis OPS'}
        </Button>
      </div>

      {error && <PartenairesErrorCard error={error} onRetry={refetch} entityName="armateurs" />}

      {viewMode === "list" ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead>Code</TableHead><TableHead>Nom</TableHead><TableHead>Type de conteneur</TableHead><TableHead>Statut</TableHead><TableHead className="w-32">Actions</TableHead></TableRow></TableHeader>
                <TableBody><PartenaireTableSkeleton rows={5} /></TableBody>
              </Table>
            ) : (
              <>
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Code</TableHead><TableHead>Nom</TableHead><TableHead>Type de conteneur</TableHead><TableHead>Statut</TableHead><TableHead className="w-32">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {paginatedArmateurs.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><Ship className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>Aucun armateur trouvé</p></TableCell></TableRow>
                    ) : (
                      paginatedArmateurs.map((a) => (
                        <TableRow key={a.id} className="group hover:bg-muted/50">
                          <TableCell><span className="font-mono text-xs text-muted-foreground">{a.code || '—'}</span></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <PartenaireAvatar nom={a.nom} />
                              <span className="font-medium text-foreground">{a.nom}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingTypeConteneur?.id === a.id ? (
                              <Input
                                autoFocus className="h-7 text-xs w-40"
                                defaultValue={editingTypeConteneur.value}
                                onBlur={(e) => {
                                  const val = e.target.value.trim();
                                  if (val !== (a.type_conteneur || '')) updateTypeConteneur.mutate({ id: a.id, type_conteneur: val });
                                  setEditingTypeConteneur(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                  if (e.key === 'Escape') setEditingTypeConteneur(null);
                                }}
                                placeholder="Ex: 20', 40', 40'HC..."
                              />
                            ) : (
                              <div className="flex items-center gap-1 cursor-pointer group/type min-h-[28px] rounded px-1 -mx-1 hover:bg-muted" onClick={() => setEditingTypeConteneur({ id: a.id, value: a.type_conteneur || '' })} title="Cliquer pour modifier">
                                {a.type_conteneur ? <Badge variant="outline" className="text-xs">{a.type_conteneur}</Badge> : <span className="text-xs text-muted-foreground italic">Cliquer pour définir</span>}
                                <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover/type:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={a.actif !== false ? "default" : "secondary"} className={cn(a.actif !== false && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30")}>
                              {a.actif !== false ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" title="Voir" onClick={() => navigate(`/partenaires/armateurs/${a.id}`)}><Eye className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination currentPage={page} totalPages={totalPages} pageSize={pageSize} totalItems={filteredArmateurs.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {isLoading ? <PartenaireGridSkeleton count={6} /> : paginatedArmateurs.length === 0 ? (
            <Card className="py-12"><div className="text-center text-muted-foreground"><Ship className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>Aucun armateur trouvé</p></div></Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedArmateurs.map((a) => (
                  <PartenaireCard key={a.id} id={a.id} nom={a.nom} email={a.email} telephone={a.telephone} adresse={a.adresse} actif={a.actif !== false} type="armateur" onView={() => navigate(`/partenaires/armateurs/${a.id}`)} />
                ))}
              </div>
              <TablePagination currentPage={page} totalPages={totalPages} pageSize={pageSize} totalItems={filteredArmateurs.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
            </>
          )}
        </>
      )}
    </div>
  );
}
