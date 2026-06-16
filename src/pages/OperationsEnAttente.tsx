import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Activity, Check, X, RefreshCw, Search, AlertCircle } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { operationsEnAttenteApi, type OperationAttente } from "@/lib/api/operations-en-attente";
import { DocumentEmptyState } from "@/components/shared/documents";

function fmtMoney(n: number | null | undefined) {
  if (n == null) return "—";
  return `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; }
}

export default function OperationsEnAttentePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 400);
  const [confirmTarget, setConfirmTarget] = useState<OperationAttente | null>(null);
  const [ignoreTarget, setIgnoreTarget] = useState<OperationAttente | null>(null);

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ["operations-en-attente", debounced],
    queryFn: () => operationsEnAttenteApi.list({ search: debounced || undefined, per_page: 50 }),
  });

  const { data: stats } = useQuery({
    queryKey: ["operations-en-attente-stats"],
    queryFn: () => operationsEnAttenteApi.stats(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["operations-en-attente"] });
    qc.invalidateQueries({ queryKey: ["operations-en-attente-stats"] });
  };

  const confirmMut = useMutation({
    mutationFn: (id: string) => operationsEnAttenteApi.confirmer(id),
    onSuccess: (res) => {
      toast.success(`OT créé : ${res.ordre?.numero ?? ""}`);
      setConfirmTarget(null);
      invalidate();
      if (res.ordre?.id) navigate(`/ordres/${res.ordre.id}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Erreur lors de la confirmation"),
  });

  const ignoreMut = useMutation({
    mutationFn: (id: string) => operationsEnAttenteApi.ignorer(id),
    onSuccess: () => { toast.success("Opération ignorée"); setIgnoreTarget(null); invalidate(); },
    onError: () => toast.error("Erreur lors de l'opération"),
  });

  const rows = Array.isArray(data?.data) ? data!.data : [];
  const sourceError = data?.source_errors?.ops;

  return (
    <MainLayout title="Opérations en Attente">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">En attente</div>
            <div className="text-2xl font-bold">{stats?.en_attente ?? "—"}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Converties en OT</div>
            <div className="text-2xl font-bold text-green-600">{stats?.converties ?? "—"}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Ignorées</div>
            <div className="text-2xl font-bold text-muted-foreground">{stats?.ignorees ?? "—"}</div>
          </CardContent></Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-11"
              placeholder="Rechercher (client, référence, description...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />Actualiser
          </Button>
        </div>

        {sourceError && (
          <div className="flex items-start gap-3 p-4 rounded-md border border-destructive/30 bg-destructive/5 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <div className="font-medium text-destructive">Base OPS indisponible</div>
              <div className="text-muted-foreground">{sourceError}</div>
            </div>
          </div>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Chargement…</div>
            ) : rows.length === 0 ? (
              <DocumentEmptyState
                icon={Activity}
                title="Aucune opération en attente"
                description="Les opérations indépendantes provenant de la base OPS apparaîtront ici."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Réf. OPS</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant HT</TableHead>
                    <TableHead className="text-right w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="font-mono text-xs">{op.numero ?? op.id}</TableCell>
                      <TableCell>{op.type ? <Badge variant="secondary">{op.type}</Badge> : "—"}</TableCell>
                      <TableCell className="font-medium">{op.client_nom ?? "—"}</TableCell>
                      <TableCell className="max-w-[280px] truncate" title={op.description ?? ""}>
                        {op.description ?? (op.point_depart || op.point_arrivee
                          ? `${op.point_depart ?? "?"} → ${op.point_arrivee ?? "?"}` : "—")}
                      </TableCell>
                      <TableCell>{fmtDate(op.date_operation)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMoney(op.montant_ht)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="gap-1"
                            onClick={() => setConfirmTarget(op)}
                            disabled={confirmMut.isPending}>
                            <Check className="h-4 w-4" />Confirmer
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1"
                            onClick={() => setIgnoreTarget(op)}
                            disabled={ignoreMut.isPending}>
                            <X className="h-4 w-4" />Ignorer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation transfert */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transférer en OT ?</AlertDialogTitle>
            <AlertDialogDescription>
              Un nouvel Ordre de Travail (Opérations indépendantes) sera créé pour
              <strong> {confirmTarget?.client_nom ?? "ce client"}</strong>. L'opération
              n'apparaîtra plus dans cette liste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmTarget && confirmMut.mutate(confirmTarget.id)}>
              Confirmer et créer l'OT
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation ignore */}
      <AlertDialog open={!!ignoreTarget} onOpenChange={(o) => !o && setIgnoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ignorer cette opération ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle ne sera plus affichée dans la liste. Cette action peut être réactivée
              uniquement depuis la base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => ignoreTarget && ignoreMut.mutate(ignoreTarget.id)}>
              Ignorer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
