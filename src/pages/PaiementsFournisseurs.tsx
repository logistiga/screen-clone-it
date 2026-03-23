import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Wallet, Plus, ArrowUpCircle, CheckCircle2, Clock, Loader2,
  Receipt, TrendingUp, Banknote, Eye,
} from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { toast } from "sonner";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { DocumentStatCard, DocumentFilters, DocumentLoadingState } from "@/components/shared/documents";
import { TablePagination } from "@/components/TablePagination";

interface PaiementFournisseur {
  id: number;
  fournisseur: string;
  reference: string;
  description: string | null;
  montant_total: number;
  date_facture: string;
  source: string | null;
  total_paye: number;
  reste: number;
  pourcentage: number;
  est_solde: boolean;
  nombre_tranches: number;
  created_at: string;
}

interface Tranche {
  id: number;
  montant: number;
  mode_paiement: string;
  reference: string | null;
  notes: string | null;
  date_paiement: string;
  numero_tranche: number;
  mouvement_id: number | null;
}

export default function PaiementsFournisseursPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAvanceModal, setShowAvanceModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPF, setSelectedPF] = useState<PaiementFournisseur | null>(null);

  // Liste des paiements fournisseurs
  const { data, isLoading } = useQuery({
    queryKey: ['paiements-fournisseurs', page, pageSize, search, statut],
    queryFn: async () => {
      const params: Record<string, any> = { page, per_page: pageSize, statut };
      if (search) params.search = search;
      const response = await api.get('/paiements-fournisseurs', { params });
      return response.data;
    },
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['paiements-fournisseurs-stats'],
    queryFn: async () => {
      const response = await api.get('/paiements-fournisseurs/stats');
      return response.data;
    },
  });

  const items: PaiementFournisseur[] = data?.data || [];
  const totalPages = data?.last_page || 1;
  const totalCount = data?.total || 0;

  const statutOptions = [
    { value: "all", label: "Toutes les factures" },
    { value: "en_cours", label: "En cours de paiement" },
    { value: "solde", label: "Soldées" },
  ];

  const openAvance = (pf: PaiementFournisseur) => {
    setSelectedPF(pf);
    setShowAvanceModal(true);
  };

  const openDetail = (pf: PaiementFournisseur) => {
    setSelectedPF(pf);
    setShowDetailModal(true);
  };

  return (
    <MainLayout title="Paiements Fournisseurs">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Paiements Fournisseurs</h1>
            <p className="text-muted-foreground mt-1">Suivi des paiements par tranche et avances</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <DocumentStatCard
            title="Total factures"
            value={stats?.total_factures || 0}
            icon={Receipt}
            subtitle={formatMontant(stats?.montant_total || 0)}
            variant="primary"
            delay={0}
          />
          <DocumentStatCard
            title="Total payé"
            value={formatMontant(stats?.total_paye || 0)}
            icon={CheckCircle2}
            subtitle={`${stats?.soldes || 0} factures soldées`}
            variant="success"
            delay={0.1}
          />
          <DocumentStatCard
            title="Reste à payer"
            value={formatMontant(stats?.reste_a_payer || 0)}
            icon={Clock}
            subtitle={`${stats?.en_cours || 0} en cours`}
            variant="warning"
            delay={0.2}
          />
          <DocumentStatCard
            title="Progression globale"
            value={stats?.montant_total > 0 ? `${Math.round((stats?.total_paye / stats?.montant_total) * 100)}%` : '0%'}
            icon={TrendingUp}
            subtitle="Taux de paiement"
            delay={0.3}
          />
        </div>

        {/* Filtres */}
        <DocumentFilters
          searchTerm={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Rechercher par fournisseur, référence..."
          statutFilter={statut}
          onStatutChange={(v) => { setStatut(v); setPage(1); }}
          statutOptions={statutOptions}
        />

        {/* Table */}
        {isLoading ? (
          <DocumentLoadingState message="Chargement des paiements fournisseurs..." />
        ) : (
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/50">
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Montant total</TableHead>
                      <TableHead>Payé</TableHead>
                      <TableHead>Reste</TableHead>
                      <TableHead>Progression</TableHead>
                      <TableHead>Tranches</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Wallet className="h-8 w-8 opacity-50" />
                            <p>Aucune facture fournisseur trouvée</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="group hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium max-w-[180px] truncate">
                            {item.fournisseur}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.reference}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatMontant(item.montant_total)}
                          </TableCell>
                          <TableCell className="text-success font-medium">
                            {formatMontant(item.total_paye)}
                          </TableCell>
                          <TableCell className={item.reste > 0 ? 'text-warning font-medium' : 'text-success'}>
                            {formatMontant(item.reste)}
                          </TableCell>
                          <TableCell className="min-w-[140px]">
                            <div className="space-y-1">
                              <Progress
                                value={item.pourcentage}
                                className="h-2"
                              />
                              <span className="text-xs text-muted-foreground">{item.pourcentage}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.nombre_tranches}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openDetail(item)} className="gap-1">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!item.est_solde && (
                                <Button size="sm" onClick={() => openAvance(item)} className="gap-1">
                                  <ArrowUpCircle className="h-4 w-4" />
                                  Avancer
                                </Button>
                              )}
                              {item.est_solde && (
                                <Badge className="bg-success/20 text-success gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Soldée
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

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

      {/* Modal Création */}
      <CreateFactureModal open={showCreateModal} onOpenChange={setShowCreateModal} />

      {/* Modal Avance */}
      <AvanceModal open={showAvanceModal} onOpenChange={setShowAvanceModal} pf={selectedPF} />

      {/* Modal Détail */}
      <DetailModal open={showDetailModal} onOpenChange={setShowDetailModal} pf={selectedPF} />
    </MainLayout>
  );
}

