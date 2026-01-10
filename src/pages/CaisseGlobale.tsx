import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Download, ArrowUpCircle, ArrowDownCircle, Building2, Wallet, PieChart, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMontant, formatDate } from "@/data/mockData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMouvementsCaisse, useSoldeCaisse, usePaiements } from "@/hooks/use-commercial";
import { TablePagination } from "@/components/TablePagination";

export default function CaisseGlobalePage() {
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Charger tous les mouvements (caisse et banque)
  const { data: mouvementsData, isLoading: mouvementsLoading } = useMouvementsCaisse({
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    date_debut: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    date_fin: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    page: currentPage,
    per_page: pageSize,
  });

  // Charger les soldes
  const { data: soldeData } = useSoldeCaisse();

  // Charger les paiements pour les stats (tous les paiements)
  const { data: paiementsCaisseData } = usePaiements({ mode_paiement: 'Espèces', per_page: 1000 });
  const { data: paiementsBanqueData } = usePaiements({ per_page: 1000 });

  const mouvements = mouvementsData?.data || [];
  const totalPages = mouvementsData?.meta?.last_page || 1;
  const totalItems = mouvementsData?.meta?.total || 0;

  // Calcul des stats
  const soldeCaisse = soldeData?.solde || 0;
  const soldeBanques = soldeData?.solde_banques || 0;
  const soldeGlobal = soldeData?.solde_total || (soldeCaisse + soldeBanques);
  const totalEntrees = soldeData?.total_entrees || 0;
  const totalSorties = soldeData?.total_sorties || 0;

  // Stats par source (depuis les paiements)
  const paiementsCaisse = paiementsCaisseData?.data || [];
  const paiementsBanque = (paiementsBanqueData?.data || []).filter((p: any) => 
    p.mode_paiement === 'Virement' || p.mode_paiement === 'Chèque'
  );

  const totalEntreesCaisse = paiementsCaisse.reduce((sum: number, p: any) => sum + (p.montant || 0), 0);
  const totalEntreesBanque = paiementsBanque.reduce((sum: number, p: any) => sum + (p.montant || 0), 0);

  // Les sorties par source depuis les mouvements
  const sortiesCaisse = mouvements.filter((m: any) => m.type === 'sortie' && m.source === 'caisse');
  const sortiesBanque = mouvements.filter((m: any) => m.type === 'sortie' && m.source === 'banque');
  const totalSortiesCaisse = sortiesCaisse.reduce((sum: number, m: any) => sum + (m.montant || 0), 0);
  const totalSortiesBanque = sortiesBanque.reduce((sum: number, m: any) => sum + (m.montant || 0), 0);

  const handleExport = (format: 'pdf' | 'excel') => {
    toast({ title: `Export ${format.toUpperCase()}`, description: `Export des données comptables en cours...` });
  };

  const isLoading = mouvementsLoading;

  if (isLoading) {
    return (
      <MainLayout title="Caisse Globale">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des mouvements...</p>
        </div>
      </MainLayout>
    );
  }

  // État vide
  if (mouvements.length === 0 && sourceFilter === 'all' && !dateRange.from) {
    return (
      <MainLayout title="Caisse Globale">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PieChart className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucun mouvement</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Les mouvements de caisse et banque apparaîtront ici pour une vue globale de votre trésorerie.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Caisse Globale">
      <div className="space-y-6">
        {/* Stats principales */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-l-4 border-l-primary bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Solde Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{formatMontant(soldeGlobal)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Solde Caisse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(soldeCaisse)}</div>
              <p className="text-xs text-muted-foreground mt-1">Espèces</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Solde Banques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(soldeBanques)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-green-600" />
                Total Entrées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalEntrees)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-destructive" />
                Total Sorties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatMontant(totalSorties)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Détail par source */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-green-600" />
                Caisse (Espèces)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Entrées</p>
                  <p className="text-xl font-bold text-green-600">+{formatMontant(totalEntreesCaisse)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sorties</p>
                  <p className="text-xl font-bold text-destructive">-{formatMontant(totalSortiesCaisse)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
                Banques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Entrées</p>
                  <p className="text-xl font-bold text-green-600">+{formatMontant(totalEntreesBanque)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sorties</p>
                  <p className="text-xl font-bold text-destructive">-{formatMontant(totalSortiesBanque)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et Export */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>{format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}</>
                    ) : format(dateRange.from, "dd/MM/yyyy")
                  ) : "Période"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={dateRange} onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })} locale={fr} />
              </PopoverContent>
            </Popover>
            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                <SelectItem value="caisse">Caisse</SelectItem>
                <SelectItem value="banque">Banque</SelectItem>
              </SelectContent>
            </Select>
            {(dateRange.from || sourceFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setDateRange({ from: undefined, to: undefined }); setSourceFilter("all"); setCurrentPage(1); }}>
                Réinitialiser
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Table des mouvements */}
        <Card>
          <CardHeader>
            <CardTitle>Tous les mouvements comptables ({totalItems})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Client / Bénéficiaire</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mouvements.map((mouvement: any) => (
                  <TableRow key={mouvement.id}>
                    <TableCell>{formatDate(mouvement.date_mouvement || mouvement.date)}</TableCell>
                    <TableCell>
                      {mouvement.source === 'caisse' ? (
                        <Badge variant="secondary" className="gap-1"><Wallet className="h-3 w-3" />Caisse</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{mouvement.banque?.nom || 'Banque'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {mouvement.type === 'entree' ? (
                        <Badge className="bg-green-100 text-green-800 gap-1"><ArrowDownCircle className="h-3 w-3" />Entrée</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 gap-1"><ArrowUpCircle className="h-3 w-3" />Sortie</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{mouvement.categorie || '-'}</span>
                    </TableCell>
                    <TableCell>{mouvement.description}</TableCell>
                    <TableCell>{mouvement.client_nom || mouvement.beneficiaire || <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell className={`text-right font-medium ${mouvement.type === 'entree' ? 'text-green-600' : 'text-destructive'}`}>
                      {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
                    </TableCell>
                  </TableRow>
                ))}
                {mouvements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Aucun mouvement pour cette période
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
    </MainLayout>
  );
}
