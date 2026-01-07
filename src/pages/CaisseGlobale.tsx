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
import { CalendarIcon, Download, ArrowUpCircle, ArrowDownCircle, Building2, Wallet, PieChart, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMontant, formatDate } from "@/data/mockData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Mouvement {
  id: string;
  type: 'entree' | 'sortie';
  source: 'caisse' | 'banque';
  montant: number;
  date: string;
  description: string;
  clientNom: string;
  banqueNom: string;
}

export default function CaisseGlobalePage() {
  const { toast } = useToast();
  
  // Données en mémoire uniquement
  const [mouvements] = useState<Mouvement[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Filtrage
  const filteredMouvements = mouvements.filter(m => {
    const matchSource = sourceFilter === "all" || m.source === sourceFilter;
    let matchDate = true;
    if (dateRange.from) {
      const mDate = new Date(m.date);
      matchDate = mDate >= dateRange.from;
      if (dateRange.to) {
        matchDate = matchDate && mDate <= dateRange.to;
      }
    }
    return matchSource && matchDate;
  });

  // Stats
  const entreesCaisse = mouvements.filter(m => m.type === 'entree' && m.source === 'caisse');
  const entreesBanque = mouvements.filter(m => m.type === 'entree' && m.source === 'banque');
  const sortiesCaisse = mouvements.filter(m => m.type === 'sortie' && m.source === 'caisse');
  const sortiesBanque = mouvements.filter(m => m.type === 'sortie' && m.source === 'banque');

  const totalEntreesCaisse = entreesCaisse.reduce((sum, m) => sum + m.montant, 0);
  const totalEntreesBanque = entreesBanque.reduce((sum, m) => sum + m.montant, 0);
  const totalSortiesCaisse = sortiesCaisse.reduce((sum, m) => sum + m.montant, 0);
  const totalSortiesBanque = sortiesBanque.reduce((sum, m) => sum + m.montant, 0);

  const soldeCaisse = totalEntreesCaisse - totalSortiesCaisse;
  const soldeBanques = totalEntreesBanque - totalSortiesBanque;
  const soldeGlobal = soldeCaisse + soldeBanques;
  const totalEntrees = totalEntreesCaisse + totalEntreesBanque;
  const totalSorties = totalSortiesCaisse + totalSortiesBanque;

  const handleExport = (format: 'pdf' | 'excel') => {
    toast({ title: `Export ${format.toUpperCase()}`, description: `Export des données comptables en cours...` });
  };

  // État vide
  if (mouvements.length === 0) {
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
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
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
              <Button variant="ghost" size="sm" onClick={() => { setDateRange({ from: undefined, to: undefined }); setSourceFilter("all"); }}>
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
            <CardTitle>Tous les mouvements comptables</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMouvements.map((mouvement) => (
                  <TableRow key={mouvement.id}>
                    <TableCell>{formatDate(mouvement.date)}</TableCell>
                    <TableCell>
                      {mouvement.source === 'caisse' ? (
                        <Badge variant="secondary" className="gap-1"><Wallet className="h-3 w-3" />Caisse</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{mouvement.banqueNom || 'Banque'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {mouvement.type === 'entree' ? (
                        <Badge className="bg-green-100 text-green-800 gap-1"><ArrowDownCircle className="h-3 w-3" />Entrée</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 gap-1"><ArrowUpCircle className="h-3 w-3" />Sortie</Badge>
                      )}
                    </TableCell>
                    <TableCell>{mouvement.description}</TableCell>
                    <TableCell>{mouvement.clientNom || <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell className={`text-right font-medium ${mouvement.type === 'entree' ? 'text-green-600' : 'text-destructive'}`}>
                      {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMouvements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucun mouvement pour cette période
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
