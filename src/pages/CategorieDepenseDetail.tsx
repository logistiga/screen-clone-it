import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft,
  Loader2,
  CalendarIcon,
  Tag,
  ArrowUpCircle,
  Building2,
  Wallet
} from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";
import { useCategorieDepense, useCategorieMouvements } from "@/hooks/use-commercial";
import { TablePagination } from "@/components/TablePagination";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function CategorieDepenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data: categorie, isLoading: categorieLoading } = useCategorieDepense(id || '');
  const { data: mouvementsData, isLoading: mouvementsLoading } = useCategorieMouvements(id || '', {
    date_debut: dateDebut ? format(dateDebut, 'yyyy-MM-dd') : undefined,
    date_fin: dateFin ? format(dateFin, 'yyyy-MM-dd') : undefined,
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    page: currentPage,
    per_page: pageSize,
  });

  const isLoading = categorieLoading || mouvementsLoading;
  const mouvements = mouvementsData?.data || [];
  const totalPages = mouvementsData?.meta?.last_page || 1;
  const totalItems = mouvementsData?.meta?.total || 0;

  // Stats filtrées
  const totalMontant = mouvements.reduce((sum: number, m: any) => sum + (m.montant || 0), 0);
  const nbCaisse = mouvements.filter((m: any) => m.source === 'caisse').length;
  const nbBanque = mouvements.filter((m: any) => m.source === 'banque').length;

  const clearFilters = () => {
    setDateDebut(undefined);
    setDateFin(undefined);
    setSourceFilter("all");
    setCurrentPage(1);
  };

  if (isLoading && !categorie) {
    return (
      <MainLayout title="Détail catégorie">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!categorie) {
    return (
      <MainLayout title="Catégorie introuvable">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tag className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Catégorie introuvable</h2>
          <Button onClick={() => navigate('/categories-depenses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux catégories
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Catégorie: ${categorie.nom}`}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/categories-depenses')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6 text-primary" />
              {categorie.nom}
            </h1>
            {categorie.description && (
              <p className="text-muted-foreground">{categorie.description}</p>
            )}
          </div>
          <Badge variant={categorie.type === 'Sortie' ? 'destructive' : 'default'} className="ml-auto">
            {categorie.type}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-primary transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-red-600" />
                Total dépensé (filtré)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatMontant(totalMontant)}</div>
              <p className="text-xs text-muted-foreground">{mouvements.length} mouvement(s)</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Sorties caisse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nbCaisse}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Sorties bancaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nbBanque}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sources</SelectItem>
              <SelectItem value="caisse">Caisse</SelectItem>
              <SelectItem value="banque">Banque</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full sm:w-48 justify-start text-left font-normal",
                  !dateDebut && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateDebut ? format(dateDebut, "dd/MM/yyyy", { locale: fr }) : "Date début"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                mode="single" 
                selected={dateDebut} 
                onSelect={setDateDebut}
                initialFocus 
                locale={fr}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full sm:w-48 justify-start text-left font-normal",
                  !dateFin && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFin ? format(dateFin, "dd/MM/yyyy", { locale: fr }) : "Date fin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                mode="single" 
                selected={dateFin} 
                onSelect={setDateFin}
                initialFocus 
                locale={fr}
              />
            </PopoverContent>
          </Popover>

          {(sourceFilter !== "all" || dateDebut || dateFin) && (
            <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
              Réinitialiser les filtres
            </Button>
          )}
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-red-600" />
              Dépenses de cette catégorie
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Banque</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mouvements.map((mouvement: any, index: number) => (
                  <TableRow 
                    key={mouvement.id}
                    className="transition-all duration-200 animate-fade-in hover:bg-muted/50"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell>{formatDate(mouvement.date || mouvement.created_at)}</TableCell>
                    <TableCell>
                      {mouvement.source === 'banque' ? (
                        <Badge variant="secondary" className="gap-1">
                          <Building2 className="h-3 w-3" />
                          Banque
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Wallet className="h-3 w-3" />
                          Caisse
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {mouvement.description}
                    </TableCell>
                    <TableCell>
                      {mouvement.beneficiaire || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {mouvement.banque?.nom ? (
                        <Badge variant="outline" className="gap-1">
                          <Building2 className="h-3 w-3" />
                          {mouvement.banque.nom}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      -{formatMontant(mouvement.montant)}
                    </TableCell>
                  </TableRow>
                ))}
                {mouvements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucune dépense trouvée pour cette catégorie
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
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </MainLayout>
  );
}