// ─── Modal Création Facture ───────────────────────
function CreateFactureModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    fournisseur: '', reference: '', description: '', montant_total: '', date_facture: new Date().toISOString().split('T')[0],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/paiements-fournisseurs', {
        ...form, montant_total: parseFloat(form.montant_total),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Facture fournisseur créée");
      queryClient.invalidateQueries({ queryKey: ['paiements-fournisseurs'] });
      queryClient.invalidateQueries({ queryKey: ['paiements-fournisseurs-stats'] });
      onOpenChange(false);
      setForm({ fournisseur: '', reference: '', description: '', montant_total: '', date_facture: new Date().toISOString().split('T')[0] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Nouvelle facture fournisseur
          </DialogTitle>
          <DialogDescription>Créez une facture à payer par tranches</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Fournisseur *</Label>
            <Input value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} placeholder="Nom du fournisseur" />
          </div>
          <div className="space-y-2">
            <Label>Référence facture *</Label>
            <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="N° facture" />
          </div>
          <div className="space-y-2">
            <Label>Montant total *</Label>
            <Input type="number" value={form.montant_total} onChange={(e) => setForm({ ...form, montant_total: e.target.value })} placeholder="0" min={1} />
          </div>
          <div className="space-y-2">
            <Label>Date facture *</Label>
            <Input type="date" value={form.date_facture} onChange={(e) => setForm({ ...form, date_facture: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.fournisseur || !form.reference || !form.montant_total} className="gap-2">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Avance ─────────────────────────────────
function AvanceModal({ open, onOpenChange, pf }: { open: boolean; onOpenChange: (v: boolean) => void; pf: PaiementFournisseur | null }) {
  const queryClient = useQueryClient();
  const [montant, setMontant] = useState("");
  const [modePaiement, setModePaiement] = useState("Espèces");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!pf) return;
      const response = await api.post(`/paiements-fournisseurs/${pf.id}/avancer`, {
        montant: parseFloat(montant), mode_paiement: modePaiement, reference, notes,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Avance de ${formatMontant(parseFloat(montant))} enregistrée. Reste: ${formatMontant(data?.reste || 0)}`);
      queryClient.invalidateQueries({ queryKey: ['paiements-fournisseurs'] });
      queryClient.invalidateQueries({ queryKey: ['paiements-fournisseurs-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-mouvements'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-solde'] });
      onOpenChange(false);
      setMontant(""); setReference(""); setNotes("");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  if (!pf) return null;

  const montantNum = parseFloat(montant) || 0;
  const resteApres = pf.reste - montantNum;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            Nouvelle avance
          </DialogTitle>
          <DialogDescription>{pf.fournisseur} - Réf: {pf.reference}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant total:</span>
              <span className="font-semibold">{formatMontant(pf.montant_total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Déjà payé:</span>
              <span className="text-success font-medium">{formatMontant(pf.total_paye)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reste à payer:</span>
              <span className="text-warning font-semibold">{formatMontant(pf.reste)}</span>
            </div>
            <Progress value={pf.pourcentage} className="h-2 mt-2" />
          </div>

          <div className="space-y-2">
            <Label>Montant de l'avance *</Label>
            <Input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} max={pf.reste} min={1} step={100} placeholder="0" />
            {montantNum > 0 && montantNum <= pf.reste && (
              <p className="text-xs text-muted-foreground">
                Reste après avance: <span className={resteApres <= 0 ? 'text-success font-medium' : 'text-warning font-medium'}>
                  {resteApres <= 0 ? 'Soldée ✓' : formatMontant(resteApres)}
                </span>
              </p>
            )}
            {montantNum > pf.reste && (
              <p className="text-xs text-destructive">Le montant dépasse le reste à payer</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Mode de paiement *</Label>
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
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° chèque, virement..." />
          </div>

          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || montantNum <= 0 || montantNum > pf.reste} className="gap-2">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            Avancer {montantNum > 0 ? formatMontant(montantNum) : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Détail ─────────────────────────────────
function DetailModal({ open, onOpenChange, pf }: { open: boolean; onOpenChange: (v: boolean) => void; pf: PaiementFournisseur | null }) {
  const { data: detail, isLoading } = useQuery({
    queryKey: ['paiement-fournisseur-detail', pf?.id],
    queryFn: async () => {
      if (!pf) return null;
      const response = await api.get(`/paiements-fournisseurs/${pf.id}`);
      return response.data;
    },
    enabled: open && !!pf,
  });

  if (!pf) return null;
  const tranches: Tranche[] = detail?.tranches || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {pf.fournisseur}
          </DialogTitle>
          <DialogDescription>Réf: {pf.reference} | {new Date(pf.date_facture).toLocaleDateString('fr-FR')}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Résumé */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant total:</span>
                <span className="font-bold text-lg">{formatMontant(detail?.montant_total || pf.montant_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total payé:</span>
                <span className="text-success font-semibold">{formatMontant(detail?.total_paye || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Reste:</span>
                <span className={`font-semibold ${(detail?.reste || 0) > 0 ? 'text-warning' : 'text-success'}`}>
                  {(detail?.reste || 0) <= 0 ? 'Soldée ✓' : formatMontant(detail?.reste || 0)}
                </span>
              </div>
              <Progress value={detail?.pourcentage || 0} className="h-3 mt-2" />
              <p className="text-center text-sm font-medium">{detail?.pourcentage || 0}%</p>
            </div>

            {/* Historique des tranches */}
            <div>
              <h3 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wider">Historique des paiements</h3>
              {tranches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement effectué</p>
              ) : (
                <div className="space-y-2">
                  {tranches.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">Avance #{t.numero_tranche}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.date_paiement).toLocaleDateString('fr-FR')} • {t.mode_paiement}
                          {t.reference && ` • ${t.reference}`}
                        </p>
                        {t.notes && <p className="text-xs text-muted-foreground mt-1">{t.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success">{formatMontant(t.montant)}</p>
                        {t.mouvement_id && (
                          <p className="text-xs text-muted-foreground">Caisse #{t.mouvement_id}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pf.description && (
              <div>
                <h3 className="font-medium mb-1 text-sm text-muted-foreground">Description</h3>
                <p className="text-sm">{pf.description}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
